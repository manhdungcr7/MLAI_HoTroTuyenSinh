// POST /oauth/token: đổi mã xác nhận (authorization_code + PKCE) hoặc làm mới token (refresh_token). Client công khai, không có bí mật.
import type { EnvKetNoi } from "../_thu-vien/ket-noi";
import { doiMaLayToken, lamMoiToken } from "../_thu-vien/oauth";
import { docForm, giuTanSuat, ipYeuCau, jsonOAuth, loiOAuth } from "../_thu-vien/oauth-cong";

export async function xuLyToken(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "POST") return loiOAuth("invalid_request", "Chỉ nhận POST", 405);
  if (!await giuTanSuat(env, `oa-tk:${ipYeuCau(request)}:${Math.floor(Date.now() / 60_000)}`, 60, 120)) {
    return loiOAuth("slow_down", "Yêu cầu quá nhiều, đợi một phút rồi thử lại", 429);
  }
  if (!env.DB) return loiOAuth("server_error", "Dịch vụ chưa sẵn sàng", 503);
  const f = await docForm(request);
  if (!f) return loiOAuth("invalid_request", "Cần form application/x-www-form-urlencoded");
  if (typeof f.client_id !== "string" || f.client_id.length > 64) return loiOAuth("invalid_client", "client_id không hợp lệ", 401);

  if (f.grant_type === "authorization_code") {
    if (typeof f.code !== "string" || typeof f.code_verifier !== "string" || typeof f.redirect_uri !== "string") {
      return loiOAuth("invalid_request", "Thiếu code, code_verifier hoặc redirect_uri");
    }
    const kq = await doiMaLayToken(env, { ma: f.code, clientId: f.client_id, redirectUri: f.redirect_uri, verifier: f.code_verifier });
    if (!kq.ok) return loiOAuth(kq.loi.loi, kq.loi.moTa);
    return jsonOAuth(kq.token);
  }
  if (f.grant_type === "refresh_token") {
    if (typeof f.refresh_token !== "string") return loiOAuth("invalid_request", "Thiếu refresh_token");
    const kq = await lamMoiToken(env, { refreshToken: f.refresh_token, clientId: f.client_id });
    if (!kq.ok) return loiOAuth(kq.loi.loi, kq.loi.moTa);
    return jsonOAuth(kq.token);
  }
  return loiOAuth("unsupported_grant_type", "Chỉ hỗ trợ authorization_code và refresh_token");
}

export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi }) => xuLyToken(ctx.request, ctx.env);
