/**
 * LỚP GIẢI THÍCH QUYẾT ĐỊNH (EXPLANATION LAYER)
 *
 * Lưu ý trung thực: module này KHÔNG gọi mô hình ngôn ngữ (LLM). Mọi nội dung được sinh bằng
 * mẫu câu (template) từ các con số đã tính bởi engine deterministic (điểm tổ hợp, xác suất đỗ,
 * danh mục nguyện vọng, ROI môn học). Tên hàm `askAiAbout*` được giữ để tương thích.
 *
 * Nguyên tắc:
 * 1. Không bịa số: mọi con số trong câu đều lấy từ dữ liệu hoặc phép tính; thiếu dữ liệu → nói rõ.
 * 2. Không khẳng định chắc chắn: kết quả là ước tính, luôn nêu điều có thể làm kết quả sai.
 * 3. `confidence` = mức đầy đủ dữ liệu (hồ sơ + lịch sử điểm chuẩn), KHÔNG phải độ chính xác mô hình.
 */

import {
  StudentProfile,
  TargetProgram,
  GapMetric,
  SubjectRoiMetric,
  CandidateOption,
  StudyPlan,
  ExamScores,
  TimeDeduction,
} from "@/engine/types";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { runGapAnalysis } from "@/engine/gap/engine";
import { calculateSubjectRoiList } from "@/engine/roi/engine";
import { buildCandidateOptions, buildOptimizedPortfolio } from "@/engine/decision/optimizer";
import { NATIONAL_SHOCK_STD, SAFE_MIN_PROB, REACH_MAX_PROB } from "@/engine/admissions/probability";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";
import { formatEmploymentRate, formatProbability, formatTuitionPerYear } from "@/lib/format";

// ============================================================================
// 1. STRUCTURED OUTPUT SCHEMA
// ============================================================================

export interface AiDecisionProvenance {
  observed_data: string[];
  user_entered_data: string[];
  estimated_data: string[];
  ai_generated_analysis: string[];
}

export interface AiDecisionStructuredOutput {
  summary: string;
  key_findings: string[];
  risks: string[];
  opportunities: string[];
  recommended_actions: string[];
  /** Mức đầy đủ dữ liệu (0–1): hồ sơ học sinh + số năm có điểm chuẩn. Không phải độ chính xác. */
  confidence: number;
  data_missing: string[];
  explanation: string[];
  provenance: AiDecisionProvenance;
}

const ROLE_LABEL: Record<CandidateOption["role"], string> = {
  mao_hiem: "Thử sức",
  vua_tam: "Phù hợp",
  an_toan: "An toàn",
};

const pct = (p: number) => formatProbability(p);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;

function cutoffHistory(target: TargetProgram): { year: number; score: number }[] {
  return (
    [
      [2021, target.cutoff2021],
      [2022, target.cutoff2022],
      [2023, target.cutoff2023],
      [2024, target.cutoff2024],
    ] as const
  )
    .filter(([, v]) => typeof v === "number" && !isNaN(v as number))
    .map(([year, score]) => ({ year, score: score as number }));
}

/** Mức đầy đủ dữ liệu: 70% hồ sơ học sinh + 30% lịch sử điểm chuẩn (3 năm trở lên = đủ). */
function dataCompleteness(profileQuality: number, target: TargetProgram | null): number {
  const years = target ? cutoffHistory(target).length : 0;
  return Math.round((profileQuality * 0.7 + Math.min(1, years / 3) * 0.3) * 100) / 100;
}

// ============================================================================
// 2. VALIDATION & FEATURE EXTRACTION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
  dataQualityScore: number; // 0.0 - 1.0
}

export function getSubjectsForCombination(comb: string): (keyof ExamScores)[] {
  return (COMBINATION_SUBJECTS[comb.toUpperCase()] || []) as (keyof ExamScores)[];
}

