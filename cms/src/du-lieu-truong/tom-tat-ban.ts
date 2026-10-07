// Tiêu đề và các dòng nội dung của một bản ghi CMS, để hiện ở thẻ duyệt và danh sách. Thuần TypeScript.
import type { BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { dongNoiDung, nhanLoai, tieuDeBanGhi } from "./dinh-dang";
import { laKenh, loaiTuBanGhi, thongTinTuBanGhi } from "./mo-hinh";
import { soSanhBan } from "./so-sanh";

const NHAN_THUC_THE: Record<string, string> = {
  school: "Kênh chính thức", tuition: "Học phí", scholarship: "Học bổng", admission: "Tuyển sinh", cutoff_score: "Điểm chuẩn",
  announcement: "Thông báo", deadline: "Hạn nộp", contact: "Liên hệ",
};

export const nhanBan = (b: BanGhiCms): string => { const l = loaiTuBanGhi(b); return l ? nhanLoai(l) : NHAN_THUC_THE[b.entityType] ?? b.entityType; };

export function tomTatBan(b: BanGhiCms): { tieuDe: string; dong: string[] } {
  const tt = thongTinTuBanGhi(b);
  if (tt) return { tieuDe: tieuDeBanGhi(tt), dong: dongNoiDung(tt) };
  const dong = soSanhBan(null, b).filter((d) => d.khoa !== "source").map((d) => `${d.nhan}: ${d.moi}`);
  return { tieuDe: laKenh(b) ? "Kênh chính thức của trường" : nhanBan(b), dong };
}
