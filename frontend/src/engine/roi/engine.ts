/**
 * Môn nào nên học thêm: mô phỏng tăng điểm từng môn của tổ hợp đang dùng cho ngành mục tiêu và đo
 * khả năng đỗ ngành đó cùng số ngành mới vào tầm. Không có phụ thuộc giao diện.
 */

import { StudentProfile, TargetProgram, SubjectRoiMetric, ExamScores } from "@/engine/types";
import { COMBINATION_SUBJECTS, SUBJECT_LABELS_VI } from "@/data/universities/combinations";
import { calculateAdmitProbability, REACH_MAX_PROB, sigmaScaleFor } from "@/engine/admissions/probability";
import { scoreForProgram } from "@/engine/scoring/method-score";

/** Mức tăng điểm giả lập cho mỗi môn. */
export const ROI_DELTA = 1;

type Meta = TargetProgram & { latestYear?: number; yearsOfData?: number };
const probabilityOf = (score: number, p: TargetProgram) => {
  const meta = p as Meta;
  return calculateAdmitProbability(score, p.forecastP50, 1.0, undefined, undefined, sigmaScaleFor(meta.latestYear, meta.yearsOfData));
};

export function calculateSubjectRoiList(profile: StudentProfile, target: TargetProgram, programs: TargetProgram[]): SubjectRoiMetric[] {
  const targetScore = scoreForProgram(profile, target);
  if (!targetScore) return [];
  const subjects = COMBINATION_SUBJECTS[targetScore.combo] ?? [];
  if (subjects.length === 0) return [];

  const countWithinReach = (scores: ExamScores) => {
    const simulated = { ...profile, examScores: scores };
    return programs.filter((p) => {
      const ms = scoreForProgram(simulated, p);
      return ms !== null && probabilityOf(ms.score, p) >= REACH_MAX_PROB;
    }).length;
  };
  const baseCount = countWithinReach(profile.examScores);
  const before = probabilityOf(targetScore.score, target);

  const results: SubjectRoiMetric[] = [];
  for (const subject of subjects) {
    const current = profile.examScores[subject as keyof ExamScores];
    if (typeof current !== "number" || current >= 10) continue; // chưa có điểm hoặc đã tối đa
    const simulatedScore = Math.min(10, current + ROI_DELTA);
    const simExam = { ...profile.examScores, [subject]: simulatedScore };
    const after = scoreForProgram({ ...profile, examScores: simExam }, target);
    results.push({
      subject: subject as keyof ExamScores,
      subjectVi: SUBJECT_LABELS_VI[subject] || subject,
      currentScore: current,
      simulatedScore,
      deltaScore: Number((simulatedScore - current).toFixed(2)),
      admitProbBefore: before,
      admitProbAfter: after ? probabilityOf(after.score, target) : before,
      unlockedOptionsCount: Math.max(0, countWithinReach(simExam) - baseCount),
    });
  }

  // Lợi nhiều nhất trước; cùng mức lợi thì môn đang thấp hơn (dễ nâng hơn) lên trước.
  const gain = (r: SubjectRoiMetric) => Math.round((r.admitProbAfter - r.admitProbBefore) * 100);
  return results.sort((a, b) => gain(b) - gain(a) || a.currentScore - b.currentScore || b.unlockedOptionsCount - a.unlockedOptionsCount);
}