export function validateStudentData(profile: StudentProfile, target: TargetProgram | null): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const activeComb = profile.activeCombination || "A01";
  const requiredSubjects = getSubjectsForCombination(activeComb);
  if (requiredSubjects.length === 0) missing.push(`Tổ hợp ${activeComb} chưa được hỗ trợ`);

  let enteredCount = 0;
  for (const sub of requiredSubjects) {
    const val = profile.examScores[sub];
    if (val === undefined || val === null || isNaN(Number(val))) {
      missing.push(`Thiếu điểm môn ${SUBJECT_LABELS_VI[sub] || sub} (tổ hợp ${activeComb})`);
    } else {
      enteredCount++;
      if (val < 0 || val > 10) warnings.push(`Điểm môn ${SUBJECT_LABELS_VI[sub] || sub} (${val}) nằm ngoài khoảng 0–10`);
    }
  }

  if (!target) missing.push("Chưa chọn ngành/trường mục tiêu");
  if (!profile.annualBudgetVnd || profile.annualBudgetVnd <= 0) missing.push("Chưa nhập ngân sách học phí mỗi năm");

  const totalChecks = Math.max(1, requiredSubjects.length) + 2;
  const passedChecks = enteredCount + (target ? 1 : 0) + (profile.annualBudgetVnd > 0 ? 1 : 0);
  const dataQualityScore = Math.max(0, Math.min(1, Math.round((passedChecks / totalChecks) * 100) / 100));

  return { isValid: missing.length === 0 && warnings.length === 0, missingFields: missing, warnings, dataQualityScore };
}

export interface ExtractedFeatures {
  activeCombination: string;
  compositeScore: number;
  /** null khi chưa có mục tiêu hoặc chưa đủ điểm */
  rawGap: number | null;
  isPassingMedian: boolean;
  /** ngân sách / học phí; null khi thiếu một trong hai */
  budgetAffordabilityRatio: number | null;
  historicalCutoffVolatility: number | null;
}

export function extractStudentFeatures(profile: StudentProfile, target: TargetProgram | null): ExtractedFeatures {
  const activeComb = profile.activeCombination || "A01";
  const comp = calculateCompositeScore(profile.examScores, profile.altScores, profile.priority, activeComb);
  const rawGap = target && comp > 0 ? Math.round((comp - target.forecastP50) * 100) / 100 : null;
  const tuition = target?.tuitionVnd ?? null;
  const budget = profile.annualBudgetVnd || null;
  const budgetRatio = tuition && budget ? Math.round((budget / tuition) * 100) / 100 : null;

  const history = target ? cutoffHistory(target).map((h) => h.score) : [];
  const volatility =
    history.length >= 2
      ? Math.round(
          (history.slice(1).reduce((sum, v, i) => sum + Math.abs(v - history[i]), 0) / (history.length - 1)) * 100
        ) / 100
      : null;

  return {
    activeCombination: activeComb,
    compositeScore: comp,
    rawGap,
    isPassingMedian: rawGap !== null && rawGap >= 0,
    budgetAffordabilityRatio: budgetRatio,
    historicalCutoffVolatility: volatility,
  };
}

// ============================================================================
// 3. PIPELINE TỔNG HỢP
// ============================================================================

