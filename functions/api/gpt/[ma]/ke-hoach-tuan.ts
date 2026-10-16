// GET /api/gpt/{mã}/ke-hoach-tuan: cùng dữ liệu với công cụ ke_hoach_tuan.
import { goiCongCuGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) =>
  goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "ke_hoach_tuan");
