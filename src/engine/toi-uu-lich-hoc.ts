// Kế hoạch học tuần cho màn Chiến lược: chia giờ theo hiệu quả biên từng môn (engine/phan-bo-gio-hoc) rồi rải thành các buổi trong tuần.
// TypeScript thuần. Mỗi môn có hồ sơ riêng (engine/ho-so-mon): Hóa/Sinh chia thành nhiều buổi ngắn rải đều, Văn là buổi viết bài dài,
// Anh là buổi ngắn đều đặn, Toán/Lý là buổi giải bài. Số giờ mỗi môn quyết định số buổi: tổng giờ trong lịch đúng bằng quỹ giờ.
// Mọi tham số mô hình là giả định sư phạm chưa đo trên học sinh thật (xem ho-so-mon.ts), nên đây là gợi ý, không phải dự đoán chắc chắn.
import { HO_SO_MON, khungBuoi, trongTamTheoKieu, type KieuBuoiMon } from "@/engine/ho-so-mon";
import { loiKetLuanKhaThi, phanBoGioHoc, type KhaThi } from "@/engine/phan-bo-gio-hoc";
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
  /** Điểm tăng thêm ước lượng cho giờ học đầu tiên của môn này. Môn nào cao hơn thì được nhiều giờ hơn. */
  diemMoiGioDau: number;
  kieuBuoi: KieuBuoiMon;
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
  khaThi: KhaThi;
  /** Câu nói thật về khả năng đạt mục tiêu với quỹ giờ này (luôn là ước lượng). */
  loiKetLuan: string;
  gioCanThemMoiTuan: number | null;
}

export interface TuyChonKeHoach {
  soNgayConDenThi?: number;
  doDoc?: Partial<Record<MonId, number | null>>;
  canCaiThien?: string[];
}

const LAM_TRON_1 = (n: number) => Math.round(n * 10) / 10;
const lam15 = (n: number) => Math.max(15, Math.round(n / 15) * 15);

const CAC_THU: Array<{ thu: BuoiHocChiTiet["thu"]; tenThu: string }> = [
  { thu: "T2", tenThu: "Thứ Hai" }, { thu: "T3", tenThu: "Thứ Ba" }, { thu: "T4", tenThu: "Thứ Tư" }, { thu: "T5", tenThu: "Thứ Năm" },
  { thu: "T6", tenThu: "Thứ Sáu" }, { thu: "T7", tenThu: "Thứ Bảy" }, { thu: "CN", tenThu: "Chủ Nhật" },
];

const gioTuPhut = (p: number) => `${String(Math.floor(p / 60)).padStart(2, "0")}:${String(p % 60).padStart(2, "0")}`;
const tenCaGio = (ca: "chieu" | "toi", batDau: number, phut: number) => `${ca === "chieu" ? "Chiều" : "Tối"} (${gioTuPhut(batDau)} - ${gioTuPhut(batDau + phut)})`;

/**
 * Chia quỹ giờ tự học tuần cho các môn của tổ hợp theo hiệu quả biên, và rải thành lịch 7 ngày.
 * `diemChuanMucTieu` là tổng điểm cần đạt SAU khi đã trừ điểm ưu tiên (xem mucTieuTho); `diemUuTien` chỉ dùng khi truyền điểm chuẩn thô.
 */
