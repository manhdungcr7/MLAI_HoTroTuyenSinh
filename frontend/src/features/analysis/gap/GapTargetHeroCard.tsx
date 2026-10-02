import React from "react";
import Link from "@/components/navigation/HashLink";
import { Target, Edit3, MapPin } from "lucide-react";
import { TargetProgram } from "@/engine/types";

interface GapTargetHeroCardProps {
  target: TargetProgram | null;
  currentScore: number;
}

export const GapTargetHeroCard: React.FC<GapTargetHeroCardProps> = ({
  target,
  currentScore = 22.9,
}) => {
  // Chuẩn hóa dữ liệu theo Reference Image 4: Đại học Bách khoa Hà Nội - Kỹ thuật Máy tính (IT1)
  const isBka = target?.schoolCode === "BKA" || !target;

  const schoolName = target ? target.schoolName : "Đại học Bách khoa Hà Nội";
  const majorName = target ? target.majorName : "Kỹ thuật Máy tính (IT1)";
  const cutoff2024 = target?.cutoff2024 ?? 28.2;
  const myTargetScore = 28.5; // Điểm mục tiêu phấn đấu chuẩn theo Image 4

  const imageUrl = isBka ? "/images/hust-c1.jpg" : "/images/uit.svg";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Mục tiêu của bạn</h3>
          </div>

          <Link
            href="/profile/goal"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Thay đổi mục tiêu</span>
          </Link>
        </div>

        {/* School Info Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
            <img
              src={imageUrl}
              alt={schoolName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {schoolName}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{majorName}</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Boxes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-center">
          <div className="rounded-xl bg-slate-50/80 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Điểm chuẩn 2024</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {cutoff2024.toFixed(1)}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/60 p-2.5 border border-blue-100/60">
            <div className="text-[11px] font-bold text-blue-600">Mục tiêu của tôi</div>
            <div className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
              {myTargetScore.toFixed(1)}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50/80 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Điểm hiện tại (dự kiến)</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {currentScore.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapTargetHeroCard;
