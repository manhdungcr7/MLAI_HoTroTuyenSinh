import { WifiOff } from "lucide-react";
import { NHAN_NGOAI_TUYEN } from "@/noi-dung/du-bao";
import { useNgoaiTuyen } from "./dung-ngoai-tuyen";

/** Dải nhẹ báo mất mạng; biến mất khi có mạng lại. */
export function BannerNgoaiTuyen() {
  if (!useNgoaiTuyen()) return null;
  return (
    <div role="status" className="flex items-center gap-2 bg-cam-nhat px-4 py-2 text-[13px] font-semibold text-cam-chu">
      <WifiOff size={16} className="shrink-0" /><span>{NHAN_NGOAI_TUYEN}</span>
    </div>
  );
}
