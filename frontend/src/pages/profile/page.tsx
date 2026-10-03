import React, { useState, useMemo } from "react";
import {
  FileText,
  Target,
  Bookmark,
  Save,
  Calculator,
  BookOpen,
  Languages,
  GraduationCap,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle2,
  Atom,
  FlaskConical,
  Dna,
  History,
  Globe2,
  Award,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ArrowRight,
  Trophy,
  Sparkles,
} from "lucide-react";
import Link from "@/components/navigation/HashLink";
import { TargetPicker } from "@/components/ui/TargetPicker";
import { useDecision } from "@/state/DecisionContext";
import { DECISION_PROGRAM_POOL, ProgramCatalogItem } from "@/data/catalog";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI, combinationLabel } from "@/data/universities/combinations";
import { PROVINCES, PriorityArea, PriorityObject, ExamScores } from "@/engine/types";

// Icon đại diện cho từng môn học
const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  toan: <Calculator className="w-4.5 h-4.5" />,
  van: <BookOpen className="w-4.5 h-4.5" />,
  anh: <Languages className="w-4.5 h-4.5" />,
  ly: <Atom className="w-4.5 h-4.5" />,
  hoa: <FlaskConical className="w-4.5 h-4.5" />,
  sinh: <Dna className="w-4.5 h-4.5" />,
  su: <History className="w-4.5 h-4.5" />,
  dia: <Globe2 className="w-4.5 h-4.5" />,
  gdcd: <Award className="w-4.5 h-4.5" />,
};

// Màu nền icon môn học
const SUBJECT_COLORS: Record<string, string> = {
  toan: "bg-blue-50 text-blue-600",
  van: "bg-purple-50 text-purple-600",
  anh: "bg-sky-50 text-sky-600",
  ly: "bg-rose-50 text-rose-600",
  hoa: "bg-amber-50 text-amber-600",
  sinh: "bg-emerald-50 text-emerald-600",
  su: "bg-orange-50 text-orange-600",
  dia: "bg-teal-50 text-teal-600",
  gdcd: "bg-indigo-50 text-indigo-600",
};

/** Các môn của chương trình GDPT 2018 có trong tổ hợp xét tuyển. */
const ALL_SUBJECTS = ["toan", "van", "anh", "ly", "hoa", "sinh", "su", "dia", "gdcd", "tin", "cncn", "cnnn"];
const COMBO_OPTIONS = Object.keys(COMBINATION_SUBJECTS).sort();

