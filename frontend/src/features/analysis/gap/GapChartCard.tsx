import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart2, HelpCircle } from "lucide-react";

interface GapChartCardProps {
  currentScore: number;
  /** null = năm đó không có điểm chuẩn hợp lệ (không vẽ điểm) */
  cutoff2022: number | null;
  cutoff2023: number | null;
  cutoff2024: number | null;
  refMin: number;
  refMax: number;
}

export const GapChartCard: React.FC<GapChartCardProps> = ({
  currentScore,
  cutoff2022,
  cutoff2023,
  cutoff2024,
  refMin,
  refMax,
}) => {
  // Tính toán miền trục Y linh hoạt dựa trên dữ liệu thực tế
  const allScores = [currentScore, cutoff2022, cutoff2023, cutoff2024, refMin, refMax].filter(
    (s): s is number => typeof s === "number" && !isNaN(s)
  );
  const minVal = Math.min(...allScores);
  const maxVal = Math.max(...allScores);
  const domainMin = Math.max(0, Math.min(18, Math.floor(minVal - 1)));
  const domainMax = Math.min(30, Math.max(30, Math.ceil(maxVal + 0.5)));

  // Hàm chuyển đổi điểm sang % chiều cao trong đồ thị (margin top ~9.2%, plot ~77.9%, bottom ~12.9%)
  const getPercentY = (score: number) => {
    const clamped = Math.max(domainMin, Math.min(domainMax, score));
    const ratio = (domainMax - clamped) / (domainMax - domainMin);
    return Math.round((9.2 + ratio * 77.9) * 10) / 10;
  };

  const yRefTop = getPercentY(refMax);
  const yRefBottom = getPercentY(refMin);
  const refHeight = Math.max(3.5, yRefBottom - yRefTop);
  const yCurrent = getPercentY(currentScore);

  // Dữ liệu biểu đồ 4 mốc: 2022, 2023, 2024, 2025 (tham chiếu)
  const data = [
    { year: "2022", cutoff: cutoff2022, userScore: null },
    { year: "2023", cutoff: cutoff2023, userScore: null },
    { year: "2024", cutoff: cutoff2024, userScore: null },
    { year: "Năm tới\n(tham chiếu)", cutoff: null, userScore: currentScore },
  ];

  // Custom Dot cho đường xanh thực tế
  const renderBlueDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.cutoff === null || payload.cutoff === undefined) return null;
    return (
      <g key={`dot-${payload.year}`}>
        <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={11}
          fontWeight={800}
        >
          {payload.cutoff.toFixed(1)}
        </text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header with Title & Custom Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Khoảng cách tới mục tiêu
            </h3>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition"
              title="Xu hướng điểm chuẩn các năm trước và khoảng tham chiếu dự báo"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-600 font-medium">
            {/* Khoảng tham chiếu */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-2.5 rounded-xs bg-indigo-200 border border-indigo-300 inline-block" />
              <span>Khoảng tham chiếu</span>
            </div>

            {/* Điểm chuẩn thực tế */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                <span className="w-2 h-0.5 bg-blue-600 inline-block" />
                <span className="w-2 h-2 rounded-full bg-blue-600 border border-white inline-block" />
                <span className="w-2 h-0.5 bg-blue-600 inline-block" />
              </div>
              <span>Điểm chuẩn (thực tế)</span>
            </div>

            {/* Bạn hiện tại */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Bạn hiện tại</span>
            </div>
          </div>
        </div>

        {/* Y Axis Unit */}
        <div className="text-[11px] font-bold text-slate-400 pl-2">
          Điểm
        </div>

        {/* Chart Area */}
        <div className="h-68 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 25, right: 35, left: -10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="year"
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              />

              <YAxis
                domain={[18, 30]}
                ticks={[18, 21, 24, 27, 30]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                        <div className="font-extrabold text-slate-800 mb-1">{label}</div>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600">{entry.name}:</span>
                            <span className="font-bold text-slate-900">
                              {entry.value ? `${entry.value}đ` : "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Đường điểm chuẩn thực tế (Blue Line) */}
              <Line
                type="linear"
                dataKey="cutoff"
                name="Điểm chuẩn thực tế"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={renderBlueDot}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* SVG Overlay cho năm 2025: Tham chiếu tím + Chấm đỏ bạn hiện tại */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              {/* Vị trí cột 2025: x khoảng 87.5% chiều rộng */}
              {/* Tọa độ Y tương ứng miền [18, 30] với margin top 25px, bottom 35px trên h=272px */}
              {/* Chiều cao vẽ đồ thị = 272 - 60 = 212px. Tỷ lệ = 212 / 12 = 17.67px / 1 điểm */}
              {/* Y(30) = 25px; Y(18) = 237px */}
              {/* Y(26.5) = 25 + (30 - 26.5) * 17.67 = 86.8px */}
              {/* Y(25.7) = 25 + (30 - 25.7) * 17.67 = 101.0px */}
              {/* Y(22.9) = 25 + (30 - 22.9) * 17.67 = 150.5px */}
              <defs>
                <pattern id="diagStripes" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#818cf8" strokeWidth="2" opacity="0.3" />
                </pattern>
              </defs>

              {/* Dải tham chiếu tím tính động theo refMin, refMax */}
              <rect
                x="82%"
                y={`${yRefTop}%`}
                width="12%"
                height={`${refHeight}%`}
                rx="3"
                fill="#e0e7ff"
                stroke="#818cf8"
                strokeWidth="1"
              />
              <rect
                x="82%"
                y={`${yRefTop}%`}
                width="12%"
                height={`${refHeight}%`}
                rx="3"
                fill="url(#diagStripes)"
              />

              {/* Nhãn dải tham chiếu */}
              <text
                x="88%"
                y={`${Math.max(5, yRefTop - 2.5)}%`}
                textAnchor="middle"
                fill="#1e1b4b"
                fontSize="11"
                fontWeight="800"
              >
                {refMin.toFixed(1)} – {refMax.toFixed(1)}
              </text>

              {/* Đường nét đứt nối điểm hiện tại tới ngưỡng tham chiếu */}
              {Math.abs(yCurrent - (currentScore < refMin ? yRefBottom : yRefTop)) > 2 && (
                <line
                  x1="88%"
                  y1={`${currentScore < refMin ? yRefBottom : yRefTop}%`}
                  x2="88%"
                  y2={`${currentScore < refMin ? Math.max(0, yCurrent - 2) : Math.min(100, yCurrent + 2)}%`}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Chấm đỏ bạn hiện tại */}
              <circle cx="88%" cy={`${yCurrent}%`} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />

              {/* Nhãn điểm hiện tại */}
              <text
                x="88%"
                y={`${Math.min(91, Math.max(8, yCurrent + (currentScore < refMin ? 7 : -4)))}%`}
                textAnchor="middle"
                fill="#e11d48"
                fontSize="11"
                fontWeight="800"
              >
                {currentScore.toFixed(1)}
              </text>
              <text
                x="88%"
                y={`${Math.min(97, Math.max(14, yCurrent + (currentScore < refMin ? 13 : 8)))}%`}
                textAnchor="middle"
                fill="#e11d48"
                fontSize="10"
                fontWeight="700"
              >
                Bạn hiện tại
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapChartCard;
