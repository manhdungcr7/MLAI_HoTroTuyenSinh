import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { useRouter } from "@/routes";
import { ArrowRight, Search } from "lucide-react";
import { useApp, useCandidates } from "@/state/AppContext";
import { CandidateOption } from "@/engine/types";
import { missingInputsForProgram } from "@/engine/scoring/method-score";
import { ResultCard } from "@/features/results/ResultCard";
import { StepId, requestStep } from "@/features/start/Wizard";

type Tab = "all" | "an_toan" | "vua_tam" | "mao_hiem";
const PAGE = 12;
const TABS: { key: Tab; label: string; on: string }[] = [
  { key: "all", label: "Tất cả", on: "bg-slate-900 text-white border-slate-900" },
  { key: "an_toan", label: "Chắc đỗ", on: "bg-emerald-600 text-white border-emerald-600" },
  { key: "vua_tam", label: "Vừa tầm", on: "bg-blue-600 text-white border-blue-600" },
  { key: "mao_hiem", label: "Thử sức", on: "bg-amber-500 text-white border-amber-500" },
];

const stepForMissing = (label: string): StepId => (/học bạ/i.test(label) ? "hocba" : /ĐGNL|ĐGTD/.test(label) ? "cert" : "exam");

export default function ResultsPage() {
  const { profile, wishlist, addWish, removeWish } = useApp();
  const { candidates, matched, programs } = useCandidates();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => ({
    all: matched.length,
    an_toan: matched.filter((c) => c.role === "an_toan").length,
    vua_tam: matched.filter((c) => c.role === "vua_tam").length,
    mao_hiem: matched.filter((c) => c.role === "mao_hiem").length,
  }), [matched]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matched
      .filter((c) => (tab === "all" || c.role === tab) && (!q || `${c.schoolName} ${c.schoolCode} ${c.majorName}`.toLowerCase().includes(q)))
      .sort((a, b) => Math.round(b.admitProbability * 100) - Math.round(a.admitProbability * 100) || b.cutoffP50 - a.cutoffP50);
  }, [matched, tab, query]);

  const rankById = useMemo(() => new Map(wishlist.map((w) => [w.program_id, w.rank])), [wishlist]);

  // Điểm còn thiếu nhiều ngành nhất: gợi ý một việc duy nhất để học sinh bổ sung.
  const missing = useMemo(() => {
    const computed = new Set(candidates.map((c) => c.majorKey || c.programId));
    const counted = new Map<string, number>();
    const seen = new Set<string>();
    for (const p of programs) {
      const key = p.majorKey || p.programId;
      if (computed.has(key) || seen.has(key)) continue;
      const needs = missingInputsForProgram(profile, p);
      if (needs.length === 0) continue;
      seen.add(key);
      for (const n of needs) counted.set(n, (counted.get(n) ?? 0) + 1);
    }
    const top = [...counted.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? { label: top[0], count: top[1] } : null;
  }, [candidates, profile, programs]);

  const toggle = (c: CandidateOption) => {
    const rank = rankById.get(c.programId);
    if (rank) removeWish(rank);
    else addWish(c);
  };

  if (candidates.length === 0) {
    return (
      <div className="space-y-5 py-10 text-center">
        <h1 className="text-3xl font-black text-slate-900">Chưa có kết quả</h1>
        <Link href="/start" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-black text-white hover:bg-blue-700">
          Nhập điểm <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{counts.all} ngành phù hợp</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
          placeholder="Tìm trường hoặc ngành"
          aria-label="Tìm trường hoặc ngành"
          className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
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

      {missing && (
        <button
          type="button"
          onClick={() => { requestStep(stepForMissing(missing.label)); router.push("/start"); }}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-left text-sm font-extrabold text-blue-800 hover:bg-blue-100 cursor-pointer"
        >
          <span>Thêm {missing.label.toLowerCase()} để xem thêm {missing.count} ngành</span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </button>
      )}

      {matched.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-lg font-extrabold text-slate-900">Không có ngành nào thỏa điều kiện</p>
          <button type="button" onClick={() => { requestStep("place"); router.push("/start"); }} className="h-12 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white hover:bg-blue-700 cursor-pointer">Sửa điều kiện</button>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.slice(0, shown).map((c) => (
            <ResultCard key={c.programId} c={c} rankInWishlist={rankById.get(c.programId) ?? null} onToggle={toggle} />
          ))}
          {ranked.length === 0 && <p className="py-8 text-center text-sm font-semibold text-slate-500">Không tìm thấy</p>}
          {shown < ranked.length && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Xem thêm
            </button>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+56px)] z-20 px-4 md:static md:p-0">
        <div className="mx-auto max-w-3xl">
          <Link href="/portfolio" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-base font-black text-white shadow-xl transition hover:bg-blue-600">
            Xếp nguyện vọng {wishlist.length > 0 && `(${wishlist.length})`} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
