// Danh sách mã -> tên trường. Dùng đúng tệp mà máy chủ dùng để kiểm mã trường (cms/functions/_thu-vien/tap-truong.json),
// nên giao diện và máy chủ không bao giờ lệch nhau về trường nào hợp lệ.
import tapTruong from "../../functions/_thu-vien/tap-truong.json";

export interface TruongCoTen { maTruong: string; ten: string }

const DANH_SACH: readonly TruongCoTen[] = Object.entries(tapTruong as Record<string, string>)
  .map(([maTruong, ten]) => ({ maTruong, ten }))
  .sort((a, b) => a.maTruong.localeCompare(b.maTruong));

export const layDanhSachTenTruong = (): Promise<readonly TruongCoTen[]> => Promise.resolve(DANH_SACH);