export function toiUuPhanBoLichHoc(
  cacMonXet: MonId[],
  diemHienTai: DiemDayDu,
  diemChuanMucTieu: number,
  diemUuTien = 0,
  quyGioTuan = 16,
  tuyChon: TuyChonKeHoach = {},
): KeHoachHocTapToiUu {
  if (!cacMonXet || cacMonXet.length === 0) {
    return {
      tongGioTuan: Math.max(0, quyGioTuan),
      diemHienTaiTong: 0,
      diemMucTieuTong: LAM_TRON_1(diemChuanMucTieu),
      khoangCachGap: LAM_TRON_1(Math.max(0, diemChuanMucTieu)),
      phanBoTungMon: [],
      lichTuan: [],
      loiKhuyenChienLuoc: ["Vui lòng chọn tổ hợp môn xét tuyển để hệ thống chia giờ học."],
      khaThi: "daDat",
      loiKetLuan: "",
      gioCanThemMoiTuan: null,
    };
  }

  const mucTong = diemChuanMucTieu - diemUuTien;
  const kq = phanBoGioHoc({
    mon: cacMonXet, diem: diemHienTai as Partial<Record<MonId, number | null>>, mucTieuTong: mucTong,
    quyPhutTuan: Math.round(quyGioTuan * 60), soNgayConDenThi: tuyChon.soNgayConDenThi, doDoc: tuyChon.doDoc, canCaiThien: tuyChon.canCaiThien,
  });
  const tongDiem = kq.phanBo.reduce((s, m) => s + m.diemHienTai, 0);

  const phanBoTungMon: PhanBoMonHoc[] = kq.phanBo.map((p) => {
    const kieu = HO_SO_MON[p.mon].kieu;
    return {
      mon: p.mon,
      tenMon: TEN_MON[p.mon] ?? p.mon,
      diemHienTai: p.diemHienTai,
      diemMucTieu: LAM_TRON_1(Math.min(10, p.diemHienTai + p.diemCanTang)),
      diemCanTang: p.diemCanTang,
      soGioMoiTuan: LAM_TRON_1(p.phutMoiTuan / 60),
      tiLePhanBo: quyGioTuan > 0 ? Math.round((p.phutMoiTuan / 60 / quyGioTuan) * 100) : 0,
      diemMoiGioDau: p.diemMoiGioDau,
      kieuBuoi: kieu,
      trongTamOnTap: trongTamTheoKieu(kieu, p.diemHienTai),
    };
  });

  // Rải thành buổi: số buổi theo độ dài buổi hợp lý của môn; các buổi của một môn cách đều nhau trong tuần.
  type Buoi = { mon: MonId; thuTu: number; phut: number; dauTuan: boolean; suaLoi: boolean; kieu: KieuBuoiMon };
  const cacBuoi: Buoi[] = [];
  const thuTuMon = [...kq.phanBo].sort((a, b) => b.phutMoiTuan - a.phutMoiTuan);
  thuTuMon.forEach((p, mi) => {
    if (p.phutMoiTuan <= 0) return;
    const hs = HO_SO_MON[p.mon];
    const soBuoi = Math.max(1, Math.min(7, Math.round(p.phutMoiTuan / hs.buoiToiUuPhut)));
    const moi = lam15(p.phutMoiTuan / soBuoi);
    for (let k = 0; k < soBuoi; k++) {
      cacBuoi.push({ mon: p.mon, thuTu: Math.min(6, Math.floor((k * 7) / soBuoi + (mi % 3))) % 7, phut: moi, dauTuan: k === 0, suaLoi: p.dangXuong && k === 0, kieu: hs.kieu });
    }
  });
  const taiNgay = new Array(7).fill(0) as number[];
  const lichTuan: BuoiHocChiTiet[] = [];
  for (const b of [...cacBuoi].sort((a, c) => a.thuTu - c.thuTu || c.phut - a.phut)) {
    // Ngày dự kiến có thể đã dày: chuyển sang ngày gần nhất còn nhẹ, tránh trùng môn trong ngày.
    let ngay = b.thuTu, tot = Infinity;
    for (let d = 0; d < 7; d++) {
      const trung = lichTuan.some((x) => x.thu === CAC_THU[d].thu && x.mon === b.mon) ? 120 : 0;
      const diem = taiNgay[d] * 1.5 + trung + Math.abs(d - b.thuTu) * 25;
      if (diem < tot) { tot = diem; ngay = d; }
    }
    // Mỗi ngày: tối trước, rồi chiều; buổi thứ ba trở đi nối tiếp sau buổi chiều (nghỉ 10 phút), không chồng giờ.
    const trongNgay = lichTuan.filter((x) => x.thu === CAC_THU[ngay].thu);
    const ca: "chieu" | "toi" = trongNgay.some((x) => x.ca === "toi") ? "chieu" : "toi";
    const batDau = ca === "toi" ? 19 * 60 + 30 : 14 * 60 + 30 + trongNgay.filter((x) => x.ca === "chieu").reduce((t, x) => t + x.thoiLuongPhut + 10, 0);
    const khung = khungBuoi(b.kieu, b.phut, { dauTuan: b.dauTuan, suaLoi: b.suaLoi });
    taiNgay[ngay] += b.phut;
    lichTuan.push({
      thu: CAC_THU[ngay].thu, tenThu: CAC_THU[ngay].tenThu, ca, tenCa: tenCaGio(ca, batDau, b.phut),
      mon: b.mon, tenMon: TEN_MON[b.mon] ?? b.mon, thoiLuongPhut: b.phut,
      noiDung: khung.chiTiet,
      loaiBuoi: b.suaLoi ? "suaBai" : b.kieu === "giaiBai" || b.kieu === "vietBai" ? "luyenDe" : "lyThuyet",
    });
  }
  const thuTuThu = (t: BuoiHocChiTiet["thu"]) => CAC_THU.findIndex((x) => x.thu === t);
  lichTuan.sort((a, c) => thuTuThu(a.thu) - thuTuThu(c.thu) || (a.ca === c.ca ? 0 : a.ca === "chieu" ? -1 : 1));

  const loiKhuyenChienLuoc: string[] = [];
  if (kq.khaThi === "daDat") {
    loiKhuyenChienLuoc.push("Điểm hiện tại của bạn đã đạt mốc điểm chuẩn kỳ vọng. Trọng tâm lúc này là duy trì sự ổn định tâm lý và tốc độ làm bài.");
  } else {
    const nhieuNhat = [...phanBoTungMon].sort((a, b) => b.soGioMoiTuan - a.soGioMoiTuan)[0];
    if (nhieuNhat) {
      loiKhuyenChienLuoc.push(`${nhieuNhat.tenMon} nhận nhiều giờ nhất (${String(nhieuNhat.soGioMoiTuan).replace(".", ",")} giờ/tuần) vì mỗi giờ ở môn này ước tăng thêm nhiều điểm nhất cho bạn lúc này.`);
    }
  }
  loiKhuyenChienLuoc.push(...kq.ghiChu);

  return {
    tongGioTuan: quyGioTuan,
    diemHienTaiTong: LAM_TRON_1(tongDiem),
    diemMucTieuTong: LAM_TRON_1(diemChuanMucTieu),
    khoangCachGap: kq.gap,
    phanBoTungMon,
    lichTuan,
    loiKhuyenChienLuoc,
    khaThi: kq.khaThi,
    loiKetLuan: loiKetLuanKhaThi(kq),
    gioCanThemMoiTuan: kq.gioCanThemMoiTuan,
  };
}
