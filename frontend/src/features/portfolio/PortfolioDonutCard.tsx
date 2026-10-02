import React from "react";
import { BarChart3, Info, Flame, Scale, ShieldCheck } from "lucide-react";

interface PortfolioDonutCardProps {
  reachCount: number;
  targetCount: number;
  safetyCount: number;
  totalCount: number;
  /** Nhận xét cơ cấu tính từ assessPortfolio — không dùng câu cố định */
  assessmentVi: string;
}

export function PortfolioDonutCard({
  reachCount,
  targetCount,
  safetyCount,
  totalCount,
  assessmentVi,
}: PortfolioDonutCardProps) {
  const total = totalCount || 1;
  const reachPct = (reachCount / total) * 100;
  const targetPct = (targetCount / total) * 100;
  const safetyPct = (safetyCount / total) * 100;

  // SVG Donut calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  const reachStroke = (reachCount / total) * circumference;
  const targetStroke = (targetCount / total) * circumference;
  const safetyStroke = (safetyCount / total) * circumference;

  const reachOffset = 0;
  const targetOffset = -reachStroke;
  const safetyOffset = -(reachStroke + targetStroke);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <BarChart3 className="h-4 w-4" />
        </div>
        <h3 className="font-extrabold text-base tracking-tight">Phân bổ hiện tại</h3>
      </div>

      {/* Donut Chart & Legend Row */}
      <div className="flex items-center justify-between gap-4 py-1">
        {/* Donut Chart SVG */}
        <div className="relative shrink-0 grid place-items-center">
          <svg
            className="h-32 w-32 -rotate-90 transform"
            viewBox="0 0 120 120"
            role="img"
            aria-label={`Biểu đồ phân bổ nguyện vọng: ${reachCount} thách thức, ${targetCount} cân bằng, ${safetyCount} an toàn`}
          >
            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="16"
            />

            {/* Reach arc (Pink / Rose) */}
            {reachCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#FB7185" // rose-400
                strokeWidth="16"
                strokeDasharray={`${reachStroke} ${circumference - reachStroke}`}
                strokeDashoffset={reachOffset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            )}

            {/* Target arc (Amber / Yellow) */}
            {targetCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#FBBF24" // amber-400
                strokeWidth="16"
                strokeDasharray={`${targetStroke} ${circumference - targetStroke}`}
                strokeDashoffset={targetOffset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            )}

            {/* Safety arc (Emerald / Green) */}
            {safetyCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke="#34D399" // emerald-400
                strokeWidth="16"
                strokeDasharray={`${safetyStroke} ${circumference - safetyStroke}`}
                strokeDashoffset={safetyOffset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Center text inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
              nguyện vọng
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 min-w-[130px]">
          {/* Thách thức */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Flame className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="font-medium">Thử sức</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm">{reachCount}</span>
          </div>

          {/* Cân bằng */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Scale className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="font-medium">Phù hợp</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm">{targetCount}</span>
          </div>

          {/* An toàn */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium">An toàn</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm">{safetyCount}</span>
          </div>
        </div>
      </div>

      {/* Advice Callout Box */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 leading-relaxed">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="font-medium">
          {assessmentVi}
        </p>
      </div>
    </div>
  );
}
