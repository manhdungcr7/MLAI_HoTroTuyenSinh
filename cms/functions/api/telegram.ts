// /api/telegram (qtv): GET cho biết máy chủ đã có secret Telegram chưa (không trả token); POST gửi tin thử.
import { daCauHinhTelegram, guiTelegram, thoatHtml } from "../_thu-vien/telegram";
import type { BoiCanh, TuyChon } from "../_thu-vien/kieu";
import { LoiHttp, json } from "../_thu-vien/phan-hoi";
import { chay, khongHoTro, QUAN_TRI } from "../_thu-vien/quyen";

export const xuLy = (ctx: BoiCanh, o: TuyChon = {}) =>
  chay(ctx, o, QUAN_TRI, async (c) => {
    if (c.request.method === "GET") return json({ daCauHinh: daCauHinhTelegram(c.env) });
    if (c.request.method !== "POST") throw khongHoTro();
    if (!daCauHinhTelegram(c.env)) throw new LoiHttp(503, "chua-cau-hinh", "Máy chủ chưa có secret TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID (wrangler pages secret put).");
    const kq = await guiTelegram(c.env, `<b>[CMS Nguyện Vọng AI]</b> Tin thử từ ${thoatHtml(c.email)}`, c.o);
    if (kq !== "da-gui") throw new LoiHttp(502, "telegram-loi", "Telegram không nhận tin. Kiểm tra lại token và chat id.");
    return json({ thanhCong: true });
  });

export const onRequest = (ctx: BoiCanh) => xuLy(ctx);
