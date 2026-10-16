// /mcp với OAuth: chỉ nhận Bearer token do /oauth/token cấp. Thiếu token thì 401 kèm WWW-Authenticate trỏ tới metadata tài nguyên (RFC 9728).
// Phạm vi lấy từ token, không lấy từ tham số nào của client. Token của kết nối đã xóa thì không còn dùng được.
import type { EnvKetNoi } from "../_thu-vien/ket-noi";
import { tokenTruyCap } from "../_thu-vien/oauth";
import { CORS, xuLyThanMcp } from "./[ma]";

const KHONG_CO_TOKEN = (origin: string, loi?: string) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32001, message: loi ?? "Cần đăng nhập để dùng máy chủ này" } }), {
    status: 401,
    headers: {
      ...CORS,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "www-authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"${loi ? ', error="invalid_token"' : ""}`,
    },
  });

export async function xuLyMcpBearer(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const origin = new URL(request.url).origin;
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
  const m = /^Bearer ([A-Za-z0-9_-]{20,128})$/.exec(request.headers.get("authorization") ?? "");
  if (!m) return KHONG_CO_TOKEN(origin);
  const tk = await tokenTruyCap(env, m[1]);
  if (!tk.ok) return KHONG_CO_TOKEN(origin, "Token không còn hiệu lực, hãy làm mới hoặc kết nối lại");
  return xuLyThanMcp(request, { origin, ma: "", maBam: tk.keBam, db: env.DB!, ban: tk.hang.banChup, phamVi: tk.phamVi });
}

export const onRequest = (ctx: { request: Request; env: EnvKetNoi }) => xuLyMcpBearer(ctx.request, ctx.env);
