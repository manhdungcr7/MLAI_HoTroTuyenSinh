// Dự báo KHOẢNG điểm chuẩn năm tuyển sinh tới từ chính các biến động đã xảy ra trong dữ liệu thật. TypeScript thuần, không React.
//
// Cách làm (đơn giản, kiểm chứng được, không hộp đen):
//  1. Gom mọi cặp hai năm liền nhau của cùng một chương trình xét điểm thi THPT (thang 30): "điểm năm sau trừ điểm năm trước".
//  2. Tâm dự báo là điểm năm mới nhất (giữ nguyên). Khoảng = điểm đó cộng phân vị 10 và phân vị 90 của biến động, nhân hệ số nở.
//  3. Dự báo xa hơn một năm thì khoảng nở thêm theo căn bậc hai số năm (các năm xem như độc lập).
//
// Vì sao tâm là điểm năm cuối mà không cộng trung vị, và không tách riêng theo nhóm ngành: kiểm định bỏ-một-năm trên dữ liệu thật
// (xem tests/du-bao-diem-chuan.test.ts) cho thấy cộng trung vị không giảm sai số, còn tách theo nhóm ngành làm khoảng phủ kém đi vì mỗi nhóm ít mẫu.
// Hệ số nở HE_SO_NO_RONG chọn bằng chính kiểm định đó, để khoảng "80%" thật sự phủ xấp xỉ 80% trong các năm bình thường.
//
// Đây KHÔNG phải xác suất đậu. Nó nói: "nếu năm tới điểm chuẩn biến động giống các năm trước thì rơi vào khoảng này".
// Năm 2025 biến động mạnh hơn hẳn các năm khác (độ lệch chuẩn 2,6 so với 1,8) nên khoảng phủ thấp hơn; khi có thay đổi quy chế,
// đề thi hay chỉ tiêu, khoảng thực tế còn rộng hơn khoảng này.
import type { LuaChon } from "@/state/types";

export interface ThongKeBienDong {
  /** Mọi biến động (điểm năm sau trừ điểm năm trước), sắp tăng dần. */
  tatCa: number[];
}

export interface DuBaoDiemChuan {
  namDuBao: number;
  namCuoi: number;
  diemCuoi: number;
  /** Mức giữa của dự báo: bằng điểm năm mới nhất. */
  kyVong: number;
  thap: number;
  cao: number;
  /** Mức tin cậy danh nghĩa của khoảng (phân vị 10 đến 90). Mức phủ thực đo được ghi ở docs/DU-LIEU.md. */
  mucTinCay: 0.8;
  /** Số cặp năm làm cơ sở. */
  soMau: number;
  /** Câu cảnh báo khi dự báo yếu (dữ liệu cũ, ít mẫu). */
  luuY: string[];
}

/** Hệ số nở khoảng, chọn bằng kiểm định bỏ-một-năm: phủ trung bình 84% (92% năm 2023, 93% năm 2024, 68% năm 2025 là năm biến động bất thường). */
export const HE_SO_NO_RONG = 1.3;
/** Chỉ dùng biến động từ năm này trở đi (các năm trước quá ít mẫu: 22 cặp). */
export const NAM_BIEN_DONG_SOM_NHAT = 2023;
/** Chỉ dự báo khi điểm mới nhất cách năm dự báo không quá số năm này. */
export const TOI_DA_NAM_XA = 2;
const DIEM_TOI_THIEU = 10, DIEM_TOI_DA = 30;

const hopLe = (d: number) => Number.isFinite(d) && d >= DIEM_TOI_THIEU && d <= DIEM_TOI_DA;

/** Các năm điểm THPT hợp lệ của một chương trình, tăng dần. Chỉ chương trình xét điểm thi THPT (hoặc chưa ghi phương thức nhưng có điểm thang 30). */
function chuoiNam(lc: LuaChon): [number, number][] {
  if (lc.phuongThuc && lc.phuongThuc !== "THPT") return [];
  return Object.entries(lc.diemTheoNam ?? {}).map(([n, d]) => [Number(n), d] as [number, number]).filter(([n, d]) => Number.isInteger(n) && hopLe(d)).sort((a, b) => a[0] - b[0]);
}

/**
 * Tính phân bố biến động từ toàn bộ danh sách chương trình. Chỉ nhận hai năm liền nhau để không trộn biến động nhiều năm.
 * `boQuaNam`: bỏ các cặp có năm sau bằng năm này (kiểm định bỏ-một-năm, không để lộ năm cần đoán).
 */