export function runFullAiDecisionPipeline(
  profile: StudentProfile,
  target: TargetProgram | null,
  optionsPool: TargetProgram[] = DECISION_PROGRAM_POOL
): AiDecisionStructuredOutput {
  const validation = validateStudentData(profile, target);
  const features = extractStudentFeatures(profile, target);
  const confidence = dataCompleteness(validation.dataQualityScore, target);

  const recommendedActions: string[] = [];
  if (validation.missingFields.length > 0) {
    recommendedActions.push(`Bổ sung dữ liệu còn thiếu: ${validation.missingFields[0]}.`);
  }

  if (!target || features.compositeScore <= 0) {
    return {
      summary: "Chưa đủ dữ liệu để phân tích. Hãy nhập đủ điểm 3 môn của tổ hợp và chọn một ngành mục tiêu.",
      key_findings: [],
      risks: [],
      opportunities: [],
      recommended_actions: recommendedActions,
      confidence,
      data_missing: validation.missingFields,
      explanation: [],
      provenance: { observed_data: [], user_entered_data: [], estimated_data: [], ai_generated_analysis: [] },
    };
  }

  const gapAnalysis = runGapAnalysis(target, profile);
  const roi = calculateSubjectRoiList(profile, target, optionsPool);
  const candidates = buildCandidateOptions(optionsPool, profile).filter((c) => c.userScore > 0);
  const { wishlist, pFailAll } = buildOptimizedPortfolio(candidates, target, 0.5, 0.05);
  const counts = {
    reach: wishlist.filter((w) => w.role === "mao_hiem").length,
    target: wishlist.filter((w) => w.role === "vua_tam").length,
    safe: wishlist.filter((w) => w.role === "an_toan").length,
  };
  const gap = features.rawGap ?? 0;
  const topRoi = roi[0];

  if (gap < 0 && topRoi) {
    recommendedActions.push(
      `Ưu tiên ôn ${topRoi.subjectVi}: tăng 0.5 điểm môn này giúp bạn có thêm ${topRoi.unlockedOptionsCount} ngành trong tầm với.`
    );
  }
  if (counts.safe < 2) {
    recommendedActions.push("Thêm ít nhất 2 nguyện vọng An toàn để giảm rủi ro trượt hết.");
  }

  const history = cutoffHistory(target);
  return {
    summary: `Với ${features.compositeScore.toFixed(2)} điểm tổ hợp ${features.activeCombination}, bạn đang ${
      gap >= 0 ? `cao hơn ${gap.toFixed(2)}` : `thấp hơn ${Math.abs(gap).toFixed(2)}`
    } điểm so với điểm chuẩn gần nhất của ${target.majorName} (${target.schoolName}). Đây là ước tính từ dữ liệu các năm trước, không phải cam kết.`,
    key_findings: [
      `Điểm tổ hợp ${features.compositeScore.toFixed(2)} so với điểm chuẩn gần nhất ${target.forecastP50.toFixed(2)} → chênh lệch ${signed(gap)} điểm.`,
      topRoi
        ? `Môn nên ưu tiên: ${topRoi.subjectVi} (tăng 0.5 điểm → gần mục tiêu hơn ${topRoi.gapReduction.toFixed(2)} điểm).`
        : "Chưa xác định được môn nên ưu tiên (thiếu điểm môn).",
      `Danh sách gợi ý: ${counts.reach} Thử sức · ${counts.target} Phù hợp · ${counts.safe} An toàn. Khả năng không đỗ nguyện vọng nào ước tính ${(pFailAll * 100).toFixed(1)}%.`,
      `Mức đầy đủ dữ liệu: ${pct(confidence)}.`,
    ],
    risks: [
      ...(gap < -1 ? [`Bạn đang thấp hơn điểm chuẩn gần nhất ${Math.abs(gap).toFixed(2)} điểm — ngành mục tiêu hiện ở nhóm Thử sức.`] : []),
      ...(features.historicalCutoffVolatility !== null && features.historicalCutoffVolatility > 0.6
        ? [`Điểm chuẩn ngành này dao động trung bình ${features.historicalCutoffVolatility.toFixed(2)} điểm mỗi năm.`]
        : []),
      ...(history.length <= 1 ? ["Chỉ có 1 năm điểm chuẩn — ước tính kém chắc chắn."] : []),
      ...(features.budgetAffordabilityRatio !== null && features.budgetAffordabilityRatio < 1
        ? [`Học phí (${formatTuitionPerYear(target.tuitionVnd)}) cao hơn ngân sách bạn khai báo.`]
        : []),
    ],
    opportunities: topRoi
      ? [`Tăng 0.5 điểm ${topRoi.subjectVi} giúp bạn có thêm ${topRoi.unlockedOptionsCount} ngành trong tầm với.`]
      : [],
    recommended_actions: recommendedActions,
    confidence,
    data_missing: validation.missingFields,
    explanation: [
      `Điểm tổ hợp = tổng điểm 3 môn ${features.activeCombination} + điểm ưu tiên (giảm dần khi tổng từ 22.5 điểm trở lên).`,
      `Khả năng đỗ ước tính bằng cách so điểm của bạn với điểm chuẩn gần nhất, có tính đến việc đề thi mỗi năm khó dễ khác nhau (độ lệch khoảng ${NATIONAL_SHOCK_STD} điểm).`,
      `Nhóm: An toàn khi khả năng đỗ từ ${pct(SAFE_MIN_PROB)}, Thử sức khi dưới ${pct(REACH_MAX_PROB)}, còn lại là Phù hợp.`,
    ],
    provenance: {
      observed_data: [
        history.length > 0
          ? `Điểm chuẩn: ${history.map((h) => `${h.year}: ${h.score}`).join(", ")} — ${target.dataPassport}.`
          : `Chưa có lịch sử điểm chuẩn cho ${target.programId}.`,
        `Học phí: ${formatTuitionPerYear(target.tuitionVnd)}.`,
      ],
      user_entered_data: [
        `Điểm các môn bạn nhập: ${getSubjectsForCombination(features.activeCombination)
          .map((s) => `${SUBJECT_LABELS_VI[s] || s} ${profile.examScores[s] ?? "—"}`)
          .join(", ")}.`,
        `Khu vực ưu tiên: ${profile.priority.area}; đối tượng: ${profile.priority.object}.`,
      ],
      estimated_data: [
        `Khoảng điểm chuẩn thường dao động: ${target.forecastP10.toFixed(2)} – ${target.forecastP90.toFixed(2)} (điểm năm gần nhất ± biến động lịch sử; không phải mô hình dự báo).`,
        `Khả năng không đỗ nguyện vọng nào: ${(pFailAll * 100).toFixed(1)}%.`,
      ],
      ai_generated_analysis: ["Câu giải thích được tạo từ mẫu câu cố định dựa trên các con số ở trên (không dùng LLM)."],
    },
  };
}

