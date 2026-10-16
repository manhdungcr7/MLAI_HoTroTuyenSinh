// Mô hình tối ưu hoá danh mục nguyện vọng (Combinatorial Preference Portfolio Optimization).
// Decision Intelligence Engine cho Tuyển sinh Đại học Việt Nam.
//
// Bài toán thực tế:
//  Cổng tuyển sinh của Bộ GD&ĐT xét tuyển tuần tự từ NV1 đến NV_k.
//  Thí sinh chỉ trúng tuyển vào nguyện vọng cao nhất mà mình đủ điều kiện.
//  Nếu thí sinh đặt một ngành có điểm chuẩn thấp (xác suất đỗ 95%) ở NV1,
//  thì toàn bộ các NV2, NV3... (dù là ngành mơ ước Bách Khoa, CNTT) sẽ BỊ HỦY NGAY LẬP TỨC
//  khi thí sinh đủ điểm NV1. Đây là "Nghịch đảo thứ tự nguyện vọng" - lỗi chí mạng của hàng nghìn thí sinh mỗi năm.
//
// Mô hình giải quyết:
//  1. Tính xác suất trúng tuyển độc lập p_i cho từng nguyện vọng.
//  2. Tính xác suất đỗ ít nhất một nguyện vọng: P(>= 1) = 1 - \prod_{i=1}^k (1 - p_i).
//  3. Tính xác suất thực tế trúng vào từng nguyện vọng thứ j: P(trúng NV_j) = p_j * \prod_{m=1}^{j-1} (1 - p_m).
//  4. Phát hiện và cảnh báo nghịch đảo thứ tự (Inversion Detection).
//  5. Tự động đề xuất cấu trúc danh mục tối ưu đa mục tiêu (Multi-Objective Portfolio) thỏa mãn ngân sách và khu vực.

import type { DiemDayDu, HoSo, LuaChon } from "@/state/types";
import { tinhXacSuatTrungTuyen, type ThongSoXacSuat } from "@/engine/xac-suat-trung-tuyen";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { dungKhuVuc } from "@/features/kham-pha/phu-hop";
import { NGAN_SACH_TOI_DA } from "@/engine/phan-tich";

export interface PhapNghiemNguyenVong {
  id: string;
  thuTu: number; // 1-indexed (NV1, NV2, ...)
  lc: LuaChon;
  thongSo: ThongSoXacSuat | null;
  /** Xác suất thực tế được tuyển vào nguyện vọng này sau khi đã trượt các NV trước */
  xacSuatThucTe: number;
  /** Vi phạm thứ tự: đứng trước một nguyện vọng có điểm cao hơn / cạnh tranh hơn */
  biNghichDao: boolean;
  canhBaoNghichDao?: string;
  vuotNganSach: boolean;
}

export interface ChanDoanDanhMuc {
  soLuong: number;
  cacNguyenVong: PhapNghiemNguyenVong[];
  /** Xác suất đỗ ít nhất một nguyện vọng trong danh mục (0 - 100%) */
  xacSuatDoItNhatMotNV: number;
  /** Thứ tự nguyện vọng kỳ vọng sẽ trúng tuyển E[NV] */
  kyVongThuTuTrungTuyen: number | null;
  /** Đánh giá rủi ro danh mục */
  danhGiaRuiRo: "Rất nguy hiểm" | "Cần điều chỉnh" | "Hợp lý" | "Tối ưu xuất sắc";
  /** Danh sách cảnh báo rủi ro nghiêm trọng */
  canhBaoNghiemTrong: string[];
  /** Danh sách điểm mạnh của danh mục */
  diemManh: string[];
  /** Đề xuất cải thiện cụ thể */
  deXuatHanhDong: string[];
  /** Cơ cấu 3 tầng: Thử sức, Vừa sức, An toàn */
  coCau: {
    thuSuc: number;
    vuaSuc: number;
    anToan: number;
  };
}

const LAM_TRON = (n: number) => Math.round(n * 100) / 100;

export interface HoSoXetTuyenToiUu {
  nganSach?: HoSo["nganSach"];
  khuVuc?: string[];
  nganhQuanTam?: string[];
  uuTienTuyenSinh?: HoSo["uuTienTuyenSinh"] | null;
}

/**
 * Đánh giá toàn diện một danh mục nguyện vọng đã chọn của thí sinh
 */
