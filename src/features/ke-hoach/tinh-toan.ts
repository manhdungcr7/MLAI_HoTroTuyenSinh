// Tính toán thuần cho Kế hoạch tuần (không React). Giao diện chỉ gọi các hàm ở đây.
import { KHUNG_BAO_VE_GIO, khungTrongGanNhat, phatHienTrung, phutTuGio, thuCuaNgay, type KhungGoiY } from "@/engine/xep-lich";
import type { CauHinhTuHoc, KhoiHoc, MonId, TietCoDinh, ToneTen, TrangThaiViec, ViecCanHoc } from "@/state/types";

// ---------- Việc cần làm ----------
export type MucUuTien = ViecCanHoc["mucUuTien"];
export const NHAN_UU_TIEN: Record<MucUuTien, { nhan: string; tone: ToneTen }> = {
  cao: { nhan: "Nên làm trước", tone: "do" },
  vua: { nhan: "Nên làm", tone: "cam" },
  thap: { nhan: "Nhẹ", tone: "luc" },
};

export type IdNhom = MucUuTien | "daXong";
export interface NhomViec { id: IdNhom; ten: string; viec: ViecCanHoc[] }
const TEN_NHOM: Record<IdNhom, string> = { cao: "Nên làm trước", vua: "Tiếp theo", thap: "Trong tuần", daXong: "Đã xong" };

export const daKetThuc = (tt?: TrangThaiViec) => tt === "xong" || tt === "boQua";

/** Chia việc theo mức ưu tiên; việc đã xong hoặc đã bỏ qua dồn xuống nhóm cuối. Bỏ nhóm rỗng. */
export function nhomViec(viec: ViecCanHoc[], trangThai: Record<string, TrangThaiViec>): NhomViec[] {
  const ids: IdNhom[] = ["cao", "vua", "thap", "daXong"];
  return ids
    .map((id) => ({
      id, ten: TEN_NHOM[id],
      viec: viec.filter((v) => (id === "daXong" ? daKetThuc(trangThai[v.id]) : !daKetThuc(trangThai[v.id]) && v.mucUuTien === id)),
    }))
    .filter((n) => n.viec.length > 0);
}

export const khoiCuaViec = (khoiHoc: KhoiHoc[], viecId: string, ngays?: string[]) =>
  khoiHoc
    .filter((k) => k.viecId === viecId && (!ngays || ngays.includes(k.ngay)))
    .sort((a, b) => a.ngay.localeCompare(b.ngay) || a.batDau.localeCompare(b.batDau));

/** Buổi nên hiện cho một việc: buổi của ngày đang chọn, nếu không có thì buổi sắp tới, cuối cùng là buổi đầu tiên. */
export function buoiNenHien(khois: KhoiHoc[], ngayChon: string, homNay: string): KhoiHoc | undefined {
  return khois.find((k) => k.ngay === ngayChon) ?? khois.find((k) => k.ngay >= homNay) ?? khois[0];
}

/** Số việc có giờ tự học trong ngày và số việc trong đó đã xong. */
export function tienDoNgay(viec: ViecCanHoc[], khoiHoc: KhoiHoc[], trangThai: Record<string, TrangThaiViec>, ngay: string) {
  const ids = new Set(khoiHoc.filter((k) => k.ngay === ngay && k.viecId).map((k) => k.viecId!));
  const trongNgay = viec.filter((v) => ids.has(v.id));
  return { tong: trongNgay.length, xong: trongNgay.filter((v) => trangThai[v.id] === "xong").length };
}

/** Việc còn phải làm nhưng chưa có giờ nào trong tuần. */
export const viecChuaCoCho = (viec: ViecCanHoc[], trangThai: Record<string, TrangThaiViec>, khoiHoc: KhoiHoc[], ngays: string[]) =>
  viec.filter((v) => !daKetThuc(trangThai[v.id]) && !khoiHoc.some((k) => k.viecId === v.id && ngays.includes(k.ngay)));

export const soBuoiTuHoc = (khoiHoc: KhoiHoc[], ngays: string[], tuNgay?: string) =>
  khoiHoc.filter((k) => k.loai === "tuHoc" && ngays.includes(k.ngay) && (!tuNgay || k.ngay >= tuNgay)).length;

// ---------- Lịch trong ngày ----------
/** lop: lớp học cố định (xanh) · tuHoc: tự học (lục) · khac: hoạt động khác (cam) · nghi: ăn uống, nghỉ ngơi. */
export type LoaiMuc = "lop" | "tuHoc" | "khac" | "nghi";
export interface MucLich {
  id: string; ten: string; loai: LoaiMuc; batDau: string; ketThuc: string;
  nguon: "coDinh" | "khoi" | "baoVe"; mon?: MonId; ghiChu?: string; khoi?: KhoiHoc; tiet?: TietCoDinh;
}

const loaiCuaKhoi = (k: KhoiHoc): LoaiMuc => (k.loai === "tuHoc" ? "tuHoc" : k.loai === "nghi" ? "nghi" : k.loai === "khac" ? "khac" : "lop");

