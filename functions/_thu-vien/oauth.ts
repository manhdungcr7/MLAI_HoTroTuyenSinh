// OAuth 2.1 cho MCP: đăng ký client động (RFC 7591), mã xác nhận một lần có PKCE S256, token truy cập 1 giờ,
// token làm mới 30 ngày có xoay vòng và phát hiện tái sử dụng (dùng lại thì thu hồi cả họ), thu hồi (RFC 7009).
// Danh tính là mã ghép nối của học sinh (128 bit, chỉ hiện một lần trong app). Người dùng dán mã ở trang đồng ý.
// Chỉ lưu SHA-256 của mã và token (migration 0011). Token gắn với một kết nối: xóa kết nối là token hết dùng ngay.
import { bamMa, xacThucMaBam, type EnvKetNoi, type KhoD1Ket } from "./ket-noi";

export const PHAM_VI = {
  "profile:read": "Xem hồ sơ (điểm thi, mục tiêu, khu vực, ngân sách)",
  "admissions:read": "Xem điểm chuẩn và gợi ý ngành",
  "preferences:read": "Xem danh sách nguyện vọng",
  "preferences:write": "Gửi đề xuất thêm nguyện vọng (em vẫn xác nhận trong app)",
  "study:read": "Xem kế hoạch học tuần",
} as const;
export type PhamVi = keyof typeof PHAM_VI;
export const TAT_CA_PHAM_VI = Object.keys(PHAM_VI) as PhamVi[];
export const TUOI_TOKEN_TRUY_CAP_GIAY = 3600;
export const TUOI_TOKEN_LAM_MOI_NGAY = 30;
export const TUOI_MA_XAC_NHAN_GIAY = 300;
const MS_GIAY = 1000;
const MS_NGAY = 86_400_000;
const RE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;
const RE_VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** Chuỗi ngẫu nhiên an toàn, base64url, 32 byte (43 ký tự). */
export function sinhChuoiNgauNhien(bytes = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return b64url(b);
}

/** S256 của verifier (base64url không đệm), so sánh với code_challenge đã lưu. */
export async function s256(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
}

/** redirect_uri: https, hoặc http loopback (localhost / 127.0.0.1) theo RFC 8252; không có fragment; tối đa 300 ký tự. */
export function laRedirectHopLe(uri: unknown): uri is string {
  if (typeof uri !== "string" || uri.length > 300) return false;
  let u: URL;
  try { u = new URL(uri); } catch { return false; }
  if (u.hash) return false;
  if (u.protocol === "https:") return true;
  return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
}

/** Chuỗi phạm vi (cách nhau bằng khoảng trắng). Trống thì cấp đủ. Phạm vi lạ thì từ chối. */
export function kiemTraPhamVi(chuoi: unknown): { ok: true; v: PhamVi[] } | { ok: false; loi: string } {
  if (chuoi === undefined || chuoi === null || chuoi === "") return { ok: true, v: TAT_CA_PHAM_VI };
  if (typeof chuoi !== "string" || chuoi.length > 300) return { ok: false, loi: "Phạm vi không hợp lệ" };
  const ds = [...new Set(chuoi.split(" ").filter(Boolean))];
  const la = ds.filter((p): p is PhamVi => (TAT_CA_PHAM_VI as string[]).includes(p));
  if (la.length !== ds.length) return { ok: false, loi: "Phạm vi không hợp lệ" };
  return { ok: true, v: la };
}

