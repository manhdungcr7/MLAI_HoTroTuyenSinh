/**
 * RECOMMENDATION ENGINE (HỆ THỐNG GỢI Ý ĐA NHÂN TỐ THỰC CHỨNG)
 * Single Source of Truth cho thuật toán tư vấn tuyển sinh đại học thông minh.
 *
 * NGUYÊN TẮC:
 * 1. TUYỆT ĐỐI KHÔNG dùng công thức thô thiển "if score > cutoff => recommend".
 * 2. Xét ĐỒNG THỜI 12 yếu tố cốt lõi:
 *    - (1) Điểm thi hiện tại & dự kiến (Current & Projected Scores)
 *    - (2) Lịch sử điểm chuẩn 2022-2024 & độ biến động (Volatility / Trend)
 *    - (3) Ngành yêu thích & Trường yêu thích (Preferences)
 *    - (4) Ràng buộc học phí tối đa & sinh hoạt phí (Tuition & Living Cost Constraint)
 *    - (5) Khu vực địa lý & mức độ chuyển dịch (Location Constraint)
 *    - (6) Tổ hợp môn tối ưu của thí sinh (Optimal Subject Combination Matching)
 *    - (7) Đa phương thức xét tuyển (THPT, Học bạ, ĐGNL, IELTS)
 *    - (8) Mức độ cạnh tranh & phân tầng trường (Selectivity & Prestige Tier)
 *    - (9) Độ ưu tiên mục tiêu & mức độ chấp nhận rủi ro (Ambition & Risk Tolerance)
 *    - (10) Cơ hội nghề nghiệp & việc làm sau tốt nghiệp (Career & Employment Rate)
 *    - (11) Mức độ thích ứng & rủi ro công nghệ AI 2030 (AI Exposure & Leverage)
 *    - (12) Hoàn cảnh gia đình & chính sách ưu tiên điểm thưởng (KV/Đối tượng)
 * 3. Phân nhóm 3 tầng chiến lược rõ ràng (chuẩn hoá ngưỡng 0.8 / 0.4 theo ba.md):
 *    - SAFER (An toàn): Xác suất trúng tuyển >= 80% (>= 0.80).
 *    - BALANCED (Phù hợp): Xác suất 40% - 80% (0.40 - 0.80).
 *    - AMBITIOUS (Thử sức): Xác suất < 40% (< 0.40).
 * 4. Bắt buộc tạo Reason Codes (+/- tags) giải thích lý do cụ thể, đo lường được.
 */

import {
  StudentProfile,
  TargetProgram,
  ExamScores,
  Role,
  WishlistItem,
  PriorityArea,
  PriorityObject,
} from "@/engine/types";
import { DECISION_PROGRAM_POOL, ProgramCatalogItem } from "@/data/catalog";
import {
  normalCDF,
  NATIONAL_SHOCK_STD,
  IDIO_STD,
  calculatePortfolioFailAll,
  classifyRole,
} from "@/engine/admissions/probability";
import { calculateTotalPriorityBonus, convertIeltsToEnglishScore } from "@/engine/admissions/priority";

// ============================================================================
// 1. DATA TYPES & INTERFACES
// ============================================================================

export type StrategyBand = "SAFER" | "BALANCED" | "AMBITIOUS";

export interface ReasonTag {
  type: "positive" | "negative";
  code: string;
  label: string;
  weight: number;
}

export interface FactorScoreBreakdown {
  scoreFit: number;        // (1) Tương quan điểm số & xác suất trúng tuyển
  volatilityFit: number;   // (2) Độ ổn định điểm chuẩn lịch sử
  preferenceFit: number;   // (3) Ngành & Trường yêu thích
  budgetFit: number | null; // (4) Ràng buộc tài chính & học phí — null khi chưa có học phí xác thực
  locationFit: number;     // (5) Vị trí địa lý & chuyển vùng
  combinationFit: number;  // (6) Tối ưu tổ hợp thế mạnh
  methodFit: number;       // (7) Lợi thế đa phương thức (IELTS/ĐGNL/Học bạ)
  selectivityFit: number;  // (8) Mức độ cạnh tranh của trường
  ambitionFit: number;     // (9) Độ phù hợp chiến lược rủi ro
  careerFit: number | null; // (10) Cơ hội việc làm sau tốt nghiệp — null khi chưa có dữ liệu
  aiResilienceFit: number; // (11) Khả năng thích ứng AI 2030
  policyFit: number;       // (12) Điểm cộng ưu tiên & hoàn cảnh gia đình
  compositeUtility: number;// Điểm tổng hợp quy chuẩn (0.0 - 100.0)
}

