// PUT /api/ket-noi/dong-bo: app gửi bản chụp mới (header x-ket-noi là mã ghép nối).
import { docBanChup, doiBanChup, maTuHeader, traJson, xacThuc, type EnvKetNoi } from "../../_thu-vien/ket-noi";

export async function xuLyDongBo(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "PUT") return traJson({ loi: "Chỉ nhận PUT" }, 405);
  const xt = await xacThuc(env, maTuHeader(request));
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  const doc = await docBanChup(request);
  if (!doc.ok) return traJson({ loi: doc.loi }, 400);
  try {
    const capNhat = await doiBanChup(xt.hang.db, xt.hang.maBam, doc.banChup);
    if (!capNhat) return traJson({ loi: "Mã kết nối không dùng được. Kiểm tra lại liên kết trong ứng dụng." }, 404);
  } catch {
    return traJson({ loi: "Không lưu được bản chụp, bạn thử lại sau nhé" }, 503);
  }
  return traJson({ ok: true, capNhat: doc.banChup.capNhat });
}

export const onRequestPut = (ctx: { request: Request; env: EnvKetNoi }) => xuLyDongBo(ctx.request, ctx.env);