// ============================================================================
// 4. GIẢI THÍCH THEO NGỮ CẢNH (4 MÀN HÌNH)
// ============================================================================

/** MÀN HÌNH PHÂN TÍCH — "Vì sao tôi ở vị trí này?" */
export function askAiAboutAnalysis(
  gapAnalysis: GapMetric,
  subjectRoiList: SubjectRoiMetric[],
  profile: StudentProfile,
  target: TargetProgram | null
): AiDecisionStructuredOutput {
  const effectiveTarget = target || gapAnalysis.targetProgram;
  const topRoi = subjectRoiList[0];
  const rawGap = gapAnalysis.rawGap;
  const validation = validateStudentData(profile, target);

  return {
    summary: `Bạn đang ${
      rawGap >= 0 ? `cao hơn ${rawGap.toFixed(2)}` : `thấp hơn ${Math.abs(rawGap).toFixed(2)}`
    } điểm so với điểm chuẩn gần nhất (${gapAnalysis.p50.toFixed(2)}) của ${effectiveTarget.majorName} — ${effectiveTarget.schoolName}.`,
    key_findings: [
      `Vị thế hiện tại: nhóm "${gapAnalysis.statusLabelVi}".`,
      topRoi
        ? `Môn nên ưu tiên: ${topRoi.subjectVi} — tăng 0.5 điểm giúp gần mục tiêu hơn ${topRoi.gapReduction.toFixed(2)} điểm.`
        : "Chưa đủ điểm các môn để xếp hạng môn nên ưu tiên.",
      `Điểm chuẩn thường dao động trong khoảng ${gapAnalysis.p10.toFixed(2)} – ${gapAnalysis.p90.toFixed(2)}.`,
    ],
    risks: [
      rawGap < 0
        ? `Nếu điểm thi thật giữ ở ${gapAnalysis.currentCompositeScore.toFixed(2)}, bạn khó đỗ ngành này khi điểm chuẩn không giảm.`
        : "Điểm chuẩn năm nay có thể tăng nếu đề dễ hơn hoặc nhiều thí sinh chọn ngành này.",
      `Đề thi mỗi năm khó dễ khác nhau có thể làm điểm chuẩn chung dịch chuyển khoảng ±${NATIONAL_SHOCK_STD} điểm.`,
    ],
    opportunities: topRoi
      ? [`Tăng 0.5 điểm ${topRoi.subjectVi} giúp bạn có thêm ${topRoi.unlockedOptionsCount} ngành trong tầm với.`]
      : [],
    recommended_actions: [
      ...(topRoi ? [`Dành nhiều thời gian ôn hơn cho ${topRoi.subjectVi} trong vài tuần tới.`] : []),
      "Làm một bài thi thử có bấm giờ và cập nhật điểm để xem kết quả thay đổi thế nào.",
      "Giữ ít nhất 2 nguyện vọng An toàn trong danh sách.",
    ],
    confidence: dataCompleteness(validation.dataQualityScore, target),
    data_missing: validation.missingFields,
    explanation: [
      `Chênh lệch = điểm tổ hợp của bạn (${gapAnalysis.currentCompositeScore.toFixed(2)}) − điểm chuẩn gần nhất (${gapAnalysis.p50.toFixed(2)}) = ${signed(rawGap)}.`,
      "Môn nên ưu tiên: mô phỏng tăng 0.5 điểm từng môn và đếm số ngành chuyển vào tầm với.",
    ],
    provenance: {
      observed_data: [
        `Điểm chuẩn ${effectiveTarget.schoolName}: ${
          cutoffHistory(effectiveTarget)
            .map((h) => `${h.score} (${h.year})`)
            .join(", ") || "chưa có"
        }.`,
        `Nguồn: ${effectiveTarget.dataPassport}.`,
      ],
      user_entered_data: [`Tổ hợp: ${profile.activeCombination || "A01"}.`],
      estimated_data: [`Khoảng dao động: ${gapAnalysis.p10.toFixed(2)} – ${gapAnalysis.p90.toFixed(2)}.`],
      ai_generated_analysis: ["Câu giải thích tạo từ mẫu câu (không dùng LLM)."],
    },
  };
}

