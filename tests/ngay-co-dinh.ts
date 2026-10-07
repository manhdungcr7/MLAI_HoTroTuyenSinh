// Ngày cố định cho test xếp lịch, để kết quả không phụ thuộc đồng hồ máy.
// Thứ Ba 06/10/2026, 08:00 giờ địa phương.
export const NGAY_CO_DINH = new Date(2026, 9, 6, 8, 0, 0, 0);

/** Ngày thứ n tính từ NGAY_CO_DINH (0 = chính ngày đó), giữ 08:00 địa phương. */
export function ngayThu(n: number): Date {
  const d = new Date(NGAY_CO_DINH);
  d.setDate(d.getDate() + n);
  return d;
}
