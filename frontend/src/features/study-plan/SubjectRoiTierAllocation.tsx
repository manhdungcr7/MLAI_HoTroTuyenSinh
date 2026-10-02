import React from "react";
import { Clock, Zap, ShieldCheck } from "lucide-react";
import { SubjectAllocation, WeeklyMicroGoal } from "@/engine/types";

interface SubjectRoiTierAllocationProps {
  allocations: SubjectAllocation[];
  totalAvailableHours: number;
  microGoals?: WeeklyMicroGoal[];
}

export default function SubjectRoiTierAllocation({
  allocations,
  totalAvailableHours,
}: SubjectRoiTierAllocationProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Phân bổ thời gian học theo môn
            </h3>
          </div>
        </div>

        <div className="shrink-0">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
            <span>Quỹ tự học:</span>
            <strong className="text-sm font-black">{totalAvailableHours}h / tuần</strong>
          </span>
        </div>
      </div>

      {/* DANH SÁCH CÁC THẺ MÔN HỌC */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {allocations.map((alloc) => {
          const isBottleneck = alloc.statusBadge === "bottleneck";
          const isSafe = alloc.statusBadge === "safe";
          const isBuffer = alloc.subject === "buffer_review";

          return (
            <div
              key={alloc.subject}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isBottleneck
                  ? "border-amber-200 bg-amber-50/30"
                  : isSafe
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              <div>
                {/* Dòng tiêu đề thẻ môn */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-black text-sm text-slate-900">
                    {alloc.subjectVi}
                  </span>

                  {isBottleneck ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      <Zap className="h-3 w-3 text-amber-700" />
                      Môn trọng tâm
                    </span>
                  ) : isSafe ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-700" />
                      Duy trì điểm
                    </span>
                  ) : isBuffer ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Dự phòng
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      Ôn đều đặn
                    </span>
                  )}
                </div>

                {/* Số giờ học & % */}
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-xl font-black text-slate-900">
                    {alloc.hoursPerWeek}h{" "}
                    <span className="text-xs text-slate-500 font-medium">/ tuần</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {alloc.percentage}% tổng thời gian
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isBottleneck
                        ? "bg-amber-500"
                        : isSafe
                        ? "bg-emerald-500"
                        : isBuffer
                        ? "bg-slate-400"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(100, alloc.percentage * 2.2)}%` }}
                  />
                </div>

                {/* Thông tin điểm hiện tại & mục tiêu */}
                {!isBuffer && (
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-200/60 font-medium">
                    <div>
                      Điểm thi thử: <strong className="text-slate-800">{alloc.currentScore}đ</strong>
                    </div>
                    <div>
                      {(alloc.gap ?? 0) > 0 ? (
                        <span className="text-amber-700 font-bold">
                          Cần tăng: +{alloc.gap}đ
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          Đã đạt mục tiêu
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