/** MÀN HÌNH KHÁM PHÁ — "Vì sao lựa chọn này hợp (hoặc chưa hợp) với bạn?" */
export function askAiAboutOptionFit(
  option: CandidateOption,
  profile: StudentProfile,
  target: TargetProgram | null
): AiDecisionStructuredOutput {
  const budget = profile.annualBudgetVnd || null;
  const tuitionKnown = Boolean(option.tuitionVnd);
  const overBudget = tuitionKnown && budget ? (option.tuitionVnd as number) > budget : null;
  const missing: string[] = [];
  if (!budget) missing.push("Chưa nhập ngân sách học phí mỗi năm");
  if (!tuitionKnown) missing.push("Chưa có học phí đã xác thực của chương trình này");
  if (option.employmentRate === null) missing.push("Chưa có dữ liệu tỷ lệ việc làm");
  if ((option.yearsOfData ?? 0) <= 1) missing.push("Chỉ có 1 năm điểm chuẩn");

  const years = option.yearsOfData ?? 0;
  const completeness = Math.round(((budget ? 0.25 : 0) + (tuitionKnown ? 0.25 : 0) + Math.min(1, years / 3) * 0.5) * 100) / 100;

  return {
    summary: `${option.majorName} — ${option.schoolName} (${option.schoolCode}) thuộc nhóm "${ROLE_LABEL[option.role]}" với bạn. Khả năng đỗ ước tính ${pct(option.admitProbability)}.`,
    key_findings: [
      `Điểm của bạn ${option.userScore.toFixed(2)} (tổ hợp ${option.combination}) so với điểm chuẩn gần nhất ${option.cutoffP50.toFixed(2)} → ${signed(option.gap)} điểm.`,
      tuitionKnown
        ? `Học phí ${formatTuitionPerYear(option.tuitionVnd)}${overBudget === null ? "" : overBudget ? " — cao hơn ngân sách bạn khai báo" : " — trong ngân sách bạn khai báo"}.`
        : "Học phí: chưa có dữ liệu đã xác thực.",
      `Tỷ lệ việc làm: ${formatEmploymentRate(option.employmentRate)}.`,
      ...(target?.programId === option.programId ? ["Đây là ngành mục tiêu bạn đã chọn."] : []),
    ],
    risks: [
      option.role === "mao_hiem"
        ? "Điểm của bạn đang thấp hơn điểm chuẩn — không nên dựa vào lựa chọn này."
        : "Điểm chuẩn có thể tăng so với năm gần nhất nếu đề dễ hơn.",
      ...(overBudget ? ["Học phí vượt ngân sách gia đình."] : []),
      ...(years <= 1 ? ["Chỉ có 1 năm điểm chuẩn nên khoảng dao động chưa đáng tin."] : []),
    ],
    opportunities: [],
    recommended_actions: [
      `Nếu thêm vào danh sách, đặt ở nhóm ${ROLE_LABEL[option.role]}.`,
      `Kiểm tra đề án tuyển sinh chính thức của ${option.schoolCode} (tổ hợp, tiêu chí phụ, học phí).`,
    ],
    confidence: completeness,
    data_missing: missing,
    explanation: [
      `Nhóm được xác định theo khả năng đỗ: An toàn từ ${pct(SAFE_MIN_PROB)}, Thử sức dưới ${pct(REACH_MAX_PROB)}.`,
      "Khả năng đỗ so điểm của bạn với điểm chuẩn gần nhất, có tính đến biến động đề thi giữa các năm.",
    ],
    provenance: {
      observed_data: [
        `Điểm chuẩn gần nhất: ${option.cutoffP50.toFixed(2)}.`,
        `Nguồn: ${option.dataPassportUrl || "Chưa có trích dẫn nguồn"}.`,
      ],
      user_entered_data: [`Điểm của bạn: ${option.userScore.toFixed(2)} (tổ hợp ${option.combination}).`],
      estimated_data: [`Khả năng đỗ ước tính: ${pct(option.admitProbability)}.`],
      ai_generated_analysis: ["Câu giải thích tạo từ mẫu câu (không dùng LLM)."],
    },
  };
}

