/**
 * MODULE SCORING: ĐỘ CO GIÃN ĐIỂM SỐ & TÍNH KHẢ THI TĂNG ĐIỂM
 * Phản ánh độ khó cận trên của các môn thi TN THPT (Logistic curve)
 */

import { ExamScores } from "@/engine/types";

/**
 * Hệ số co giãn độ khó theo môn thi tốt nghiệp THPT
 * Văn: khó đạt > 8.5 (kappa = 0.70)
 * Anh: luyện ngữ pháp/từ vựng có thể bứt phá nhanh (kappa = 1.10)
 * Toán, Lý, Hóa, Sinh: chuẩn phân hóa thông thường (kappa = 1.0)
 */
export function getSubjectElasticity(subject: keyof ExamScores | string): number {
  if (subject === "van") return 0.70;
  if (subject === "anh") return 1.10;
  return 1.0;
}

/**
 * Hàm tính độ khả thi tăng điểm dạng Logistic:
 * Feasibility = (1 / (1 + exp(alpha * (sCurrent - s0)))) * kappa
 * Càng gần 10 điểm, độ khả thi càng tiệm cận 0 (diminishing marginal returns)
 */
export function calculateScoreFeasibility(
  currentScore: number,
  subject: keyof ExamScores | string,
  s0: number = 7.5,
  alpha: number = 0.85
): number {
  const kappa = getSubjectElasticity(subject);
  const feasRaw = (1 / (1 + Math.exp(alpha * (currentScore - s0)))) * kappa;
  return Math.min(1.0, Math.max(0.15, feasRaw));
}
