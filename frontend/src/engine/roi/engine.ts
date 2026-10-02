/**
 * FEATURE SUBJECT-ROI: TÍNH TOÁN ĐÒN BẨY MÔN HỌC & MARGINAL UTILITY
 * Đảm bảo: File < 350 lines, Zero UI dependencies, Unit-testable.
 */

import {
  StudentProfile,
  TargetProgram,
  SubjectRoiMetric,
  ExamScores,
} from "@/engine/types";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateCompositeScore } from "@/engine/scoring/composite";
import { calculateAdmitProbability, REACH_MAX_PROB } from "@/engine/admissions/probability";

export function calculateSubjectRoiList(
  profile: StudentProfile,
  target: TargetProgram,
  programs: TargetProgram[]
): SubjectRoiMetric[] {
  const activeSubs = COMBINATION_SUBJECTS[profile.activeCombination] || ["toan", "ly", "anh"];
  const roiResults: SubjectRoiMetric[] = [];

  const baseComposite = calculateCompositeScore(
    profile.examScores,
    profile.altScores,
    profile.priority,
    profile.activeCombination
  );

  // Điểm tốt nhất của học sinh trên các tổ hợp mà chương trình chấp nhận
  const bestScoreFor = (scores: ExamScores, p: TargetProgram) =>
    Math.max(0, ...p.combinations.map((c) => calculateCompositeScore(scores, profile.altScores, profile.priority, c)));
  const countWithinReach = (scores: ExamScores) =>
    programs.filter((p) => calculateAdmitProbability(bestScoreFor(scores, p), p.forecastP50) >= REACH_MAX_PROB).length;

  const baseEligibleCount = countWithinReach(profile.examScores);

  for (const subKey of activeSubs) {
    const currScore = profile.examScores[subKey as keyof ExamScores];
    if (currScore === null || currScore === undefined) continue; // Chưa có điểm môn này: không ước lượng
    const delta = 0.5; // Giả lập tăng 0.5 điểm
    const simScore = Math.min(10.0, currScore + delta);

    const simExamScores = { ...profile.examScores, [subKey]: simScore };
    const simComposite = calculateCompositeScore(
      simExamScores,
      profile.altScores,
      profile.priority,
      profile.activeCombination
    );

    const simEligibleCount = countWithinReach(simExamScores);

    const unlockedOptions = Math.max(0, simEligibleCount - baseEligibleCount);
    const gapReduction = Number((simComposite - baseComposite).toFixed(2));

    // Hàm trở lực nỗ lực biên: tăng từ 8.5 lên 9.0 khó gấp đôi tăng từ 6.5 lên 7.0
    const effortDifficulty = 1.0 + 1.5 * Math.pow(Math.max(0, currScore - 6.0) / 4.0, 2.0);

    const rawRoi = (unlockedOptions * 1.8 + gapReduction * 4.0) / effortDifficulty;
    const netRoi = Number(Math.min(10.0, Math.max(1.0, rawRoi)).toFixed(1));

    let tier: 1 | 2 | 3 = 2;
    let explanationVi = "";

    if (netRoi >= 6.5) {
      tier = 1; // Đòn bẩy vàng
      explanationVi = `Tăng thêm 0.5 điểm ${SUBJECT_LABELS_VI[subKey]} giúp bạn gần ${target.schoolCode} hơn ${gapReduction} điểm và có thêm ${unlockedOptions} ngành trong tầm với — nhiều hơn các môn khác.`;
    } else if (netRoi >= 4.0) {
      tier = 2; // Bổ trợ
      explanationVi = `Tăng thêm 0.5 điểm ${SUBJECT_LABELS_VI[subKey]} giúp bạn có thêm ${unlockedOptions} ngành trong tầm với.`;
    } else {
      tier = 3; // Bão hòa/Duy trì
      explanationVi = `${SUBJECT_LABELS_VI[subKey]} đang ${currScore} điểm. Tăng thêm điểm môn này ít thay đổi lựa chọn của bạn — nên giữ phong độ và ưu tiên môn khác.`;
    }

    roiResults.push({
      subject: subKey as keyof ExamScores,
      subjectVi: SUBJECT_LABELS_VI[subKey] || subKey,
      currentScore: currScore,
      simulatedScore: simScore,
      deltaScore: delta,
      unlockedOptionsCount: unlockedOptions,
      gapReduction,
      effortDifficulty: Number(effortDifficulty.toFixed(2)),
      netRoi,
      tier,
      explanationVi,
    });
  }

  return roiResults.sort((a, b) => b.netRoi - a.netRoi);
}
