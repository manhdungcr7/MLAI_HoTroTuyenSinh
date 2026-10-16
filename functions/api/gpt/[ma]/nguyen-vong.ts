// GET /api/gpt/{mã}/nguyen-vong: cùng dữ liệu với công cụ lay_nguyen_vong.
import { goiCongCuGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "lay_nguyen_vong");