export function danhGiaDanhMucToanDien(
  danhSachIds: string[],
  timLuaChon: (id: string) => LuaChon | undefined,
  diemThi: DiemDayDu,
  hoSo: HoSoXetTuyenToiUu
): ChanDoanDanhMuc {
  const nganSachToiDa = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : null;

  const cacNguyenVong: PhapNghiemNguyenVong[] = [];
  let tichXacSuatTruot = 1.0;
  let kyVongChiSo = 0;
  let tongXacSuatThucTe = 0;

  const validEntries = danhSachIds
    .map((id) => timLuaChon(id))
    .filter((lc): lc is LuaChon => lc !== undefined);

  // Bước 1: Tính xác suất độc lập cho từng nguyện vọng
  for (let i = 0; i < validEntries.length; i++) {
    const lc = validEntries[i];
    const tongMon = tongChoLuaChon(lc, diemThi);
    const thongSo = tinhXacSuatTrungTuyen(tongMon.tong, lc, hoSo.uuTienTuyenSinh);

    const vuotNganSach = nganSachToiDa !== null && (lc.hocPhiMin ?? 0) > nganSachToiDa;

    const pDocLap = thongSo ? thongSo.xacSuat : 0.5; // Giả định trung vị nếu chưa tính được điểm
    const xacSuatThucTe = LAM_TRON(pDocLap * tichXacSuatTruot);
    tichXacSuatTruot *= (1 - pDocLap);

    kyVongChiSo += (i + 1) * xacSuatThucTe;
    tongXacSuatThucTe += xacSuatThucTe;

    cacNguyenVong.push({
      id: lc.id,
      thuTu: i + 1,
      lc,
      thongSo,
      xacSuatThucTe: Math.round(xacSuatThucTe * 100),
      biNghichDao: false,
      vuotNganSach,
    });
  }

  // Bước 2: Phát hiện nghịch đảo thứ tự (Inversion Detection)
  // Nếu một nguyện vọng đứng trước có điểm chuẩn thấp hơn rõ rệt (> 1.2 điểm) hoặc xác suất đỗ cao hơn (> 35%) so với nguyện vọng đứng sau
  const canhBaoNghiemTrong: string[] = [];
  for (let i = 0; i < cacNguyenVong.length; i++) {
    for (let j = i + 1; j < cacNguyenVong.length; j++) {
      const nvTruoc = cacNguyenVong[i];
      const nvSau = cacNguyenVong[j];

      const pTruoc = nvTruoc.thongSo?.xacSuat ?? 0.5;
      const pSau = nvSau.thongSo?.xacSuat ?? 0.5;

      // Nguyện vọng trước rất dễ đỗ (>= 80%) mà nguyện vọng sau lại là ngành cạnh tranh (<= 50%)
      if (pTruoc >= 0.78 && pSau <= 0.52) {
        nvTruoc.biNghichDao = true;
        nvTruoc.canhBaoNghichDao = `NV${nvTruoc.thuTu} (${nvTruoc.lc.nganh} - ${nvTruoc.lc.truong}, xác suất đỗ ${nvTruoc.thongSo?.phanTram}%) đang đứng TRƯỚC NV${nvSau.thuTu} (${nvSau.lc.nganh} - ${nvSau.lc.truong}, xác suất ${nvSau.thongSo?.phanTram}%). Nếu đỗ NV${nvTruoc.thuTu}, hệ thống sẽ tự động hủy NV${nvSau.thuTu}!`;
        if (!canhBaoNghiemTrong.includes(nvTruoc.canhBaoNghichDao)) {
          canhBaoNghiemTrong.push(nvTruoc.canhBaoNghichDao);
        }
      }
    }
  }

  // Bước 3: Phân loại cơ cấu
  let thuSuc = 0;
  let vuaSuc = 0;
  let anToan = 0;

  cacNguyenVong.forEach((nv) => {
    if (!nv.thongSo) {
      vuaSuc++;
      return;
    }
    if (nv.thongSo.xacSuat < 0.45) thuSuc++;
    else if (nv.thongSo.xacSuat < 0.78) vuaSuc++;
    else anToan++;
  });

  const xacSuatDoItNhatMotNV = Math.round((1 - tichXacSuatTruot) * 100);
  const kyVongThuTuTrungTuyen = tongXacSuatThucTe > 0 ? LAM_TRON(kyVongChiSo / tongXacSuatThucTe) : null;

  // Điểm mạnh & đề xuất
  const diemManh: string[] = [];
  const deXuatHanhDong: string[] = [];

  if (xacSuatDoItNhatMotNV >= 95) {
    diemManh.push(`Tổng xác suất đỗ ít nhất một nguyện vọng đạt ${xacSuatDoItNhatMotNV}% (Vùng bảo vệ an toàn cao).`);
  } else if (xacSuatDoItNhatMotNV < 80) {
    deXuatHanhDong.push(`Tổng xác suất an toàn mới đạt ${xacSuatDoItNhatMotNV}%. Bạn nên bổ sung thêm ít nhất 1-2 nguyện vọng An toàn hoặc Dự phòng (điểm chuẩn thấp hơn điểm bạn từ 1.5 - 2.0 điểm).`);
  }

  if (anToan >= 1 && vuaSuc >= 1 && thuSuc >= 1) {
    diemManh.push("Cơ cấu danh mục phân bổ lý tưởng theo chiến lược 3 tầng: Có Thử sức (ước mơ), Vừa sức (trọng tâm) và An toàn (chốt chặn).");
  } else {
    if (anToan === 0) {
      deXuatHanhDong.push("Danh mục chưa có nguyện vọng An toàn nào! Nguy cơ trượt trắng nếu đề thi biến động hoặc điểm chuẩn tăng đột biến.");
    }
    if (vuaSuc === 0) {
      deXuatHanhDong.push("Thiếu nguyện vọng Vừa sức. Đây là vùng điểm rơi tối ưu nhất đối với năng lực hiện tại của bạn.");
    }
  }

  const vuotPhi = cacNguyenVong.filter((nv) => nv.vuotNganSach);
  if (vuotPhi.length > 0) {
    canhBaoNghiemTrong.push(`Có ${vuotPhi.length} nguyện vọng (${vuotPhi.map((v) => `NV${v.thuTu}`).join(", ")}) có học phí vượt ngân sách dự kiến của gia đình.`);
  }

  let danhGiaRuiRo: ChanDoanDanhMuc["danhGiaRuiRo"] = "Hợp lý";
  if (canhBaoNghiemTrong.length > 0 && anToan === 0) {
    danhGiaRuiRo = "Rất nguy hiểm";
  } else if (canhBaoNghiemTrong.length > 0 || anToan === 0 || xacSuatDoItNhatMotNV < 80) {
    danhGiaRuiRo = "Cần điều chỉnh";
  } else if (xacSuatDoItNhatMotNV >= 95 && thuSuc >= 1 && vuaSuc >= 2 && anToan >= 1) {
    danhGiaRuiRo = "Tối ưu xuất sắc";
  }

  return {
    soLuong: cacNguyenVong.length,
    cacNguyenVong,
    xacSuatDoItNhatMotNV,
    kyVongThuTuTrungTuyen,
    danhGiaRuiRo,
    canhBaoNghiemTrong,
    diemManh,
    deXuatHanhDong,
    coCau: { thuSuc, vuaSuc, anToan },
  };
}

