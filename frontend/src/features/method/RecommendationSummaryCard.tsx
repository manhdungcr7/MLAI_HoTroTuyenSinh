import React from "react";
import { Target, BarChart2, Star } from "lucide-react";
import { TargetProgram, GapMetric, SubjectRoiMetric } from "@/engine/types";

export interface RecommendationSummaryCardProps {
  target: TargetProgram | null;
  gapAnalysis: GapMetric;
  topRoi?: SubjectRoiMetric;
  activeCombination?: string;
  className?: string;
}

/**
 * Tóm tắt khuyến nghị — mọi câu đều suy ra từ gapAnalysis và topRoi đã tính.
 * Không có tên trường, điểm hay môn học mặc định.
 */
export function RecommendationSummaryCard({
  target,
  gapAnalysis,
  topRoi,
  activeCombination = "A01",
  className = "",
}: RecommendationSummaryCardProps) {
  const hasScore = gapAnalysis.currentCompositeScore > 0;

  if (!target || !hasScore) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}>
        <h2 className="text-base font-black text-slate-900 tracking-tight mb-2">Tóm tắt khuyến nghị</h2>
        <p className="text-sm text-slate-600 text-pretty">
          {!target
            ? "Chưa chọn ngành mục tiêu nên chưa có khuyến nghị cụ thể."
            : `Chưa đủ điểm 3 môn (tổ hợp ${activeCombination}) để so sánh với điểm chuẩn.`}
        </p>
      </div>
    );
  }

  const gap = gapAnalysis.rawGap;
  const gapMagnitude = Math.abs(gap).toFixed(1);
  const status = gapAnalysis.gapStatus;
  const tone =
    status === "an_toan"
      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
      : status === "vua_tam"
      ? "bg-blue-50/70 border-blue-100 text-blue-950"
      : "bg-amber-50/80 border-amber-200 text-amber-950";

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Target className="h-5 w-5 stroke-[2.4]" />
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">Tóm tắt khuyến nghị</h2>
        </div>

        <div className={`rounded-xl border p-4 text-xs leading-relaxed font-medium mb-5 ${tone}`}>
          <strong className="font-bold">
            {target.majorName} — {target.schoolName}
          </strong>{" "}
          đang ở nhóm <strong>{gapAnalysis.statusLabelVi}</strong> với bạn.{" "}
          {status === "an_toan"
            ? "Khả năng đỗ cao nhưng điểm chuẩn vẫn có thể tăng — hãy giữ thêm nguyện vọng dự phòng."
            : status === "vua_tam"
            ? "Điểm của bạn nằm trong vùng cạnh tranh; kết quả phụ thuộc nhiều vào điểm thi thật."
            : "Điểm của bạn đang thấp hơn điểm chuẩn gần nhất — nên đặt ở nhóm Thử sức và có lựa chọn An toàn phía sau."}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl p-2 shrink-0 mt-0.5 bg-blue-100 text-blue-600">
              <BarChart2 className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-900">Khoảng cách điểm</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Điểm tổ hợp của bạn ({gapAnalysis.currentCompositeScore.toFixed(2)}) đang{" "}
                <strong className={gap >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {gap >= 0 ? `cao hơn ${gapMagnitude}` : `thấp hơn ${gapMagnitude}`} điểm
                </strong>{" "}
                so với điểm chuẩn gần nhất ({gapAnalysis.p50.toFixed(2)}). Điểm chuẩn thường dao động trong khoảng{" "}
                {gapAnalysis.p10.toFixed(1)} – {gapAnalysis.p90.toFixed(1)}.
              </p>
            </div>
          </div>

          {topRoi && (
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-purple-100 p-2 text-purple-600 shrink-0 mt-0.5">
                <Star className="h-4 w-4 fill-purple-600 stroke-none" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900">Vì sao nên ưu tiên {topRoi.subjectVi}?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khi mô phỏng tăng {topRoi.deltaScore} điểm từng môn, {topRoi.subjectVi} giúp bạn gần mục tiêu hơn{" "}
                  {topRoi.gapReduction.toFixed(2)} điểm và có thêm {topRoi.unlockedOptionsCount} ngành trong tầm với —
                  nhiều nhất trong các môn của tổ hợp {activeCombination}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationSummaryCard;
