// Mô hình tính xác suất trúng tuyển (Calibrated Admission Probability Model).
// TypeScript thuần, không phụ thuộc UI/React, độc lập và kiểm chứng được bằng toán học.
//
// Cơ sở lý thuyết:
//  1. Điểm xét tuyển = Điểm thi theo tổ hợp + Điểm ưu tiên (theo quy chế Bộ GD&ĐT, giảm từ 22.5 điểm).
//  2. Khoảng chênh z = (Điểm xét - Điểm chuẩn kỳ vọng) / Độ biến động tau.
//  3. tau được ước lượng từ độ lệch chuẩn lịch sử các năm, có Bayesian smoothing với độ biến động vĩ mô (tau_macro = 1.25).
//  4. Xác suất p được chuẩn hoá qua hàm logistic với độ dốc chuẩn (k = 1.65):
//     - z = 0 (điểm bằng đúng năm trước): p = 50%
//     - z = +1.5 (hơn 1.5 - 2.0 điểm): p >= 85% (Vùng An toàn)
//     - z = +2.5 (hơn 2.5 - 3.5 điểm): p >= 96% (Vùng Dự phòng vững chắc)
//     - z = -1.5 (kém 1.5 - 2.0 điểm): p <= 15% (Vùng Thử sức cao)
//
// Kết quả cung cấp khoảng tin cậy [thap, cao] phản ánh số lượng năm dữ liệu lịch sử có trong cơ sở dữ liệu.

import type { LuaChon } from "@/state/types";
import { diemUuTien, type UuTienTuyenSinh } from "@/engine/diem-uu-tien";

export interface ThongSoXacSuat {
  /** Xác suất trúng tuyển từ 0 đến 1 */
  xacSuat: number;
  /** Xác suất dạng phần trăm nguyên (0 - 100) */
  phanTram: number;
  /** Khoảng tin cậy [thấp, cao] dạng phần trăm (e.g. [72, 84]) */
  khoangTinCay: [number, number];
  /** Phân loại rủi ro chuẩn */
  nhanRuiRo: "Thử sức cao" | "Thử sức vừa" | "Vừa sức" | "An toàn" | "Rất an toàn";
  /** Chênh lệch điểm xét so với điểm chuẩn kỳ vọng (dương là thừa, âm là thiếu) */
  chenhDiem: number;
  /** Điểm xét đã cộng ưu tiên */
  diemXet: number;
  /** Mức điểm ưu tiên thực tế được cộng */
  diemUuTienThucTe: number;
  /** Điểm chuẩn kỳ vọng làm mốc tham chiếu */
  diemKyVong: number;
  /** Độ biến động chuẩn hoá tau */
  doBienDongTau: number;
  /** Số năm điểm lịch sử có trong dữ liệu */
  soNamLichSu: number;
  /** Khuyến nghị hành động chiến lược */
  khuyenNghi: string;
}

const DO_BIEN_DONG_MACRO = 1.25;
const HE_SO_DOC_LOGISTIC = 1.65;
const LAM_TRON_2 = (n: number) => Math.round(n * 100) / 100;
const KEP = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Tính điểm chuẩn kỳ vọng và độ biến động thực tế từ chuỗi điểm lịch sử.
 */
