import { taoIcs } from "../../src/engine/lich-ics";
import type { SuKienLich } from "../../src/engine/ket-noi-kieu";

export interface CauD1Lich {
  bind(...giaTri: unknown[]): CauD1Lich;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta?: { changes?: number } }>;
}
export interface D1Lich { prepare(sql: string): CauD1Lich }
export interface KvLich { get(khoa: string): Promise<string | null>; put(khoa: string, giaTri: string, options?: { expirationTtl?: number }): Promise<void> }
export interface EnvLich { DB?: D1Lich; RATE_KV?: KvLich }

const RE_KHOA = /^[a-f0-9]{48}$/;
const RE_GIO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+07:00$/;
const GIOI_HAN_SU_KIEN = 40;
const GIOI_HAN_THAN = 64_000;

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function bamKhoa(khoa: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(khoa))));
}
export function sinhKhoa(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

export const traLoiLichJson = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

function gioHopLe(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = RE_GIO.exec(value);
  if (!m) return false;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(mo) - 1 && date.getUTCDate() === Number(d)
    && date.getUTCHours() === Number(h) && date.getUTCMinutes() === Number(mi) && date.getUTCSeconds() === Number(s);
}

export function lamSachSuKien(value: unknown): SuKienLich[] | null {
  if (!Array.isArray(value) || value.length > GIOI_HAN_SU_KIEN) return null;
  const clean: SuKienLich[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const o = item as Record<string, unknown>;
    if (typeof o.tieuDe !== "string" || !o.tieuDe.trim() || o.tieuDe.length > 200
      || !gioHopLe(o.batDau) || !gioHopLe(o.ketThuc) || o.batDau >= o.ketThuc
      || (o.ghiChu !== undefined && (typeof o.ghiChu !== "string" || o.ghiChu.length > 500))
      || (o.taskId !== undefined && (typeof o.taskId !== "string" || !o.taskId || o.taskId.length > 120))) return null;
    clean.push({
      tieuDe: o.tieuDe.trim(), batDau: o.batDau, ketThuc: o.ketThuc,
      ...(typeof o.ghiChu === "string" && o.ghiChu ? { ghiChu: o.ghiChu } : {}),
      ...(typeof o.taskId === "string" ? { taskId: o.taskId } : {}),
    });
  }
  return clean.sort((a, b) => a.batDau.localeCompare(b.batDau));
}

async function docJsonNho(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > GIOI_HAN_THAN) return null;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > GIOI_HAN_THAN) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export function khoaQuanLyTuRequest(request: Request): string | null {
  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([a-f0-9]{48})$/.exec(auth);
  return match && RE_KHOA.test(match[1]) ? match[1] : null;
}

export async function xuLyTaoFeed(request: Request, env: EnvLich): Promise<Response> {
  if (request.method !== "POST") return traLoiLichJson({ loi: "Chỉ nhận POST" }, 405);
  if (!env.DB || !env.RATE_KV) return traLoiLichJson({ loi: "Dịch vụ lịch chưa sẵn sàng" }, 503);
  try {
    const ip = request.headers.get("cf-connecting-ip") ?? "khong-ro";
    const bucket = Math.floor(Date.now() / 3_600_000);
    const rateKey = `lich-feed-tao:${(await bamKhoa(ip)).slice(0, 20)}:${bucket}`;
    const count = Number(await env.RATE_KV.get(rateKey) ?? 0);
    if (count >= 5) return traLoiLichJson({ loi: "Em tạo lịch hơi nhiều lần, thử lại sau nhé." }, 429);
    await env.RATE_KV.put(rateKey, String(count + 1), { expirationTtl: 3700 });
  } catch { return traLoiLichJson({ loi: "Dịch vụ lịch đang tạm thời không sẵn sàng" }, 503); }

  const readKey = sinhKhoa();
  const writeKey = sinhKhoa();
  try {
    await env.DB.prepare("INSERT INTO lich_feed (ma_bam, quan_ly_bam, su_kien, cap_nhat) VALUES (?, ?, '[]', ?)")
      .bind(await bamKhoa(readKey), await bamKhoa(writeKey), Date.now()).run();
  } catch { return traLoiLichJson({ loi: "Chưa tạo được lịch cập nhật, em thử lại nhé." }, 503); }
  const feedUrl = new URL(`/api/lich/${readKey}.ics`, request.url).toString();
  return traLoiLichJson({ feedUrl, writeKey }, 201);
}