/** MÀN HÌNH MÔ PHỎNG — "Nếu điểm thay đổi thì sao?" */
export function askAiAboutScenarioImpact(
  currentScores: ExamScores,
  whatIfDelta: ExamScores,
  profile: StudentProfile,
  target: TargetProgram | null,
  optionsPool: TargetProgram[] = DECISION_PROGRAM_POOL
): AiDecisionStructuredOutput {
  const deltaEntries = Object.entries(whatIfDelta).filter(([, d]) => d !== undefined && d !== null && d !== 0);
  const combo = profile.activeCombination || "A01";
  const baselineComp = calculateCompositeScore(currentScores, profile.altScores, profile.priority, combo);

  const simulatedScores: ExamScores = { ...currentScores };
  for (const [sub, delta] of deltaEntries) {
    const base = simulatedScores[sub as keyof ExamScores];
    if (base === null || base === undefined) continue; // không mô phỏng môn chưa có điểm
    simulatedScores[sub as keyof ExamScores] = Math.min(10, Math.max(0, base + (delta || 0)));
  }
  const simulatedComp = calculateCompositeScore(simulatedScores, profile.altScores, profile.priority, combo);
  const totalGain = Math.round((simulatedComp - baselineComp) * 100) / 100;

  const oldCandidates = buildCandidateOptions(optionsPool, profile).filter((c) => c.userScore > 0);
  const newCandidates = buildCandidateOptions(optionsPool, { ...profile, examScores: simulatedScores }).filter(
    (c) => c.userScore > 0
  );
  const unlockedSafeCount = Math.max(
    0,
    newCandidates.filter((c) => c.role === "an_toan").length - oldCandidates.filter((c) => c.role === "an_toan").length
  );
  const oldTargetProb = target ? oldCandidates.find((c) => c.programId === target.programId)?.admitProbability : undefined;
  const newTargetProb = target ? newCandidates.find((c) => c.programId === target.programId)?.admitProbability : undefined;

  const missing: string[] = [];
  if (deltaEntries.length === 0) missing.push("Chưa thay đổi điểm môn nào trong kịch bản");
  if (!target) missing.push("Chưa chọn ngành mục tiêu");
  const validation = validateStudentData(profile, target);

  return {
    summary:
      deltaEntries.length === 0
        ? "Kịch bản chưa thay đổi điểm nào. Hãy kéo thanh trượt để xem tác động."
        : `Kịch bản (${deltaEntries.map(([k, d]) => `${SUBJECT_LABELS_VI[k] || k} ${d! > 0 ? "+" : ""}${d}`).join(", ")}) làm điểm tổ hợp thay đổi ${signed(totalGain)} điểm.`,
    key_findings: [
      `Điểm tổ hợp dịch chuyển: ${baselineComp.toFixed(2)} → ${simulatedComp.toFixed(2)} (${signed(totalGain)}).`,
      oldTargetProb !== undefined && newTargetProb !== undefined
        ? `Khả năng đỗ ngành mục tiêu: ${pct(oldTargetProb)} → ${pct(newTargetProb)}.`
        : "Chưa tính được khả năng đỗ ngành mục tiêu (thiếu mục tiêu hoặc điểm).",
      `Số lựa chọn chuyển vào nhóm An toàn thêm: ${unlockedSafeCount}.`,
    ],
    risks: [
      "Đây là mô phỏng: điểm thi thật có thể khác kế hoạch.",
      "Càng gần điểm 9–10, tăng thêm điểm càng tốn nhiều thời gian hơn.",
    ],
    opportunities:
      unlockedSafeCount > 0 ? [`Kịch bản này có thêm ${unlockedSafeCount} lựa chọn An toàn cho danh sách nguyện vọng.`] : [],
    recommended_actions: [
      "Dùng kịch bản này làm mục tiêu cho lần thi thử tiếp theo.",
      "Xem Kế hoạch học để chia giờ ôn phù hợp với mức tăng này.",
    ],
    confidence: dataCompleteness(validation.dataQualityScore, target),
    data_missing: missing,
    explanation: [
      "Điểm tổ hợp mới = tổng 3 môn sau khi điều chỉnh + điểm ưu tiên.",
      `Toàn bộ ${optionsPool.length} chương trình được tính lại để xem lựa chọn nào đổi nhóm.`,
    ],
    provenance: {
      observed_data: target
        ? [`Điểm chuẩn gần nhất của ${target.schoolName}: ${target.forecastP50}.`]
        : [],
      user_entered_data: [`Điểm tổ hợp hiện tại: ${baselineComp.toFixed(2)}.`],
      estimated_data: [`Điểm tổ hợp giả định: ${simulatedComp.toFixed(2)}.`],
      ai_generated_analysis: ["Câu giải thích tạo từ mẫu câu (không dùng LLM)."],
    },
  };
}