export interface EvaluatedRecommendation {
  programId: string;
  programKey: string;
  schoolCode: string;
  schoolName: string;
  majorName: string;
  majorLabel: string;
  majorGroup: string;
  combination: string;
  userScore: number;
  userRawScore: number;
  priorityBonus: number;
  cutoffP50: number;
  cutoffP10: number;
  cutoffP90: number;
  gap: number;
  admitProbability: number;
  strategyBand: StrategyBand;
  role: Role;
  tuitionVnd: number | null;
  livingCostVnd: number;
  totalAnnualCostVnd: number | null;
  employmentRate: number | null;
  latestYear?: number;
  yearsOfData: number;
  aiExposure: number;
  leverageScore: number;
  yearlyTrendDelta: number;
  trendStatus: "tang_manh" | "tang_nhe" | "on_dinh" | "ha_nhiet";
  breakdown: FactorScoreBreakdown;
  positiveTags: ReasonTag[];
  negativeTags: ReasonTag[];
  allTags: ReasonTag[];
  dataPassport: string;
  actionAdviceVi: string;
  region: "bac" | "trung" | "nam";
  province: string;
}

export interface RecommendationOptions {
  catalog?: (TargetProgram | ProgramCatalogItem)[];
  maxWishes?: number;
  targetProgramId?: string | null;
  ambitionLevel?: number; // 0.0 (an toàn) -> 1.0 (khát khao bứt phá)
  riskTolerance?: number; // Tối đa xác suất trượt tất cả cho phép
  customWeights?: Partial<Record<keyof FactorScoreBreakdown, number>>;
  preferredRegions?: ("bac" | "trung" | "nam")[];
  excludedSchoolCodes?: string[];
  excludedProgramIds?: string[];
  excludedMajorGroups?: string[];
}

export interface RecommendationEngineResult {
  allEvaluations: EvaluatedRecommendation[];
  saferRecommendations: EvaluatedRecommendation[];
  balancedRecommendations: EvaluatedRecommendation[];
  ambitiousRecommendations: EvaluatedRecommendation[];
  recommendedPortfolio: EvaluatedRecommendation[];
  wishlistItems: WishlistItem[];
  pFailAll: number;
  summary: {
    totalEvaluated: number;
    nSafer: number;
    nBalanced: number;
    nAmbitious: number;
    portfolioComposition: {
      saferCount: number;
      balancedCount: number;
      ambitiousCount: number;
    };
    targetProgramStatus?: {
      programId: string;
      band: StrategyBand;
      probability: number;
      gap: number;
    };
  };
}

// ============================================================================
// 2. HELPER FUNCTIONS: QUY ĐỔI ĐIỂM & TỔ HỢP TỐI ƯU
// ============================================================================

/**
 * Danh mục các môn thi của từng tổ hợp phổ biến
 */
export const COMBO_SUBJECT_MAP: Record<string, (keyof ExamScores)[]> = {
  A00: ["toan", "ly", "hoa"],
  A01: ["toan", "ly", "anh"],
  A02: ["toan", "ly", "sinh"],
  B00: ["toan", "hoa", "sinh"],
  C00: ["van", "su", "dia"],
  C01: ["van", "toan", "ly"],
  C03: ["van", "toan", "su"],
  D01: ["toan", "van", "anh"],
  D07: ["toan", "hoa", "anh"],
  D08: ["toan", "sinh", "anh"],
  D09: ["toan", "su", "anh"],
  D10: ["toan", "dia", "anh"],
  D14: ["van", "su", "anh"],
  D15: ["van", "dia", "anh"],
};

/**
 * Tính điểm ưu tiên khu vực và đối tượng theo chuẩn Bộ GD&ĐT:
 * Điểm ưu tiên giảm dần nếu tổng điểm >= 22.5:
 * PriorityScore = ((30 - Score) / 7.5) * BaseBonus
 */
export function calculateMinistryPriorityBonus(
  rawScore: number,
  area: PriorityArea = "KV3",
  object: PriorityObject = "none"
): number {
  // Một nguồn quy tắc duy nhất: domain/admissions/priority.ts (UT1 = 2.0, UT2 = 1.0; không có UT3)
  return calculateTotalPriorityBonus({ area, object }, rawScore);
}

/**
 * Tự động quy đổi điểm IELTS sang điểm thi môn Tiếng Anh
 */
export function getIeltsEquivalentEnglishScore(ieltsScore?: number | null): number | null {
  // Bảng quy đổi thực tế do từng trường quy định (DATA_REQUIRED); dùng một bảng chung ở domain.
  if (!ieltsScore || isNaN(ieltsScore)) return null;
  const converted = convertIeltsToEnglishScore(ieltsScore, null);
  return converted ? converted : null;
}

/**
 * Tìm tổ hợp tối ưu nhất cho thí sinh trong các tổ hợp của ngành
 */
