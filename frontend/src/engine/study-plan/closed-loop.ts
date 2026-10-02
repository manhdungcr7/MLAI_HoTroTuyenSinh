/**
 * MODULE STUDY PLAN: CLOSED-LOOP MOCK TEST FEEDBACK ENGINE
 * Single Source of Truth cho Vòng lặp Quyết định Khép kín (Wow 1).
 *
 * NGUYÊN TẮC:
 * 1. Pure Functional & Zero React Dependencies: Có thể unit test độc lập.
 * 2. Làm mượt điểm theo độ tin cậy của đề thi (omega):
 *    - Đề chuyên / ĐHQG (tier 1): omega = 0.95
 *    - Đề tỉnh / trường trọng điểm (tier 2): omega = 0.85
 *    - Đề thi online / trường thường (tier 3): omega = 0.75
 *    - Hệ số thích ứng: gamma = 0.6 * omega
 *    - Điểm làm mượt: smoothed = (1 - gamma) * oldScore + gamma * mockScore
 * 3. Tính lại toàn bộ vòng quyết định:
 *    - Khoảng cách tới mục tiêu (Gap)
 *    - Phân tích đòn bẩy môn học (Subject ROI)
 *    - Danh mục 15 nguyện vọng & Xác suất trượt toàn bộ (P fail all)
 *    - Dịch chuyển giờ học theo nguyên tắc water-filling
 */

