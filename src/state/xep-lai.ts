// Xếp lại lịch tự học của một tuần trên một AppState, thuần TypeScript (tách khỏi store để test được).
import { bayNgayCuaTuan, isoNgay, xepLichTuan } from "@/engine/xep-lich";
import type { AppState } from "./store";
import type { KhoiHoc, ViecCanHoc } from "./types";

export function xepLaiTuan(
  goc: AppState, tuanBatDau: string, tuNgay?: string, viecMoi?: ViecCanHoc[], bayGio = new Date(),
): { s: AppState; chuaXep: number; ghiChu: string[] } {
  const x = viecMoi ? { ...goc, viec: viecMoi } : goc;
  const ngays = bayNgayCuaTuan(tuanBatDau);
  const xong = (k: KhoiHoc) => k.viecId && x.trangThaiViec[k.viecId] === "xong";
  const giu = x.khoiHoc.filter((k) => !ngays.includes(k.ngay) || k.khoa || !k.id.startsWith("auto-") || xong(k) || (tuNgay && k.ngay < tuNgay));
  const viecCan = x.viec.filter((v) => {
    if (v.tuan && v.tuan !== tuanBatDau) return false; // việc của tuần khác không xếp vào tuần này
    const tt = x.trangThaiViec[v.id];
    if (tt === "xong" || tt === "boQua") return false;
    return !giu.some((k) => k.viecId === v.id && (k.khoa || (tuNgay && k.ngay < tuNgay)));
  });
  const tuPhut = tuNgay && tuNgay === isoNgay(bayGio) ? bayGio.getHours() * 60 + bayGio.getMinutes() : undefined;
  const r = xepLichTuan({ tuanBatDau, tuNgay, tuPhut, coDinh: x.coDinh, viec: viecCan, cfg: x.cauHinh, tamTrang: x.tamTrang, khoiDaCo: giu });
  return { s: { ...x, khoiHoc: [...giu, ...r.khoi] }, chuaXep: r.chuaXep.length, ghiChu: r.ghiChu };
}
