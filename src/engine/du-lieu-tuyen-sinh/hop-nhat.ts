import type { LuaChon } from "@/state/types";
import type {
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
}

export interface DuLieuTruongHopNhat {
  maTruong: string;
  tenTruong: string;
  websiteTuyenSinh?: string;
  fanpageUrl?: string;
  nhomZaloUrl?: string;
  kyTucXa?: SnapshotTruong["kyTucXa"];
  /** Nguồn kiểm chứng của bản ghi trường. Không có nguồn thì không có kênh/ký túc xá nào được trả về. */
  nguonTruong?: SnapshotTruong["nguon"];
  hocPhiMoiNhat?: SnapshotHocPhi;
  hocBong: SnapshotHocBong[];
  thongBao: SnapshotThongBao[];
  cacNganh: LuaChon[];
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
  (cmsData.tuition || []).forEach((hp) => {
    // ưu tiên mapping theo majorId nếu có, sau đó đến schoolId
    mapHocPhi.set(hp.id, hp);
    if (hp.maNganh) mapHocPhi.set(`${hp.maTruong}-${hp.maNganh}`, hp);
  });

  const mapDiemChuanHieuChinh = new Map<string, SnapshotDiemChuanHieuChinh>();
  (cmsData.cutoffScores || []).forEach((dc) => {
    mapDiemChuanHieuChinh.set(dc.id, dc);
    mapDiemChuanHieuChinh.set(`${dc.maTruong}-${dc.maNganh}`, dc);
  });

  return coreLuaChon.map((item) => {
    let ketQua = { ...item };

    // 1. Ghi đè / bổ sung Học phí từ CMS nếu có
    const hpCms = mapHocPhi.get(item.id) || mapHocPhi.get(item.truong);
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
    const dcCms = mapDiemChuanHieuChinh.get(item.id) || mapDiemChuanHieuChinh.get(`${item.truong}-${item.nganh}`);
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
  const cacNganh = coreLuaChon.filter((l) => l.truong === maTruong);
  if (cacNganh.length === 0) return null;

  const tenTruong = cacNganh[0].tenTruong;
  const truongCms = (cmsData.schools || []).find((s) => s.maTruong === maTruong);
  // Thông tin trường (kênh liên hệ, ký túc xá) chỉ nhận khi có nguồn kiểm chứng; thiếu nguồn thì coi như chưa có.
  const schoolCms = truongCms?.nguon?.url ? truongCms : undefined;
  const hocPhi = (cmsData.tuition || []).find((h) => h.maTruong === maTruong && h.id === maTruong && !h.maNganh); // chỉ học phí cấp trường; học phí ngành đã nằm trong từng chương trình
  const hocBong = (cmsData.scholarships || []).filter((h) => h.maTruong === maTruong && h.nguon?.url);
  const thongBao = (cmsData.announcements || []).filter((t) => (!t.maTruong || t.maTruong === maTruong) && t.nguon?.url);

  return {
    maTruong,
    tenTruong,
    websiteTuyenSinh: schoolCms?.websiteTuyenSinh,
    fanpageUrl: schoolCms?.fanpageUrl,
    nhomZaloUrl: schoolCms?.nhomZaloUrl,
    kyTucXa: schoolCms?.kyTucXa,
    nguonTruong: schoolCms?.nguon,
    hocPhiMoiNhat: hocPhi,
    hocBong,
    thongBao,
    cacNganh,
  };
}
