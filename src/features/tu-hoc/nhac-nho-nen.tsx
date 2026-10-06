// Gắn một lần ở cấp App: hẹn giờ nhắc học, gửi thông báo của trình duyệt, và hiện dòng nhắc ngay trong ứng dụng
// (để em vẫn thấy nhắc khi trình duyệt chặn thông báo hoặc không hỗ trợ).
import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNhacNho } from "./dung-nhac-nho";
import type { NhacSapToi } from "./nhac-nho";

export function NhacNhoNen() {
  const [dang, setDang] = useState<NhacSapToi | null>(null);
  const onNhac = useCallback((n: NhacSapToi) => { if (document.visibilityState === "visible") setDang(n); }, []);
  useNhacNho(onNhac);
  useEffect(() => {
    if (!dang) return;
    const t = window.setTimeout(() => setDang(null), 20_000);
    return () => window.clearTimeout(t);
  }, [dang]);
  if (!dang) return null;
  return (
    <div role="alert" className="fixed top-3 inset-x-0 z-50 mx-auto max-w-[430px] px-3">
      <div className="flex items-start gap-3 rounded-the bg-trang border border-xanh/40 shadow-nut p-3">
        <span className="size-9 rounded-xl grid place-items-center bg-xanh-nhat text-xanh shrink-0"><Bell size={18} /></span>
        <div className="flex-1 min-w-0">
          <b className="block text-[14px] text-muc leading-snug">{dang.tieuDe}</b>
          <span className="block text-[13px] text-chu-phu leading-snug">{dang.moTa}</span>
        </div>
        <button type="button" aria-label="Đóng nhắc nhở" onClick={() => setDang(null)} className="size-11 -mr-1 -mt-1 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><X size={18} /></button>
      </div>
    </div>
  );
}
