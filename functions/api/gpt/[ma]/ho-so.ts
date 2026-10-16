// GET /api/gpt/{mã}/ho-so: cùng dữ liệu với công cụ lay_ho_so.
import { goiCongCuGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "lay_ho_so");
