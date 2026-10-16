// Ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè). Dùng chung cho client và máy chủ để hạn mức AI reset đúng 00:00 giờ Asia/Ho_Chi_Minh.
const MS_7_GIO = 7 * 3600 * 1000;

/** "YYYY-MM-DD" của thời điểm `ms` (mili giây Unix) tính theo giờ Việt Nam. */
export function ngayVN(ms: number): string {
  return new Date(ms + MS_7_GIO).toISOString().slice(0, 10);
}
