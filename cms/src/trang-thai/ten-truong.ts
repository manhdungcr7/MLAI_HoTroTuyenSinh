// Danh sách mã -> tên trường lấy từ máy chủ một lần cho cả phiên làm việc (tránh gọi lại ở mỗi màn).
import { layTatCaTruong, type TruongTrongDanhSach } from "@cms/may-chu/api";

let lanTai: Promise<TruongTrongDanhSach[]> | null = null;

export function layDanhSachTenTruong(): Promise<TruongTrongDanhSach[]> {
  if (!lanTai) lanTai = layTatCaTruong().catch((e: unknown) => { lanTai = null; throw e; });
  return lanTai;
}
