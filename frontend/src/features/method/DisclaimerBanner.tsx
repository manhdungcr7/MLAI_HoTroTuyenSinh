import React from "react";
import { Lightbulb } from "lucide-react";

export interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className = "" }: DisclaimerBannerProps) {
  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-xs flex items-start gap-4 transition-all ${className}`}
    >
      <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 shrink-0 shadow-xs flex items-center justify-center">
        <Lightbulb className="h-6 w-6 stroke-[2.2] animate-pulse" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          Hệ thống không đảm bảo trúng tuyển.
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed text-wrap-pretty">
          Hệ thống Nguyện Vọng chỉ đưa ra khuyến nghị dựa trên dữ liệu và thuật toán phân tích, giúp bạn có thêm căn cứ để lựa chọn. Quyết định cuối cùng luôn thuộc về bạn và gia đình.
        </p>
      </div>
    </div>
  );
}

export default DisclaimerBanner;
