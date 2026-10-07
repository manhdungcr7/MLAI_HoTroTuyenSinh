// Thông báo Telegram phía máy chủ. Token chỉ nằm ở secret (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID), không bao giờ xuống trình duyệt.
// Gửi không thành công không được làm hỏng thao tác chính: trả trạng thái để ghi vào header `x-thong-bao`.
import type { Env, TuyChon } from "./kieu";

export type TrangThaiThongBao = "da-gui" | "chua-cau-hinh" | "loi";

export const thoatHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const daCauHinhTelegram = (env: Env) => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);

export async function guiTelegram(env: Env, noiDung: string, o: TuyChon = {}): Promise<TrangThaiThongBao> {
  if (!daCauHinhTelegram(env)) return "chua-cau-hinh";
  try {
    const r = await (o.fetch ?? fetch)(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: noiDung.slice(0, 3500), parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) { console.error("telegram", r.status); return "loi"; }
    return "da-gui";
  } catch (e) {
    console.error("telegram", e instanceof Error ? e.message : "loi");
    return "loi";
  }
}

export interface SuKien { hanhDong: "SUBMITTED" | "APPROVED" | "REJECTED" | "PUBLISHED"; email: string; loai?: string; maDoiTuong?: string; lyDo?: string; phienBan?: string; soBanGhi?: number }

export function soanTin(s: SuKien): string {
  const dong: string[] = [];
  if (s.hanhDong === "SUBMITTED") dong.push("<b>[CMS Nguyện Vọng AI] Có bản ghi gửi duyệt</b>");
  if (s.hanhDong === "APPROVED") dong.push("<b>[CMS Nguyện Vọng AI] Bản ghi đã được duyệt</b>");
  if (s.hanhDong === "REJECTED") dong.push("<b>[CMS Nguyện Vọng AI] Bản ghi bị trả về</b>");
  if (s.hanhDong === "PUBLISHED") dong.push("<b>[CMS Nguyện Vọng AI] Đã xuất bản dữ liệu mới</b>");
  dong.push(`Người thực hiện: ${thoatHtml(s.email)}`);
  if (s.loai) dong.push(`Loại: ${thoatHtml(s.loai)}`);
  if (s.maDoiTuong) dong.push(`Đối tượng: <code>${thoatHtml(s.maDoiTuong)}</code>`);
  if (s.lyDo) dong.push(`Lý do: ${thoatHtml(s.lyDo)}`);
  if (s.phienBan) dong.push(`Phiên bản dữ liệu: <code>${thoatHtml(s.phienBan)}</code>`);
  if (s.soBanGhi !== undefined) dong.push(`Số bản ghi mới: ${s.soBanGhi}`);
  return dong.join("\n");
}

export const thongBaoSuKien = (env: Env, s: SuKien, o: TuyChon = {}) => guiTelegram(env, soanTin(s), o);
