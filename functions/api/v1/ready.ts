// GET /api/v1/ready: sẵn sàng phục vụ hay chưa. Chỉ báo trạng thái từng thành phần (ok / loi), không lộ tên binding, khóa hay lỗi SQL.
import type { EnvKetNoi } from "../../_thu-vien/ket-noi";

export async function xuLySanSang(env: EnvKetNoi): Promise<Response> {
  const thanhPhan: Record<string, "ok" | "loi" | "chua-cau-hinh"> = { d1: "chua-cau-hinh", kv: "chua-cau-hinh" };
  if (env.DB) {
    try { await env.DB.prepare("SELECT 1 AS ok").first(); thanhPhan.d1 = "ok"; } catch { thanhPhan.d1 = "loi"; }
  }
  if (env.RATE_KV) {
    try { await env.RATE_KV.get("ready:probe"); thanhPhan.kv = "ok"; } catch { thanhPhan.kv = "loi"; }
  }
  const san = Object.values(thanhPhan).every((x) => x === "ok");
  return new Response(JSON.stringify({ san, thanhPhan }), {
    status: san ? 200 : 503,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const onRequestGet = (ctx: { env: EnvKetNoi }) => xuLySanSang(ctx.env);
