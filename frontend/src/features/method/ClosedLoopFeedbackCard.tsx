import React from "react";
import { RefreshCw, BarChart2, Users, FileCheck, Calendar, ArrowRight } from "lucide-react";

export interface ClosedLoopFeedbackCardProps {
  className?: string;
}

export function ClosedLoopFeedbackCard({ className = "" }: ClosedLoopFeedbackCardProps) {
  const loopSteps = [
    {
      id: "gap",
      title: "Cập nhật Gap",
      desc: "Tính lại khoảng cách so với mục tiêu",
      icon: BarChart2,
      cardBg: "bg-purple-50/70 border-purple-200/80 text-purple-900",
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      id: "candidates",
      title: "Chọn ứng viên",
      desc: "Sắp xếp lại danh sách trường, ngành phù hợp",
      icon: Users,
      cardBg: "bg-blue-50/70 border-blue-200/80 text-blue-900",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      id: "wishlist",
      title: "Cập nhật nguyện vọng",
      desc: "Điều chỉnh thứ tự gợi ý",
      icon: FileCheck,
      cardBg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "study-plan",
      title: "Làm mới kế hoạch ôn tập",
      desc: "Đề xuất lộ trình học phù hợp hơn",
      icon: Calendar,
      cardBg: "bg-amber-50/70 border-amber-200/80 text-amber-900",
      iconBg: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <RefreshCw className="h-5 w-5 stroke-[2.4]" />
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Nếu cập nhật điểm mới
          </h2>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Khi bạn cập nhật điểm mới (ví dụ kết quả thi thử), hệ thống sẽ tự động tính toán lại và cập nhật toàn bộ khuyến nghị theo quy trình sau:
        </p>

        {/* 4 Loop Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch">
          {loopSteps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === loopSteps.length - 1;

            return (
              <div key={step.id} className="relative flex flex-col justify-between">
                <div
                  className={`rounded-xl border p-3 flex flex-col items-center text-center h-full transition-all hover:shadow-xs ${step.cardBg}`}
                >
                  <div className={`rounded-lg p-2 mb-2 ${step.iconBg}`}>
                    <Icon className="h-4 w-4 stroke-[2.2]" />
                  </div>
                  <h4 className="text-xs font-black mb-1">{step.title}</h4>
                  <p className="text-[11px] opacity-80 leading-snug">{step.desc}</p>
                </div>

                {/* Arrow connector for desktop */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ClosedLoopFeedbackCard;
