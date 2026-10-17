// Dùng chung cho /api/ban-ghi và /api/xuat-ban-snapshot: ánh xạ hàng D1 <-> BanGhiCms, kiểm tra đầu vào phía máy chủ, câu lệnh ghi và nhật ký kiểm toán.
import type { BanGhiCms, LoaiThucTheCms, MucDoQuanTrong, NguonKiemChung, TrangThaiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import type { KhoD1, KhoD1Cau } from "./kieu";
import { sai } from "./phan-hoi";
import { nguonChiNoiDiemSan } from "../../../src/engine/du-lieu-tuyen-sinh/kiem-tra-diem";

export const LOAI_THUC_THE: readonly LoaiThucTheCms[] = ["school", "tuition", "scholarship", "admission", "cutoff_score", "announcement", "deadline", "contact", "noi_luu_tru", "review", "luu_y"];
export const MUC_DO: readonly MucDoQuanTrong[] = ["normal", "important", "critical"];
export const TRANG_THAI_CMS: readonly TrangThaiCms[] = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED", "SUPERSEDED"];
export const DO_DAI_DATA_TOI_DA = 24_000;

export interface HangBanGhiD1 {
  id: string; entity_type: LoaiThucTheCms; entity_id: string; version: number; status: TrangThaiCms; data_json: string;
  source_url: string; source_title: string; source_publisher: string; source_published_at: string | null; source_verified_at: string;
  importance: MucDoQuanTrong; change_note: string; rejection_reason: string | null; previous_version_id: string | null;
  created_by: string; created_at: string; updated_by: string; updated_at: string;
  submitted_by: string | null; submitted_at: string | null; reviewed_by: string | null; reviewed_at: string | null;
  published_by: string | null; published_at: string | null;
  /** Migration 0010: dấu "nhập qua AI" (JSON), chỉ có ở bản ghi do MCP đóng góp gửi vào. */
  nhap_qua_ai?: string | null;
}

/** Dấu nguồn gốc của bản ghi nhập qua AI (MCP). Không đi vào bản chụp công khai: snapshot chỉ đọc data_json. */
export interface NhapQuaAI {
  nhapQuaAI: true;
  via: "mcp";
  khoaId: string;
  email: string;
  nguon: { loai: string; url: string; trang: string; trichDan: string };
  chenhLon: boolean;
  diemCu?: number;
}

export function mapTuD1(h: HangBanGhiD1): BanGhiCms & { nhapQuaAI?: NhapQuaAI } {
  return {
    id: h.id, entityType: h.entity_type, entityId: h.entity_id, version: h.version, status: h.status, data: JSON.parse(h.data_json),
    source: { url: h.source_url, tieuDe: h.source_title, donViCongBo: h.source_publisher, ngayCongBo: h.source_published_at ?? undefined, ngayKiemChung: h.source_verified_at },
    importance: h.importance, changeNote: h.change_note, rejectionReason: h.rejection_reason ?? undefined, previousVersionId: h.previous_version_id ?? undefined,
    createdBy: h.created_by, createdAt: h.created_at, updatedBy: h.updated_by, updatedAt: h.updated_at,
    submittedBy: h.submitted_by ?? undefined, submittedAt: h.submitted_at ?? undefined, reviewedBy: h.reviewed_by ?? undefined, reviewedAt: h.reviewed_at ?? undefined,
    publishedBy: h.published_by ?? undefined, publishedAt: h.published_at ?? undefined,
    ...(h.nhap_qua_ai ? { nhapQuaAI: JSON.parse(h.nhap_qua_ai) as NhapQuaAI } : {}),
  };
}

/** Mã trường của một thực thể: phần trước dấu "-" đầu tiên của entityId, viết hoa (BKA, BKA-7480201 -> BKA). */
export const maTruongCua = (entityId: string) => entityId.split("-")[0].toUpperCase();

const KHOP_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export function kiemTraEntity(loai: unknown, id: unknown): { entityType: LoaiThucTheCms; entityId: string } {
  if (typeof loai !== "string" || !(LOAI_THUC_THE as readonly string[]).includes(loai)) throw sai(`entityType phải là một trong: ${LOAI_THUC_THE.join(", ")}`, "entityType");
  if (typeof id !== "string" || !KHOP_ID.test(id)) throw sai("entityId chỉ gồm chữ, số, dấu chấm, gạch ngang, gạch dưới (tối đa 64 ký tự)", "entityId");
  return { entityType: loai as LoaiThucTheCms, entityId: id };
}

export function kiemTraMucDo(v: unknown, macDinh: MucDoQuanTrong = "normal"): MucDoQuanTrong {
  if (v === undefined || v === null || v === "") return macDinh;
  if (typeof v !== "string" || !(MUC_DO as readonly string[]).includes(v)) throw sai("importance phải là normal, important hoặc critical", "importance");
  return v as MucDoQuanTrong;
}

export function kiemTraGhiChu(v: unknown, macDinh: string): string {
  if (v === undefined || v === null || v === "") return macDinh;
  if (typeof v !== "string" || v.length > 500) throw sai("changeNote phải là chuỗi tối đa 500 ký tự", "changeNote");
  return v.trim() || macDinh;
}

const laNgay = (s: string) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?$/.test(s) && !Number.isNaN(Date.parse(s));

/** Nguồn bắt buộc có link http(s) thật. ngayKiemChung và nguoiKiemChung do máy chủ đặt, bỏ giá trị client gửi. */
export function kiemTraNguon(raw: unknown, email: string, luc: string): NguonKiemChung {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw sai("Thiếu nguồn kiểm chứng (source)", "source");
  const n = raw as Record<string, unknown>;
  let url: URL;
  try { url = new URL(typeof n.url === "string" ? n.url.trim() : ""); } catch { throw sai("Link nguồn (source.url) phải là đường dẫn http/https hợp lệ", "source.url"); }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".") || url.href.length > 500) throw sai("Link nguồn (source.url) phải là đường dẫn http/https hợp lệ, tối đa 500 ký tự", "source.url");
  const tieuDe = typeof n.tieuDe === "string" ? n.tieuDe.trim() : "";
  if (tieuDe.length < 3 || tieuDe.length > 300) throw sai("Tiêu đề nguồn (source.tieuDe) cần 3 đến 300 ký tự", "source.tieuDe");
  const donVi = typeof n.donViCongBo === "string" ? n.donViCongBo.trim() : "";
  if (donVi.length < 2 || donVi.length > 200) throw sai("Đơn vị công bố (source.donViCongBo) cần 2 đến 200 ký tự", "source.donViCongBo");
  const out: NguonKiemChung = { url: url.href, tieuDe, donViCongBo: donVi, ngayKiemChung: luc, nguoiKiemChung: email };
  if (n.ngayCongBo !== undefined && n.ngayCongBo !== null && n.ngayCongBo !== "") {
    if (typeof n.ngayCongBo !== "string" || !laNgay(n.ngayCongBo)) throw sai("Ngày công bố (source.ngayCongBo) phải dạng YYYY-MM-DD", "source.ngayCongBo");
    out.ngayCongBo = n.ngayCongBo;
  }
  return out;
}