export function findBestCombinationForProgram(
  examScores: ExamScores,
  altScores: any,
  priority: any,
  programCombos: string[]
): { bestCombo: string; bestScore: number; rawScore: number; bonus: number; comboScores: Record<string, number> } {
  const effectiveScores: ExamScores = { ...examScores };

  // Kiểm tra quy đổi IELTS nếu điểm quy đổi cao hơn điểm thi Tiếng Anh hiện có
  const ieltsConverted = getIeltsEquivalentEnglishScore(altScores?.ielts);
  if (ieltsConverted !== null) {
    const currentAnh = effectiveScores.anh ?? 0;
    if (ieltsConverted > currentAnh) {
      effectiveScores.anh = ieltsConverted;
    }
  }

  let bestCombo = programCombos[0] || "A00";
  let bestTotal = 0;
  let bestRaw = 0;
  let bestBonus = 0;
  const comboScores: Record<string, number> = {};

  const combosToTest = programCombos.length > 0 ? programCombos : ["A00", "A01", "D01"];

  for (const combo of combosToTest) {
    const subjects = COMBO_SUBJECT_MAP[combo.toUpperCase()];
    if (!subjects) continue;

    const s1 = effectiveScores[subjects[0]];
    const s2 = effectiveScores[subjects[1]];
    const s3 = effectiveScores[subjects[2]];

    if (s1 !== undefined && s1 !== null && s2 !== undefined && s2 !== null && s3 !== undefined && s3 !== null) {
      const raw = Number((s1 + s2 + s3).toFixed(2));
      const bonus = calculateMinistryPriorityBonus(raw, priority?.area, priority?.object);
      const total = Number(Math.min(30.0, raw + bonus).toFixed(2));
      comboScores[combo] = total;

      if (total > bestTotal) {
        bestTotal = total;
        bestRaw = raw;
        bestBonus = bonus;
        bestCombo = combo;
      }
    }
  }

  // Không đủ điểm cho tổ hợp nào của ngành: bestScore = 0 (không ước lượng / không lấy 3 môn cao nhất bất kỳ).
  // runRecommendationEngine bỏ qua các chương trình này.

  return { bestCombo, bestScore: bestTotal, rawScore: bestRaw, bonus: bestBonus, comboScores };
}

// ============================================================================
// 3. CHI TIẾT ĐÁNH GIÁ 12 YẾU TỐ (MULTI-FACTOR EVALUATION)
// ============================================================================

