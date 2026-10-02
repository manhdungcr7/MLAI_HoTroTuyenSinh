import React, { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Save, Trash2, Play } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { useRouter } from "@/routes";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import {
  EMPTY_SCENARIO,
  runScenario,
  ScenarioInput,
  ScenarioRegion,
  RoleCounts,
} from "@/engine/decision/scenario";
import { ExamScores, Role, StudentProfile } from "@/engine/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatProbability } from "@/lib/format";

const BUDGET_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Không giới hạn", value: null },
  { label: "≤ 20 triệu/năm", value: 20_000_000 },
  { label: "≤ 40 triệu/năm", value: 40_000_000 },
  { label: "≤ 60 triệu/năm", value: 60_000_000 },
];
const REGION_OPTIONS: { label: string; value: ScenarioRegion }[] = [
  { label: "Toàn quốc", value: "all" },
  { label: "Chỉ miền Bắc", value: "bac" },
  { label: "Chỉ miền Trung", value: "trung" },
  { label: "Chỉ miền Nam", value: "nam" },
];
const ROLE_LABEL: Record<Role, string> = { mao_hiem: "Thử sức", vua_tam: "Phù hợp", an_toan: "An toàn" };

function CountRow({ label, before, after, tone }: { label: string; before: number; after: number; tone: string }) {
  const diff = after - before;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className={`text-sm font-bold ${tone}`}>{label}</span>
      <span className="text-sm tabular-nums text-slate-700">
        {before} → <strong className="text-slate-900">{after}</strong>{" "}
        {diff !== 0 && (
          <span className={diff > 0 ? "text-emerald-700" : "text-rose-700"}>
            ({diff > 0 ? "+" : ""}
            {diff})
          </span>
        )}
      </span>
    </div>
  );
}

const bestScore = (p: StudentProfile) => {
  const combo = p.activeCombination || "A01";
  return calculateCompositeScore(p.examScores, p.altScores, p.priority, combo);
};

