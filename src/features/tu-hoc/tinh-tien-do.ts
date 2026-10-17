// Tính toán thuần (không React) cho màn Tiến độ và Cài đặt tự học. Dễ chuyển lên máy chủ sau này.
import {
  bayNgayCuaTuan, congNgay, isoNgay, khungTrongTrongNgay, phutTuGio, taoNgay, thuCuaNgay, thuHaiCuaTuan,
} from "@/engine/xep-lich";
import { viecCuaTuan } from "@/state/chon";
import type { AppState } from "@/state/store";
import { TEN_MON, type CauHinhTuHoc, type KhoiHoc, type LichSuHoanThanh, type MonId, type TietCoDinh } from "@/state/types";
import { dinhDang } from "@/engine/dinh-dang";

export const NHAN_THU = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
export const TEN_THU = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"] as const;

export const phutHienTai = (d: Date) => d.getHours() * 60 + d.getMinutes();
export const ngayThang = (iso: string) => `${taoNgay(iso).getDate()}/${taoNgay(iso).getMonth() + 1}`;

/** "Hôm nay, 20:15" · "Hôm qua, 21:00" · "T6, 2/10" (trong 7 ngày) · "28/9, 19:20" */
export function nhanThoiDiem(luc: Date | string, bayGio: Date): string {
  const d = typeof luc === "string" ? new Date(luc) : luc;
  const gio = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const ngay = isoNgay(d), hom = isoNgay(bayGio);
  if (ngay === hom) return `Hôm nay, ${gio}`;
  if (ngay === congNgay(hom, -1)) return `Hôm qua, ${gio}`;
  if (ngay === congNgay(hom, 1)) return `Ngày mai, ${gio}`;
  return `${NHAN_THU[thuCuaNgay(ngay)]} ${ngayThang(ngay)}, ${gio}`;
}

type TrangThaiTienDo = Pick<AppState, "viec" | "trangThaiViec" | "khoiHoc">;

/** Buổi tự học đã qua giờ mà việc của nó vẫn chưa xong (không tính việc đã dời hay đã bỏ qua). */
export function buoiBoLo(s: TrangThaiTienDo, bayGio: Date): KhoiHoc[] {
  const hom = isoNgay(bayGio), phut = phutHienTai(bayGio), thuHai = thuHaiCuaTuan(hom);
  const conViec = new Set(s.viec.map((v) => v.id));
  return s.khoiHoc.filter((k) => {
    if (k.loai !== "tuHoc" || !k.viecId || !conViec.has(k.viecId)) return false;
    if (k.ngay < thuHai || k.ngay > hom) return false;
    if (k.ngay === hom && phutTuGio(k.ketThuc) > phut) return false;
    const tt = s.trangThaiViec[k.viecId];
    return !tt || tt === "chua";
  });
}

/** Bốn ô đếm của "Tiến độ tuần". Còn lại = chưa xong và chưa bỏ qua; Quá hạn, Đã dời là một phần của Còn lại. */
export function demTienDo(s: TrangThaiTienDo, bayGio: Date) {
  const tt = (id: string) => s.trangThaiViec[id];
  const viec = viecCuaTuan(s.viec, thuHaiCuaTuan(isoNgay(bayGio))); // tiến độ chỉ tính việc của tuần này
  const tong = viec.length;
  const xong = viec.filter((v) => tt(v.id) === "xong").length;
  const boQua = viec.filter((v) => tt(v.id) === "boQua").length;
  const daDoi = viec.filter((v) => tt(v.id) === "doi").length;
  const quaHan = new Set(buoiBoLo(s, bayGio).map((k) => k.viecId)).size;
  return { tong, xong, boQua, daDoi, quaHan, conLai: tong - xong - boQua, phanTram: tong ? Math.round((xong / tong) * 100) : 0 };
}

/**
 * So sánh số việc đã xong (theo lịch sử) tuần này với tuần trước.
 * Chỉ trả về khi tuần trước có ghi nhận, để không bịa ra một con số so sánh.
 */
export function soVoiTuanTruoc(
  lichSu: LichSuHoanThanh[], bayGio: Date, xongTuanNay?: number,
): { tuanNay: number; tuanTruoc: number; chenh: number } | null {
  const thuHai = thuHaiCuaTuan(isoNgay(bayGio)), thuHaiTruoc = congNgay(thuHai, -7);
  const dem = (tu: string, den: string) => new Set(lichSu
    .filter((l) => {
      if (l.trangThai !== "xong" || typeof l.luc !== "string") return false;
      const d = new Date(l.luc);
      if (Number.isNaN(d.getTime())) return false;
      const iso = isoNgay(d);
      return iso >= tu && iso < den;
    })
    .map((l) => l.viecId)).size;
  const tuanTruoc = dem(thuHaiTruoc, thuHai);
  if (!tuanTruoc) return null;
  // màn Tiến độ truyền số việc đã xong của vòng tiến độ để hai con số luôn khớp nhau
  const tuanNay = xongTuanNay ?? dem(thuHai, congNgay(thuHai, 7));
  return { tuanNay, tuanTruoc, chenh: tuanNay - tuanTruoc };
}

export interface XuHuongMon { mon: MonId; ten: string; gia: number[]; moiNhat: number | null; chenh: number | null }

