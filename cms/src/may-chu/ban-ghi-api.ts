// Lời gọi tới /api/ban-ghi (quy trình DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED / REJECTED). Khai báo theo cms/functions/api/ban-ghi.ts.
// Lỗi luôn được nói thật: mã 400/401/403/404/409/413/429/500 đổi thành câu tiếng Việt; lỗi từng ô (chiTiet[]) được giữ lại.
import type { BanGhiCms, LoaiThucTheCms, MucDoQuanTrong, NguonKiemChung, TrangThaiCms } from "@/engine/du-lieu-tuyen-sinh/kieu";
import { SO_MOI_TRANG } from "./api";
import { goiJson } from "./goi-chung";

export type { BanGhiCms, LoaiThucTheCms, MucDoQuanTrong, NguonKiemChung, TrangThaiCms };

export interface NguonGui { url: string; tieuDe: string; donViCongBo: string; ngayCongBo?: string }
export interface LocBanGhi { entityType?: string; entityId?: string; truong?: string; status?: TrangThaiCms; createdBy?: string }
export interface TrangBanGhi { items: BanGhiCms[]; tong: number }

const goi = <T>(phuong: "GET" | "POST" | "PUT" | "PATCH", query: Record<string, string | number | undefined>, body?: unknown) => goiJson<T>(phuong, "/ban-ghi", query, body);

export const layTrangBanGhi = (trang: number, loc: LocBanGhi = {}) => goi<TrangBanGhi>("GET", { ...loc, trang, moi: SO_MOI_TRANG });
export const layMotBanGhi = (id: string) => goi<BanGhiCms>("GET", { id });

/** Lấy hết các trang (tối đa 20 trang x 50 bản ghi). `daCatBot` = true khi còn nhiều hơn thế. */
export async function layHetBanGhi(loc: LocBanGhi = {}): Promise<{ ds: BanGhiCms[]; daCatBot: boolean; tong: number }> {
  const ds: BanGhiCms[] = [];
  let tong = 0;
  for (let t = 1; t <= 20; t++) {
    const r = await layTrangBanGhi(t, loc);
    tong = r.tong;
    ds.push(...r.items);
    if (r.items.length < SO_MOI_TRANG || ds.length >= r.tong) return { ds, daCatBot: false, tong };
  }
  return { ds, daCatBot: ds.length < tong, tong };
}

export interface TaoBanGhiBody { entityType: LoaiThucTheCms | string; entityId: string; data: Record<string, unknown>; source: NguonGui; changeNote: string; importance?: MucDoQuanTrong }
export const taoBanGhi = (b: TaoBanGhiBody) => goi<BanGhiCms>("POST", {}, { action: "CREATE", ...b });
export const taoBanSuaDoi = (currentId: string, duLieuMoi: Record<string, unknown>, sourceMoi: NguonGui, changeNote: string) =>
  goi<BanGhiCms>("POST", {}, { action: "CREATE_MODIFICATION", currentId, duLieuMoi, sourceMoi, changeNote });
export const suaBanNhap = (id: string, data: Record<string, unknown>, source: NguonGui, changeNote: string) =>
  goi<BanGhiCms>("PUT", {}, { id, data, source, changeNote });
export const doiTrangThai = (id: string, status: "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED", rejectionReason?: string) =>
  goi<BanGhiCms>("PATCH", {}, { id, status, ...(rejectionReason !== undefined && { rejectionReason }) });