export function tinhKyVongVaBienDong(diemTheoNam: Record<string, number> | undefined, _namMoiNhat = 2025): {
  kyVong: number;
  tau: number;
  soNam: number;
} {
  if (!diemTheoNam || Object.keys(diemTheoNam).length === 0) {
    return { kyVong: 24.0, tau: DO_BIEN_DONG_MACRO, soNam: 0 };
  }

  const entries = Object.entries(diemTheoNam)
    .map(([n, d]) => [Number(n), d] as [number, number])
    .filter(([n, d]) => Number.isInteger(n) && Number.isFinite(d) && d >= 10 && d <= 30)
    .sort((a, b) => b[0] - a[0]); // Mới nhất lên đầu

  if (entries.length === 0) {
    return { kyVong: 24.0, tau: DO_BIEN_DONG_MACRO, soNam: 0 };
  }

  const soNam = entries.length;
  const diemMoiNhat = entries[0][1];

  if (soNam === 1) {
    // Chỉ có 1 năm: Dùng chính điểm đó làm kỳ vọng, độ biến động thận trọng cao hơn
    return { kyVong: diemMoiNhat, tau: 1.45, soNam: 1 };
  }

  if (soNam === 2) {
    const diemTruoc = entries[1][1];
    // Trọng số 0.65 cho năm mới nhất, 0.35 cho năm liền trước
    const kyVong = LAM_TRON_2(0.65 * diemMoiNhat + 0.35 * diemTruoc);
    const chenh = Math.abs(diemMoiNhat - diemTruoc);
    const tau = LAM_TRON_2(KEP(0.5 * chenh + 0.5 * DO_BIEN_DONG_MACRO, 0.85, 2.4));
    return { kyVong, tau, soNam: 2 };
  }

  // Từ 3 năm trở lên: Tính trọng số phân rã thời gian (Exponential decay weights)
  let tongTrongSo = 0;
  let tongDiemCoTrongSo = 0;
  const cacDiem = entries.slice(0, 4);

  cacDiem.forEach(([, d], index) => {
    const w = Math.pow(0.6, index); // Năm mới nhất w=1.0, năm trước w=0.6, năm trước nữa w=0.36
    tongTrongSo += w;
    tongDiemCoTrongSo += d * w;
  });

  const kyVong = LAM_TRON_2(tongDiemCoTrongSo / tongTrongSo);

  // Tính độ lệch chuẩn
  const trungBinh = cacDiem.reduce((s, [, d]) => s + d, 0) / cacDiem.length;
  const phuongSai = cacDiem.reduce((s, [, d]) => s + Math.pow(d - trungBinh, 2), 0) / (cacDiem.length - 1);
  const doLechChuan = Math.sqrt(phuongSai);

  // Bayesian smoothing với prior biến động toàn quốc
  const tau = LAM_TRON_2(KEP(0.6 * doLechChuan + 0.4 * DO_BIEN_DONG_MACRO, 0.8, 2.2));

  return { kyVong, tau, soNam };
}

/**
 * Mô hình dưới đây CHƯA được kiểm định hiệu chỉnh trên dữ liệu thật (khác với `du-bao-diem-chuan.ts` đã có kiểm định bỏ-một-năm).
 * Vì vậy không màn hình nào được hiển thị `xacSuat`/`phanTram` như "xác suất đậu". Chỉ đổi thành true khi có báo cáo hiệu chỉnh kèm theo;
 * `tests/trang-thai-du-lieu.test.ts` kiểm không có mã giao diện hay máy chủ nào gọi hàm này.
 */
export const XAC_SUAT_DA_HIEU_CHINH = false;

/**
 * Tính xác suất trúng tuyển được hiệu chuẩn (Calibrated Probability)
 * @param diemThiRaw Điểm thi tổng 3 môn của tổ hợp (chưa cộng ưu tiên)
 * @param lc Chương trình đào tạo / ngành tuyển sinh
 * @param uuTien Thông tin đối tượng và khu vực ưu tiên
 */