/** Mọi thứ trong một ngày: tiết cố định, khối tự học/hoạt động, và giờ ăn uống được bảo vệ, xếp theo giờ. */
export function mucLichTrongNgay(coDinh: TietCoDinh[], khoiHoc: KhoiHoc[], ngay: string): MucLich[] {
  const thu = thuCuaNgay(ngay);
  const ra: MucLich[] = [
    ...coDinh.filter((t) => t.thu === thu).map((t): MucLich => ({ id: `tiet:${t.id}`, ten: t.ten, loai: t.loai === "khac" ? "khac" : "lop", batDau: t.batDau, ketThuc: t.ketThuc, nguon: "coDinh", mon: t.mon, tiet: t })),
    ...khoiHoc.filter((k) => k.ngay === ngay).map((k): MucLich => ({ id: `khoi:${k.id}`, ten: k.ten, loai: loaiCuaKhoi(k), batDau: k.batDau, ketThuc: k.ketThuc, nguon: "khoi", mon: k.mon, ghiChu: k.ghiChu, khoi: k })),
    ...KHUNG_BAO_VE_GIO.map((b, i): MucLich => ({ id: `baoVe:${i}`, ten: b.ten, loai: "nghi", batDau: b.batDau, ketThuc: b.ketThuc, nguon: "baoVe" })),
  ];
  return ra.sort((a, b) => a.batDau.localeCompare(b.batDau) || a.ketThuc.localeCompare(b.ketThuc));
}

export interface CapTrung { a: MucLich; b: MucLich; doi: MucLich | null }

/** Cặp mục trùng giờ. `doi` là mục nên dời: chỉ dời được khối (không dời lớp học cố định hay giờ ăn). */
export function timTrung(mucs: MucLich[]): CapTrung[] {
  const theoId = new Map(mucs.map((m) => [m.id, m]));
  return phatHienTrung(mucs.map(({ id, ten, batDau, ketThuc }) => ({ id, ten, batDau, ketThuc }))).map(([x, y]) => {
    const a = theoId.get(x.id)!, b = theoId.get(y.id)!;
    const coTheDoi = [a, b].filter((m) => m.nguon === "khoi");
    // Cả hai đều là khối: giữ khối em tự chọn giờ, dời khối do máy xếp; ngang nhau thì dời khối bắt đầu sau.
    const doi = coTheDoi.length === 2 ? (coTheDoi.find((m) => !m.khoi!.khoa && m.khoi!.id.startsWith("auto-")) ?? b) : coTheDoi[0] ?? null;
    return { a, b, doi };
  });
}

/** Giờ trống gần giờ cũ nhất để dời một khối bị trùng (thử trong ngày, rồi 2 ngày sau). */
export function goiYDoiKhoi(k: KhoiHoc, du: { coDinh: TietCoDinh[]; khoiHoc: KhoiHoc[]; cfg: CauHinhTuHoc; homNay: string; phutBayGio: number }): KhungGoiY | null {
  const phut = phutTuGio(k.ketThuc) - phutTuGio(k.batDau);
  const tuNgay = k.ngay < du.homNay ? du.homNay : k.ngay;
  return khungTrongGanNhat({
    tuNgay, tuPhut: tuNgay === du.homNay ? du.phutBayGio : 0, phut, coDinh: du.coDinh, cfg: du.cfg,
    khoiDaCo: du.khoiHoc.filter((b) => b.id !== k.id), soKhung: 1, soNgay: 3, ganMoc: phutTuGio(k.batDau),
  })[0] ?? null;
}

/** 3–4 khung trống gần nhất từ bây giờ để dời một việc; bỏ qua đúng giờ đang có. */
export function cacKhungDoiLich(phut: number, khoiDangCo: KhoiHoc | undefined, du: { coDinh: TietCoDinh[]; khoiHoc: KhoiHoc[]; cfg: CauHinhTuHoc; homNay: string; phutBayGio: number }): KhungGoiY[] {
  return khungTrongGanNhat({
    tuNgay: du.homNay, tuPhut: du.phutBayGio, phut, coDinh: du.coDinh, cfg: du.cfg,
    khoiDaCo: du.khoiHoc.filter((b) => b.id !== khoiDangCo?.id), soKhung: 5, soNgay: 7,
  }).filter((g) => !(khoiDangCo && g.ngay === khoiDangCo.ngay && g.batDau === khoiDangCo.batDau)).slice(0, 4);
}

/** Kiểm tra giờ em tự nhập. Trả về câu báo lỗi dễ hiểu, hoặc null nếu hợp lệ. */
export function kiemTraGio(batDau: string, ketThuc: string): string | null {
  if (!/^\d{2}:\d{2}$/.test(batDau) || !/^\d{2}:\d{2}$/.test(ketThuc)) return "Em chọn đủ giờ bắt đầu và giờ kết thúc nhé.";
  const a = phutTuGio(batDau), b = phutTuGio(ketThuc);
  if (b <= a) return "Giờ kết thúc phải sau giờ bắt đầu.";
  if (b - a < 10) return "Mỗi khối nên dài ít nhất 10 phút.";
  if (b - a > 6 * 60) return "Một khối không nên dài quá 6 giờ, em chia nhỏ ra nhé.";
  return null;
}
