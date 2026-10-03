/**
 * MODULE ADMISSIONS: QUY ĐỔI CHỨNG CHỈ & TÍNH ĐIỂM ƯU TIÊN
 * Tuân thủ Quy chế tuyển sinh Đại học của Bộ Giáo dục & Đào tạo.
 */

import { Priority, PriorityArea, PriorityObject } from "@/engine/types";

/**
 * Điểm cộng ưu tiên theo khu vực
 * KV1: +0.75, KV2-NT: +0.5, KV2: +0.25, KV3: 0.0
 */
export function calculateAreaPriority(area: PriorityArea): number {
  switch (area) {
    case "KV1":
      return 0.75;
    case "KV2-NT":
      return 0.5;
    case "KV2":
      return 0.25;
    case "KV3":
    default:
      return 0.0;
  }
}

/**
 * Điểm cộng ưu tiên theo đối tượng chính sách
 * UT1: +2.0, UT2: +1.0, none/UT3: 0.0
 */
export function calculateObjectPriority(object: PriorityObject): number {
  switch (object) {
    case "uu_tien_1":
      return 2.0;
    case "uu_tien_2":
      return 1.0;
    default:
      return 0.0;
  }
}

/**
 * Tính tổng điểm ưu tiên hợp lệ (có hiệu chỉnh giảm dần khi tổng điểm xét >= 22.5 theo quy chế mới)
 */
export function calculateTotalPriorityBonus(
  priority: Priority,
  rawTotalScore: number
): number {
  // TT06/2026: Trần điểm ưu tiên tối đa là 3.0 điểm
  const rawBonus = calculateAreaPriority(priority.area) + calculateObjectPriority(priority.object);
  const baseBonus = Math.min(3.0, rawBonus);
  if (baseBonus <= 0) return 0;

  // Công thức giảm điểm ưu tiên từ mức 22.5 điểm trở lên:
  // Điểm ưu tiên thực tế = Điểm ưu tiên quy chế * [(30 - Tổng điểm đạt được) / 7.5]
  if (rawTotalScore >= 22.5) {
    const scaleFactor = Math.max(0, (30 - rawTotalScore) / 7.5);
    return Math.min(3.0, Math.round(baseBonus * scaleFactor * 100) / 100);
  }

  return baseBonus;
}

/** Điểm Tiếng Anh quy đổi theo bảng của trường (mức cao nhất đạt được); null nếu IELTS thấp hơn mọi mức trong bảng. */
export function tableIeltsScore(ielts: number, table: { min: number; score: number }[]): number | null {
  let best: number | null = null;
  for (const row of table) if (ielts >= row.min && (best === null || row.score > best)) best = row.score;
  return best;
}
