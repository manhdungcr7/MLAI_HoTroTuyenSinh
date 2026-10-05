// Hook nhắc nhở trong phiên đang mở. Người điều phối gắn MỘT lần ở cấp App (bên trong AppProvider):
//   function NhacNhoNen() { useNhacNho(); return null; }   rồi đặt <NhacNhoNen /> cạnh <RouterProvider />.
// Giới hạn: chỉ nhắc được khi ứng dụng đang mở (hoặc đã thêm lên màn hình chính và còn chạy nền).
// Nhắc khi đã tắt hẳn ứng dụng cần máy chủ gửi thông báo đẩy, sẽ làm khi có máy chủ.
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/state/store";
import { nhacSapToi, type NhacSapToi } from "./nhac-nho";

export type QuyenThongBao = "khongHoTro" | "chuaHoi" | "daChoPhep" | "daChan";

export function docQuyenThongBao(): QuyenThongBao {
  if (typeof window === "undefined" || !("Notification" in window)) return "khongHoTro";
  return Notification.permission === "granted" ? "daChoPhep" : Notification.permission === "denied" ? "daChan" : "chuaHoi";
}

export async function xinQuyenThongBao(): Promise<QuyenThongBao> {
  if (docQuyenThongBao() === "khongHoTro") return "khongHoTro";
  try { await Notification.requestPermission(); } catch { /* trình duyệt cũ dùng callback: bỏ qua */ }
  return docQuyenThongBao();
}

/** Gửi một thông báo của trình duyệt. Trả về false nếu không gửi được (chưa cho phép, không hỗ trợ). */
export async function guiThongBao(tieuDe: string, noiDung: string, the?: string): Promise<boolean> {
  if (docQuyenThongBao() !== "daChoPhep") return false;
  const tuyChon: NotificationOptions = { body: noiDung, tag: the, icon: "/favicon.svg" };
  try {
    // Trên điện thoại (Android), chỉ service worker mới tạo được thông báo.
    const dk = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (dk) { await dk.showNotification(tieuDe, tuyChon); return true; }
    new Notification(tieuDe, tuyChon);
    return true;
  } catch {
    return false;
  }
}

const KHOA_DA_NHAC = "nvai:tu-hoc-da-nhac";
const daNhac = (): string[] => { try { return JSON.parse(sessionStorage.getItem(KHOA_DA_NHAC) ?? "[]"); } catch { return []; } };
const ghiDaNhac = (id: string) => { try { sessionStorage.setItem(KHOA_DA_NHAC, JSON.stringify([...daNhac(), id].slice(-200))); } catch { /* bỏ qua */ } };

/**
 * Đặt hẹn giờ cho các nhắc trong 24 giờ tới khi nhắc nhở đang bật.
 * onNhac: gọi thêm mỗi khi tới giờ nhắc (ví dụ hiện dòng chữ trong ứng dụng khi trình duyệt không cho thông báo).
 */
export function useNhacNho(onNhac?: (n: NhacSapToi) => void): { sapToi: NhacSapToi[] } {
  const { s } = useApp();
  // tính lại mỗi 30 phút để cửa sổ 24 giờ luôn trượt theo thời gian
  const [nhip, setNhip] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setNhip((x) => x + 1), 30 * 60_000); return () => window.clearInterval(t); }, []);
  const sapToi = useMemo(
    () => nhacSapToi(s, new Date()),
    [s.khoiHoc, s.coDinh, s.nhacNho, s.trangThaiViec, nhip],
  );

  useEffect(() => {
    if (!s.nhacNho.bat) return;
    const daCo = new Set(daNhac());
    const hen = sapToi
      .filter((n) => !daCo.has(n.id))
      .map((n) => window.setTimeout(() => {
        ghiDaNhac(n.id);
        void guiThongBao(n.tieuDe, n.moTa, n.id);
        onNhac?.(n);
      }, Math.max(0, n.luc.getTime() - Date.now())));
    return () => hen.forEach((t) => window.clearTimeout(t));
  }, [sapToi, s.nhacNho.bat, onNhac]);

  return { sapToi };
}
