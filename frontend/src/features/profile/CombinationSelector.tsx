import React from "react";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { ExamScores } from "@/engine/types";

const POPULAR_COMBOS = ["A00", "A01", "D01", "D07", "B00", "C00", "C01", "D14"];

export default function CombinationSelector() {
  const { profile, updateProfile } = useDecision();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" /> Live Combination Matrix
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tự động tính điểm tổ hợp theo thời gian thực (đã gồm điểm ưu tiên và quy đổi ngoại ngữ)
          </p>
        </div>
        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Realtime
        </span>
      </div>

      <div className="space-y-2">
        {POPULAR_COMBOS.map((combo) => {
          const subjects = COMBINATION_SUBJECTS[combo] || [];
          const isSelected = profile.activeCombination === combo;
          
          // Kiểm tra xem tổ hợp này có đủ 3 môn chưa
          const missing: string[] = [];
          subjects.forEach((sub) => {
            const val = profile.examScores[sub as keyof ExamScores];
            const hasIelts = sub === "anh" && (profile.altScores?.ielts ?? 0) >= 5.0;
            if ((val === null || val === undefined || isNaN(val)) && !hasIelts) {
              missing.push(SUBJECT_LABELS_VI[sub] || sub);
            }
          });

          const isComplete = missing.length === 0;
          const score = calculateCompositeScore(
            profile.examScores,
            profile.altScores,
            profile.priority,
            combo
          );

          return (
            <button
              key={combo}
              type="button"
              onClick={() => updateProfile({ activeCombination: combo })}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                isSelected
                  ? "border-blue-600 bg-blue-50/90 text-blue-950 shadow-2xs ring-1 ring-blue-600/30"
                  : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-6 w-8 grid place-items-center rounded-md text-[11px] font-black shrink-0 ${
                    isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {combo}
                </span>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900">
                      {subjects.map((s) => SUBJECT_LABELS_VI[s] || s).join(" - ")}
                    </span>
                  </div>

                  <div className="text-[10px] mt-0.5">
                    {isComplete ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Đủ 3/3 môn
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Thiếu: {missing.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-extrabold text-slate-900 tabular-nums">
                  {score > 0 ? `${score.toFixed(2)}đ` : "—"}
                </div>
                {isSelected ? (
                  <span className="text-[10px] text-blue-700 font-black flex items-center justify-end gap-0.5">
                    <Check className="h-3 w-3" /> Đang xét
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">Bấm để chọn</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
