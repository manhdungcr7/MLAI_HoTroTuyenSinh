// Xác thực JWT của Cloudflare Access (header Cf-Access-Jwt-Assertion) bằng WebCrypto, không thêm gói.
// Kiểm: chữ ký RS256 theo JWKS của team domain, aud, iss, exp (và nbf), rồi lấy email.
// Giả danh dev chỉ bật khi GIA_DANH_DEV === '1' VÀ hostname của yêu cầu là localhost/127.0.0.1.
import { LoiHttp } from "./phan-hoi";
import type { Env, TuyChon } from "./kieu";

const THOI_HAN_BO_NHO_MS = 60 * 60 * 1000;
const CACH_LAM_MOI_TOI_THIEU_MS = 60 * 1000;
const KHOP_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

interface Jwk { kid?: string; kty?: string; n?: string; e?: string; alg?: string }
interface BoNho { luc: number; khoa: Map<string, CryptoKey> }
const boNho = new Map<string, BoNho>();

/** Dùng cho test. */
export const xoaBoNhoJwks = () => boNho.clear();

export const chuanHoaEmail = (e: string) => e.trim().toLowerCase();
export const laEmail = (e: unknown): e is string => typeof e === "string" && e.length <= 320 && KHOP_EMAIL.test(e.trim());

function giaiBase64Url(s: string): Uint8Array {
  const chuan = s.replace(/-/g, "+").replace(/_/g, "/");
  const nhi = atob(chuan + "=".repeat((4 - (chuan.length % 4)) % 4));
  return Uint8Array.from(nhi, (c) => c.charCodeAt(0));
}
function giaiJson(s: string): Record<string, unknown> {
  const v = JSON.parse(new TextDecoder().decode(giaiBase64Url(s)));
  if (typeof v !== "object" || v === null || Array.isArray(v)) throw new Error("không phải đối tượng");
  return v as Record<string, unknown>;
}

export const tenMienNhom = (t: string) => t.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

async function nhapKhoa(j: Jwk): Promise<CryptoKey | null> {
  if (j.kty !== "RSA" || !j.n || !j.e) return null;
  try {
    return await crypto.subtle.importKey("jwk", { kty: "RSA", n: j.n, e: j.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  } catch { return null; }
}

async function taiJwks(tenMien: string, f: typeof fetch, bayGio: number): Promise<BoNho> {
  let r: Response;
  try { r = await f(`https://${tenMien}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(8000) }); } catch { throw new LoiHttp(503, "khong-lay-duoc-khoa", "Chưa lấy được khóa xác thực của Cloudflare Access, thử lại sau"); }
  if (!r.ok) throw new LoiHttp(503, "khong-lay-duoc-khoa", "Chưa lấy được khóa xác thực của Cloudflare Access, thử lại sau");
  let d: { keys?: Jwk[] };
  try { d = (await r.json()) as { keys?: Jwk[] }; } catch { throw new LoiHttp(503, "khong-lay-duoc-khoa", "Khóa xác thực của Cloudflare Access không đọc được"); }
  const khoa = new Map<string, CryptoKey>();
  for (const j of Array.isArray(d.keys) ? d.keys : []) {
    if (!j.kid) continue;
    const k = await nhapKhoa(j);
    if (k) khoa.set(j.kid, k);
  }
  const bn = { luc: bayGio, khoa };
  boNho.set(tenMien, bn);
  return bn;
}

async function timKhoa(tenMien: string, kid: string, f: typeof fetch, bayGio: number): Promise<CryptoKey | null> {
  let bn = boNho.get(tenMien);
  if (!bn || bayGio - bn.luc > THOI_HAN_BO_NHO_MS) bn = await taiJwks(tenMien, f, bayGio);
  const co = bn.khoa.get(kid);
  if (co) return co;
  // kid lạ: có thể Access vừa xoay khóa, tải lại một lần (không quá một lần mỗi phút để khỏi bị kẻ gửi kid bừa làm quá tải)
  if (bayGio - bn.luc < CACH_LAM_MOI_TOI_THIEU_MS) return null;
  bn = await taiJwks(tenMien, f, bayGio);
  return bn.khoa.get(kid) ?? null;
}

const tuChoi = (thongBao = "Chưa đăng nhập hoặc phiên đã hết hạn") => new LoiHttp(401, "chua-dang-nhap", thongBao);

export const laMayCucBo = (url: URL) => url.hostname === "localhost" || url.hostname === "127.0.0.1";

/** Trả email (chữ thường) của người đã qua Access. Ném LoiHttp 401/500/503 nếu không hợp lệ. */
export async function xacThucAccess(request: Request, env: Env, o: TuyChon = {}): Promise<{ email: string; giaDanh: boolean }> {
  const url = new URL(request.url);
  if (env.GIA_DANH_DEV === "1" && laMayCucBo(url)) {
    const e = request.headers.get("x-gia-danh") ?? "";
    if (!laEmail(e)) throw tuChoi("Thiếu hoặc sai header X-Gia-Danh (chế độ giả danh dev)");
    return { email: chuanHoaEmail(e), giaDanh: true };
  }
  const tenMien = env.TEAM_DOMAIN ? tenMienNhom(env.TEAM_DOMAIN) : "";
  if (!tenMien || !env.ACCESS_AUD) throw new LoiHttp(500, "chua-cau-hinh", "Máy chủ chưa cấu hình TEAM_DOMAIN và ACCESS_AUD");

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw tuChoi();
  const phan = token.split(".");
  if (phan.length !== 3 || phan.some((p) => !p)) throw tuChoi();
  let dau: Record<string, unknown>, noiDung: Record<string, unknown>, chuKy: Uint8Array;
  try { dau = giaiJson(phan[0]); noiDung = giaiJson(phan[1]); chuKy = giaiBase64Url(phan[2]); } catch { throw tuChoi(); }
  if (dau.alg !== "RS256" || typeof dau.kid !== "string") throw tuChoi();

  const bayGio = (o.bayGio ?? new Date()).getTime();
  const khoa = await timKhoa(tenMien, dau.kid, o.fetch ?? fetch, bayGio);
  if (!khoa) throw tuChoi();
  const dung = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", khoa, chuKy as BufferSource, new TextEncoder().encode(`${phan[0]}.${phan[1]}`));
  if (!dung) throw tuChoi();

  const giay = bayGio / 1000;
  const aud = noiDung.aud;
  if (!(aud === env.ACCESS_AUD || (Array.isArray(aud) && aud.includes(env.ACCESS_AUD)))) throw tuChoi("Phiên đăng nhập không dành cho ứng dụng này");
  if (noiDung.iss !== `https://${tenMien}`) throw tuChoi("Phiên đăng nhập không đến từ nhóm Access này");
  if (typeof noiDung.exp !== "number" || noiDung.exp <= giay) throw tuChoi();
  if (typeof noiDung.nbf === "number" && noiDung.nbf > giay + 30) throw tuChoi();
  if (!laEmail(noiDung.email)) throw tuChoi("Phiên đăng nhập không có email");
  return { email: chuanHoaEmail(noiDung.email), giaDanh: false };
}
