import React from "react";
import Link from "@/components/navigation/HashLink";
import { SubjectRoiAnalysis } from "@/engine/roi/selectors";
import { SubjectLeverageCard } from "@/features/analysis/roi/SubjectLeverageCard";
import { SubjectRoiTable } from "@/features/analysis/roi/SubjectRoiTable";
import { SubjectRoiChart } from "@/features/analysis/roi/SubjectRoiChart";
import { Zap, HelpCircle } from "lucide-react";

interface SubjectRoiViewProps {
  analysis: SubjectRoiAnalysis;
  targetSchoolCode: string;
}

export const SubjectRoiView: React.FC<SubjectRoiViewProps> = ({
  analysis,
  targetSchoolCode,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Môn nào nên ưu tiên bứt phá điểm số?
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Mô phỏng tác động khi tập trung ôn tập: Nếu tăng <strong>+0.5 điểm</strong> ở từng môn,
            môn nào mở thêm nhiều nguyện vọng nhất và thu hẹp khoảng cách điểm với {targetSchoolCode} nhanh nhất?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/analysis/roi"
            className="rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Xem chi tiết môn học ưu tiên</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 border border-indigo-200">
            Tính toán tính khả thi thực tế
          </span>
        </div>
      </div>

      {/* 1. HERO LEVERAGE CARD */}
      <SubjectLeverageCard
        topSubject={analysis.topLeverageSubject}
        targetSchoolCode={targetSchoolCode}
      />

      {/* 2. MATRIX COMPARISON TABLE */}
      <SubjectRoiTable roiList={analysis.roiList} />

      {/* 3. BAR CHART */}
      <SubjectRoiChart analysis={analysis} />
    </div>
  );
};
