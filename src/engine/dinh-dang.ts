export const dinhDang = (n: number | null | undefined, soLe = 1, fallback = "—"): string => {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return n.toFixed(soLe).replace(".", ",");
};

// Điểm có thể lẻ 2 chữ số (ưu tiên 0,25/0,75) nhưng 24,50 hiển thị thành 24,5.
export const dinhDangDiem = (n: number | null | undefined, fallback = "—"): string => {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return n.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
};

/** Số nguyên có dấu chấm ngăn cách hàng nghìn theo tiếng Việt: 3652 thành "3.652". */
export const dinhDangSo = (n: number | null | undefined, fallback = "—"): string => {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
