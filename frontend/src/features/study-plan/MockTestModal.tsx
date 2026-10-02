import React, { useState } from "react";
import {
  X,
  Zap,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Layers,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { ExamScores, ClosedLoopDiff } from "@/engine/types";

interface MockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MockTestModal({ isOpen, onClose }: MockTestModalProps) {
  const {
    profile,
    target,
    submitMockTest,
    latestClosedLoopDiff,
    clearClosedLoopDiff,
    isRecalculating,
  } = useDecision();

  // Danh sách các môn chính theo tổ hợp hiện tại
  const activeCombination = profile.activeCombination || "A01";
  const prioritySubjectKeys: (keyof ExamScores)[] =
    activeCombination === "A00"
      ? ["toan", "ly", "hoa"]
      : activeCombination === "A01"
      ? ["toan", "ly", "anh"]
      : activeCombination === "B00"
      ? ["toan", "hoa", "sinh"]
      : activeCombination === "C00"
      ? ["van", "su", "dia"]
      : activeCombination === "D01"
      ? ["toan", "van", "anh"]
      : ["toan", "ly", "anh"];

  // Form State
  const [testName, setTestName] = useState<string>(
    "Thi thử Khảo sát Chất lượng Đợt 2 - Chuyên KHTN"
  );
  const [testDate, setTestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reliabilityTier, setReliabilityTier] = useState<
    "tier_1_specialized_school" | "tier_2_provincial_highschool" | "tier_3_online_mock"
  >("tier_1_specialized_school");

  // State điểm thi mới
  const [newScores, setNewScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    prioritySubjectKeys.forEach((sub) => {
      const current = profile.examScores[sub];
      // Mặc định gợi ý điểm thi mới nhỉnh hơn hoặc bằng điểm hiện tại
      init[sub] = current !== null && current !== undefined ? (current + 0.5 <= 10 ? (current + 0.5).toFixed(1) : current.toFixed(1)) : "8.0";
    });
    return init;
  });

  const [testNote, setTestNote] = useState<string>(
    "Môn Toán làm tốt các câu hàm số; Môn Lý cần củng cố lại bài toán sóng cơ và mạch RLC."
  );

  const [showResultDiff, setShowResultDiff] = useState<boolean>(false);
  const [diffData, setDiffData] = useState<ClosedLoopDiff | null>(null);

  if (!isOpen) return null;

  const handleScoreChange = (sub: string, val: string) => {
    setNewScores((prev) => ({ ...prev, [sub]: val }));
  };

  const omega =
    reliabilityTier === "tier_1_specialized_school"
      ? 0.95
      : reliabilityTier === "tier_2_provincial_highschool"
      ? 0.85
      : 0.75;
  const gamma = Math.round(0.6 * omega * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedScores: Partial<Record<keyof ExamScores, number>> = {};
    for (const [k, v] of Object.entries(newScores)) {
      const num = parseFloat(v);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        parsedScores[k as keyof ExamScores] = num;
      }
    }

    const res = submitMockTest({
      testName,
      testDate,
      reliabilityTier,
      newScores: parsedScores,
      note: testNote,
    });

    setDiffData(res);
    setShowResultDiff(true);
  };

  const handleApplyAndClose = () => {
    setShowResultDiff(false);
    onClose();
  };

  const handleResetForNewLog = () => {
    setShowResultDiff(false);
    setDiffData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-3 sm:p-6 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label="Cập nhật điểm thi thử" className="relative w-full max-w-3xl rounded-2xl border border-slate-300 bg-white p-4 sm:p-6 shadow-2xl my-4 sm:my-8">
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="grid h-6 w-6 place-items-center rounded bg-indigo-600 text-white font-black text-xs">
                ⚡
              </span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-black text-indigo-700">
                Khảo sát điểm mới
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {showResultDiff
                ? "Kết Quả Sau Cập Nhật Điểm"
                : "Cập Nhật Điểm Thi Thử"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="mt-5 max-h-[72vh] overflow-y-auto pr-1 space-y-5">
          {!showResultDiff ? (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* PHẦN 1: THÔNG TIN KỲ THI */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-blue-600" /> Thông tin đợt thi thử & Độ tin cậy nguồn đề
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên đợt thi thử
                    </label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setTestName("Thi thử Khảo sát Chất lượng Đợt 2 - Chuyên KHTN")
                        }
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100"
                      >
                        Chuyên KHTN Đợt 2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTestName("Thi thử Sở GD&ĐT Hà Nội - Lần 1")
                        }
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100"
                      >
                        Sở GD&ĐT Hà Nội Lần 1
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày thi
                    </label>
                    <input
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp độ đơn vị ra đề (Trọng số tin cậy $\omega$)
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label
                      className={`cursor-pointer rounded-lg border p-2.5 text-xs flex flex-col justify-between transition ${
                        reliabilityTier === "tier_1_specialized_school"
                          ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reliability"
                        className="sr-only"
                        checked={reliabilityTier === "tier_1_specialized_school"}
                        onChange={() => setReliabilityTier("tier_1_specialized_school")}
                      />
                      <span className="font-extrabold text-slate-900">Tier 1: Sở GD / Chuyên</span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        $\omega = 0.95$ · Chuẩn cấu trúc cao nhất
                      </span>
                    </label>

                    <label
                      className={`cursor-pointer rounded-lg border p-2.5 text-xs flex flex-col justify-between transition ${
                        reliabilityTier === "tier_2_provincial_highschool"
                          ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reliability"
                        className="sr-only"
                        checked={reliabilityTier === "tier_2_provincial_highschool"}
                        onChange={() => setReliabilityTier("tier_2_provincial_highschool")}
                      />
                      <span className="font-extrabold text-slate-900">Tier 2: Trường THPT</span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        $\omega = 0.85$ · Đề thi cấp trường
                      </span>
                    </label>

                    <label
                      className={`cursor-pointer rounded-lg border p-2.5 text-xs flex flex-col justify-between transition ${
                        reliabilityTier === "tier_3_online_mock"
                          ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reliability"
                        className="sr-only"
                        checked={reliabilityTier === "tier_3_online_mock"}
                        onChange={() => setReliabilityTier("tier_3_online_mock")}
                      />
                      <span className="font-extrabold text-slate-900">Tier 3: Online / Tự luyện</span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        $\omega = 0.75$ · Làm đề tự do
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: BẢNG NHẬP ĐIỂM CÁC MÔN VỚI TÍNH TOÁN DELTA & EMA */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" /> Bảng điểm thi thử các môn (Tổ hợp {activeCombination})
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Hệ số học thích ứng $\gamma = {gamma}$
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Môn thi</th>
                        <th className="pb-2 text-center">Điểm hiện tại</th>
                        <th className="pb-2 text-center w-36">Điểm thi thử mới</th>
                        <th className="pb-2 text-center">Độ lệch $\Delta$</th>
                        <th className="pb-2 text-center">Điểm sau lọc nhiễu EMA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prioritySubjectKeys.map((sub) => {
                        const oldScore = profile.examScores[sub] ?? 7.0;
                        const newScoreStr = newScores[sub] || oldScore.toString();
                        const newScoreNum = parseFloat(newScoreStr) || oldScore;
                        const delta = Math.round((newScoreNum - oldScore) * 100) / 100;
                        const smoothed =
                          Math.round(((1 - gamma) * oldScore + gamma * newScoreNum) * 100) / 100;

                        return (
                          <tr key={sub} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 font-extrabold text-slate-900">
                              {SUBJECT_LABELS_VI[sub]} ({sub.toUpperCase()})
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-600">
                              {oldScore.toFixed(1)}đ
                            </td>
                            <td className="py-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step={0.05}
                                value={newScoreStr}
                                onChange={(e) => handleScoreChange(sub, e.target.value)}
                                className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-center font-black text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                                required
                              />
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                  delta > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : delta < 0
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-black text-indigo-700">
                              {smoothed.toFixed(2)}đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PHẦN 3: GHI CHÚ ĐỢT THI */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét / Ghi chú cá nhân về đợt thi
                </label>
                <textarea
                  rows={2}
                  value={testNote}
                  onChange={(e) => setTestNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  placeholder="Ghi chú lỗi sai hoặc nguyên nhân điểm chưa như ý..."
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isRecalculating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
                  <span>Cập Nhật & Tái Cân Bằng Ngay</span>
                </button>
              </div>
            </form>
          ) : (
            /* RESULT DIFF COCKPIT (BEFORE VS AFTER) */
            <div className="space-y-5 animate-in fade-in duration-300">
              {diffData && (
                <>
                  {/* DIFF CARD 1: SCORE CHANGES */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-600" /> 1. Biến thiên điểm số & Điểm hiệu chỉnh (EMA Smoothed)
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {diffData.scoreChanges.map((sc) => (
                        <div
                          key={sc.subject}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-900">{sc.subjectVi}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                sc.delta >= 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {sc.delta >= 0 ? `+${sc.delta}` : sc.delta}đ
                            </span>
                          </div>
                          <div className="my-2 flex items-baseline gap-2">
                            <span className="text-xs line-through text-slate-400">
                              {sc.previous.toFixed(1)}đ
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <span className="text-lg font-black text-slate-900">
                              {sc.newScore.toFixed(1)}đ
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-700 font-bold border-t border-slate-200/80 pt-1">
                            Điểm Smoothed: {sc.smoothed.toFixed(2)}đ
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DIFF CARD 2: PORTFOLIO IMPACT & BAND PROMOTIONS */}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <div className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" /> 2. Tác động tới Danh mục 15 Nguyện vọng
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 items-center">
                      <div className="p-3.5 rounded-xl border border-indigo-200 bg-white space-y-1">
                        <div className="text-[11px] font-bold text-slate-500">
                          Rủi ro trượt toàn bộ danh mục $P(fail\ all)$
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm line-through text-slate-400">
                            {(diffData.portfolioImpact.previousPFailAll * 100).toFixed(1)}%
                          </span>
                          <ArrowRight className="h-4 w-4 text-indigo-600" />
                          <span className="text-2xl font-black text-emerald-600">
                            {(diffData.portfolioImpact.newPFailAll * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {diffData.portfolioImpact.failRiskDelta <= 0
                            ? `Giảm ${Math.abs(diffData.portfolioImpact.failRiskDelta * 100).toFixed(1)}% nguy cơ chưa trúng nguyện vọng nào.`
                            : `Rủi ro tăng nhẹ do điểm số đợt thi thử.`}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {diffData.portfolioImpact.promotions.length > 0 ? (
                          diffData.portfolioImpact.promotions.map((p, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-xs text-emerald-950 font-bold flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <div>
                                <span>NV {p.rank} [{p.schoolCode}] {p.majorName}: </span>
                                <span className="text-emerald-700 font-extrabold">{p.badge}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600">
                            Các nguyện vọng tiếp tục được củng cố xác suất đỗ trong ngưỡng an toàn.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DIFF CARD 3: STUDY PLAN ALLOCATION SHIFT */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-blue-600" /> 3. Dịch chuyển phân bổ thời gian học tuần (Study Plan Shift)
                    </div>

                    <div className="space-y-2">
                      {diffData.allocationShifts.map((shift, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-xs ${
                                shift.hoursDelta > 0
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {shift.hoursDelta > 0 ? `+${shift.hoursDelta}h` : `${shift.hoursDelta}h`}
                            </span>
                            <span className="font-bold text-slate-900">Môn {shift.subjectVi}</span>
                          </div>
                          <span className="text-[11px] text-slate-600 max-w-md text-right">
                            {shift.reason}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                      💡 <strong>Kết luận từ Decision Engine:</strong> {diffData.decisionReasoning}
                    </p>
                  </div>

                  {/* ACTION BUTTONS IN RESULT VIEW */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleResetForNewLog}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      ← Nhập tiếp đợt thi khác
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyAndClose}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-sm"
                    >
                      <span>Xác Nhận & Xem Lịch Học Mới</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
