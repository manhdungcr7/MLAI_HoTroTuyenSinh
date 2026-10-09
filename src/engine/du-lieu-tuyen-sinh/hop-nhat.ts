import type { LuaChon } from "@/state/types";
import type {
  SnapshotCongDong,
  SnapshotDiemChuanHieuChinh,
  SnapshotHocBong,
  SnapshotHocPhi,
  SnapshotThongBao,
  SnapshotTruong,
  SnapshotTuyenSinh,
} from "./kieu";

export interface TapDuLieuCmsSnapshot {
  schools: SnapshotTruong[];
  tuition: SnapshotHocPhi[];
  scholarships: SnapshotHocBong[];
  admissions: SnapshotTuyenSinh[];
  announcements: SnapshotThongBao[];
  cutoffScores: SnapshotDiemChuanHieuChinh[];
  /** Thông tin cộng đồng đã duyệt: nơi lưu trú, đánh giá, lưu ý. */
  community: SnapshotCongDong[];
}

export interface DuLieuTruongHopNhat {
  maTruong: string;
  tenTruong: string;
  websiteTuyenSinh?: string;
  fanpageUrl?: string;
  nhomZaloUrl?: string;
  nhomChinhThucUrl?: string;
  nhomCongDongUrl?: string;
  kyTucXa?: SnapshotTruong["kyTucXa"];
  /** Nguồn kiểm chứng của bản ghi trường. Không có nguồn thì không có kênh/ký túc xá nào được trả về. */
  nguonTruong?: SnapshotTruong["nguon"];
  hocPhiMoiNhat?: SnapshotHocPhi;
  hocBong: SnapshotHocBong[];
  thongBao: SnapshotThongBao[];
  /** Thông tin cộng đồng đã duyệt của trường (luôn hiển thị kèm nhãn chưa phải số liệu chính thức). */
  congDong: SnapshotCongDong[];
  cacNganh: LuaChon[];
}

/** Mỗi trường một bản học phí cấp trường (không gắn ngành), năm học mới nhất; cùng năm thì bản cập nhật sau thắng. */
function hocPhiCapTruongMoiNhat(ds: SnapshotHocPhi[], loc: (h: SnapshotHocPhi) => boolean = () => true): SnapshotHocPhi[] {
  const tot = new Map<string, SnapshotHocPhi>();
  for (const h of ds) {
    if (h.maNganh || !h.nguon?.url || !loc(h)) continue;
    const k = h.maTruong.toUpperCase();
    const cu = tot.get(k);
    if (!cu || h.nam > cu.nam || (h.nam === cu.nam && h.capNhatLuc >= cu.capNhatLuc)) tot.set(k, h);
  }
  return [...tot.values()];
}

/**
 * Hợp nhất Core LuaChon[] với Dynamic CMS Datasets
 * Tuân thủ quy tắc quyền sở hữu dữ liệu nghiêm ngặt.
 */
