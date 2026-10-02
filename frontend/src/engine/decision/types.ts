/**
 * DOMAIN DECISION: TYPE DEFINITIONS
 * Phục vụ thuật toán tối ưu hóa đa mục tiêu và bảo vệ danh mục 15 nguyện vọng
 */

import { WishlistItem } from "@/engine/types";

export interface PortfolioValidationResult {
  isValid: boolean;
  pFailAll: number;
  pFailAllPct: number;
  reachCount: number;
  targetCount: number;
  safetyCount: number;
  totalCount: number;
  isOrderOptimal: boolean;
  orderViolations: {
    higherRank: number;
    higherSchool: string;
    higherMajor: string;
    higherProb: number;
    lowerRank: number;
    lowerSchool: string;
    lowerMajor: string;
    lowerProb: number;
  }[];
  budgetViolations: {
    rank: number;
    schoolCode: string;
    majorLabel: string;
    tuitionVnd: number;
  }[];
  warnings: {
    level: "red" | "yellow" | "orange";
    code: string;
    title: string;
    message: string;
    actionType?: "auto_balance" | "reorder_risk" | "none";
    actionText?: string;
  }[];
}

// ============================================================================
// DECISION INTELLIGENCE LAYER: DOMAIN ABSTRACTIONS
// ============================================================================

export interface DecisionGoal {
  programId: string;
  schoolCode: string;
  schoolName: string;
  majorLabel: string;
  targetCombination: string;
  targetCutoffP50: number;
  targetCutoffRange: [number, number]; // [P10, P90]
  ambitionLevel: number; // 0.0 (an toan) -> 1.0 (thu thach)
}

export interface DecisionConstraint {
  maxAnnualBudgetVnd: number;
  homeProvince: string;
  mustStayNearHome: boolean;
  relocationWillingness: "cung_tinh" | "cung_mien" | "toan_quoc";
  availableStudyHoursPerWeek: number;
  excludedSchoolCodes: string[];
  excludedMajorGroups: string[];
}

export interface DecisionPreference {
  rankedMajorGroups: { group: string; weight: number }[];
  careerImportance: number; // 0.0 -> 1.0
  prestigeSensitivity: number; // 0.0 -> 1.0
  dreamSchoolCodes: string[];
}

export interface DecisionEvidence {
  nYearsSeen: number;
  yearsSeen: number[];
  latestCutoff: number;
  latestYear: number;
  historicalCutoffs: Record<string, number>;
  stabilityStdDev: number; // do lech chuan qua cac nam
  trendSlopePerYear: number; // bien dong diem moi nam
  dataQuality: "day_du" | "thieu_mot_phan" | "chi_1_nam" | "uoc_luong";
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  dataPassportRef?: string;
}

export interface DecisionUncertainty {
  p10: number;
  p50: number;
  p90: number;
  confidenceBandWidth: number; // p90 - p10
  macroShockBeta: number;
  confidenceScore: number; // 0 - 100%
  level: "HIGH" | "MEDIUM" | "LOW";
  reasonVi: string;
}

export interface DecisionScore {
  compositeScore: number;
  priorityBonus: number;
  effectiveScore: number;
  admitProbability: number; // 0.0 -> 1.0
  targetGapP50: number; // effectiveScore - p50
  targetGapP10: number; // effectiveScore - p10
  targetGapP90: number; // effectiveScore - p90
  utilityScore: number; // 0.0 -> 1.0
  utilityBreakdown: {
    fit: number;
    cost: number;
    location: number;
    career: number;
    capability: number;
  };
}

export interface DecisionAlternative {
  canonicalId: string;
  schoolCode: string;
  schoolName: string;
  majorLabel: string;
  majorGroup: string;
  combination: string;
  tuitionVnd: number;
  tuitionEstimated: boolean;
  employmentRate: number;
  employmentEstimated: boolean;
  schoolProvince: string;
  region: "bac" | "trung" | "nam";
  score: DecisionScore;
  evidence: DecisionEvidence;
  uncertainty: DecisionUncertainty;
  riskRole: "mao_hiem" | "vua_tam" | "an_toan";
  reasonsVi: string[];
  warningsVi: string[];
}

export interface DecisionContext {
  userId: string;
  createdAt: string;
  goal: DecisionGoal | null;
  constraints: DecisionConstraint;
  preferences: DecisionPreference;
  userScores: {
    examScores: Record<string, number | null>;
    altScores?: {
      ielts?: number;
      gpaHocBa?: number;
      dgnlHcm?: number;
      dgnlHn?: number;
      dgtdBk?: number;
    };
    priorityArea?: string;
    priorityObject?: string;
  };
  hasValidScores: boolean;
  totalInputtedSubjects: number;
}

export interface DecisionTradeoff {
  optionA: DecisionAlternative;
  optionB: DecisionAlternative;
  advantagesA: string[];
  advantagesB: string[];
  costDifferenceVnd: number;
  admitProbabilityDiff: number;
  gapDifference: number;
  verdictVi: string;
}

export interface DecisionScenario {
  id: string;
  name: string;
  scoreDeltas: Record<string, number>;
  budgetDeltaVnd: number;
  unlockedAlternativesCount: number;
  promotedAlternatives: {
    alternative: DecisionAlternative;
    fromRole: "mao_hiem" | "vua_tam" | "an_toan";
    toRole: "mao_hiem" | "vua_tam" | "an_toan";
  }[];
  failAllProbabilityChange: {
    before: number;
    after: number;
  };
}

export interface DecisionAction {
  subject: string;
  subjectLabelVi: string;
  currentScore: number;
  marginalDelta: number; // e.g. +0.5
  marginalRoiScore: number;
  unlockedOptionsCount: number;
  gapReductionPoints: number;
  feasibilityEffort: number;
  recommendedWeeklyHours: number;
  priorityTier: 1 | 2 | 3;
}

export interface DecisionExplanation {
  summaryVi: string;
  targetAssessmentVi: string;
  keyStrengthsVi: string[];
  criticalRisksVi: string[];
  recommendedActionsVi: string[];
  dataProvenanceNoteVi: string;
  confidenceReport: {
    scorePct: number;
    level: "HIGH" | "MEDIUM" | "LOW";
    factors: { name: string; score: number; weight: number }[];
  };
}

export interface DecisionRecommendation {
  generatedAt: string;
  context: DecisionContext;
  topAlternatives: DecisionAlternative[];
  portfolio15: DecisionAlternative[];
  portfolioValidation: PortfolioValidationResult;
  biggestTradeoffs: DecisionTradeoff[];
  topImpactActions: DecisionAction[];
  explanation: DecisionExplanation;
}
