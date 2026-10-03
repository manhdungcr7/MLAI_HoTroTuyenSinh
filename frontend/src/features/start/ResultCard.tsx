import React from "react";
import { Plus, Check, AlertCircle } from "lucide-react";
import { CandidateOption } from "@/engine/types";
import { METHOD_SHORT_VI } from "@/engine/scoring/method-score";
import { formatProbability } from "@/lib/format";

const TIER = {
  an_toan: { label: "Chắc đỗ", bar: "bg-emerald-500", text: "text-emerald-700", avatar: "from-emerald-500 to-teal-500" },
  vua_tam: { label: "Vừa tầm", bar: "bg-blue-500", text: "text-blue-700", avatar: "from-blue-500 to-indigo-500" },
  mao_hiem: { label: "Thử sức", bar: "bg-amber-500", text: "text-amber-700", avatar: "from-amber-500 to-orange-500" },
} as const;

interface ResultCardProps {
  c: CandidateOption;
  rankInWishlist: number | null;
  onToggle: (c: CandidateOption) => void;
}

/** Một ngành của một trường: xác suất đỗ là thông tin nổi bật nhất, thêm vào nguyện vọng bằng một lần bấm. */
export function ResultCard({ c, rankInWishlist, onToggle }: ResultCardProps) {
  const tier = TIER[c.role];
  const pct = Math.max(1, Math.min(100, Math.round(c.admitProbability * 100)));
  const notes = [
    c.methodInferred ? { text: "Phương thức suy ra", hint: "Đề án không ghi rõ phương thức của mức điểm này; hệ thống coi là điểm thi THPT." } : null,
    c.combinationsVerified === false ? { text: "Cần kiểm tra tổ hợp", hint: "Đề án không ghi tổ hợp cạnh điểm chuẩn; hệ thống tính theo tổ hợp tốt nhất của em. Hãy kiểm tra trường có xét tổ hợp này không." } : null,
  ].filter(Boolean) as { text: string; hint: string }[];
  const inList = rankInWishlist !== null;

  return (
    <article className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-blue-300 hover:shadow-md sm:p-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-black tracking-wide text-white ${tier.avatar}`}
        aria-hidden="true"
      >
        {c.schoolCode.slice(0, 4)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold leading-snug text-slate-900 sm:text-[15px]">{c.majorName}</h3>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
          {c.schoolName}
          {c.province ? ` · ${c.province}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{METHOD_SHORT_VI[c.admissionMethod ?? "THPT"]}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{c.combination}</span>
          {notes.length > 0 && (
            <span title={notes.map((n) => n.hint).join(" ")} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              <AlertCircle className="h-3 w-3" /> Kiểm tra đề án
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          em {c.userScore.toFixed(2)} · chuẩn dự kiến {c.cutoffP50.toFixed(1)}
        </p>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-end justify-between gap-2 sm:w-28">
        <div className="w-full text-right">
          <p className={`text-lg font-black leading-none whitespace-nowrap sm:text-xl ${tier.text}`}>{formatProbability(c.admitProbability)}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Xác suất đỗ ${pct}%`}>
            <div className={`h-full rounded-full ${tier.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{tier.label}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(c)}
          aria-pressed={inList}
          aria-label={inList ? `Bỏ ${c.majorName} khỏi nguyện vọng` : `Thêm ${c.majorName} vào nguyện vọng`}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition cursor-pointer ${
            inList ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-blue-600"
          }`}
        >
          {inList ? <><Check className="h-3.5 w-3.5" /> NV {rankInWishlist}</> : <><Plus className="h-3.5 w-3.5" /> Thêm</>}
        </button>
      </div>
    </article>
  );
}
