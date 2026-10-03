import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { AlertTriangle, ArrowDown, ArrowUp, Copy, Printer, Sparkles, Trash2, Plus, ShieldCheck } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { MAJOR_GROUPS, CandidateOption, WishlistItem } from "@/engine/types";
import { calculateWishlistFailAll } from "@/engine/decision/optimizer";
import { filterByConstraints } from "@/engine/decision/constraints";
import { candidateToWishlistItem, suggestPortfolio, MAX_WISHES } from "@/engine/decision/portfolio-suggest";
import { METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";

const TIER = {
  an_toan: { label: "An toàn", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  vua_tam: { label: "Vừa tầm", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  mao_hiem: { label: "Thử sức", cls: "bg-amber-50 text-amber-700 border-amber-200" },
} as const;

function riskVerdict(p: number): { text: string; cls: string } {
  if (p < 0.01) return { text: "Rất thấp – danh sách này khá an toàn.", cls: "text-emerald-700" };
  if (p < 0.05) return { text: "Thấp – chấp nhận được.", cls: "text-emerald-700" };
  if (p < 0.15) return { text: "Trung bình – nên thêm nguyện vọng an toàn.", cls: "text-amber-700" };
  return { text: "Cao – cần thêm nguyện vọng an toàn hơn.", cls: "text-rose-700" };
}

/** Làm mới xác suất từ hồ sơ hiện tại; nguyện vọng không còn tính được thì giữ số cũ và đánh dấu. */
function refresh(w: WishlistItem, byId: Map<string, CandidateOption>): { item: WishlistItem; stale: boolean } {
  const c = w.program_id ? byId.get(w.program_id) : undefined;
  if (!c) return { item: w, stale: true };
  return { item: { ...candidateToWishlistItem(c, w.rank), rank: w.rank }, stale: false };
}

export function PortfolioBuilder() {
  const { profile, updateProfile, candidates, wishlist, setWishlist, reorderWishlist, removeWishlistItem } = useDecision();
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  const interest = useMemo(() => profile.interestMajorGroups ?? [], [profile.interestMajorGroups]);
  const matched = useMemo(() => filterByConstraints(candidates, profile), [candidates, profile]);
  const byId = useMemo(() => new Map(candidates.map((c) => [c.programId, c])), [candidates]);

  const suggestion = useMemo(() => suggestPortfolio(matched, interest.length > 0), [matched, interest]);
  const suggestedItems = useMemo(
    () => suggestion.items.map((c, i) => candidateToWishlistItem(c, i + 1)),
    [suggestion],
  );

  const isSuggestion = wishlist.length === 0;
  const base = isSuggestion ? suggestedItems : wishlist;
  const rows = useMemo(() => base.map((w) => refresh(w, byId)), [base, byId]);
  const items = rows.map((r) => r.item);

  const pFailAll = items.length > 0 ? calculateWishlistFailAll(items) : 1;
  const verdict = riskVerdict(pFailAll);
  const counts = {
    an_toan: items.filter((w) => w.role === "an_toan").length,
    vua_tam: items.filter((w) => w.role === "vua_tam").length,
    mao_hiem: items.filter((w) => w.role === "mao_hiem").length,
  };

  // Nguyện vọng đứng sau một nguyện vọng gần như chắc đỗ thì hầu như không bao giờ được xét tới.
  const shadowed = new Set<number>();
  const firstSure = items.findIndex((w) => w.admit_prob >= 0.95);
  if (firstSure >= 0) for (let i = firstSure + 1; i < items.length; i++) shadowed.add(i);

  const persistThen = (fn: () => void) => {
    if (isSuggestion) setWishlist(items.map((w, i) => ({ ...w, rank: i + 1 })));
    fn();
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    persistThen(() => reorderWishlist(from, to));
  };

  const remove = (rank: number) => {
    persistThen(() => removeWishlistItem(rank));
    say(`Đã bỏ nguyện vọng #${rank}.`);
  };

  const toText = () =>
    items
      .map((w, i) => `${i + 1}. ${w.school_name ?? w.school_code} – ${w.major_label} (${METHOD_SHORT_VI[w.admission_method ?? "THPT"]}, ${w.combinations_seen ?? ""}) – xác suất đỗ ${formatProbability(w.admit_prob)}`)
      .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText());
      say("Đã sao chép danh sách.");
    } catch {
      say("Trình duyệt không cho sao chép; hãy dùng nút In.");
    }
  };

  const toggleInterest = (value: string) =>
    updateProfile({ interestMajorGroups: interest.includes(value) ? interest.filter((v) => v !== value) : [...interest, value] });

  if (candidates.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <h2 className="text-lg font-black text-slate-900">Chưa có điểm để xếp nguyện vọng</h2>
        <p className="text-sm text-slate-600">Nhập điểm thi hoặc điểm học bạ ít nhất một tổ hợp, hệ thống sẽ đề xuất danh sách cho em.</p>
        <Link href="/start" className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700">Nhập điểm</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-16 print:max-w-none">
      {toast && <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-xl">{toast}</div>}

      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Danh sách nguyện vọng của em</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Tối đa {MAX_WISHES} nguyện vọng, xếp theo thứ tự ưu tiên: hệ thống xét từ nguyện vọng 1 xuống, em đỗ nguyện vọng nào trước thì dừng ở đó.
          Vì vậy ngành em thích nhất, khó nhất nên đứng đầu, ngành an toàn đứng cuối.
        </p>
      </header>

      {isSuggestion && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            Đây là <b>danh sách đề xuất</b> từ {matched.length} ngành thỏa điều kiện của em (chưa lưu). Chỉnh bất kỳ nguyện vọng nào là danh sách sẽ được lưu lại.
          </span>
          <button
            type="button"
            onClick={() => { setWishlist(items.map((w, i) => ({ ...w, rank: i + 1 }))); say("Đã lưu danh sách."); }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 cursor-pointer"
          >
            Lưu danh sách này
          </button>
        </div>
      )}

      {suggestion.mixedFields && isSuggestion && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <p className="text-xs font-bold text-amber-900">
            Em chưa chọn nhóm ngành quan tâm nên danh sách đang trộn nhiều lĩnh vực. Chọn nhóm ngành để danh sách đúng ý em:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MAJOR_GROUPS.map((g) => {
              const on = interest.includes(g.value);
              return (
                <button key={g.value} type="button" aria-pressed={on} onClick={() => toggleInterest(g.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold cursor-pointer ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TỔNG KẾT RỦI RO */}
      <section className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><ShieldCheck className="h-4 w-4 text-blue-600" /> Xác suất không đỗ nguyện vọng nào</div>
          <p className={`mt-1 text-3xl font-black ${verdict.cls}`}>{items.length ? `${(pFailAll * 100).toFixed(pFailAll < 0.01 ? 2 : 1)}%` : "–"}</p>
          <p className={`text-xs font-bold ${verdict.cls}`}>{items.length ? verdict.text : "Chưa có nguyện vọng."}</p>
          <p className="mt-1 text-[11px] text-slate-500">Ước lượng thống kê có tính độ lệch chung của điểm chuẩn toàn quốc giữa các năm; không phải cam kết.</p>
        </div>
        {(["mao_hiem", "vua_tam", "an_toan"] as const).map((k) => (
          <div key={k} className={`rounded-xl border p-4 ${TIER[k].cls}`}>
            <p className="text-2xl font-black leading-none">{counts[k]}</p>
            <p className="mt-1 text-xs font-bold">{TIER[k].label}{k === "an_toan" ? " (≥ 80%)" : k === "vua_tam" ? " (40–80%)" : " (< 40%)"}</p>
          </div>
        ))}
      </section>

      {(counts.an_toan < 2 || shadowed.size > 0 || rows.some((r) => r.stale)) && (
        <section className="space-y-2">
          {counts.an_toan < 2 && (
            <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Em chỉ có {counts.an_toan} nguyện vọng an toàn. Nên có ít nhất 2–3 nguyện vọng đỗ chắc ở cuối danh sách.
            </p>
          )}
          {shadowed.size > 0 && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Nguyện vọng #{firstSure + 1} gần như chắc đỗ nên các nguyện vọng sau nó ({Array.from(shadowed).map((i) => `#${i + 1}`).join(", ")}) hầu như không bao giờ được xét tới. Hãy đưa nguyện vọng khó hơn lên trước.
            </p>
          )}
          {rows.some((r) => r.stale) && (
            <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Một số nguyện vọng không còn tính được theo điểm hiện tại; xác suất của chúng là số cũ (đánh dấu "số cũ").
            </p>
          )}
        </section>
      )}

      {/* DANH SÁCH */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <ol className="divide-y divide-slate-100">
          {rows.map(({ item: w, stale }, i) => {
            const tier = TIER[w.role];
            return (
              <li key={`${w.program_id ?? w.school_code}-${i}`} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900">{w.major_label}</p>
                  <p className="truncate text-xs text-slate-600">
                    {w.school_name ?? w.school_code}{w.province ? ` · ${w.province}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {METHOD_SHORT_VI[w.admission_method ?? "THPT"]}{w.combinations_seen ? ` · ${w.combinations_seen}` : ""}
                    {w.method_inferred ? " (phương thức suy ra)" : ""}
                    {w.combinations_verified === false ? " (tổ hợp chưa xác thực)" : ""}
                    {typeof w.user_score === "number" && typeof w.forecast_p50 === "number" ? ` · em ${w.user_score.toFixed(2)} / chuẩn dự kiến ${w.forecast_p50.toFixed(1)}` : ""}
                    {shadowed.has(i) ? " · ít khi được xét" : ""}
                  </p>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-base font-black text-slate-900 whitespace-nowrap">{formatProbability(w.admit_prob)}{stale ? <span className="ml-1 text-[10px] font-bold text-slate-500">(số cũ)</span> : null}</p>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${tier.cls}`}>{tier.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1 print:hidden">
                  <button type="button" aria-label={`Đưa nguyện vọng ${i + 1} lên`} disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Đưa nguyện vọng ${i + 1} xuống`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Bỏ nguyện vọng ${i + 1}`} onClick={() => remove(w.rank)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
          {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">Danh sách đang trống. Dùng "Đề xuất lại" hoặc thêm ngành từ trang Khám phá.</li>}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button type="button" onClick={() => { setWishlist(suggestedItems); say("Đã đề xuất lại danh sách từ điều kiện hiện tại."); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 cursor-pointer">
          <Sparkles className="h-4 w-4" /> Đề xuất lại từ điều kiện của em
        </button>
        <Link href="/options" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" /> Thêm ngành từ Khám phá</Link>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"><Copy className="h-4 w-4" /> Sao chép</button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"><Printer className="h-4 w-4" /> In / Lưu PDF</button>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Đây là công cụ lập kế hoạch. Đăng ký nguyện vọng chính thức làm trên hệ thống của Bộ GD&ĐT theo lịch và quy định năm học hiện hành; hãy đối chiếu đề án tuyển sinh của từng trường (phương thức, tổ hợp, điểm cộng, điều kiện phụ) trước khi nộp.
        Thứ tự được xếp theo điểm chuẩn từ cao xuống thấp như một gợi ý; em nên đổi theo mức yêu thích thật sự của mình.
      </p>
    </div>
  );
}
