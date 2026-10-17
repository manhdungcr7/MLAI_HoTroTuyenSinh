// Chia quỹ giờ tự học tuần cho các môn theo HIỆU QUẢ BIÊN: mỗi 15 phút đi vào môn mà em này tăng được nhiều điểm nhất. TypeScript thuần, không React.
//
// Mô hình (giả định, xem engine/ho-so-mon.ts):
//   Điểm môn m tăng  Δm(h) = trần_m × (1 − exp(−giờ_tổng / τ_m)),  giờ_tổng = giờ mỗi tuần × số tuần còn lại.
//   Hàm này lõm (giờ sau ít hiệu quả hơn giờ trước), nên với tổng giờ cố định, chia tham lam theo hiệu quả biên cho kết quả TỐI ƯU.
//   trần_m  = min(10 − điểm hiện tại, trần theo hồ sơ môn × số tuần / 4 × hệ số theo mức điểm); điểm càng cao càng khó tăng.
//   τ_m     = số giờ cần để lấy ~63% phần tăng; môn đang tiến bộ thì nhanh hơn, môn tự thấy cần cải thiện hơi nhanh hơn.
// Mọi tham số là giả định sư phạm chưa đo trên học sinh thật: kết quả là gợi ý có ước lượng, không phải dự đoán chắc chắn.
import { HO_SO_MON } from "@/engine/ho-so-mon";
import { TEN_MON, type MonId } from "@/state/types";

export const BUOC_PHUT = 15;
const GIO_TOI_THIEU_PHUT = 60;
const SO_TUAN_MAC_DINH = 12;
const SO_TUAN_TOI_DA = 26;
const GIO_THEM_TOI_DA_PHUT = 25 * 60;

export interface DauVaoPhanBo {
  mon: MonId[];
  diem: Partial<Record<MonId, number | null>>;
  /** Tổng ba môn cần đạt (đã trừ điểm ưu tiên). */
  mucTieuTong: number;
  quyPhutTuan: number;
  /** Số ngày còn tới kỳ thi; thiếu thì dùng giả định 12 tuần. */
  soNgayConDenThi?: number;
  /** Điểm thi thử mỗi lần của từng môn (độ dốc); âm là đang giảm. */
  doDoc?: Partial<Record<MonId, number | null>>;
  /** Tên môn (TEN_MON) em tự thấy cần cải thiện. */
  canCaiThien?: string[];
}

export interface PhanBoMon {
  mon: MonId;
  diemHienTai: number;
  chuaCoDiem: boolean;
  phutMoiTuan: number;
  /** Điểm môn này có thể tăng với giờ được chia (ước lượng tối đa theo mô hình). */
  diemDuKien: number;
  /** Phần điểm cần tăng để cả tổ hợp đạt mục tiêu: chia theo diemDuKien, không vượt mức mô hình cho phép. */
  diemCanTang: number;
  /** Điểm tăng thêm ước lượng cho mỗi giờ đầu tiên dành cho môn này: dùng để giải thích vì sao môn này được nhiều giờ. */
  diemMoiGioDau: number;
  dangXuong: boolean;
  dangLen: boolean;
}

export type KhaThi = "daDat" | "du" | "gan" | "khong";

export interface KetQuaPhanBo {
  phanBo: PhanBoMon[];
  gap: number;
  tongDuKien: number;
  khaThi: KhaThi;
  /** Số giờ/tuần cần thêm để đủ mục tiêu; null nếu đã đủ hoặc không thể đủ dù thêm giờ (trần thời gian còn lại). */
  gioCanThemMoiTuan: number | null;
  soTuan: number;
  ghiChu: string[];
}

interface ThongSoMon {
  mon: MonId; diem: number; chuaCoDiem: boolean; tran: number; tau: number; dangXuong: boolean; dangLen: boolean;
}

const lam1 = (n: number) => Math.round(n * 10) / 10;
const lam2 = (n: number) => Math.round(n * 100) / 100;

