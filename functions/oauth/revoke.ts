// POST /oauth/revoke (RFC 7009): thu hồi token. Luôn trả 200, không tiết lộ token có tồn tại hay không.
import type { EnvKetNoi } from "../_thu-vien/ket-noi";
import { thuHoiToken } from "../_thu-vien/oauth";
import { docForm, giuTanSuat, ipYeuCau, loiOAuth, ocNoStore } from "../_thu-vien/oauth-cong";

export async function xuLyThuHoi(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "POST") return loiOAuth("invalid_request", "Chỉ nhận POST", 405);
  if (!await giuTanSuat(env, `oa-th:${ipYeuCau(request)}:${Math.floor(Date.now() / 60_000)}`, 60, 120)) {
    return loiOAuth("slow_down", "Yêu cầu quá nhiều, đợi một phút rồi thử lại", 429);
  }
  if (!env.DB) return loiOAuth("server_error", "Dịch vụ chưa sẵn sàng", 503);
  const f = await docForm(request);
  if (!f || typeof f.token !== "string" || f.token.length > 200) return new Response(null, { status: 200, headers: ocNoStore });
  await thuHoiToken(env.DB, f.token);
  return new Response(null, { status: 200, headers: ocNoStore });
}

export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi }) => xuLyThuHoi(ctx.request, ctx.env);
