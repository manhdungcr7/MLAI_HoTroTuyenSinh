import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, School, Search, X } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { useRouter } from "@/routes";
import { AWARD_LABELS_VI, AwardLevel, ExamScores, MAJOR_GROUPS, PROVINCES, PriorityArea, PriorityObject, RankLevel, RelocationWillingness } from "@/engine/types";
import { fold, matchesQuery } from "@/lib/text";
import { APTITUDE_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { bestCombination, countEntered } from "@/engine/scoring/combo";

export type StepId = "year" | "exam" | "hocba" | "cert" | "award" | "record" | "place" | "major" | "priority";
export const STEPS: StepId[] = ["year", "exam", "hocba", "cert", "award", "record", "place", "major", "priority"];
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
const OTHER: (keyof ExamScores)[] = ["gdcd", "tin", "cncn", "cnnn", "ve", "nk_tdtt", "nk_gdmn"];

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition cursor-pointer ${
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
        className="w-full bg-transparent text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
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
  const list = more ? [...MAIN, ...OTHER.filter((s) => kind === "exam" || !APTITUDE_SUBJECTS.includes(s as never))] : MAIN;
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
        {combo && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Tổ hợp {combo}</span>}
      </div>
    </div>
  );
}

const AWARD_CHOICES: (AwardLevel | null)[] = [null, "tinh_ba", "tinh_nhi", "tinh_nhat", "quoc_gia", "quoc_te"];
const RANK_LABELS: Record<RankLevel, string> = { gioi: "Giỏi", kha: "Khá", trung_binh: "Trung bình", yeu: "Yếu" };
const CONDUCT_LABELS: Record<RankLevel, string> = { gioi: "Tốt", kha: "Khá", trung_binh: "Trung bình", yeu: "Yếu" };
const RANKS: RankLevel[] = ["gioi", "kha", "trung_binh", "yeu"];

