// Passwords use PBKDF2-HMAC-SHA256 (100,000 rounds, WebCrypto). Legacy salted SHA-256 is accepted for login migration.
export const DO_DAI_TOI_THIEU = 8;
/** Bảng chữ cho mật khẩu tạm: bỏ ký tự dễ nhầm (0/O, 1/l/I). */
const BANG_CHU = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function maHoaB64Url(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function giaiB64Url(s: string): Uint8Array {
  const chuan = s.replace(/-/g, "+").replace(/_/g, "/");
  const nhi = atob(chuan + "=".repeat((4 - (chuan.length % 4)) % 4));
  return Uint8Array.from(nhi, (c) => c.charCodeAt(0));
}

/** So sánh hằng thời gian theo độ dài (độ dài khác thì sai, độ dài không phải bí mật). */
export function bangHangThoiGian(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let khac = 0;
  for (let i = 0; i < a.length; i++) khac |= a[i] ^ b[i];
  return khac === 0;
}

async function bam(matKhau: string, muoi: Uint8Array): Promise<Uint8Array> {
  const mk = new TextEncoder().encode(matKhau);
  const goc = new Uint8Array(muoi.length + mk.length);
  goc.set(muoi);
  goc.set(mk, muoi.length);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", goc));
}

const SO_VONG = 100_000;
async function keoKhoa(matKhau: string, muoi: Uint8Array, soVong = SO_VONG): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(matKhau), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: muoi as BufferSource, iterations: soVong }, key, 256));
}

export async function bamMatKhau(matKhau: string): Promise<string> {
  const muoi = crypto.getRandomValues(new Uint8Array(16));
  const b = await bam(matKhau, muoi);
  return `sha256$${maHoaB64Url(muoi)}$${maHoaB64Url(b)}`;
}

/** Đúng/sai. Chuỗi lưu hỏng hoặc rỗng thì sai (không ném lỗi). */
export async function xacMinhMatKhau(matKhau: string, daLuu: string | null | undefined): Promise<boolean> {
  const p = (daLuu ?? "").split("$");
  try {
    if (p.length === 3 && p[0] === "sha256") return bangHangThoiGian(await bam(matKhau, giaiB64Url(p[1])), giaiB64Url(p[2]));
    if (p.length === 4 && p[0] === "pbkdf2_sha256" && Number(p[1]) === SO_VONG) return bangHangThoiGian(await keoKhoa(matKhau, giaiB64Url(p[2])), giaiB64Url(p[3]));
    return false;
  } catch { return false; }
}

/** Lỗi của mật khẩu mới, hoặc null nếu dùng được. Chỉ cần đủ dài. */
export function loiMatKhauMoi(matKhau: unknown): string | null {
  if (typeof matKhau !== "string" || matKhau.length < DO_DAI_TOI_THIEU) return `Mật khẩu cần có ít nhất ${DO_DAI_TOI_THIEU} ký tự`;
  if (matKhau.length > 200) return "Mật khẩu tối đa 200 ký tự";
  return null;
}

/** Mật khẩu tạm 14 ký tự, lấy mẫu loại bỏ lệch từ bộ sinh số của hệ điều hành. */
export function sinhMatKhauTam(): string {
  const gioiHan = 256 - (256 % BANG_CHU.length);
  let ra = "";
  while (ra.length < 14) {
    for (const x of crypto.getRandomValues(new Uint8Array(32))) {
      if (x < gioiHan && ra.length < 14) ra += BANG_CHU[x % BANG_CHU.length];
    }
  }
  return ra;
}

/** Sinh mã khôi phục mật khẩu ngẫu nhiên 32 byte (64 ký tự hex) an toàn mật mã. */
export function taoTokenNgauNhien(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/** Băm SHA-256 dạng hex cho mã khôi phục để không bao giờ lưu mã gốc vào cơ sở dữ liệu. */
export async function bamToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token.trim()));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");
}

