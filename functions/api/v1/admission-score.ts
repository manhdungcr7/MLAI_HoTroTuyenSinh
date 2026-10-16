import { executeCapability } from "../../../src/capabilities";
import { docChuGioiHan, ThanQuaLon } from "../../_thu-vien/doc-body";

export const MAX_SCORE_BODY_BYTES = 16_384;
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const headers = { ...cors, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
type HttpScoreError = "METHOD_NOT_ALLOWED" | "INVALID_CONTENT_TYPE" | "INVALID_JSON" | "PAYLOAD_TOO_LARGE" | "INVALID_ARGUMENT";
function error(status: number, code: HttpScoreError, message: string) {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status, headers: status === 405 ? { ...headers, allow: "POST, OPTIONS" } : headers,
  });
}

/** Hàm thuần theo điểm request; không lưu hồ sơ, gọi AI hay truy cập DB. */
export async function xuLyTinhDiem(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return error(405, "METHOD_NOT_ALLOWED", "Chỉ nhận POST.");
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return error(400, "INVALID_CONTENT_TYPE", "Cần gửi Content-Type application/json.");
  }
  let input: unknown;
  try { input = JSON.parse(await docChuGioiHan(request, MAX_SCORE_BODY_BYTES)); }
  catch (cause) {
    return cause instanceof ThanQuaLon ? error(413, "PAYLOAD_TOO_LARGE", "Nội dung vượt giới hạn 16 KiB.")
      : error(400, "INVALID_JSON", "Nội dung JSON không hợp lệ.");
  }
  const result = await executeCapability("calculate_admission_score", input);
  // Chỉ trả mã và thông báo đã định nghĩa; không phản chiếu JSON hay tên field do client gửi sai.
  if (!result.ok) return error(400, "INVALID_ARGUMENT", result.error.message);
  return new Response(JSON.stringify(result), { status: 200, headers });
}

export const onRequest = ({ request }: { request: Request }) => xuLyTinhDiem(request);
