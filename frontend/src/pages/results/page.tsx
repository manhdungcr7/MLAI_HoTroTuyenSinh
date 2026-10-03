import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { useRouter } from "@/routes";
import { ArrowRight, Info, Search, TriangleAlert } from "lucide-react";
import { useApp, useCandidates } from "@/state/AppContext";
import { CandidateOption, MAJOR_GROUPS } from "@/engine/types";
import { matchesInterest } from "@/engine/decision/constraints";
import { missingInputsForProgram } from "@/engine/scoring/method-score";
import { ResultCard } from "@/features/results/ResultCard";
import { StepId, requestStep } from "@/features/start/Wizard";
import { cardNote, profileNotices, relaxations } from "@/features/results/insights";
import { NotFoundHelp } from "@/features/results/NotFoundHelp";
import { matchesQuery } from "@/lib/text";

type Tab = "all" | "an_toan" | "vua_tam" | "mao_hiem";
const PAGE = 12;
const TABS: { key: Tab; label: string; on: string }[] = [
  { key: "all", label: "Tất cả", on: "bg-slate-900 text-white border-slate-900" },
  { key: "an_toan", label: "Chắc đỗ", on: "bg-emerald-600 text-white border-emerald-600" },
  { key: "vua_tam", label: "Vừa tầm", on: "bg-blue-600 text-white border-blue-600" },
  { key: "mao_hiem", label: "Thử sức", on: "bg-amber-500 text-white border-amber-500" },
];
const GROUP_LABEL = new Map(MAJOR_GROUPS.map((g) => [g.value, g.label]));

const stepForMissing = (label: string): StepId => (/học bạ/i.test(label) ? "hocba" : /ĐGNL|ĐGTD/.test(label) ? "cert" : "exam");

/** Xác suất làm tròn 1%; từ 97% trở lên coi là một nhóm "gần như chắc đỗ", xếp theo điểm chuẩn (trường tốt hơn lên trước). */
const band = (p: number) => Math.min(97, Math.round(p * 100));

