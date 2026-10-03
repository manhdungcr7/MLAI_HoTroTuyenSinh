/** Định dạng hiển thị dùng chung. */

/** Xác suất hiển thị không bao giờ là 0% hay 100%: mô hình luôn có sai số. */
export function formatProbability(p: number): string {
  if (p >= 0.99) return "trên 99%";
  if (p < 0.01) return "dưới 1%";
  return `${Math.round(p * 100)}%`;
}
