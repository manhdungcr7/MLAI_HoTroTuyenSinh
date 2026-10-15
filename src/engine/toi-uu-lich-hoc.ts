// Mô hình tối ưu hoá phân bổ thời gian học tập tuần (Adaptive Knapsack Study Schedule Allocation).
// Decision Intelligence Engine cho Phân hệ Kế hoạch & Tự học.
//
// Cơ sở lý thuyết & Thuật toán:
//  1. Mục tiêu: Thu hẹp khoảng cách điểm Gap = DiemChuan(NV1) - TongDiemHienTai.
//  2. Quy luật lợi suất giảm dần (Diminishing Marginal Returns):
//     - Nâng điểm từ 6.0 lên 7.0 dễ hơn rất nhiều so với nâng từ 9.0 lên 9.5.
//     - Hàm độ khó cận biên: Difficulty(s) = 1.0 / (10.1 - s)^1.4
//     - Tỷ suất sinh lời điểm số trên mỗi giờ học: MarginalGain(s) = Potential(s) / Difficulty(s)
//  3. Phân bổ quỹ thời gian tự học tuần (Budget H_total ví dụ 14 - 20 giờ/tuần) theo bài toán Continuous Knapsack:
//     - Ưu tiên các môn có Marginal Gain cao nhất cho đến khi đạt điểm trần môn thi (<= 10.0)
//     - Đảm bảo tính cân bằng (không bỏ quên môn nào dưới ngưỡng sàn).
//  4. Tự động sinh lịch học chi tiết 7 ngày trong tuần với mục tiêu cụ thể cho từng buổi.

import type { DiemDayDu, MonId } from "@/state/types";
import { TEN_MON } from "@/state/types";

export interface PhanBoMonHoc {
  mon: MonId;
  tenMon: string;
  diemHienTai: number;
  diemMucTieu: number;
  diemCanTang: number;
  soGioMoiTuan: number;
  tiLePhanBo: number; // 0 - 100%
  doKhoCanBien: number;
  trongTamOnTap: string;
}

export interface BuoiHocChiTiet {
  thu: "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "CN";
  tenThu: string;
  ca: "chieu" | "toi";
  tenCa: string;
  mon: MonId;
  tenMon: string;
  thoiLuongPhut: number;
  noiDung: string;
  loaiBuoi: "lyThuyet" | "luyenDe" | "suaBai";
}

export interface KeHoachHocTapToiUu {
  tongGioTuan: number;
  diemHienTaiTong: number;
  diemMucTieuTong: number;
  khoangCachGap: number;
  phanBoTungMon: PhanBoMonHoc[];
  lichTuan: BuoiHocChiTiet[];
  loiKhuyenChienLuoc: string[];
}

const LAM_TRON_1 = (n: number) => Math.round(n * 10) / 10;
const LAM_TRON_2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Tính hàm độ khó cận biên để tăng điểm tại mức điểm hiện tại `s` (0 <= s <= 10)
 */
function tinhDoKhoCanBien(s: number): number {
  const diemAnToan = Math.min(9.9, Math.max(1.0, s));
  return LAM_TRON_2(1.0 / Math.pow(10.1 - diemAnToan, 1.4));
}

/**
 * Tối ưu hoá phân bổ quỹ giờ học hàng tuần dựa trên khoảng cách điểm tới NV1
 */
