// Các hàm đọc dữ liệu dẫn xuất từ state. Dùng chung cho nhiều màn.
import { tim } from "@/data/lua-chon-mau";
import { isoNgay, thuHaiCuaTuan, bayNgayCuaTuan, soNgayTu } from "@/engine/xep-lich";
import { khoangCachTheoMon, tongDiem } from "@/engine/phan-tich";
import { diemHienTaiCuaTungMon, type AppState } from "./store";
import { TO_HOP, type LuaChon, type MonId } from "./types";

export const homNay = () => isoNgay(new Date());
export const tuanHienTai = () => thuHaiCuaTuan(homNay());

export function mucTieuDayDu(s: AppState): { lc: LuaChon; hienTai: number; mucTieu: number; conThieu: number; soNgayCon: number; toHop: MonId[] } | null {
  if (!s.mucTieu) return null;
  const lc = tim(s.mucTieu.luaChonId);
  if (!lc) return null;
  const diem = diemHienTaiCuaTungMon(s);
  const hienTai = tongDiem(diem, s.mucTieu.toHop);
  return {
    lc, hienTai, mucTieu: s.mucTieu.diemMucTieu, toHop: s.mucTieu.toHop,
    conThieu: Math.max(0, Math.round((s.mucTieu.diemMucTieu - hienTai) * 10) / 10),
    soNgayCon: Math.max(0, soNgayTu(homNay(), s.mucTieu.ngayThi)),
  };
}

export function khoangCachCuaToi(s: AppState) {
  const m = mucTieuDayDu(s);
  if (!m) return [];
  return khoangCachTheoMon(diemHienTaiCuaTungMon(s), m.toHop, m.mucTieu, s.hoSo.canCaiThien);
}

const THU_TU = { cao: 0, vua: 1, thap: 2 } as const;

export function viecConLai(s: AppState) {
  return s.viec
    .filter((v) => !["xong", "boQua"].includes(s.trangThaiViec[v.id] ?? ""))
    .sort((a, b) => THU_TU[a.mucUuTien] - THU_TU[b.mucUuTien]);
}

/** Tiến độ tuần: việc đã xong / tổng số việc của tuần. */
export function tienDoTuan(s: AppState) {
  const tong = s.viec.length;
  const xong = s.viec.filter((v) => s.trangThaiViec[v.id] === "xong").length;
  return { tong, xong, phanTram: tong ? Math.round((xong / tong) * 100) : 0 };
}

export function khoiTrongNgay(s: AppState, ngay: string) {
  return s.khoiHoc.filter((k) => k.ngay === ngay).sort((a, b) => a.batDau.localeCompare(b.batDau));
}

export const cacNgayTuanNay = () => bayNgayCuaTuan(tuanHienTai());

export function tenGoi(hoTen: string) {
  const p = hoTen.trim().split(/\s+/);
  return p.length ? p[p.length - 1] : "bạn";
}


/** Tổng điểm 3 môn Toán – Lý – Anh hiện tại; null nếu em chưa nhập đủ. */
export function tongA01(s: AppState): number | null {
  const d = diemHienTaiCuaTungMon(s);
  if (TO_HOP.A01.some((m) => d[m] === null)) return null;
  return tongDiem(d, TO_HOP.A01);
}

export const mucTieuTuLuaChon = (lc: LuaChon) => ({
  luaChonId: lc.id, phuongThuc: "THPT" as const, maToHop: "A01" as const, toHop: TO_HOP.A01, diemMucTieu: lc.diemMin,
  ngayThi: isoNgay(new Date(new Date().getFullYear() + (new Date().getMonth() > 5 ? 1 : 0), 5, 26)),
});