/** Điểm thi thử theo môn: lấy tối đa 5 lần gần nhất, theo thứ tự thời gian. */
export function xuHuongCacMon(s: Pick<AppState, "diemThi" | "mucTieu">): XuHuongMon[] {
  const theoMon = new Map<MonId, number[]>();
  for (const d of [...s.diemThi].sort((a, b) => a.ngay.localeCompare(b.ngay))) theoMon.set(d.mon, [...(theoMon.get(d.mon) ?? []), d.diem]);
  let cacMon: MonId[] = s.mucTieu?.toHop ?? [];
  if (!cacMon.length) cacMon = [...theoMon.keys()].sort((a, b) => (theoMon.get(b)!.length - theoMon.get(a)!.length)).slice(0, 3);
  return cacMon.map((mon) => {
    const gia = (theoMon.get(mon) ?? []).slice(-5);
    const n = gia.length;
    return { mon, ten: TEN_MON[mon], gia, moiNhat: n ? gia[n - 1] : null, chenh: n >= 2 ? Math.round((gia[n - 1] - gia[n - 2]) * 10) / 10 : null };
  });
}

/** Môn có điểm tăng liên tiếp ở 3 lần thi gần nhất. */
export function monTangLienTiep(diemThi: AppState["diemThi"]): { mon: MonId; ba: number[] }[] {
  const ra: { mon: MonId; ba: number[] }[] = [];
  const theoMon = new Map<MonId, number[]>();
  for (const d of [...diemThi].sort((a, b) => a.ngay.localeCompare(b.ngay))) theoMon.set(d.mon, [...(theoMon.get(d.mon) ?? []), d.diem]);
  for (const [mon, gia] of theoMon) {
    const ba = gia.slice(-3);
    if (ba.length === 3 && ba[0] < ba[1] && ba[1] < ba[2]) ra.push({ mon, ba });
  }
  return ra;
}

/** Số ngày liền gần đây (tính tới hôm nay hoặc hôm qua) em có ít nhất một việc đã xong. */
export function chuoiNgayHoc(lichSu: LichSuHoanThanh[], bayGio: Date): number {
  const ngayXong = new Set(lichSu.filter((l) => l.trangThai === "xong").map((l) => isoNgay(new Date(l.luc))));
  let ngay = isoNgay(bayGio);
  if (!ngayXong.has(ngay)) ngay = congNgay(ngay, -1);
  let dem = 0;
  while (ngayXong.has(ngay)) { dem++; ngay = congNgay(ngay, -1); }
  return dem;
}

/** Một lời ghi nhận ngắn, chỉ khi có lý do thật. */
export function loiGhiNhan(s: Pick<AppState, "lichSu" | "tamTrang" | "viec" | "trangThaiViec">, bayGio: Date): string | null {
  const chuoi = chuoiNgayHoc(s.lichSu, bayGio);
  const td = demTienDo({ ...s, khoiHoc: [] }, bayGio);
  if (td.tong > 0 && td.xong === td.tong) return "Xong hết việc tuần này. Làm tốt lắm, nhớ nghỉ nhé!";
  if (chuoi >= 3) return `Học đều ${chuoi} ngày liền. Giữ nhịp này nhé!`;
  if (s.tamTrang === "met") return "Hôm nay mệt nên lịch đã làm nhẹ. Biết nghỉ cũng là học tốt.";
  const homNayXong = s.lichSu.filter((l) => l.trangThai === "xong" && isoNgay(new Date(l.luc)) === isoNgay(bayGio)).length;
  if (homNayXong >= 1) return `Hôm nay bạn đã xong ${homNayXong} việc. Cố gắng phát huy nhé!`;
  return null;
}

/**
 * Ước lượng giờ tự học mỗi tuần theo lịch học cố định và cài đặt (chưa trừ các buổi đã xếp).
 * Có `tuNgay`: các ngày trước đó tính 0 phút (đã qua, không xếp được nữa).
 */
export function uocLuongGioTuHoc(coDinh: TietCoDinh[], cfg: CauHinhTuHoc, thuHai: string, tuNgay?: string) {
  const theoNgay = bayNgayCuaTuan(thuHai).map((ngay) => {
    const thu = thuCuaNgay(ngay);
    const nghi = cfg.ngayNghi.includes(thu);
    const daQua = tuNgay !== undefined && ngay < tuNgay;
    const trong = khungTrongTrongNgay(ngay, coDinh, cfg).reduce((t, k) => t + k.ketThuc - k.batDau, 0);
    // mỗi buổi kèm thời gian nghỉ giữa buổi, nên phần học thật ít hơn khoảng trống một chút
    const coThe = Math.max(0, trong - cfg.nghiGiuaBuoi * Math.floor(trong / 90));
    return { ngay, thu, nghi, phut: nghi || daQua ? 0 : Math.min(coThe, Math.round(cfg.gioHocToiDaMoiNgay * 60)) };
  });
  return { theoNgay, tongPhut: theoNgay.reduce((t, n) => t + n.phut, 0) };
}

/** "1 giờ 30 phút", "2 giờ", "45 phút" */
export function dangGio(phut: number): string {
  const safePhut = Math.max(0, Number.isFinite(phut) ? phut : 0);
  const g = Math.floor(safePhut / 60), p = Math.round(safePhut % 60);
  if (!g) return `${p} phút`;
  return p ? `${g} giờ ${p} phút` : `${g} giờ`;
}

/** Số thập phân kiểu Việt: 2.5 → "2,5" */
export const soViet = (n: number) => (Number.isInteger(n) ? String(n) : dinhDang(n, 1).replace(".", ","));
