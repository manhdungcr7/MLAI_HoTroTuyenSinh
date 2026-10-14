// Hàm thuần (không React) cho luồng Khởi đầu: đọc điểm, kiểm tra bước 1, tổ hợp tự tính, gợi ý học phí.
import { mucUuTien } from "@/engine/diem-uu-tien";
import { tongDiem } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { TEN_MON_NGAN, TO_HOP, type HoSo, type MaToHop, type MonId } from "@/state/types";

// ---------- Đọc điểm ----------
export type KetQuaDiem =
  | { loai: "trong" }
  | { loai: "hopLe"; gia: number }
  | { loai: "khongPhaiSo" }
  | { loai: "ngoaiKhoang" };

/** Đọc chữ em gõ thành điểm. Chấp nhận dấu phẩy "7,5" và dấu chấm "7.5". */
export function docDiem(chu: string): KetQuaDiem {
  const t = chu.trim().replace(",", ".");
  if (t === "") return { loai: "trong" };
  // "7." hoặc "7," khi em đang gõ dở vẫn coi là 7.
  if (!/^\d{1,2}(\.\d{0,2})?$/.test(t)) return { loai: "khongPhaiSo" };
  const so = Number(t);
  if (Number.isNaN(so)) return { loai: "khongPhaiSo" };
  if (so < 0 || so > 10) return { loai: "ngoaiKhoang" };
  return { loai: "hopLe", gia: Math.round(so * 100) / 100 };
}

export const LOI_DIEM: Record<"khongPhaiSo" | "ngoaiKhoang", string> = {
  khongPhaiSo: "Em nhập số nhé, ví dụ 7,5",
  ngoaiKhoang: "Điểm từ 0 đến 10 nhé",
};

/** Hiện điểm theo kiểu Việt: 7.5 → "7,5". */
export const vietDiem = (so: number | null) => (so === null ? "" : String(so).replace(".", ","));

// ---------- Kiểm tra bước 1 ----------
export type TruongBatBuoc = "khoi" | "tinh" | "nganhQuanTam";
export const THU_TU_BAT_BUOC: TruongBatBuoc[] = ["khoi", "tinh", "nganhQuanTam"];

/** Các trường bắt buộc còn thiếu, theo thứ tự trên màn. Trả về lời nhắc dễ hiểu cho từng trường. */
export function kiemTraBuoc1(h: HoSo): Partial<Record<TruongBatBuoc, string>> {
  const loi: Partial<Record<TruongBatBuoc, string>> = {};
  if (!h.khoi) loi.khoi = "Bạn chọn đang học lớp 10–11, lớp 12 hay đã tốt nghiệp.";
  if (!h.tinh) loi.tinh = "Bạn chọn tỉnh/thành phố đang sống.";
  if (!h.nganhQuanTam.length) loi.nganhQuanTam = "Bạn chọn ít nhất một nhóm ngành quan tâm.";
  return loi;
}

// ---------- Tổ hợp tự tính ----------
export interface KetQuaToHop { ma: MaToHop; mon: MonId[]; tong: number | null; thieu: MonId[] }

/** Tổng điểm các tổ hợp. Tổ hợp còn thiếu môn trả tong = null (không coi môn thiếu là 0). */
export function tinhCacToHop(diem: Record<MonId, number | null>): KetQuaToHop[] {
  return (Object.keys(TO_HOP) as MaToHop[]).map((ma) => {
    const mon = TO_HOP[ma];
    const thieu = mon.filter((m) => diem[m] === null);
    return { ma, mon, thieu, tong: thieu.length ? null : tongDiem(diem, mon) };
  });
}

/**
 * Tổ hợp cao nhất khi tính đủ như Khám phá: 73 tổ hợp chính thức (gồm cả Sử, Địa, Tin...) và đã cộng điểm ưu tiên.
 * Dùng để báo em con số thật sẽ dùng khi so với điểm chuẩn. null khi chưa đủ 3 môn của tổ hợp nào.
 */
