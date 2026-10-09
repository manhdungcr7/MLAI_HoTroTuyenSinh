// Danh sách chương trình của một trường (id, tên ngành, điểm chuẩn mới nhất đang có) để người nhập CHỌN thay vì gõ mã ngành.
// Tệp JSON do `npx tsx scripts/sinh-chuong-trinh-cms.ts` sinh từ dữ liệu gốc; nạp lười để không làm nặng lần mở đầu tiên.
export interface ChuongTrinhTruong { id: string; nganh: string; namMoiNhat: number | null; diemMoiNhat: number | null; phuongThuc: string }
type Dong = [string, string, number | null, number | null, string];

let cache: Promise<Record<string, Dong[]>> | null = null;
const taiTatCa = () => (cache ??= import("./chuong-trinh-truong.json").then((m) => m.default as unknown as Record<string, Dong[]>));

export async function taiChuongTrinh(maTruong: string): Promise<ChuongTrinhTruong[]> {
  const t = await taiTatCa();
  return (t[maTruong.toUpperCase()] ?? []).map(([id, nganh, namMoiNhat, diemMoiNhat, phuongThuc]) => ({ id, nganh, namMoiNhat, diemMoiNhat, phuongThuc }));
}

/** "26,5" hoặc "26.5" thành số; rỗng hoặc sai thì null. */
export const docDiem = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export interface DongNhap { chuongTrinhId: string; diem: string }
export interface KetQuaKiemHangLoat { hopLe: { chuongTrinhId: string; diem: number }[]; loi: Record<string, string> }

/** Kiểm các dòng đã điền (dòng để trống bị bỏ qua). Điểm THPT thang 30. */
export function kiemTraHangLoat(dong: DongNhap[]): KetQuaKiemHangLoat {
  const hopLe: { chuongTrinhId: string; diem: number }[] = [];
  const loi: Record<string, string> = {};
  for (const d of dong) {
    if (d.diem.trim() === "") continue;
    const n = docDiem(d.diem);
    if (n === null) loi[d.chuongTrinhId] = "Nhập số, ví dụ 26,5.";
    else if (n < 10 || n > 30) loi[d.chuongTrinhId] = "Điểm thi THPT nằm trong khoảng 10 đến 30. Nếu là điểm khác thang, bỏ qua dòng này.";
    else hopLe.push({ chuongTrinhId: d.chuongTrinhId, diem: n });
  }
  return { hopLe, loi };
}

/** Mã bản ghi điểm chuẩn: cùng trường, năm, chương trình, phương thức, tổ hợp thì cùng mã, nên không tạo trùng. */
export const entityIdDiemChuan = (maTruong: string, nam: number, chuongTrinhId: string, phuongThuc: string, toHop: string) =>
  `${maTruong}-DC${nam}-${chuongTrinhId}-${phuongThuc.toLowerCase().replace(/[^a-z0-9]/g, "")}-${toHop.toLowerCase().replace(/[^a-z0-9]/g, "")}`.slice(0, 64);