function heSoMucDiem(s: number): number { return s < 7 ? 1 : s < 8.5 ? 0.75 : 0.5; }

function thongSo(dv: DauVaoPhanBo, soTuan: number): ThongSoMon[] {
  return dv.mon.map((mon) => {
    const raw = dv.diem[mon];
    const chuaCoDiem = !(typeof raw === "number" && Number.isFinite(raw));
    const diem = Math.min(10, Math.max(0, chuaCoDiem ? 6 : (raw as number)));
    const hs = HO_SO_MON[mon];
    const doc = dv.doDoc?.[mon];
    const dangXuong = typeof doc === "number" && doc <= -0.1;
    const dangLen = typeof doc === "number" && doc >= 0.2;
    // Điểm đang giảm: còn điểm lấy lại được, nên trần cao hơn. Đang tăng: giờ học hiệu quả hơn.
    let tran = Math.min(10 - diem, hs.tranBonTuan * (soTuan / 4) * heSoMucDiem(diem));
    if (dangXuong) tran = Math.min(10 - diem, tran * 1.25);
    let tau = hs.tauGio * (1 + Math.max(0, diem - 6) * 0.35);
    if (dangLen) tau *= 0.9;
    if (dv.canCaiThien?.includes(TEN_MON[mon])) tau *= 0.9;
    return { mon, diem, chuaCoDiem, tran: Math.max(0, tran), tau, dangXuong, dangLen };
  });
}

const tang = (t: ThongSoMon, phutTuan: number, soTuan: number) => t.tran <= 0 ? 0 : t.tran * (1 - Math.exp(-(phutTuan / 60) * soTuan / t.tau));

/** Chia `quy` phút (bước 15 phút) theo hiệu quả biên. Mỗi môn có sàn để giữ nhịp. */
function chiaGio(ts: ThongSoMon[], quy: number, soTuan: number, deu: boolean): number[] {
  const n = ts.length;
  if (n === 0) return [];
  const buoc = Math.max(0, Math.floor(quy / BUOC_PHUT));
  const san = Math.min(GIO_TOI_THIEU_PHUT, Math.floor((buoc * BUOC_PHUT) / n / BUOC_PHUT) * BUOC_PHUT);
  const phut = ts.map(() => san);
  let con = buoc - (san / BUOC_PHUT) * n;
  while (con > 0) {
    let tot = 0, diemTot = -Infinity;
    for (let i = 0; i < n; i++) {
      // Giữ nhịp (đã đủ mục tiêu): chia đều, môn đang giảm được trội một chút.
      const bien = deu
        ? -phut[i] + (ts[i].dangXuong ? 30 : 0)
        : tang(ts[i], phut[i] + BUOC_PHUT, soTuan) - tang(ts[i], phut[i], soTuan) + (10 - ts[i].diem) * 1e-9;
      if (bien > diemTot) { diemTot = bien; tot = i; }
    }
    phut[tot] += BUOC_PHUT;
    con--;
  }
  return phut;
}

