import React, { useState } from "react";
import Link from "@/components/navigation/HashLink";
import {
  LayoutDashboard,
  Pencil,
  Target,
  BarChart2,
  ChevronRight,
  ClipboardList,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { useDecision } from "@/state/DecisionContext";
import { SchoolAvatar } from "@/components/ui/SchoolAvatar";

export default function DashboardPage() {
  const {
    profile,
    target,
    gapAnalysis,
    hasUserData,
    resetToBlank,
    wishlist,
  } = useDecision();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleResetData = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại toàn bộ hồ sơ về trạng thái trắng không?")) {
      resetToBlank();
      showToast("Đã đặt lại dữ liệu học tập về trạng thái ban đầu.");
    }
  };

  // Tính toán điểm số chính xác và tránh bug 0 điểm
  const hasScore = gapAnalysis.currentCompositeScore > 0;
  const currentScore = gapAnalysis.currentCompositeScore;
  const targetScore = target?.cutoff2024 || target?.forecastP50 || 0;
  const hasTarget = Boolean(target && target.programId && target.programId !== "none" && targetScore > 0);

  // Khoảng cách thực tế: diff = current - target
  const scoreDiff = hasTarget && hasScore ? Number((currentScore - targetScore).toFixed(2)) : 0;
  const isTargetAchieved = scoreDiff >= 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* TOAST THÔNG BÁO TƯƠNG TÁC */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-blue-200 bg-white p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-800">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. UNIFIED HERO BANNER WITH REAL STUDENT STATS & ACTIONS */}
      <section className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-blue-50/30 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3 max-w-xl">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasUserData ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>
                {hasUserData
                  ? `Đang có dữ liệu (${profile.name || "Thí sinh"} · Khối ${profile.activeCombination || "A00"})`
                  : "Chưa có dữ liệu học tập"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Xin chào, {profile.name?.trim() ? profile.name : "bạn"}!
            </h1>

            {/* Quick Metrics Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 font-medium">Tổ hợp:</span>
                <span className="font-extrabold text-blue-700">{profile.activeCombination || "A00"}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 font-medium">Điểm xét tuyển:</span>
                <span className="font-extrabold text-slate-900">
                  {hasScore ? `${currentScore.toFixed(2)}đ` : "Chưa nhập"}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 font-medium">Mục tiêu:</span>
                <span className="font-extrabold text-indigo-700">
                  {hasTarget ? target?.schoolCode : "Chưa chọn"}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 font-medium">Danh mục NV:</span>
                <span className="font-extrabold text-emerald-700">{wishlist.length} / 15</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>{hasUserData ? "Chỉnh sửa hồ sơ" : "Nhập hồ sơ học tập"}</span>
            </Link>

            {hasUserData && (
              <button
                type="button"
                onClick={handleResetData}
                title="Xóa toàn bộ dữ liệu để nhập lại từ đầu"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa dữ liệu</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. TWO MAIN CARDS: TRƯỜNG MỤC TIÊU & BẠN CÒN THIẾU BAO NHIÊU ĐIỂM? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Card 1: Trường mục tiêu */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Target className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Trường mục tiêu</h3>
              </div>
            </div>

            <Link
              href="/profile"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{hasTarget ? "Đổi mục tiêu" : "Chọn mục tiêu"}</span>
            </Link>
          </div>

          <div className="py-5 flex-1 flex flex-col items-center justify-center">
            {hasTarget && target ? (
              <div className="space-y-3.5 w-full text-left p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center gap-3">
                  <SchoolAvatar schoolCode={target.schoolCode} schoolName={target.schoolName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{target.schoolName}</p>
                    <p className="text-xs text-slate-600 truncate font-medium">{target.majorName}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                  <span className="text-slate-500 font-medium">Điểm chuẩn tham chiếu (P50):</span>
                  <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {targetScore > 0 ? `${targetScore.toFixed(2)}đ` : "—"}
                  </span>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <Link
                    href={`/options`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Khám phá các ngành cùng trường</span>
                  </Link>
                  <Link
                    href="/analysis"
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <span>Xem môn cần tăng điểm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">Chưa chọn trường mục tiêu</p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Chọn trường mục tiêu ngay</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Bạn còn thiếu bao nhiêu điểm? */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BarChart2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Bạn còn thiếu bao nhiêu điểm?
                </h3>
              </div>
            </div>
            <Link
              href="/analysis"
              title="Xem bảng phân tích môn học ưu tiên bứt phá chi tiết"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Môn ưu tiên bứt phá</span>
            </Link>
          </div>

          <div className="py-5 flex-1 flex flex-col items-center justify-center text-center">
            {hasScore && hasTarget ? (
              <div className="space-y-3.5 w-full text-left p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Điểm xét tuyển ({profile.activeCombination || "A00"}):
                  </span>
                  <span className="font-black text-slate-900 text-sm">{currentScore.toFixed(2)} / 30</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Điểm chuẩn mục tiêu:</span>
                  <span className="font-black text-slate-900 text-sm">{targetScore.toFixed(2)} / 30</span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70">
                  <span className="text-xs font-bold text-slate-700">Tình trạng khoảng cách:</span>
                  <span
                    className={`font-black text-xs px-2.5 py-1 rounded-full border ${
                      isTargetAchieved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isTargetAchieved
                      ? `Đạt an toàn (+${scoreDiff.toFixed(2)}đ)`
                      : `Còn thiếu ${Math.abs(scoreDiff).toFixed(2)} điểm`}
                  </span>
                </div>

                <div className="pt-1">
                  <Link
                    href="/analysis"
                    className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Xem môn nào nên cày để bù {Math.abs(scoreDiff).toFixed(2)} điểm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : hasScore && !hasTarget ? (
              <div className="space-y-3 flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    Bạn đã có điểm ({currentScore.toFixed(2)}đ)
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Chọn trường mục tiêu ngay</span>
                </Link>
              </div>
            ) : !hasScore && hasTarget ? (
              <div className="space-y-3 flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    Đã có mục tiêu ({target?.schoolCode})
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Nhập điểm thi ngay →</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">Chưa có dữ liệu điểm & mục tiêu</p>
                </div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-bold transition cursor-pointer"
                >
                  Nhập hồ sơ ngay →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM 3-STEP FLOW: VIỆC NÊN LÀM TIẾP THEO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Việc nên làm tiếp theo</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Step 1: Nhập hồ sơ */}
          <Link
            href="/profile"
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition group cursor-pointer ${
              hasScore
                ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                : "border-blue-200 bg-blue-50/40 hover:bg-blue-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                hasScore
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {hasScore ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700">
                {hasScore ? `Hồ sơ: ${currentScore.toFixed(1)}đ (${profile.activeCombination})` : "Nhập hồ sơ học tập"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
          </Link>

          {/* Step 2: Chọn trường mục tiêu */}
          <Link
            href="/profile"
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition group cursor-pointer ${
              hasTarget
                ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                : hasScore
                ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50"
                : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                hasTarget
                  ? "bg-emerald-600 text-white"
                  : hasScore
                  ? "bg-amber-500 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {hasTarget ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700">
                {hasTarget ? `Mục tiêu: ${target?.schoolCode} - ${target?.majorName}` : "Chọn trường mục tiêu"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
          </Link>

          {/* Step 3: Xem gợi ý & Xếp nguyện vọng */}
          <Link
            href={hasScore && hasTarget ? "/portfolio" : "/options"}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition group cursor-pointer ${
              hasScore && hasTarget
                ? "border-blue-300 bg-blue-50/70 hover:bg-blue-100/70 shadow-xs"
                : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                hasScore && hasTarget
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {wishlist.length > 0 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700">
                {hasScore && hasTarget ? `Xếp danh mục nguyện vọng (${wishlist.length}/15)` : "Xem gợi ý nguyện vọng"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
