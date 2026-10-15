import { Link } from "react-router-dom";
import { gop } from "@/components/ui/nut-the";

export interface ChipHanhDong {
  nhan: string;
  /** Đường dẫn (DUONG_DAN.xxx) hoặc hàm khi bấm. */
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const CHIP = "min-h-11 max-w-full rounded-full border border-xanh/40 bg-trang px-3.5 py-1.5 text-[13px] font-semibold text-xanh text-left leading-snug break-words whitespace-normal inline-flex items-center active:bg-xanh-nhat disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";

/** Hàng nút gợi ý tiếp theo: xuống dòng khi hết chỗ (không cuộn ngang), cao tối thiểu 44px, chữ dài tự ngắt dòng. */
export function SuggestedActionChips({ muc, nhanNhom, onDi }: { muc: ChipHanhDong[]; nhanNhom?: string; onDi?: () => void }) {
  if (muc.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={nhanNhom ?? "Gợi ý tiếp theo"}>
      {muc.map((m, i) => m.to
        ? <Link key={i} to={m.to} onClick={onDi} className={gop(CHIP)}>{m.nhan}</Link>
        : <button key={i} type="button" disabled={m.disabled} onClick={m.onClick} className={gop(CHIP)}>{m.nhan}</button>)}
    </div>
  );
}
