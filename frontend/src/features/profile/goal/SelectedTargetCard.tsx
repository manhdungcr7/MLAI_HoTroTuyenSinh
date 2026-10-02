import React from "react";
import { Target, Sparkles, FileText, Coins, BarChart3 } from "lucide-react";
import { TargetProgram } from "@/engine/types";
import { formatTuitionPerYear, NO_DATA_LABEL } from "@/lib/format";

interface SelectedTargetCardProps {
  target: TargetProgram | null;
}

function latestCutoff(target: TargetProgram): { year: number; score: number } | null {
  const years = [
    [2024, target.cutoff2024],
    [2023, target.cutoff2023],
    [2022, target.cutoff2022],
    [2021, target.cutoff2021],
  ] as const;
  for (const [year, score] of years) {
    if (typeof score === "number") return { year, score };
  }
  return null;
}

export const SelectedTargetCard: React.FC<SelectedTargetCardProps> = ({ target }) => {
  const cutoff = target ? latestCutoff(target) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Mục tiêu đang chọn</h3>
          </div>
          {target && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/70 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Mục tiêu chính</span>
            </span>
          )}
        </div>

        {!target ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 text-pretty">
            Chưa chọn mục tiêu. Chọn một ngành ở danh sách bên dưới để xem khoảng cách điểm và chiến lược.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-13 h-13 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-1.5">
                <div className="text-[11px] font-black text-blue-800 leading-tight text-center">{target.schoolCode}</div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2 text-pretty leading-snug">
                  {target.schoolName}
                </h4>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 text-pretty mt-0.5">{target.majorName}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tổ hợp xét tuyển</span>
                </div>
                <span className="font-bold text-slate-800 text-right">
                  {target.combinations.length > 0 ? target.combinations.join(", ") : NO_DATA_LABEL}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  <span>Học phí</span>
                </div>
                <span className="font-bold text-slate-800">{formatTuitionPerYear(target.tuitionVnd)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cutoff ? `Điểm chuẩn ${cutoff.year}` : "Điểm chuẩn"}</span>
                </div>
                <span className="font-black text-slate-900 text-sm">
                  {cutoff ? (
                    <>
                      {cutoff.score.toFixed(2)} <span className="text-xs font-semibold text-slate-500">điểm</span>
                    </>
                  ) : (
                    NO_DATA_LABEL
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectedTargetCard;
