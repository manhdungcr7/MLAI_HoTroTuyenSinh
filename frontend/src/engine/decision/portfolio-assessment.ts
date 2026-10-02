/**
 * Đánh giá cơ cấu danh sách nguyện vọng — dùng chung cho Tổng quan và Chiến lược nguyện vọng
 * để hai màn hình luôn nói cùng một điều.
 */

export type PortfolioRiskLevel = "empty" | "high" | "medium" | "ok";

export interface PortfolioAssessment {
  level: PortfolioRiskLevel;
  /** Một câu ngắn, dễ hiểu, hành động được */
  messageVi: string;
}

// Ngưỡng chiến lược (không phải quy chế): tối thiểu 2 lựa chọn An toàn, khả năng trượt hết ≤ 5%
export const MIN_SAFE_CHOICES = 2;
export const MAX_ACCEPTABLE_FAIL_ALL = 0.05;

export function assessPortfolio(
  counts: { reach: number; target: number; safe: number },
  pFailAll: number
): PortfolioAssessment {
  const total = counts.reach + counts.target + counts.safe;
  // Không hiển thị "0.0%" (trông như chắc chắn) — mô hình luôn có sai số
  const failPct = pFailAll < 0.001 ? "dưới 0.1" : (pFailAll * 100).toFixed(1);

  if (total === 0) {
    return { level: "empty", messageVi: "Chưa có nguyện vọng nào trong danh sách." };
  }
  if (counts.safe === 0 && counts.target === 0) {
    return {
      level: "high",
      messageVi: `Tất cả nguyện vọng đều ở nhóm Thử sức (khả năng không đỗ nguyện vọng nào ${failPct}%). Hãy thêm ít nhất ${MIN_SAFE_CHOICES} nguyện vọng An toàn.`,
    };
  }
  if (counts.safe < MIN_SAFE_CHOICES) {
    return {
      level: pFailAll > MAX_ACCEPTABLE_FAIL_ALL ? "high" : "medium",
      messageVi: `Chỉ có ${counts.safe} nguyện vọng An toàn. Nên có ít nhất ${MIN_SAFE_CHOICES} để giảm rủi ro trượt hết (hiện ${failPct}%).`,
    };
  }
  if (pFailAll > MAX_ACCEPTABLE_FAIL_ALL) {
    return {
      level: "medium",
      messageVi: `Khả năng không đỗ nguyện vọng nào ước tính ${failPct}%, cao hơn mức 5%. Cân nhắc thêm lựa chọn có điểm chuẩn thấp hơn.`,
    };
  }
  return {
    level: "ok",
    messageVi: `Danh sách có ${counts.safe} lựa chọn An toàn; khả năng không đỗ nguyện vọng nào ước tính ${failPct}%. Đây là ước tính, không phải cam kết.`,
  };
}