/** Mô phỏng kịch bản dùng chung cho trang Chiến lược (what-if) và tab mô phỏng ở trang Phân tích. */
export function ScenarioSimulator() {
  const router = useRouter();
  const { profile, applyWhatIf, resetWhatIf, scenarios, createScenario, applyScenario, deleteScenario } = useDecision();
  const [scenario, setScenario] = useState<ScenarioInput>(EMPTY_SCENARIO);
  const [savedNotice, setSavedNotice] = useState(false);

  const subjects = ((COMBINATION_SUBJECTS[profile.activeCombination] || []) as (keyof ExamScores)[]).filter(
    (s) => profile.examScores[s] !== null && profile.examScores[s] !== undefined
  );
  const hasIelts = Boolean(profile.altScores?.ielts);

  const result = useMemo(
    () => runScenario(DECISION_PROGRAM_POOL, profile, scenario, bestScore),
    [profile, scenario]
  );

  if (result.before.total === 0) {
    return (
      <EmptyState
        title="Chưa thể mô phỏng"
        description="Nhập đủ điểm 3 môn của tổ hợp để xem danh sách thay đổi thế nào khi điểm, ngân sách hoặc khu vực thay đổi."
        actionLabel="Nhập điểm"
        actionHref="/profile"
      />
    );
  }

  const setDelta = (subject: keyof ExamScores, delta: number) =>
    setScenario((s) => ({ ...s, scoreDeltas: { ...s.scoreDeltas, [subject]: delta } }));

  const handleSave = () => {
    const parts = Object.entries(scenario.scoreDeltas)
      .filter(([, d]) => d)
      .map(([k, d]) => `${SUBJECT_LABELS_VI[k] || k} ${d! > 0 ? "+" : ""}${d}`);
    if (scenario.budgetVnd) parts.push(`≤${scenario.budgetVnd / 1_000_000}tr`);
    if (scenario.region !== "all") parts.push(REGION_OPTIONS.find((r) => r.value === scenario.region)!.label);
    if (scenario.dropIelts) parts.push("không IELTS");
    createScenario(parts.join(", ") || "Kịch bản hiện tại", {
      deltaScores: scenario.scoreDeltas,
      annualBudgetVnd: scenario.budgetVnd ?? undefined,
      region: scenario.region,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleApply = () => {
    resetWhatIf();
    applyWhatIf(scenario.scoreDeltas, scenario.budgetVnd ?? undefined);
    router.push("/portfolio");
  };

  const changes = [...result.improved.slice(0, 5), ...result.worsened.slice(0, 3)];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ĐIỀU CHỈNH GIẢ ĐỊNH */}
      <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5" aria-label="Điều chỉnh giả định">
        <h2 className="text-base font-bold text-slate-900">Nếu…</h2>

        {subjects.map((s) => {
          const delta = scenario.scoreDeltas[s] ?? 0;
          const base = profile.examScores[s] as number;
          const currentSimulatedScore = Math.min(10, Math.max(0, Number((base + delta).toFixed(2))));
          const diff = Number((currentSimulatedScore - base).toFixed(2));
          return (
            <div key={s} className="space-y-1.5">
              <label htmlFor={`delta-${s}`} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{SUBJECT_LABELS_VI[s] || s}</span>
                <span className="tabular-nums text-slate-600">
                  {base} → <strong className="text-slate-900">{currentSimulatedScore.toFixed(2)}</strong>
                  {diff !== 0 && (
                    <span className={`ml-1 text-xs font-bold ${diff > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ({diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)})
                    </span>
                  )}
                </span>
              </label>
              <input
                id={`delta-${s}`}
                type="range"
                min={0}
                max={10}
                step={0.25}
                value={currentSimulatedScore}
                onChange={(e) => {
                  const newScore = Number(e.target.value);
                  setDelta(s, Number((newScore - base).toFixed(2)));
                }}
                className="w-full accent-blue-600 min-h-[28px] cursor-pointer"
              />
            </div>
          );
        })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Ngân sách học phí</span>
            <select
              value={scenario.budgetVnd ?? ""}
              onChange={(e) => setScenario((s) => ({ ...s, budgetVnd: e.target.value ? Number(e.target.value) : null }))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.label} value={o.value ?? ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Nơi học</span>
            <select
              value={scenario.region}
              onChange={(e) => setScenario((s) => ({ ...s, region: e.target.value as ScenarioRegion }))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {REGION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasIelts && (
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={scenario.dropIelts}
              onChange={(e) => setScenario((s) => ({ ...s, dropIelts: e.target.checked }))}
              className="h-4 w-4 accent-blue-600"
            />
            Nếu tôi không dùng được IELTS {profile.altScores?.ielts}
          </label>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setScenario(EMPTY_SCENARIO)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Đặt lại
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" /> {savedNotice ? "Đã lưu" : "Lưu kịch bản"}
          </button>
        </div>

        {scenarios.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kịch bản đã lưu</p>
            <ul className="space-y-1.5">
              {scenarios.slice(0, 5).map((sc) => (
                <li key={sc.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
                  <span className="truncate text-slate-700" title={sc.name}>
                    {sc.name}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Mở kịch bản ${sc.name}`}
                      onClick={() => {
                        applyScenario(sc.id);
                        setScenario({
                          scoreDeltas: sc.deltaScores || {},
                          budgetVnd: sc.annualBudgetVnd ?? null,
                          region: (["all", "bac", "trung", "nam"].includes(sc.region || "") ? sc.region : "all") as ScenarioRegion,
                          dropIelts: false,
                        });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-md text-blue-700 hover:bg-blue-50"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Xóa kịch bản ${sc.name}`}
                      onClick={() => deleteScenario(sc.id)}
                      className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* KẾT QUẢ */}
      <section className="lg:col-span-7 space-y-5" aria-live="polite" aria-label="Kết quả mô phỏng">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">…thì danh sách lựa chọn của bạn</h2>
          <p className="text-sm text-slate-600">
            Điểm tổ hợp {profile.activeCombination}: {result.baseScore.toFixed(2)} →{" "}
            <strong className="text-slate-900">{result.scenarioScore.toFixed(2)}</strong>
          </p>
          <div>
            <CountRow label="Phù hợp" before={result.before.target} after={result.after.target} tone="text-blue-700" />
            <CountRow label="An toàn" before={result.before.safe} after={result.after.safe} tone="text-emerald-700" />
            <CountRow label="Thử sức" before={result.before.reach} after={result.after.reach} tone="text-amber-700" />
            <CountRow label="Tổng số lựa chọn" before={result.before.total} after={result.after.total} tone="text-slate-900" />
          </div>
          {result.unknownTuitionCount > 0 && (
            <p className="text-xs text-slate-500">
              {result.unknownTuitionCount} lựa chọn chưa có học phí xác thực nên vẫn được giữ lại — hãy kiểm tra đề án của trường.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">Thay đổi đáng chú ý</h2>
          {changes.length === 0 ? (
            <p className="text-sm text-slate-500">Kịch bản này chưa làm lựa chọn nào đổi nhóm.</p>
          ) : (
            <ul className="space-y-2">
              {changes.map((c) => (
                <li key={`${c.programId}-${c.toRole}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 text-pretty">{c.majorName}</p>
                    <p className="text-xs text-slate-500">{c.schoolName}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-700 text-right">
                    {c.fromRole ? ROLE_LABEL[c.fromRole] : "Chưa có"} → {c.toRole ? ROLE_LABEL[c.toRole] : "Bị loại"}
                    <span className="block text-slate-500 tabular-nums">
                      {formatProbability(c.fromProb)} → {formatProbability(c.toProb)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            Mô phỏng dùng cùng cách tính với toàn bộ ứng dụng; điểm thi thật và điểm chuẩn năm nay có thể khác.
          </p>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Áp dụng kịch bản vào chiến lược nguyện vọng
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

export default ScenarioSimulator;