export function phanBoGioHoc(dv: DauVaoPhanBo): KetQuaPhanBo {
  const ghiChu: string[] = [];
  const soTuan = typeof dv.soNgayConDenThi === "number" && dv.soNgayConDenThi > 0
    ? Math.min(SO_TUAN_TOI_DA, Math.max(1, Math.ceil(dv.soNgayConDenThi / 7)))
    : SO_TUAN_MAC_DINH;
  if (!(typeof dv.soNgayConDenThi === "number" && dv.soNgayConDenThi > 0)) ghiChu.push("Chưa biết ngày thi nên tạm tính cho 12 tuần.");
  const ts = thongSo(dv, soTuan);
  if (ts.length === 0) return { phanBo: [], gap: 0, tongDuKien: 0, khaThi: "daDat", gioCanThemMoiTuan: null, soTuan, ghiChu: ["Chưa có tổ hợp môn để chia giờ."] };
  const tong = ts.reduce((s, t) => s + t.diem, 0);
  const gap = Math.max(0, lam1((Number.isFinite(dv.mucTieuTong) ? dv.mucTieuTong : 0) - tong));
  const quy = Math.max(0, Math.floor((Number.isFinite(dv.quyPhutTuan) ? dv.quyPhutTuan : 0) / BUOC_PHUT) * BUOC_PHUT);
  const phut = chiaGio(ts, quy, soTuan, gap <= 0);

  const duKien = ts.map((t, i) => tang(t, phut[i], soTuan));
  const tongDuKien = duKien.reduce((s, x) => s + x, 0);
  const heSo = gap > 0 && tongDuKien > 0 ? Math.min(1, gap / tongDuKien) : 0;
  let khaThi: KhaThi = gap <= 0 ? "daDat" : tongDuKien >= gap ? "du" : tongDuKien >= gap * 0.7 ? "gan" : "khong";

  let gioCanThem: number | null = null;
  if (khaThi === "gan" || khaThi === "khong") {
    for (let them = BUOC_PHUT; them <= GIO_THEM_TOI_DA_PHUT; them += BUOC_PHUT) {
      const p = chiaGio(ts, quy + them, soTuan, false);
      if (ts.reduce((s, t, i) => s + tang(t, p[i], soTuan), 0) >= gap) { gioCanThem = lam1(them / 60); break; }
    }
  }
  if (khaThi === "khong" && gioCanThem === null) ghiChu.push("Dù thêm giờ, thời gian còn lại cũng khó đủ để lên mục tiêu này.");

  const phanBo: PhanBoMon[] = ts.map((t, i) => ({
    mon: t.mon, diemHienTai: lam1(t.diem), chuaCoDiem: t.chuaCoDiem, phutMoiTuan: phut[i],
    diemDuKien: lam2(duKien[i]),
    diemCanTang: lam1(Math.min(10 - t.diem, duKien[i] * heSo)),
    diemMoiGioDau: lam2(tang(t, 60, soTuan)),
    dangXuong: t.dangXuong, dangLen: t.dangLen,
  }));
  return { phanBo, gap, tongDuKien: lam2(tongDuKien), khaThi, gioCanThemMoiTuan: gioCanThem, soTuan, ghiChu };
}

/** Một câu nói thật về khả năng đạt mục tiêu với quỹ giờ này. Luôn là ước lượng. */
export function loiKetLuanKhaThi(k: KetQuaPhanBo): string {
  const x = (n: number) => String(lam1(n)).replace(".", ",");
  switch (k.khaThi) {
    case "daDat": return "Điểm hiện tại đã đạt mục tiêu. Mình chỉ gợi ý giữ nhịp ôn.";
    case "du": return `Với quỹ giờ này, ước lượng em tăng được tối đa khoảng ${x(k.tongDuKien)} điểm, đủ cho phần còn thiếu (${x(k.gap)} điểm).`;
    case "gan": return `Ước lượng tăng được khoảng ${x(k.tongDuKien)} điểm, còn thiếu ${x(k.gap)}.${k.gioCanThemMoiTuan !== null ? ` Thêm khoảng ${x(k.gioCanThemMoiTuan)} giờ mỗi tuần sẽ đủ, hoặc thêm một nguyện vọng An toàn.` : " Em cân nhắc thêm một nguyện vọng An toàn."}`;
    case "khong": return `Với quỹ giờ này, ước lượng chỉ tăng được khoảng ${x(k.tongDuKien)} điểm trong khi còn thiếu ${x(k.gap)}.${k.gioCanThemMoiTuan !== null ? ` Cần thêm khoảng ${x(k.gioCanThemMoiTuan)} giờ mỗi tuần, hoặc xem lại danh sách nguyện vọng.` : " Mục tiêu có thể quá xa trong thời gian còn lại, em xem lại danh sách nguyện vọng."}`;
  }
}
