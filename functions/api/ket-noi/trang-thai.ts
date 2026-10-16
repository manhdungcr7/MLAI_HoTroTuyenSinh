// GET /api/ket-noi/trang-thai: thông tin kết nối cho app (hạn, số lần AI truy cập và lần gần nhất, tính trước lượt kiểm tra này).
import { maTuHeader, traJson, xacThuc, type EnvKetNoi } from "../../_thu-vien/ket-noi";

export async function xuLyTrangThai(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "GET") return traJson({ loi: "Chỉ nhận GET" }, 405);
  const xt = await xacThuc(env, maTuHeader(request));
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  const h = xt.hang;
  return traJson({
    bat: true,
    hetHan: new Date(h.hetHan).toISOString(),
    soTruyCap: h.soTruyCap,
    lanCuoi: h.lanCuoi === null ? null : new Date(h.lanCuoi).toISOString(),
  });
}

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi }) => xuLyTrangThai(ctx.request, ctx.env);