/**
 * Tự động sắp xếp lại thứ tự danh mục để xoá bỏ hoàn toàn nguy cơ nghịch đảo thứ tự
 * (Nguyện vọng có xác suất đỗ thấp/điểm cao đứng trên, nguyện vọng an toàn đứng dưới).
 */
export function toiUuThuTuDanhMuc(
  danhSachIds: string[],
  timLuaChon: (id: string) => LuaChon | undefined,
  diemThi: DiemDayDu,
  hoSo: HoSoXetTuyenToiUu
): string[] {
  const entries = danhSachIds
    .map((id) => {
      const lc = timLuaChon(id);
      if (!lc) return null;
      const tongMon = tongChoLuaChon(lc, diemThi);
      const thongSo = tinhXacSuatTrungTuyen(tongMon.tong, lc, hoSo.uuTienTuyenSinh);
      return {
        id,
        lc,
        prob: thongSo ? thongSo.xacSuat : 0.5,
        diemChuan: lc.diemMin,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Sắp xếp tăng dần theo xác suất đỗ (Xác suất thấp / điểm cao lên trước, xác suất cao xuống sau)
  entries.sort((a, b) => {
    // Nếu xác suất chênh lệch rõ (> 8%), ưu tiên xếp xác suất thấp lên trước
    if (Math.abs(a.prob - b.prob) >= 0.08) {
      return a.prob - b.prob;
    }
    // Nếu xác suất gần nhau, ưu tiên điểm chuẩn cao hơn đứng trước
    return b.diemChuan - a.diemChuan;
  });

  return entries.map((e) => e.id);
}

/**
 * Thuật toán tối ưu hoá danh mục thông minh (Smart Portfolio Builder)
 * Lựa chọn ra K nguyện vọng tốt nhất từ toàn bộ dữ liệu 3.652 ngành
 * thoả mãn ngân sách, khu vực, ngành quan tâm và cấu trúc rủi ro cân bằng tối ưu.
 */
export function timKiemDanhMucToiUu(
  tatCa: LuaChon[],
  diemThi: DiemDayDu,
  hoSo: HoSoXetTuyenToiUu,
  soLuong = 5,
  chienLuoc: "can_bang" | "than_trong" | "but_pha" = "can_bang"
): LuaChon[] {
  const nganSachMax = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : Infinity;
  const khuVucHopLe = Array.isArray(hoSo.khuVuc) ? hoSo.khuVuc : [];
  const nganhQuanTam = Array.isArray(hoSo.nganhQuanTam) ? hoSo.nganhQuanTam : [];

  // Lọc sơ bộ các ngành khả thi
  const khaThi = tatCa
    .filter((lc) => {
      if ((lc.hocPhiMin ?? 0) > nganSachMax) return false;
      return true;
    })
    .map((lc) => {
      const tong = tongChoLuaChon(lc, diemThi).tong;
      const thongSo = tinhXacSuatTrungTuyen(tong, lc, hoSo.uuTienTuyenSinh);
      const hopKhuVuc = dungKhuVuc(lc, khuVucHopLe) === true;
      const hopNganh = nganhQuanTam.length === 0 || nganhQuanTam.includes(lc.nhomNganh);
      return { lc, thongSo, hopKhuVuc, hopNganh };
    })
    .filter((x): x is typeof x & { thongSo: ThongSoXacSuat } => x.thongSo !== null);

  // Phân nhóm theo 3 tầng
  const nhomThuSuc = khaThi.filter((x) => x.thongSo.xacSuat < 0.45);
  const nhomVuaSuc = khaThi.filter((x) => x.thongSo.xacSuat >= 0.45 && x.thongSo.xacSuat < 0.80);
  const nhomAnToan = khaThi.filter((x) => x.thongSo.xacSuat >= 0.80);

  // Hàm chấm điểm độ ưu tiên cho từng lựa chọn
  const chamDiemUuTien = (x: typeof khaThi[0]) => {
    let score = 0;
    if (x.hopNganh) score += 50;
    if (x.hopKhuVuc) score += 30;
    if (x.lc.daKiemChung) score += 10;
    if (x.lc.tiLeViecLam && x.lc.tiLeViecLam >= 90) score += 10;
    return score;
  };

  nhomThuSuc.sort((a, b) => chamDiemUuTien(b) - chamDiemUuTien(a) || b.lc.diemMin - a.lc.diemMin);
  nhomVuaSuc.sort((a, b) => chamDiemUuTien(b) - chamDiemUuTien(a) || b.lc.diemMin - a.lc.diemMin);
  nhomAnToan.sort((a, b) => chamDiemUuTien(b) - chamDiemUuTien(a) || b.lc.diemMin - a.lc.diemMin);

  // Phân bổ tỷ lệ theo chiến lược
  let targetThuSuc = 1;
  let targetVuaSuc = 2;
  let targetAnToan = 2;

  if (chienLuoc === "than_trong") {
    targetThuSuc = 0;
    targetVuaSuc = 2;
    targetAnToan = 3;
  } else if (chienLuoc === "but_pha") {
    targetThuSuc = 2;
    targetVuaSuc = 2;
    targetAnToan = 1;
  }

  const ketQua: LuaChon[] = [];

  // Lấy nhóm Thử sức
  for (const item of nhomThuSuc) {
    if (ketQua.length >= targetThuSuc) break;
    ketQua.push(item.lc);
  }

  // Lấy nhóm Vừa sức
  for (const item of nhomVuaSuc) {
    if (ketQua.length >= targetThuSuc + targetVuaSuc) break;
    if (!ketQua.some((k) => k.id === item.lc.id)) {
      ketQua.push(item.lc);
    }
  }

  // Lấy nhóm An toàn
  for (const item of nhomAnToan) {
    if (ketQua.length >= targetThuSuc + targetVuaSuc + targetAnToan || ketQua.length >= soLuong) break;
    if (!ketQua.some((k) => k.id === item.lc.id)) {
      ketQua.push(item.lc);
    }
  }

  // Nếu vẫn chưa đủ K nguyện vọng, lấy thêm từ nhóm Vừa sức hoặc An toàn còn lại
  if (ketQua.length < soLuong) {
    for (const item of [...nhomVuaSuc, ...nhomAnToan]) {
      if (ketQua.length >= soLuong) break;
      if (!ketQua.some((k) => k.id === item.lc.id)) {
        ketQua.push(item.lc);
      }
    }
  }

  // Đảm bảo thứ tự xuất ra là tối ưu (xác suất thấp lên trên, an toàn xuống dưới)
  return ketQua.sort((a, b) => {
    const tongA = tongChoLuaChon(a, diemThi).tong ?? a.diemMin;
    const tongB = tongChoLuaChon(b, diemThi).tong ?? b.diemMin;
    const pA = tinhXacSuatTrungTuyen(tongA, a, hoSo.uuTienTuyenSinh)?.xacSuat ?? 0.5;
    const pB = tinhXacSuatTrungTuyen(tongB, b, hoSo.uuTienTuyenSinh)?.xacSuat ?? 0.5;
    return pA - pB;
  });
}
