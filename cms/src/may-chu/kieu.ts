// Kiểu dữ liệu của API CMS, theo bảng "Hợp đồng API" trong docs/CMS-THIET-KE.md.
// Kiểu gốc (bản ghi, tiến độ, vai trò) lấy từ mã dùng chung để UI và Function không lệch nhau.
import type { VaiTro } from "@/data/dong-gop-kiem-tra";

export type { VaiTro };

export interface Toi { email: string; vaiTro: VaiTro; truongDuocGiao: string[]; phaiDoiMatKhau?: boolean }
export interface NguoiCms { email: string; vaiTro: VaiTro; taoLuc: string; soTruong?: number }
/** Mật khẩu tạm chỉ có trong phản hồi tạo người hoặc đặt lại, một lần duy nhất. */
export interface NguoiMoiCms extends NguoiCms { matKhauTam: string }
export interface PhanCongCms { email: string; maTruong: string }
export interface NhatKyCms { id: number | string; ai: string; hanhDong: string; doiTuong: string; luc: string }
export interface Trang<T> { muc: T[]; tong: number }

export type MucDoThongBaoChung = "thongTin" | "canhBao" | "baoTri";

export interface ThongBaoChungHeThong {
  bat: boolean;
  noiDung: string;
  mucDo: MucDoThongBaoChung;
}

export interface LienHeHeThong {
  emailHoTro: string;
  dienThoai: string;
  donVi: string;
}

export interface CauHinhNghiepVuHeThong {
  namTuyenSinh: number;
  soNguyenVongToiDaGoiY: number;
  choPhepDangKySom: boolean;
  choPhepBaoSai: boolean;
}

export interface EmailGuiDiHeThong {
  tenHienThi: string;
  diaChiPhanHoi: string;
}

export interface CauHoiThuongGapMuc {
  cauHoi: string;
  traLoi: string;
}

export interface CaiDatHeThong {
  tenHeThong: string;
  thongBaoChung: ThongBaoChungHeThong;
  lienHe: LienHeHeThong;
  cauHinhNghiepVu: CauHinhNghiepVuHeThong;
  emailGuiDi: EmailGuiDiHeThong;
  cauHoiThuongGap: CauHoiThuongGapMuc[];
}

export interface PhanHoiCaiDatHeThong {
  caiDat: CaiDatHeThong;
  capNhatBoi: string | null;
  capNhatLuc: string | null;
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