export async function xuLyCapNhatFeed(request: Request, env: EnvLich): Promise<Response> {
  if (request.method !== "PUT") return traLoiLichJson({ loi: "Chỉ nhận PUT" }, 405);
  if (!env.DB) return traLoiLichJson({ loi: "Dịch vụ lịch chưa sẵn sàng" }, 503);
  const writeKey = khoaQuanLyTuRequest(request);
  if (!writeKey) return traLoiLichJson({ loi: "Khóa quản lý không dùng được." }, 401);
  const body = await docJsonNho(request);
  const events = body ? lamSachSuKien(body.suKien) : null;
  if (!events) return traLoiLichJson({ loi: "Danh sách sự kiện chưa đúng định dạng." }, 400);
  try {
    const result = await env.DB.prepare("UPDATE lich_feed SET su_kien = ?, cap_nhat = ? WHERE quan_ly_bam = ?")
      .bind(JSON.stringify(events), Date.now(), await bamKhoa(writeKey)).run();
    if (!(result.meta?.changes ?? 0)) return traLoiLichJson({ loi: "Lịch này đã bị thu hồi hoặc không dùng được." }, 404);
    return traLoiLichJson({ ok: true });
  } catch { return traLoiLichJson({ loi: "Chưa cập nhật được lịch, em thử lại nhé." }, 503); }
}

export async function xuLyThuHoiFeed(request: Request, env: EnvLich): Promise<Response> {
  if (request.method !== "DELETE") return traLoiLichJson({ loi: "Chỉ nhận DELETE" }, 405);
  if (!env.DB) return traLoiLichJson({ loi: "Dịch vụ lịch chưa sẵn sàng" }, 503);
  const writeKey = khoaQuanLyTuRequest(request);
  if (!writeKey) return traLoiLichJson({ loi: "Khóa quản lý không dùng được." }, 401);
  try {
    const result = await env.DB.prepare("DELETE FROM lich_feed WHERE quan_ly_bam = ?").bind(await bamKhoa(writeKey)).run();
    if (!(result.meta?.changes ?? 0)) return traLoiLichJson({ loi: "Lịch này đã bị thu hồi hoặc không dùng được." }, 404);
    return traLoiLichJson({ ok: true });
  } catch { return traLoiLichJson({ loi: "Chưa thu hồi được lịch, em thử lại nhé." }, 503); }
}

export async function xuLyDocFeed(request: Request, env: EnvLich, readKey: unknown): Promise<Response> {
  if (request.method !== "GET") return traLoiLichJson({ loi: "Chỉ nhận GET" }, 405);
  if (!env.DB) return new Response("Dịch vụ lịch chưa sẵn sàng", { status: 503 });
  if (typeof readKey !== "string" || !RE_KHOA.test(readKey)) return new Response("Không tìm thấy lịch", { status: 404 });
  try {
    const row = await env.DB.prepare("SELECT su_kien FROM lich_feed WHERE ma_bam = ?").bind(await bamKhoa(readKey)).first<{ su_kien: string }>();
    if (!row) return new Response("Không tìm thấy lịch", { status: 404 });
    const events = lamSachSuKien(JSON.parse(row.su_kien));
    if (!events) return new Response("Lịch chưa sẵn sàng", { status: 503 });
    return new Response(taoIcs(events, "Kế hoạch tuần · Nguyện Vọng AI"), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": 'inline; filename="ke-hoach-tuan.ics"',
        "cache-control": "public, max-age=0, must-revalidate",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
      },
    });
  } catch { return new Response("Chưa lấy được lịch", { status: 503 }); }
}
