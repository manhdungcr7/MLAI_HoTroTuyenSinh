import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApp, useCandidates } from "@/state/AppContext";
import { findProgramById } from "@/data/catalog";
import { formatProbability } from "@/lib/format";

/**
 * Chọn ngành muốn vươn tới ngay tại chỗ. Mặc định gợi ý các ngành xét điểm thi có điểm cao nhất
 * mà em còn cơ hội (xác suất 5–70%); gõ vào ô tìm để chọn ngành bất kỳ.
 * Chỉ ngành xét điểm thi: điểm học bạ khó thay đổi ở cuối cấp nên không có gì để cải thiện.
 */
export function TargetPicker() {
  const { setTarget } = useApp();
  const { matched } = useCandidates();
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = matched.filter((c) => (c.admissionMethod ?? "THPT") === "THPT");
    const list = q
      ? base.filter((c) => `${c.schoolName} ${c.schoolCode} ${c.majorName}`.toLowerCase().includes(q))
      : base.filter((c) => c.admitProbability >= 0.05 && c.admitProbability <= 0.7);
    return list.sort((a, b) => b.cutoffP50 - a.cutoffP50).slice(0, 8);
  }, [matched, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm trường hoặc ngành"
          aria-label="Tìm trường hoặc ngành"
          className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 pr-4 text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <ul className="space-y-2">
        {options.map((c) => (
          <li key={c.programId}>
            <button
              type="button"
              onClick={() => {
                const program = findProgramById(c.programId);
                if (program) setTarget(program);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-400 cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold text-slate-900">{c.majorName}</span>
                <span className="block truncate text-sm text-slate-500">{c.schoolName}</span>
              </span>
              <span className="shrink-0 text-right text-base font-black text-slate-900">{formatProbability(c.admitProbability)}</span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="py-6 text-center text-sm font-semibold text-slate-500">Không có ngành phù hợp</li>}
      </ul>
    </div>
  );
}
