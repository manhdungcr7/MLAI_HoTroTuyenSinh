// Tính danh sách nhắc nhở sắp tới. Hàm thuần, không React. Chỉ nhắc việc thật trong lịch của em.
import { congNgay, gioTuPhut, isoNgay, phutTuGio, taoNgay, thuCuaNgay } from "@/engine/xep-lich";
import type { AppState } from "@/state/store";
import { TEN_MON } from "@/state/types";

export type LoaiNhac = "tuHoc" | "diHoc" | "chuanBi";

export interface NhacSapToi {
  id: string;
  luc: Date;
  loai: LoaiNhac;
  tieuDe: string;
  moTa: string;
}

const lucCua = (ngay: string, gio: string) => {
  const d = taoNgay(ngay);
  d.setMinutes(phutTuGio(gio));
  return d;
};

export function nhacSapToi(
  s: Pick<AppState, "khoiHoc" | "coDinh" | "nhacNho" | "trangThaiViec">, bayGio: Date, soGio = 24,
): NhacSapToi[] {
  const het = bayGio.getTime() + soGio * 3_600_000;
  const trongKhoang = (d: Date) => d.getTime() > bayGio.getTime() && d.getTime() <= het;
  const { truocPhut, nhacChuanBiBai, gioChuanBiBai } = s.nhacNho;
  const ra: NhacSapToi[] = [];
  const hom = isoNgay(bayGio);

  for (const ngay of [hom, congNgay(hom, 1)]) {
    // Buổi tự học đã xếp (bỏ qua việc đã xong / đã bỏ qua)
    for (const k of s.khoiHoc.filter((x) => x.ngay === ngay && x.loai === "tuHoc")) {
      const tt = k.viecId ? s.trangThaiViec[k.viecId] : undefined;
      if (tt === "xong" || tt === "boQua") continue;
      const luc = lucCua(ngay, gioTuPhut(Math.max(0, phutTuGio(k.batDau) - truocPhut)));
      if (trongKhoang(luc)) ra.push({ id: `tuHoc:${k.id}`, luc, loai: "tuHoc", tieuDe: k.ten, moTa: `Tự học lúc ${k.batDau}, còn ${truocPhut} phút nữa.` });
    }
    // Tiết cố định: đi học chính khóa, học thêm, hoạt động
    for (const t of s.coDinh.filter((x) => x.thu === thuCuaNgay(ngay))) {
      const luc = lucCua(ngay, gioTuPhut(Math.max(0, phutTuGio(t.batDau) - truocPhut)));
      const viec = t.loai === "hocThem" ? "Học thêm" : t.loai === "chinhKhoa" ? "Vào lớp" : "Bắt đầu";
      if (trongKhoang(luc)) ra.push({ id: `diHoc:${t.id}:${ngay}`, luc, loai: "diHoc", tieuDe: t.ten, moTa: `${viec} lúc ${t.batDau}, còn ${truocPhut} phút nữa.` });
    }
    // Tối hôm trước: chuẩn bị bài cho các môn có tiết ngày mai
    if (nhacChuanBiBai) {
      const mai = congNgay(ngay, 1);
      const cacMon = [...new Set(s.coDinh.filter((t) => t.thu === thuCuaNgay(mai) && t.mon).map((t) => TEN_MON[t.mon!]))];
      const luc = lucCua(ngay, gioChuanBiBai);
      if (cacMon.length && trongKhoang(luc)) {
        ra.push({ id: `chuanBi:${ngay}`, luc, loai: "chuanBi", tieuDe: "Chuẩn bị bài cho ngày mai", moTa: `Ngày mai em có ${cacMon.join(", ")}. Soạn sách vở và xem lại bài cũ nhé.` });
      }
    }
  }
  return ra.sort((a, b) => a.luc.getTime() - b.luc.getTime());
}
