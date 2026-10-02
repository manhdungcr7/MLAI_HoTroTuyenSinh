import { StudentProfile, TargetProgram, ExamScores } from "@/engine/types";
import { DEFAULT_STUDENT_PROFILE } from "@/data/seed/personas";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";
import { calculateSubjectRoiList } from "@/engine/roi/engine";

export interface SubjectRoiDetail {
  subject: keyof ExamScores;
  subjectVi: string;
  currentScore: number;
  simulatedScore: number;
  deltaScore: number;
  unlockedOptionsCount: number;
  gapReduction: number;
  effortDifficulty: number;
  netRoi: number;
  tier: 1 | 2 | 3;
  leverageRank: number;
  recommendedTimePct: number;
  tierLabelVi: string;
  explanationVi: string;
}

export interface SubjectRoiAnalysis {
  roiList: SubjectRoiDetail[];
  topLeverageSubject: SubjectRoiDetail | null;
  totalUnlockedOpportunities: number;
  maxGapReduction: number;
  strategicRecommendationVi: string;
  chartData: {
    subject: string;
    roi: number;
    unlocked: number;
    gapReduction: number;
    tier: number;
    currentScore: number;
    simulatedScore: number;
  }[];
}

/**
 * Selector trình diễn: Nhận SubjectRoiMetric[] từ calculateSubjectRoiList (Single Source of Truth)
 * và định dạng cấu trúc view-model phân tích đòn bẩy môn học.
 */
export function selectSubjectRoiAnalysis(
  profile: StudentProfile | null | undefined,
  target: TargetProgram | null | undefined,
  programs: TargetProgram[] | null | undefined,
  deltaScore: number = 0.5
): SubjectRoiAnalysis {
  const safeProfile = profile && profile.examScores ? profile : DEFAULT_STUDENT_PROFILE;
  const safeTarget = target && target.programId ? target : DECISION_PROGRAM_POOL[0];
  const safePrograms = programs && programs.length > 0 ? programs : DECISION_PROGRAM_POOL;

  // Gọi trực tiếp calculateSubjectRoiList — nguồn chân lý duy nhất cho tính toán ROI đòn bẩy môn học
  const baseRoiList = calculateSubjectRoiList(safeProfile, safeTarget, safePrograms);

  const sorted = [...baseRoiList].sort((a, b) => b.netRoi - a.netRoi);
  const roiList: SubjectRoiDetail[] = sorted.map((item, idx) => {
    const isTop = idx === 0;
    const tier = isTop ? 1 : item.tier;
    const recommendedTimePct = isTop ? 60 : tier === 2 ? 30 : 10;
    const tierLabelVi = isTop ? "Nên ưu tiên nhất" : tier === 2 ? "Ưu tiên vừa" : "Giữ phong độ";
    return {
      ...item,
      leverageRank: idx + 1,
      tier,
      recommendedTimePct,
      tierLabelVi,
    };
  });

  const topLeverageSubject = roiList[0] || null;
  const totalUnlockedOpportunities = roiList.reduce((acc, curr) => acc + curr.unlockedOptionsCount, 0);
  const maxGapReduction = topLeverageSubject ? topLeverageSubject.gapReduction : 0;

  const strategicRecommendationVi = topLeverageSubject
    ? `Nên ưu tiên ${topLeverageSubject.subjectVi}: tăng ${deltaScore} điểm môn này giúp bạn có thêm ${topLeverageSubject.unlockedOptionsCount} ngành trong tầm với — nhiều hơn các môn khác.`
    : "Nhập đủ điểm các môn để xem môn nên ưu tiên.";

  const chartData = roiList.map((r) => ({
    subject: r.subjectVi,
    roi: r.netRoi,
    unlocked: r.unlockedOptionsCount,
    gapReduction: r.gapReduction,
    tier: r.tier,
    currentScore: r.currentScore,
    simulatedScore: r.simulatedScore,
  }));

  return {
    roiList,
    topLeverageSubject,
    totalUnlockedOpportunities,
    maxGapReduction,
    strategicRecommendationVi,
    chartData,
  };
}