export default function ResultsPage() {
  const { profile, wishlist, addWish, removeWish, toggleFavorite, updateProfile } = useApp();
  const { candidates, matched, programs } = useCandidates();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => ({
    all: matched.length,
    an_toan: matched.filter((c) => c.role === "an_toan").length,
    vua_tam: matched.filter((c) => c.role === "vua_tam").length,
    mao_hiem: matched.filter((c) => c.role === "mao_hiem").length,
  }), [matched]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, number>();
    for (const c of matched) byGroup.set(c.majorGroup, (byGroup.get(c.majorGroup) ?? 0) + 1);
    return [...byGroup.entries()].filter(([g]) => GROUP_LABEL.has(g)).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [matched]);

  const ranked = useMemo(() => {
    return matched
      .filter((c) => (tab === "all" || c.role === tab) && (group === "all" || c.majorGroup === group) && (!query.trim() || matchesQuery(`${c.schoolName} ${c.schoolCode} ${c.majorName}`, query)))
      .sort((a, b) => band(b.admitProbability) - band(a.admitProbability) || b.cutoffP50 - a.cutoffP50 || b.admitProbability - a.admitProbability);
  }, [matched, tab, group, query]);

  const favorites = useMemo(() => new Set(profile.favoriteProgramIds ?? []), [profile.favoriteProgramIds]);
  const rankById = useMemo(() => new Map(wishlist.map((w) => [w.program_id, w.rank])), [wishlist]);
  const programById = useMemo(() => new Map(programs.map((p) => [p.programId, p])), [programs]);
  const notices = useMemo(() => profileNotices(profile), [profile]);
  const hasAlt = (['dgnl_hcm', 'dgnl_hn', 'dgtd_bk'] as const).some((k) => (profile.altScores?.[k] ?? 0) > 0);

  // Điểm còn thiếu nhiều ngành nhất: gợi ý một việc duy nhất để học sinh bổ sung.
  const missing = useMemo(() => {
    const computed = new Set(candidates.map((c) => c.majorKey || c.programId));
    const counted = new Map<string, number>();
    const seen = new Set<string>();
    for (const p of programs) {
      const key = p.majorKey || p.programId;
      if (computed.has(key) || seen.has(key) || !matchesInterest(p, profile)) continue;
      const needs = missingInputsForProgram(profile, p);
      if (needs.length === 0) continue;
      seen.add(key);
      for (const n of needs) counted.set(n, (counted.get(n) ?? 0) + 1);
    }
    const top = [...counted.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { label: top[0], count: top[1] } : null;
  }, [candidates, profile, programs]);

  const noLocalSchool = profile.relocationWillingness === "chi_tinh_nha" && !!profile.homeProvince && !programs.some((p) => p.province === profile.homeProvince);
  const options = useMemo(() => (matched.length === 0 ? relaxations(candidates, profile) : []), [matched.length, candidates, profile]);

  const toggle = (c: CandidateOption) => {
    const rank = rankById.get(c.programId);
    if (rank) removeWish(rank);
    else addWish(c);
  };

  if (candidates.length === 0) {
    return (
      <div className="space-y-5 py-10 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Chưa có kết quả</h1>
        <p className="mx-auto max-w-md text-sm text-slate-600">
          {hasAlt
            ? "Dữ liệu hiện chỉ có rất ít chương trình xét điểm ĐGNL/ĐGTD. Hãy nhập thêm điểm thi (hoặc thi thử) 3 môn của một tổ hợp hoặc điểm học bạ để xem nhiều ngành hơn."
            : "Cần điểm 3 môn của một tổ hợp, điểm học bạ hoặc điểm ĐGNL."}
        </p>
        <Link href="/start" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white hover:bg-blue-700">
          Nhập điểm <ArrowRight className="h-5 w-5" />
        </Link>
        <NotificationsList notices={notices} />
        <NotFoundHelp />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">{counts.all} ngành phù hợp</h1>

      <NotificationsList notices={notices} />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
          placeholder="Tìm trường hoặc ngành"
          aria-label="Tìm trường hoặc ngành"
          className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Khả năng đỗ">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setShown(PAGE); }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition cursor-pointer ${tab === t.key ? t.on : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {t.label} <span className="opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {groups.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Nhóm ngành">
          {[["all", "Mọi nhóm ngành"] as const, ...groups.map(([g]) => [g, GROUP_LABEL.get(g) ?? g] as const)].map(([g, label]) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => { setGroup(g); setShown(PAGE); }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition cursor-pointer ${group === g ? "bg-blue-100 text-blue-800" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {missing && (
        <button
          type="button"
          onClick={() => { requestStep(stepForMissing(missing.label)); router.push("/start"); }}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-800 hover:bg-blue-100 cursor-pointer"
        >
          <span>Thêm {missing.label.charAt(0).toLowerCase() + missing.label.slice(1)} để xem thêm {missing.count} ngành</span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </button>
      )}

      {matched.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Chưa có ngành thỏa điều kiện của bạn</p>
          {noLocalSchool && <p className="text-sm text-slate-600">Dữ liệu hiện chưa có trường nào ở {profile.homeProvince}.</p>}
          {options.length > 0 ? (
            <div className="grid gap-2.5">
              {options.map((o) => (
                <button key={o.key} type="button" onClick={() => updateProfile(o.apply)} className="flex h-12 items-center justify-between gap-3 rounded-2xl bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer">
                  <span>{o.label}</span>
                  <span className="opacity-80">{o.count} ngành</span>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => { requestStep("place"); router.push("/start"); }} className="h-12 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer">Sửa điều kiện</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.slice(0, shown).map((c) => (
            <ResultCard key={c.programId} c={c} rankInWishlist={rankById.get(c.programId) ?? null} onToggle={toggle} favorite={favorites.has(c.programId)} onFavorite={(x) => toggleFavorite(x.programId)} note={cardNote(profile, c)} program={programById.get(c.programId)} />
          ))}
          {ranked.length === 0 && <p className="py-8 text-center text-sm font-medium text-slate-500">Không tìm thấy</p>}
          {shown < ranked.length && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Xem thêm
            </button>
          )}
        </div>
      )}

      <NotFoundHelp />

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+56px)] z-20 px-4 md:static md:p-0">
        <div className="mx-auto max-w-3xl">
          <Link href="/portfolio" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-base font-bold text-white shadow-xl transition hover:bg-blue-600">
            Xếp nguyện vọng {wishlist.length > 0 && `(${wishlist.length})`} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotificationsList({ notices }: { notices: { tone: "info" | "warn"; text: string }[] }) {
  if (notices.length === 0) return null;
  return (
    <div className="space-y-2.5 text-left">
      {notices.map((n) => (
        <p key={n.text} className={`flex gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed ${n.tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"}`}>
          {n.tone === "warn" ? <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" /> : <Info className="mt-0.5 h-5 w-5 shrink-0" />}
          <span>{n.text}</span>
        </p>
      ))}
    </div>
  );
}
