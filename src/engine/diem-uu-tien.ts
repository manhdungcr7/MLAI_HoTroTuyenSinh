// Điểm ưu tiên khu vực và đối tượng khi xét tuyển đại học theo điểm thi tốt nghiệp THPT (thang 30). TypeScript thuần, không React.
//
// Theo Quy chế tuyển sinh đại học của Bộ GD&ĐT (Thông tư 08/2022/TT-BGDĐT và các văn bản sửa đổi, bổ sung):
//  - Khu vực ưu tiên (theo nơi học THPT lâu nhất hoặc hộ khẩu): KV1 cộng 0,75; KV2-NT cộng 0,5; KV2 cộng 0,25; KV3 không cộng.
//  - Đối tượng ưu tiên: nhóm UT1 (đối tượng 01 đến 04) cộng 2,0; nhóm UT2 (đối tượng 05 đến 07) cộng 1,0.
//  - Thí sinh đạt tổng điểm từ 22,5 trở lên (thang 30): điểm ưu tiên giảm dần theo công thức
//        điểm ưu tiên = [(30 − tổng điểm đạt được) / 7,5] × mức điểm ưu tiên quy định
//    (tổng điểm đạt được là tổng ba môn cộng điểm khuyến khích nếu có, chưa gồm ưu tiên). Dưới 22,5 thì cộng đủ mức.
// Con số và công thức có thể được Bộ điều chỉnh theo từng năm; học sinh luôn đối chiếu với quy chế của năm xét tuyển.
// Chỉ áp dụng cho điểm thi THPT thang 30, không áp dụng cho điểm đánh giá năng lực hay thang điểm khác.

export type KhuVucUuTien = "KV1" | "KV2-NT" | "KV2" | "KV3";
export type DoiTuongUuTien = "khong" | "UT1" | "UT2";

export interface UuTienTuyenSinh { khuVuc: KhuVucUuTien | null; doiTuong: DoiTuongUuTien | null }

export const MUC_KHU_VUC: Record<KhuVucUuTien, number> = { KV1: 0.75, "KV2-NT": 0.5, KV2: 0.25, KV3: 0 };
export const MUC_DOI_TUONG: Record<DoiTuongUuTien, number> = { khong: 0, UT1: 2, UT2: 1 };
/** Từ mức tổng này trở lên thì điểm ưu tiên giảm dần. */
export const NGUONG_GIAM_DAN = 22.5;

export const TEN_KHU_VUC: Record<KhuVucUuTien, string> = {
  KV1: "KV1 (vùng núi, hải đảo, vùng đặc biệt khó khăn)",
  "KV2-NT": "KV2-NT (nông thôn, thị trấn)",
  KV2: "KV2 (thị xã, thành phố thuộc tỉnh, huyện ngoại thành)",
  KV3: "KV3 (quận nội thành thành phố trực thuộc trung ương)",
};
export const TEN_DOI_TUONG: Record<DoiTuongUuTien, string> = {
  khong: "Không thuộc đối tượng ưu tiên",
  UT1: "Nhóm UT1 (đối tượng 01 đến 04, ví dụ con liệt sĩ, người dân tộc thiểu số vùng khó khăn)",
  UT2: "Nhóm UT2 (đối tượng 05 đến 07, ví dụ con thương binh, người khuyết tật)",
};

const lam2 = (n: number) => Math.round(n * 100) / 100;

/** Mức điểm ưu tiên theo quy định (khu vực + đối tượng); chưa chọn thì tính 0. */
export function mucUuTien(u: UuTienTuyenSinh | null | undefined): number {
  if (!u) return 0;
  return lam2((u.khuVuc ? MUC_KHU_VUC[u.khuVuc] : 0) + (u.doiTuong ? MUC_DOI_TUONG[u.doiTuong] : 0));
}

/** Điểm ưu tiên thật sự được cộng cho tổng điểm `tong` (chưa gồm ưu tiên), với mức quy định `muc`. */
export function diemUuTien(tong: number, muc: number): number {
  if (!(muc > 0) || !Number.isFinite(tong)) return 0;
  if (tong >= 30) return 0;
  if (tong < NGUONG_GIAM_DAN) return lam2(muc);
  return lam2(Math.max(0, ((30 - tong) / 7.5) * muc));
}

/**
 * Tổng ba môn TỐI THIỂU cần có để sau khi cộng ưu tiên đạt `mucTieu` (điểm chuẩn). Không có ưu tiên thì bằng chính `mucTieu`.
 * Dùng khi tính "còn thiếu bao nhiêu điểm": em cần nâng điểm thi lên tới mức này, phần còn lại do ưu tiên bù.
 */
export function tongCanDatDeDen(mucTieu: number, muc: number): number {
  if (!(muc > 0)) return mucTieu;
  let thap = 0, cao = 30;
  if (30 + diemUuTien(30, muc) < mucTieu) return 30; // đã tối đa vẫn chưa đủ
  for (let i = 0; i < 40; i++) {
    const giua = (thap + cao) / 2;
    if (giua + diemUuTien(giua, muc) >= mucTieu) cao = giua; else thap = giua;
  }
  return lam2(Math.max(0, cao));
}

/** Tổng điểm đã cộng ưu tiên (tối đa 30). */
export function tongCoUuTien(tong: number, muc: number): number {
  return lam2(Math.min(30, tong + diemUuTien(tong, muc)));
}
