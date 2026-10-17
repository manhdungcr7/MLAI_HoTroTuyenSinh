import type { LuaChon } from "../../state/types";

/** Chỉ phân loại khi chứng cứ còn khớp đúng trị số của năm đang đọc. */
export function loaiDiemCuaNam(lc: Pick<LuaChon, "scoreEvidence" | "diemTheoNam" | "namDiem" | "diemMin">, nam: number) {
  const e = lc.scoreEvidence?.[String(nam)];
  const diem = lc.diemTheoNam?.[String(nam)] ?? (nam === lc.namDiem ? lc.diemMin : undefined);
  return e && e.score === diem && e.sourceUrl && e.checkedAt && e.checkedBy ? e.kind : undefined;
}

/** Chỉ phát hiện nguồn rõ ràng nói về điểm sàn. Tiêu đề hỗn hợp cần người đối chiếu. */
export function nguonChiNoiDiemSan(tieuDe: string): boolean {
  const chu = tieuDe.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
  return /diem san|nguong dam bao|nguong dau vao|diem nhan ho so/.test(chu) && !/diem chuan|diem trung tuyen/.test(chu);
}
