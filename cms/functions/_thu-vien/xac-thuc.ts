// Xác thực của CMS: email + mật khẩu, phiên bằng cookie ký HMAC-SHA256 (WebCrypto). Không dùng Cloudflare Access.
// Cookie `nv_cms` = base64url(JSON{e: email, h: hết hạn (giây), i: lúc cấp (giây)}) + "." + chữ ký. Mỗi yêu cầu vẫn tra bảng quan_tri.
import { LoiHttp } from "./phan-hoi";
import { giaiB64Url, maHoaB64Url } from "./mat-khau";
import type { Env, KhoKV } from "./kieu";

export const TEN_COOKIE = "nv_cms";
export const SONG_GIAY = 12 * 60 * 60;
export const TOI_DA_SAI = 5;
export const CUA_SO_SAI_GIAY = 15 * 60;
const KHOP_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export const chuanHoaEmail = (e: string) => e.trim().toLowerCase();
export const laEmail = (e: unknown): e is string => typeof e === "string" && e.length <= 320 && KHOP_EMAIL.test(e.trim());
export const laMayCucBo = (url: URL) => url.hostname === "localhost" || url.hostname === "127.0.0.1";
export const chuaDangNhap = (thongBao = "Chưa đăng nhập hoặc phiên đã hết hạn") => new LoiHttp(401, "chua-dang-nhap", thongBao);

/** Thiếu hoặc quá ngắn thì fail-closed. */
export function baoMat(env: Env): string {
  const s = env.SESSION_SECRET;
  if (!s || s.length < 16) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa cấu hình SESSION_SECRET");
  return s;
}

const khoaKy = (bi: string) => crypto.subtle.importKey("raw", new TextEncoder().encode(bi), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function kyPhien(env: Env, email: string, bayGio: Date): Promise<string> {
  const giay = Math.floor(bayGio.getTime() / 1000);
  const dau = maHoaB64Url(new TextEncoder().encode(JSON.stringify({ e: email, h: giay + SONG_GIAY, i: giay })));
  const ky = await crypto.subtle.sign("HMAC", await khoaKy(baoMat(env)), new TextEncoder().encode(dau));
  return `${dau}.${maHoaB64Url(new Uint8Array(ky))}`;
}

/** Trả {email, capLuc} nếu chữ ký đúng và chưa hết hạn, ngược lại null. */
export async function docPhien(env: Env, cookie: string, bayGio: Date): Promise<{ email: string; capLuc: number } | null> {
  const p = cookie.split(".");
  if (p.length !== 2 || !p[0] || !p[1]) return null;
  try {
    const dung = await crypto.subtle.verify("HMAC", await khoaKy(baoMat(env)), giaiB64Url(p[1]) as BufferSource, new TextEncoder().encode(p[0]));
    if (!dung) return null;
    const v = JSON.parse(new TextDecoder().decode(giaiB64Url(p[0]))) as { e?: unknown; h?: unknown; i?: unknown };
    if (typeof v.e !== "string" || typeof v.h !== "number" || typeof v.i !== "number" || v.h <= bayGio.getTime() / 1000) return null;
    return { email: v.e, capLuc: v.i };
  } catch (e) {
    if (e instanceof LoiHttp) throw e;
    return null;
  }
}

export function layCookie(request: Request): string | null {
  for (const phan of (request.headers.get("cookie") ?? "").split(";")) {
    const i = phan.indexOf("=");
    if (i > 0 && phan.slice(0, i).trim() === TEN_COOKIE) return phan.slice(i + 1).trim();
  }
  return null;
}

/** Giá trị header Set-Cookie. giaTri rỗng = xóa cookie. */
export function datCookie(url: URL, giaTri: string): string {
  const co = [`${TEN_COOKIE}=${giaTri}`, "HttpOnly", "SameSite=Strict", "Path=/", `Max-Age=${giaTri ? SONG_GIAY : 0}`];
  if (!laMayCucBo(url)) co.push("Secure");
  return co.join("; ");
}

/** Chống CSRF: yêu cầu ghi phải có Origin (hoặc Referer) cùng host. */
export function kiemOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const nguon = request.headers.get("origin") ?? request.headers.get("referer");
  let host = "";
  try { host = nguon ? new URL(nguon).host : ""; } catch { /* host rỗng -> từ chối */ }
  if (!host || host !== new URL(request.url).host) throw new LoiHttp(403, "khong-co-quyen", "Yêu cầu không đến từ trang quản trị");
}

// ---- Giới hạn đăng nhập sai: 5 lần/15 phút theo (IP + email), đếm bằng KV ----
const kvCua = (env: Env): KhoKV | undefined => env.KV_CONG_DONG ?? env.RATE_KV;
const khoaSai = (request: Request, email: string) => `dn:${request.headers.get("cf-connecting-ip") ?? "?"}:${email.slice(0, 200)}`;

/** Ném 429 nếu đã sai quá nhiều. KV lỗi thì không chặn, chỉ cảnh báo. */
export async function kiemSoLanSai(env: Env, request: Request, email: string): Promise<void> {
  const kv = kvCua(env);
  if (!kv) return;
  let dem = 0;
  try { dem = Number((await kv.get(khoaSai(request, email))) ?? 0); } catch { console.warn("cms-dang-nhap: KV lỗi, bỏ qua giới hạn"); return; }
  if (dem >= TOI_DA_SAI) throw new LoiHttp(429, "qua-nhanh", "Bạn nhập sai nhiều lần. Đợi 15 phút rồi thử lại.");
}
export async function ghiLanSai(env: Env, request: Request, email: string): Promise<void> {
  const kv = kvCua(env);
  if (!kv) return;
  try {
    const k = khoaSai(request, email);
    await kv.put(k, String(Number((await kv.get(k)) ?? 0) + 1), { expirationTtl: CUA_SO_SAI_GIAY });
  } catch { console.warn("cms-dang-nhap: KV lỗi, không ghi được lần sai"); }
}
export async function xoaLanSai(env: Env, request: Request, email: string): Promise<void> {
  try { await kvCua(env)?.put(khoaSai(request, email), "0", { expirationTtl: 60 }); } catch { /* bỏ qua */ }
}
