// DELETE /api/ket-noi: xóa bản chụp, đề xuất và chính mã ghép nối (ngắt kết nối từ app).
import { maTuHeader, traJson, xacThuc, xoaKetNoi, type EnvKetNoi } from "../../_thu-vien/ket-noi";

export async function xuLyXoa(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "DELETE") return traJson({ loi: "Chỉ nhận DELETE" }, 405);
  const xt = await xacThuc(env, maTuHeader(request));
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  try {
    await xoaKetNoi(xt.hang.db, xt.hang.maBam);
  } catch {
    return traJson({ loi: "Không ngắt được kết nối, bạn thử lại sau nhé" }, 503);
  }
  return traJson({ ok: true });
}

export const onRequestDelete = (ctx: { request: Request; env: EnvKetNoi }) => xuLyXoa(ctx.request, ctx.env);
