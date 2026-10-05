// Gom dữ liệu cho hai màn Mục tiêu từ state chung. Hai màn và trang Hôm nay dùng cùng nguồn
// (mucTieuDayDu, khoangCachCuaToi) nên số liệu luôn khớp nhau.
import { khoangCachCuaToi, mucTieuDayDu } from "@/state/chon";
import { diemHienTaiCuaTungMon, type AppState } from "@/state/store";
import { monChuaCoDiem, nguonDiemHienTai, phanLoaiMon } from "./tinh-toan";

export function docMucTieu(s: AppState) {
  const m = mucTieuDayDu(s);
  if (!m || !s.mucTieu) return null;
  const diem = diemHienTaiCuaTungMon(s);
  const thieuDiem = monChuaCoDiem(diem, m.toHop);
  const khoangCach = thieuDiem.length ? [] : khoangCachCuaToi(s);
  return {
    ...m,
    goc: s.mucTieu,
    thieuDiem,
    khoangCach,
    cacMon: phanLoaiMon(khoangCach, s.diemThi),
    nguon: nguonDiemHienTai(s.diemThi, m.toHop),
  };
}

export type DuLieuMucTieu = NonNullable<ReturnType<typeof docMucTieu>>;