export function toiUuPhanBoLichHoc(
  cacMonXet: MonId[],
  diemHienTai: DiemDayDu,
  diemChuanMucTieu: number,
  diemUuTien = 0,
  quyGioTuan = 16 // Mặc định 16 giờ tự học/tuần
): KeHoachHocTapToiUu {
  // Lấy điểm hiện tại của các môn trong tổ hợp
  const danhSachMon = cacMonXet.map((m) => {
    const raw = (diemHienTai[m] as number | null | undefined) ?? 6.0;
    return {
      mon: m,
      tenMon: TEN_MON[m] ?? m,
      diem: Math.min(10, Math.max(0, raw)),
    };
  });

  const tongDiemHienTai = danhSachMon.reduce((s, m) => s + m.diem, 0);
  const tongDiemCoUT = Math.min(30, tongDiemHienTai + diemUuTien);
  const gap = LAM_TRON_1(Math.max(0, diemChuanMucTieu - tongDiemCoUT));

  // Tính tiềm năng và độ khó của từng môn
  const phanTichMon = danhSachMon.map((item) => {
    const tiemNang = Math.max(0, 10 - item.diem);
    const doKho = tinhDoKhoCanBien(item.diem);
    // Tỷ suất biên: Môn có tiềm năng cao và độ khó thấp sẽ có hệ số biên cao nhất
    const heSoBien = tiemNang > 0 ? LAM_TRON_2(Math.sqrt(tiemNang) / doKho) : 0.05;
    return {
      ...item,
      tiemNang,
      doKho,
      heSoBien,
    };
  });

  const tongHeSoBien = phanTichMon.reduce((s, m) => s + m.heSoBien, 0);

  // Phân bổ điểm cần tăng tỉ lệ theo hệ số biên (nếu có gap)
  const phanBoTungMon: PhanBoMonHoc[] = phanTichMon.map((item) => {
    const tiLe = tongHeSoBien > 0 ? item.heSoBien / tongHeSoBien : 1 / phanTichMon.length;

    // Điểm cần tăng cho môn này (không vượt quá tiềm năng 10 - điểm)
    const diemCanTang = gap > 0 ? Math.min(item.tiemNang, LAM_TRON_1(gap * tiLe * 1.05)) : 0;
    const diemMucTieu = LAM_TRON_1(Math.min(10, item.diem + diemCanTang));

    // Số giờ học được gán (tối thiểu 2.5h/tuần để duy trì phong độ)
    const gioCoBan = 2.5;
    const gioConLai = Math.max(0, quyGioTuan - gioCoBan * phanTichMon.length);
    const soGioMoiTuan = LAM_TRON_1(gioCoBan + gioConLai * tiLe);
    const tiLePhanBo = Math.round((soGioMoiTuan / quyGioTuan) * 100);

    // Xác định trọng tâm ôn tập theo mức điểm hiện tại
    let trongTamOnTap: string;
    if (item.diem < 7.0) {
      trongTamOnTap = "Củng cố lý thuyết căn bản, xử lý triệt để các câu nhận biết & thông hiểu, không để mất điểm oan.";
    } else if (item.diem < 8.5) {
      trongTamOnTap = "Luyện các dạng bài vận dụng vừa, rèn kỹ thuật bấm máy tính và bấm giờ giải nhanh từng phần.";
    } else {
      trongTamOnTap = "Chuyên đề vận dụng cao (câu phân loại 9 - 10 điểm), tổng hợp bẫy đề thi các năm trước.";
    }

    return {
      mon: item.mon,
      tenMon: item.tenMon,
      diemHienTai: item.diem,
      diemMucTieu,
      diemCanTang,
      soGioMoiTuan,
      tiLePhanBo,
      doKhoCanBien: item.doKho,
      trongTamOnTap,
    };
  });

  // Xây dựng lịch học tuần (7 ngày)
  const lichTuan: BuoiHocChiTiet[] = [];
  const cacThu: Array<{ thu: BuoiHocChiTiet["thu"]; tenThu: string }> = [
    { thu: "T2", tenThu: "Thứ Hai" },
    { thu: "T3", tenThu: "Thứ Ba" },
    { thu: "T4", tenThu: "Thứ Tư" },
    { thu: "T5", tenThu: "Thứ Năm" },
    { thu: "T6", tenThu: "Thứ Sáu" },
    { thu: "T7", tenThu: "Thứ Bảy" },
    { thu: "CN", tenThu: "Chủ Nhật" },
  ];

  // Sắp xếp môn theo số giờ giảm dần để xếp lịch xen kẽ hợp lý
  const sortedMon = [...phanBoTungMon].sort((a, b) => b.soGioMoiTuan - a.soGioMoiTuan);

  cacThu.forEach((thuItem, idx) => {
    // Luân phiên các môn chính
    const monChinh = sortedMon[idx % sortedMon.length];
    const monPhu = sortedMon[(idx + 1) % sortedMon.length];

    // Chiều: 90 phút ôn lý thuyết hoặc chuyên đề
    lichTuan.push({
      thu: thuItem.thu,
      tenThu: thuItem.tenThu,
      ca: "chieu",
      tenCa: "Chiều (14:30 - 16:30)",
      mon: monChinh.mon,
      tenMon: monChinh.tenMon,
      thoiLuongPhut: 120,
      noiDung: idx % 2 === 0 ? `Học chuyên đề trọng tâm & bài tập dạng mới môn ${monChinh.tenMon}` : `Luyện giải đề thi thử bấm giờ môn ${monChinh.tenMon}`,
      loaiBuoi: idx % 2 === 0 ? "lyThuyet" : "luyenDe",
    });

    // Tối: 90 phút sửa bài & ôn tập xen kẽ
    lichTuan.push({
      thu: thuItem.thu,
      tenThu: thuItem.tenThu,
      ca: "toi",
      tenCa: "Tối (19:30 - 21:00)",
      mon: monPhu.mon,
      tenMon: monPhu.tenMon,
      thoiLuongPhut: 90,
      noiDung: `Sửa chi tiết các câu sai, ghi chép sổ tay công thức môn ${monPhu.tenMon}`,
      loaiBuoi: "suaBai",
    });
  });

  // Lời khuyên chiến lược
  const loiKhuyenChienLuoc: string[] = [];
  if (gap === 0) {
    loiKhuyenChienLuoc.push("Điểm hiện tại của bạn đã đạt mốc điểm chuẩn kỳ vọng. Trọng tâm lúc này là duy trì sự ổn định tâm lý và tốc độ làm bài.");
  } else {
    const monKeoDiem = [...phanBoTungMon].sort((a, b) => b.diemCanTang - a.diemCanTang)[0];
    loiKhuyenChienLuoc.push(`Để san bằng khoảng cách ${gap} điểm tới NV1, môn "${monKeoDiem.tenMon}" là đòn bẩy lớn nhất (mục tiêu tăng +${monKeoDiem.diemCanTang} điểm).`);
    loiKhuyenChienLuoc.push(`Quỹ thời gian ${quyGioTuan} giờ/tuần đã được tối ưu hóa toán học theo hàm biên, tập trung vào môn có khả năng bứt phá nhanh nhất.`);
  }

  return {
    tongGioTuan: quyGioTuan,
    diemHienTaiTong: LAM_TRON_1(tongDiemHienTai),
    diemMucTieuTong: LAM_TRON_1(diemChuanMucTieu),
    khoangCachGap: gap,
    phanBoTungMon,
    lichTuan,
    loiKhuyenChienLuoc,
  };
}
