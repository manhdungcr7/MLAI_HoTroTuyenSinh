// Lời gọi tới /api/xuat-ban-snapshot (chỉ quản trị viên). Khai báo theo cms/functions/api/xuat-ban-snapshot.ts.
import { goiJson } from "./goi-chung";

export interface PhienBanXuatBan {
  dataVersion: string;
  dangChay: boolean;
  publishedBy: string;
  publishedAt: string;
  totalRecords: number;
  changeSummary: string | null;
}
export interface TrangThaiXuatBan {
  soChoXuatBan: number;
  dangChay: { dataVersion: string; publishedBy: string; publishedAt: string; totalRecords: number; manifest: unknown } | null;
  lichSu: PhienBanXuatBan[];
  tong: number;
}
export interface KetQuaXuatBan {
  thanhCong?: boolean;
  thongBao?: string;
  dataVersion?: string;
  soBanGhiMoi?: number;
  tongBanGhiPublished?: number;
  activeVersion?: string;
  dongBoKv?: string;
}

const goi = <T>(phuong: "GET" | "POST", query: Record<string, number> = {}, body?: unknown) => goiJson<T>(phuong, "/xuat-ban-snapshot", query, body);

export const layTrangThaiXuatBan = (trang = 1) => goi<TrangThaiXuatBan>("GET", { trang, moi: 20 });
export const xuatBanNgay = () => goi<KetQuaXuatBan>("POST", {}, { action: "PUBLISH" });
export const quayVePhienBan = (targetVersion: string) => goi<KetQuaXuatBan>("POST", {}, { action: "ROLLBACK", targetVersion });
export const dongBoLaiKv = () => goi<KetQuaXuatBan>("POST", {}, { action: "DONG_BO_KV" });

// ---------- Telegram (chỉ quản trị viên): token nằm ở máy chủ, trình duyệt không bao giờ giữ ----------
export const layTrangThaiTelegram = () => goiJson<{ daCauHinh: boolean }>("GET", "/telegram");
export const guiTinThuTelegram = () => goiJson<{ thanhCong: boolean }>("POST", "/telegram", {}, {});
