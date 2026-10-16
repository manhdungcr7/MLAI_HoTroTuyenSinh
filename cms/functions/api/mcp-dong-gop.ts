// /api/mcp-dong-gop: MCP (Streamable HTTP, JSON-RPC 2.0, không trạng thái) cho cộng tác viên đóng góp số liệu tuyển sinh.
// Xác thực: `Authorization: Bearer nvk_...` (khóa cá nhân tạo ở Hệ thống > Khóa kết nối). Quyền tra lại MỖI LẦN gọi.
//   POST     -> một thông điệp hoặc mảng thông điệp. Thông báo (không có id) trả 202 không nội dung.
//   GET      -> 405 (máy chủ không mở luồng SSE).
//   OPTIONS  -> CORS. Bearer không phải cookie nên không có rủi ro CSRF; CORS * là an toàn.
// Mọi lỗi xác thực trả cùng một thông điệp chung, 401, không tiết lộ khóa có tồn tại hay không.
import { xuLyThongDiep, type NguCanhDongGop, type ThongDiepRpc } from "../_thu-vien/dong-gop-mcp";
import { THONG_BAO_KHOA_SAI, xacThucKhoa } from "../_thu-vien/khoa-ket-noi";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp } from "../_thu-vien/phan-hoi";

const GIOI_HAN_THAN = 64 * 1024;
const MOI_LO_TOI_DA = 50;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id",
  "access-control-max-age": "600",
};
const TIEU_DE_JSON = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS };

const loiRpc = (status: number, id: unknown, code: number, message: string, them: Record<string, string> = {}) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), { status, headers: { ...TIEU_DE_JSON, ...them } });

export const xuLy = async (ctx: BoiCanh, o: TuyChon = {}): Promise<Response> => {
  const { request, env } = ctx;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return loiRpc(405, null, -32000, "Chỉ nhận POST (JSON-RPC). Máy chủ không mở luồng GET.", { allow: "POST, OPTIONS" });
  if (!env.DB) return loiRpc(503, null, -32000, "Máy chủ chưa gắn cơ sở dữ liệu D1");

  const bayGio = o.bayGio ?? new Date();
  let nguoi;
  try {
    nguoi = await xacThucKhoa(env.DB, request.headers.get("authorization"), bayGio);
  } catch (e) {
    if (e instanceof LoiHttp && e.status === 401) return loiRpc(401, null, -32001, THONG_BAO_KHOA_SAI, { "www-authenticate": "Bearer" });
    console.error("mcp-dong-gop xacThuc", e instanceof Error ? e.message : e);
    return loiRpc(503, null, -32000, "Máy chủ đang gián đoạn, thử lại sau");
  }

  const chu = await request.text();
  if (new TextEncoder().encode(chu).length > GIOI_HAN_THAN) return loiRpc(413, null, -32600, "Nội dung gửi lên quá lớn (tối đa 64KB)");
  let body: unknown;
  try { body = JSON.parse(chu); } catch { return loiRpc(400, null, -32700, "Nội dung không phải JSON hợp lệ"); }

  const c: NguCanhDongGop = {
    d1: env.DB, env, email: nguoi.email, vaiTro: nguoi.vaiTro, khoaId: nguoi.khoaId, bayGio,
    taoId: o.taoId ?? (() => crypto.randomUUID()),
  };

  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > MOI_LO_TOI_DA) return loiRpc(400, null, -32600, `Lô yêu cầu từ 1 đến ${MOI_LO_TOI_DA} thông điệp`);
    const ds: ThongDiepRpc[] = [];
    for (const x of body) {
      const r = await xuLyThongDiep(x, c);
      if (r) ds.push(r);
    }
    if (ds.length === 0) return new Response(null, { status: 202, headers: CORS });
    return new Response(JSON.stringify(ds), { status: 200, headers: TIEU_DE_JSON });
  }

  const r = await xuLyThongDiep(body, c);
  if (r === null) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(r), { status: 200, headers: TIEU_DE_JSON });
};

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
