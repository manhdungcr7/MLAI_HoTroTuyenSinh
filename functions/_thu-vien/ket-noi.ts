// Kết nối Claude/ChatGPT: mã ghép nối, xác thực, bản chụp và đề xuất (D1, migration 0009).
// Mã 128 bit chỉ hiện một lần cho người dùng; máy chủ chỉ giữ SHA-256 của mã. Hết hạn sau 30 ngày.
// Mỗi mã chỉ chạm dữ liệu của chính nó (mọi truy vấn lọc theo ma_bam). Giới hạn 60 yêu cầu/phút mỗi mã bằng RATE_KV;
// KV lỗi hoặc thiếu binding thì từ chối (fail-closed), không để mã bị dò thoải mái.
import { lamSachBanChup, GIOI_HAN_BAN_CHUP, type BanChup, type DeXuat, type LoaiDeXuat } from "../../src/engine/ket-noi-kieu";
import { docChuGioiHan, ThanQuaLon } from "./doc-body";

export interface CauD1Ket {
  bind(...g: unknown[]): CauD1Ket;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface KhoD1Ket { prepare(sql: string): CauD1Ket; batch(c: CauD1Ket[]): Promise<{ meta?: { changes?: number } }[]> }
export interface KhoKVKet {
  get(khoa: string): Promise<string | null>;
  put(khoa: string, giaTri: string, tuyChon?: { expirationTtl?: number }): Promise<void>;
}
export interface EnvKetNoi { DB?: KhoD1Ket; RATE_KV?: KhoKVKet }

export const HET_HAN_NGAY = 30;
export const GIOI_HAN_YEU_CAU_PHUT = 60;
export const TOI_DA_DE_XUAT_CHO = 10;
export const LOI_MA = "Mã kết nối không dùng được. Kiểm tra lại liên kết trong ứng dụng Nguyện Vọng AI, hoặc tạo kết nối mới.";
const MS_NGAY = 86_400_000;
const RE_MA = /^[a-f0-9]{32}$/;

export const laMa = (x: unknown): x is string => typeof x === "string" && RE_MA.test(x);
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

/** Mã ghép nối: 32 ký tự hex, 128 bit ngẫu nhiên. */
export function sinhMa(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return hex(b);
}

/** Băm SHA-256 của mã: đây là thứ duy nhất được lưu trong D1. */
export async function bamMa(ma: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ma))));
}

export const traJson = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export interface HangKetNoi { maBam: string; banChup: BanChup; hetHan: number; soTruyCap: number; lanCuoi: number | null; db: KhoD1Ket }
export type KetQuaXacThuc = { ok: true; hang: HangKetNoi } | { ok: false; status: number; loi: string };

/** Xác thực mã: kiểm định dạng, giới hạn tần suất, rồi tra D1 theo hash (mã hết hạn hoặc đã thu hồi coi như không tồn tại). */
export async function xacThuc(env: EnvKetNoi, ma: unknown, bayGio: number = Date.now()): Promise<KetQuaXacThuc> {
  if (!laMa(ma)) return { ok: false, status: 404, loi: LOI_MA };
  if (!env.DB) return { ok: false, status: 503, loi: "Dịch vụ kết nối chưa sẵn sàng" };
  if (!env.RATE_KV) return { ok: false, status: 503, loi: "Dịch vụ kết nối chưa sẵn sàng" };
  const maBam = await bamMa(ma);
  const db = env.DB;
  try {
    const khoa = `kn:${maBam.slice(0, 24)}:${Math.floor(bayGio / 60_000)}`;
    const dem = Number((await env.RATE_KV.get(khoa)) ?? 0);
    if (dem >= GIOI_HAN_YEU_CAU_PHUT) return { ok: false, status: 429, loi: "Bạn gửi yêu cầu hơi nhanh, đợi một phút rồi thử lại nhé" };
    await env.RATE_KV.put(khoa, String(dem + 1), { expirationTtl: 120 });
    const r = await db.prepare("SELECT ban_chup, het_han, so_truy_cap, lan_cuoi FROM ket_noi_ai WHERE ma_bam = ? AND het_han > ?")
      .bind(maBam, bayGio).first<{ ban_chup: string; het_han: number; so_truy_cap: number; lan_cuoi: number | null }>();
    if (!r) return { ok: false, status: 404, loi: LOI_MA };
    await db.prepare("UPDATE ket_noi_ai SET so_truy_cap = so_truy_cap + 1, lan_cuoi = ? WHERE ma_bam = ?").bind(bayGio, maBam).run();
    const banChup = JSON.parse(r.ban_chup) as BanChup;
    return { ok: true, hang: { maBam, banChup, hetHan: Number(r.het_han), soTruyCap: Number(r.so_truy_cap), lanCuoi: r.lan_cuoi === null ? null : Number(r.lan_cuoi), db } };
  } catch {
    return { ok: false, status: 503, loi: "Dịch vụ kết nối đang tạm thời không sẵn sàng" };
  }
}

