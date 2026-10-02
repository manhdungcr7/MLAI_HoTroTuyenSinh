import React from "react";
import { Zap, Sparkles } from "lucide-react";
import { SubjectRoiMetric } from "@/engine/types";

export interface SubjectRoiTableProps {
  roiList: SubjectRoiMetric[];
  className?: string;
}

export function SubjectRoiTable({ roiList, className = "" }: SubjectRoiTableProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Môn học ưu tiên bứt phá điểm số
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Xếp hạng theo hiệu quả mở rộng cơ hội khi tăng +0.5 điểm mỗi môn
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="pb-3">Môn học</th>
              <th className="pb-3 text-center">Điểm hiện tại</th>
              <th className="pb-3 text-center">Mở thêm cơ hội</th>
              <th className="pb-3 text-center">Thu hẹp khoảng cách</th>
              <th className="pb-3 text-center">Độ khó cải thiện</th>
              <th className="pb-3 text-center">Điểm ưu tiên</th>
              <th className="pb-3 text-right">Phân tầng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roiList.map((r, idx) => (
              <tr key={r.subject} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">
                    {idx + 1}
                  </span>
                  <span>{r.subjectVi}</span>
                </td>
                <td className="py-3.5 text-center font-bold text-slate-700">
                  {r.currentScore}đ
                </td>
                <td className="py-3.5 text-center font-bold text-blue-700">
                  +{r.unlockedOptionsCount} trường
                </td>
                <td className="py-3.5 text-center font-bold text-emerald-600">
                  +{r.gapReduction}đ
                </td>
                <td className="py-3.5 text-center font-medium text-slate-500">
                  {r.effortDifficulty}x
                </td>
                <td className="py-3.5 text-center">
                  <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-700 border border-amber-200">
                    {r.netRoi} / 10
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  {r.tier === 1 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-700 border border-rose-200">
                      <Sparkles className="h-3 w-3" /> Ưu tiên số 1
                    </span>
                  ) : r.tier === 2 ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                      Bổ trợ
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                      Duy trì
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
