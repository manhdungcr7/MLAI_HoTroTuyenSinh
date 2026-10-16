// POST /oauth/register: đăng ký client động (RFC 7591) cho Claude và ChatGPT. Client công khai, chỉ redirect_uri https hoặc loopback.
import type { EnvKetNoi } from "../_thu-vien/ket-noi";
import { dangKyClient, laRedirectHopLe } from "../_thu-vien/oauth";
import { giuTanSuat, ipYeuCau, jsonOAuth, loiOAuth } from "../_thu-vien/oauth-cong";

const TOI_DA_URI = 5;

export async function xuLyDangKy(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "POST") return loiOAuth("invalid_request", "Chỉ nhận POST", 405);
  if (!await giuTanSuat(env, `oa-dk:${ipYeuCau(request)}:${Math.floor(Date.now() / 3_600_000)}`, 20, 3700)) {
    return loiOAuth("invalid_client_metadata", "Tạo quá nhiều ứng dụng, thử lại sau một giờ", 429);
  }
  if (!env.DB) return loiOAuth("server_error", "Dịch vụ chưa sẵn sàng", 503);
  let v: Record<string, unknown>;
  try {
    const chu = await request.text();
    if (chu.length > 4096) return loiOAuth("invalid_client_metadata", "Nội dung quá lớn", 413);
    v = JSON.parse(chu);
  } catch { return loiOAuth("invalid_client_metadata", "Nội dung không phải JSON"); }
  if (!v || typeof v !== "object") return loiOAuth("invalid_client_metadata", "Thiếu thông tin ứng dụng");
  const uris = Array.isArray(v.redirect_uris) ? v.redirect_uris : [];
  if (uris.length < 1 || uris.length > TOI_DA_URI || !uris.every(laRedirectHopLe)) {
    return loiOAuth("invalid_redirect_uri", "redirect_uris phải là https hoặc http loopback, tối đa 5 địa chỉ");
  }
  const ten = typeof v.client_name === "string" ? v.client_name.replace(/[\u0000-\u001f]/g, "").slice(0, 80) || "Ứng dụng AI" : "Ứng dụng AI";
  const id = await dangKyClient(env.DB, ten, uris as string[]);
  return jsonOAuth({
    client_id: id,
    client_name: ten,
    redirect_uris: uris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  }, 201);
}

export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi }) => xuLyDangKy(ctx.request, ctx.env);
