import React from "react";
import { Lightbulb } from "lucide-react";

export interface InsightCardItem {
  id: number;
  badgeNumber: number;
  badgeBgColor: string;
  title: string;
  description: string;
}

interface QuickInsightsCardsProps {
  insights?: InsightCardItem[];
  className?: string;
}

const DEFAULT_INSIGHTS: InsightCardItem[] = [
  {
    id: 1,
    badgeNumber: 1,
    badgeBgColor: "bg-emerald-500",
    title: "Ưu tiên Tiếng Anh",
    description: "Tăng điểm Tiếng Anh mang lại nhiều lựa chọn ngành/trường mới nhất.",
  },
  {
    id: 2,
    badgeNumber: 2,
    badgeBgColor: "bg-blue-600",
    title: "Giữ ổn định Toán",
    description: "Toán đang ở mức tốt, tiếp tục duy trì để đảm bảo lợi thế cạnh tranh.",
  },
  {
    id: 3,
    badgeNumber: 3,
    badgeBgColor: "bg-purple-600",
    title: "Vật lý vẫn quan trọng",
    description: "Tăng điểm Vật lý giúp mở thêm lựa chọn ở các nhóm ngành kỹ thuật, công nghệ.",
  },
];

export const QuickInsightsCards: React.FC<QuickInsightsCardsProps> = ({
  insights = DEFAULT_INSIGHTS,
  className = "",
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2">
        <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 stroke-[2.2] fill-amber-400 text-amber-500" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Kết luận nhanh
        </h3>
      </div>

      {/* 3 Insight Cards */}
      <div className="space-y-3">
        {insights.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors"
          >
            {/* Number Badge */}
            <div
              className={`h-7 w-7 rounded-full text-white font-black text-xs shrink-0 flex items-center justify-center shadow-xs ${item.badgeBgColor}`}
            >
              {item.badgeNumber}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
