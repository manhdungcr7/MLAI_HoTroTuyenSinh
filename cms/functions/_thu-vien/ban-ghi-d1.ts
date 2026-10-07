// Dùng chung cho /api/ban-ghi và /api/xuat-ban-snapshot: ánh xạ hàng D1 <-> BanGhiCms, kiểm tra đầu vào phía máy chủ, câu lệnh ghi và nhật ký kiểm toán.
import type { BanGhiCms, LoaiThucTheCms, MucDoQuanTrong, NguonKiemChung, TrangThaiCms } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import type { KhoD1, KhoD1Cau } from "./kieu";
import { sai } from "./phan-hoi";

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
}

export function mapTuD1(h: HangBanGhiD1): BanGhiCms {
  return {
    id: h.id, entityType: h.entity_type, entityId: h.entity_id, version: h.version, status: h.status, data: JSON.parse(h.data_json),
    source: { url: h.source_url, tieuDe: h.source_title, donViCongBo: h.source_publisher, ngayCongBo: h.source_published_at ?? undefined, ngayKiemChung: h.source_verified_at },
    importance: h.importance, changeNote: h.change_note, rejectionReason: h.rejection_reason ?? undefined, previousVersionId: h.previous_version_id ?? undefined,
    createdBy: h.created_by, createdAt: h.created_at, updatedBy: h.updated_by, updatedAt: h.updated_at,
    submittedBy: h.submitted_by ?? undefined, submittedAt: h.submitted_at ?? undefined, reviewedBy: h.reviewed_by ?? undefined, reviewedAt: h.reviewed_at ?? undefined,
    publishedBy: h.published_by ?? undefined, publishedAt: h.published_at ?? undefined,
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
export function kiemTraData(data: unknown, entityId: string): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw sai("data phải là một đối tượng JSON", "data");
  const chu = JSON.stringify(data);
  if (chu.length > DO_DAI_DATA_TOI_DA) throw sai(`data quá dài (tối đa ${DO_DAI_DATA_TOI_DA} ký tự)`, "data");
  const d = data as Record<string, unknown>;
  if (d.maTruong !== undefined && (typeof d.maTruong !== "string" || d.maTruong.toUpperCase() !== maTruongCua(entityId))) throw sai("data.maTruong không khớp mã trường trong entityId", "data.maTruong");
  return d;
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
