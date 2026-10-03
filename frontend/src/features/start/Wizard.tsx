import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { useRouter } from "@/routes";
import { ExamScores, MAJOR_GROUPS, PROVINCES, PriorityArea, PriorityObject, RelocationWillingness } from "@/engine/types";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { bestCombination, countEntered } from "@/engine/scoring/combo";
import { UNLIMITED_BUDGET_VND } from "@/engine/decision/constraints";

export type StepId = "year" | "exam" | "hocba" | "cert" | "place" | "major" | "budget" | "priority";
export const STEPS: StepId[] = ["year", "exam", "hocba", "cert", "place", "major", "budget", "priority"];
const REQUEST_KEY = "nv_start_step";

/** Đặt bước sẽ mở khi vào trang Tìm ngành (dùng khi cần bổ sung điểm từ trang Kết quả). */
export function requestStep(step: StepId): void {
  try {
    window.sessionStorage.setItem(REQUEST_KEY, step);
  } catch {
    // bỏ qua: sẽ mở từ bước đầu
  }
}

function takeRequestedStep(): number {
  try {
    const id = window.sessionStorage.getItem(REQUEST_KEY) as StepId | null;
    window.sessionStorage.removeItem(REQUEST_KEY);
    const i = id ? STEPS.indexOf(id) : -1;
    return i >= 0 ? i : 0;
  } catch {
    return 0;
  }
}

