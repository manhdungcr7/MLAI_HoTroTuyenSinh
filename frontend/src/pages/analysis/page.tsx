import { TargetPicker } from "@/components/ui/TargetPicker";
import React, { useState } from "react";
import Link from "@/components/navigation/HashLink";
import {
  TrendingUp,
  Target,
  BarChart2,
  Lightbulb,
  Sparkles,
  Calculator,
  Atom,
  Languages,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  FlaskConical,
  Building2,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { ExamScores } from "@/engine/types";
import { scoreForProgram, METHOD_LABELS_VI } from "@/engine/scoring/method-score";

function getSubjectIcon(subKey: string) {
  switch (subKey) {
    case "toan":
      return <Calculator className="w-4 h-4" />;
    case "ly":
    case "hoa":
    case "sinh":
      return <Atom className="w-4 h-4" />;
    case "anh":
      return <Languages className="w-4 h-4" />;
    case "van":
    case "su":
    case "dia":
    case "gdcd":
    default:
      return <BookOpen className="w-4 h-4" />;
  }
}

function getSubjectColors(subKey: string) {
  switch (subKey) {
    case "toan":
      return { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-600", border: "border-blue-200" };
    case "ly":
      return { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-600", border: "border-purple-200" };
    case "hoa":
      return { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-600", border: "border-amber-200" };
    case "sinh":
      return { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-600", border: "border-emerald-200" };
    case "van":
      return { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-600", border: "border-rose-200" };
    case "su":
      return { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-600", border: "border-orange-200" };
    case "dia":
      return { bg: "bg-teal-50", text: "text-teal-700", bar: "bg-teal-600", border: "border-teal-200" };
    case "anh":
    default:
      return { bg: "bg-sky-50", text: "text-sky-700", bar: "bg-sky-500", border: "border-sky-200" };
  }
}

export default function AnalysisPage() {
  const { profile, target, gapAnalysis, subjectRoiList } = useDecision();

  // Tổ hợp dùng để xét ngành mục tiêu (theo phương thức của ngành), không phải tổ hợp mặc định.
  const targetMethodScore = target ? scoreForProgram(profile, target) : null;
  const activeCombo = targetMethodScore?.combo || profile.activeCombination || "";
  const comboSubjects = (COMBINATION_SUBJECTS[activeCombo] || []) as (keyof ExamScores)[];
  const scoreSource = targetMethodScore?.method === "HOC_BA" ? profile.hocBaScores : profile.examScores;

  const [selectedQuickSub, setSelectedQuickSub] = useState<keyof ExamScores>(comboSubjects[0] || "toan");

  const currentQuickSub = comboSubjects.includes(selectedQuickSub) ? selectedQuickSub : comboSubjects[0];

  // Một nguồn số duy nhất: gapAnalysis (cùng hàm với Tổng quan, Khoảng cách, Danh mục).
  const currentScore = gapAnalysis.currentCompositeScore;
  const targetScore = gapAnalysis.p50;
  const gapScore = Math.max(0, -gapAnalysis.rawGap);
  const isSafe = currentScore > 0 && gapAnalysis.rawGap >= 0;
  const ready = Boolean(target) && currentScore > 0 && targetScore > 0;

  // Lấy dữ liệu phân tích ROI thực tế cho môn đang chọn
  const activeRoiItem = subjectRoiList.find((s) => s.subject === currentQuickSub) || subjectRoiList[0];
  const quickSimDelta = activeRoiItem?.unlockedOptionsCount ?? 0;
  const quickGapReduction = activeRoiItem?.gapReduction ?? 0;

  // Lấy top môn ưu tiên từ SSOT
  const topRoi = subjectRoiList[0];
  const secondRoi = subjectRoiList[1];

  // Môn có điểm hiện tại cao nhất để khen ngợi giữ phong độ
  const sortedByCurrentScore = [...comboSubjects]
    .map((sub) => ({
      sub,
      score: scoreSource?.[sub] ?? 0,
      label: SUBJECT_LABELS_VI[sub] || sub,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const bestCurrentSubject = sortedByCurrentScore[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 0. SUB-NAVIGATION TABS DÀNH CHO PHÂN TÍCH */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200">
        <span className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-2xs">
          Tổng quan phân tích
        </span>
        <Link
          href="/analysis/gap"
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          Chi tiết khoảng cách (Gap)
        </Link>
        <Link
          href="/analysis/roi"
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          Bảng xếp hạng môn ưu tiên
        </Link>
        <Link
          href="/analysis/simulation"
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Mô phỏng thay đổi điểm</span>
        </Link>
      </div>

      {!ready ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <p className="text-base font-extrabold text-slate-900">Chưa đủ dữ liệu để phân tích</p>
          <p className="mt-2 text-sm text-slate-600">
            {!target
              ? "Hãy chọn ngành mục tiêu để xem em đang cách điểm chuẩn bao xa."
              : "Hãy nhập điểm các môn trong tổ hợp xét tuyển của ngành mục tiêu (điểm thi hoặc học bạ, tùy phương thức)."}
          </p>
          {!target ? (
            <TargetPicker />
          ) : (
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/start" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Nhập điểm</Link>
            </div>
          )}
        </section>
      ) : (
      <>
      {targetMethodScore?.method === "HOC_BA" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ngành mục tiêu này đang được tính theo <b>học bạ</b>. Điểm học bạ khó thay đổi ở cuối cấp nên các mô phỏng &quot;tăng điểm thi&quot; bên dưới
          không làm đổi kết quả. Hãy <Link href="/analysis" className="font-bold underline">chọn một ngành xét điểm thi</Link> để xem em cần cải thiện môn nào.
        </section>
      )}

      {/* 1. HEADER CARD: BỨC TRANH NĂNG LỰC VÀ MỤC TIÊU */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Em đang ở đâu so với mục tiêu?
            </h1>

            {/* Thông tin trường mục tiêu */}
            {target ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 flex-wrap">
                <span className="text-blue-700">Mục tiêu:</span>
                <span className="font-extrabold text-slate-900">{target.majorName}</span>
                <span>·</span>
                <span>{target.schoolName} ({target.schoolCode})</span>
                <Link
                  href="/profile"
                  className="text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer font-medium"
                >
                  Đổi mục tiêu
                </Link>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold">
                <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Chưa chọn trường mục tiêu.</span>
                <Link
                  href="/profile"
                  className="text-amber-800 underline hover:text-amber-950 ml-1 cursor-pointer"
                >
                  Chọn trường mục tiêu ngay →
                </Link>
              </div>
            )}
          </div>

          {/* 3 Metric Cards inside Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Điểm hiện tại */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Điểm ({activeCombo})
                </p>
                <p className="text-lg font-black text-blue-700 leading-tight">
                  {currentScore.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 30</span>
                </p>
              </div>
            </div>

            {/* Mục tiêu */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mục tiêu P50</p>
                <p className="text-lg font-black text-indigo-700 leading-tight">
                  {targetScore.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 30</span>
                </p>
              </div>
            </div>

            {/* Khoảng cách */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSafe ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}
              >
                {isSafe ? <CheckCircle2 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Khoảng cách</p>
                <p
                  className={`text-lg font-black leading-tight ${
                    isSafe ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {isSafe ? "An toàn" : `-${gapScore.toFixed(2)}đ`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN 2-COLUMN SECTION: KHOẢNG CÁCH CHÍNH & ĐIỂM THEN CHỐT CẦN CHÚ Ý */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cột trái (6 cols): Khoảng cách chính (Tự động theo tổ hợp môn của thí sinh) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Khoảng cách chính ({activeCombo})
              </h2>
            </div>
            <Link
              href="/analysis/gap"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Danh sách các môn trong tổ hợp thực tế */}
          <div className="space-y-4 py-1">
            {comboSubjects.map((subKey) => {
              const score = scoreSource?.[subKey] ?? 0;
              const subLabel = SUBJECT_LABELS_VI[subKey] || subKey;
              const colors = getSubjectColors(subKey);
              const roi = subjectRoiList.find((r) => r.subject === subKey);

              return (
                <div key={subKey} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
                  >
                    {getSubjectIcon(subKey)}
                  </div>
                  <span className="w-16 font-bold text-slate-800 text-sm truncate">{subLabel}</span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${colors.bar} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, (score / 10) * 100)}%` }}
                    />
                  </div>
                  <span className="font-black text-xs text-slate-700 w-14 text-right">
                    {score.toFixed(1)} / 10
                  </span>
                  {roi ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0" title="Số ngành thêm vào tầm với nếu môn này tăng 0,5 điểm">
                      +0,5đ → +{roi.unlockedOptionsCount} ngành
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Tổ hợp xét ngành mục tiêu: <strong>{activeCombo}</strong>
              {targetMethodScore ? ` · ${METHOD_LABELS_VI[targetMethodScore.method]}` : ""}
              {isSafe ? " · đang cao hơn điểm chuẩn tham chiếu" : gapScore > 0 ? ` · còn thiếu ${gapScore.toFixed(2)}đ` : ""}
            </span>
            <Link href="/profile" className="text-blue-600 hover:text-blue-800 font-bold">
              Đổi tổ hợp môn →
            </Link>
          </div>
        </div>

        {/* Cột phải (6 cols): Điểm then chốt cần chú ý (Dữ liệu tính toán từ AI SSOT) */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Điểm then chốt cần chú ý
              </h2>
            </div>
            <Link
              href="/analysis/roi"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Xem xếp hạng môn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {/* Thẻ 1: Môn ưu tiên số 1 (Tính toán thật từ SSOT) */}
            {topRoi && (
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-indigo-950">
                    {topRoi.subjectVi} +0.5đ → mở thêm {topRoi.unlockedOptionsCount} lựa chọn
                  </p>
                </div>
              </div>
            )}

            {/* Thẻ 2: Môn ưu tiên số 2 */}
            {secondRoi && (
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-blue-950">
                    {secondRoi.subjectVi} +0.5đ → tăng tỷ lệ trúng tuyển
                  </p>
                </div>
              </div>
            )}

            {/* Thẻ 3: Môn đang giữ phong độ tốt nhất */}
            {bestCurrentSubject && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm text-emerald-950">
                    {bestCurrentSubject.label} ({bestCurrentSubject.score.toFixed(1)}đ) giữ vững phong độ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. THỬ NHANH TÁC ĐỘNG TĂNG ĐIỂM (TÍNH TOÁN THEO DỮ LIỆU THẬT) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Thử nhanh tác động tăng điểm</h3>
          </div>
          <Link
            href="/analysis/simulation"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mô phỏng chuyên sâu</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Danh sách các nút môn học động theo tổ hợp */}
          <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
            {comboSubjects.map((subKey) => {
              const score = profile.examScores?.[subKey] ?? 0;
              const subLabel = SUBJECT_LABELS_VI[subKey] || subKey;
              const isSelected = currentQuickSub === subKey;
              const colors = getSubjectColors(subKey);

              return (
                <button
                  key={subKey}
                  type="button"
                  onClick={() => setSelectedQuickSub(subKey)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer flex-1 min-w-[150px] ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 shadow-2xs ring-1 ring-blue-600"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
                  >
                    {getSubjectIcon(subKey)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900">+0.5 {subLabel}</p>
                    <p className="text-[10px] text-slate-500">
                      Từ {score.toFixed(1)} → {(score + 0.5).toFixed(1)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block shrink-0" />

          {/* Result Card: Tính toán thật từ ROI Engine */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 flex items-center gap-3.5 shrink-0 min-w-[260px] w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Kết quả ước tính (+0.5đ {SUBJECT_LABELS_VI[currentQuickSub]})
              </p>
              <p className="text-lg font-black text-blue-700 leading-tight">
                +{quickSimDelta} lựa chọn mới
              </p>
              <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                Thu hẹp {quickGapReduction.toFixed(1)}đ khoảng cách
              </p>
            </div>
          </div>
        </div>
      </section>
      </>
      )}
    </div>
  );
}