/** MÀN HÌNH KẾ HOẠCH HỌC — "Vì sao chia giờ như vậy?" */
export function askAiAboutStudyPlanOptimization(
  studyPlan: StudyPlan,
  timeDeduction: TimeDeduction,
  subjectRoiList: SubjectRoiMetric[],
  profile: StudentProfile,
  target: TargetProgram | null
): AiDecisionStructuredOutput {
  const topRoi = subjectRoiList[0];
  const { sleepHours, availableHours } = timeDeduction;
  const isSleepDeprived = sleepHours < 49; // dưới 7 giờ/ngày

  const missing: string[] = [];
  if (!target) missing.push("Chưa chọn ngành mục tiêu");
  if (studyPlan.allocations.length === 0) missing.push("Chưa đủ điểm các môn để chia giờ học");
  const validation = validateStudentData(profile, target);

  const allocationText = studyPlan.allocations
    .map((a) => `${a.subjectVi}: ${a.hoursPerWeek} giờ`)
    .join(", ");

  return {
    summary: topRoi
      ? `Kế hoạch chia ${availableHours.toFixed(1)} giờ tự học mỗi tuần, ưu tiên ${topRoi.subjectVi} vì tăng điểm môn này giúp bạn nhiều nhất.`
      : "Chưa đủ dữ liệu để chia giờ học theo môn.",
    key_findings: [
      `Quỹ thời gian tự học: ${availableHours.toFixed(1)} giờ/tuần (sau khi trừ ngủ ${sleepHours.toFixed(1)} giờ, học ở trường ${timeDeduction.schoolHours} giờ, học thêm ${timeDeduction.extraClassesHours} giờ, sinh hoạt ${timeDeduction.livingHours} giờ).`,
      allocationText ? `Phân bổ hiện tại: ${allocationText}.` : "Chưa có phân bổ theo môn.",
      `Giấc ngủ: ${(sleepHours / 7).toFixed(1)} giờ/ngày${isSleepDeprived ? " — dưới 7 giờ, nên ngủ thêm." : "."}`,
    ],
    risks: [
      ...(isSleepDeprived ? ["Thiếu ngủ kéo dài làm giảm khả năng tập trung khi ôn và khi thi."] : []),
      "Chia đều giờ cho mọi môn có thể khiến môn cần cải thiện nhất không tiến bộ đủ.",
    ],
    opportunities: [],
    recommended_actions: [
      ...(topRoi ? [`Giữ đúng số giờ dành cho ${topRoi.subjectVi} trong kế hoạch.`] : []),
      "Sau mỗi lần thi thử, cập nhật điểm để kế hoạch được tính lại.",
    ],
    confidence: dataCompleteness(validation.dataQualityScore, target),
    data_missing: missing,
    explanation: [
      "Tổng 168 giờ/tuần − ngủ − học ở trường − học thêm − sinh hoạt = giờ tự học.",
      "Giờ tự học được chia theo mức ưu tiên môn (môn giúp mở thêm nhiều ngành nhất được nhiều giờ hơn).",
    ],
    provenance: {
      observed_data: target
        ? [`Điểm chuẩn gần nhất của ${target.majorName} (${target.schoolName}): ${target.forecastP50} — ${target.dataPassport}.`]
        : ["Chưa chọn ngành mục tiêu — kế hoạch chỉ dựa trên dữ liệu bạn nhập."],
      user_entered_data: [
        `Giờ ngủ: ${sleepHours} giờ/tuần; học ở trường: ${timeDeduction.schoolHours} giờ; học thêm: ${timeDeduction.extraClassesHours} giờ; sinh hoạt: ${timeDeduction.livingHours} giờ.`,
      ],
      estimated_data: [`Giờ tự học khả dụng: ${availableHours} giờ/tuần.`],
      ai_generated_analysis: ["Câu giải thích tạo từ mẫu câu (không dùng LLM)."],
    },
  };
}
