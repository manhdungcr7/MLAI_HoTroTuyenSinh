import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";

/** Một câu hỏi lại ngắn khi thiếu thông tin (trường, ngành, điểm); phần lựa chọn trả lời nằm trong children. */
export function AIClarificationMessage({ cauHoi, children }: { cauHoi: string; children?: ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-xanh/30 bg-xanh-nhat/60 p-2.5 space-y-2" role="group" aria-label="Mình cần hỏi lại">
      <p className="flex items-start gap-1.5 text-[13.5px] font-semibold text-muc leading-snug"><CircleHelp size={16} className="mt-0.5 shrink-0 text-xanh" aria-hidden /><span className="min-w-0 break-words">{cauHoi}</span></p>
      {children}
    </div>
  );
}
