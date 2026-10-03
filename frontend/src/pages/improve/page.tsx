import React, { useMemo } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowRight, RefreshCw } from "lucide-react";
import { useApp, useCandidates } from "@/state/AppContext";
import { TargetPicker } from "@/components/ui/TargetPicker";
import { runGapAnalysis } from "@/engine/gap/engine";
import { calculateSubjectRoiList } from "@/engine/roi/engine";
import { scoreForProgram } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";

export default function ImprovePage() {
  const { profile, target, setTarget } = useApp();
  const { programs } = useCandidates();

  const result = useMemo(() => {
    if (!target) return null;
    const ms = scoreForProgram(profile, target);
    if (!ms) return { kind: "no-score" as const };
    const gap = runGapAnalysis(target, profile);
    const roi = calculateSubjectRoiList(profile, target, programs).slice(0, 3);
    return { kind: "ok" as const, ms, gap, roi, prob: gap.admitProbability };
  }, [target, profile, programs]);

  if (!target) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold text-slate-900">Bạn muốn vào ngành nào?</h1>
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
        <h1 className="text-2xl font-semibold text-slate-900">{target.majorName}</h1>
        <p className="text-base font-semibold text-slate-600">Chưa đủ điểm để tính ngành này.</p>
        <Link href="/start" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white hover:bg-blue-700">Nhập thêm điểm <ArrowRight className="h-5 w-5" /></Link>
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
        <p className="text-sm text-slate-500">{target.schoolName}</p>
        <h1 className="text-xl font-semibold text-slate-900">{target.majorName}</h1>
      </div>

      <section className={`rounded-2xl p-5 text-center ${enough ? "bg-emerald-50" : "bg-amber-50"}`}>
        <p className={`text-5xl font-bold ${enough ? "text-emerald-600" : "text-amber-600"}`}>{enough ? "+" : "−"}{Math.abs(diff).toFixed(2)}</p>
        <p className="mt-1 text-base text-slate-800">{enough ? "điểm dư so với điểm chuẩn" : "điểm còn thiếu so với điểm chuẩn"}</p>
        <p className="mt-3 text-sm text-slate-600">Bạn {ms.score.toFixed(2)} · chuẩn {gap.p50.toFixed(1)} · đỗ {formatProbability(prob)}</p>
      </section>

      {!isHocBa && roi.length === 0 && (
        <p className="rounded-2xl bg-slate-100 px-5 py-4 text-sm text-slate-700">
          {prob >= 0.95 ? "Bạn đã đủ điểm cho ngành này, không cần học thêm." : "Các môn của tổ hợp đã gần điểm tối đa nên không còn môn nào để tăng thêm."}
        </p>
      )}

      {isHocBa ? (
        <p className="rounded-2xl bg-slate-100 px-5 py-4 text-base font-bold text-slate-700">Ngành này xét học bạ nên điểm khó thay đổi. Hãy chọn ngành xét điểm thi để biết nên học thêm môn nào.</p>
      ) : (
        roi.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Tăng thêm 1 điểm môn nào?</h2>
            <ol className="space-y-2">
              {roi.map((r, i) => (
                <li key={r.subject} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-slate-900">{r.subjectVi} <span className="text-sm font-normal text-slate-500">{r.currentScore} → {r.simulatedScore}</span></p>
                    <p className="text-sm text-slate-600">
                      Khả năng đỗ ngành này {formatProbability(r.admitProbBefore)} → {formatProbability(r.admitProbAfter)}
                      {r.unlockedOptionsCount > 0 ? `, mở thêm ${r.unlockedOptionsCount} ngành` : ""}
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
