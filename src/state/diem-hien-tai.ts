// Tách khỏi store.tsx để các module tính toán dùng được mà không kéo theo cả store (tránh vòng import).
import type { AppState } from "./store";
import type { DiemThi, MonId } from "./types";

/** Điểm hiện tại của từng môn: lấy lần thi thử gần nhất, nếu chưa có thì lấy từ hồ sơ. */
export function diemHienTaiCuaTungMon(s: Pick<AppState, "hoSo" | "diemThi">): Record<MonId, number | null> {
  const ra = { ...s.hoSo.diem };
  const moiNhat: Partial<Record<MonId, DiemThi>> = {};
  for (const d of s.diemThi) if (!moiNhat[d.mon] || d.ngay >= moiNhat[d.mon]!.ngay) moiNhat[d.mon] = d;
  for (const m of Object.keys(moiNhat) as MonId[]) ra[m] = moiNhat[m]!.diem;
  return ra;
}