export function thongKeBienDong(danhSach: readonly LuaChon[], boQuaNam?: number): ThongKeBienDong {
  const tatCa: number[] = [];
  for (const lc of danhSach) {
    const c = chuoiNam(lc);
    for (let i = 1; i < c.length; i++) {
      if (c[i][0] - c[i - 1][0] !== 1 || c[i][0] < NAM_BIEN_DONG_SOM_NHAT || c[i][0] === boQuaNam) continue;
      tatCa.push(c[i][1] - c[i - 1][1]);
    }
  }
  tatCa.sort((a, b) => a - b);
  return { tatCa };
}

/** Phân vị p (0..1) của mảng đã sắp, nội suy tuyến tính. */
export function phanVi(daSapXep: readonly number[], p: number): number {
  if (daSapXep.length === 0) return NaN;
  const vt = (daSapXep.length - 1) * Math.min(1, Math.max(0, p));
  const duoi = Math.floor(vt), tren = Math.ceil(vt);
  return daSapXep[duoi] + (daSapXep[tren] - daSapXep[duoi]) * (vt - duoi);
}

const lam2 = (n: number) => Math.round(n * 100) / 100;
const kep = (n: number) => Math.min(DIEM_TOI_DA, Math.max(DIEM_TOI_THIEU, n));

/** Dự báo khoảng điểm chuẩn năm `namDuBao` cho một chương trình. Trả null khi không có điểm THPT hợp lệ hoặc thiếu dữ liệu biến động. */
export function duBaoDiemChuan(lc: LuaChon, tk: ThongKeBienDong, namDuBao: number): DuBaoDiemChuan | null {
  const c = chuoiNam(lc);
  if (c.length === 0) return null;
  const [namCuoi, diemCuoi] = c[c.length - 1];
  const k = namDuBao - namCuoi;
  if (k < 1) return null; // đã có điểm của chính năm đó: không dự báo
  if (k > TOI_DA_NAM_XA) return null; // điểm cuối quá cũ thì khoảng rộng đến mức vô nghĩa: thà không đưa ra
  if (tk.tatCa.length < 30) return null;

  const nopRong = HE_SO_NO_RONG * Math.sqrt(k);
  const thap = kep(diemCuoi + phanVi(tk.tatCa, 0.1) * nopRong);
  const cao = kep(diemCuoi + phanVi(tk.tatCa, 0.9) * nopRong);

  const luuY: string[] = [];
  if (k > 1) luuY.push(`Điểm mới nhất của ngành là năm ${namCuoi}, cách ${k} năm nên khoảng dự kiến rộng hơn.`);
  if (c.length === 1) luuY.push("Ngành này mới có điểm của một năm, nên khoảng dựa vào biến động chung của các ngành khác.");

  return { namDuBao, namCuoi, diemCuoi, kyVong: lam2(diemCuoi), thap: lam2(thap), cao: lam2(cao), mucTinCay: 0.8, soMau: tk.tatCa.length, luuY };
}

export type ViTriSoVoiDuBao = "caoHonCa" | "tren" | "trongKhoang" | "duoi" | "thapHonCa";

/** Điểm của em nằm ở đâu so với khoảng dự kiến. Chỉ mô tả vị trí, không nói khả năng đậu. */
export function viTriSoVoiDuBao(diemEm: number, d: DuBaoDiemChuan): ViTriSoVoiDuBao {
  if (diemEm >= d.cao) return "caoHonCa";
  if (diemEm >= d.kyVong) return "tren";
  if (diemEm >= d.thap) return "trongKhoang";
  // dưới cận thấp: phân biệt "hơi thấp" và "thấp hơn cả"
  return diemEm >= d.thap - 1 ? "duoi" : "thapHonCa";
}

export const MO_TA_VI_TRI: Record<ViTriSoVoiDuBao, string> = {
  caoHonCa: "Điểm của em cao hơn cả mức dự kiến cao nhất. Nếu năm tới điểm chuẩn biến động như các năm trước, em vẫn ở phía trên.",
  tren: "Điểm của em nằm trên mức giữa của khoảng dự kiến. Còn lệ thuộc điểm chuẩn năm tới thực sự thế nào.",
  trongKhoang: "Điểm của em nằm trong khoảng dự kiến, dưới mức giữa. Kết quả có thể đi cả hai hướng.",
  duoi: "Điểm của em hơi thấp hơn mức dự kiến thấp nhất. Chỉ khi điểm chuẩn năm tới giảm nhiều hơn các năm trước thì em mới kịp.",
  thapHonCa: "Điểm của em thấp hơn khá xa mức dự kiến thấp nhất. Ngành này đang là mục tiêu cần thêm nhiều điểm.",
};

/** Năm tuyển sinh tiếp theo chưa có điểm chuẩn: sau tháng 8 (điểm chuẩn năm nay đã công bố) là năm sau, trước đó là năm nay. */
export function namTuyenSinhToi(bayGio: Date = new Date()): number {
  return bayGio.getMonth() >= 7 ? bayGio.getFullYear() + 1 : bayGio.getFullYear();
}
