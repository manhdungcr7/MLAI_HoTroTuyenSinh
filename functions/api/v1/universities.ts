// HTTP adapter của cùng capability dùng bởi MCP; giữ response danh mục tương thích.
import { executeCapability } from "../../../src/capabilities";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const headers = { ...CORS, "content-type": "application/json; charset=utf-8" };

export async function xuLyDanhSachTruong(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "GET") return new Response(JSON.stringify({ loi: "Chỉ nhận GET" }), { status: 405, headers });
  const params = new URL(request.url).searchParams;
  const input: Record<string, unknown> = {};
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) return new Response(JSON.stringify({ ok: false, error: { code: "INVALID_ARGUMENT", message: "Tham số không được lặp lại." } }), { status: 400, headers });
    const value = params.get(key)!;
    input[key] = key === "limit" || key === "offset" ? (value.trim() ? Number(value) : Number.NaN) : value;
  }
  const result = await executeCapability("search_universities", input);
  if (!result.ok) return new Response(JSON.stringify(result), { status: 400, headers });
  return new Response(JSON.stringify({ ...result.data as Record<string, unknown>, meta: result.meta }), {
    status: 200, headers: { ...headers, "cache-control": "public, max-age=3600" },
  });
}

export const onRequest = ({ request }: { request: Request }) => xuLyDanhSachTruong(request);