/** Kiểm tra tham số của yêu cầu xin mã (đã đọc từ query hoặc form). Trả về tham số đã làm sạch. */
export interface ThamSoXacThuc { clientId: string; redirectUri: string; challenge: string; state?: string; phamVi: PhamVi[]; resource?: string }
export function kiemTraThamSoXacThuc(t: Record<string, unknown>, origin: string): { ok: true; v: ThamSoXacThuc } | { ok: false; loi: string; chiTietClient?: boolean } {
  if (typeof t.client_id !== "string" || t.client_id.length > 64) return { ok: false, loi: "client_id không hợp lệ", chiTietClient: true };
  if (!laRedirectHopLe(t.redirect_uri)) return { ok: false, loi: "redirect_uri không hợp lệ", chiTietClient: true };
  if (t.response_type !== "code") return { ok: false, loi: "response_type phải là code" };
  if (t.code_challenge_method !== "S256") return { ok: false, loi: "Chỉ hỗ trợ code_challenge_method=S256" };
  if (typeof t.code_challenge !== "string" || !RE_CHALLENGE.test(t.code_challenge)) return { ok: false, loi: "code_challenge không hợp lệ" };
  if (t.state !== undefined && (typeof t.state !== "string" || t.state.length > 512)) return { ok: false, loi: "state không hợp lệ" };
  // resource (RFC 8707): nếu có thì phải trỏ đúng tới máy chủ MCP này, không cấp token cho nơi khác.
  if (t.resource !== undefined && t.resource !== `${origin}/mcp`) return { ok: false, loi: "resource không đúng máy chủ MCP này" };
  const pv = kiemTraPhamVi(t.scope);
  if (!pv.ok) return { ok: false, loi: pv.loi };
  return { ok: true, v: { clientId: t.client_id, redirectUri: t.redirect_uri, challenge: t.code_challenge, state: t.state as string | undefined, phamVi: pv.v, resource: t.resource as string | undefined } };
}

interface HangClient { client_id: string; ten: string; redirect_uris: string }

export async function timClient(db: KhoD1Ket, clientId: string): Promise<{ id: string; ten: string; uris: string[] } | null> {
  const r = await db.prepare("SELECT client_id, ten, redirect_uris FROM oauth_client WHERE client_id = ?").bind(clientId).first<HangClient>();
  if (!r) return null;
  return { id: r.client_id, ten: r.ten, uris: JSON.parse(r.redirect_uris) as string[] };
}

/** Đăng ký client động. Client công khai (không có bí mật), chỉ dùng PKCE. */
export async function dangKyClient(db: KhoD1Ket, ten: string, uris: string[], bayGio: number = Date.now()): Promise<string> {
  const id = sinhChuoiNgauNhien(18);
  await db.prepare("INSERT INTO oauth_client (client_id, ten, redirect_uris, tao_luc) VALUES (?, ?, ?, ?)")
    .bind(id, ten, JSON.stringify(uris), bayGio).run();
  return id;
}

/** Tạo mã xác nhận một lần gắn với kết nối (qua ma_bam). Trả về mã thô để gửi cho client; D1 chỉ giữ hash. */
export async function taoMaXacNhan(db: KhoD1Ket, p: { keBam: string; clientId: string; redirectUri: string; challenge: string; phamVi: PhamVi[] }, bayGio: number = Date.now()): Promise<string> {
  const ma = sinhChuoiNgauNhien(32);
  await db.prepare("INSERT INTO oauth_ma_xac_nhan (ma_bam, ket_noi_bam, client_id, redirect_uri, thach_thuc, pham_vi, het_han, da_dung) VALUES (?, ?, ?, ?, ?, ?, ?, 0)")
    .bind(await bamMa(ma), p.keBam, p.clientId, p.redirectUri, p.challenge, p.phamVi.join(" "), bayGio + TUOI_MA_XAC_NHAN_GIAY * MS_GIAY).run();
  return ma;
}

export interface KetQuaToken { access_token: string; token_type: "Bearer"; expires_in: number; refresh_token: string; scope: string }
export type LoiToken = { loi: "invalid_grant" | "invalid_client" | "invalid_request" | "server_error"; moTa: string };

