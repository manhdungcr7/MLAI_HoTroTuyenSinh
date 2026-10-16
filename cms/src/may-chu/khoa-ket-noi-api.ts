// Lời gọi tới /api/khoa-ket-noi: khóa kết nối cá nhân cho MCP đóng góp. Khóa gốc chỉ có trong phản hồi tạo, không lưu lại ở trình duyệt.
import { goiJson } from "./goi-chung";

export interface KhoaKetNoi {
  id: string;
  tienTo: string;
  taoLuc: string;
  hetHan: string;
  thuHoiLuc: string | null;
  lanDungCuoi: string | null;
  conHieuLuc: boolean;
}

export interface DanhSachKhoaKetNoi {
  khoa: KhoaKetNoi[];
  soKhoaConHieuLuc: number;
  toiDaKhoa: number;
  macDinhNgay: number;
}

export interface KhoaKetNoiMoi {
  id: string;
  tienTo: string;
  hetHan: string;
  khoa: string;
  luuY: string;
}

export const layKhoaKetNoi = () => goiJson<DanhSachKhoaKetNoi>("GET", "/khoa-ket-noi");
export const taoKhoaKetNoi = () => goiJson<KhoaKetNoiMoi>("POST", "/khoa-ket-noi", {}, {});
export const thuHoiKhoaKetNoi = (id: string) => goiJson<void>("DELETE", "/khoa-ket-noi", { id });
