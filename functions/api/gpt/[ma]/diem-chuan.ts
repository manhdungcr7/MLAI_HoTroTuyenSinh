// GET /api/gpt/{mã}/diem-chuan?truyVan=...: cùng dữ liệu với công cụ diem_chuan.
import { goiCongCuGpt, maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import type { EnvKetNoi } from "../../../_thu-vien/ket-noi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }) => {
  const truyVan = new URL(ctx.request.url).searchParams.get("truyVan") ?? "";
  return goiCongCuGpt(ctx.request, ctx.env, maTuThamSo(ctx.params.ma), "diem_chuan", { truyVan });
};
