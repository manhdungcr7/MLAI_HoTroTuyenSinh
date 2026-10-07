// Chế độ dữ liệu của CMS. Mặc định LUÔN gọi máy chủ thật (/api/*, D1). Dữ liệu mẫu chỉ bật khi build/dev đặt VITE_GIA_LAP=1
// (ví dụ chạy `vite` thuần không có Pages Functions). Không có công tắc nào bật dữ liệu mẫu từ URL hay tên miền, để bản chạy thật không bao giờ rơi về dữ liệu giả.
import type { VaiTro } from "./kieu";
import { layTaiKhoanHienTai, chuyenDoiVaiTroNhanh } from "@cms/xac-thuc/phien-lam-viec";

export function dangDungDuLieuMau(): boolean {
  return import.meta.env?.VITE_GIA_LAP === "1";
}

export function vaiTroMau(): VaiTro {
  return layTaiKhoanHienTai().vaiTro;
}

export function chuyenDoiVaiTroMau(): VaiTro {
  const hienTai = layTaiKhoanHienTai().vaiTro;
  const moi = hienTai === "qtv" ? "ctv" : "qtv";
  chuyenDoiVaiTroNhanh(moi);
  return moi;
}
