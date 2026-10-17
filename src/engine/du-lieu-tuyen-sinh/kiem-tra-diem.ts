/** Chỉ phát hiện nguồn rõ ràng nói về điểm sàn. Tiêu đề hỗn hợp cần người đối chiếu. */
export function nguonChiNoiDiemSan(tieuDe: string): boolean {
  const chu = tieuDe.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
  return /diem san|nguong dam bao|nguong dau vao|diem nhan ho so/.test(chu) && !/diem chuan|diem trung tuyen/.test(chu);
}
