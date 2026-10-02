import React, { useState } from "react";
import { BarChart3, Lightbulb, ChevronDown, Check, Sparkles, BookOpen } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { ExamScores } from "@/engine/types";

const POPULAR_COMBOS = [
  { code: "A00", label: "A00 (Toán, Lý, Hóa)" },
  { code: "A01", label: "A01 (Toán, Lý, Anh)" },
  { code: "B00", label: "B00 (Toán, Hóa, Sinh)" },
  { code: "C00", label: "C00 (Văn, Sử, Địa)" },
  { code: "D01", label: "D01 (Toán, Văn, Anh)" },
  { code: "D07", label: "D07 (Toán, Hóa, Anh)" },
  { code: "C01", label: "C01 (Văn, Toán, Lý)" },
  { code: "D14", label: "D14 (Văn, Sử, Anh)" },
];

const ALL_9_SUBJECTS: (keyof ExamScores)[] = [
  "toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia", "gdcd"
];

export function CurrentScoresCard() {
  const { profile, updateProfile, updateExamScore } = useDecision();

  // Chế độ xem: "combo" (3 môn theo tổ hợp) hoặc "all" (bảng 9 môn)
  const [viewMode, setViewMode] = useState<"combo" | "all">("combo");

  // Tổ hợp đang xét
  const activeCombo = profile.activeCombination || "A00";
  const comboSubjects = (COMBINATION_SUBJECTS[activeCombo] || ["toan", "ly", "hoa"]) as (keyof ExamScores)[];

  // Tính tổng điểm tổ hợp qua decision-engine (gồm điểm ưu tiên & quy đổi IELTS)
  const totalComposite = calculateCompositeScore(
    profile.examScores,
    profile.altScores,
    profile.priority,
    activeCombo
  );

  // Editing state cho từng môn trong chế độ combo
  const [editingField, setEditingField] = useState<keyof ExamScores | null>(null);

  const handleScoreChange = (subject: keyof ExamScores, valStr: string) => {
    if (valStr.trim() === "") {
      updateExamScore(subject, null);
      return;
    }
    const num = parseFloat(valStr);
    if (isNaN(num)) {
      updateExamScore(subject, null);
    } else {
      const clamped = Math.min(10, Math.max(0, Math.round(num * 100) / 100));
      updateExamScore(subject, clamped);
    }
  };

  const scrollToFullMatrix = () => {
    const el = document.getElementById("full-scores-matrix");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all h-full">
      <div>
        {/* CARD HEADER & SELECTOR TỔ HỢP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Điểm thi & Tổ hợp xét tuyển
              </h3>
              <p className="text-xs text-slate-500">
                Nhập điểm 9 môn thi tốt nghiệp hoặc khối xét tuyển chính
              </p>
            </div>
          </div>

          {/* DROPDOWN CHỌN KHỐI THI */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap hidden sm:inline">
              Khối thi:
            </label>
            <div className="relative">
              <select
                value={activeCombo}
                onChange={(e) => updateProfile({ activeCombination: e.target.value })}
                className="appearance-none rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 pr-8 text-xs font-bold text-blue-800 hover:bg-blue-100/80 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POPULAR_COMBOS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* TABS CHUYỂN VIEW: 3 MÔN TỔ HỢP VS TẤT CẢ 9 MÔN */}
        <div className="mt-4 flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("combo")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "combo"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tổ hợp {activeCombo} (3 môn)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "all"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bảng 9 môn THPT
            </button>
          </div>

          <button
            type="button"
            onClick={scrollToFullMatrix}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>Ma trận tổ hợp & ĐGNL</span>
          </button>
        </div>

        {/* NỘI DUNG VIEW 1: 3 MÔN TỔ HỢP + TỔNG DỰ KIẾN */}
        {viewMode === "combo" && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {comboSubjects.map((subKey) => {
              const scoreVal = profile.examScores[subKey];
              const isEditing = editingField === subKey;
              const label = SUBJECT_LABELS_VI[subKey] || subKey;

              return (
                <div
                  key={String(subKey)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 flex flex-col items-center justify-center text-center transition hover:border-blue-300 group"
                >
                  <span className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    {label}
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="10"
                      autoFocus
                      defaultValue={scoreVal ?? ""}
                      placeholder="0.0"
                      onBlur={(e) => {
                        handleScoreChange(subKey, e.target.value);
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleScoreChange(subKey, (e.target as HTMLInputElement).value);
                          setEditingField(null);
                        }
                      }}
                      className="w-20 text-center text-2xl sm:text-3xl font-black text-slate-900 bg-white border border-blue-500 rounded-lg py-0.5 focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingField(subKey)}
                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight cursor-pointer hover:text-blue-600 transition"
                      title={`Bấm để chỉnh sửa điểm ${label}`}
                    >
                      {scoreVal !== null && scoreVal !== undefined
                        ? Number(scoreVal).toFixed(1)
                        : "—"}
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1">Bấm để sửa</span>
                </div>
              );
            })}

            {/* Ô TỔNG DỰ KIẾN TỔ HỢP */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
              <span className="text-xs font-bold text-blue-700 mb-1.5">
                Tổng {activeCombo}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                {totalComposite > 0 ? totalComposite.toFixed(2) : "0.00"}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold mt-1">
                {profile.priority?.area && profile.priority.area !== "KV3"
                  ? "Đã gồm ưu tiên"
                  : "Điểm xét tuyển"}
              </span>
            </div>
          </div>
        )}

        {/* NỘI DUNG VIEW 2: LƯỚI 9 MÔN THI TỐT NGHIỆP THPT */}
        {viewMode === "all" && (
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {ALL_9_SUBJECTS.map((subKey) => {
              const isMain = comboSubjects.includes(subKey);
              const scoreVal = profile.examScores[subKey];
              const label = SUBJECT_LABELS_VI[subKey] || subKey;

              return (
                <div
                  key={String(subKey)}
                  className={`rounded-xl border p-2.5 flex flex-col justify-between transition ${
                    isMain
                      ? "border-blue-300 bg-blue-50/30 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/40 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {label}
                    </span>
                    {isMain && (
                      <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                        {activeCombo}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    placeholder="—"
                    value={scoreVal ?? ""}
                    onChange={(e) => handleScoreChange(subKey, e.target.value)}
                    className="w-full text-center text-sm sm:text-base font-extrabold text-slate-900 bg-white border border-slate-200 rounded-md py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CALLOUT HINT & ĐIỀU HƯỚNG MA TRẬN */}
      <div className="mt-5 space-y-2">
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 sm:p-3.5 flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lightbulb className="h-4 w-4 fill-amber-300/40" />
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Đang xét tổ hợp <strong className="text-blue-700 font-bold">{activeCombo}</strong> (
            {comboSubjects.map((s) => SUBJECT_LABELS_VI[s] || s).join(" - ")}). Hệ thống tự động tính điểm chuẩn xác cho học sinh cả 63 tỉnh thành.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CurrentScoresCard;