export default function ProfilePage() {
  const {
    profile,
    target,
    setTarget,
    updateExamScore,
    altScores,
    updateAltScore,
    updateProfile,
    wishlist,
    gapAnalysis,
    subjectRoiList,
  } = useDecision();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [showAltScores, setShowAltScores] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showHocBa, setShowHocBa] = useState(true);

  const updateHocBaScore = (subject: keyof ExamScores, raw: string) => {
    const value = raw === "" ? null : parseFloat(raw);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 10)) return;
    updateProfile({
      hocBaScores: {
        ...(profile.hocBaScores ?? {}),
        [subject]: value === null ? null : Math.round(value * 100) / 100,
      },
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    showToast("Đã lưu hồ sơ học tập và đồng bộ thành công!");
  };

  // Các môn thuộc tổ hợp đang kích hoạt
  const activeCombo = profile.activeCombination || "A00";
  const activeComboSubjects = COMBINATION_SUBJECTS[activeCombo] || ["toan", "ly", "hoa"];

  // Các môn thi khác (ngoài tổ hợp)
  const allOtherSubjects = (ALL_SUBJECTS as (keyof ExamScores)[])
    .filter((s) => !activeComboSubjects.includes(s));

  // Tính điểm ưu tiên theo Quy chế TT06/2026 của Bộ GD&ĐT
  const priorityAreaScore = {
    KV1: 0.75,
    "KV2-NT": 0.5,
    KV2: 0.25,
    KV3: 0.0,
  }[profile.priority?.area || "KV3"] || 0;

  const priorityObjectScore = {
    none: 0.0,
    uu_tien_1: 2.0,
    uu_tien_2: 1.0,
    uu_tien_3: 1.0,
  }[profile.priority?.object || "none"] || 0;

  const rawPriority = Math.min(3.0, priorityAreaScore + priorityObjectScore);
  const currentTotal = gapAnalysis?.currentCompositeScore || 0;
  
  // Công thức giảm tuyến tính khi điểm >= 22.5: Điểm UT = [(30 - Điểm)/7.5] * Mức UT
  const actualPriority =
    currentTotal >= 22.5 && rawPriority > 0
      ? Math.max(0, ((30 - currentTotal) / 7.5) * rawPriority)
      : rawPriority;

  // Lấy môn đòn bẩy cao nhất từ AI ROI
  const topRoi = subjectRoiList.length > 0 ? subjectRoiList[0] : null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP 3 STATS CARDS (HIỂN THỊ DỮ LIỆU THẬT, KHÔNG DÙNG CON SỐ GIẢ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Điểm xét tuyển */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Điểm xét tuyển ({activeCombo})</p>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {currentTotal > 0 ? (
                <>
                  {currentTotal.toFixed(2)}đ{" "}
                  <span className="text-xs font-medium text-slate-500">(ước tính)</span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400">Chưa nhập điểm</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: Mục tiêu mơ ước */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 text-purple-600">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mục tiêu mơ ước</p>
            <p className="text-base font-black text-slate-900 leading-tight truncate">
              {target ? target.majorName : "Chưa chọn mục tiêu"}
            </p>
            <p className="text-[11px] text-purple-700 font-semibold truncate mt-0.5">
              {target ? `${target.schoolName} (${target.schoolCode})` : "Chọn ở bảng bên phải"}
            </p>
          </div>
        </div>

        {/* Card 3: Danh mục xét tuyển (15 nguyện vọng) */}
        <Link
          href="/portfolio"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 transition group cursor-pointer shadow-2xs"
          title="Bấm để xem và xếp danh mục 15 nguyện vọng"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 transition">
              <Bookmark className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Danh mục xét tuyển</p>
              <p className="text-xl font-black text-slate-900 leading-tight">
                {wishlist.length} / 15{" "}
                <span className="text-xs font-semibold text-slate-500">nguyện vọng</span>
              </p>
              <p className="text-[11px] font-bold text-emerald-700 truncate mt-0.5">
                {wishlist.length === 0
                  ? "Chưa chọn NV nào · Bấm để thêm →"
                  : `Đã chọn ${wishlist.length} NV · Xem danh mục →`}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
        </Link>
      </div>

      {/* 2. MAIN 2-COLUMN SECTION: THÔNG TIN CHÍNH & MỤC TIÊU CỦA EM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cột trái (7 cols): THÔNG TIN CHÍNH CỦA THÍ SINH */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg">Thông tin chính</h2>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu hồ sơ</span>
            </button>
          </div>

          {/* Phần 1: Tên, Lớp, Trường THPT */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              Thông tin học sinh
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Họ và tên thí sinh
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={profile.name || ""}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Lớp</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 12A1"
                  value={profile.grade || ""}
                  onChange={(e) => updateProfile({ grade: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Trường THPT
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: THPT Chu Văn An"
                  value={profile.highSchool || ""}
                  onChange={(e) => updateProfile({ highSchool: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={profile.homeProvince || ""}
                  onChange={(e) => updateProfile({ homeProvince: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Chưa chọn</option>
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Phần 2: Tổ hợp & Điểm thi các môn */}
          <div className="space-y-3">
            {/* Chọn Tổ hợp */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Tổ hợp xét tuyển chính</span>
                </div>
              </div>

              <select
                value={activeCombo}
                onChange={(e) => updateProfile({ activeCombination: e.target.value })}
                className="font-black text-blue-700 text-xs sm:text-sm bg-white border border-blue-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer shadow-2xs"
              >
                {COMBO_OPTIONS.map((code) => (
                  <option key={code} value={code}>{combinationLabel(code)}</option>
                ))}
              </select>
            </div>

            {/* Các môn trong tổ hợp đã chọn */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 block pt-1">
                Điểm các môn thuộc tổ hợp {activeCombo}:
              </span>

              {activeComboSubjects.map((subKey) => {
                const currentScore = profile.examScores?.[subKey as keyof ExamScores];
                return (
                  <div
                    key={subKey}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          SUBJECT_COLORS[subKey] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {SUBJECT_ICONS[subKey] || <Calculator className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        {SUBJECT_LABELS_VI[subKey] || subKey}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.05"
                        placeholder="0.0"
                        value={currentScore !== undefined && currentScore !== null ? currentScore : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateExamScore(
                            subKey as keyof ExamScores,
                            val === "" ? null : parseFloat(val) || 0
                          );
                        }}
                        className="w-24 text-right font-black text-slate-900 text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold">/10</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút mở rộng nhập thêm các môn thi khác */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAllSubjects((prev) => !prev)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {showAllSubjects ? <ChevronUp className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                <span>
                  {showAllSubjects
                    ? "Thu gọn các môn khác"
                    : "Nhập thêm điểm các môn khác (để hệ thống tính được nhiều tổ hợp, nhiều ngành hơn)"}
                </span>
              </button>

              {showAllSubjects && (
                <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-blue-100">
                  {allOtherSubjects.map((subKey) => {
                    const currentScore = profile.examScores?.[subKey];
                    return (
                      <div
                        key={subKey}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              SUBJECT_COLORS[subKey] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {SUBJECT_ICONS[subKey] || <Calculator className="w-3.5 h-3.5" />}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs">
                            {SUBJECT_LABELS_VI[subKey] || subKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.05"
                            placeholder="0.0"
                            value={currentScore !== undefined && currentScore !== null ? currentScore : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateExamScore(
                                subKey,
                                val === "" ? null : parseFloat(val) || 0
                              );
                            }}
                            className="w-20 text-right font-black text-slate-900 text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-400">/10</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PHẦN: ĐIỂM HỌC BẠ THEO MÔN (PHƯƠNG THỨC XÉT HỌC BẠ) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowHocBa((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 hover:border-emerald-300 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">Điểm học bạ theo môn</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Xét học bạ</span>
                  </div>
                </div>
                {showHocBa ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showHocBa && (
                <div className="space-y-3 p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 animate-in fade-in duration-150">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Nhập điểm trung bình môn em dùng để xét học bạ (thường là TB cả năm lớp 12, hoặc TB 3 năm tùy trường).
                    Hệ thống cộng 3 môn của tổ hợp rồi so với điểm chuẩn xét học bạ các năm trước. Mỗi trường có công thức
                    riêng, nên đây là ước lượng — hãy đối chiếu đề án của trường trước khi nộp.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_SUBJECTS.map((subKey) => {
                      const value = profile.hocBaScores?.[subKey as keyof ExamScores];
                      return (
                        <label
                          key={subKey}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 bg-white"
                        >
                          <span className="text-xs font-semibold leading-tight text-slate-800">{SUBJECT_LABELS_VI[subKey] || subKey}</span>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            placeholder="–"
                            aria-label={`Điểm học bạ ${SUBJECT_LABELS_VI[subKey] || subKey}`}
                            value={value !== undefined && value !== null ? value : ""}
                            onChange={(e) => updateHocBaScore(subKey as keyof ExamScores, e.target.value)}
                            className="w-16 text-right font-black text-slate-900 text-xs bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN: CHỨNG CHỈ NGOẠI NGỮ & KỲ THI ĐGNL / ĐGTD (XÉT KẾT HỢP) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowAltScores((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-50/80 to-blue-50/50 border border-sky-200/80 hover:border-sky-300 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Chứng chỉ Quốc tế & ĐGNL / ĐGTD
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      Phương thức riêng
                    </span>
                  </div>
                </div>
                {showAltScores ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAltScores && (
                <div className="space-y-3 p-3.5 rounded-xl border border-sky-100 bg-sky-50/20 animate-in fade-in duration-150">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Lưu ý:</span> hiện hệ thống chỉ dùng <b>IELTS</b> (quy đổi thay môn Tiếng Anh
                    khi tính điểm xét tuyển). Các điểm còn lại được lưu để em theo dõi, nhưng <b>chưa được dùng để tính xác suất đỗ</b>
                    vì dữ liệu điểm chuẩn theo các phương thức ĐGNL / ĐGTD / chứng chỉ quốc tế chưa đủ tin cậy để quy đổi.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* IELTS */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">IELTS Academic</span>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Thang 9.0</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="9.0"
                          step="0.5"
                          placeholder="0.0"
                          value={altScores.ielts ?? ""}
                          onChange={(e) =>
                            updateAltScore("ielts", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* TOEIC */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">TOEIC 4 kỹ năng</span>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Thang 990</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="990"
                          step="5"
                          placeholder="0"
                          value={altScores.toeic ?? ""}
                          onChange={(e) =>
                            updateAltScore("toeic", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* SAT */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">SAT Digital</span>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Thang 1600</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="1600"
                          step="10"
                          placeholder="0"
                          value={altScores.sat ?? ""}
                          onChange={(e) =>
                            updateAltScore("sat", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ACT */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">ACT Composite</span>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Thang 36</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="36"
                          step="1"
                          placeholder="0"
                          value={altScores.act ?? ""}
                          onChange={(e) =>
                            updateAltScore("act", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* HSA (ĐHQGHN) */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">ĐGNL ĐHQG Hà Nội (HSA)</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Thang 150</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="150"
                          step="1"
                          placeholder="0"
                          value={altScores.dgnl_hn ?? ""}
                          onChange={(e) =>
                            updateAltScore("dgnl_hn", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* V-ACT (ĐHQG TP.HCM) */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">ĐGNL ĐHQG TP.HCM</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Thang 1200</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="1200"
                          step="5"
                          placeholder="0"
                          value={altScores.dgnl_hcm ?? ""}
                          onChange={(e) =>
                            updateAltScore("dgnl_hcm", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* TSA (ĐH Bách Khoa) */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900">ĐGTD Bách Khoa (TSA)</span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Thang 100</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0.0"
                          value={altScores.dgtd_bk ?? ""}
                          onChange={(e) =>
                            updateAltScore("dgtd_bk", e.target.value === "" ? null : parseFloat(e.target.value))
                          }
                          className="w-20 text-right font-black text-slate-900 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* PHẦN: THÀNH TÍCH HỌC SINH GIỎI & CUỘC THI KHKT */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowAchievements((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/80 to-yellow-50/50 border border-amber-200/80 hover:border-amber-300 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Giải thưởng Học sinh Giỏi & Cuộc thi KHKT
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      Tuyển thẳng & Điểm cộng
                    </span>
                  </div>
                </div>
                {showAchievements ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showAchievements && (
                <div className="space-y-3 p-3.5 rounded-xl border border-amber-100 bg-amber-50/20 animate-in fade-in duration-150">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Thành tích được lưu để em đối chiếu với điều kiện tuyển thẳng / ưu tiên xét tuyển trong đề án từng trường.
                    Hệ thống <b>chưa cộng điểm thưởng</b> vào xác suất đỗ, vì mức cộng khác nhau giữa các trường.
                  </p>
                  <div className="space-y-2.5">
                    {/* HSG Quốc gia */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-black text-slate-900">
                        Học sinh giỏi Quốc gia (HSG QG)
                      </span>
                      <select
                        value={altScores.hsg_quoc_gia || "none"}
                        onChange={(e) =>
                          updateAltScore("hsg_quoc_gia", e.target.value === "none" ? null : e.target.value)
                        }
                        className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                      >
                        <option value="none">Không đạt giải</option>
                        <option value="nhat">Giải Nhất Quốc gia (Tuyển thẳng)</option>
                        <option value="nhi">Giải Nhì Quốc gia (Tuyển thẳng / Điểm cộng)</option>
                        <option value="ba">Giải Ba Quốc gia (Điểm cộng)</option>
                        <option value="khuyen_khich">Giải Khuyến khích (Cộng điểm)</option>
                      </select>
                    </div>

                    {/* HSG Tỉnh / Thành phố */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-black text-slate-900">
                        Học sinh giỏi cấp Tỉnh / Thành phố
                      </span>
                      <select
                        value={altScores.hsg_tinh || "none"}
                        onChange={(e) =>
                          updateAltScore("hsg_tinh", e.target.value === "none" ? null : e.target.value)
                        }
                        className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                      >
                        <option value="none">Không đạt giải</option>
                        <option value="nhat">Giải Nhất cấp Tỉnh / TP</option>
                        <option value="nhi">Giải Nhì cấp Tỉnh / TP</option>
                        <option value="ba">Giải Ba cấp Tỉnh / TP</option>
                        <option value="khuyen_khich">Giải Khuyến khích</option>
                      </select>
                    </div>

                    {/* Cuộc thi KHKT */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="text-xs font-black text-slate-900">
                        Cuộc thi Khoa học Kỹ thuật (KHKT)
                      </span>
                      <select
                        value={altScores.khoa_hoc_ky_thuat || "none"}
                        onChange={(e) =>
                          updateAltScore("khoa_hoc_ky_thuat", e.target.value === "none" ? null : e.target.value)
                        }
                        className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                      >
                        <option value="none">Không tham gia / Không đạt giải</option>
                        <option value="qg_nhat_nhi_ba">Giải Nhất / Nhì / Ba Quốc gia</option>
                        <option value="qg_tu">Giải Tư Quốc gia</option>
                        <option value="tinh_nhat_nhi">Giải Nhất / Nhì Tỉnh / TP</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phần 4: Chế độ ưu tiên theo Quy chế TT06/2026 */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                Chế độ ưu tiên xét tuyển (TT06/2026)
              </span>

              {/* Khu vực */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Khu vực ưu tiên</span>
                </div>

                <select
                  value={profile.priority?.area || "KV3"}
                  onChange={(e) =>
                    updateProfile({ priority: { ...profile.priority, area: e.target.value as PriorityArea } })
                  }
                  className="font-bold text-slate-800 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="KV1">Khu vực 1 (KV1) · +0.75đ</option>
                  <option value="KV2-NT">Khu vực 2 Nông thôn (KV2-NT) · +0.50đ</option>
                  <option value="KV2">Khu vực 2 (KV2) · +0.25đ</option>
                  <option value="KV3">Khu vực 3 (KV3) · 0đ</option>
                </select>
              </div>

              {/* Đối tượng */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">Đối tượng chính sách</span>
                </div>

                <select
                  value={profile.priority?.object || "none"}
                  onChange={(e) =>
                    updateProfile({
                      priority: { ...profile.priority, object: e.target.value as PriorityObject },
                    })
                  }
                  className="font-bold text-slate-800 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="none">Không thuộc diện ưu tiên (0đ)</option>
                  <option value="uu_tien_1">Đối tượng ưu tiên 01 (+2.0đ)</option>
                  <option value="uu_tien_2">Đối tượng ưu tiên 02 (+1.0đ)</option>
                </select>
              </div>

              {/* Ghi chú điểm cộng thực tế */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs flex items-center justify-between text-blue-900">
                <span className="font-medium">
                  Điểm ưu tiên áp dụng:{" "}
                  <strong>+{actualPriority.toFixed(2)}đ</strong>
                </span>
                <span className="font-bold text-[11px] bg-blue-100/70 px-2 py-0.5 rounded text-blue-800">
                  Chuẩn TT06
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải (5 cols): MỤC TIÊU CỦA EM & ẢNH HƯỞNG GẦN ĐÂY */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Mục tiêu của em */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg">Mục tiêu của em</h2>
              </div>
            </div>

            {target ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
                  <p className="text-sm font-black text-slate-900">{target.majorName}</p>
                  <p className="text-xs font-semibold text-slate-600">{target.schoolName}</p>
                  <p className="mt-2 text-xs text-purple-800">
                    Điểm chuẩn dự kiến:{" "}
                    <b>{target.forecastP50 ? `${target.forecastP50.toFixed(2)}đ` : "chưa có"}</b>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/analysis" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700">Xem cần thêm bao nhiêu điểm</Link>
                  <button type="button" onClick={() => setTarget(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Đổi mục tiêu</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600">Chưa chọn. Mục tiêu dùng cho phần &quot;Cải thiện điểm&quot; và &quot;Kế hoạch học&quot;.</p>
                <TargetPicker />
              </div>
            )}
          </div>

          {/* Card 2: Ảnh hưởng gần đây (Môn ưu tiên bứt phá điểm số) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-extrabold text-sm text-emerald-950">
                {topRoi
                  ? `${topRoi.subjectVi} +0.5đ → ${topRoi.unlockedOptionsCount} lựa chọn tốt hơn`
                  : "Môn trọng tâm bứt phá điểm số"}
              </p>
            </div>
            {topRoi && (
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold pt-0.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                  Thu hẹp: +{topRoi.gapReduction.toFixed(2)}đ
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                  Mở thêm: {topRoi.unlockedOptionsCount} NV an toàn
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
