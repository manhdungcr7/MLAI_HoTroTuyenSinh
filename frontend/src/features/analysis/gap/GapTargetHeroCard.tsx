import React from "react";
import Link from "@/components/navigation/HashLink";
import { Target, Edit3, MapPin } from "lucide-react";
import { TargetProgram } from "@/engine/types";

interface GapTargetHeroCardProps {
  target: TargetProgram;
  /** Điểm của em theo phương thức đang tính (điểm thi hoặc học bạ). */
  currentScore: number;
  /** Điểm chuẩn dự kiến (P50) của ngành mục tiêu. */
  expectedCutoff: number;
}

/** Thẻ mục tiêu: chỉ hiển thị số liệu thật của ngành đã chọn, không có giá trị mặc định. */
export const GapTargetHeroCard: React.FC<GapTargetHeroCardProps> = ({ target, currentScore, expectedCutoff }) => {
  const diff = currentScore - expectedCutoff;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Mục tiêu của em</h3>
          </div>
          <Link href="/analysis" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Đổi mục tiêu</span>
          </Link>
        </div>

        <div className="min-w-0">
          <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{target.schoolName}</h4>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{target.majorName}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-center">
          <div className="rounded-xl bg-slate-50/80 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Điểm chuẩn dự kiến</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{expectedCutoff.toFixed(1)}</div>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Điểm của em</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{currentScore.toFixed(2)}</div>
          </div>
          <div className={`rounded-xl p-2.5 border ${diff >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
            <div className="text-[11px] font-bold text-slate-600">{diff >= 0 ? "Dư" : "Thiếu"}</div>
            <div className={`text-base sm:text-lg font-black mt-0.5 ${diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{Math.abs(diff).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapTargetHeroCard;
