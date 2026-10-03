import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft, ArrowRight, BadgeCheck, ListChecks, Scale } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { CandidateOption, ExamScores } from "@/engine/types";
import { filterByConstraints } from "@/engine/decision/constraints";
import { Stepper, StepDef } from "@/features/start/Stepper";
import { ScoreStep } from "@/features/start/ScoreStep";
import { ConstraintsStep } from "@/features/start/ConstraintsStep";
import { ResultsStep } from "@/features/start/ResultsStep";
import { bestCombination } from "@/features/start/scoring";

const STEP_LABELS: Pick<StepDef, "label" | "hint">[] = [
  { label: "Điểm của em", hint: "Điểm thi và học bạ" },
  { label: "Điều kiện", hint: "Nơi học, học phí, ngành" },
  { label: "Kết quả", hint: "Xếp theo xác suất đỗ" },
];

function Hero() {
  const points = [
    { icon: <Scale className="h-4 w-4" />, text: "Tính xác suất đỗ cho từng ngành của từng trường" },
    { icon: <BadgeCheck className="h-4 w-4" />, text: "Tự chọn phương thức có lợi nhất: điểm thi hay học bạ" },
    { icon: <ListChecks className="h-4 w-4" />, text: "Lọc theo điều kiện của em, xếp sẵn nguyện vọng" },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
      <div className="relative max-w-2xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Tư vấn tuyển sinh cho học sinh lớp 12</p>
        <h1 className="text-2xl font-black leading-tight sm:text-4xl">Tìm đúng ngành, đúng trường cho em trong vài phút</h1>
        <p className="text-sm leading-relaxed text-blue-50 sm:text-base">
          Không cần tự tra điểm chuẩn từng trường hay tự tính từng phương thức. Nhập điểm một lần, hệ thống làm phần còn lại.
        </p>
        <ul className="grid gap-2 pt-1 sm:grid-cols-1">
          {points.map((p) => (
            <li key={p.text} className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">{p.icon}</span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function StartPage() {
  const { profile, updateProfile, updateExamScore, candidates, wishlist, addWishlistItem, removeWishlistItem } = useDecision();

  const hasExam = bestCombination(profile.examScores) !== null;
  const hasHocBa = bestCombination(profile.hocBaScores) !== null;
  const hasScores = hasExam || hasHocBa;
  const [step, setStep] = useState<number>(() => (hasScores ? 2 : 0));

  const setHocBa = (subject: keyof ExamScores, raw: string) => {
    const value = raw === "" ? null : parseFloat(raw);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10)) return;
    const hocBaScores = { ...(profile.hocBaScores ?? {}), [subject]: value === null ? null : Math.round(value * 100) / 100 };
    const combo = bestCombination(profile.examScores) ?? bestCombination(hocBaScores);
    updateProfile({ hocBaScores, ...(combo ? { activeCombination: combo } : {}) });
  };

  const setExam = (subject: keyof ExamScores, raw: string) => {
    const value = raw === "" ? null : parseFloat(raw);
    updateExamScore(subject, value);
    const next = { ...(profile.examScores ?? {}), [subject]: value } as ExamScores;
    const combo = bestCombination(next) ?? bestCombination(profile.hocBaScores);
    if (combo && combo !== profile.activeCombination) updateProfile({ activeCombination: combo });
  };

  const matched = useMemo(() => filterByConstraints(candidates, profile), [candidates, profile]);

  const toggleWish = (c: CandidateOption) => {
    const existing = wishlist.find((w) => w.program_id === c.programId);
    if (existing) removeWishlistItem(existing.rank);
    else addWishlistItem(c);
  };

  const steps: StepDef[] = STEP_LABELS.map((s, i) => ({
    ...s,
    done: i === 0 ? hasScores : i === 1 ? hasScores && Boolean(profile.homeProvince || profile.annualBudgetVnd || (profile.interestMajorGroups?.length ?? 0) > 0) : hasScores && wishlist.length > 0,
    enabled: i === 0 || hasScores,
  }));

  const bestCombo = bestCombination(profile.examScores) ?? bestCombination(profile.hocBaScores);
  const showHero = !hasScores && step === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      {showHero && <Hero />}

      <Stepper steps={steps} current={step} onSelect={setStep} />

      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:p-6">
        {step === 0 && (
          <ScoreStep
            examScores={profile.examScores}
            hocBaScores={profile.hocBaScores}
            graduationYear={profile.graduationYear}
            bestCombo={bestCombo}
            onExam={setExam}
            onHocBa={setHocBa}
            onGraduationYear={(graduationYear) => updateProfile({ graduationYear })}
          />
        )}
        {step === 1 && <ConstraintsStep profile={profile} onChange={updateProfile} />}
        {step === 2 && (
          <ResultsStep
            matched={matched}
            totalComputable={candidates.length}
            wishlist={wishlist}
            onToggle={toggleWish}
            onEditConstraints={() => setStep(1)}
          />
        )}
      </div>

      {/* Thanh dưới: bộ đếm trực tiếp và nút điều hướng */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-30 px-3 md:bottom-0 md:left-[250px] md:px-6 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
          <div className="min-w-0 text-xs sm:text-sm">
            {hasScores ? (
              <>
                <p className="truncate font-extrabold text-slate-900">
                  <span className="hidden sm:inline">{candidates.length} ngành tính được · </span>
                  {matched.length} ngành thỏa điều kiện
                </p>
                <p className="truncate text-slate-500">Nguyện vọng đã chọn: {wishlist.length}/15</p>
              </>
            ) : (
              <p className="font-bold text-slate-600">Nhập điểm 3 môn của một tổ hợp để bắt đầu</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Quay lại</span>
                <span className="sr-only sm:hidden">Quay lại</span>
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                disabled={!hasScores}
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
              >
                {step === 0 ? "Tiếp tục" : "Xem kết quả"} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link href="/portfolio" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-600">
                Xếp nguyện vọng <ArrowRight className="hidden h-4 w-4 sm:block" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