export function tinhXacSuatTrungTuyen(
  diemThiRaw: number | null | undefined,
  lc: LuaChon,
  uuTien?: UuTienTuyenSinh | null
): ThongSoXacSuat | null {
  if (diemThiRaw === null || diemThiRaw === undefined || !Number.isFinite(diemThiRaw)) {
    return null;
  }

  const { kyVong, tau, soNam } = tinhKyVongVaBienDong(lc.diemTheoNam, lc.namDiem);

  // Tính điểm ưu tiên theo đúng quy chế Bộ GD&ĐT (giảm tuyến tính nếu >= 22.5)
  let mucUuTienGoc = 0;
  if (uuTien) {
    const MUC_KV: Record<string, number> = { KV1: 0.75, "KV2-NT": 0.5, KV2: 0.25, KV3: 0 };
    const MUC_DT: Record<string, number> = { khong: 0, UT1: 2.0, UT2: 1.0 };
    mucUuTienGoc = (uuTien.khuVuc ? MUC_KV[uuTien.khuVuc] ?? 0 : 0) + (uuTien.doiTuong ? MUC_DT[uuTien.doiTuong] ?? 0 : 0);
  }

  const diemHopLe = Math.max(0, Math.min(30, diemThiRaw));
  const utThucTe = diemUuTien(diemHopLe, mucUuTienGoc);
  const diemXet = LAM_TRON_2(Math.min(30, diemHopLe + utThucTe));
  const chenhDiem = LAM_TRON_2(diemXet - kyVong);

  // Tính z-score chuẩn hoá (đảm bảo tau không bao giờ = 0)
  const tauAnToan = Math.max(0.5, Number.isFinite(tau) ? tau : DO_BIEN_DONG_MACRO);
  const z = chenhDiem / tauAnToan;

  // Logistic function: P = 1 / (1 + exp(-k * z))
  const rawProb = 1 / (1 + Math.exp(-HE_SO_DOC_LOGISTIC * z));

  // Giới hạn xác suất thực tế không bao giờ là 0% hay 100% tuyệt đối do biến động đề thi & chỉ tiêu
  const xacSuat = KEP(LAM_TRON_2(rawProb), 0.02, 0.98);
  const phanTram = Math.round(xacSuat * 100);

  // Độ rộng khoảng tin cậy phụ thuộc vào số năm dữ liệu lịch sử
  const doRongKhoang = soNam >= 3 ? 0.06 : soNam === 2 ? 0.10 : 0.15;
  const ciLow = Math.round(KEP(xacSuat - doRongKhoang, 0.01, 0.97) * 100);
  const ciHigh = Math.round(KEP(xacSuat + doRongKhoang, 0.03, 0.99) * 100);

  // Xác định nhãn rủi ro & khuyến nghị
  let nhanRuiRo: ThongSoXacSuat["nhanRuiRo"];
  let khuyenNghi: string;

  if (xacSuat >= 0.92) {
    nhanRuiRo = "Rất an toàn";
    khuyenNghi = "Xác suất đỗ rất cao. Thích hợp làm chốt chặn an toàn cuối cùng hoặc dự phòng vững chắc.";
  } else if (xacSuat >= 0.78) {
    nhanRuiRo = "An toàn";
    khuyenNghi = "Điểm của bạn cao hơn mốc dự báo an toàn. Rất vững tâm làm nguyện vọng bảo hiểm.";
  } else if (xacSuat >= 0.45) {
    nhanRuiRo = "Vừa sức";
    khuyenNghi = "Điểm thi nằm sát vùng điểm chuẩn. Đây là nhóm mục tiêu thực tế nhất cần tập trung.";
  } else if (xacSuat >= 0.20) {
    nhanRuiRo = "Thử sức vừa";
    khuyenNghi = "Điểm hiện tại hơi thấp hơn điểm chuẩn (0.5 - 1.2 điểm). Cần bứt phá thêm điểm ở kỳ thi thật.";
  } else {
    nhanRuiRo = "Thử sức cao";
    khuyenNghi = "Cạnh tranh rất gắt gao (cách biệt > 1.5 điểm). Chỉ nên đặt ở NV1 hoặc NV2 làm nguyện vọng ước mơ.";
  }

  return {
    xacSuat,
    phanTram,
    khoangTinCay: [ciLow, ciHigh],
    nhanRuiRo,
    chenhDiem,
    diemXet,
    diemUuTienThucTe: utThucTe,
    diemKyVong: kyVong,
    doBienDongTau: tau,
    soNamLichSu: soNam,
    khuyenNghi,
  };
}
