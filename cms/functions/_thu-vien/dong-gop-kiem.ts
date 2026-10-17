// Kiểm tra thuần (không D1, không KV) cho đóng góp qua MCP: nguồn trích dẫn, từng hàng điểm chuẩn, thang điểm, chênh lệch, và rút gọn kết quả.
// Dữ liệu từ AI coi là không tin cậy: mọi chuỗi đều lọc thẻ HTML và ký tự điều khiển, cắt độ dài trước khi dùng.
import { kiemTraNguon } from "./ban-ghi-d1";
import type { NguonKiemChung } from "../../../src/engine/du-lieu-tuyen-sinh/kieu";
import { nguonChiNoiDiemSan } from "../../../src/engine/du-lieu-tuyen-sinh/kiem-tra-diem";

export const SO_HANG_TOI_DA = 100;
export const NGAM_CHENH_LON = 4;
export const NAM_NHO_NHAT = 2015;
export const GIOI_HAN_KET_QUA = 3000;

/** Chữ từ AI: bỏ thẻ HTML, ký tự điều khiển, gộp khoảng trắng. */
export function lamSachChuMcp(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export interface NguonMcp { loai: string; url: string; trang: string; trichDan: string }

/** Nguồn bắt buộc: loai, url (http/https), trang, trichDan (5-300 ký tự, dòng trích nguyên văn). */
export function kiemNguonMcp(raw: unknown): { ok: true; nguon: NguonMcp } | { ok: false; loi: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, loi: "Thiếu nguon: cần {loai, url, trang, trichDan}" };
  const n = raw as Record<string, unknown>;
  const loai = typeof n.loai === "string" ? lamSachChuMcp(n.loai) : "";
  if (loai.length < 2 || loai.length > 40) return { ok: false, loi: "nguon.loai cần 2 đến 40 ký tự (ví dụ: de_an, thong_bao)" };
  const url = typeof n.url === "string" ? n.url.trim() : "";
  let u: URL;
  try { u = new URL(url); } catch { return { ok: false, loi: "nguon.url phải là đường dẫn http hoặc https" }; }
  if ((u.protocol !== "http:" && u.protocol !== "https:") || !u.hostname.includes(".") || u.href.length > 500) return { ok: false, loi: "nguon.url phải là đường dẫn http hoặc https, tối đa 500 ký tự" };
  const trang = typeof n.trang === "number" && Number.isInteger(n.trang) && n.trang >= 1 ? String(n.trang) : typeof n.trang === "string" ? lamSachChuMcp(n.trang) : "";
  if (trang.length < 1 || trang.length > 40) return { ok: false, loi: "nguon.trang là số trang hoặc mô tả ngắn (1 đến 40 ký tự)" };
  const trichDan = typeof n.trichDan === "string" ? lamSachChuMcp(n.trichDan) : "";
  if (trichDan.length < 5 || trichDan.length > 300) return { ok: false, loi: "nguon.trichDan cần 5 đến 300 ký tự: chép nguyên văn dòng trong tài liệu" };
  if (nguonChiNoiDiemSan(`${loai} ${trichDan}`)) return { ok: false, loi: "Nguồn đang mô tả điểm sàn nhận hồ sơ, không phải điểm chuẩn trúng tuyển" };
  return { ok: true, nguon: { loai, url: u.href, trang, trichDan } };
}

/** Nguồn đúng dạng bản ghi CMS (cùng bộ kiểm tra với giao diện). `tenTruong` làm đơn vị công bố. */
export function nguonCmsTuMcp(n: NguonMcp, email: string, luc: string, tenTruong: string): NguonKiemChung {
  return kiemTraNguon({ url: n.url, tieuDe: `${n.loai}, trang ${n.trang}`, donViCongBo: tenTruong }, email, luc);
}

/** Thang điểm theo phương thức. Không rõ thì dùng thang THPT 10-30. */
export function thangDiem(phuongThuc: string): { min: number; max: number } {
  const p = phuongThuc.toUpperCase();
  if (/DGNL|ĐGNL|NANG_LUC/.test(p)) return { min: 0, max: 1200 };
  if (/HSA/.test(p)) return { min: 0, max: 150 };
  return { min: 10, max: 30 };
}