/** data phải là đối tượng thường; maTruong trong data (nếu có) phải khớp mã trường suy ra từ entityId. */
export function kiemTraData(data: unknown, entityId: string, entityType?: string): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw sai("data phải là một đối tượng JSON", "data");
  const chu = JSON.stringify(data);
  if (chu.length > DO_DAI_DATA_TOI_DA) throw sai(`data quá dài (tối đa ${DO_DAI_DATA_TOI_DA} ký tự)`, "data");
  const d = data as Record<string, unknown>;
  if (d.maTruong !== undefined && (typeof d.maTruong !== "string" || d.maTruong.toUpperCase() !== maTruongCua(entityId))) throw sai("data.maTruong không khớp mã trường trong entityId", "data.maTruong");
  if (entityType === "noi_luu_tru" || entityType === "luu_y") kiemTraNoiDungTheoLoai(entityType, d);
  if (entityType === "cutoff_score") {
    if (d.loaiDiem !== "diem_chuan") throw sai("Chỉ nhập điểm trúng tuyển đã công bố; điểm sàn, dự kiến hoặc chưa rõ loại không phải điểm chuẩn", "data.loaiDiem");
    if (typeof d.id !== "string" || maTruongCua(d.id) !== maTruongCua(entityId)) throw sai("Chương trình không thuộc trường trong entityId", "data.id");
    if (typeof d.nam !== "number" || !Number.isInteger(d.nam) || d.nam < 2000 || d.nam > 2100) throw sai("Năm điểm chuẩn phải là số nguyên từ 2000 đến 2100", "data.nam");
    if (typeof d.phuongThuc !== "string" || !d.phuongThuc.trim()) throw sai("Thiếu phương thức xét tuyển", "data.phuongThuc");
    if (typeof d.toHop !== "string" || !/^[A-Z0-9]{1,20}$/.test(d.toHop)) throw sai("Tổ hợp phải là mã, TATCA hoặc KHONG", "data.toHop");
    if (d.phuongThuc === "THPT" && d.thangDiem !== 30) throw sai("Chỉ hỗ trợ điểm thi THPT thang 30; thang khác cần quy tắc riêng", "data.thangDiem");
    if (d.thangDiem !== undefined && (typeof d.thangDiem !== "number" || !Number.isFinite(d.thangDiem) || d.thangDiem <= 0)) throw sai("Thang điểm phải là số dương", "data.thangDiem");
    if (typeof d.diemChuan !== "number" || !Number.isFinite(d.diemChuan) || d.diemChuan < 0 || (typeof d.thangDiem === "number" && d.diemChuan > d.thangDiem)) throw sai("Điểm chuẩn phải là số hữu hạn trong thang điểm công bố", "data.diemChuan");
  }
  return d;
}

