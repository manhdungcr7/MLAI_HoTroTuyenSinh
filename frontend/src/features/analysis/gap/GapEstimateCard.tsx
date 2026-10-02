import React from "react";
import { BarChart3 } from "lucide-react";

interface GapEstimateCardProps {
  currentScore: number;
  p10: number;
  p50: number;
  p90: number;
}

export const GapEstimateCard: React.FC<GapEstimateCardProps> = ({ currentScore, p10, p50, p90 }) => {
  // Khoảng tham chiếu hiển thị
  const refMin = p10;
  const refMax = p90;

  // Chênh lệch so với điểm chuẩn gần nhất (P50) — dương là đang dư điểm
  const rawDiff = Number((currentScore - p50).toFixed(1));
  const diffDisplay = rawDiff >= 0 ? `+${rawDiff}` : `${rawDiff}`;
  const isAbove = rawDiff >= 0;

  // Tỷ lệ phần trăm tính theo thang 18 -> 30 điểm
  const minScale = 18;
  const maxScale = 30;
  const totalRange = maxScale - minScale;

  const currentScorePct = Math.max(0, Math.min(100, ((currentScore - minScale) / totalRange) * 100));
  const refLeftPct = Math.max(0, Math.min(100, ((refMin - minScale) / totalRange) * 100));
  const refRightPct = Math.max(0, Math.min(100, ((refMax - minScale) / totalRange) * 100));
  const refWidthPct = Math.max(4, refRightPct - refLeftPct);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Tạm tính so với khoảng điểm chuẩn thường dao động
          </h3>
        </div>

        {/* Big numbers row */}
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {currentScore.toFixed(1)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Bạn hiện tại
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {refMin.toFixed(1)} – {refMax.toFixed(1)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Khoảng điểm chuẩn thường dao động
            </div>
          </div>
        </div>

        {/* Visual Gauge Bar */}
        <div className="pt-2">
          <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden">
            {/* Thanh màu đỏ biểu thị điểm hiện tại */}
            <div
              className={`absolute left-0 top-0 bottom-0 rounded-l-full transition-all duration-500 ${isAbove ? "bg-emerald-400" : "bg-rose-400"}`}
              style={{ width: `${currentScorePct}%` }}
            />

            {/* Dải sọc tím tham chiếu 2025 */}
            <div
              className="absolute top-0 bottom-0 border-x border-indigo-400 bg-indigo-200/80 transition-all duration-500"
              style={{
                left: `${refLeftPct}%`,
                width: `${refWidthPct}%`,
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(99, 102, 241, 0.25) 4px, rgba(99, 102, 241, 0.25) 8px)",
              }}
            />
          </div>

          {/* Tag khoảng cách dưới thanh đo */}
          <div className="mt-3 flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs ${
                isAbove ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
              }`}
            >
              <span className={`font-black text-sm ${isAbove ? "text-emerald-700" : "text-rose-600"}`}>{diffDisplay}</span>
              <span className="font-semibold text-slate-700">điểm so với điểm chuẩn gần nhất ({p50.toFixed(1)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapEstimateCard;
