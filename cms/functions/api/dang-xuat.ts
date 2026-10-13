// POST /api/dang-xuat: xóa cookie phiên.
import type { BoiCanh } from "../_thu-vien/kieu";
import { chayCongKhai, khongHoTro } from "../_thu-vien/quyen";
import { datCookie, kiemOrigin } from "../_thu-vien/xac-thuc";

export const xuLy = (ctx: BoiCanh) =>
  chayCongKhai(ctx, async () => {
    if (ctx.request.method !== "POST") throw khongHoTro();
    kiemOrigin(ctx.request);
    return new Response(null, { status: 204, headers: { "cache-control": "no-store", "set-cookie": datCookie(new URL(ctx.request.url), "") } });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
