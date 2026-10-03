import React from "react";
import { DetailedGapAnalysis } from "@/engine/gap/selectors";
import { GapNineStepBar } from "@/features/analysis/gap/GapNineStepBar";
import { GapTargetHeroCard } from "@/features/analysis/gap/GapTargetHeroCard";
import { GapEstimateCard } from "@/features/analysis/gap/GapEstimateCard";
import { GapChartCard } from "@/features/analysis/gap/GapChartCard";
import { GapRightInsights } from "@/features/analysis/gap/GapRightInsights";
import Link from "@/components/navigation/HashLink";

interface GapAnalysisViewProps {
  analysis: DetailedGapAnalysis;
  showStepBar?: boolean;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  analysis,
  showStepBar = true,
}) => {
  const currentScore = analysis.currentCompositeScore > 0 ? analysis.currentCompositeScore : 0;
  const { p10, p50, p90 } = analysis;

  return (
    <div className="space-y-5">
      {/* 0. CẢNH BÁO NẾU CHƯA CÓ ĐIỂM */}
      {currentScore === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-medium text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <strong>Lưu ý:</strong> Bạn chưa nhập đủ điểm 3 môn cho tổ hợp {analysis.targetProgram?.combinations?.join(", ")} của ngành này. Nhập điểm để xem khoảng cách.
          </div>
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
          >
            Nhập điểm ngay
          </Link>
        </div>
      )}

      {/* 1. PROGRESS BAR: 9 BƯỚC (BƯỚC 3 ACTIVE) */}
      {showStepBar && (
        <GapNineStepBar
          currentStep={3}
          totalSteps={9}
          subtitle="Bạn đang ở đâu so với mục tiêu?"
          calloutText="Phân tích chi tiết giúp bạn hiểu rõ khoảng cách và xây dựng lộ trình phù hợp hơn."
        />
      )}

      {/* 2. HÀNG 1: THẺ MỤC TIÊU CỦA BẠN & THẺ TẠM TÍNH KHOẢNG THAM CHIẾU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="h-full">
          <GapTargetHeroCard
            target={analysis.targetProgram}
            currentScore={currentScore}
            expectedCutoff={p50}
          />
        </div>

        <div className="h-full">
          <GapEstimateCard
            currentScore={currentScore}
            p10={p10}
            p50={p50}
            p90={p90}
          />
        </div>
      </div>

      {/* 3. HÀNG 2: BIỂU ĐỒ KHOẢNG CÁCH (7 COLS) & 3 THẺ PHÂN TÍCH BÊN PHẢI (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 h-full">
          <GapChartCard
            currentScore={currentScore}
            cutoff2022={analysis.cutoff2022}
            cutoff2023={analysis.cutoff2023}
            cutoff2024={analysis.cutoff2024}
            refMin={p10}
            refMax={p90}
          />
        </div>

        <div className="lg:col-span-5 h-full">
          <GapRightInsights currentScore={currentScore} p10={p10} p90={p90} yearsOfData={analysis.yearsOfData} />
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisView;