import {
  StudentProfile,
  TargetProgram,
  ExamScores,
  WishlistItem,
  SubjectAllocation,
  ClosedLoopDiff,
  ClosedLoopScoreChange,
  ClosedLoopBandPromotion,
  ClosedLoopAllocationShift,
  TimeDeduction,
  SubjectRoiMetric,
  StudyPlan,
} from "@/engine/types";
import { SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { buildCandidateOptions, buildOptimizedPortfolio } from "@/engine/decision/optimizer";
import { calculateSubjectRoiList } from "@/engine/roi/engine";
import { buildStudyPlan } from "@/engine/study-plan/engine";

export interface MockTestSubmissionInput {
  testName: string;
  testDate: string;
  reliabilityTier: "tier_1_specialized_school" | "tier_2_provincial_highschool" | "tier_3_online_mock";
  newScores: Partial<Record<keyof ExamScores, number>>;
  note?: string;
}

export interface ClosedLoopParams {
  profile: StudentProfile;
  primaryTarget: TargetProgram | null;
  candidatesPool: TargetProgram[];
  submission: MockTestSubmissionInput;
  prevPFailAll: number;
  prevWishlist: WishlistItem[];
  prevAllocations: SubjectAllocation[];
  timeDeduction?: TimeDeduction;
}

export interface ClosedLoopResult {
  updatedProfile: StudentProfile;
  diff: ClosedLoopDiff;
  nextRoiList: SubjectRoiMetric[];
  nextStudyPlan: StudyPlan;
}

/**
 * Trọng số độ tin cậy theo nguồn đề thi (omega)
 */
export function getReliabilityWeight(
  tier: "tier_1_specialized_school" | "tier_2_provincial_highschool" | "tier_3_online_mock"
): number {
  switch (tier) {
    case "tier_1_specialized_school":
      return 0.95;
    case "tier_2_provincial_highschool":
      return 0.85;
    case "tier_3_online_mock":
    default:
      return 0.75;
  }
}

/**
 * Hàm tính toán cốt lõi của Vòng lặp thi thử
 */
export function computeClosedLoopMockTest(params: ClosedLoopParams): ClosedLoopResult {
  const {
    profile,
    primaryTarget,
    candidatesPool,
    submission,
    prevPFailAll,
    prevWishlist,
    prevAllocations,
    timeDeduction,
  } = params;

  const omega = getReliabilityWeight(submission.reliabilityTier);
  const gamma = 0.6 * omega;

  const prevScores = profile.examScores;
  const newScoresObj: ExamScores = { ...prevScores };
  const scoreChanges: ClosedLoopScoreChange[] = [];

  for (const [subKey, rawVal] of Object.entries(submission.newScores)) {
    if (rawVal !== undefined && rawVal !== null) {
      const key = subKey as keyof ExamScores;
      const oldScore = prevScores[key] ?? 7.0;
      const rawScore = Number(rawVal);
      const smoothedScore = Math.round(((1 - gamma) * oldScore + gamma * rawScore) * 100) / 100;
      const delta = Math.round((rawScore - oldScore) * 100) / 100;

      newScoresObj[key] = smoothedScore;
      scoreChanges.push({
        subject: key,
        subjectVi: SUBJECT_LABELS_VI[key] || key,
        previous: oldScore,
        newScore: rawScore,
        smoothed: smoothedScore,
        delta,
      });
    }
  }

  let newPFailAll = prevPFailAll;
  let failRiskDelta = 0;
  const promotions: ClosedLoopBandPromotion[] = [];

  const updatedProfile: StudentProfile = {
    ...profile,
    examScores: newScoresObj,
  };

  if (primaryTarget) {
    const nextCandidates = buildCandidateOptions(candidatesPool, updatedProfile).filter((c) => c.userScore > 0);
    const nextPortfolio = buildOptimizedPortfolio(nextCandidates, primaryTarget, 0.5, 0.05);
    newPFailAll = nextPortfolio.pFailAll;
    failRiskDelta = Math.round((newPFailAll - prevPFailAll) * 1000) / 1000;

    prevWishlist.forEach((prevItem) => {
      const nextItem = nextPortfolio.wishlist.find((n) => n.program_id === prevItem.program_id);
      if (nextItem) {
        if (
          (prevItem.role === "mao_hiem" && (nextItem.role === "vua_tam" || nextItem.role === "an_toan")) ||
          (prevItem.role === "vua_tam" && nextItem.role === "an_toan")
        ) {
          promotions.push({
            rank: prevItem.rank,
            schoolCode: prevItem.school_code,
            majorName: prevItem.major_label,
            previousProb: prevItem.admit_prob,
            newProb: nextItem.admit_prob,
            previousRole: prevItem.role,
            newRole: nextItem.role,
            badge:
              nextItem.role === "vua_tam"
                ? "THĂNG HẠNG: MƠ ƯỚC ➔ VỪA TẦM"
                : "THĂNG HẠNG: VỪA TẦM ➔ AN TOÀN",
          });
        }
      }
    });
  }

  const allocationShifts: ClosedLoopAllocationShift[] = [];
  let nextRoiList: SubjectRoiMetric[] = [];
  let nextStudyPlan: StudyPlan = {
    totalAvailableHours: profile.availableHoursPerWeek || 52.5,
    allocations: prevAllocations,
    schedule: [],
    lastUpdated: new Date().toLocaleDateString("vi-VN"),
    convergenceVelocityNote: `Cập nhật sau đợt thi thử ${submission.testName}`,
  };

  if (primaryTarget) {
    nextRoiList = calculateSubjectRoiList(updatedProfile, primaryTarget, candidatesPool);
    nextStudyPlan = buildStudyPlan(updatedProfile, nextRoiList, primaryTarget, timeDeduction);

    nextStudyPlan.allocations.forEach((nextAlloc) => {
      const prevAlloc = prevAllocations.find((p) => p.subject === nextAlloc.subject);
      const prevH = prevAlloc ? prevAlloc.hoursPerWeek : 0;
      const deltaH = Math.round((nextAlloc.hoursPerWeek - prevH) * 10) / 10;
      if (Math.abs(deltaH) >= 0.5) {
        allocationShifts.push({
          subjectVi: nextAlloc.subjectVi,
          hoursDelta: deltaH,
          reason:
            deltaH > 0
              ? `Tăng +${deltaH}h/tuần do môn trở thành trọng tâm bứt phá điểm số sau đợt thi`
              : `Giảm ${deltaH}h/tuần do điểm số đã tiệm cận vùng an toàn`,
        });
      }
    });
  }

  const decisionReasoning = `Hệ thống đã tự động cập nhật điểm mới và điều chỉnh đồng bộ danh mục nguyện vọng cùng lịch học. Nguy cơ chưa trúng nguyện vọng nào thay đổi ${
    failRiskDelta > 0 ? "+" + (failRiskDelta * 100).toFixed(1) : (failRiskDelta * 100).toFixed(1)
  }%.`;

  const diff: ClosedLoopDiff = {
    testName: submission.testName,
    testDate: submission.testDate,
    reliabilityTier: submission.reliabilityTier,
    reliabilityWeight: omega,
    scoreChanges,
    portfolioImpact: {
      previousPFailAll: prevPFailAll,
      newPFailAll,
      failRiskDelta,
      promotions,
    },
    allocationShifts,
    decisionReasoning,
  };

  return {
    updatedProfile,
    diff,
    nextRoiList,
    nextStudyPlan,
  };
}
