import React, { useState } from "react";
import { BookOpen, Award, CheckCircle2, AlertCircle, X, Sparkles, HelpCircle } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { ExamScores, AlternativeScores } from "@/engine/types";
import { convertIeltsToEnglishScore } from "@/engine/admissions/priority";
import { hsaToThpt, vactToThpt } from "@/engine/decision/percentile";

const ALL_SUBJECTS: (keyof ExamScores)[] = [
  "toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia", "gdcd"
];

export default function ScoreInputGrid() {
  const { profile, updateProfile, updateExamScore } = useDecision();
  const [showAltDetails, setShowAltDetails] = useState(false);

  const activeCombo = profile.activeCombination || "A00";
  const comboSubjects = COMBINATION_SUBJECTS[activeCombo] || [];

  // Helper tính quy đổi IELTS
  // Một bảng quy đổi duy nhất (domain/admissions/priority). Bảng thực tế do từng trường quy định.
  const getIeltsConversion = (score?: number | null) => {
    if (!score) return null;
    const converted = convertIeltsToEnglishScore(score, null);
    return converted
      ? { score: converted, text: `Quy đổi tham khảo ${converted.toFixed(1)}đ môn Anh (tùy trường)` }
      : { score: null, text: "Dưới 5.0 (không quy đổi)" };
  };

  const ieltsConversion = getIeltsConversion(profile.altScores.ielts);
  const hsaEquivalent = profile.altScores.dgnl_hn ? hsaToThpt(profile.altScores.dgnl_hn) : null;
  const vactEquivalent = profile.altScores.dgnl_hcm ? vactToThpt(profile.altScores.dgnl_hcm) : null;

  const handleScoreChange = (subject: keyof ExamScores, valueStr: string) => {
    if (valueStr === "") {
      updateExamScore(subject, null);
      return;
    }
    const num = parseFloat(valueStr);
    updateExamScore(subject, isNaN(num) ? null : num);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" /> Điểm Thi Từng Môn (Thang Điểm 10)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Các môn có viền xanh là 3 môn thuộc tổ hợp <strong className="text-blue-700">{activeCombo}</strong> đang xét
          </p>
        </div>
        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Bước nhảy 0.05đ - 0.25đ
        </span>
      </div>

      {/* LƯỚI 9 MÔN THI THPT */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_SUBJECTS.map((subKey) => {
          const isMainCombo = comboSubjects.includes(subKey);
          const scoreVal = profile.examScores[subKey];
          const isEntered = scoreVal !== null && scoreVal !== undefined && !isNaN(scoreVal);
          const isInvalid = isEntered && (scoreVal < 0 || scoreVal > 10);

          return (
            <div
              key={subKey}
              className={`relative rounded-xl border p-3 transition flex flex-col justify-between ${
                isInvalid
                  ? "border-rose-400 bg-rose-50/70"
                  : isMainCombo
                  ? "border-blue-300 bg-blue-50/40 shadow-2xs ring-1 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-900">
                  {SUBJECT_LABELS_VI[subKey]}
                </label>
                {isMainCombo && (
                  <span className="text-[9px] font-black uppercase tracking-tight text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded">
                    Tổ hợp {activeCombo}
                  </span>
                )}
              </div>

              <div className="relative mt-1">
                <input
                  type="number"
                  aria-label={`Điểm ${SUBJECT_LABELS_VI[subKey] || subKey} (0–10)`}
                  min={0}
                  max={10}
                  step={0.05}
                  value={scoreVal ?? ""}
                  onChange={(e) => handleScoreChange(subKey, e.target.value)}
                  placeholder="—"
                  className={`w-full rounded-lg border px-3 py-2 text-center text-base font-extrabold tabular-nums transition focus:outline-none ${
                    isInvalid
                      ? "border-rose-500 bg-white text-rose-900 focus:ring-2 focus:ring-rose-500"
                      : isMainCombo
                      ? "border-blue-400 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      : "border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  }`}
                />

                {/* Nút xóa nhanh môn */}
                {isEntered && (
                  <button
                    type="button"
                    onClick={() => updateExamScore(subKey, null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Xóa điểm môn này"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Lỗi hoặc ghi chú quy đổi */}
              <div className="mt-1 min-h-[16px] text-center">
                {isInvalid ? (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center justify-center gap-0.5">
                    <AlertCircle className="h-3 w-3" /> Điểm phải từ 0.0 - 10.0
                  </span>
                ) : subKey === "anh" && ieltsConversion?.score ? (
                  <span className="text-[10px] font-bold text-indigo-700 flex items-center justify-center gap-0.5">
                    <Sparkles className="h-3 w-3" /> {ieltsConversion.text}
                  </span>
                ) : isEntered ? (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Đã nhập
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Chưa thi / để trống
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHỨNG CHỈ NGOẠI NGỮ & ĐÁNH GIÁ NĂNG LỰC */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-4 w-4 text-indigo-600" /> Chứng Chỉ Quốc Tế & Đánh Giá Năng Lực
          </div>
          <button
            type="button"
            onClick={() => setShowAltDetails(!showAltDetails)}
            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            {showAltDetails ? "Thu gọn" : "Xem thêm ĐGNL HCM & ĐGTD Bách Khoa"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* IELTS */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900">
                IELTS Overall (0.0 - 9.0)
              </label>
              {ieltsConversion?.score && (
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  {ieltsConversion.text}
                </span>
              )}
            </div>
            <input
              type="number"
              aria-label="IELTS Overall (0–9)"
              min={0}
              max={9}
              step={0.5}
              value={profile.altScores.ielts ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : parseFloat(e.target.value);
                updateProfile({
                  altScores: { ...profile.altScores, ielts: val },
                });
              }}
              placeholder="VD: 6.5 hoặc 7.0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Từ 7.0 trở lên: Tự động quy đổi điểm 10 môn Tiếng Anh trong xét tuyển kết hợp.
            </p>
          </div>

          {/* ĐGNL ĐHQG HÀ NỘI (HSA) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900">
                ĐGNL ĐHQG Hà Nội (HSA, Thang 150)
              </label>
              {hsaEquivalent && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ≈ {hsaEquivalent.toFixed(1)}đ THPT (TT06)
                </span>
              )}
            </div>
            <input
              type="number"
              aria-label="Điểm HSA ĐHQG Hà Nội (0–150)"
              min={0}
              max={150}
              value={profile.altScores.dgnl_hn ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : parseFloat(e.target.value);
                updateProfile({
                  altScores: { ...profile.altScores, dgnl_hn: val },
                });
              }}
              placeholder="VD: 98 (Thang 150)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Dùng cho phương thức xét tuyển ĐGNL tại ĐHQGHN, Ngoại thương, Kinh tế Quốc dân...
            </p>
          </div>
        </div>

        {/* THÔNG SỐ BỔ SUNG MỞ RỘNG (EXPANDABLE) */}
        {showAltDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900">
                  ĐGNL ĐHQG TP.HCM (Thang 1200)
                </label>
                {vactEquivalent && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ≈ {vactEquivalent.toFixed(1)}đ THPT (TT06)
                  </span>
                )}
              </div>
              <input
                type="number"
                aria-label="Điểm ĐGNL ĐHQG TP.HCM (0–1200)"
                min={0}
                max={1200}
                value={profile.altScores.dgnl_hcm ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                  updateProfile({
                    altScores: { ...profile.altScores, dgnl_hcm: val },
                  });
                }}
                placeholder="VD: 850"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <label className="text-xs font-extrabold text-slate-900">
                ĐGTD ĐH Bách Khoa (TSA, Thang 100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={profile.altScores.dgtd_bk ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                  updateProfile({
                    altScores: { ...profile.altScores, dgtd_bk: val },
                  });
                }}
                placeholder="VD: 72.5"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <label className="text-xs font-extrabold text-slate-900">
                Điểm Học bạ THPT (GPA, Thang 10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={profile.altScores.hoc_ba_gpa ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                  updateProfile({
                    altScores: { ...profile.altScores, hoc_ba_gpa: val },
                  });
                }}
                placeholder="VD: 8.5"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
