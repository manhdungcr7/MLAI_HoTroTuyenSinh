// POST /api/gpt/{mã}/de-xuat/them-nguyen-vong: cùng logic với công cụ de_xuat_them_nguyen_vong (chỉ tạo đề xuất chờ xác nhận).
import { docThanGpt, goiCongCuGpt, maTuThamSo } from "../../../../_thu-vien/ket-noi-gpt";
import { traJson, type EnvKetNoi } from "../../../../_thu-vien/ket-noi";

export const onRequestPost = async (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }): Promise<Response> => {
  const than = await docThanGpt(ctx.request);
  if (!than) return traJson({ loi: "Nội dung gửi lên không hợp lệ" }, 400);
  const args: Record<string, unknown> = { idChuongTrinh: than.idChuongTrinh };
  if (than.viTri !== undefined) args.viTri = than.viTri;
  return goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "de_xuat_them_nguyen_vong", args);
};
