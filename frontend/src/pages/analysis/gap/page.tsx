import React, { useMemo } from "react";
import { useDecision } from "@/state/DecisionContext";
import { GapAnalysisView } from "@/features/analysis/gap/GapAnalysisView";
import { selectGapAnalysis } from "@/engine/gap/selectors";
import { EmptyState, NO_TARGET_EMPTY_STATE } from "@/components/ui/EmptyState";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft } from "lucide-react";

export default function GapAnalysisPage() {
  const { target, profile } = useDecision();
  const analysis = useMemo(() => (target ? selectGapAnalysis(target, profile) : null), [target, profile]);

  return (
    <div className="space-y-6 pb-12 antialiased animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/analysis"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Phân tích năng lực</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Khoảng cách điểm mục tiêu
          </h1>
        </div>
      </div>
      {analysis ? <GapAnalysisView analysis={analysis} /> : <EmptyState {...NO_TARGET_EMPTY_STATE} />}
    </div>
  );
}