/** Chọn ngành hoặc trường cụ thể bằng cách gõ tên (không cần gõ dấu). */
function MajorSearch() {
  const { profile, updateProfile, catalog } = useApp();
  const [query, setQuery] = useState("");
  const names = useMemo(() => profile.interestMajorNames ?? [], [profile.interestMajorNames]);
  const schools = useMemo(() => profile.preferredSchoolCodes ?? [], [profile.preferredSchoolCodes]);

  const vocabulary = useMemo(() => {
    const majors = new Map<string, { name: string; count: number }>();
    const schoolList = new Map<string, string>();
    for (const p of catalog?.programs ?? []) {
      const key = fold(p.majorName);
      const hit = majors.get(key);
      if (hit) hit.count += 1;
      else majors.set(key, { name: p.majorName, count: 1 });
      schoolList.set(p.schoolCode, p.schoolName);
    }
    return { majors: [...majors.values()], schools: [...schoolList.entries()].map(([code, name]) => ({ code, name })) };
  }, [catalog]);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const m = vocabulary.majors
      .filter((x) => matchesQuery(x.name, query) && !names.some((n) => fold(n) === fold(x.name)))
      .sort((a, b) => a.name.length - b.name.length || b.count - a.count)
      .slice(0, 5)
      .map((x) => ({ kind: "major" as const, key: x.name, label: x.name, hint: `${x.count} chương trình` }));
    const sc = vocabulary.schools
      .filter((x) => (matchesQuery(x.name, query) || fold(x.code) === fold(query)) && !schools.includes(x.code))
      .slice(0, 4)
      .map((x) => ({ kind: "school" as const, key: x.code, label: x.name, hint: x.code }));
    return [...m, ...sc];
  }, [query, vocabulary, names, schools]);

  const add = (kind: "major" | "school", key: string) => {
    if (kind === "major") updateProfile({ interestMajorNames: [...names, key] });
    else updateProfile({ preferredSchoolCodes: [...schools, key] });
    setQuery("");
  };
  const schoolName = (code: string) => vocabulary.schools.find((x) => x.code === code)?.name ?? code;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Gõ tên ngành hoặc trường"
          aria-label="Tìm ngành hoặc trường"
          className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="space-y-1.5">
          {suggestions.map((x) => (
            <li key={`${x.kind}-${x.key}`}>
              <button type="button" onClick={() => add(x.kind, x.key)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-blue-400 cursor-pointer">
                {x.kind === "major" ? <GraduationCap className="h-5 w-5 shrink-0 text-blue-600" /> : <School className="h-5 w-5 shrink-0 text-emerald-600" />}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{x.label}</span>
                <span className="shrink-0 text-xs text-slate-500">{x.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(names.length > 0 || schools.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {names.map((n) => (
            <button key={`n-${n}`} type="button" onClick={() => updateProfile({ interestMajorNames: names.filter((x) => x !== n) })} className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white cursor-pointer" aria-label={`Bỏ ${n}`}>
              {n} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          {schools.map((c) => (
            <button key={`s-${c}`} type="button" onClick={() => updateProfile({ preferredSchoolCodes: schools.filter((x) => x !== c) })} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white cursor-pointer" aria-label={`Bỏ ${schoolName(c)}`}>
              {schoolName(c)} <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Điểm học bạ theo từng lớp: một số trường chỉ lấy lớp 11, 12 hoặc cả năm lớp 12. */
function GradeScores() {
  const { profile, setGradeScore } = useApp();
  const [grade, setGrade] = useState<"10" | "11" | "12">("12");
  const row = profile.hocBaGrades?.[grade];
  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="Lớp">
        {(["10", "11", "12"] as const).map((g) => (
          <button key={g} type="button" role="tab" aria-selected={grade === g} onClick={() => setGrade(g)} className={`flex-1 rounded-xl py-2 text-sm font-medium cursor-pointer ${grade === g ? "bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
            Lớp {g}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MAIN.map((sub) => (
          <NumberField
            key={`${grade}-${sub}`}
            name={`Học bạ lớp ${grade} – ${SUBJECT_LABELS_VI[sub] ?? sub}`}
            label={SUBJECT_LABELS_VI[sub] ?? sub}
            value={row?.[sub]}
            max={10}
            step="0.05"
            onChange={(v) => setGradeScore(grade, sub, v)}
          />
        ))}
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

const TITLES: Record<StepId, string> = {
  year: "Bạn thi tốt nghiệp năm nào?",
  exam: "Điểm thi của bạn",
  hocba: "Điểm học bạ của bạn",
  cert: "Chứng chỉ và điểm ĐGNL",
  award: "Bạn có giải học sinh giỏi không?",
  record: "Học lực và hạnh kiểm lớp 12",
  place: "Bạn muốn học ở đâu?",
  major: "Bạn thích ngành nào?",
  priority: "Điểm ưu tiên của bạn",
};

export function Wizard() {
  const { profile, updateProfile, catalog } = useApp();
  const router = useRouter();
  const [index, setIndex] = useState(takeRequestedStep);
  const [notice, setNotice] = useState<string | null>(null);
  const [perGrade, setPerGrade] = useState(false);
  const provincesWithSchools = useMemo(() => new Set((catalog?.programs ?? []).map((p) => p.province).filter((v): v is string => Boolean(v))), [catalog]);
  const timer = useRef<number | null>(null);
  const step = STEPS[index];

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const hasAltScore = (["dgnl_hcm", "dgnl_hn", "dgtd_bk"] as const).some((k) => (profile.altScores?.[k] ?? 0) > 0);
  const hasGradeScores = (['10', '11', '12'] as const).some((g) => bestCombination(profile.hocBaGrades?.[g]) !== null);
  const hasScores = bestCombination(profile.examScores) !== null || bestCombination(profile.hocBaScores) !== null || hasGradeScores || hasAltScore;
  const last = index === STEPS.length - 1;

  const go = (next: number) => {
    setNotice(null);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
    window.scrollTo({ top: 0 });
  };

  const finish = () => {
    if (!hasScores) {
      setNotice("Cần điểm 3 môn của một tổ hợp (điểm thi hoặc học bạ) hoặc điểm ĐGNL/ĐGTD để tính kết quả.");
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
  const setAlt = (key: "ielts" | "toefl" | "dgnl_hcm" | "dgnl_hn" | "dgtd_bk", v: number | null) => updateProfile({ altScores: { ...alt, [key]: v } });

  const skippable = step === "hocba" || step === "cert" || step === "award" || step === "record" || step === "major" || step === "priority" || (step === "exam" && !countEntered(profile.examScores));
  const filled =
    step === "exam" ? countEntered(profile.examScores) > 0
    : step === "hocba" ? countEntered(profile.hocBaScores) > 0 || hasGradeScores
    : step === "cert" ? Object.values(alt).some((v) => typeof v === "number")
    : step === "award" ? profile.award != null
    : step === "record" ? profile.academicRank != null || profile.conduct != null
    : step === "major" ? interest.length > 0 || (profile.interestMajorNames ?? []).length > 0 || (profile.preferredSchoolCodes ?? []).length > 0
    : true;
  const nextLabel = last ? "Xem kết quả" : skippable && !filled ? "Bỏ qua" : "Tiếp tục";

  return (
    <div className="space-y-6">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label="Tiến độ">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
      </div>

      <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{TITLES[step]}</h1>

      {notice && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{notice}</p>}

      <div className="min-h-[220px]">
        {step === "year" && (
          <div className="grid gap-3">
            {[2027, 2028].map((y) => (
              <Choice key={y} label={`Năm ${y}`} selected={profile.graduationYear === y} onClick={() => choose(() => updateProfile({ graduationYear: y }))} />
            ))}
          </div>
        )}
        {step === "exam" && (
          <div className="space-y-3">
            <ScoreGrid kind="exam" />
            <p className="text-sm text-slate-500">Chưa thi? Nhập điểm thi thử hoặc điểm bạn dự kiến.</p>
          </div>
        )}
        {step === "hocba" && (
          <div className="space-y-4">
            {perGrade ? <GradeScores /> : <ScoreGrid kind="hocba" />}
            <button type="button" onClick={() => setPerGrade((v) => !v)} className="text-sm font-medium text-blue-700 underline cursor-pointer">
              {perGrade ? "Nhập trung bình 3 năm" : "Nhập theo từng lớp (một số trường chỉ lấy lớp 11, 12)"}
            </button>
          </div>
        )}
        {step === "cert" && (
          <div className="grid grid-cols-2 gap-3">
            <p className="col-span-2 text-sm text-slate-500">Chỉ nhập những gì bạn có. Mỗi trường quy đổi chứng chỉ khác nhau: ứng dụng chỉ tính khi trường công bố bảng quy đổi. TOEIC chưa hỗ trợ.</p>
            <NumberField name="IELTS" label="IELTS (0–9)" value={alt.ielts} max={9} step="0.5" onChange={(v) => setAlt("ielts", v)} />
            <NumberField name="TOEFL iBT" label="TOEFL iBT (0–120)" value={alt.toefl} max={120} step="1" onChange={(v) => setAlt("toefl", v)} />
            <NumberField name="ĐGNL ĐHQG-HCM" label="ĐGNL ĐHQG-HCM (/1200)" value={alt.dgnl_hcm} max={1200} step="1" onChange={(v) => setAlt("dgnl_hcm", v)} />
            <NumberField name="ĐGNL ĐHQG Hà Nội" label="ĐGNL ĐHQG Hà Nội (/150)" value={alt.dgnl_hn} max={150} step="1" onChange={(v) => setAlt("dgnl_hn", v)} />
            <NumberField name="ĐGTD Bách khoa" label="ĐGTD Bách khoa (/100)" value={alt.dgtd_bk} max={100} step="0.5" onChange={(v) => setAlt("dgtd_bk", v)} />
          </div>
        )}
        {step === "award" && (
          <div className="grid gap-3">
            {AWARD_CHOICES.map((a) => (
              <Choice key={a ?? "none"} label={a ? AWARD_LABELS_VI[a] : "Không có"} selected={(profile.award ?? null) === a} onClick={() => choose(() => updateProfile({ award: a }))} />
            ))}
          </div>
        )}
        {step === "record" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Học lực</p>
              <div className="flex flex-wrap gap-2.5">
                {RANKS.map((r) => (<Chip key={r} label={RANK_LABELS[r]} on={profile.academicRank === r} onClick={() => updateProfile({ academicRank: profile.academicRank === r ? null : r })} />))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Hạnh kiểm</p>
              <div className="flex flex-wrap gap-2.5">
                {RANKS.map((r) => (<Chip key={r} label={CONDUCT_LABELS[r]} on={profile.conduct === r} onClick={() => updateProfile({ conduct: profile.conduct === r ? null : r })} />))}
              </div>
            </div>
          </div>
        )}
        {step === "place" && (
          <div className="space-y-4">
            <select
              aria-label="Tỉnh / thành phố bạn ở"
              value={profile.homeProvince || ""}
              onChange={(e) => updateProfile({ homeProvince: e.target.value })}
              className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Bạn ở tỉnh / thành phố nào?</option>
              {PROVINCES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
            {profile.homeProvince && profile.relocationWillingness === "chi_tinh_nha" && !provincesWithSchools.has(profile.homeProvince) && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Dữ liệu hiện chưa có trường nào ở {profile.homeProvince}. Hãy chọn "Cùng vùng miền với bạn" hoặc "Cả nước" để thấy ngành.</p>
            )}
            <div className="grid gap-3">
              {([["khong_gioi_han", "Cả nước"], ["trong_vung", "Cùng vùng miền với bạn"], ["chi_tinh_nha", "Chỉ ở tỉnh nhà"]] as [RelocationWillingness, string][]).map(([value, label]) => (
                <Choice key={value} label={label} selected={profile.relocationWillingness === value} onClick={() => updateProfile({ relocationWillingness: value })} />
              ))}
            </div>
          </div>
        )}
        {step === "major" && (
          <div className="space-y-5">
            <MajorSearch />
            <div className="flex flex-wrap gap-2.5">
              {MAJOR_GROUPS.map((g) => (
                <Chip key={g.value} label={g.label} on={interest.includes(g.value)} onClick={() => updateProfile({ interestMajorGroups: interest.includes(g.value) ? interest.filter((x) => x !== g.value) : [...interest, g.value] })} />
              ))}
            </div>
          </div>
        )}
        {step === "priority" && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">Khu vực tính theo nơi bạn học THPT lâu nhất. Không rõ thì chọn KV3 và để Không ở mục đối tượng; trường sẽ xác nhận khi bạn nộp hồ sơ.</p>
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
          <button type="button" onClick={next} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 cursor-pointer">
            {nextLabel} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
