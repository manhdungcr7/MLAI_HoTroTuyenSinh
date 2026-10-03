/**
 * FEATURE GAP-ANALYSIS: KHOẢNG CÁCH TỚI NGÀNH MỤC TIÊU
 * Điểm của học sinh tính theo đúng phương thức của ngưỡng điểm mục tiêu (thi THPT / học bạ).
 * Lịch sử điểm chuẩn chỉ gồm các năm có thật trong đề án — không nội suy năm thiếu.
 */

import { TargetProgram, StudentProfile, GapMetric } from "@/engine/types";
import { calculateAdmitProbability, sigmaScaleFor } from "@/engine/admissions/probability";
import { scoreForProgram } from "@/engine/scoring/method-score";

function realCutoffs(target: TargetProgram): { year: string; score: number }[] {
  const fromRecord = (target as TargetProgram & { cutoffs?: Record<string, number> }).cutoffs;
  const entries: [string, number | null | undefined][] = fromRecord
    ? Object.entries(fromRecord)
    : [["2021", target.cutoff2021], ["2022", target.cutoff2022], ["2023", target.cutoff2023], ["2024", target.cutoff2024]];
  return entries
    .filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0)
    .map(([year, score]) => ({ year, score }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

export function runGapAnalysis(target: TargetProgram, profile: StudentProfile): GapMetric {
  const ms = scoreForProgram(profile, target);
  const compositeScore = ms?.score ?? 0;
  const history = realCutoffs(target);
  const latest = history.length ? history[history.length - 1].score : null;

  // Không có dự báo và không có năm nào → không bịa mức tham chiếu; giữ 0 để giao diện báo thiếu dữ liệu.
  const p50 = target.forecastP50 || latest || 0;
  const rawGap = Number((compositeScore - p50).toFixed(2));
  const sigmaScale = sigmaScaleFor(history.length ? Number(history[history.length - 1].year) : undefined, history.length);
  const admitProb = compositeScore > 0 && p50 > 0 ? calculateAdmitProbability(compositeScore, p50, 1.0, undefined, undefined, sigmaScale) : 0;

  let gapStatus: "thach_thuc" | "vua_tam" | "an_toan";
  let statusLabelVi: string;
  let statusColor: string;
  if (admitProb >= 0.80) {
    gapStatus = "an_toan";
    statusLabelVi = "An toàn";
    statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (admitProb >= 0.40) {
    gapStatus = "vua_tam";
    statusLabelVi = "Phù hợp";
    statusColor = "text-blue-700 bg-blue-50 border-blue-200";
  } else {
    gapStatus = "thach_thuc";
    statusLabelVi = "Thử sức";
    statusColor = "text-rose-700 bg-rose-50 border-rose-200";
  }

  // Xu hướng: chỉ so hai năm liền kề gần nhất có thật.
  let historicalTrend: "tang_nhiet" | "on_dinh" | "ha_nhiet" = "on_dinh";
  if (history.length >= 2) {
    const a = history[history.length - 2];
    const b = history[history.length - 1];
    if (Number(b.year) - Number(a.year) === 1) {
      const delta = b.score - a.score;
      if (delta >= 0.35) historicalTrend = "tang_nhiet";
      else if (delta <= -0.35) historicalTrend = "ha_nhiet";
    }
  }

  return {
    targetProgram: target,
    currentCompositeScore: Number(compositeScore.toFixed(2)),
    rawGap,
    admitProbability: admitProb,
    gapStatus,
    statusLabelVi,
    statusColor,
    historicalTrend,
    yearlyDeltas: history,
    p10: target.forecastP10 || (p50 ? Math.max(12, Number((p50 - 1.5).toFixed(2))) : 0),
    p50,
    p90: target.forecastP90 || (p50 ? Math.min(30, Number((p50 + 1.5).toFixed(2))) : 0),
  };
}