/** Mã trong header x-ket-noi (dùng cho app gọi các API quản lý). */
export const maTuHeader = (request: Request): unknown => request.headers.get("x-ket-noi");

export type KetQuaDocBanChup = { ok: true; banChup: BanChup } | { ok: false; loi: string };

/** Đọc thân { banChup } từ app, không tin dữ liệu gửi lên: giới hạn byte, làm sạch qua lamSachBanChup. */
export async function docBanChup(request: Request): Promise<KetQuaDocBanChup> {
  let chu: string;
  try {
    chu = await docChuGioiHan(request, GIOI_HAN_BAN_CHUP.byte + 4096);
  } catch (e) {
    return { ok: false, loi: e instanceof ThanQuaLon ? "Bản chụp quá lớn, tối đa 64.000 byte" : "Nội dung gửi lên không hợp lệ" };
  }
  let v: unknown;
  try { v = JSON.parse(chu); } catch { return { ok: false, loi: "Nội dung gửi lên không hợp lệ" }; }
  const ban = v && typeof v === "object" ? lamSachBanChup((v as Record<string, unknown>).banChup) : null;
  if (!ban) return { ok: false, loi: "Bản chụp không đúng định dạng hoặc quá 64.000 byte" };
  return { ok: true, banChup: ban };
}

/** Tạo mã mới và lưu bản chụp. Dọn kết nối đã hết hạn trong cùng một giao dịch. */
export async function taoKetNoi(db: KhoD1Ket, banChup: BanChup, bayGio: number = Date.now()): Promise<{ ma: string; hetHan: number }> {
  const ma = sinhMa();
  const maBam = await bamMa(ma);
  const hetHan = bayGio + HET_HAN_NGAY * MS_NGAY;
  await db.batch([
    db.prepare("DELETE FROM ket_noi_de_xuat WHERE ma_bam IN (SELECT ma_bam FROM ket_noi_ai WHERE het_han <= ?)").bind(bayGio),
    db.prepare("DELETE FROM ket_noi_ai WHERE het_han <= ?").bind(bayGio),
    db.prepare("INSERT INTO ket_noi_ai (ma_bam, ban_chup, cap_nhat, tao_luc, het_han, so_truy_cap, lan_cuoi) VALUES (?, ?, ?, ?, ?, 0, NULL)")
      .bind(maBam, JSON.stringify(banChup), banChup.capNhat, bayGio, hetHan),
  ]);
  return { ma, hetHan };
}

/** Thay bản chụp của mã đang hợp lệ. Trả false nếu mã đã hết hạn giữa chừng. */
export async function doiBanChup(db: KhoD1Ket, maBam: string, banChup: BanChup, bayGio: number = Date.now()): Promise<boolean> {
  const kq = await db.prepare("UPDATE ket_noi_ai SET ban_chup = ?, cap_nhat = ? WHERE ma_bam = ? AND het_han > ?")
    .bind(JSON.stringify(banChup), banChup.capNhat, maBam, bayGio).run();
  return (kq.meta?.changes ?? 0) > 0;
}

/** Xóa bản chụp, đề xuất và chính mã. */
export async function xoaKetNoi(db: KhoD1Ket, maBam: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM ket_noi_de_xuat WHERE ma_bam = ?").bind(maBam),
    db.prepare("DELETE FROM ket_noi_ai WHERE ma_bam = ?").bind(maBam),
  ]);
}

/** Đề xuất đang chờ xác nhận, mới nhất trước (tối đa 20). */
export async function danhSachDeXuatCho(db: KhoD1Ket, maBam: string): Promise<DeXuat[]> {
  const r = await db.prepare("SELECT id, loai, tom_tat, du_lieu, tao_luc FROM ket_noi_de_xuat WHERE ma_bam = ? AND trang_thai = 'cho' ORDER BY tao_luc DESC LIMIT 20")
    .bind(maBam).all<{ id: string; loai: string; tom_tat: string; du_lieu: string; tao_luc: number }>();
  return r.results.map((d) => ({
    id: d.id,
    loai: d.loai as LoaiDeXuat,
    tomTat: d.tom_tat,
    duLieu: JSON.parse(d.du_lieu) as DeXuat["duLieu"],
    taoLuc: Number(d.tao_luc),
  }));
}

/** Đánh dấu một đề xuất đang chờ. Việc đổi dữ liệu thật do app làm. Trả false nếu không có đề xuất chờ nào khớp. */
export async function quyetDinhDeXuat(db: KhoD1Ket, maBam: string, id: string, quyetDinh: "xac-nhan" | "tu-choi"): Promise<boolean> {
  const kq = await db.prepare("UPDATE ket_noi_de_xuat SET trang_thai = ? WHERE id = ? AND ma_bam = ? AND trang_thai = 'cho'")
    .bind(quyetDinh, id, maBam).run();
  return (kq.meta?.changes ?? 0) > 0;
}
