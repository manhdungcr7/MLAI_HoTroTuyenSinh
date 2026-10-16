// Lớp REST mỏng cho GPT Actions (gói ChatGPT cá nhân): mỗi endpoint gọi lại đúng công cụ MCP tương ứng, không nhân đôi logic.
// Mã nằm ở đường dẫn /api/gpt/{mã}; xác thực và giới hạn tần suất giống MCP (xem ket-noi.ts).
import { docChuGioiHan } from "./doc-body";
import { chayCongCu, lichIcsCuaBan } from "./ket-noi-cong-cu";
import { traJson, xacThuc, type EnvKetNoi } from "./ket-noi";

/** Tham số đường dẫn [ma] (Pages có thể trả mảng). */
export const maTuThamSo = (p: string | string[] | undefined): string => (Array.isArray(p) ? p[0] : p) ?? "";

/** Thân JSON nhỏ của một yêu cầu POST từ ChatGPT. Sai hoặc quá lớn trả null. */
export async function docThanGpt(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const v: unknown = JSON.parse(await docChuGioiHan(request, 2048));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Gọi đúng một công cụ MCP và trả JSON. Lỗi nghiệp vụ trả 400 kèm lời nhắn tiếng Việt. */
export async function goiCongCuGpt(request: Request, env: EnvKetNoi, ma: string, ten: string, args: Record<string, unknown> = {}): Promise<Response> {
  const xt = await xacThuc(env, ma);
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  try {
    const kq = await chayCongCu(ten, args, { ban: xt.hang.banChup, ma, maBam: xt.hang.maBam, origin: new URL(request.url).origin, db: xt.hang.db });
    return kq.ok ? traJson(kq.data) : traJson({ loi: kq.loi }, 400);
  } catch {
    return traJson({ loi: "Có lỗi tạm thời, bạn thử lại sau ít phút" }, 503);
  }
}

/** Tệp lịch .ics của kế hoạch tuần (cùng nội dung với công cụ ke_hoach_tuan). */
export async function lichIcsGpt(env: EnvKetNoi, ma: string): Promise<Response> {
  const xt = await xacThuc(env, ma);
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  return new Response(lichIcsCuaBan(xt.hang.banChup), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="nguyen-vong-ai.ics"', "cache-control": "no-store" },
  });
}