export function hopNhatLuaChonVaCms(
  coreLuaChon: LuaChon[],
  cmsData: Partial<TapDuLieuCmsSnapshot>,
): LuaChon[] {
  const mapHocPhi = new Map<string, SnapshotHocPhi>();
  for (const hp of cmsData.tuition || []) {
    mapHocPhi.set(hp.id, hp); // bản ghi mang đúng mã chương trình thì áp cho chương trình đó
    if (hp.maNganh) mapHocPhi.set(`${hp.maTruong}-${hp.maNganh}`, hp);
  }
  // Học phí cấp trường: chỉ loại tính theo năm (không quy đổi từ tín chỉ), lấy năm học mới nhất.
  const hocPhiCapTruong = new Map<string, SnapshotHocPhi>();
  const idChuongTrinh = new Set(coreLuaChon.map((l) => l.id));
  for (const hp of hocPhiCapTruongMoiNhat(cmsData.tuition || [], (h) => h.donVi === "trieu_nam" && !idChuongTrinh.has(h.id))) hocPhiCapTruong.set(hp.maTruong.toUpperCase(), hp);

  // Điểm chuẩn CMS chỉ ghi đè điểm THPT (thang 30). Mỗi chương trình lấy năm mới nhất; cùng năm có nhiều tổ hợp thì lấy điểm cao nhất (không làm học sinh tưởng dễ hơn thực tế).
  const mapDiemChuanHieuChinh = new Map<string, SnapshotDiemChuanHieuChinh>();
  for (const dc of cmsData.cutoffScores || []) {
    if (dc.phuongThuc !== "THPT" || !(dc.diemChuan >= 0 && dc.diemChuan <= 30)) continue;
    const cu = mapDiemChuanHieuChinh.get(dc.id);
    if (!cu || dc.nam > cu.nam || (dc.nam === cu.nam && dc.diemChuan > cu.diemChuan)) mapDiemChuanHieuChinh.set(dc.id, dc);
  }

  return coreLuaChon.map((item) => {
    let ketQua = { ...item };

    // 1. Ghi đè / bổ sung Học phí từ CMS nếu có
    // Học phí đúng chương trình thì luôn dùng. Học phí cấp trường chỉ để LẤP CHỖ TRỐNG, không đè số riêng của từng chương trình.
    const hpCms = mapHocPhi.get(item.id) || (item.hocPhiMin === undefined ? hocPhiCapTruong.get((item.maTruong ?? item.truong).toUpperCase()) : undefined);
    // Bản ghi chỉ lặp lại số đã có trong dữ liệu gốc (cùng nguồn, cùng mức thấp) thì không ghi đè: tránh kéo theo mức cao suy ra.
    const trungGoc = !!hpCms && ketQua.nguonHocPhi?.url === hpCms.nguon.url && ketQua.hocPhiMin === hpCms.mucThap;
    if (hpCms && !trungGoc) {
      ketQua = {
        ...ketQua,
        hocPhiMin: hpCms.mucThap,
        hocPhiMax: hpCms.mucCao,
        nguonHocPhi: {
          nam: String(hpCms.nam),
          url: hpCms.nguon.url,
          trang: 0, // 0 = nguồn CMS, không có số trang cụ thể
        },
      };
    }

    // 2. Hiệu chỉnh điểm chuẩn nếu CMS có bản ghi hiệu chỉnh đã duyệt
    const dcCms = mapDiemChuanHieuChinh.get(item.id);
    if (dcCms) {
      const diemTheoNamMoi = { ...(ketQua.diemTheoNam || {}), [String(dcCms.nam)]: dcCms.diemChuan };
      ketQua = {
        ...ketQua,
        diemTheoNam: diemTheoNamMoi,
        diemMin: dcCms.diemChuan,
        diemMax: dcCms.diemChuan,
        namDiem: dcCms.nam,
      };
    }

    return ketQua;
  });
}

/**
 * Tổng hợp thông tin trường chi tiết kèm học bổng, thông báo và kênh hỗ trợ
 */
export function layChiTietTruongHopNhat(
  maTruong: string,
  coreLuaChon: LuaChon[],
  cmsData: Partial<TapDuLieuCmsSnapshot>,
): DuLieuTruongHopNhat | null {
  // CMS và dữ liệu gốc gọi trường bằng MÃ (BKA); tên ngắn (ĐH Bách Khoa Hà Nội) chỉ là phương án dự phòng cho dữ liệu cũ.
  const cacNganh = coreLuaChon.filter((l) => (l.maTruong ?? l.truong) === maTruong || l.truong === maTruong);
  if (cacNganh.length === 0) return null;

  const tenTruong = cacNganh[0].tenTruong;
  const truongCms = (cmsData.schools || []).find((s) => s.maTruong === maTruong);
  // Thông tin trường (kênh liên hệ, ký túc xá) chỉ nhận khi có nguồn kiểm chứng; thiếu nguồn thì coi như chưa có.
  const schoolCms = truongCms?.nguon?.url ? truongCms : undefined;
  const hocPhi = hocPhiCapTruongMoiNhat((cmsData.tuition || []).filter((h) => h.maTruong.toUpperCase() === maTruong.toUpperCase() && !cacNganh.some((l) => l.id === h.id)))[0]; // chỉ học phí cấp trường; học phí ngành đã nằm trong từng chương trình
  const hocBong = (cmsData.scholarships || []).filter((h) => h.maTruong === maTruong && h.nguon?.url);
  const thongBao = (cmsData.announcements || []).filter((t) => (!t.maTruong || t.maTruong === maTruong) && t.nguon?.url);

  return {
    maTruong,
    tenTruong,
    websiteTuyenSinh: schoolCms?.websiteTuyenSinh,
    fanpageUrl: schoolCms?.fanpageUrl,
    nhomZaloUrl: schoolCms?.nhomZaloUrl,
    nhomChinhThucUrl: schoolCms?.nhomTuyenSinhChinhThucUrl,
    nhomCongDongUrl: schoolCms?.nhomCongDongUrl,
    kyTucXa: schoolCms?.kyTucXa,
    nguonTruong: schoolCms?.nguon,
    hocPhiMoiNhat: hocPhi,
    hocBong,
    thongBao,
    congDong: (cmsData.community || []).filter((c) => c.maTruong.toUpperCase() === maTruong.toUpperCase() && c.nguon?.url),
    cacNganh,
  };
}
