// POST /api/phat-hanh (qtv): phát hành bản chụp kênh/thông tin cộng đồng (bảng thong_tin_truong, trạng thái duyet) sang KV dong-gop:v1.
// Body { "hanhDong": "hoan-tac" } đổi chỗ bản trước và bản hiện tại. (Quy trình dữ liệu tuyển sinh CMS dùng /api/xuat-ban-snapshot.)
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { docThan, json } from "../_thu-vien/phan-hoi";
import { hoanTac, phatHanh } from "../_thu-vien/phat-hanh";
import { chay, khongHoTro } from "../_thu-vien/quyen";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, ["qtv"], async (c) => {
    if (c.request.method !== "POST") throw khongHoTro();
    const b = await docThan(c.request).catch(() => ({}) as Record<string, unknown>);
    return json(b.hanhDong === "hoan-tac" ? await hoanTac(c.env, c.d1, c.email, c.bayGio) : await phatHanh(c.env, c.d1, c.email, c.bayGio));
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