async function capToken(db: KhoD1Ket, p: { keBam: string; clientId: string; ho: string; phamVi: string }, bayGio: number): Promise<KetQuaToken> {
  const at = sinhChuoiNgauNhien(32), rt = sinhChuoiNgauNhien(32);
  const hetAt = bayGio + TUOI_TOKEN_TRUY_CAP_GIAY * MS_GIAY, hetRt = bayGio + TUOI_TOKEN_LAM_MOI_NGAY * MS_NGAY;
  await db.batch([
    db.prepare("INSERT INTO oauth_token (token_bam, loai, ket_noi_bam, client_id, ho, pham_vi, het_han, thu_hoi, tao_luc) VALUES (?, 'access', ?, ?, ?, ?, ?, 0, ?)")
      .bind(await bamMa(at), p.keBam, p.clientId, p.ho, p.phamVi, hetAt, bayGio),
    db.prepare("INSERT INTO oauth_token (token_bam, loai, ket_noi_bam, client_id, ho, pham_vi, het_han, thu_hoi, tao_luc) VALUES (?, 'refresh', ?, ?, ?, ?, ?, 0, ?)")
      .bind(await bamMa(rt), p.keBam, p.clientId, p.ho, p.phamVi, hetRt, bayGio),
  ]);
  return { access_token: at, token_type: "Bearer", expires_in: TUOI_TOKEN_TRUY_CAP_GIAY, refresh_token: rt, scope: p.phamVi };
}

/** Đổi mã xác nhận lấy token. Mã dùng một lần: UPDATE có điều kiện da_dung = 0 để hai yêu cầu song song không cùng thắng. */
export async function doiMaLayToken(env: EnvKetNoi, p: { ma: string; clientId: string; redirectUri: string; verifier: string }, bayGio: number = Date.now()): Promise<{ ok: true; token: KetQuaToken } | { ok: false; loi: LoiToken }> {
  if (!env.DB) return { ok: false, loi: { loi: "server_error", moTa: "Dịch vụ chưa sẵn sàng" } };
  const db = env.DB;
  const maBam = await bamMa(p.ma);
  const r = await db.prepare("SELECT ket_noi_bam, client_id, redirect_uri, thach_thuc, pham_vi, het_han, da_dung FROM oauth_ma_xac_nhan WHERE ma_bam = ?")
    .bind(maBam).first<{ ket_noi_bam: string; client_id: string; redirect_uri: string; thach_thuc: string; pham_vi: string; het_han: number; da_dung: number }>();
  if (!r || r.da_dung || Number(r.het_han) <= bayGio) return { ok: false, loi: { loi: "invalid_grant", moTa: "Mã xác nhận không đúng hoặc đã dùng" } };
  if (r.client_id !== p.clientId || r.redirect_uri !== p.redirectUri) return { ok: false, loi: { loi: "invalid_grant", moTa: "client hoặc redirect_uri không khớp" } };
  if (!RE_VERIFIER.test(p.verifier) || await s256(p.verifier) !== r.thach_thuc) return { ok: false, loi: { loi: "invalid_grant", moTa: "code_verifier không khớp" } };
  const danh = await db.prepare("UPDATE oauth_ma_xac_nhan SET da_dung = 1 WHERE ma_bam = ? AND da_dung = 0").bind(maBam).run();
  if ((danh.meta?.changes ?? 0) !== 1) return { ok: false, loi: { loi: "invalid_grant", moTa: "Mã xác nhận đã được dùng" } };
  const xt = await xacThucMaBam(env, r.ket_noi_bam, bayGio);
  if (!xt.ok) return { ok: false, loi: { loi: "invalid_grant", moTa: "Kết nối không còn hiệu lực, hãy kết nối lại trong app" } };
  const token = await capToken(db, { keBam: r.ket_noi_bam, clientId: r.client_id, ho: sinhChuoiNgauNhien(12), phamVi: r.pham_vi }, bayGio);
  return { ok: true, token };
}

