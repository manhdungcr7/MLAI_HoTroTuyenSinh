// Máy chủ MCP (Streamable HTTP, không trạng thái, JSON-RPC 2.0) cho Claude và ChatGPT: đường dẫn /mcp/{mã} (cách cũ, toàn quyền như trước)
// và /mcp với Bearer token OAuth (xem mcp/index.ts). Hai đường dùng chung một bộ xử lý giao thức và một bộ công cụ.
// Mã sai, hết hạn hoặc đã thu hồi đều trả cùng một thông điệp, không tiết lộ mã có tồn tại hay không.
import { docChuGioiHan, ThanQuaLon } from "../_thu-vien/doc-body";
import { CONG_CU, PHAM_VI_CONG_CU, chayCongCu } from "../_thu-vien/ket-noi-cong-cu";
import type { BanChup } from "../../src/engine/ket-noi-kieu";
import { xacThuc, type EnvKetNoi, type HangKetNoi, type KhoD1Ket } from "../_thu-vien/ket-noi";
import type { PhamVi } from "../_thu-vien/oauth";

export const PHIEN_BAN_HO_TRO = ["2025-06-18", "2025-03-26", "2024-11-05"];
const PHIEN_BAN_MAC_DINH = "2025-03-26";
const GIOI_HAN_THAN_BYTE = 32_768;
export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id, authorization",
  "access-control-max-age": "86400",
};

interface Rpc { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }
type KetQuaRpc = { result: unknown } | { error: { code: number; message: string } };

const loiRpc = (id: unknown, code: number, message: string, status = 200) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const coPhanHoi = (v: unknown, status = 200) =>
  new Response(JSON.stringify(v), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/** Ngữ cảnh một yêu cầu MCP đã xác thực. phamVi = null nghĩa là đăng nhập bằng mã đường dẫn (không kiểm phạm vi). */
export interface NguCanhMcp { origin: string; ma: string; maBam: string; db: KhoD1Ket; ban: BanChup; phamVi: PhamVi[] | null }

async function xuLyMotYeuCau(msg: Rpc, ctx: NguCanhMcp): Promise<KetQuaRpc> {
  const params = (msg.params && typeof msg.params === "object" ? msg.params : {}) as Record<string, unknown>;
  switch (msg.method) {
    case "initialize": {
      const yc = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return {
        result: {
          protocolVersion: PHIEN_BAN_HO_TRO.includes(yc) ? yc : PHIEN_BAN_MAC_DINH,
          capabilities: { tools: {} },
          serverInfo: { name: "nguyen-vong-ai", version: "1.1.0" },
        },
      };
    }
    case "ping":
      return { result: {} };
    case "tools/list":
      return { result: { tools: CONG_CU.map((c) => ({ name: c.ten, description: c.mota, inputSchema: c.schema })) } };
    case "tools/call": {
      const ten = typeof params.name === "string" ? params.name : "";
      if (!CONG_CU.some((c) => c.ten === ten)) return { error: { code: -32602, message: "Không có công cụ này" } };
      const can = PHAM_VI_CONG_CU[ten];
      if (ctx.phamVi && can && !ctx.phamVi.includes(can as PhamVi)) {
        // Thiếu quyền là lỗi của công cụ (isError), không phải lỗi giao thức: client vẫn tiếp tục được.
        return { result: { content: [{ type: "text", text: `Thiếu quyền ${can} để dùng công cụ này. Kết nối lại và cho phép quyền này.` }], isError: true } };
      }
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      console.info(JSON.stringify({ tang: "ket-noi", congCu: ten, kieu: ctx.phamVi ? "oauth" : "ma-duong-dan" }));
      try {
        const kq = await chayCongCu(ten, args, { ban: ctx.ban, ma: ctx.ma, maBam: ctx.maBam, origin: ctx.origin, db: ctx.db });
        if (!kq.ok) return { result: { content: [{ type: "text", text: kq.loi }], isError: true } };
        return { result: { content: [{ type: "text", text: JSON.stringify(kq.data) }] } };
      } catch {
        return { result: { content: [{ type: "text", text: "Có lỗi tạm thời, bạn thử lại sau ít phút" }], isError: true } };
      }
    }
    default:
      return { error: { code: -32601, message: "Không hỗ trợ phương thức này" } };
  }
}

/** Phần giao thức dùng chung: đọc JSON-RPC (một hoặc nhiều thông điệp), giới hạn kích thước, trả phản hồi. */
export async function xuLyThanMcp(request: Request, ctx: NguCanhMcp): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
  let chu: string;
  try { chu = await docChuGioiHan(request, GIOI_HAN_THAN_BYTE); } catch (e) {
    return loiRpc(null, -32600, e instanceof ThanQuaLon ? "Yêu cầu quá lớn" : "Không đọc được yêu cầu", 413);
  }
  let goc: unknown;
  try { goc = JSON.parse(chu); } catch { return loiRpc(null, -32700, "Nội dung không phải JSON", 400); }
  const ds: unknown[] = Array.isArray(goc) ? goc : [goc];
  if (ds.length === 0 || ds.some((m) => !m || typeof m !== "object" || Array.isArray(m) || (m as Rpc).jsonrpc !== "2.0" || typeof (m as Rpc).method !== "string")) {
    return loiRpc(null, -32600, "Yêu cầu JSON-RPC không hợp lệ", 400);
  }
  const phanHoi: unknown[] = [];
  for (const m of ds as Rpc[]) {
    // Thông báo (không có id) không có phản hồi.
    if (m.id === undefined) continue;
    const kq = await xuLyMotYeuCau(m, ctx);
    phanHoi.push("result" in kq ? { jsonrpc: "2.0", id: m.id, result: kq.result } : { jsonrpc: "2.0", id: m.id, error: kq.error });
  }
  if (phanHoi.length === 0) return new Response(null, { status: 202, headers: CORS });
  return coPhanHoi(Array.isArray(goc) ? phanHoi : phanHoi[0]);
}

/** Đường dẫn /mcp/{mã}: xác thực mã rồi chuyển cho phần giao thức chung. */
export async function xuLyMcp(request: Request, env: EnvKetNoi, ma: unknown): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
  const xt = await xacThuc(env, ma);
  if (!xt.ok) return loiRpc(null, -32001, xt.loi, xt.status);
  const hang: HangKetNoi = xt.hang;
  return xuLyThanMcp(request, { origin: new URL(request.url).origin, ma: String(ma), maBam: hang.maBam, db: hang.db, ban: hang.banChup, phamVi: null });
}

export const onRequest = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  xuLyMcp(ctx.request, ctx.env, Array.isArray(ctx.params.ma) ? ctx.params.ma[0] : ctx.params.ma);