export function evaluateProgram(
  program: TargetProgram | ProgramCatalogItem,
  profile: StudentProfile,
  options: RecommendationOptions = {}
): EvaluatedRecommendation {
  const p = program as ProgramCatalogItem;
  const budget = profile.annualBudgetVnd ?? 45000000;
  const homeProvince = profile.homeProvince || "Hà Nội";
  const relocationWillingness = profile.relocationWillingness || "khong_gioi_han";
  const activeTargetId = options.targetProgramId || profile.targetProgram?.programId;

  // --- YẾU TỐ 6 & 7: TỔ HỢP TỐI ƯU & PHƯƠNG THỨC XÉT TUYỂN ---
  const combos = p.combinations && p.combinations.length > 0 ? p.combinations : ["A00", "A01", "D01"];
  const comboAnalysis = findBestCombinationForProgram(
    profile.examScores,
    profile.altScores,
    profile.priority,
    combos
  );
  const userScore = comboAnalysis.bestScore;
  const rawScore = comboAnalysis.rawScore;
  const priorityBonus = comboAnalysis.bonus;
  const bestCombo = comboAnalysis.bestCombo;

  // --- YẾU TỐ 1 & 2: ĐIỂM SỐ, LỊCH SỬ ĐIỂM CHUẨN & BIẾN ĐỘNG (VOLATILITY) ---
  const p50 = p.forecastP50 || p.latestScore || 24.0;
  const p10 = p.forecastP10 || Number((p50 - 1.2).toFixed(2));
  const p90 = p.forecastP90 || Number((p50 + 1.2).toFixed(2));
  const gap = Number((userScore - p50).toFixed(2));

  // Xác suất trúng tuyển theo mô hình Gaussian liên tục
  const beta = p.betaProgram || 1.0;
  const idio = p.idioStd || IDIO_STD;
  const sigma = Math.sqrt(beta * beta * NATIONAL_SHOCK_STD * NATIONAL_SHOCK_STD + idio * idio);
  const zScore = (userScore - p50) / sigma;
  const admitProbability = Number(normalCDF(zScore).toFixed(4));

  // Xác định 3 tầng chiến lược (Strategy Bands)
  let strategyBand: StrategyBand = "BALANCED";
  let role: Role = "vua_tam";

  role = classifyRole(admitProbability);
  strategyBand = role === "an_toan" ? "SAFER" : role === "mao_hiem" ? "AMBITIOUS" : "BALANCED";

  // Phân tích xu hướng điểm chuẩn (Trend)
  const yearlyDelta = p.yearlyTrendDelta ?? 0.0;
  let trendStatus: "tang_manh" | "tang_nhe" | "on_dinh" | "ha_nhiet" = "on_dinh";
  if (yearlyDelta >= 0.5) trendStatus = "tang_manh";
  else if (yearlyDelta >= 0.1) trendStatus = "tang_nhe";
  else if (yearlyDelta <= -0.3) trendStatus = "ha_nhiet";

  // --- YẾU TỐ 4: TÀI CHÍNH, HỌC PHÍ & SINH HOẠT PHÍ ---
  // Học phí chưa xác thực → null (không điền giá trị mặc định)
  let tuition: number | null = p.tuitionVnd || null;
  // Miễn giảm học phí theo chính sách
  const policy = (profile as any).policyStatus || (profile.priority?.object ? "ưu_tiên" : "none");
  let policyDiscountFactor = 1.0;
  if (["ho_ngheo", "can_ngheo", "dan_toc_thieu_so", "vung_dbkk"].includes(policy)) {
    policyDiscountFactor = 0.4; // Giảm 60% học phí
  } else if (["khuyet_tat", "mo_coi"].includes(policy)) {
    policyDiscountFactor = 0.6; // Giảm 40% học phí
  }
  if (tuition !== null) tuition = Math.round(tuition * policyDiscountFactor);

  // Sinh hoạt phí theo thành phố
  const schoolProvince = p.province || p.schoolProvince || "Hà Nội";
  const isSpecialCity = ["Hà Nội", "TP.HCM"].includes(schoolProvince);
  const isTier1City = ["Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế"].includes(schoolProvince);
  const livingCost = schoolProvince === homeProvince ? 0 : isSpecialCity ? 45000000 : isTier1City ? 32000000 : 22000000;
  const totalAnnualCost = tuition !== null ? tuition + livingCost : null;
  const yearsOfData = (p as ProgramCatalogItem).yearsOfData ??
    [p.cutoff2021, p.cutoff2022, p.cutoff2023, p.cutoff2024].filter((v) => typeof v === "number").length;

  // --- YẾU TỐ 5: VỊ TRÍ ĐỊA LÝ & CHUYỂN VÙNG ---
  const isSameProvince = schoolProvince === homeProvince;
  const isSameRegion = p.region === (["TP.HCM", "Cần Thơ", "Bạc Liêu", "Đồng Tháp"].includes(homeProvince) ? "nam" : ["Đà Nẵng", "Huế", "Khánh Hòa"].includes(homeProvince) ? "trung" : "bac");

  // --- YẾU TỐ 8: MỨC ĐỘ CẠNH TRANH CỦA TRƯỜNG ---
  const isTopPrestige = p50 >= 26.5;

  // --- CHẤM ĐIỂM 12 YẾU TỐ (0.0 - 100.0) ---
  const positiveTags: ReasonTag[] = [];
  const negativeTags: ReasonTag[] = [];

  // 1. Score Fit
  const scoreFit = Math.min(100, Math.max(0, admitProbability * 100));
  if (gap >= 1.0) {
    positiveTags.push({
      type: "positive",
      code: "SCORE_SURPLUS",
      label: `[+] Điểm của bạn (${userScore}đ) cao hơn điểm chuẩn gần nhất ${gap}đ`,
      weight: 10,
    });
  } else if (gap >= 0) {
    positiveTags.push({
      type: "positive",
      code: "SCORE_COMPETITIVE",
      label: `[+] Điểm của bạn (${userScore}đ) sát điểm chuẩn gần nhất (${p50}đ)`,
      weight: 8,
    });
  } else {
    negativeTags.push({
      type: "negative",
      code: "SCORE_DEFICIT",
      label: `[-] Điểm của bạn (${userScore}đ) thấp hơn điểm chuẩn gần nhất (${p50}đ) ${Math.abs(gap)}đ`,
      weight: 9,
    });
  }

  // 2. Volatility Fit
  let volatilityFit = 80;
  if (trendStatus === "tang_manh") {
    volatilityFit = 40;
    negativeTags.push({
      type: "negative",
      code: "TREND_RISING",
      label: `[-] Điểm chuẩn ngành này có xu hướng tăng mạnh (+${yearlyDelta}đ/năm)`,
      weight: 8,
    });
  } else if (trendStatus === "ha_nhiet") {
    volatilityFit = 95;
    positiveTags.push({
      type: "positive",
      code: "TREND_COOLING",
      label: `[+] Điểm chuẩn có dấu hiệu hạ nhiệt (-${Math.abs(yearlyDelta)}đ), mở rộng cơ hội trúng tuyển`,
      weight: 7,
    });
  } else if (yearsOfData >= 2) {
    volatilityFit = 85;
    positiveTags.push({
      type: "positive",
      code: "TREND_STABLE",
      label: `[+] Điểm chuẩn ${yearsOfData} năm gần đây tương đối ổn định`,
      weight: 6,
    });
  }
  if (yearsOfData <= 1) {
    volatilityFit = 60;
    negativeTags.push({
      type: "negative",
      code: "SINGLE_YEAR_DATA",
      label: `[-] Chỉ có 1 năm điểm chuẩn — ước tính kém chắc chắn`,
      weight: 7,
    });
  }

  // 3. Preference Fit (Ngành & Trường yêu thích)
  let preferenceFit = 60;
  const isTargetProgram = activeTargetId === p.programId;
  const isDreamSchool = (profile as any).preferences?.dream_school_codes?.includes(p.schoolCode);
  if (isTargetProgram) {
    preferenceFit = 100;
    positiveTags.push({
      type: "positive",
      code: "PRIMARY_TARGET",
      label: `[+] Nguyện vọng mục tiêu số 1 đã chọn trong hồ sơ`,
      weight: 12,
    });
  } else if (profile.interestMajorGroups?.includes(p.majorGroup)) {
    preferenceFit = 85;
    positiveTags.push({
      type: "positive",
      code: "INTEREST_GROUP",
      label: `[+] Thuộc nhóm ngành bạn quan tâm`,
      weight: 9,
    });
  } else if (isDreamSchool) {
    preferenceFit = 95;
    positiveTags.push({
      type: "positive",
      code: "DREAM_SCHOOL",
      label: `[+] Thuộc danh sách trường đại học mơ ước (${p.schoolCode})`,
      weight: 10,
    });
  }

  // 4. Budget Fit
  let budgetFit: number | null = 50;
  const costRatio = totalAnnualCost !== null ? totalAnnualCost / Math.max(1, budget) : null;
  if (tuition === null || totalAnnualCost === null || costRatio === null) {
    budgetFit = null;
    negativeTags.push({
      type: "negative",
      code: "TUITION_UNKNOWN",
      label: `[-] Chưa có học phí đã xác thực — cần kiểm tra đề án của trường`,
      weight: 5,
    });
  } else if (costRatio <= 0.8) {
    budgetFit = 100;
    positiveTags.push({
      type: "positive",
      code: "BUDGET_OPTIMAL",
      label: `[+] Học phí ${(tuition / 1e6).toFixed(0)}tr/năm nằm trọn vẹn trong ngân sách (${(budget / 1e6).toFixed(0)}tr)`,
      weight: 9,
    });
  } else if (costRatio <= 1.05) {
    budgetFit = 75;
    positiveTags.push({
      type: "positive",
      code: "BUDGET_ACCEPTABLE",
      label: `[+] Tổng chi phí ${(totalAnnualCost / 1e6).toFixed(0)}tr/năm vừa khớp ngân sách dự kiến`,
      weight: 6,
    });
  } else {
    budgetFit = Math.max(0, 70 - (costRatio - 1.05) * 100);
    negativeTags.push({
      type: "negative",
      code: "BUDGET_OVERRUN",
      label: `[-] Tổng chi phí ${(totalAnnualCost / 1e6).toFixed(0)}tr/năm vượt ngân sách gia đình (${(budget / 1e6).toFixed(0)}tr)`,
      weight: 8,
    });
  }

  // 5. Location Fit
  let locationFit = 70;
  if (isSameProvince) {
    locationFit = 100;
    positiveTags.push({
      type: "positive",
      code: "LOCATION_LOCAL",
      label: `[+] Đúng khu vực ưu tiên ${schoolProvince} (gần nhà, tiết kiệm sinh hoạt phí)`,
      weight: 9,
    });
  } else if (relocationWillingness === "chi_tinh_nha") {
    locationFit = 30;
    negativeTags.push({
      type: "negative",
      code: "LOCATION_MISMATCH",
      label: `[-] Cơ sở đào tạo tại ${schoolProvince}, không đúng nguyện vọng chỉ học tại tỉnh nhà`,
      weight: 7,
    });
  } else if (isSameRegion) {
    locationFit = 85;
    positiveTags.push({
      type: "positive",
      code: "LOCATION_REGION",
      label: `[+] Nằm trong khu vực miền ${p.region === "nam" ? "Nam" : p.region === "trung" ? "Trung" : "Bắc"} thuận tiện đi lại`,
      weight: 5,
    });
  }

  // 6. Combination Fit
  const combinationFit = 80;
  if (combos.length > 1) {
    positiveTags.push({
      type: "positive",
      code: "COMBO_OPTIMIZED",
      label: `[+] Tổ hợp tối ưu ${bestCombo} (${userScore}đ) mang lại lợi thế tốt nhất trong ${combos.join(", ")}`,
      weight: 7,
    });
  }

  if ((p as ProgramCatalogItem).combinationsVerified === false) {
    negativeTags.push({
      type: "negative",
      code: "COMBO_UNVERIFIED",
      label: `[-] Tổ hợp xét tuyển chưa được đối chiếu đề án — cần kiểm tra với trường`,
      weight: 6,
    });
  }

  // 7. Method Fit (IELTS / ĐGNL / Học bạ)
  let methodFit = 70;
  const ieltsVal = profile.altScores?.ielts;
  if (ieltsVal && ieltsVal >= 6.5) {
    methodFit = 95;
    positiveTags.push({
      type: "positive",
      code: "IELTS_ADVANTAGE",
      label: `[+] Tận dụng chứng chỉ IELTS ${ieltsVal} quy đổi điểm Tiếng Anh tối đa`,
      weight: 8,
    });
  }
  if (profile.altScores?.hoc_ba_gpa && profile.altScores.hoc_ba_gpa >= 8.5) {
    positiveTags.push({
      type: "positive",
      code: "HOC_BA_BACKUP",
      label: `[+] GPA học bạ ${profile.altScores.hoc_ba_gpa} tạo phương án xét tuyển học bạ an toàn`,
      weight: 6,
    });
  }

  // 8. Selectivity Fit
  const selectivityFit = isTopPrestige ? 65 : 85;
  if (isTopPrestige) {
    negativeTags.push({
      type: "negative",
      code: "HIGH_COMPETITION",
      label: `[-] Điểm chuẩn thuộc nhóm cao (từ 26.5 trở lên), cạnh tranh mạnh`,
      weight: 6,
    });
  }

  // 9. Ambition Fit
  const ambitionFit = strategyBand === "BALANCED" ? 90 : strategyBand === "SAFER" ? 85 : 75;

  // 10. Career Fit
  const careerFit: number | null =
    p.employmentRate !== null && p.employmentRate !== undefined ? Math.min(100, Math.max(50, p.employmentRate)) : null;
  if (p.employmentRate && p.employmentRate >= 96.0) {
    positiveTags.push({
      type: "positive",
      code: "CAREER_HIGH_EMPLOYMENT",
      label: `[+] Tỷ lệ có việc làm sau tốt nghiệp đạt ${p.employmentRate}%`,
      weight: 7,
    });
  }

  // 11. AI Resilience Fit
  // aiExposure / leverageScore hiện là ước lượng theo nhóm ngành, chưa có nguồn → không dùng để chấm điểm
  const aiResilienceFit = Math.round((1.0 - (p.aiExposure || 0.3)) * 50 + (p.leverageScore || 7.0) * 5);

  // 12. Policy Fit (Ưu tiên)
  let policyFit = 70;
  if (priorityBonus > 0) {
    policyFit = 95;
    positiveTags.push({
      type: "positive",
      code: "POLICY_BONUS",
      label: `[+] Hưởng điểm ưu tiên +${priorityBonus}đ theo quy chế Bộ GD&ĐT`,
      weight: 8,
    });
  }

  // Hành động khuyến nghị — chỉ dựa trên số đã tính, không khẳng định chắc chắn
  let actionAdviceVi = "";
  if (strategyBand === "AMBITIOUS") {
    actionAdviceVi = `Bạn cần thêm khoảng ${Math.abs(gap).toFixed(1)} điểm tổ hợp ${bestCombo} để chạm điểm chuẩn gần nhất. Xem mục "Môn nên ưu tiên" để biết môn nào giúp nhiều nhất.`;
  } else if (strategyBand === "BALANCED") {
    actionAdviceVi = `Điểm của bạn sát điểm chuẩn. Giữ phong độ và luôn có thêm nguyện vọng An toàn phía sau.`;
  } else {
    actionAdviceVi = `Lựa chọn dự phòng tốt: điểm của bạn đang cao hơn điểm chuẩn gần nhất. Điểm chuẩn vẫn có thể tăng nếu đề dễ.`;
  }

  // --- TÍNH ĐIỂM LỢI ÍCH TỔNG HỢP (MAUT COMPOSITE UTILITY) ---
  const weights = {
    scoreFit: 0.28,
    preferenceFit: 0.18,
    budgetFit: 0.12,
    locationFit: 0.10,
    careerFit: 0.08,
    volatilityFit: 0.06,
    combinationFit: 0.05,
    methodFit: 0.04,
    aiResilienceFit: 0,
    policyFit: 0.03,
    selectivityFit: 0.01,
    ambitionFit: 0.01,
    ...options.customWeights,
  };

  // Tiêu chí thiếu dữ liệu (null) bị loại, trọng số còn lại được chuẩn hóa về tổng 1
  const factorValues: Record<string, number | null> = {
    scoreFit,
    preferenceFit,
    budgetFit,
    locationFit,
    careerFit,
    volatilityFit,
    combinationFit,
    methodFit,
    aiResilienceFit,
    policyFit,
    selectivityFit,
    ambitionFit,
  };
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [key, value] of Object.entries(factorValues)) {
    const w = weights[key as keyof typeof weights] ?? 0;
    if (value === null || !w) continue;
    weightedSum += value * w;
    weightTotal += w;
  }
  const compositeUtility = Number((weightTotal > 0 ? weightedSum / weightTotal : 0).toFixed(2));

  const breakdown: FactorScoreBreakdown = {
    scoreFit: Number(scoreFit.toFixed(1)),
    volatilityFit: Number(volatilityFit.toFixed(1)),
    preferenceFit: Number(preferenceFit.toFixed(1)),
    budgetFit: budgetFit === null ? null : Number(budgetFit.toFixed(1)),
    locationFit: Number(locationFit.toFixed(1)),
    combinationFit: Number(combinationFit.toFixed(1)),
    methodFit: Number(methodFit.toFixed(1)),
    selectivityFit: Number(selectivityFit.toFixed(1)),
    ambitionFit: Number(ambitionFit.toFixed(1)),
    careerFit: careerFit === null ? null : Number(careerFit.toFixed(1)),
    aiResilienceFit: Number(aiResilienceFit.toFixed(1)),
    policyFit: Number(policyFit.toFixed(1)),
    compositeUtility,
  };

  // Sắp xếp tags theo trọng số quan trọng
  positiveTags.sort((a, b) => b.weight - a.weight);
  negativeTags.sort((a, b) => b.weight - a.weight);
  const allTags = [...positiveTags, ...negativeTags];

  return {
    programId: p.programId,
    programKey: p.programKey || p.programId,
    schoolCode: p.schoolCode,
    schoolName: p.schoolName,
    majorName: p.majorName,
    majorLabel: p.majorLabel || p.majorName,
    majorGroup: p.majorGroup,
    combination: bestCombo,
    userScore,
    userRawScore: rawScore,
    priorityBonus,
    cutoffP50: p50,
    cutoffP10: p10,
    cutoffP90: p90,
    gap,
    admitProbability,
    strategyBand,
    role,
    tuitionVnd: tuition,
    livingCostVnd: livingCost,
    totalAnnualCostVnd: totalAnnualCost,
    employmentRate: p.employmentRate ?? null,
    latestYear: (p as ProgramCatalogItem).latestYear,
    yearsOfData,
    aiExposure: p.aiExposure || 0.35,
    leverageScore: p.leverageScore || 7.5,
    yearlyTrendDelta: yearlyDelta,
    trendStatus,
    breakdown,
    positiveTags,
    negativeTags,
    allTags,
    dataPassport: p.dataPassport || `Đề án tuyển sinh ${p.schoolCode}`,
    actionAdviceVi,
    region: p.region || "bac",
    province: schoolProvince,
  };
}

