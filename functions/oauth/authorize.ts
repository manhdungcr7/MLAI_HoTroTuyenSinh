// GET /oauth/authorize: trang đồng ý. POST: học sinh dán mã kết nối và chọn Đồng ý / Từ chối, máy chủ cấp mã xác nhận rồi chuyển hướng về client.
// Client hoặc redirect_uri sai thì KHÔNG chuyển hướng (tránh mở chuyển hướng); chỉ hiện trang lỗi.
import { xacThuc, type EnvKetNoi } from "../_thu-vien/ket-noi";
import { kiemTraThamSoXacThuc, taoMaXacNhan, timClient } from "../_thu-vien/oauth";
import { docForm, giuTanSuat, ipYeuCau } from "../_thu-vien/oauth-cong";
import { trangDongY, trangLoi } from "../_thu-vien/oauth-trang";

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
};
const html = (body: string, status = 200) => new Response(body, { status, headers: HTML_HEADERS });
const RE_MA = /^[a-f0-9]{32}$/;
const THAM_SO = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state", "scope", "resource"] as const;

function chuyenHuong(redirectUri: string, tham: Record<string, string>): Response {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(tham)) u.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { location: u.toString(), "cache-control": "no-store" } });
}

function layThamSo(src: Record<string, unknown>): Record<string, string> {
  const v: Record<string, string> = {};
  for (const k of THAM_SO) if (typeof src[k] === "string") v[k] = src[k] as string;
  return v;
}

export async function xuLyAuthorize(request: Request, env: EnvKetNoi, method: "GET" | "POST"): Promise<Response> {
  const ip = ipYeuCau(request);
  const phut = Math.floor(Date.now() / 60_000);
  if (!await giuTanSuat(env, `oa-ua:${ip}:${phut}`, 30, 120)) return html(trangLoi("Bạn thử quá nhiều lần, đợi một phút rồi thử lại."), 429);
  if (!env.DB) return html(trangLoi("Dịch vụ kết nối chưa sẵn sàng."), 503);

  const origin = new URL(request.url).origin;
  let src: Record<string, unknown>;
  if (method === "GET") {
    src = Object.fromEntries(new URL(request.url).searchParams);
  } else {
    const f = await docForm(request);
    if (!f) return html(trangLoi("Yêu cầu không hợp lệ."), 400);
    src = f;
  }

  const kt = kiemTraThamSoXacThuc(src, origin);
  const client = typeof src.client_id === "string" ? await timClient(env.DB, src.client_id) : null;
  if (!client || typeof src.redirect_uri !== "string" || !client.uris.includes(src.redirect_uri)) {
    return html(trangLoi("Ứng dụng này chưa được đăng ký đúng, hoặc địa chỉ chuyển hướng không khớp."), 400);
  }
  const thamDi = layThamSo(src);
  if (!kt.ok) {
    // Lỗi tham số khi redirect_uri đã hợp lệ: chuyển lỗi về client theo đúng RFC 6749 §4.1.2.1.
    return chuyenHuong(src.redirect_uri, { error: "invalid_request", error_description: kt.loi, ...(thamDi.state ? { state: thamDi.state } : {}) });
  }
  const t = kt.v;

  if (method === "GET") {
    return html(trangDongY({ tenUngDung: client.ten, phamVi: t.phamVi, thamSo: thamDi }));
  }

  // POST: quyết định của học sinh.
  if (src.quyet === "tu-choi") {
    return chuyenHuong(t.redirectUri, { error: "access_denied", ...(t.state ? { state: t.state } : {}) });
  }
  const ma = typeof src.ma === "string" ? src.ma.trim().toLowerCase() : "";
  if (!RE_MA.test(ma)) {
    return html(trangDongY({ tenUngDung: client.ten, phamVi: t.phamVi, thamSo: thamDi, loi: "Mã kết nối phải gồm 32 ký tự (chữ số và a-f)." }), 400);
  }
  const xt = await xacThuc(env, ma);
  if (!xt.ok) {
    const thongBao = xt.status === 429 ? "Bạn thử hơi nhanh, đợi một phút rồi thử lại." : "Mã không đúng hoặc đã hết hạn. Kiểm tra lại trong ứng dụng, hoặc tạo kết nối mới.";
    return html(trangDongY({ tenUngDung: client.ten, phamVi: t.phamVi, thamSo: thamDi, loi: thongBao }), xt.status === 429 ? 429 : 400);
  }
  let maXacNhan: string;
  try {
    maXacNhan = await taoMaXacNhan(env.DB, { keBam: xt.hang.maBam, clientId: t.clientId, redirectUri: t.redirectUri, challenge: t.challenge, phamVi: t.phamVi });
  } catch {
    return chuyenHuong(t.redirectUri, { error: "server_error", ...(t.state ? { state: t.state } : {}) });
  }
  return chuyenHuong(t.redirectUri, { code: maXacNhan, ...(t.state ? { state: t.state } : {}) });
}

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi }) => xuLyAuthorize(ctx.request, ctx.env, "GET");
export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi }) => xuLyAuthorize(ctx.request, ctx.env, "POST");
