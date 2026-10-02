import React from "react";
import { ScenarioSimulator } from "@/features/analysis/simulation/ScenarioSimulator";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft } from "lucide-react";

export default function SimulationPage() {
  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
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
            Mô phỏng thay đổi điểm số
          </h1>
        </div>
      </div>
      <ScenarioSimulator />
    </div>
  );
}
