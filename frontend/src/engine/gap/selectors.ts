import { StudentProfile, TargetProgram } from "@/engine/types";
import { DEFAULT_STUDENT_PROFILE } from "@/data/seed/personas";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { runGapAnalysis } from "@/engine/gap/engine";
import { calculateAdmitProbability } from "@/engine/admissions/probability";

export interface DetailedGapAnalysis {
  targetProgram: TargetProgram;
  combination: string;
  currentCompositeScore: number;
  /** null = không có điểm chuẩn hợp lệ năm đó */
  cutoff2024: number | null;
  gapVs2024: number | null;
  cutoff2021: number | null;
  cutoff2022: number | null;
  cutoff2023: number | null;
  yearsOfData: number;
  p10: number;
  p50: number;
  p90: number;
  gapVsP50: number;
  gapVsP10: number;
  gapVsP90: number;
  admitProbability: number;
  admitProbabilityPct: number;
  gapStatus: "thach_thuc" | "vua_tam" | "an_toan";
  statusLabelVi: string;
  statusBadge: {
    text: string;
    bg: string;
    textCol: string;
    border: string;
  };
  historicalTrend: "tang_nhiet" | "on_dinh" | "ha_nhiet";
  historicalTrendVi: string;
  historicalChartData: {
    year: string;
    cutoff?: number | null;
    p10?: number | null;
    p50?: number | null;
    p90?: number | null;
    candidateScore: number;
    type: string;
    isForecast?: boolean;
  }[];
  adviceVi: string;
  safetyBufferVi: string;
}

/**
 * Selector trình diễn: Nhận GapMetric từ runGapAnalysis (Single Source of Truth)
 * và định dạng các trường giao diện (badges, charts, văn bản tư vấn).
 */
