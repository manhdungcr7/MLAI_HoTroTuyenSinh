/**
 * Định dạng hiển thị dùng chung. Giá trị `null` nghĩa là chưa có dữ liệu đã xác thực —
 * luôn hiển thị rõ thay vì điền số mặc định.
 */

export const NO_DATA_LABEL = "Đang cập nhật đề án";

export function formatTuitionPerYear(tuitionVnd: number | null | undefined): string {
  if (tuitionVnd === 0) return "Miễn học phí";
  if (!tuitionVnd) return "Đang cập nhật đề án";
  return `${Math.round(tuitionVnd / 1_000_000)} tr/năm`;
}

export function formatEmploymentRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "Đang cập nhật đề án";
  return `${rate}%`;
}

/** Học phí chưa biết thì không loại lựa chọn khỏi bộ lọc ngân sách (chỉ gắn nhãn). */
export function isWithinBudget(tuitionVnd: number | null | undefined, budgetVnd: number, tolerance = 1.15): boolean {
  if (!tuitionVnd) return true;
  return tuitionVnd <= budgetVnd * tolerance;
}

/** Xác suất hiển thị không bao giờ là 0% hay 100% — mô hình luôn có sai số. */
export function formatProbability(p: number): string {
  if (p >= 0.99) return "trên 99%";
  if (p < 0.01) return "dưới 1%";
  return `${Math.round(p * 100)}%`;
}
