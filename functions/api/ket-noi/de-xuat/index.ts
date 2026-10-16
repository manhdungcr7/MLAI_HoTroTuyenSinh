// GET /api/ket-noi/de-xuat: các đề xuất đang chờ em xác nhận trong app (từ Claude/ChatGPT).
import { danhSachDeXuatCho, maTuHeader, traJson, xacThuc, type EnvKetNoi } from "../../../_thu-vien/ket-noi";

export async function xuLyDanhSach(request: Request, env: EnvKetNoi): Promise<Response> {
  if (request.method !== "GET") return traJson({ loi: "Chỉ nhận GET" }, 405);
  const xt = await xacThuc(env, maTuHeader(request));
  if (!xt.ok) return traJson({ loi: xt.loi }, xt.status);
  try {
    return traJson({ deXuat: await danhSachDeXuatCho(xt.hang.db, xt.hang.maBam) });
  } catch {
    return traJson({ loi: "Không tải được đề xuất, bạn thử lại sau nhé" }, 503);
  }
}

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi }) => xuLyDanhSach(ctx.request, ctx.env);
