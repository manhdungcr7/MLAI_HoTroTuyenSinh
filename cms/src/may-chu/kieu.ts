// Kiểu dữ liệu của API CMS, theo bảng "Hợp đồng API" trong docs/CMS-THIET-KE.md.
// Kiểu gốc (bản ghi, tiến độ, vai trò) lấy từ mã dùng chung để UI và Function không lệch nhau.
import type { BanGhiTruong, ThongTinTruong, TienDoTruong, VaiTro } from "@/data/dong-gop-kiem-tra";

export type { BanGhiTruong, ThongTinTruong, TienDoTruong, VaiTro };
export type NguonGui = "cms" | "agent";

/** Bản ghi như API trả về: thêm nguồn gửi và lý do từ chối (nếu có). */
export type ThongTinCms = ThongTinTruong & { nguonGui?: NguonGui; lyDoTuChoi?: string };

export interface Toi { email: string; vaiTro: VaiTro; truongDuocGiao: string[] }
export interface TruongTrongDanhSach { maTruong: string; ten?: string; kenh?: BanGhiTruong; tienDo: TienDoTruong }
export interface ChiTietTruongApi { kenh?: BanGhiTruong; thongTin: ThongTinCms[]; tienDo: TienDoTruong }
export interface TienDoApi { truong: TienDoTruong[]; tongDu: number; tong: number }
export interface NguoiCms { email: string; vaiTro: VaiTro; taoLuc: string }
export interface PhanCongCms { email: string; maTruong: string }
export interface NhatKyCms { id: number | string; ai: string; hanhDong: string; doiTuong: string; luc: string }
export interface KetQuaPhatHanh { luc: string; soTruong: number; soBanGhi: number }
export interface Trang<T> { muc: T[]; tong: number }

export type KenhBody = Partial<Omit<BanGhiTruong, "maTruong">>;
export interface TaoThongTinBody {
  maTruong: string; loai: ThongTinTruong["loai"]; nam?: number; linkNguon?: string; duLieu: unknown; trangThai?: "nhap" | "cho";
}
export interface SuaThongTinBody {
  phienBan: number; nam?: number; linkNguon?: string; duLieu?: unknown; trangThai?: ThongTinTruong["trangThai"];
  /** Lý do từ chối: gửi kèm khi qtv trả bản ghi về nháp. Hợp đồng chưa có ô này, xem báo cáo. */
  lyDo?: string;
}

/** Lỗi gọi API. `status` 0 = không tới được máy chủ. `chiTiet` là lỗi từng ô, khóa dạng `duLieu.mucThap`. */
export class LoiApi extends Error {
  constructor(public status: number, thongBao: string, public chiTiet?: Record<string, string>) {
    super(thongBao);
    this.name = "LoiApi";
  }
  get matMang() { return this.status === 0; }
}

export const SO_MOI_TRANG = 50;
