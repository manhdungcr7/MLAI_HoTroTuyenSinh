import React from "react";
import { Target, Trophy, Database, HelpCircle, TrendingUp } from "lucide-react";

interface GapRightInsightsProps {
  currentScore: number;
  p10: number;
  p90: number;
  yearsOfData: number;
}

export const GapRightInsights: React.FC<GapRightInsightsProps> = ({ currentScore, p10, p90, yearsOfData }) => {
  // Trạng thái theo vị trí của điểm so với khoảng dao động (không dùng Math.abs — dư/thiếu phải rõ ràng)
  const status =
    currentScore <= 0
      ? { tag: "Chưa có điểm", tone: "bg-slate-50 border-slate-200 text-slate-600" }
      : currentScore >= p90
      ? { tag: "Vùng an toàn", tone: "bg-emerald-50 border-emerald-200 text-emerald-700" }
      : currentScore >= p10
      ? { tag: "Đang cạnh tranh", tone: "bg-blue-50 border-blue-200 text-blue-700" }
      : { tag: "Còn khoảng cách", tone: "bg-rose-50 border-rose-200 text-rose-600" };
  const needLow = Math.max(0, p10 - currentScore);
  const needHigh = Math.max(0, p90 - currentScore);

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* CARD 1: VÙNG THAM CHIẾU */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Điểm chuẩn thường dao động</h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {yearsOfData > 0 ? `Dựa trên ${yearsOfData} năm dữ liệu` : "Chưa có lịch sử điểm chuẩn"}
          </span>
        </div>
        <div className="pt-2">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {p10.toFixed(1)} – {p90.toFixed(1)}
          </div>
        </div>
      </div>

      {/* CARD 2: TRẠNG THÁI CẠNH TRANH */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Vị trí của bạn</h3>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.tone}`}>{status.tag}</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            {currentScore <= 0 ? (
              "Nhập đủ điểm 3 môn để xem vị trí của bạn."
            ) : currentScore >= p90 ? (
              <>Điểm của bạn cao hơn cả mức cao của khoảng dao động. Khả năng đỗ cao nhưng vẫn nên giữ nguyện vọng dự phòng.</>
            ) : currentScore >= p10 ? (
              <>
                Bạn đang trong khoảng dao động. Cần thêm khoảng{" "}
                <strong className="text-slate-900 font-extrabold">{needHigh.toFixed(1)} điểm</strong> để vượt mức cao của khoảng.
              </>
            ) : (
              <>
                Bạn cần thêm khoảng{" "}
                <strong className="font-extrabold text-rose-600">
                  {needLow.toFixed(1)} – {needHigh.toFixed(1)} điểm
                </strong>{" "}
                để vào khoảng dao động và vượt mức cao của khoảng.
              </>
            )}
          </p>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-blue-600">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapRightInsights;
