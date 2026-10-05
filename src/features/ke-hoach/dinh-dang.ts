// Định dạng ngày giờ cho màn Kế hoạch tuần. Thuần TS, không React.
import { phutTuGio, taoNgay, thuCuaNgay } from "@/engine/xep-lich";

const TEN_THU = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const THU_NGAN = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const tenThu = (iso: string) => TEN_THU[thuCuaNgay(iso)];
export const thuNgan = (iso: string) => THU_NGAN[thuCuaNgay(iso)];
export const ngayThang = (iso: string) => `${taoNgay(iso).getDate()}/${taoNgay(iso).getMonth() + 1}`;

/** "Hôm nay", "Ngày mai", hoặc "Thứ 5, 8/10". */
export function tenNgay(iso: string, homNay: string, ngan = false): string {
  if (iso === homNay) return "Hôm nay";
  const mai = taoNgay(homNay); mai.setDate(mai.getDate() + 1);
  if (taoNgay(iso).getTime() === mai.getTime()) return "Ngày mai";
  return `${ngan ? thuNgan(iso) : tenThu(iso)}, ${ngayThang(iso)}`;
}

export const soPhut = (batDau: string, ketThuc: string) => phutTuGio(ketThuc) - phutTuGio(batDau);

/** 90 → "1 giờ 30 phút", 120 → "2 giờ", 45 → "45 phút". */
export function thoiLuong(phut: number): string {
  const g = Math.floor(phut / 60), p = phut % 60;
  if (!g) return `${p} phút`;
  return p ? `${g} giờ ${p} phút` : `${g} giờ`;
}

/** Giờ hiện tại tính bằng phút trong ngày. */
export const phutBayGio = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
