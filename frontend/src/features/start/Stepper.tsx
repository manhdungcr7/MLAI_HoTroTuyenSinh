import React from "react";
import { Check } from "lucide-react";

export interface StepDef {
  label: string;
  hint: string;
  done: boolean;
  enabled: boolean;
}

/** Thanh tiến độ 3 bước; bước đã hoàn thành hoặc đã mở khóa có thể bấm để quay lại. */
export function Stepper({ steps, current, onSelect }: { steps: StepDef[]; current: number; onSelect: (i: number) => void }) {
  return (
    <ol className="flex items-start gap-0" aria-label="Các bước">
      {steps.map((s, i) => {
        const active = i === current;
        return (
          <li key={s.label} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              disabled={!s.enabled}
              onClick={() => onSelect(i)}
              aria-current={active ? "step" : undefined}
              className="group flex flex-col items-center gap-1.5 disabled:cursor-not-allowed cursor-pointer"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition ${
                  active
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : s.done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {s.done && !active ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`text-xs font-bold ${active ? "text-slate-900" : "text-slate-500"}`}>{s.label}</span>
              <span className="hidden text-[11px] text-slate-400 sm:block">{s.hint}</span>
            </button>
            {i < steps.length - 1 && (
              <span className={`mt-4 h-0.5 flex-1 mx-2 rounded ${s.done ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
