import React, { useMemo, useState } from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft, Plus, Trash2, X, Target, Bookmark } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { findProgramById } from "@/data/catalog";
import { CandidateOption } from "@/engine/types";
import { METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability, formatTuitionPerYear } from "@/lib/format";

const TIER = {
  an_toan: { label: "An toàn", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  vua_tam: { label: "Vừa tầm", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  mao_hiem: { label: "Thử sức", cls: "bg-amber-50 text-amber-700 border-amber-200" },
} as const;

const MAX_COMPARE = 4;

export default function ComparisonPage() {
  const { candidates, compareProgramIds, toggleCompareRecommendation, clearCompareRecommendations, addWishlistItem, setTarget } =
    useDecision();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const say = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(null), 2800);
  };

  const byId = useMemo(() => new Map(candidates.map((c) => [c.programId, c])), [candidates]);
  const compared = compareProgramIds.map((id) => byId.get(id)).filter((c): c is CandidateOption => Boolean(c));

  const pickable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => !compareProgramIds.includes(c.programId))
      .filter((c) => !q || `${c.schoolName} ${c.schoolCode} ${c.majorName}`.toLowerCase().includes(q))
      .sort((a, b) => b.admitProbability - a.admitProbability || b.cutoffP50 - a.cutoffP50)
      .slice(0, 40);
  }, [candidates, compareProgramIds, query]);

  const setAsTarget = (c: CandidateOption) => {
    const program = findProgramById(c.programId);
    if (!program) return say("Không tìm thấy dữ liệu chương trình này.");
    setTarget(program);
    say(`Đã đặt "${c.majorName}" làm mục tiêu để phân tích cần thêm bao nhiêu điểm.`);
  };

  const rows: { label: string; render: (c: CandidateOption) => React.ReactNode }[] = [
    {
      label: "Xác suất đỗ",
      render: (c) => (
        <div>
          <p className="text-xl font-black text-slate-900">{formatProbability(c.admitProbability)}</p>
          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${TIER[c.role].cls}`}>{TIER[c.role].label}</span>
        </div>
      ),
    },
    {
      label: "Phương thức · tổ hợp",
      render: (c) => (
        <span>
          {METHOD_SHORT_VI[c.admissionMethod ?? "THPT"]} · {c.combination}
          {c.methodInferred && <em className="block text-[11px] text-slate-500">phương thức suy ra</em>}
          {c.combinationsVerified === false && <em className="block text-[11px] text-amber-700">tổ hợp chưa xác thực</em>}
        </span>
      ),
    },
    { label: "Điểm của em", render: (c) => <b>{c.userScore.toFixed(2)}</b> },
    {
      label: "Điểm chuẩn dự kiến",
      render: (c) => (
        <span>
          <b>{c.cutoffP50.toFixed(1)}</b>
          {typeof c.cutoffP10 === "number" && typeof c.cutoffP90 === "number" && (
            <em className="block text-[11px] text-slate-500">khoảng {c.cutoffP10.toFixed(1)} – {c.cutoffP90.toFixed(1)}</em>
          )}
        </span>
      ),
    },
    {
      label: "Điểm chuẩn các năm trước",
      render: (c) => {
        const cutoffs = findProgramById(c.programId)?.cutoffs ?? {};
        const years = Object.keys(cutoffs).sort();
        return years.length ? (
          <ul className="space-y-0.5">{years.map((y) => (<li key={y}>{y}: <b>{cutoffs[y].toFixed(2)}</b></li>))}</ul>
        ) : (
          <span className="text-slate-500">Chưa có</span>
        );
      },
    },
    { label: "Học phí / năm", render: (c) => formatTuitionPerYear(c.tuitionVnd) },
    { label: "Địa điểm", render: (c) => c.province || "Chưa rõ" },
    {
      label: "Nguồn dữ liệu",
      render: (c) => (c.sourceTier === "aggregator_verified" ? "Trang tổng hợp đã đối chiếu" : "Đề án chính thức của trường"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {notice && <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-xl">{notice}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/options" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Khám phá trường
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">So sánh {compared.length}/{MAX_COMPARE}</h1>
        </div>
        <div className="flex gap-2">
          {compared.length < MAX_COMPARE && (
            <button type="button" onClick={() => { setQuery(""); setAdding(true); }} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Thêm ngành
            </button>
          )}
          {compared.length > 0 && (
            <button type="button" onClick={clearCompareRecommendations} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /> Xóa hết
            </button>
          )}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-sm text-slate-600">Chưa có điểm để tính xác suất. Nhập điểm trước khi so sánh.</p>
          <Link href="/start" className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700">Nhập điểm</Link>
        </div>
      ) : compared.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
          <p className="text-sm text-slate-600">Chưa chọn ngành nào. Bấm "So sánh" trên thẻ ở trang Khám phá, hoặc thêm trực tiếp ở đây.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 align-top">
                <th className="w-40 p-3" />
                {compared.map((c) => (
                  <th key={c.programId} className="p-3">
                    <p className="text-sm font-extrabold text-slate-900">{c.majorName}</p>
                    <p className="text-xs font-semibold text-slate-600">{c.schoolName}</p>
                    <button type="button" onClick={() => toggleCompareRecommendation(c.programId)} aria-label={`Bỏ ${c.majorName} khỏi so sánh`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer">
                      <X className="h-3 w-3" /> Bỏ
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-slate-100 align-top">
                  <th scope="row" className="p-3 text-xs font-bold text-slate-500">{r.label}</th>
                  {compared.map((c) => (<td key={c.programId} className="p-3 text-slate-800">{r.render(c)}</td>))}
                </tr>
              ))}
              <tr>
                <th className="p-3" />
                {compared.map((c) => (
                  <td key={c.programId} className="p-3">
                    <div className="flex flex-col gap-1.5">
                      <button type="button" onClick={() => say(addWishlistItem(c) ? "Đã thêm vào danh sách nguyện vọng." : "Đã có trong danh sách, hoặc danh sách đã đủ 15.")} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-700 cursor-pointer">
                        <Bookmark className="h-3.5 w-3.5" /> Thêm vào nguyện vọng
                      </button>
                      <button type="button" onClick={() => setAsTarget(c)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                        <Target className="h-3.5 w-3.5" /> Đặt làm mục tiêu
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Thêm ngành để so sánh">
          <div className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-sm font-extrabold text-slate-900">Thêm ngành để so sánh</h2>
              <button type="button" onClick={() => setAdding(false)} aria-label="Đóng" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 pb-2">
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo trường hoặc ngành..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <ul className="overflow-y-auto p-2">
              {pickable.map((c) => (
                <li key={c.programId}>
                  <button type="button" onClick={() => { toggleCompareRecommendation(c.programId); setAdding(false); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 cursor-pointer">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{c.majorName}</span>
                      <span className="block truncate text-xs text-slate-500">{c.schoolName}</span>
                    </span>
                    <span className="shrink-0 text-sm font-black text-slate-900">{formatProbability(c.admitProbability)}</span>
                  </button>
                </li>
              ))}
              {pickable.length === 0 && <li className="p-4 text-center text-sm text-slate-500">Không có ngành phù hợp.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
