/**
 * Xác suất đỗ của học sinh cho từng ngành (phương thức tốt nhất) và rủi ro của cả danh sách nguyện vọng.
 */

import { CandidateOption, Role, StudentProfile, TargetProgram, WishlistItem } from "@/engine/types";
import {
  calculateAdmitProbability,
  calculatePortfolioFailAll,
  classifyRole,
  sigmaScaleFor,
} from "@/engine/admissions/probability";
import { scoreOptionsForProgram } from "@/engine/scoring/method-score";
import { comboAcceptancePrior } from "@/engine/decision/combo-prior";
import { isAptitudeCombination } from "@/data/universities/combinations";

const round2 = (n: number) => Number(n.toFixed(2));

/** Trung vị điểm chuẩn dự kiến theo nhóm ngành: mức tham chiếu khi một chương trình chưa có dự báo. */
function groupMedians(programs: TargetProgram[]): Record<string, number> {
  const scores: Record<string, number[]> = {};
  for (const p of programs) {
    if (p.forecastP50 && p.forecastP50 >= 10 && p.majorGroup) {
      (scores[p.majorGroup.trim().toLowerCase()] ??= []).push(p.forecastP50);
    }
  }
  const medians: Record<string, number> = {};
  for (const [group, list] of Object.entries(scores)) {
    list.sort((a, b) => a - b);
    medians[group] = list[Math.floor(list.length / 2)];
  }
  return medians;
}

function countCutoffYears(p: TargetProgram): number {
  const cutoffs = (p as TargetProgram & { cutoffs?: Record<string, number> }).cutoffs;
  if (cutoffs) return Object.keys(cutoffs).length;
  return [p.cutoff2021, p.cutoff2022, p.cutoff2023, p.cutoff2024].filter((v) => typeof v === "number" && v > 0).length;
}

/**
 * Với mỗi chương trình học sinh tính được điểm: xác suất đỗ, nhóm khả năng và các cờ cần kiểm tra.
 * Một ngành chỉ đăng ký một nguyện vọng nên khi ngành có nhiều phương thức, giữ phương thức cho xác suất cao nhất.
 */
export function buildCandidateOptions(programs: TargetProgram[], profile: StudentProfile): CandidateOption[] {
  const budget = profile.annualBudgetVnd;
  const excludedSchools = new Set((profile.excludedSchoolCodes ?? []).map((code) => code.trim().toUpperCase()));
  const excludedGroups = new Set((profile.excludedMajorGroups ?? []).map((group) => group.trim().toLowerCase()));
  const medians = groupMedians(programs);
  const acceptance = comboAcceptancePrior(programs);

  const candidates: CandidateOption[] = [];
  for (const p of programs) {
    if (excludedSchools.has(p.schoolCode.trim().toUpperCase())) continue;
    if (excludedGroups.has(p.majorGroup.trim().toLowerCase())) continue;
    if (budget > 0 && p.tuitionVnd != null && p.tuitionVnd > budget) continue;

    const options = scoreOptionsForProgram(profile, p).filter((o) => o.score > 0);
    if (options.length === 0) continue;

    const yearsOfData = (p as TargetProgram & { yearsOfData?: number }).yearsOfData ?? countCutoffYears(p);
    let p50 = p.forecastP50;
    let p10 = p.forecastP10;
    let p90 = p.forecastP90;
    const fallbackMedian = medians[(p.majorGroup || "").trim().toLowerCase()] || 21.0;

    if (!p50 || p50 < 10 || Number.isNaN(p50)) {
      // Chưa có dự báo: lấy trung vị nhóm ngành và mở rộng dải bất định.
      p50 = fallbackMedian;
      p10 = Math.max(12, round2(p50 - 2.5 * 1.6));
      p90 = Math.min(30, round2(p50 + 2.5 * 1.6));
    } else if (yearsOfData === 0) {
      const halfSpan = Math.max(1.0, ((p90 ?? p50 + 1.5) - (p10 ?? p50 - 1.5)) / 2);
      p10 = Math.max(12, round2(p50 - halfSpan * 1.6));
      p90 = Math.min(30, round2(p50 + halfSpan * 1.6));
    }

    const sigmaScale = sigmaScaleFor((p as TargetProgram & { latestYear?: number }).latestYear, yearsOfData);
    // Chương trình chưa rõ tổ hợp: nhân xác suất đỗ với xác suất trường nhận tổ hợp đó, chọn tổ hợp cho kết quả tốt nhất.
    let ms = options[0];
    let prob = -1;
    let comboAcceptance: number | undefined;
    for (const option of options) {
      const accept = option.comboUnverified ? acceptance(p.majorGroup, option.combo) : 1;
      const value = accept * calculateAdmitProbability(option.score, p50, 1.0, undefined, undefined, sigmaScale);
      if (value > prob) {
        prob = value;
        ms = option;
        comboAcceptance = option.comboUnverified ? accept : undefined;
      }
    }
    const role: Role = classifyRole(prob);
    candidates.push({
      programId: p.programId,
      schoolCode: p.schoolCode,
      schoolName: p.schoolName,
      majorName: p.majorName,
      majorGroup: p.majorGroup,
      combination: ms.combo,
      cutoffP50: p50,
      cutoffP10: p10,
      cutoffP90: p90,
      yearsOfData,
      combinationsVerified: !ms.comboUnverified,
      userScore: round2(ms.score),
      gap: round2(ms.score - p50),
      admitProbability: Number(prob.toFixed(3)),
      tuitionVnd: p.tuitionVnd,
      employmentRate: p.employmentRate,
      role,
      dataPassportUrl: p.dataPassport,
      region: p.region,
      province: p.province,
      admissionMethod: ms.method,
      methodInferred: p.methodInferred,
      majorKey: p.majorKey,
      sourceTier: p.sourceTier,
      ruleOrigin: ms.ruleOrigin,
      ruleSource: ms.ruleSource?.url,
      usedIeltsConversion: ms.usedIeltsConversion,
      aptitude: isAptitudeCombination(ms.combo),
      sigmaScale,
      comboAcceptance,
    });
  }

  const bestByMajor = new Map<string, CandidateOption>();
  for (const c of candidates) {
    const key = c.majorKey || c.programId;
    const prev = bestByMajor.get(key);
    if (!prev || c.admitProbability > prev.admitProbability) bestByMajor.set(key, c);
  }
  return [...bestByMajor.values()];
}

/** Xác suất không đỗ nguyện vọng nào, tính cả cú sốc điểm chuẩn chung toàn quốc giữa các năm. */
export function calculateWishlistFailAll(items: WishlistItem[]): number {
  if (!items || items.length === 0) return 1.0;
  return calculatePortfolioFailAll(
    items.map((w) => ({
      userScore: w.user_score ?? (w.forecast_p50 ? w.forecast_p50 + (w.admit_prob > 0.5 ? 0.8 : -0.8) : 22.0),
      forecastP50: w.forecast_p50 ?? 22.0,
      sigmaScale: w.sigma_scale,
      schoolCode: w.school_code,
    })),
  );
}
