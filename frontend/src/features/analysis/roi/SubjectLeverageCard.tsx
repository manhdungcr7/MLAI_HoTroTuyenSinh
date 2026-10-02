import React from "react";
import { SubjectRoiDetail } from "@/engine/roi/selectors";
import { Award, Zap, Clock, ArrowUpRight } from "lucide-react";

interface SubjectLeverageCardProps {
  topSubject: SubjectRoiDetail | null;
  targetSchoolCode: string;
}

export const SubjectLeverageCard: React.FC<SubjectLeverageCardProps> = ({
  topSubject,
  targetSchoolCode,
}) => {
  if (!topSubject) return null;

  return (
    <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/70 p-4 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
                Ưu Tiên Số 1 — Bứt Phá Điểm Số
              </span>
              <span className="text-xs font-bold text-slate-500">
                Mở rộng cơ hội trúng tuyển tốt nhất
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Môn {topSubject.subjectVi} — Điểm ưu tiên bứt phá {topSubject.netRoi} / 10
            </h3>
            <p className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed">
              {topSubject.explanationVi}
            </p>
          </div>
        </div>

        {/* METRIC CHIPS */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="p-2.5 rounded-lg bg-white border border-indigo-200 text-center min-w-[90px]">
            <div className="text-[10px] font-bold text-slate-500">Mở thêm cơ hội</div>
            <div className="text-sm font-black text-emerald-700 flex items-center justify-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> +{topSubject.unlockedOptionsCount} NV
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-indigo-200 text-center min-w-[90px]">
            <div className="text-[10px] font-bold text-slate-500">Thu hẹp khoảng cách</div>
            <div className="text-sm font-black text-blue-700 mt-0.5">
              +{topSubject.gapReduction}đ
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-indigo-200 text-center min-w-[100px]">
            <div className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Phân bổ
            </div>
            <div className="text-sm font-black text-indigo-700 mt-0.5">
              60% Giờ học
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