export const namToiDa = (bayGio: Date) => bayGio.getFullYear() + 1;

export interface HangDeXuat { idChuongTrinh: string; nam: number; diem: number; phuongThuc: string; toHop: string }

/** Mã bản ghi điểm chuẩn: giống hệt entityIdDiemChuan của CMS (cms/src/du-lieu-truong/chuong-trinh.ts) để không tạo trùng. */
export const maBanGhiDiemChuan = (maTruong: string, nam: number, idChuongTrinh: string, phuongThuc: string, toHop: string) =>
  `${maTruong}-DC${nam}-${idChuongTrinh}-${phuongThuc.toLowerCase().replace(/[^a-z0-9]/g, "")}-${toHop.toLowerCase().replace(/[^a-z0-9]/g, "")}`.slice(0, 64);

/** Kiểm một hàng. `chuongTrinhCuaTruong` là tập id chương trình thật của trường. */
export function kiemHangDiemChuan(raw: unknown, chuongTrinhCuaTruong: ReadonlySet<string>, bayGio: Date): { ok: true; hang: HangDeXuat } | { ok: false; loi: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, loi: "Hàng phải là đối tượng {idChuongTrinh, nam, diem}" };
  const h = raw as Record<string, unknown>;
  const id = typeof h.idChuongTrinh === "string" ? h.idChuongTrinh.trim().toLowerCase() : "";
  if (!id || !chuongTrinhCuaTruong.has(id)) return { ok: false, loi: "idChuongTrinh không thuộc trường này (lấy id từ xem_du_lieu_truong)" };
  const nam = h.nam;
  if (typeof nam !== "number" || !Number.isInteger(nam) || nam < NAM_NHO_NHAT || nam > namToiDa(bayGio)) return { ok: false, loi: `nam phải là số nguyên từ ${NAM_NHO_NHAT} đến ${namToiDa(bayGio)}` };
  const diem = h.diem;
  const phuongThuc = typeof h.phuongThuc === "string" && h.phuongThuc.trim() ? lamSachChuMcp(h.phuongThuc).toUpperCase().replace(/\s+/g, "_") : "THPT";
  const { min, max } = thangDiem(phuongThuc);
  if (typeof diem !== "number" || !Number.isFinite(diem) || diem < min || diem > max) return { ok: false, loi: `diem ngoài thang của ${phuongThuc} (${min} đến ${max})` };
  const toHopTho = typeof h.toHop === "string" ? h.toHop.trim().toUpperCase() : "";
  const toHop = toHopTho === "" ? "KHONG" : toHopTho;
  if (!/^[A-Z0-9]{1,20}$/.test(toHop)) return { ok: false, loi: "toHop chỉ gồm chữ và số, tối đa 20 ký tự (ví dụ A00, hoặc KHONG)" };
  return { ok: true, hang: { idChuongTrinh: id, nam, diem: Math.round(diem * 100) / 100, phuongThuc, toHop } };
}

/** Chênh lệch lớn: nhảy quá NGAM_CHENH_LON điểm so với số đang công bố. Vẫn nhận, chỉ gắn cờ để người duyệt thấy. */
export const laChenhLon = (moi: number, cu: number | null) => cu !== null && Math.abs(moi - cu) > NGAM_CHENH_LON;

/**
 * JSON gọn cho kết quả công cụ: tối đa GIOI_HAN_KET_QUA ký tự. Nếu vượt thì cắt các mảng dài nhất cho tới khi vừa,
 * và ghi `daCat: true` để AI biết còn dữ liệu chưa hiện.
 */
export function gonKetQua(obj: Record<string, unknown>): string {
  const ban: Record<string, unknown> = { ...obj };
  let chuoi = JSON.stringify(ban);
  while (chuoi.length > GIOI_HAN_KET_QUA) {
    const mang = Object.entries(ban).filter((e): e is [string, unknown[]] => Array.isArray(e[1]) && e[1].length > 1).sort((a, b) => b[1].length - a[1].length)[0];
    if (!mang) break;
    ban[mang[0]] = mang[1].slice(0, Math.max(1, Math.floor(mang[1].length / 2)));
    ban.daCat = true;
    chuoi = JSON.stringify(ban);
  }
  return chuoi;
}
