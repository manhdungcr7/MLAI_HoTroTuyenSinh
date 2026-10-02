import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SubjectRoiAnalysis } from "@/engine/roi/selectors";

interface SubjectRoiChartProps {
  analysis: SubjectRoiAnalysis;
}

export const SubjectRoiChart: React.FC<SubjectRoiChartProps> = ({ analysis }) => {
  return (
    <div className="space-y-2 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
          Hiệu Quả Mở Rộng Cơ Hội Khi Tăng Điểm Từng Môn (Thang 10)
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 inline-block" /> Nhóm 1: Ưu tiên bứt phá số 1
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 inline-block" /> Nhóm 2: Bổ trợ cải thiện
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400 inline-block" /> Nhóm 3: Duy trì ổn định
          </span>
        </div>
      </div>

      <div className="h-56 w-full border border-slate-200 rounded-xl bg-slate-50/50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analysis.chartData} margin={{ top: 15, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={{ stroke: "#cbd5e1" }}
              unit="/10"
            />
            <Tooltip
              formatter={(value: any, name: any, item: any) => {
                const payload = item.payload;
                return [
                  `${value} / 10 (Mở +${payload.unlocked} NV, Thu hẹp +${payload.gapReduction}đ)`,
                  "Điểm ưu tiên",
                ];
              }}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#0f172a",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar dataKey="roi" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {analysis.chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.tier === 1
                      ? "#4f46e5" // indigo-600
                      : entry.tier === 2
                      ? "#2563eb" // blue-600
                      : "#94a3b8" // slate-400
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