export function selectGapAnalysis(
  target: TargetProgram | null | undefined,
  profile: StudentProfile | null | undefined
): DetailedGapAnalysis {
  const safeTarget = target && target.programId ? target : DECISION_PROGRAM_POOL[0];
  const safeProfile = profile && profile.examScores ? profile : DEFAULT_STUDENT_PROFILE;

  // Gọi trực tiếp runGapAnalysis — nguồn chân lý duy nhất cho phân tích khoảng cách điểm
  const base = runGapAnalysis(safeTarget, safeProfile);
  const currentScore = base.currentCompositeScore;
  const p50 = base.p50;
  const p10 = base.p10;
  const p90 = base.p90;
  const admitProb = calculateAdmitProbability(currentScore, p50);
  const admitProbabilityPct = Math.round(admitProb * 100);

  const cutoff2024 = safeTarget.cutoff2024 ?? null;
  const cutoff2023 = safeTarget.cutoff2023 ?? null;
  const cutoff2022 = safeTarget.cutoff2022 ?? null;
  const cutoff2021 = safeTarget.cutoff2021 ?? null;
  const history = [cutoff2021, cutoff2022, cutoff2023, cutoff2024].filter((v): v is number => v !== null);
  const yearsOfData = history.length;

  const gapVs2024 = cutoff2024 !== null && currentScore > 0 ? Number((currentScore - cutoff2024).toFixed(2)) : null;
  const gapVsP50 = base.rawGap;
  const gapVsP10 = Number((currentScore - p10).toFixed(2));
  const gapVsP90 = Number((currentScore - p90).toFixed(2));

  const gapStatus = base.gapStatus;
  const BADGES: Record<typeof gapStatus, { label: string; badge: DetailedGapAnalysis["statusBadge"] }> = {
    an_toan: {
      label: "An toàn",
      badge: { text: "AN TOÀN", bg: "bg-emerald-50", textCol: "text-emerald-800", border: "border-emerald-300" },
    },
    vua_tam: {
      label: "Phù hợp",
      badge: { text: "PHÙ HỢP", bg: "bg-blue-50", textCol: "text-blue-800", border: "border-blue-300" },
    },
    thach_thuc: {
      label: "Thử sức",
      badge: { text: "THỬ SỨC", bg: "bg-rose-50", textCol: "text-rose-800", border: "border-rose-300" },
    },
  };
  const statusLabelVi = BADGES[gapStatus].label;
  const statusBadge = BADGES[gapStatus].badge;

  const deltaRecent = history.length >= 2 ? history[history.length - 1] - history[history.length - 2] : 0;
  let historicalTrendVi = history.length >= 2 ? `Ổn định (${deltaRecent >= 0 ? "+" : ""}${deltaRecent.toFixed(2)}đ)` : "Chưa đủ dữ liệu";
  if (base.historicalTrend === "tang_nhiet") {
    historicalTrendVi = `Tăng (+${deltaRecent.toFixed(2)}đ so với năm trước)`;
  } else if (base.historicalTrend === "ha_nhiet") {
    historicalTrendVi = `Giảm (${deltaRecent.toFixed(2)}đ so với năm trước)`;
  }

  const historicalChartData = [
    { year: "2021", cutoff: cutoff2021, candidateScore: currentScore, type: "Điểm chuẩn", isForecast: false },
    { year: "2022", cutoff: cutoff2022, candidateScore: currentScore, type: "Điểm chuẩn", isForecast: false },
    { year: "2023", cutoff: cutoff2023, candidateScore: currentScore, type: "Điểm chuẩn", isForecast: false },
    { year: "2024", cutoff: cutoff2024, candidateScore: currentScore, type: "Điểm chuẩn", isForecast: false },
    { year: "Tham chiếu (thấp)", p10, candidateScore: currentScore, type: "Mức thấp của khoảng dao động", isForecast: true },
    { year: "Tham chiếu (giữa)", p50, candidateScore: currentScore, type: "Điểm chuẩn gần nhất", isForecast: true },
    { year: "Tham chiếu (cao)", p90, candidateScore: currentScore, type: "Mức cao của khoảng dao động", isForecast: true },
  ].filter((d) => d.isForecast || d.cutoff !== null);

  let adviceVi = "";
  let safetyBufferVi = "";
  if (currentScore <= 0) {
    adviceVi = `Chưa đủ điểm 3 môn cho tổ hợp của ngành này.`;
    safetyBufferVi = "Chưa tính được";
  } else if (gapStatus === "an_toan") {
    adviceVi = `Điểm của bạn (${currentScore}đ) cao hơn điểm chuẩn gần nhất ${gapVsP50}đ. Đây có thể là lựa chọn an toàn, nhưng điểm chuẩn vẫn có thể tăng nếu đề dễ.`;
    safetyBufferVi = `Đang dư ${gapVsP50}đ so với điểm chuẩn gần nhất`;
  } else if (gapStatus === "vua_tam") {
    adviceVi = `Điểm của bạn (${currentScore}đ) nằm trong khoảng điểm chuẩn thường dao động (${p10} – ${p90}đ). Khả năng đỗ ước tính ${admitProbabilityPct}%.`;
    safetyBufferVi = `${gapVsP50 >= 0 ? "Dư " + gapVsP50 : "Thiếu " + Math.abs(gapVsP50)}đ so với điểm chuẩn gần nhất`;
  } else {
    adviceVi = `Điểm của bạn (${currentScore}đ) đang thấp hơn điểm chuẩn gần nhất ${Math.abs(gapVsP50)}đ. Nên xem đây là nguyện vọng Thử sức và có thêm lựa chọn dự phòng.`;
    safetyBufferVi = `Thiếu ${Math.abs(gapVsP50)}đ so với điểm chuẩn gần nhất`;
  }

  const primaryCombo = safeTarget.combinations.includes(safeProfile.activeCombination)
    ? safeProfile.activeCombination
    : safeTarget.combinations[0] || "A00";

  return {
    targetProgram: safeTarget,
    combination: primaryCombo,
    currentCompositeScore: currentScore,
    cutoff2024,
    gapVs2024,
    cutoff2021,
    cutoff2022,
    cutoff2023,
    yearsOfData,
    p10,
    p50,
    p90,
    gapVsP50,
    gapVsP10,
    gapVsP90,
    admitProbability: Number(admitProb.toFixed(3)),
    admitProbabilityPct,
    gapStatus,
    statusLabelVi,
    statusBadge,
    historicalTrend: base.historicalTrend,
    historicalTrendVi,
    historicalChartData,
    adviceVi,
    safetyBufferVi,
  };
}
