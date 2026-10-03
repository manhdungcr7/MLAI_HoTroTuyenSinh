import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowRight, CheckCircle2, Circle, MapPin, Wallet, BookOpen, ShieldCheck, Target, Sparkles } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import {
  ExamScores,
  MAJOR_GROUPS,
  PROVINCES,
  PriorityArea,
  PriorityObject,
  RelocationWillingness,
  CandidateOption,
} from "@/engine/types";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI, combinationLabel } from "@/data/universities/combinations";
import { METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";
import { regionOfProvince } from "@/features/explore/types";

const SUBJECTS: (keyof ExamScores)[] = ["toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia", "gdcd", "tin", "cncn", "cnnn"];
const UNLIMITED_BUDGET_VND = 200_000_000;
const BUDGETS = [20, 30, 40, 50, 60, 80, 100];

const AREAS: { value: PriorityArea; label: string }[] = [
  { value: "KV3", label: "KV3 (thành phố, không ưu tiên)" },
  { value: "KV2", label: "KV2 (+0,25đ)" },
  { value: "KV2-NT", label: "KV2-NT (+0,5đ)" },
  { value: "KV1", label: "KV1 (+0,75đ)" },
];
const OBJECTS: { value: PriorityObject; label: string }[] = [
  { value: "none", label: "Không thuộc diện ưu tiên" },
  { value: "uu_tien_1", label: "Nhóm UT1 (+2đ)" },
  { value: "uu_tien_2", label: "Nhóm UT2 (+1đ)" },
];

/** Tổ hợp có đủ điểm 3 môn và tổng cao nhất. */
function bestCombination(scores: ExamScores | undefined): string | null {
  if (!scores) return null;
  let best: { code: string; sum: number } | null = null;
  for (const [code, subs] of Object.entries(COMBINATION_SUBJECTS)) {
    const values = subs.map((s) => scores[s as keyof ExamScores]);
    if (values.some((v) => typeof v !== "number" || v <= 0)) continue;
    const sum = (values as number[]).reduce((a, b) => a + b, 0);
    if (!best || sum > best.sum) best = { code, sum };
  }
  return best?.code ?? null;
}

function ScoreGrid({
  title,
  hint,
  scores,
  onChange,
}: {
  title: string;
  hint: string;
  scores: ExamScores | undefined;
  onChange: (subject: keyof ExamScores, raw: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      <p className="mt-0.5 mb-3 text-xs text-slate-500 leading-relaxed">{hint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUBJECTS.map((s) => {
          const v = scores?.[s];
          return (
            <label key={s} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5">
              <span className="text-xs font-semibold leading-tight text-slate-800">{SUBJECT_LABELS_VI[s] ?? s}</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.05"
                placeholder="–"
                aria-label={`${title} – ${SUBJECT_LABELS_VI[s] ?? s}`}
                value={typeof v === "number" ? v : ""}
                onChange={(e) => onChange(s, e.target.value)}
                className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-right text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PickCard({ c, tone }: { c: CandidateOption; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">{c.majorName}</p>
        <p className="truncate text-xs text-slate-500">
          {c.schoolName} · {METHOD_SHORT_VI[c.admissionMethod ?? "THPT"]} {c.combination}
          {c.province ? ` · ${c.province}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-base font-black whitespace-nowrap ${tone}`}>{formatProbability(c.admitProbability)}</p>
        <p className="text-[11px] text-slate-500 whitespace-nowrap">
          em {c.userScore.toFixed(2)} / chuẩn {c.cutoffP50.toFixed(1)}
        </p>
      </div>
    </div>
  );
}

export default function StartPage() {
  const { profile, updateProfile, updateExamScore, candidates } = useDecision();
  const [showAllMajors, setShowAllMajors] = useState(false);

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

  const hasExam = bestCombination(profile.examScores) !== null;
  const hasHocBa = bestCombination(profile.hocBaScores) !== null;
  const hasScores = hasExam || hasHocBa;
  const interest = useMemo(() => profile.interestMajorGroups ?? [], [profile.interestMajorGroups]);

  const toggleInterest = (value: string) =>
    updateProfile({ interestMajorGroups: interest.includes(value) ? interest.filter((v) => v !== value) : [...interest, value] });

  // Danh sách thỏa ràng buộc đã khai (cùng logic với trang Khám phá).
  const matched = useMemo(() => {
    return candidates.filter((c) => {
      if (profile.relocationWillingness === "chi_tinh_nha" && profile.homeProvince && c.province !== profile.homeProvince) return false;
      if (profile.relocationWillingness === "trong_vung" && profile.homeProvince) {
        const home = regionOfProvince(profile.homeProvince);
        if (home && c.region !== home) return false;
      }
      if (profile.annualBudgetVnd > 0 && profile.annualBudgetVnd < UNLIMITED_BUDGET_VND && c.tuitionVnd && c.tuitionVnd > profile.annualBudgetVnd) return false;
      if (interest.length > 0 && !interest.includes(c.majorGroup)) return false;
      return true;
    });
  }, [candidates, profile.relocationWillingness, profile.homeProvince, profile.annualBudgetVnd, interest]);

  const tiers = useMemo(() => {
    // Trong mỗi nhóm, ưu tiên ngành có điểm chuẩn cao nhất: "tốt nhất em vẫn nằm trong nhóm này".
    const byCutoff = (a: CandidateOption, b: CandidateOption) => b.cutoffP50 - a.cutoffP50 || b.admitProbability - a.admitProbability;
    return {
      safe: matched.filter((c) => c.admitProbability >= 0.8).sort(byCutoff),
      fit: matched.filter((c) => c.admitProbability >= 0.4 && c.admitProbability < 0.8).sort(byCutoff),
      reach: matched.filter((c) => c.admitProbability >= 0.1 && c.admitProbability < 0.4).sort(byCutoff),
    };
  }, [matched]);

  const steps = [
    { done: hasScores, label: "Điểm của em" },
    { done: Boolean(profile.homeProvince), label: "Ràng buộc" },
    { done: hasScores && matched.length > 0, label: "Kết quả" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tìm ngành phù hợp với em</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Nhập điểm và điều kiện của em một lần. Hệ thống tính xác suất đỗ cho từng ngành của từng trường theo phương thức xét tuyển
          có lợi nhất cho em, loại những ngành không thỏa điều kiện, rồi xếp từ cao xuống thấp.
        </p>
        <ol className="flex flex-wrap gap-2 pt-2">
          {steps.map((s, i) => (
            <li key={s.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${s.done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}>
              {s.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>
      </header>

      {/* BƯỚC 1: ĐIỂM */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><BookOpen className="h-4 w-4 text-blue-600" /> 1. Điểm của em</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nhập những gì em có: điểm thi tốt nghiệp (hoặc thi thử) và/hoặc điểm học bạ. Em chỉ cần nhập các môn mình thi/học; càng nhiều môn,
          hệ thống càng tính được nhiều tổ hợp và nhiều ngành. Nên nhập cả hai để so sánh phương thức.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <ScoreGrid
            title="Điểm thi tốt nghiệp / thi thử (thang 10)"
            hint="Dùng cho phương thức xét điểm thi THPT."
            scores={profile.examScores}
            onChange={setExam}
          />
          <ScoreGrid
            title="Điểm học bạ – trung bình môn (thang 10)"
            hint="Thường là TB cả năm lớp 12 hoặc TB 3 năm, tùy trường. Dùng cho phương thức xét học bạ."
            scores={profile.hocBaScores}
            onChange={setHocBa}
          />
        </div>
        {hasScores && (
          <p className="text-xs font-semibold text-emerald-700">
            Tổ hợp tốt nhất hệ thống tìm thấy từ điểm của em: {combinationLabel(profile.activeCombination)}
          </p>
        )}
      </section>

      {/* BƯỚC 2: RÀNG BUỘC */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Target className="h-4 w-4 text-blue-600" /> 2. Điều kiện của em</h2>
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <label className="block text-xs font-bold text-slate-700">
            <span className="mb-1 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-600" /> Tỉnh / thành phố em ở</span>
            <select
              value={profile.homeProvince || ""}
              onChange={(e) => updateProfile({ homeProvince: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="">Chưa chọn</option>
              {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            <span className="mb-1 block">Em muốn học ở đâu?</span>
            <select
              value={profile.relocationWillingness}
              onChange={(e) => updateProfile({ relocationWillingness: e.target.value as RelocationWillingness })}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="khong_gioi_han">Cả nước</option>
              <option value="trong_vung">Trong vùng miền em ở</option>
              <option value="chi_tinh_nha">Chỉ ở tỉnh nhà</option>
            </select>
            {profile.relocationWillingness !== "khong_gioi_han" && !profile.homeProvince && (
              <span className="mt-1 block font-semibold text-amber-700">Cần chọn tỉnh nhà để áp dụng điều kiện này.</span>
            )}
          </label>
          <label className="block text-xs font-bold text-slate-700">
            <span className="mb-1 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-blue-600" /> Học phí tối đa mỗi năm</span>
            <select
              value={profile.annualBudgetVnd ? (profile.annualBudgetVnd >= UNLIMITED_BUDGET_VND ? "0" : String(Math.round(profile.annualBudgetVnd / 1_000_000))) : ""}
              onChange={(e) => {
                const m = e.target.value === "" ? 0 : Number(e.target.value);
                updateProfile({ annualBudgetVnd: e.target.value === "" ? 0 : m === 0 ? UNLIMITED_BUDGET_VND : m * 1_000_000 });
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="">Chưa chọn (không lọc)</option>
              {BUDGETS.map((m) => (<option key={m} value={m}>≤ {m} triệu / năm</option>))}
              <option value="0">Không giới hạn</option>
            </select>
            <span className="mt-1 block font-normal text-slate-500">Ngành chưa có số liệu học phí vẫn được giữ lại và ghi rõ trên thẻ.</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-700">
              <span className="mb-1 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Khu vực ưu tiên</span>
              <select
                value={profile.priority?.area ?? "KV3"}
                onChange={(e) => updateProfile({ priority: { area: e.target.value as PriorityArea, object: profile.priority?.object ?? "none" } })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
              >
                {AREAS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              <span className="mb-1 block">Đối tượng ưu tiên</span>
              <select
                value={profile.priority?.object ?? "none"}
                onChange={(e) => updateProfile({ priority: { area: profile.priority?.area ?? "KV3", object: e.target.value as PriorityObject } })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-900"
              >
                {OBJECTS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </label>
          </div>
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Nhóm ngành em quan tâm (chọn nhiều; bỏ trống = tất cả)</span>
            <div className="flex flex-wrap gap-1.5">
              {(showAllMajors ? MAJOR_GROUPS : MAJOR_GROUPS.slice(0, 8)).map((g) => {
                const on = interest.includes(g.value);
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => toggleInterest(g.value)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition cursor-pointer ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {g.label}
                  </button>
                );
              })}
              {!showAllMajors && (
                <button type="button" onClick={() => setShowAllMajors(true)} className="rounded-full px-3 py-1 text-xs font-bold text-blue-700 underline cursor-pointer">
                  Xem thêm nhóm ngành
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BƯỚC 3: KẾT QUẢ */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Sparkles className="h-4 w-4 text-blue-600" /> 3. Kết quả cho em</h2>
        {!hasScores ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Nhập điểm của ít nhất một tổ hợp (3 môn) ở bước 1 để xem kết quả.
          </div>
        ) : matched.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Không có ngành nào thỏa tất cả điều kiện của em. Hãy nới điều kiện (vùng, học phí hoặc nhóm ngành) rồi xem lại.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: "safe", label: "Chắc đỗ (≥ 80%)", n: tiers.safe.length, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                { key: "fit", label: "Vừa tầm (40–80%)", n: tiers.fit.length, cls: "border-blue-200 bg-blue-50 text-blue-800" },
                { key: "reach", label: "Thử sức (10–40%)", n: tiers.reach.length, cls: "border-amber-200 bg-amber-50 text-amber-800" },
              ].map((t) => (
                <div key={t.key} className={`rounded-xl border px-4 py-3 ${t.cls}`}>
                  <p className="text-2xl font-black leading-none">{t.n}</p>
                  <p className="mt-1 text-xs font-bold">{t.label}</p>
                </div>
              ))}
            </div>

            {([
              ["Ngành điểm cao nhất mà em vẫn chắc đỗ", tiers.safe, "text-emerald-700"],
              ["Ngành vừa tầm với em", tiers.fit, "text-blue-700"],
              ["Ngành đáng thử sức", tiers.reach, "text-amber-700"],
            ] as [string, CandidateOption[], string][]).map(([title, list, tone]) =>
              list.length === 0 ? null : (
                <div key={title} className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {list.slice(0, 6).map((c) => (<PickCard key={c.programId} c={c} tone={tone} />))}
                  </div>
                </div>
              ),
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/options" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 transition">
                Xem toàn bộ {matched.length} ngành, lọc và so sánh <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/portfolio" className="text-sm font-bold text-blue-700 underline">Xếp danh sách nguyện vọng</Link>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Xác suất là ước lượng thống kê từ điểm chuẩn các năm trước, không phải cam kết. Phương thức và tổ hợp được ghi trên từng thẻ;
              hãy đối chiếu đề án tuyển sinh chính thức của trường trước khi nộp nguyện vọng.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