export function toHopCaoNhatDayDu(
  diem: Record<MonId, number | null>, diemThem: HoSo["diemThem"], uuTienTuyenSinh: HoSo["uuTienTuyenSinh"],
): { toHop: string; tong: number; uuTienCong: number } | null {
  const muc = mucUuTien(uuTienTuyenSinh);
  const t = tongChoLuaChon({ toHopXet: [] }, { ...diem, ...(diemThem ?? {}), ...(muc > 0 ? { uuTien: muc } : {}) });
  return t.tong === null || t.toHop === null ? null : { toHop: t.toHop, tong: t.tong, uuTienCong: t.uuTienCong ?? 0 };
}

export const tenMonCuaToHop = (mon: MonId[]) => mon.map((m) => TEN_MON_NGAN[m]).join(" – ");

// ---------- Gợi ý học phí theo ngân sách ----------
export type MucNganSach = NonNullable<HoSo["nganSach"]>;
export const KHOANG_NGAN_SACH: Record<MucNganSach, { tu: number; den: number | null; nhan: string }> = {
  duoi30: { tu: 0, den: 30, nhan: "Dưới 30 triệu" },
  "30-60": { tu: 30, den: 60, nhan: "30 – 60 triệu" },
  "60-100": { tu: 60, den: 100, nhan: "60 – 100 triệu" },
  tren100: { tu: 100, den: null, nhan: "Trên 100 triệu" },
};

export interface GoiYHocPhi { khoang: string; ghiChu: string | null }

/**
 * Câu gợi ý mức học phí nên ưu tiên. Chỉ dựa trên mức em chọn, không tự đặt thêm số.
 * Ở trọ / ký túc xá thì nhắc chừa phần cho tiền ở và ăn uống.
 */
export function goiYHocPhi(nganSach: HoSo["nganSach"], choO: HoSo["choO"]): GoiYHocPhi | null {
  if (!nganSach) return null;
  const k = KHOANG_NGAN_SACH[nganSach];
  const khoang = k.den === null ? `từ ${k.tu} triệu đồng/năm trở lên` : k.tu === 0 ? `dưới ${k.den} triệu đồng/năm` : `${k.tu}–${k.den} triệu đồng/năm`;
  const ghiChu = choO === "oTro" || choO === "kyTucXa"
    ? `Em dự định ${choO === "oTro" ? "ở trọ" : "ở ký túc xá"}, nên chọn trường ở nửa dưới khoảng này để còn tiền ở và ăn uống.`
    : null;
  return { khoang, ghiChu };
}

/** Số lựa chọn mà học phí cao nhất vẫn không vượt mức ngân sách (dùng với dữ liệu mẫu). */
export function demVuaNganSach(nganSach: MucNganSach, ds: { hocPhiMax?: number }[]): number {
  const den = KHOANG_NGAN_SACH[nganSach].den;
  return ds.filter((l) => den === null || (typeof l.hocPhiMax === "number" && l.hocPhiMax <= den)).length;
}

// ---------- Kết quả ngay sau khi tạo hồ sơ ----------
export interface NhomCoHoi { nhom: string; duDiem: number; thuSuc: number }
export interface KetQuaBanDau {
  /** Em có đủ điểm 3 môn của ít nhất một tổ hợp để so với điểm chuẩn. */
  coDiem: boolean;
  toHop: string | null;
  tong: number | null;
  soDuDiem: number;
  soThuSuc: number;
  /** Các nhóm ngành em chọn ở Bước 1, giữ thứ tự em chọn; nhóm chưa có ngành nào trong tầm thì số là 0. */
  nhomQuanTam: NhomCoHoi[];
}

/** Gom "cơ hội của em" (tính ở Khám phá) thành kết quả ngắn cho màn sau khi tạo hồ sơ. Không tự đặt thêm số. */
export function ketQuaBanDau(
  coHoi: { tong: number; toHop: string; soDuDiem: number; soThuSuc: number; theoNhom: NhomCoHoi[] } | null,
  nganhQuanTam: string[],
): KetQuaBanDau {
  if (!coHoi) return { coDiem: false, toHop: null, tong: null, soDuDiem: 0, soThuSuc: 0, nhomQuanTam: [] };
  const nhomQuanTam = nganhQuanTam.map((n) => coHoi.theoNhom.find((g) => g.nhom === n) ?? { nhom: n, duDiem: 0, thuSuc: 0 });
  return { coDiem: true, toHop: coHoi.toHop, tong: coHoi.tong, soDuDiem: coHoi.soDuDiem, soThuSuc: coHoi.soThuSuc, nhomQuanTam };
}
