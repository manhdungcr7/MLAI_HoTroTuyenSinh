// POST /api/ket-noi/de-xuat/{id}: em xác nhận hoặc từ chối một đề xuất. Máy chủ chỉ đánh dấu; việc đổi dữ liệu thật do app làm.
import { docChuGioiHan, ThanQuaLon } from "../../../_thu-vien/doc-body";
import { maTuHeader, quyetDinhDeXuat, traJson, xacThuc, type EnvKetNoi } from "../../../_thu-vien/ket-noi";

const RE_ID = /^[A-Za-z0-9-]{8,64}$/;

export async function xuLyQuyetDinh(request: Request, env: EnvKetNoi, id: unknown): Promise<Response> {
  if (request.method !== "POST") return traJson({ loi: "Chỉ nhận POST" }, 405);
  const xt = await xacThuc(env, maTuHeader(request));
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  if (typeof id !== "string" || !RE_ID.test(id)) return traJson({ loi: "Mã đề xuất không đúng" }, 400);
  let chu: string;
  try { chu = await docChuGioiHan(request, 1024); } catch (e) {
    return traJson({ loi: e instanceof ThanQuaLon ? "Yêu cầu quá lớn" : "Không đọc được yêu cầu" }, 400);
  }
  let v: unknown;
  try { v = JSON.parse(chu); } catch { return traJson({ loi: "Yêu cầu không hợp lệ" }, 400); }
  const quyet = v && typeof v === "object" ? (v as Record<string, unknown>).quyetDinh : undefined;
  if (quyet !== "xac-nhan" && quyet !== "tu-choi") return traJson({ loi: "quyetDinh phải là xac-nhan hoặc tu-choi" }, 400);
  try {
    const ok = await quyetDinhDeXuat(xt.hang.db, xt.hang.maBam, id, quyet);
    if (!ok) return traJson({ loi: "Không còn đề xuất chờ nào với mã này" }, 404);
  } catch {
    return traJson({ loi: "Không lưu được quyết định, bạn thử lại sau nhé" }, 503);
  }
  return traJson({ ok: true });
}

export const onRequestPost = (ctx: { request: Request; env: EnvKetNoi; params: { id?: string | string[] } }) =>
  xuLyQuyetDinh(ctx.request, ctx.env, Array.isArray(ctx.params.id) ? ctx.params.id[0] : ctx.params.id);