/** Chặn nhầm nguồn điểm sàn ở cả tạo, sửa, duyệt và xuất bản; URL không tự chứng minh số liệu. */
export function kiemTraNguonDiemChuan(entityType: string, source: NguonKiemChung): void {
  if (entityType === "cutoff_score" && nguonChiNoiDiemSan(source.tieuDe)) {
    throw sai("Nguồn này mô tả điểm sàn nhận hồ sơ. Cần thông báo điểm trúng tuyển đúng năm và phương thức", "source.tieuDe");
  }
}

const chuToiDa = (d: Record<string, unknown>, k: string, toiDa: number, batBuoc: boolean, nhan: string) => {
  const v = d[k];
  if (v === undefined || v === null || v === "") { if (batBuoc) throw sai(`${nhan} là bắt buộc`, `data.${k}`); return; }
  if (typeof v !== "string") throw sai(`${nhan} phải là chuỗi`, `data.${k}`);
  const dai = v.trim().length;
  if (dai > toiDa || (batBuoc && dai < 3)) throw sai(`${nhan} cần ${batBuoc ? "3" : "0"} đến ${toiDa} ký tự`, `data.${k}`);
};
const chonMot = (d: Record<string, unknown>, k: string, tap: readonly string[], batBuoc: boolean, nhan: string) => {
  const v = d[k];
  if (v === undefined || v === null || v === "") { if (batBuoc) throw sai(`${nhan} là bắt buộc`, `data.${k}`); return; }
  if (typeof v !== "string" || !tap.includes(v)) throw sai(`${nhan} phải là một trong: ${tap.join(", ")}`, `data.${k}`);
};
const khoangSo = (d: Record<string, unknown>, k: string, nhan: string) => {
  const v = d[k];
  if (v === undefined || v === null) return;
  if (!Array.isArray(v) || v.length !== 2 || v.some((x) => typeof x !== "number" || !Number.isFinite(x) || x < 0 || x > 100_000) || v[0] > v[1]) throw sai(`${nhan} phải là [thấp, cao] từ 0 đến 100000, thấp không lớn hơn cao`, `data.${k}`);
};

/** Kiểu và độ dài các trường nội dung của nơi lưu trú và lưu ý, kiểm ở máy chủ (không tin biểu mẫu ở trình duyệt). */
export function kiemTraNoiDungTheoLoai(loai: "noi_luu_tru" | "luu_y", d: Record<string, unknown>): void {
  if (loai === "luu_y") {
    chuToiDa(d, "tieuDe", 120, true, "Tiêu đề");
    chuToiDa(d, "noiDung", 600, true, "Nội dung");
    return;
  }
  chonMot(d, "coKyTucXa", ["co", "khong", "chua_ro"], true, "Ký túc xá");
  chonMot(d, "khuTroXungQuanh", ["nhieu", "it", "khong", "chua_ro"], true, "Khu trọ xung quanh");
  khoangSo(d, "giaKyTucThang", "Giá ký túc xá");
  khoangSo(d, "giaTroThang", "Giá trọ");
  const km = d.khoangCachKm;
  if (km !== undefined && km !== null && (typeof km !== "number" || !Number.isFinite(km) || km < 0 || km > 500)) throw sai("Khoảng cách phải là số từ 0 đến 500", "data.khoangCachKm");
  chuToiDa(d, "ghiChu", 300, false, "Ghi chú");
}

export const cauChenBanGhi = (d1: KhoD1, b: BanGhiCms): KhoD1Cau =>
  d1.prepare(
    `INSERT INTO ban_ghi_cms (id, entity_type, entity_id, version, status, data_json, source_url, source_title, source_publisher, source_published_at, source_verified_at,
       importance, change_note, previous_version_id, created_by, created_at, updated_by, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    b.id, b.entityType, b.entityId, b.version, b.status, JSON.stringify(b.data), b.source.url, b.source.tieuDe, b.source.donViCongBo, b.source.ngayCongBo ?? null, b.source.ngayKiemChung,
    b.importance, b.changeNote, b.previousVersionId ?? null, b.createdBy, b.createdAt, b.updatedBy, b.updatedAt,
  );

export interface MucKiemToan { email: string; hanhDong: string; entityType: string; entityId: string; version: number; ghiChu?: string; luc: string }

/** Ghi nhật ký kiểm toán. `chiKhiCoThayDoi` = chỉ ghi nếu câu lệnh ngay trước trong cùng batch đã thay đổi dòng (thao tác thua cuộc đua thì không có log). */
export const cauKiemToan = (d1: KhoD1, m: MucKiemToan, chiKhiCoThayDoi = false): KhoD1Cau =>
  d1.prepare(
    `INSERT INTO nhat_ky_kiem_toan (actor_id, actor_email, action, entity_type, entity_id, version, note, timestamp)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?${chiKhiCoThayDoi ? " WHERE changes() > 0" : ""}`,
  ).bind(m.email, m.email, m.hanhDong, m.entityType, m.entityId, m.version, m.ghiChu ?? null, m.luc);

export const daThayDoi = (r: { meta?: { changes?: number } } | undefined) => (r?.meta?.changes ?? 0) > 0;
