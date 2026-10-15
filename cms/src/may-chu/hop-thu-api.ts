// Lời gọi tới /api/hop-thu (cms/functions/api/hop-thu.ts): báo sai từ học sinh và đăng ký tình nguyện viên từ cộng đồng.
import { goiJson } from "./goi-chung";

export type TrangThaiBaoSai = "moi" | "xong" | "boQua";
export type TrangThaiTinhNguyen = "moi" | "da_lien_he" | "da_cap_quyen" | "tu_choi";

export interface BaoSai { id: string; maChuongTrinh: string; maTruong: string; truongDuLieu: string; noiDung: string; link?: string; trangThai: TrangThaiBaoSai; luc: string }
export interface DangKyTinhNguyen { id: string; hoTen: string; vaiTro: string; maTruong: string; lienHe: string; ghiChu: string; trangThai: TrangThaiTinhNguyen; luc: string }

export interface DangKySom { id: string; hoTen: string; lop: string; nhuCau: string; lienHe: string; luc: string }
export const layDangKySom = (trang = 1) => goiJson<{ dangKySom: DangKySom[]; tong: number }>("GET", "/hop-thu", { loai: "truy-cap-som", trang, moi: 50 });
export const layBaoSai = (trangThai?: TrangThaiBaoSai, trang = 1) => goiJson<{ baoSai: BaoSai[]; tong: number }>("GET", "/hop-thu", { loai: "bao-sai", trangThai, trang, moi: 50 });
export const layTinhNguyen = (trangThai?: TrangThaiTinhNguyen, trang = 1) => goiJson<{ dangKy: DangKyTinhNguyen[]; tong: number }>("GET", "/hop-thu", { loai: "tinh-nguyen", trangThai, trang, moi: 50 });
export const doiBaoSai = (id: string, trangThai: TrangThaiBaoSai) => goiJson<{ id: string }>("PATCH", "/hop-thu", {}, { loai: "bao-sai", id, trangThai });
export const doiTinhNguyen = (id: string, trangThai: Exclude<TrangThaiTinhNguyen, "da_cap_quyen">) => goiJson<{ id: string }>("PATCH", "/hop-thu", {}, { loai: "tinh-nguyen", id, trangThai });
export const capQuyenTinhNguyen = (id: string) => goiJson<{ email: string; maTruong: string; daCoTaiKhoan: boolean; matKhauTam?: string }>("POST", "/hop-thu", {}, { action: "CAP_QUYEN", id });
