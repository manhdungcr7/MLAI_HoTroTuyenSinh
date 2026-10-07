// Phần thuần của màn Kế hoạch tuần: ngày bắt đầu xếp, việc dở tuần trước, nhập lịch nhanh. Không React.
import { congNgay, thuCuaNgay, thuHaiCuaTuan } from "@/engine/xep-lich";
import type { TietCoDinh, TrangThaiViec, ViecCanHoc } from "@/state/types";
import { tenThu } from "./dinh-dang";

/** Sau giờ này, "Xếp lịch giúp em" bắt đầu xếp từ ngày mai để không đặt việc vào giờ đã qua. */
export const MUON_TRONG_NGAY = 20 * 60 + 30;

export interface NgayBatDauXep {
  /** Ngày bắt đầu xếp; undefined = xếp cả tuần (tuần sau). */
  tuNgay?: string;
  /** Không còn ngày học nào từ lúc bắt đầu tới hết tuần. */
  hetTuan: boolean;
  /** Có chữ khi ngày bắt đầu bị dời vì ngày nghỉ. */
  ghiChu?: string;
}

/**
 * Xếp từ đâu: hôm nay (hoặc ngày mai nếu đã muộn), rồi dời qua các ngày nghỉ của em.
 * Tuần khác tuần hiện tại thì xếp cả tuần (engine tự bỏ ngày nghỉ).
 */
export function ngayBatDauXep(tuan: string, hom: string, phutBayGio: number, ngayNghi: number[]): NgayBatDauXep {
  if (tuan !== thuHaiCuaTuan(hom)) return { hetTuan: false };
  const cuoiTuan = congNgay(tuan, 6);
  const goc = phutBayGio >= MUON_TRONG_NGAY ? congNgay(hom, 1) : hom;
  let tuNgay = goc;
  while (tuNgay <= cuoiTuan && ngayNghi.includes(thuCuaNgay(tuNgay))) tuNgay = congNgay(tuNgay, 1);
  if (tuNgay > cuoiTuan) {
    return goc > cuoiTuan ? { tuNgay: goc, hetTuan: true } : { tuNgay: goc, hetTuan: true, ghiChu: "Những ngày còn lại của tuần này đều là ngày nghỉ của em. Em chuyển sang tuần sau, hoặc bớt ngày nghỉ trong Cài đặt tự học." };
  }
  if (tuNgay === goc) return { tuNgay, hetTuan: false };
  const tenGoc = goc === hom ? "Hôm nay" : tenThu(goc);
  return { tuNgay, hetTuan: false, ghiChu: `${tenGoc} là ngày nghỉ, mình xếp từ ${tenThu(tuNgay)}.` };
}

// ---------- Việc dở tuần trước ----------
const HAU_TO = "-sang-";
const idGoc = (id: string) => id.split(HAU_TO)[0];

/** Việc của tuần trước (liền kề) chưa xong cũng chưa bỏ, và chưa được giữ sang tuần này. */
export function viecDoTuanTruoc(viec: ViecCanHoc[], trangThai: Record<string, TrangThaiViec>, tuan: string): ViecCanHoc[] {
  const truoc = congNgay(tuan, -7);
  const daCo = new Set(viec.filter((v) => v.tuan === tuan).map((v) => idGoc(v.id)));
  return viec.filter((v) => v.tuan === truoc && trangThai[v.id] !== "xong" && trangThai[v.id] !== "boQua" && !daCo.has(idGoc(v.id)));
}

/** Bản sao của việc cho tuần mới (id mới, cùng nội dung). */
export const saoViecSangTuan = (v: ViecCanHoc, tuan: string): ViecCanHoc => ({ ...v, id: `${idGoc(v.id)}${HAU_TO}${tuan}`, tuan });

// ---------- Nhập lịch nhanh ----------
export type BuoiHoc = "sang" | "chieu" | "caNgay";
type Tiet = Omit<TietCoDinh, "id">;

export const CAC_BUOI_HOC: { gia: BuoiHoc; nhan: string; gio: string; khung: [string, string][] }[] = [
  { gia: "sang", nhan: "Học sáng", gio: "07:00–11:30", khung: [["07:00", "11:30"]] },
  { gia: "chieu", nhan: "Học chiều", gio: "13:00–17:00", khung: [["13:00", "17:00"]] },
  { gia: "caNgay", nhan: "Cả ngày", gio: "07:00–11:30 và 13:00–17:00", khung: [["07:00", "11:30"], ["13:00", "17:00"]] },
];
export const GIO_HOC_THEM_TOI: [string, string] = ["19:15", "21:00"];
export const THU_MAC_DINH_HOC = [1, 2, 3, 4, 5];

const trung = (a: Tiet, b: Tiet) => a.thu === b.thu && a.loai === b.loai && a.batDau === b.batDau && a.ketThuc === b.ketThuc;
const boTrung = (moi: Tiet[], hienCo: Tiet[]) => moi.filter((m) => !hienCo.some((h) => trung(h, m)));

/** Các tiết "Học ở trường" cần thêm cho buổi và các thứ đã chọn; bỏ tiết đã có sẵn đúng giờ đó. */
export function tietHocOTruong(buoi: BuoiHoc, thus: number[], hienCo: Tiet[]): Tiet[] {
  const khung = CAC_BUOI_HOC.find((b) => b.gia === buoi)?.khung ?? [];
  const moi = [...new Set(thus)].sort((a, b) => a - b).flatMap((thu) => khung.map(([batDau, ketThuc]): Tiet => ({ ten: "Học ở trường", loai: "chinhKhoa", thu, batDau, ketThuc })));
  return boTrung(moi, hienCo);
}

/** Tiết "Học thêm tối" mặc định 19:15–21:00 cho các thứ đã chọn. */
export function tietHocThemToi(thus: number[], hienCo: Tiet[]): Tiet[] {
  const moi = [...new Set(thus)].sort((a, b) => a - b).map((thu): Tiet => ({ ten: "Học thêm tối", loai: "hocThem", thu, batDau: GIO_HOC_THEM_TOI[0], ketThuc: GIO_HOC_THEM_TOI[1] }));
  return boTrung(moi, hienCo);
}
