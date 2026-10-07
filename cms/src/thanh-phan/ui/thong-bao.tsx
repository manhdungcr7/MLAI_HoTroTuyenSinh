import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ToneTen } from "@/state/types";
import { TONE_CHU, TONE_NEN, gop } from "./nut-the";

/** Dòng thông báo/gợi ý: biểu tượng, tiêu đề, mô tả ngắn, và một hành động. Dùng cho cảnh báo, gợi ý, tin nhắn nhắc. */
export function DongThongBao({ tone = "cam", icon: Icon, tieuDe, moTa, hanhDong, onClick, children }: {
  tone?: ToneTen; icon?: LucideIcon; tieuDe: ReactNode; moTa?: ReactNode; hanhDong?: string; onClick?: () => void; children?: ReactNode;
}) {
  const Goc = onClick ? "button" : "div";
  return (
    <Goc {...(onClick ? { type: "button" as const, onClick } : {})}
      className={gop("w-full rounded-the p-3.5 flex items-start gap-3 text-left", TONE_NEN[tone], onClick && "active:brightness-95")}>
      {Icon && <Icon size={22} className={gop("shrink-0 mt-0.5", TONE_CHU[tone])} />}
      <span className="flex-1 min-w-0">
        <b className={gop("block text-[15px] leading-snug", TONE_CHU[tone])}>{tieuDe}</b>
        {moTa && <span className="block text-[13px] text-chu mt-0.5">{moTa}</span>}
        {children}
        {hanhDong && <span className="inline-block mt-1.5 text-[13px] font-bold text-xanh">{hanhDong}</span>}
      </span>
      {onClick && !hanhDong && <ChevronRight size={18} className="text-chu-phu shrink-0 mt-1" />}
    </Goc>
  );
}
