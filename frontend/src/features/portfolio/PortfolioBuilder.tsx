import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Copy, Printer, Sparkles, Trash2, Plus } from "lucide-react";
import { useApp, useCandidates } from "@/state/AppContext";
import { CandidateOption, WishlistItem } from "@/engine/types";
import { calculateWishlistFailAll } from "@/engine/decision/optimizer";
import { hasInterest } from "@/engine/decision/constraints";
import { candidateToWishlistItem, portfolioWarnings, suggestPortfolio } from "@/engine/decision/portfolio-suggest";
import { METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";

const TIER = {
  an_toan: { label: "Chắc đỗ", cls: "bg-emerald-50 text-emerald-700" },
  vua_tam: { label: "Vừa tầm", cls: "bg-blue-50 text-blue-700" },
  mao_hiem: { label: "Thử sức", cls: "bg-amber-50 text-amber-700" },
} as const;

function verdict(passAny: number): { text: string; cls: string } {
  if (passAny >= 0.99) return { text: "Rất an toàn", cls: "text-emerald-600" };
  if (passAny >= 0.95) return { text: "An toàn", cls: "text-emerald-600" };
  if (passAny >= 0.85) return { text: "Cần thêm nguyện vọng chắc đỗ", cls: "text-amber-600" };
  return { text: "Rủi ro cao", cls: "text-rose-600" };
}

/** Làm mới xác suất theo điểm hiện tại; nguyện vọng không còn tính được giữ số cũ và được đánh dấu. */
function refresh(w: WishlistItem, byId: Map<string, CandidateOption>): { item: WishlistItem; stale: boolean } {
  const c = w.program_id ? byId.get(w.program_id) : undefined;
  if (!c) return { item: w, stale: true };
  return { item: { ...candidateToWishlistItem(c, w.rank), rank: w.rank }, stale: false };
}

export function PortfolioBuilder() {
  const { profile, wishlist, setWishlist, moveWish, removeWish } = useApp();
  const { candidates, matched } = useCandidates();
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2500);
  };

  const byId = useMemo(() => new Map(candidates.map((c) => [c.programId, c])), [candidates]);
  const suggestedItems = useMemo(
    () => suggestPortfolio(matched, hasInterest(profile), profile.favoriteProgramIds ?? []).items.map((c, i) => candidateToWishlistItem(c, i + 1)),
    [matched, profile],
  );

  const isSuggestion = wishlist.length === 0;
  const base = isSuggestion ? suggestedItems : wishlist;
  const rows = useMemo(() => base.map((w) => refresh(w, byId)), [base, byId]);
  const items = rows.map((r) => r.item);

  const passAny = items.length > 0 ? 1 - calculateWishlistFailAll(items) : 0;
  const v = verdict(passAny);
  const warnings = portfolioWarnings(items);
  const stale = rows.some((r) => r.stale);

  const persistThen = (fn: () => void) => {
    if (isSuggestion) setWishlist(items.map((w, i) => ({ ...w, rank: i + 1 })));
    window.setTimeout(fn, 0);
  };

  const toText = () =>
    items.map((w, i) => `${i + 1}. ${w.school_name ?? w.school_code} – ${w.major_label} (${METHOD_SHORT_VI[w.admission_method ?? "THPT"]}${w.combinations_seen ? `, ${w.combinations_seen}` : ""}) – ${formatProbability(w.admit_prob)}`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText());
      say("Đã sao chép");
    } catch {
      say("Không sao chép được, hãy dùng nút In");
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="space-y-5 py-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Chưa có nguyện vọng</h1>
        <Link href="/start" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white hover:bg-blue-700">
          Nhập điểm <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">{toast}</div>}

      <h1 className="text-2xl font-semibold text-slate-900">Nguyện vọng của bạn</h1>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xs">
        <p className={`text-5xl font-bold ${v.cls}`}>{items.length ? formatProbability(passAny) : "–"}</p>
        <p className="mt-1 text-sm font-bold text-slate-500">có ít nhất một nguyện vọng đỗ</p>
        {items.length > 0 && <p className={`mt-2 text-base font-semibold ${v.cls}`}>{v.text}</p>}
      </section>

      {(warnings.length > 0 || stale) && (
        <ul className="space-y-2">
          {warnings.map((w) => (
            <li key={w.code} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${w.code === "FEW_SAFE" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {w.code === "FEW_SAFE" && "Nên có ít nhất 2 nguyện vọng chắc đỗ"}
              {w.code === "SHADOWED" && `Nguyện vọng ${w.positions.map((n) => n).join(", ")} hầu như không được xét vì đã có nguyện vọng chắc đỗ ở trước`}
              {w.code === "TEACHER_RANK" && `Ngành sư phạm phải nằm trong 5 nguyện vọng đầu (đang ở ${w.positions.join(", ")})`}
            </li>
          ))}
          {stale && <li className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700"><AlertTriangle className="h-4 w-4 shrink-0" /> Có nguyện vọng chưa tính lại theo điểm mới (dấu *)</li>}
        </ul>
      )}

      {isSuggestion && items.length > 0 && (
        <button type="button" onClick={() => { setWishlist(items.map((w, i) => ({ ...w, rank: i + 1 }))); say("Đã lưu danh sách"); }} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 cursor-pointer">
          <Sparkles className="h-5 w-5" /> Dùng danh sách đề xuất này
        </button>
      )}

      <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {rows.map(({ item: w, stale: rowStale }, i) => (
          <li key={`${w.program_id ?? w.school_code}-${i}`} className="flex items-center gap-3 px-3 py-3 sm:px-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{w.major_label}</p>
              <p className="truncate text-xs text-slate-500">{w.school_name ?? w.school_code} · {METHOD_SHORT_VI[w.admission_method ?? "THPT"]}{w.combinations_seen ? ` ${w.combinations_seen}` : ""}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="whitespace-nowrap text-base font-bold text-slate-900">{formatProbability(w.admit_prob)}{rowStale ? "*" : ""}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER[w.role].cls}`}>{TIER[w.role].label}</span>
            </div>
            <div className="flex shrink-0 flex-col gap-1 print:hidden sm:flex-row">
              <button type="button" aria-label={`Đưa nguyện vọng ${i + 1} lên`} disabled={i === 0} onClick={() => persistThen(() => moveWish(i, i - 1))} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" aria-label={`Đưa nguyện vọng ${i + 1} xuống`} disabled={i === items.length - 1} onClick={() => persistThen(() => moveWish(i, i + 1))} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" aria-label={`Bỏ nguyện vọng ${i + 1}`} onClick={() => persistThen(() => removeWish(w.rank))} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Chưa có ngành nào thỏa điều kiện</li>}
      </ol>

      <div className="grid grid-cols-3 gap-2 print:hidden">
        <Link href="/results" className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" /> Thêm</Link>
        <button type="button" onClick={copy} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"><Copy className="h-4 w-4" /> Sao chép</button>
        <button type="button" onClick={() => window.print()} className="flex h-12 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"><Printer className="h-4 w-4" /> In</button>
      </div>

      {!isSuggestion && (
        <button type="button" onClick={() => { setWishlist(suggestedItems); say("Đã đề xuất lại"); }} className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-bold text-blue-700 underline cursor-pointer print:hidden">
          <Sparkles className="h-4 w-4" /> Đề xuất lại từ điều kiện của bạn
        </button>
      )}
    </div>
  );
}
