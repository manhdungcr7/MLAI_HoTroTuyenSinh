import React from "react";
import { TrendingUp, Target, Sparkles, ArrowRight } from "lucide-react";
import Link from "@/components/navigation/HashLink";

interface GapNineStepBarProps {
  currentStep?: number;
  totalSteps?: number;
  subtitle?: string;
  calloutText?: string;
}

export const GapNineStepBar: React.FC<GapNineStepBarProps> = ({
  subtitle = "Định vị khoảng cách năng lực mục tiêu",
  calloutText = "Phân tích chi tiết giúp bạn hiểu rõ khoảng cách điểm số và xây dựng chiến lược bứt phá phù hợp.",
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      {/* Left: Brand Icon + Status */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {subtitle}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Gap Analysis
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions to ROI or Scenario Lab */}
      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
        <Link
          href="/analysis/roi"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <span>Xem môn ưu tiên bứt phá</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/analysis/simulation"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mô phỏng điểm</span>
        </Link>
      </div>
    </div>
  );
};

export default GapNineStepBar;