// ============================================================================
// 4. ENGINE CỐT LÕI: GỢI Ý & PHÂN NHÓM 3 TẦNG CHIẾN LƯỢC
// ============================================================================

export function runRecommendationEngine(
  profile: StudentProfile,
  options: RecommendationOptions = {}
): RecommendationEngineResult {
  const catalogToUse = options.catalog && options.catalog.length > 0 ? options.catalog : DECISION_PROGRAM_POOL;
  const ambition = Math.max(0.0, Math.min(1.0, options.ambitionLevel ?? 0.5));
  const maxWishes = options.maxWishes ?? 15;

  // 1. Đánh giá tất cả các chương trình trong danh mục
  const evaluations: EvaluatedRecommendation[] = [];
  const excludedSchools = new Set(options.excludedSchoolCodes || []);
  const excludedPrograms = new Set(options.excludedProgramIds || []);
  const excludedGroups = new Set(options.excludedMajorGroups || []);

  for (const prog of catalogToUse) {
    if (excludedSchools.has(prog.schoolCode)) continue;
    if (excludedPrograms.has(prog.programId)) continue;
    if (excludedGroups.has(prog.majorGroup)) continue;

    const evaluated = evaluateProgram(prog, profile, options);

    // Học sinh chưa đủ điểm cho tổ hợp nào của ngành → không đánh giá được
    if (evaluated.userScore <= 0) continue;

    // Lọc loại bỏ nếu học phí (đã xác thực) vượt quá 140% ngân sách (hard filter). Học phí chưa rõ không bị loại.
    if (profile.annualBudgetVnd && evaluated.tuitionVnd && evaluated.tuitionVnd > profile.annualBudgetVnd * 1.4) {
      continue;
    }

    evaluations.push(evaluated);
  }

  // 2. Phân chia vào 3 tầng chiến lược
  const saferPool = evaluations
    .filter((e) => e.strategyBand === "SAFER")
    .sort((a, b) => b.breakdown.compositeUtility - a.breakdown.compositeUtility);

  const balancedPool = evaluations
    .filter((e) => e.strategyBand === "BALANCED")
    .sort((a, b) => b.breakdown.compositeUtility - a.breakdown.compositeUtility);

  const ambitiousPool = evaluations
    .filter((e) => e.strategyBand === "AMBITIOUS")
    .sort((a, b) => b.breakdown.compositeUtility - a.breakdown.compositeUtility);

  // 3. Tối ưu danh mục 15 nguyện vọng theo Ambition Level
  // ambition = 0.0 (an toàn): 2 Ambitious, 5 Balanced, 8 Safer
  // ambition = 1.0 (thử thách): 6 Ambitious, 6 Balanced, 3 Safer
  const nAmbitious = Math.round(2 + ambition * 4); // 2 -> 6
  const nSafer = Math.round(8 - ambition * 5);     // 8 -> 3
  const nBalanced = maxWishes - nAmbitious - nSafer; // 5 -> 6

  const selectedPortfolio: EvaluatedRecommendation[] = [];
  const selectedIds = new Set<string>();

  const addUnique = (items: EvaluatedRecommendation[], count: number) => {
    let added = 0;
    for (const it of items) {
      if (!selectedIds.has(it.programId)) {
        selectedPortfolio.push(it);
        selectedIds.add(it.programId);
        added++;
        if (added >= count) break;
      }
    }
  };

  // Ưu tiên nguyện vọng mục tiêu (Target Program) nếu có
  const targetId = options.targetProgramId || profile.targetProgram?.programId;
  let targetBand: StrategyBand | null = null;
  if (targetId) {
    const targetMatch = evaluations.find((e) => e.programId === targetId);
    if (targetMatch) {
      selectedPortfolio.push(targetMatch);
      selectedIds.add(targetMatch.programId);
      targetBand = targetMatch.strategyBand;
    }
  }

  // Bổ sung theo quota từng băng (mục tiêu chiếm 1 suất trong băng của nó → tổng không vượt maxWishes)
  addUnique(ambitiousPool, nAmbitious - (targetBand === "AMBITIOUS" ? 1 : 0));
  addUnique(balancedPool, nBalanced - (targetBand === "BALANCED" ? 1 : 0));
  addUnique(saferPool, nSafer - (targetBand === "SAFER" ? 1 : 0));

  // Điền nốt nếu chưa đủ 15 suất
  if (selectedPortfolio.length < maxWishes) {
    const remaining = [...balancedPool, ...saferPool, ...ambitiousPool];
    for (const r of remaining) {
      if (!selectedIds.has(r.programId)) {
        selectedPortfolio.push(r);
        selectedIds.add(r.programId);
        if (selectedPortfolio.length >= maxWishes) break;
      }
    }
  }

  // 4. Sắp xếp thứ tự danh mục theo thứ tự ưu tiên chuẩn tuyển sinh:
  // Nguyện vọng mơ ước (Ambitious) đặt ở thứ tự đầu -> Vừa tầm (Balanced) ở giữa -> An toàn (Safer) ở cuối
  selectedPortfolio.sort((a, b) => {
    const bandOrder: Record<StrategyBand, number> = { AMBITIOUS: 1, BALANCED: 2, SAFER: 3 };
    if (bandOrder[a.strategyBand] !== bandOrder[b.strategyBand]) {
      return bandOrder[a.strategyBand] - bandOrder[b.strategyBand];
    }
    if (a.strategyBand === "AMBITIOUS") {
      return (b.cutoffP50 ?? 0) - (a.cutoffP50 ?? 0);
    }
    return b.breakdown.compositeUtility - a.breakdown.compositeUtility;
  });

  // 5. Chuyển đổi sang WishlistItem format để tương thích 100% với DecisionContext
  const wishlistItems: WishlistItem[] = selectedPortfolio.map((p, idx) => ({
    rank: idx + 1,
    school_code: p.schoolCode,
    school_name: p.schoolName,
    major_label: p.majorLabel,
    program_id: p.programId,
    combinations_seen: p.combination,
    role: p.role,
    admit_prob: p.admitProbability,
    forecast_p10: p.cutoffP10,
    forecast_p50: p.cutoffP50,
    forecast_p90: p.cutoffP90,
    latest_score: p.cutoffP50,
    latest_year: p.latestYear,
    n_years: p.yearsOfData,
    data_quality: p.yearsOfData >= 3 ? "day_du" : p.yearsOfData === 1 ? "chi_1_nam" : "thieu_mot_phan",
    utility: p.breakdown.compositeUtility,
    user_score: p.userScore,
    tuition_vnd: p.tuitionVnd,
    employment_rate: p.employmentRate,
    data_passport_url: p.dataPassport,
    why_option_vi: p.allTags.map((t) => t.label).slice(0, 2).join(". "),
    region: p.region,
    province: p.province,
    util_breakdown: {
      fit: p.breakdown.preferenceFit / 100,
      cost: p.breakdown.budgetFit === null ? null : p.breakdown.budgetFit / 100,
      location: p.breakdown.locationFit / 100,
      career: p.breakdown.careerFit === null ? null : p.breakdown.careerFit / 100,
      capability: p.breakdown.scoreFit / 100,
    },
    util_meta: {
      total_cost_per_year_vnd: p.totalAnnualCostVnd ?? undefined,
      tuition_estimated: p.tuitionVnd === null,
      budget_ratio:
        p.totalAnnualCostVnd !== null && profile.annualBudgetVnd
          ? Number((p.totalAnnualCostVnd / profile.annualBudgetVnd).toFixed(2))
          : undefined,
    },
  }));

  // 6. Tính xác suất trượt tất cả P(Fail All) bằng Gauss-Hermite
  const pFailAll = calculatePortfolioFailAll(
    wishlistItems.map((w) => ({
      userScore: w.user_score ?? 0,
      forecastP50: w.forecast_p50 ?? 0,
      beta: 1.0,
    }))
  );

  // Target status
  let targetProgramStatus = undefined;
  if (targetId) {
    const targetMatch = evaluations.find((e) => e.programId === targetId);
    if (targetMatch) {
      targetProgramStatus = {
        programId: targetMatch.programId,
        band: targetMatch.strategyBand,
        probability: targetMatch.admitProbability,
        gap: targetMatch.gap,
      };
    }
  }

  return {
    allEvaluations: evaluations,
    saferRecommendations: saferPool,
    balancedRecommendations: balancedPool,
    ambitiousRecommendations: ambitiousPool,
    recommendedPortfolio: selectedPortfolio,
    wishlistItems,
    pFailAll: Number(pFailAll.toFixed(4)),
    summary: {
      totalEvaluated: evaluations.length,
      nSafer: saferPool.length,
      nBalanced: balancedPool.length,
      nAmbitious: ambitiousPool.length,
      portfolioComposition: {
        saferCount: selectedPortfolio.filter((e) => e.strategyBand === "SAFER").length,
        balancedCount: selectedPortfolio.filter((e) => e.strategyBand === "BALANCED").length,
        ambitiousCount: selectedPortfolio.filter((e) => e.strategyBand === "AMBITIOUS").length,
      },
      targetProgramStatus,
    },
  };
}
