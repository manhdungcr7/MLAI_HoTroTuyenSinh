/**
 * DOMAIN DECISION: THUẬT TOÁN TỐI ƯU DANH MỤC 15 NGUYỆN VỌNG & SAFETY GUARDRAILS
 * Đảm bảo: File < 350 lines, Zero React dependencies, Unit-testable.
 */

import {
  StudentProfile,
  TargetProgram,
  CandidateOption,
  WishlistItem,
  Role,
} from "@/engine/types";
import {
  calculateAdmitProbability,
  calculatePortfolioFailAll,
  NATIONAL_SHOCK_STD,
  IDIO_STD,
  classifyRole,
} from "@/engine/admissions/probability";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { PortfolioValidationResult } from "@/engine/decision/types";
import { calculateRawExamCombinationScore } from "@/engine/scoring/composite";
import { computeLocationUtility } from "@/engine/geo/distance";

/**
 * Xây dựng danh sách ứng viên (Candidate Options) từ dữ liệu các trường và điểm thí sinh
 */
export function buildCandidateOptions(
  programs: TargetProgram[],
  profile: StudentProfile,
  maxBudgetVnd?: number
): CandidateOption[] {
  const budget = maxBudgetVnd ?? profile.annualBudgetVnd;
  const excludedSchools = new Set((profile.excludedSchoolCodes ?? []).map((code) => code.trim().toUpperCase()));
  const excludedGroups = new Set((profile.excludedMajorGroups ?? []).map((group) => group.trim().toLowerCase()));

  // Tính trung vị nhóm ngành động (Bayes Prior) làm chốt chặn cho các chương trình n=0 năm lịch sử
  const groupScores: Record<string, number[]> = {};
  for (const prog of programs) {
    if (prog.forecastP50 && prog.forecastP50 >= 10 && prog.majorGroup) {
      const grp = prog.majorGroup.trim().toLowerCase();
      if (!groupScores[grp]) groupScores[grp] = [];
      groupScores[grp].push(prog.forecastP50);
    }
  }
  const groupMedians: Record<string, number> = {};
  for (const [grp, scores] of Object.entries(groupScores)) {
    scores.sort((a, b) => a - b);
    groupMedians[grp] = scores[Math.floor(scores.length / 2)];
  }

  return programs
    .filter((p) =>
      !excludedSchools.has(p.schoolCode.trim().toUpperCase()) &&
      !excludedGroups.has(p.majorGroup.trim().toLowerCase()) &&
      !(budget > 0 && p.tuitionVnd != null && p.tuitionVnd > budget) &&
      Array.isArray(p.combinations) && p.combinations.length > 0
    )
    .map((p) => {
      let bestCombo: string | undefined;
      let bestScore = 0;

      for (const c of p.combinations) {
        const rawExamTotal = calculateRawExamCombinationScore(profile.examScores, c);
        if (profile.graduationYear != null && profile.graduationYear >= 2026 &&
          profile.minimumScoreException !== true && (rawExamTotal === null || rawExamTotal < 15)) continue;
        const s = calculateCompositeScore(profile.examScores, profile.altScores, profile.priority, c);
        if (s > bestScore) {
          bestScore = s;
          bestCombo = c;
        }
      }

      if (!bestCombo || bestScore <= 0) return null;

      const yearsOfData = (p as TargetProgram & { yearsOfData?: number }).yearsOfData ?? countCutoffYears(p);

      // Chốt chặn cho n=0 năm lịch sử hoặc forecastP50 khuyết/phi lý
      let p50 = p.forecastP50;
      let p10 = p.forecastP10;
      let p90 = p.forecastP90;

      const grpKey = (p.majorGroup || "").trim().toLowerCase();
      const fallbackMedian = groupMedians[grpKey] || 21.0;

      if (!p50 || p50 < 10 || isNaN(p50)) {
        p50 = fallbackMedian;
        p10 = Math.max(12, Number((p50 - 2.5 * 1.6).toFixed(2)));
        p90 = Math.min(30, Number((p50 + 2.5 * 1.6).toFixed(2)));
      } else if (yearsOfData === 0) {
        // Có P50 sơ bộ nhưng n=0 năm lịch sử: mở rộng dải bất định x1.6 để phản ánh rủi ro
        const halfSpan = Math.max(1.0, ((p90 ?? p50 + 1.5) - (p10 ?? p50 - 1.5)) / 2);
        p10 = Math.max(12, Number((p50 - halfSpan * 1.6).toFixed(2)));
        p90 = Math.min(30, Number((p50 + halfSpan * 1.6).toFixed(2)));
      }

      const admitProb = calculateAdmitProbability(bestScore, p50);
      const gap = Number((bestScore - p50).toFixed(2));

      const role: Role = classifyRole(admitProb);
      const gapText = gap >= 0 ? `cao hơn ${gap}đ` : `thấp hơn ${Math.abs(gap)}đ`;

      // 1. Dòng 1: Năng lực & Dải phân vị điểm chuẩn thật
      let line1 = `Năng lực: Điểm xét tuyển ${bestScore.toFixed(2)}đ (${gap >= 0 ? "+" + gap : gap}đ so với P50 ${p50}đ), xác suất đỗ ước tính ${(admitProb * 100).toFixed(0)}% trong dải bất định [${p10} - ${p90}]đ.`;
      if (yearsOfData === 0) {
        line1 += ` (Lưu ý: Chương trình mới n=0 năm dữ liệu, P50 neo theo trung vị nhóm ngành kèm dải bất định mở rộng x1.6).`;
      }

      // 2. Dòng 2: Học phí & Vị trí địa lý thực chứng
      const tuitionMvnd = p.tuitionVnd ? `${(p.tuitionVnd / 1_000_000).toFixed(0)} tr/năm` : "Theo quy chế chung";
      const budgetPct = (p.tuitionVnd && profile.annualBudgetVnd > 0) ? ` (${Math.round((p.tuitionVnd / profile.annualBudgetVnd) * 100)}% ngân sách)` : "";
      const locText = p.province || "Cả nước";
      const line2 = `Điều kiện: Học phí ${tuitionMvnd}${budgetPct}, tại ${locText}${p.employmentRate ? `, tỷ lệ có việc làm ${p.employmentRate}%` : ""}.`;

      // 3. Dòng 3: Vai trò chiến lược danh mục & Rủi ro
      let line3 = "";
      if (role === "an_toan") {
        line3 = "Chiến lược: Nguyện vọng An toàn chốt chặn, bảo hiểm danh mục giảm nguy cơ trượt trắng.";
      } else if (role === "vua_tam") {
        line3 = "Chiến lược: Nguyện vọng Vừa tầm trọng tâm, xác suất cân bằng lý tưởng theo kỳ vọng.";
      } else {
        line3 = "Chiến lược: Nguyện vọng Thử sức nâng tầm, ưu tiên đặt NV1-NV3 để thử vận may mà không rủi ro.";
      }

      if ((p as TargetProgram & { combinationsVerified?: boolean }).combinationsVerified === false) {
        line3 += " (Lưu ý: Cần kiểm tra đề án chính thức của trường về tổ hợp xét tuyển).";
      }

      const whyThisOptionVi = `${line1}\n${line2}\n${line3}`;

      return {
        programId: p.programId,
        schoolCode: p.schoolCode,
        schoolName: p.schoolName,
        majorName: p.majorName,
        majorGroup: p.majorGroup,
        combination: bestCombo,
        cutoffP50: p50,
        cutoffP10: p10,
        cutoffP90: p90,
        yearsOfData,
        combinationsVerified: (p as TargetProgram & { combinationsVerified?: boolean }).combinationsVerified ?? true,
        userScore: Number(bestScore.toFixed(2)),
        gap,
        admitProbability: Number(admitProb.toFixed(3)),
        tuitionVnd: p.tuitionVnd,
        employmentRate: p.employmentRate,
        aiExposure: p.aiExposure,
        role,
        whyThisOptionVi,
        dataPassportUrl: p.dataPassport,
        region: p.region || (["QSB", "QSC", "KSA", "UEH"].includes(p.schoolCode) ? "nam" : ["DDK", "DUT"].includes(p.schoolCode) ? "trung" : "bac"),
        province: p.province || (["QSB", "QSC", "KSA", "UEH"].includes(p.schoolCode) ? "TP.HCM" : ["DDK", "DUT"].includes(p.schoolCode) ? "Đà Nẵng" : "Hà Nội"),
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .filter((candidate, index, all) => all.findIndex((item) => item.programId === candidate.programId) === index);
}

function countCutoffYears(p: TargetProgram): number {
  return [p.cutoff2021, p.cutoff2022, p.cutoff2023, p.cutoff2024].filter((v) => typeof v === "number" && v > 0).length;
}

// Trọng số utility dùng chung. Tiêu chí thiếu dữ liệu (null) bị loại và trọng số được chuẩn hóa lại,
// thay vì điền giá trị giả.
export const UTILITY_WEIGHTS = { fit: 0.35, cost: 0.2, location: 0.15, career: 0.15, capability: 0.15 } as const;

export function computeUtilityBreakdown(c: CandidateOption, target: TargetProgram) {
  const uncertainFields: string[] = [];
  if (c.tuitionVnd === null || c.tuitionVnd === undefined) uncertainFields.push("cost");
  if (c.employmentRate === null || c.employmentRate === undefined) uncertainFields.push("career");

  const parts: Record<keyof typeof UTILITY_WEIGHTS, number | null> = {
    fit: c.majorGroup === target.majorGroup ? 0.95 : 0.8,
    cost: c.tuitionVnd ? Math.max(0.3, 1.0 - c.tuitionVnd / 80_000_000) : null,
    location: computeLocationUtility(target.province || "TP.HCM", c.province || "TP.HCM"),
    career: c.employmentRate !== null && c.employmentRate !== undefined ? c.employmentRate / 100 : null,
    capability: c.admitProbability,
  };

  let weighted = 0;
  let weightSum = 0;
  for (const key of Object.keys(UTILITY_WEIGHTS) as (keyof typeof UTILITY_WEIGHTS)[]) {
    const v = parts[key];
    if (v === null) continue;
    weighted += v * UTILITY_WEIGHTS[key];
    weightSum += UTILITY_WEIGHTS[key];
  }

  const round2 = (n: number) => Number(n.toFixed(2));
  const baseUtility = round2(weightSum > 0 ? weighted / weightSum : 0);

  // Tính cận trên và cận dưới của Utility khi có dữ liệu khuyết (Uncertainty Bounds)
  let minWeighted = 0;
  let maxWeighted = 0;
  let fullWeightSum = 0;

  for (const key of Object.keys(UTILITY_WEIGHTS) as (keyof typeof UTILITY_WEIGHTS)[]) {
    const w = UTILITY_WEIGHTS[key];
    fullWeightSum += w;
    if (parts[key] !== null) {
      minWeighted += (parts[key] as number) * w;
      maxWeighted += (parts[key] as number) * w;
    } else {
      // Trường hợp xấu nhất / tốt nhất cho các tiêu chí khuyết
      if (key === "cost") {
        minWeighted += 0.3 * w; // Học phí tư thục đắt đỏ
        maxWeighted += 1.0 * w; // Học phí công lập trợ cấp
      } else if (key === "career") {
        minWeighted += 0.65 * w; // Tỷ lệ việc làm tối thiểu
        maxWeighted += 0.95 * w; // Tỷ lệ việc làm hàng đầu
      }
    }
  }

  const minUtility = round2(minWeighted / fullWeightSum);
  const maxUtility = round2(maxWeighted / fullWeightSum);

  return {
    utility: baseUtility,
    uncertaintyBounds: {
      minUtility,
      maxUtility,
      hasUncertainData: uncertainFields.length > 0,
      uncertainFields,
    },
    parts: {
      fit: round2(parts.fit ?? 0),
      cost: parts.cost === null ? null : round2(parts.cost),
      location: round2(parts.location ?? 0),
      career: parts.career === null ? null : round2(parts.career),
      capability: round2(parts.capability ?? 0),
    },
  };
}

/**
 * Xây dựng danh mục 15 nguyện vọng theo 3 nhóm (Thử sức, Phù hợp, An toàn).
 * Trong mỗi nhóm, lựa chọn được xếp theo utility (mức phù hợp với sở thích, chi phí, vị trí),
 * không chỉ theo xác suất đỗ — để thay đổi ưu tiên của học sinh thực sự thay đổi kết quả.
 */
export function buildOptimizedPortfolio(
  candidates: CandidateOption[],
  target: TargetProgram,
  ambitionLevel = 0.5,
  riskTolerance = 0.05
): { wishlist: WishlistItem[]; pFailAll: number } {
  ambitionLevel = Math.min(1, Math.max(0, Number.isFinite(ambitionLevel) ? ambitionLevel : 0.5));
  const utilityOf = new Map(candidates.map((c) => [c.programId, computeUtilityBreakdown(c, target).utility]));
  const byUtility = (a: CandidateOption, b: CandidateOption) =>
    (utilityOf.get(b.programId) ?? 0) - (utilityOf.get(a.programId) ?? 0) || b.admitProbability - a.admitProbability;
  const reach = candidates.filter((c) => c.role === "mao_hiem").sort(byUtility);
  const targetPool = candidates.filter((c) => c.role === "vua_tam").sort(byUtility);
  const safety = candidates.filter((c) => c.role === "an_toan").sort(byUtility);

  const nReach = Math.min(reach.length, Math.max(2, Math.round(15 * (0.15 + ambitionLevel * 0.20))));
  const nSafety = Math.min(safety.length, Math.max(3, Math.round(15 * (0.50 - ambitionLevel * 0.30))));
  const nTarget = 15 - nReach - nSafety;

  let selectedPool = [
    ...reach.slice(0, nReach),
    ...targetPool.slice(0, nTarget),
    ...safety.slice(0, nSafety),
  ];

  if (selectedPool.length < 15) {
    const selectedIds = new Set(selectedPool.map((s) => s.programId));
    for (const c of candidates) {
      if (!selectedIds.has(c.programId)) {
        selectedPool.push(c);
        selectedIds.add(c.programId);
        if (selectedPool.length === 15) break;
      }
    }
  }

  // Theo quy chế tuyển sinh 2026, nguyện vọng đào tạo giáo viên chỉ được xét
  // khi nằm trong 5 vị trí đầu. Giữ tối đa 5 lựa chọn sư phạm và đặt trước.
  const selectedTeachers = selectedPool.filter((candidate) => candidate.majorGroup === "su_pham").slice(0, 5);
  const selectedNonTeachers = selectedPool.filter((candidate) => candidate.majorGroup !== "su_pham");
  selectedPool = [...selectedTeachers, ...selectedNonTeachers].slice(0, 15);

  // Chiến lược (không phải quy chế): xếp Thử sức → Phù hợp → An toàn. Theo cơ chế lọc ảo, thí sinh chỉ
  // trúng tuyển nguyện vọng cao nhất đủ điểm, nên đặt lựa chọn mong muốn nhất lên trước.
  // Nguyện vọng mục tiêu được ưu tiên lên đầu nhóm của nó.
  const reachGroup = selectedPool.filter((c) => c.role === "mao_hiem" && c.majorGroup !== "su_pham");
  const targetGroup = selectedPool.filter((c) => c.role === "vua_tam" && c.majorGroup !== "su_pham");
  const safetyGroup = selectedPool.filter((c) => c.role === "an_toan" && c.majorGroup !== "su_pham");

  const promoteInGroup = (group: CandidateOption[]) => {
    const idx = group.findIndex((c) => c.programId === target.programId);
    if (idx > 0) {
      const [item] = group.splice(idx, 1);
      group.unshift(item);
    }
    return group;
  };

  const teacherGroup = [...selectedTeachers];
  const targetTeacherIndex = teacherGroup.findIndex((candidate) => candidate.programId === target.programId);
  if (targetTeacherIndex > 0) teacherGroup.unshift(teacherGroup.splice(targetTeacherIndex, 1)[0]);
  const orderedPool = [
    ...teacherGroup,
    ...promoteInGroup(reachGroup),
    ...promoteInGroup(targetGroup),
    ...promoteInGroup(safetyGroup),
  ];

  const wishlist: WishlistItem[] = orderedPool.slice(0, 15).map((c, idx) => {
    const breakdown = computeUtilityBreakdown(c, target);
    const nYears = c.yearsOfData ?? 0;
    return {
      rank: idx + 1,
      school_code: c.schoolCode,
      school_name: c.schoolName,
      major_label: c.majorName,
      major_group: c.majorGroup,
      combinations_seen: c.combination,
      role: c.role,
      admit_prob: c.admitProbability,
      forecast_p50: c.cutoffP50,
      forecast_p10: c.cutoffP10 ?? c.cutoffP50 - 1.28 * NATIONAL_SHOCK_STD,
      forecast_p90: c.cutoffP90 ?? c.cutoffP50 + 1.28 * NATIONAL_SHOCK_STD,
      n_years: nYears,
      data_quality: nYears >= 3 ? "day_du" : nYears === 1 ? "chi_1_nam" : "thieu_mot_phan",
      user_score: c.userScore,
      tuition_vnd: c.tuitionVnd,
      employment_rate: c.employmentRate,
      data_passport_url: c.dataPassportUrl,
      why_option_vi: c.whyThisOptionVi,
      utility: breakdown.utility,
      util_breakdown: breakdown.parts,
      util_meta: {
        total_cost_per_year_vnd: c.tuitionVnd
          ? c.tuitionVnd + (c.province && ["Hà Nội", "TP.HCM"].includes(c.province) ? 45_000_000 : 30_000_000)
          : 0,
        tuition_estimated: !c.tuitionVnd,
      },
    };
  });

  const pFailAll = calculateWishlistFailAll(wishlist);
  return { wishlist, pFailAll };
}

/**
 * Tính toán P(Fail All) qua 15 điểm nút Gauss-Hermite cho bất kỳ danh mục nào
 */
export function calculateWishlistFailAll(
  items: WishlistItem[],
  shockStd = NATIONAL_SHOCK_STD,
  idioStd = IDIO_STD
): number {
  if (!items || items.length === 0) return 1.0;
  return calculatePortfolioFailAll(
    items.map((w) => {
      let uScore = w.user_score;
      if (uScore === undefined || uScore === null) {
        uScore = w.forecast_p50
          ? w.forecast_p50 + (w.admit_prob > 0.5 ? 0.8 : -0.8)
          : 22.0;
      }
      return {
        userScore: uScore,
        forecastP50: w.forecast_p50 ?? 22.0,
      };
    }),
    shockStd,
    idioStd
  );
}

/**
 * Kiểm định an toàn danh mục nguyện vọng (Safety Guardrails)
 */
export function validatePortfolio(
  wishlist: WishlistItem[],
  annualBudgetVnd: number = 45000000,
  riskTolerance: number = 0.05
): PortfolioValidationResult {
  const reach = wishlist.filter((w) => (w.role ? w.role === "mao_hiem" : classifyRole(w.admit_prob) === "mao_hiem"));
  const target = wishlist.filter((w) => (w.role ? w.role === "vua_tam" : classifyRole(w.admit_prob) === "vua_tam"));
  const safety = wishlist.filter((w) => (w.role ? w.role === "an_toan" : classifyRole(w.admit_prob) === "an_toan"));
  const pFailAll = calculateWishlistFailAll(wishlist);
  const pFailAllPct = Number((pFailAll * 100).toFixed(2));

  const warnings: PortfolioValidationResult["warnings"] = [];

  // 1. Cảnh báo đỏ: Không có bảo hiểm an toàn (Zero Safety) hoặc thiếu an toàn
  if (wishlist.length > 0 && safety.length === 0 && (target.length === 0 || wishlist.every((w) => w.admit_prob < 0.40))) {
    warnings.push({
      level: "red",
      code: "ZERO_SAFETY_WARNING",
      title: "CẢNH BÁO ĐỎ CẤP BÁCH: DANH MỤC HOÀN TOÀN KHÔNG CÓ BẢO HIỂM AN TOÀN!",
      message: `100% nguyện vọng trong danh mục đều thuộc diện 'Thử sức' (xác suất đỗ < 40%). Rủi ro trượt tất cả là ${pFailAllPct}%. Bạn cần bổ sung khẩn cấp ít nhất 3-5 nguyện vọng an toàn (có điểm chuẩn P50 thấp hơn điểm xét tuyển ≥ 1.5 - 2.0 điểm).`,
      actionType: "auto_balance",
      actionText: "Bổ Sung Nguyện Vọng An Toàn Ngay",
    });
  } else if (safety.length < 2 || pFailAll > riskTolerance) {
    warnings.push({
      level: "red",
      code: "CRITICAL_SAFETY_DEFICIT",
      title: "CẢNH BÁO ĐỎ: NGUY CƠ CHƯA TRÚNG NGUYỆN VỌNG NÀO QUÁ CAO!",
      message: `Danh mục hiện tại có nguy cơ chưa trúng nguyện vọng nào lên tới ${pFailAllPct}% (vượt ngưỡng cho phép ${riskTolerance * 100}%). Bạn đang thiếu nguyện vọng bảo hiểm an toàn (hiện có ${safety.length}/15 NV an toàn, khuyến nghị tối thiểu 3-5 NV).`,
      actionType: "auto_balance",
      actionText: "Tự Động Cân Bằng Tỷ Lệ Vàng (1-Click)",
    });
  }

  // 2. Cảnh báo vàng: Sắp xếp ngược thứ tự rủi ro
  const orderViolations: PortfolioValidationResult["orderViolations"] = [];
  for (let i = 0; i < wishlist.length; i++) {
    for (let j = i + 1; j < wishlist.length; j++) {
      const wishI = wishlist[i];
      const wishJ = wishlist[j];
      if (wishI.admit_prob >= 0.80 && wishJ.admit_prob < 0.50) {
        orderViolations.push({
          higherRank: wishI.rank,
          higherSchool: wishI.school_code,
          higherMajor: wishI.major_label,
          higherProb: wishI.admit_prob,
          lowerRank: wishJ.rank,
          lowerSchool: wishJ.school_code,
          lowerMajor: wishJ.major_label,
          lowerProb: wishJ.admit_prob,
        });
        break;
      }
    }
  }

  if (orderViolations.length > 0) {
    const first = orderViolations[0];
    warnings.push({
      level: "yellow",
      code: "SUBOPTIMAL_RISK_ORDER",
      title: "CẢNH BÁO QUY CHẾ: SẮP XẾP NGƯỢC THỨ TỰ RỦI RO!",
      message: `Bạn đang đặt NV an toàn (NV ${first.higherRank}: ${first.higherSchool} - ${first.higherMajor}, P đỗ ${(first.higherProb * 100).toFixed(0)}%) lên trước NV mơ ước (NV ${first.lowerRank}: ${first.lowerSchool} - ${first.lowerMajor}, P đỗ ${(first.lowerProb * 100).toFixed(0)}%). Theo quy chế Bộ GD&ĐT, nếu đỗ NV ${first.higherRank}, hệ thống sẽ TỰ ĐỘNG HỦY TOÀN BỘ các nguyện vọng phía sau!`,
      actionType: "reorder_risk",
      actionText: "Sắp Xếp Lại Chuẩn Quy Chế",
    });
  }

  // 3. Cảnh báo cam: Vượt trần ngân sách
  const budgetViolations: PortfolioValidationResult["budgetViolations"] = [];
  for (const w of wishlist) {
    const tuition = w.tuition_vnd ?? (w.util_meta?.total_cost_per_year_vnd ? w.util_meta.total_cost_per_year_vnd - 35000000 : 0);
    if (tuition > annualBudgetVnd * 1.15) {
      budgetViolations.push({
        rank: w.rank,
        schoolCode: w.school_code,
        majorLabel: w.major_label,
        tuitionVnd: tuition,
      });
    }
  }

  if (budgetViolations.length > 0) {
    const first = budgetViolations[0];
    warnings.push({
      level: "orange",
      code: "BUDGET_EXCEEDED",
      title: "CẢNH BÁO CHI PHÍ: VƯỢT NGÂN SÁCH DỰ KIẾN",
      message: `Có ${budgetViolations.length} nguyện vọng có học phí vượt trần ${(annualBudgetVnd / 1e6).toFixed(0)} triệu/năm (VD: NV ${first.rank}: ${first.schoolCode} - ${(first.tuitionVnd / 1e6).toFixed(0)}tr/năm).`,
      actionType: "none",
    });
  }

  // 4. TT06/2026 Cảnh báo đỏ: Ngành đào tạo giáo viên / Sư phạm chỉ được xét từ NV 1 đến NV 5
  const teacherRankViolations = wishlist.filter((w) => {
    const isTeacher = w.major_group === "su_pham" || /sư phạm|giáo dục/i.test(w.major_label);
    return isTeacher && w.rank > 5;
  });
  if (teacherRankViolations.length > 0) {
    warnings.push({
      level: "red",
      code: "TT06_TEACHER_RANK_VIOLATION",
      title: "VI PHẠM QUY CHẾ TT06/2026: NGÀNH SƯ PHẠM ĐẶT NGOÀI TOP 5!",
      message: `Theo Thông tư 06/2026/TT-BGDĐT, các ngành sư phạm/đào tạo giáo viên chỉ được đăng ký xét tuyển từ NV 1 đến NV 5. Bạn đang đặt nguyện vọng sư phạm ở NV ${teacherRankViolations.map((t) => t.rank).join(", ")}. Các nguyện vọng này sẽ bị hệ thống tuyển sinh tự động loại bỏ!`,
      actionType: "reorder_risk",
      actionText: "Chuyển Sư Phạm Lên NV 1-5",
    });
  }

  // 5. TT06/2026 Cảnh báo đỏ: Điểm sàn đại học tối thiểu 15.0/30.0
  const floorViolations = wishlist.filter((w) => typeof w.user_score === "number" && w.user_score > 0 && w.user_score < 15.0);
  if (floorViolations.length > 0) {
    warnings.push({
      level: "red",
      code: "TT06_FLOOR_SCORE_VIOLATION",
      title: "VI PHẠM ĐIỂM SÀN ĐẠI HỌC (TT06/2026)",
      message: `Điểm xét tuyển đạt ${(floorViolations[0]?.user_score ?? 0).toFixed(2)}, dưới mức sàn tối thiểu 15.0/30.0 theo quy chế tuyển sinh của Bộ GD&ĐT. Thí sinh không đủ điều kiện xét tuyển vào các chương trình đại học này.`,
      actionType: "none",
    });
  }

  return {
    isValid: warnings.filter((w) => w.level === "red").length === 0 && orderViolations.length === 0,
    pFailAll,
    pFailAllPct,
    reachCount: reach.length,
    targetCount: target.length,
    safetyCount: safety.length,
    totalCount: wishlist.length,
    isOrderOptimal: orderViolations.length === 0,
    orderViolations,
    budgetViolations,
    warnings,
  };
}
