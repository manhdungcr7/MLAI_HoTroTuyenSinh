// GET /api/gpt/{mã}/goi-y: cùng dữ liệu với công cụ goi_y_nganh.
import { goiCongCuGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "goi_y_nganh");
