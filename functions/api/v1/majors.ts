import { executeCapability } from "../../../src/capabilities";

const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "content-type" };
const headers = { ...cors, "content-type": "application/json; charset=utf-8" };
const error = (status: number, code: string, message: string) => new Response(JSON.stringify({ ok: false, error: { code, message } }), {
  status, headers: status === 405 ? { ...headers, allow: "GET, OPTIONS" } : headers,
});

export async function xuLyTimNganh(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET") return error(405, "METHOD_NOT_ALLOWED", "Chỉ nhận GET.");
  const params = new URL(request.url).searchParams;
  const input: Record<string, unknown> = {};
  for (const key of params.keys()) {
    if (params.getAll(key).length !== 1) return error(400, "INVALID_ARGUMENT", "Tham số không được lặp lại.");
    const value = params.get(key)!;
    input[key] = key === "limit" || key === "offset" ? (value.trim() ? Number(value) : Number.NaN) : value;
  }
  const result = await executeCapability("search_majors", input);
  if (!result.ok) return error(result.error.code === "NOT_FOUND" ? 404 : result.error.code === "DATA_UNAVAILABLE" ? 503 : 400, result.error.code, result.error.message);
  return new Response(JSON.stringify(result), { status: 200, headers: { ...headers, "cache-control": "public, max-age=3600" } });
}

export const onRequest = ({ request }: { request: Request }) => xuLyTimNganh(request);
