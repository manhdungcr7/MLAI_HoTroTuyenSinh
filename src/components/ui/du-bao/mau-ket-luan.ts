// BẢNG ÁNH XẠ DUY NHẤT: vị trí điểm so với khoảng dự báo -> tông màu + biểu tượng + chữ. Mọi nơi (thanh, thẻ, kết luận, biểu đồ, so sánh) dùng bảng này.
// Màu không đứng một mình: luôn đi kèm biểu tượng và chữ (người mù màu vẫn đọc được). Không dùng đỏ gắt: mức thấp nhất là san hô dịu.
import { ArrowUpRight, CircleCheckBig, Mountain, Target, TrendingUp, type LucideIcon } from "lucide-react";
import type { ViTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";

export interface MauKetLuan {
  icon: LucideIcon;
  /** Chữ ngắn khi không có chỗ cho câu kết luận (chip thẻ). */
  ngan: string;
  nen: string; // nền nhạt của khối
  chu: string; // chữ đậm trên nền nhạt (đạt AA)
  dam: string; // nền đặc cho chấm, ghim, chip chữ trắng
  vien: string;
  vung: string; // vùng khoảng dự báo trên thanh
  svgFill: string; // quạt dự báo trong biểu đồ
  svgStroke: string;
  dot: string; // ô tô màu nhỏ ở chú thích
}

const m = (icon: LucideIcon, ngan: string, nen: string, chu: string, dam: string, vien: string, vung: string, svgFill: string, svgStroke: string, dot: string): MauKetLuan =>
  ({ icon, ngan, nen, chu, dam, vien, vung, svgFill, svgStroke, dot });

export const MAU_KET_LUAN: Record<ViTriSoVoiDuBao, MauKetLuan> = {
  caoHonCa: m(CircleCheckBig, "Trên khoảng", "bg-ngoc-nhat", "text-ngoc-chu", "bg-ngoc", "border-ngoc/40", "bg-ngoc/30", "fill-ngoc/25", "stroke-ngoc", "bg-ngoc"),
  tren: m(TrendingUp, "Trên mức giữa", "bg-luc-nhat", "text-luc-chu", "bg-luc", "border-luc/40", "bg-luc/30", "fill-luc/25", "stroke-luc", "bg-luc"),
  trongKhoang: m(Target, "Trong khoảng", "bg-xanh-nhat", "text-xanh-dam", "bg-xanh", "border-xanh/40", "bg-xanh/30", "fill-xanh/20", "stroke-xanh", "bg-xanh"),
  duoi: m(ArrowUpRight, "Hơi thấp", "bg-cam-nhat", "text-cam-chu", "bg-cam", "border-cam/50", "bg-cam/30", "fill-cam/25", "stroke-cam", "bg-cam"),
  thapHonCa: m(Mountain, "Còn thấp xa", "bg-san-ho-nhat", "text-san-ho-chu", "bg-san-ho", "border-san-ho/50", "bg-san-ho/30", "fill-san-ho/25", "stroke-san-ho", "bg-san-ho"),
};

/** Khi chưa có điểm của em: tông trung tính (xanh), không ngụ ý tốt hay xấu. */
export const MAU_CHUA_CO_DIEM: MauKetLuan = { ...MAU_KET_LUAN.trongKhoang, icon: Target, ngan: "Chưa có điểm" };

/** Nhóm ngành -> một tông ổn định (phân loại, không mang nghĩa tốt/xấu). Chỉ dùng cọng màu mảnh ở thẻ và chấm ở chip lọc. */
const TONE_NHOM = [
  { vien: "border-l-xanh", dot: "bg-xanh" }, { vien: "border-l-tim", dot: "bg-tim" }, { vien: "border-l-ngoc", dot: "bg-ngoc" },
  { vien: "border-l-cam", dot: "bg-cam" }, { vien: "border-l-luc", dot: "bg-luc" },
] as const;
export function mauNhomNganh(nhom: string) {
  let h = 0;
  for (const c of nhom) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONE_NHOM[h % TONE_NHOM.length];
}

/** Bốn ô nhóm ngành: mỗi ô một tông nhạt (cam, xanh, tím, lục) theo thứ tự, chữ đậm cùng tông. */
export const MAU_NHOM_O = [
  { nen: "gd-nhom-cam", chu: "text-cam-chu" }, { nen: "gd-nhom-xanh", chu: "text-xanh-dam" },
  { nen: "gd-nhom-tim", chu: "text-tim-chu" }, { nen: "gd-nhom-luc", chu: "text-luc-chu" },
] as const;
