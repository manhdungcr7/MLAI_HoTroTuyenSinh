// GET /api/toi: ai đang đăng nhập, vai gì, được giao trường nào.
import { chay, khongHoTro, truongDuocGiao } from "../_thu-vien/quyen";
import { json } from "../_thu-vien/phan-hoi";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv", "ctv"], async (c) => {
    if (c.request.method !== "GET") throw khongHoTro();
    return json({ email: c.email, vaiTro: c.vaiTro, truongDuocGiao: await truongDuocGiao(c.d1, c.email) });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
