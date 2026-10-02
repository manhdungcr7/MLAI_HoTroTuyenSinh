import React from "react";
import { Sparkles, FileText, BarChart3, Coins, Heart, Target } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

export const ProfileSummaryStrip: React.FC = () => {
  const { profile, gapAnalysis } = useDecision();

  // Điểm số tính toán thực tế hoặc fallback 22.9 điểm theo tham chiếu
  const currentScore = gapAnalysis?.currentCompositeScore && gapAnalysis.currentCompositeScore > 0
    ? gapAnalysis.currentCompositeScore
    : 22.9;

  const combination = profile.activeCombination || "A01";

  const budgetDisplay = profile.annualBudgetVnd
    ? `<= ${Math.round(profile.annualBudgetVnd / 1000000)} triệu/năm`
    : "<= 40 triệu/năm";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span>Hồ sơ hiện tại của bạn</span>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Tổ hợp */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổ hợp xét tuyển</div>
            <div className="text-base font-black text-slate-900 mt-0.5">{combination}</div>
          </div>
        </div>

        {/* Card 2: Tổng điểm */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổng điểm hiện tại</div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {currentScore.toFixed(1)} <span className="text-xs font-semibold text-slate-500">điểm</span>
            </div>
          </div>
        </div>

        {/* Card 3: Học phí */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Học phí mong muốn</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 whitespace-nowrap">
              {budgetDisplay}
            </div>
          </div>
        </div>

        {/* Card 4: Lĩnh vực */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">Quan tâm lĩnh vực</div>
            <div className="text-base font-black text-slate-900 mt-0.5">CNTT</div>
          </div>
        </div>

        {/* Card 5: Callout tím/xanh */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-indigo-950">Mục tiêu phù hợp</div>
            <div className="text-[11px] font-medium text-indigo-700 leading-snug mt-0.5">
              sẽ giúp bạn đi đúng hướng ngay từ hôm nay!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummaryStrip;
