import { useEffect, useMemo, useRef, useState } from "react";
import { suKienTuanNay } from "@/engine/lich-ics";
import { useApp } from "@/state/store";
import { baoFeedThuLai, capNhatFeedLich, capNhatTrangThaiFeed, docFeedLich, TIN_FEED, type FeedLich } from "./lich-feed";

const KHOA_TRANG_THAI = "nvai:v2";

/** Theo dõi lịch trên mọi màn hình; chỉ gửi sau khi học sinh tự bật feed và trạng thái đã lưu trên máy. */
export function DongBoLichNen() {
  const { s, luuDuoc } = useApp();
  const [feed, setFeed] = useState<FeedLich | null>(() => docFeedLich());
  const [lanThuLai, setLanThuLai] = useState(0);
  const dangGui = useRef(false);
  const dangCho = useRef<{ feed: FeedLich; suKien: ReturnType<typeof suKienTuanNay> } | null>(null);
  const suKien = useMemo(() => suKienTuanNay(s).map(({ tieuDe, batDau, ketThuc, ghiChu, taskId }) => ({
    tieuDe, batDau, ketThuc, ...(ghiChu ? { ghiChu } : {}), ...(taskId ? { taskId } : {}),
  })), [s]);
  const chuoiSuKien = JSON.stringify(suKien);

  useEffect(() => {
    const nap = () => setFeed(docFeedLich());
    const thuLai = () => setLanThuLai((n) => n + 1);
    window.addEventListener(TIN_FEED.thayDoi, nap);
    window.addEventListener(TIN_FEED.thuLai, thuLai);
    window.addEventListener("storage", nap);
    return () => {
      window.removeEventListener(TIN_FEED.thayDoi, nap);
      window.removeEventListener(TIN_FEED.thuLai, thuLai);
      window.removeEventListener("storage", nap);
    };
  }, []);

  useEffect(() => {
    if (!feed || feed.dangThuHoi || s.hoSo.laMau || !luuDuoc) return;
    const timer = window.setTimeout(() => {
      let saved = false;
      try { saved = localStorage.getItem(KHOA_TRANG_THAI) === JSON.stringify(s); } catch { /* không có quyền đọc localStorage */ }
      if (!saved) return;
      dangCho.current = { feed, suKien: JSON.parse(chuoiSuKien) as ReturnType<typeof suKienTuanNay> };
      if (dangGui.current) return;
      dangGui.current = true;
      void (async () => {
        try {
          while (dangCho.current) {
            const current = dangCho.current;
            dangCho.current = null;
            try {
              await capNhatFeedLich(current.feed, current.suKien);
              capNhatTrangThaiFeed({ lanDongBo: new Date().toISOString(), loi: "" });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Chưa cập nhật được lịch.";
              capNhatTrangThaiFeed({ loi: message });
            }
          }
        } finally { dangGui.current = false; }
      })();
    }, lanThuLai ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [feed?.writeKey, chuoiSuKien, luuDuoc, lanThuLai]);

  return null;
}

// Được dùng trong kiểm thử và nút thử lại của phần quản lý feed.
export { baoFeedThuLai };