/** Làm mới: token cũ bị đánh dấu đã dùng và cấp cặp mới cùng họ. Dùng lại token đã xoay thì thu hồi cả họ. */
export async function lamMoiToken(env: EnvKetNoi, p: { refreshToken: string; clientId: string }, bayGio: number = Date.now()): Promise<{ ok: true; token: KetQuaToken } | { ok: false; loi: LoiToken }> {
  if (!env.DB) return { ok: false, loi: { loi: "server_error", moTa: "Dịch vụ chưa sẵn sàng" } };
  const db = env.DB;
  const r = await db.prepare("SELECT ket_noi_bam, client_id, ho, pham_vi, het_han, thu_hoi FROM oauth_token WHERE token_bam = ? AND loai = 'refresh'")
    .bind(await bamMa(p.refreshToken)).first<{ ket_noi_bam: string; client_id: string; ho: string; pham_vi: string; het_han: number; thu_hoi: number }>();
  if (!r || r.client_id !== p.clientId) return { ok: false, loi: { loi: "invalid_grant", moTa: "Token làm mới không đúng" } };
  if (Number(r.thu_hoi) === 1) {
    // Token đã xoay mà còn được dùng lại: có thể bị đánh cắp, thu hồi cả họ.
    await db.prepare("UPDATE oauth_token SET thu_hoi = 1 WHERE ho = ?").bind(r.ho).run();
    return { ok: false, loi: { loi: "invalid_grant", moTa: "Token làm mới đã dùng; mọi token của phiên này đã bị thu hồi" } };
  }
  if (Number(r.het_han) <= bayGio) return { ok: false, loi: { loi: "invalid_grant", moTa: "Token làm mới đã hết hạn" } };
  const xt = await xacThucMaBam(env, r.ket_noi_bam, bayGio);
  if (!xt.ok) return { ok: false, loi: { loi: "invalid_grant", moTa: "Kết nối không còn hiệu lực" } };
  const danh = await db.prepare("UPDATE oauth_token SET thu_hoi = 1 WHERE token_bam = ? AND thu_hoi = 0").bind(await bamMa(p.refreshToken)).run();
  if ((danh.meta?.changes ?? 0) !== 1) return { ok: false, loi: { loi: "invalid_grant", moTa: "Token làm mới đã dùng" } };
  const token = await capToken(db, { keBam: r.ket_noi_bam, clientId: r.client_id, ho: r.ho, phamVi: r.pham_vi }, bayGio);
  return { ok: true, token };
}

/** Thu hồi token (access hoặc refresh). Luôn trả thành công theo RFC 7009: không tiết lộ token có tồn tại hay không. */
export async function thuHoiToken(db: KhoD1Ket, token: string): Promise<void> {
  const bam = await bamMa(token);
  const r = await db.prepare("SELECT ho, loai FROM oauth_token WHERE token_bam = ?").bind(bam).first<{ ho: string; loai: string }>();
  if (!r) return;
  // Thu hồi token làm mới là thu hồi cả họ (cả token truy cập đang dùng).
  if (r.loai === "refresh") await db.prepare("UPDATE oauth_token SET thu_hoi = 1 WHERE ho = ?").bind(r.ho).run();
  else await db.prepare("UPDATE oauth_token SET thu_hoi = 1 WHERE token_bam = ?").bind(bam).run();
}

/** Tra token truy cập: trả về kết nối và phạm vi, hoặc null nếu hết hạn, đã thu hồi hoặc kết nối không còn. */
export async function tokenTruyCap(env: EnvKetNoi, token: string, bayGio: number = Date.now()): Promise<{ ok: true; keBam: string; phamVi: PhamVi[]; hang: Extract<Awaited<ReturnType<typeof xacThucMaBam>>, { ok: true }>["hang"] } | { ok: false }> {
  if (!env.DB) return { ok: false };
  // Lỗi D1 (ví dụ bảng chưa có khi chưa áp migration) coi như token không hợp lệ: không làm lộ lỗi và không trả 500.
  let r: { ket_noi_bam: string; pham_vi: string; het_han: number } | null;
  try {
    r = await env.DB.prepare("SELECT ket_noi_bam, pham_vi, het_han FROM oauth_token WHERE token_bam = ? AND loai = 'access' AND thu_hoi = 0")
      .bind(await bamMa(token)).first<{ ket_noi_bam: string; pham_vi: string; het_han: number }>();
  } catch { return { ok: false }; }
  if (!r || Number(r.het_han) <= bayGio) return { ok: false };
  const xt = await xacThucMaBam(env, r.ket_noi_bam, bayGio);
  if (!xt.ok) return { ok: false };
  return { ok: true, keBam: r.ket_noi_bam, phamVi: r.pham_vi.split(" ").filter((p): p is PhamVi => (TAT_CA_PHAM_VI as string[]).includes(p)), hang: xt.hang };
}
