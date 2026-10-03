import React, { useMemo, useState } from "react";
import { useDecision } from "@/state/DecisionContext";
import { findProgramById } from "@/data/catalog";
import { filterByConstraints } from "@/engine/decision/constraints";
import { formatProbability } from "@/lib/format";

/**
 * Chọn ngành muốn vươn tới ngay tại chỗ. Gợi ý các ngành điểm cao nhất mà em vẫn có cơ hội
 * (xác suất 5–70%) trong số ngành thỏa điều kiện; có ô tìm theo tên trường/ngành.
 */
export function TargetPicker() {
  const { candidates, profile, setTarget } = useDecision();
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Cải thiện điểm chỉ có nghĩa với ngành xét điểm thi: điểm học bạ khó thay đổi ở cuối cấp.
    const base = filterByConstraints(candidates, profile).filter((c) => (c.admissionMethod ?? "THPT") === "THPT");
    if (q) {
      return base
        .filter((c) => `${c.schoolName} ${c.schoolCode} ${c.majorName}`.toLowerCase().includes(q))
        .sort((a, b) => b.cutoffP50 - a.cutoffP50)
        .slice(0, 8);
    }
    return base
      .filter((c) => c.admitProbability >= 0.05 && c.admitProbability <= 0.7)
      .sort((a, b) => b.cutoffP50 - a.cutoffP50)
      .slice(0, 8);
  }, [candidates, profile, query]);

  if (candidates.length === 0) return null;

  return (
    <div className="mx-auto mt-4 max-w-xl space-y-2 text-left">
      <label className="block text-xs font-bold text-slate-700">
        Chọn ngành em muốn vươn tới
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên trường hoặc ngành..."
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
      {!query && <p className="text-[11px] text-slate-500">Gợi ý: các ngành xét điểm thi, điểm cao nhất mà em còn cơ hội đỗ.</p>}
      <ul className="space-y-1.5">
        {options.map((c) => (
          <li key={c.programId}>
            <button
              type="button"
              onClick={() => {
                const program = findProgramById(c.programId);
                if (program) setTarget(program);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{c.majorName}</span>
                <span className="block truncate text-xs text-slate-500">{c.schoolName}</span>
              </span>
              <span className="shrink-0 text-right text-xs font-bold text-slate-700">
                {formatProbability(c.admitProbability)}
                <span className="block font-normal text-slate-500">chuẩn {c.cutoffP50.toFixed(1)}</span>
              </span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="text-center text-xs text-slate-500">Không có ngành phù hợp.</li>}
      </ul>
    </div>
  );
}
