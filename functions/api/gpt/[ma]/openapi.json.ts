// GET /api/gpt/{mã}/openapi.json: mô tả OpenAPI 3.1 để dán vào GPT Actions (không xác thực; mã nằm trong server URL).
// Mã sai định dạng trả 404. Mã đúng định dạng nhưng không tồn tại vẫn nhận mô tả, nhưng mọi endpoint dữ liệu đều từ chối.
import { laMa, LOI_MA, traJson, type EnvKetNoi } from "../../../_thu-vien/ket-noi";
import { maTuThamSo } from "../../../_thu-vien/ket-noi-gpt";
import { taoOpenApi } from "../../../_thu-vien/ket-noi-openapi";

export const onRequestGet = (ctx: { request: Request; env: EnvKetNoi; params: { ma?: string | string[] } }): Response => {
  const ma = maTuThamSo(ctx.params.ma);
  if (!laMa(ma)) return traJson({ loi: LOI_MA }, 404);
  const origin = new URL(ctx.request.url).origin;
  return traJson(taoOpenApi(origin, ma));
};
