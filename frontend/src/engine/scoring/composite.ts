/**
 * MODULE SCORING: TÍNH ĐIỂM XÉT TUYỂN TỔ HỢP
 * Hỗ trợ các khối A00, A01, B00, C00, D01, D07, v.v.
 */

import { StudentProfile, ExamScores } from "@/engine/types";
import { COMBINATION_SUBJECTS } from "@/data/universities/combinations";
import { convertIeltsToEnglishScore, calculateTotalPriorityBonus } from "@/engine/admissions/priority";

// ============================================================================

/** Tổng ba môn thi THPT gốc; không gồm IELTS/quy đổi hay điểm ưu tiên. */
export function calculateRawExamCombinationScore(examScores: ExamScores, combination: string): number | null {
  const subjects = COMBINATION_SUBJECTS[combination];
  if (!subjects || subjects.length !== 3) return null;
  const scores = subjects.map((subject) => examScores[subject as keyof ExamScores]);
  if (scores.some((score) => typeof score !== "number" || !Number.isFinite(score))) return null;
  const clampedScores = scores.map((s) => Math.max(0, Math.min(10, s as number)));
  const sum = clampedScores.reduce<number>((acc, s) => acc + s, 0);
  return Math.min(30, Math.round(sum * 100) / 100);
}

/**
 * Phát hiện danh sách các môn thi còn thiếu đối với một tổ hợp cụ thể
 */
export function getMissingSubjectsForCombination(examScores: ExamScores, combination: string): string[] {
  const subjects = COMBINATION_SUBJECTS[combination];
  if (!subjects) return [];
  return subjects.filter((sub) => {
    const val = examScores[sub as keyof ExamScores];
    return typeof val !== "number" || !Number.isFinite(val);
  });
}

/**
 * Tính điểm tổ hợp cụ thể cho thí sinh
 * Có quy đổi chứng chỉ ngoại ngữ và cộng điểm ưu tiên theo quy chế.
 *
 * Trả về 0 (= "chưa đủ dữ liệu") khi tổ hợp không xác định hoặc thiếu môn — không tự ngoại suy điểm
 * các môn còn thiếu, vì điểm ngoại suy có thể đẩy một ngành khó vào nhóm "An toàn" sai.
 * `requireComplete` giữ lại để tương thích chữ ký cũ.
 */
export function calculateCompositeScore(
  examScores: ExamScores,
  altScores: StudentProfile["altScores"],
  priority: StudentProfile["priority"],
  combination: string,
  requireComplete: boolean = false
): number {
  const subjects = COMBINATION_SUBJECTS[combination];
  if (!subjects) return 0;
  let totalScore = 0;
  let validCount = 0;

  for (const sub of subjects) {
    let score = examScores[sub as keyof ExamScores];

    // Quy đổi IELTS sang môn Anh
    if (sub === "anh" && altScores?.ielts) {
      score = convertIeltsToEnglishScore(altScores.ielts, score);
    }

    if (score !== null && score !== undefined && typeof score === "number" && Number.isFinite(score)) {
      // Chặn biên [0, 10] bảo vệ trước dữ liệu nhập lỗi hoặc ngoại lai
      const clamped = Math.max(0, Math.min(10, score));
      totalScore += clamped;
      validCount++;
    }
  }

  void requireComplete;
  if (validCount < subjects.length) return 0;
  const baseScore = Math.min(30, totalScore);

  // Điểm ưu tiên khu vực & đối tượng (tuân thủ trần TT06/2026)
  const priorityBonus = priority ? calculateTotalPriorityBonus(priority, baseScore) : 0;

  return Math.min(30, Math.round((baseScore + priorityBonus) * 100) / 100);
}