const MAIN: (keyof ExamScores)[] = ["toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia"];
const OTHER: (keyof ExamScores)[] = ["gdcd", "tin", "cncn", "cnnn"];

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-base font-extrabold transition cursor-pointer ${
        selected ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
      }`}
    >
      {label}
      {selected && <Check className="h-5 w-5 text-blue-600" />}
    </button>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition cursor-pointer ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}
    >
      {label}
    </button>
  );
}

function NumberField({ label, value, onChange, max, step, name }: { label: string; value: number | null | undefined; onChange: (v: number | null) => void; max: number; step: string; name: string }) {
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value));
  return (
    <label className="flex flex-col gap-1 rounded-2xl border-2 border-slate-200 bg-white p-3 focus-within:border-blue-500">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        max={max}
        step={step}
        placeholder="–"
        aria-label={name}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const v = e.target.value === "" ? null : parseFloat(e.target.value);
          onChange(v !== null && Number.isFinite(v) ? v : null);
        }}
        className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none"
      />
    </label>
  );
}

function ScoreGrid({ kind }: { kind: "exam" | "hocba" }) {
  const { profile, setScore } = useApp();
  const [more, setMore] = useState(false);
  const scores = kind === "exam" ? profile.examScores : profile.hocBaScores;
  const prefix = kind === "exam" ? "Điểm thi" : "Điểm học bạ";
  const combo = bestCombination(scores);
  const list = more ? [...MAIN, ...OTHER] : MAIN;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {list.map((s) => (
          <NumberField
            key={s}
            name={`${prefix} – ${SUBJECT_LABELS_VI[s] ?? s}`}
            label={SUBJECT_LABELS_VI[s] ?? s}
            value={scores?.[s]}
            max={10}
            step="0.05"
            onChange={(v) => setScore(kind, s, v)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        {!more ? (
          <button type="button" onClick={() => setMore(true)} className="text-sm font-bold text-blue-700 underline cursor-pointer">Môn khác</button>
        ) : <span />}
        {combo && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Tổ hợp {combo}</span>}
      </div>
    </div>
  );
}

const AREAS: { value: PriorityArea; label: string }[] = [
  { value: "KV3", label: "KV3" }, { value: "KV2", label: "KV2" }, { value: "KV2-NT", label: "KV2-NT" }, { value: "KV1", label: "KV1" },
];
const OBJECTS: { value: PriorityObject; label: string }[] = [
  { value: "none", label: "Không" }, { value: "uu_tien_1", label: "Nhóm ưu tiên 1" }, { value: "uu_tien_2", label: "Nhóm ưu tiên 2" },
];
const BUDGETS: { label: string; vnd: number }[] = [
  { label: "Dưới 20 triệu / năm", vnd: 20_000_000 },
  { label: "Dưới 40 triệu / năm", vnd: 40_000_000 },
  { label: "Dưới 60 triệu / năm", vnd: 60_000_000 },
  { label: "Dưới 100 triệu / năm", vnd: 100_000_000 },
  { label: "Không giới hạn", vnd: UNLIMITED_BUDGET_VND },
];

const TITLES: Record<StepId, string> = {
  year: "Em thi tốt nghiệp năm nào?",
  exam: "Điểm thi của em",
  hocba: "Điểm học bạ của em",
  cert: "Chứng chỉ và điểm ĐGNL",
  place: "Em muốn học ở đâu?",
  major: "Em thích ngành nào?",
  budget: "Học phí tối đa mỗi năm?",
  priority: "Điểm ưu tiên của em",
};

export function Wizard() {
  const { profile, updateProfile } = useApp();
  const router = useRouter();
  const [index, setIndex] = useState(takeRequestedStep);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const step = STEPS[index];

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const hasScores = bestCombination(profile.examScores) !== null || bestCombination(profile.hocBaScores) !== null;
  const last = index === STEPS.length - 1;

  const go = (next: number) => {
    setNotice(null);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    if (!hasScores) {
      setNotice("Cần điểm 3 môn của một tổ hợp (điểm thi hoặc học bạ) để tính kết quả.");
      setIndex(STEPS.indexOf("exam"));
      return;
    }
    router.push("/results");
  };

  const next = () => (last ? finish() : go(index + 1));
  const choose = (apply: () => void) => {
    apply();
    timer.current = window.setTimeout(() => go(index + 1), 220);
  };

  const interest = profile.interestMajorGroups ?? [];
  const alt = profile.altScores ?? {};
  const setAlt = (key: "ielts" | "dgnl_hcm" | "dgnl_hn" | "dgtd_bk", v: number | null) => updateProfile({ altScores: { ...alt, [key]: v } });

  const skippable = step === "hocba" || step === "cert" || step === "major" || step === "priority" || (step === "exam" && !countEntered(profile.examScores));
  const filled =
    step === "exam" ? countEntered(profile.examScores) > 0
    : step === "hocba" ? countEntered(profile.hocBaScores) > 0
    : step === "cert" ? Object.values(alt).some((v) => typeof v === "number")
    : step === "major" ? interest.length > 0
    : true;
  const nextLabel = last ? "Xem kết quả" : skippable && !filled ? "Bỏ qua" : "Tiếp tục";

  return (
    <div className="space-y-6">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label="Tiến độ">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>

      <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">{TITLES[step]}</h1>

      {notice && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{notice}</p>}

      <div className="min-h-[220px]">
        {step === "year" && (
          <div className="grid gap-3">
            {[2027, 2028].map((y) => (
              <Choice key={y} label={`Năm ${y}`} selected={profile.graduationYear === y} onClick={() => choose(() => updateProfile({ graduationYear: y }))} />
            ))}
          </div>
        )}
        {step === "exam" && <ScoreGrid kind="exam" />}
        {step === "hocba" && <ScoreGrid kind="hocba" />}
        {step === "cert" && (
          <div className="grid grid-cols-2 gap-3">
            <NumberField name="IELTS" label="IELTS (0–9)" value={alt.ielts} max={9} step="0.5" onChange={(v) => setAlt("ielts", v)} />
            <NumberField name="ĐGNL ĐHQG-HCM" label="ĐGNL ĐHQG-HCM (/1200)" value={alt.dgnl_hcm} max={1200} step="1" onChange={(v) => setAlt("dgnl_hcm", v)} />
            <NumberField name="ĐGNL ĐHQG Hà Nội" label="ĐGNL ĐHQG Hà Nội (/150)" value={alt.dgnl_hn} max={150} step="1" onChange={(v) => setAlt("dgnl_hn", v)} />
            <NumberField name="ĐGTD Bách khoa" label="ĐGTD Bách khoa (/100)" value={alt.dgtd_bk} max={100} step="0.5" onChange={(v) => setAlt("dgtd_bk", v)} />
          </div>
        )}
        {step === "place" && (
          <div className="space-y-4">
            <select
              aria-label="Tỉnh / thành phố em ở"
              value={profile.homeProvince || ""}
              onChange={(e) => updateProfile({ homeProvince: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-extrabold text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Em ở tỉnh / thành phố nào?</option>
              {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
            <div className="grid gap-3">
              {([["khong_gioi_han", "Cả nước"], ["trong_vung", "Cùng vùng miền với em"], ["chi_tinh_nha", "Chỉ ở tỉnh nhà"]] as [RelocationWillingness, string][]).map(([value, label]) => (
                <Choice key={value} label={label} selected={profile.relocationWillingness === value} onClick={() => updateProfile({ relocationWillingness: value })} />
              ))}
            </div>
          </div>
        )}
        {step === "major" && (
          <div className="flex flex-wrap gap-2.5">
            {MAJOR_GROUPS.map((g) => (
              <Chip key={g.value} label={g.label} on={interest.includes(g.value)} onClick={() => updateProfile({ interestMajorGroups: interest.includes(g.value) ? interest.filter((x) => x !== g.value) : [...interest, g.value] })} />
            ))}
          </div>
        )}
        {step === "budget" && (
          <div className="grid gap-3">
            {BUDGETS.map((b) => (
              <Choice key={b.vnd} label={b.label} selected={profile.annualBudgetVnd === b.vnd} onClick={() => choose(() => updateProfile({ annualBudgetVnd: b.vnd }))} />
            ))}
          </div>
        )}
        {step === "priority" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-500">Khu vực</p>
              <div className="flex flex-wrap gap-2.5">
                {AREAS.map((a) => (<Chip key={a.value} label={a.label} on={(profile.priority?.area ?? "KV3") === a.value} onClick={() => updateProfile({ priority: { area: a.value, object: profile.priority?.object ?? "none" } })} />))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-500">Đối tượng</p>
              <div className="flex flex-wrap gap-2.5">
                {OBJECTS.map((o) => (<Chip key={o.value} label={o.label} on={(profile.priority?.object ?? "none") === o.value} onClick={() => updateProfile({ priority: { area: profile.priority?.area ?? "KV3", object: o.value } })} />))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+56px)] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl gap-3">
          {index > 0 && (
            <button type="button" onClick={() => go(index - 1)} aria-label="Quay lại" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={next} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer">
            {nextLabel} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
