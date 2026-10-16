// GET /api/v1/health: sống hay không. Không lộ cấu hình, không gọi D1 hay KV (dùng cho giám sát tần suất cao).
export const onRequestGet = () => new Response(JSON.stringify({ ok: true, dich: "nguyen-vong-ai", thoiGian: new Date().toISOString() }), {
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
