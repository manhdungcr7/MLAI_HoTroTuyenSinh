import React from "react";
import { BarChart3, Info } from "lucide-react";

export interface SubjectLeverageItem {
  subjectName: string;
  optionsAdded: number;
  barColor: string;
  percentage: number; // 0 to 100
}

interface SubjectLeverageBarsProps {
  items?: SubjectLeverageItem[];
  className?: string;
}

const DEFAULT_LEVERAGE_ITEMS: SubjectLeverageItem[] = [
  {
    subjectName: "Tiếng Anh",
    optionsAdded: 12,
    barColor: "bg-gradient-to-r from-purple-500 to-indigo-600",
    percentage: 85,
  },
  {
    subjectName: "Toán",
    optionsAdded: 8,
    barColor: "bg-blue-500",
    percentage: 58,
  },
  {
    subjectName: "Vật lý",
    optionsAdded: 6,
    barColor: "bg-sky-400",
    percentage: 42,
  },
  {
    subjectName: "Ngữ văn",
    optionsAdded: 3,
    barColor: "bg-emerald-400",
    percentage: 22,
  },
];

export const SubjectLeverageBars: React.FC<SubjectLeverageBarsProps> = ({
  items = DEFAULT_LEVERAGE_ITEMS,
  className = "",
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 stroke-[2.2]" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          Tiềm năng mở rộng cơ hội theo môn
          <span title="Số lượng nguyện vọng ngành/trường mới có xác suất trúng tuyển đạt từ 40% trở lên khi tăng 1 điểm">
            <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
          </span>
        </h3>
      </div>

      {/* Bars list */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.subjectName} className="flex items-center gap-3 sm:gap-4 text-xs">
            {/* Subject Label */}
            <span className="w-20 sm:w-24 text-slate-700 font-bold shrink-0">
              {item.subjectName}
            </span>

            {/* Track & Bar Container */}
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-3.5 sm:h-4 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* +X value label */}
              <span className="w-8 text-right font-black text-slate-900 text-sm shrink-0">
                +{item.optionsAdded}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
