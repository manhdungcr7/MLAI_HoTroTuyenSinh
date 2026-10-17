// Tách khỏi store.tsx để các module tính toán dùng được mà không kéo theo cả store (tránh vòng import).
import type { AppState } from "./store";
import { CAC_MON, type DiemThi, type LoaiDiem, type MonId } from "./types";

const trong = (): Record<MonId, number | null> => Object.fromEntries(CAC_MON.map((m) => [m, null])) as Record<MonId, number | null>;
const laDiem = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Điểm thi thử mới nhất từng môn (chỉ chuỗi `diemThi`); môn chưa thi thử là null. */
function thiThuMoiNhat(diemThi: DiemThi[]): Record<MonId, number | null> {
  const ra = trong();
  const moiNhat: Partial<Record<MonId, DiemThi>> = {};
  for (const d of diemThi) if (!moiNhat[d.mon] || d.ngay >= moiNhat[d.mon]!.ngay) moiNhat[d.mon] = d;
  for (const m of Object.keys(moiNhat) as MonId[]) ra[m] = moiNhat[m]!.diem;
  return ra;
}

/** Điểm hiện tại của từng môn: thi thật (nếu đã có) > thi thử gần nhất > điểm em nhập ở hồ sơ. Điểm MỤC TIÊU không bao giờ vào đây. */
export function diemHienTaiCuaTungMon(s: Pick<AppState, "hoSo" | "diemThi">): Record<MonId, number | null> {
  const ra = { ...s.hoSo.diem };
  const thu = thiThuMoiNhat(s.diemThi), that = s.hoSo.diemThiThat ?? {};
  for (const m of CAC_MON) { if (thu[m] !== null) ra[m] = thu[m]; if (laDiem(that[m])) ra[m] = that[m] as number; }
  return ra;
}

export interface DiemTheoLoai {
  /** Điểm thi tốt nghiệp THPT thật; môn chưa có là null. */
  thiThat: Record<MonId, number | null>;
  /** Điểm thi thử mới nhất; môn chưa thi thử là null (không lấy điểm hồ sơ thay). */
  thiThu: Record<MonId, number | null>;
  /** Điểm em tự nhập ở hồ sơ (khởi đầu). */
  hoSo: Record<MonId, number | null>;
  /** Điểm hiện tại dùng cho mọi phép so với điểm chuẩn (thi thật > thi thử > hồ sơ). Cùng giá trị `diemHienTaiCuaTungMon`. */
  hienTai: Record<MonId, number | null>;
  /** Alias của `hienTai` (tên Agent 1 đề xuất trong UX-AUDIT-2027). */
  hocHienTai: Record<MonId, number | null>;
  /** Điểm em muốn đạt từng môn; null khi chưa đặt. Chỉ để đặt mục tiêu, không phải điểm đã có. */
  mucTieu: Record<MonId, number | null>;
  /** Nguồn của điểm hiện tại theo môn, để màn hình ghi nhãn đúng loại. */
  nguon: Record<MonId, Exclude<LoaiDiem, "mucTieu" | "hocBa"> | null>;
}

/** Tách điểm theo loại để Khám phá/Nguyện vọng/Mục tiêu biết đang dùng loại nào. Không đổi trạng thái, không ghi gì. */
export function diemTheoLoai(s: Pick<AppState, "hoSo" | "diemThi">): DiemTheoLoai {
  const thiThu = thiThuMoiNhat(s.diemThi);
  const thiThat = trong(), mucTieu = trong(), nguon = Object.fromEntries(CAC_MON.map((m) => [m, null])) as DiemTheoLoai["nguon"];
  for (const m of CAC_MON) {
    const a = s.hoSo.diemThiThat?.[m], b = s.hoSo.diemMucTieuMon?.[m];
    thiThat[m] = laDiem(a) ? a : null;
    mucTieu[m] = laDiem(b) ? b : null;
    nguon[m] = thiThat[m] !== null ? "thiThat" : thiThu[m] !== null ? "thiThu" : s.hoSo.diem[m] !== null && s.hoSo.diem[m] !== undefined ? "thiThu" : null;
  }
  const hienTai = diemHienTaiCuaTungMon(s);
  return { thiThat, thiThu, hoSo: { ...s.hoSo.diem }, hienTai, hocHienTai: hienTai, mucTieu, nguon };
}
