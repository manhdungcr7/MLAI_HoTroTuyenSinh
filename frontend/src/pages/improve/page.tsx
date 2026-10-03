import React, { useMemo } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { TargetPicker } from "@/components/ui/TargetPicker";
import { runGapAnalysis } from "@/engine/gap/engine";
import { calculateSubjectRoiList } from "@/engine/roi/engine";
import { scoreForProgram, METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";

export default function ImprovePage() {
  const { profile, target, setTarget } = useApp();

  const result = useMemo(() => {
    if (!target) return null;
    const ms = scoreForProgram(profile, target);
    if (!ms) return { kind: "no-score" as const };
    const gap = runGapAnalysis(target, profile);
    const roi = calculateSubjectRoiList(profile, target, DECISION_PROGRAM_POOL).slice(0, 3);
    return { kind: "ok" as const, ms, gap, roi, prob: gap.admitProbability };
  }, [target, profile]);

  if (!target) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Em muốn vào ngành nào?</h1>
        <TargetPicker />
      </div>
    );
  }

  const changeTarget = (
    <button type="button" onClick={() => setTarget(null)} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 underline cursor-pointer">
      <RefreshCw className="h-4 w-4" /> Đổi ngành khác
    </button>
  );

  if (!result || result.kind === "no-score") {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{target.majorName}</h1>
        <p className="text-base font-semibold text-slate-600">Chưa đủ điểm để tính ngành này.</p>
        <Link href="/start" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-black text-white hover:bg-blue-700">Nhập thêm điểm <ArrowRight className="h-5 w-5" /></Link>
        {changeTarget}
      </div>
    );
  }

  const { ms, gap, roi, prob } = result;
  const diff = Number((ms.score - gap.p50).toFixed(2));
  const enough = diff >= 0;
  const isHocBa = ms.method === "HOC_BA";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-slate-500">{target.schoolName}</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{target.majorName}</h1>
      </div>

      <section className={`rounded-3xl p-6 text-center ${enough ? "bg-emerald-50" : "bg-amber-50"}`}>
        <p className={`text-6xl font-black ${enough ? "text-emerald-600" : "text-amber-600"}`}>{enough ? "+" : "−"}{Math.abs(diff).toFixed(2)}</p>
        <p className="mt-2 text-lg font-extrabold text-slate-900">{enough ? "điểm dư so với điểm chuẩn dự kiến" : "điểm còn thiếu so với điểm chuẩn dự kiến"}</p>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {METHOD_SHORT_VI[ms.method]} · em {ms.score.toFixed(2)} · chuẩn {gap.p50.toFixed(1)} · khả năng đỗ {formatProbability(prob)}
        </p>
      </section>

      {isHocBa ? (
        <p className="rounded-2xl bg-slate-100 px-5 py-4 text-base font-bold text-slate-700">Ngành này xét học bạ nên điểm khó thay đổi. Hãy chọn ngành xét điểm thi để biết nên học thêm môn nào.</p>
      ) : (
        roi.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-900">Học thêm môn nào?</h2>
            <ol className="space-y-2">
              {roi.map((r, i) => (
                <li key={r.subject} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold text-slate-900">{r.subjectVi}</p>
                    <p className="text-sm font-semibold text-slate-600">
                      +0,5 điểm → {r.gapReduction > 0 ? `gần ngành này hơn ${r.gapReduction.toFixed(2)} điểm` : "ít đổi kết quả"}
                      {r.unlockedOptionsCount > 0 ? `, thêm ${r.unlockedOptionsCount} ngành` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      )}

      {changeTarget}
    </div>
  );
}
