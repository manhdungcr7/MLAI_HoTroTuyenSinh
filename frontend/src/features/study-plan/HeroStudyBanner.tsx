import React from "react";
import { Clock, Calendar } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

export default function HeroStudyBanner() {
  const { studyPlan, profile } = useDecision();
  const hoursConfigured = profile.familyConstraints?.availableWeeklyHours != null || profile.availableHoursPerWeek > 0;
  const availableHours = studyPlan.totalAvailableHours;

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER TITLE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Kế hoạch ôn thi
        </h1>
      </div>

      {/* 2. HERO TIME CARD & MOTIVATIONAL QUOTE */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* LEFT: CLOCK ICON & HOURS INFO */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {hoursConfigured ? <>Bạn có <span className="text-blue-600 font-black">{availableHours} giờ/tuần</span> cho tự học</> : "Chưa nhập thời gian tự học khả dụng"}
            </h2>
          </div>
        </div>

        {/* RIGHT: MOTIVATIONAL QUOTE BADGE */}
        <div className="w-full md:w-auto flex items-center justify-end">
          <div className="flex items-center gap-3 bg-white/95 px-4 py-3 rounded-2xl border border-blue-100 shadow-2xs">
            {/* Lịch nhỏ biểu tượng */}
            <div className="relative w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-200/70 shrink-0">
              <Calendar className="w-4 h-4" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">
                ✓
              </span>
            </div>

            <div className="text-xs sm:text-sm font-bold text-blue-700 italic tracking-tight">
              “Kỷ luật hôm nay, kết quả ngày mai!”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
