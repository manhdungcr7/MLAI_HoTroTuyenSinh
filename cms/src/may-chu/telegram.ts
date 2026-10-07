// Telegram: việc gửi thông báo nằm ở MÁY CHỦ (cms/functions/_thu-vien/telegram.ts), tự gửi khi gửi duyệt, duyệt, từ chối, xuất bản.
// Token là secret của máy chủ (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID), không bao giờ lưu hay nhập ở trình duyệt.
// File này chỉ còn phần hỏi trạng thái và gửi tin thử qua /api/telegram. Các hàm thongBao* giữ lại để màn cũ gọi không lỗi, nhưng không làm gì (máy chủ đã gửi).
import { dangDungDuLieuMau } from "./che-do";

export interface CauHinhTelegram {
  /** Luôn rỗng: token không tồn tại ở trình duyệt. */
  botToken: string;
  chatId: string;
  /** true khi máy chủ đã có secret Telegram. */
  kichHoat: boolean;
}

export const CAU_HINH_MAC_DINH: CauHinhTelegram = { botToken: "", chatId: "", kichHoat: false };

let daBiet = false;

/** Trạng thái đã biết (đồng bộ). Gọi `napTrangThaiTelegram()` để cập nhật từ máy chủ. */
export function layCauHinhTelegram(): CauHinhTelegram {
  return { ...CAU_HINH_MAC_DINH, kichHoat: daBiet };
}

export async function napTrangThaiTelegram(): Promise<boolean> {
  if (dangDungDuLieuMau()) return (daBiet = false);
  try {
    const r = await fetch("/api/telegram", { headers: { Accept: "application/json" }, credentials: "same-origin" });
    const j = (await r.json()) as { daCauHinh?: boolean };
    daBiet = r.ok && j.daCauHinh === true;
  } catch {
    daBiet = false;
  }
  return daBiet;
}

/** Không còn lưu cấu hình ở trình duyệt. Secret đặt bằng `wrangler pages secret put`. */
export function luuCauHinhTelegram(_ch: CauHinhTelegram): void {
  /* cố ý để trống */
}

/** Gửi tin thử qua máy chủ (chỉ quản trị viên). Nội dung tin do máy chủ soạn, tham số chỉ giữ cho tương thích. */
export async function guiTinNhanTelegram(_noiDung?: string): Promise<{ thanhCong: boolean; thongDiep: string }> {
  if (dangDungDuLieuMau()) return { thanhCong: false, thongDiep: "Đang ở chế độ dữ liệu mẫu, không gửi được Telegram." };
  try {
    const r = await fetch("/api/telegram", { method: "POST", headers: { Accept: "application/json" }, credentials: "same-origin" });
    const j = (await r.json().catch(() => ({}))) as { loi?: string };
    return r.ok ? { thanhCong: true, thongDiep: "Đã gửi tin thử đến Telegram." } : { thanhCong: false, thongDiep: j.loi ?? "Không gửi được Telegram." };
  } catch {
    return { thanhCong: false, thongDiep: "Không kết nối được máy chủ." };
  }
}

// Máy chủ tự gửi thông báo khi đổi trạng thái; các hàm dưới giữ chữ ký cũ nhưng không gửi gì từ trình duyệt.
export async function thongBaoCtvGuiDuyet(_t: { nguoiGui: string; maTruong: string; tenTruong: string; loai: string; linkNguon?: string }): Promise<void> {}
export async function thongBaoKetQuaDuyet(_k: { nguoiDuyet: string; maTruong: string; loai: string; trangThai: "duyet" | "nhap"; lyDo?: string }): Promise<void> {}
export async function thongBaoXuatBanSnapshot(_d: { nguoiXuat: string; phienBan: string; soBanGhi: number }): Promise<void> {}
