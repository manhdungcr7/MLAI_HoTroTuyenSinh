// BẢNG MÀU-NGHĨA DUY NHẤT của nền thiết kế 2027. Màu luôn đi kèm biểu tượng + chữ (không chỉ màu).
// Chữ trên nền nhạt dùng token *-chu (>= 4,5:1). Không có xác suất: chỉ nhãn định tính, vị trí so với khoảng dự báo, chênh điểm.
import { CircleDashed, type LucideIcon } from "lucide-react";
import type { NhanNguyenVong, ToneTen } from "@/state/types";
import { MAU_KET_LUAN } from "../du-bao/mau-ket-luan";
import { StatusBackup, StatusBalanced, StatusReach, StatusSafe } from "../bieu-tuong-nguyen-vong";
import type { ViTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";

export type TongMau = ToneTen | "ngoc" | "sanHo";

/** Lớp Tailwind cho một nghĩa. nen/chu dùng cho pill; dam cho chấm/thanh đặc; thanh là gradient thanh tiến độ; huyHieu là gradient chữ trắng. */
export interface MauNghia { icon: LucideIcon; nhan: string; nen: string; chu: string; dam: string; vien: string; thanh: string; huyHieu: string; nenNhe: string }

const nhomMau = {
  luc:  { nen: "bg-luc-nhat", chu: "text-luc-chu", dam: "bg-luc", vien: "border-luc/40", thanh: "gd-thanh-luc", huyHieu: "gd-huy-hieu-luc", nenNhe: "the-nen-nhe-luc" },
  xanh: { nen: "bg-xanh-nhat", chu: "text-xanh-dam", dam: "bg-xanh", vien: "border-xanh/40", thanh: "gd-thanh-xanh", huyHieu: "gd-huy-hieu-xanh", nenNhe: "the-nen-nhe-xanh" },
  tim:  { nen: "bg-tim-nhat", chu: "text-tim-chu", dam: "bg-tim", vien: "border-tim/40", thanh: "gd-thanh-tim", huyHieu: "gd-huy-hieu-tim", nenNhe: "the-nen-nhe-tim" },
  cam:  { nen: "bg-cam-nhat", chu: "text-cam-chu", dam: "bg-cam", vien: "border-cam/50", thanh: "gd-thanh-cam", huyHieu: "gd-huy-hieu-cam", nenNhe: "the-nen-nhe-cam" },
  do:   { nen: "bg-do-nhat", chu: "text-do-chu", dam: "bg-do", vien: "border-do/40", thanh: "gd-thanh-do", huyHieu: "gd-huy-hieu-do", nenNhe: "the-nen-nhe-do" },
  muc:  { nen: "bg-nen", chu: "text-chu", dam: "bg-chu", vien: "border-vien", thanh: "gd-thanh-xanh", huyHieu: "gd-huy-hieu-muc", nenNhe: "the-nen-nhe-xanh" },
  trung: { nen: "bg-nen", chu: "text-chu-phu", dam: "bg-chu-phu", vien: "border-vien", thanh: "gd-thanh-xanh", huyHieu: "gd-huy-hieu-muc", nenNhe: "the-nen-nhe-xanh" },
} as const;
export type TongPill = keyof typeof nhomMau;
export const mauTheoTong = (t: TongPill): Omit<MauNghia, "icon" | "nhan"> => nhomMau[t];

/** 4 nhãn nguyện vọng cố định: An toàn lục · Vừa sức lam · Thử sức tím · Dự phòng cam. */
export const MAU_NHAN_NV: Record<NhanNguyenVong, MauNghia & { tong: ToneTen }> = {
  "An toàn": { ...nhomMau.luc, icon: StatusSafe, nhan: "An toàn", tong: "luc" },
  "Vừa sức": { ...nhomMau.xanh, icon: StatusBalanced, nhan: "Vừa sức", tong: "xanh" },
  "Thử sức": { ...nhomMau.tim, icon: StatusReach, nhan: "Thử sức", tong: "tim" },
  "Dự phòng": { ...nhomMau.cam, icon: StatusBackup, nhan: "Dự phòng", tong: "cam" },
};
export const THU_TU_NHAN_NV: NhanNguyenVong[] = ["An toàn", "Vừa sức", "Thử sức", "Dự phòng"];

/** 5 mức vị trí điểm của em so với khoảng dự báo (lấy từ mau-ket-luan để không lệch). Kèm câu đầy đủ cho aria. */
export const MAU_VI_TRI: Record<ViTriSoVoiDuBao, { icon: LucideIcon; nhan: string; dai: string; nen: string; chu: string; dam: string; vien: string }> = {
  caoHonCa: { ...pick("caoHonCa"), dai: "Điểm của em cao hơn cả khoảng dự báo" },
  tren: { ...pick("tren"), dai: "Điểm của em trên mức giữa của khoảng dự báo" },
  trongKhoang: { ...pick("trongKhoang"), dai: "Điểm của em nằm trong khoảng dự báo" },
  duoi: { ...pick("duoi"), dai: "Điểm của em hơi thấp so với khoảng dự báo" },
  thapHonCa: { ...pick("thapHonCa"), dai: "Điểm của em còn thấp xa so với khoảng dự báo" },
};
function pick(k: ViTriSoVoiDuBao) { const m = MAU_KET_LUAN[k]; return { icon: m.icon, nhan: m.ngan, nen: m.nen, chu: m.chu, dam: m.dam, vien: m.vien }; }

/** Trạng thái trống / chưa có dữ liệu: trung tính, không ngụ ý tốt hay xấu. */
export const MAU_TRONG = { icon: CircleDashed, nhan: "Chưa có dữ liệu", ...nhomMau.trung } as const;
