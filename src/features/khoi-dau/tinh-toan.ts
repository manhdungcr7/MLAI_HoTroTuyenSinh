// Hàm thuần (không React) cho luồng Khởi đầu: đọc điểm, kiểm tra bước 1, tổ hợp tự tính, gợi ý học phí.
import { tongDiem } from "@/engine/phan-tich";
import { TEN_MON_NGAN, TO_HOP, type HoSo, type MaToHop, type MonId } from "@/state/types";

// ---------- Đọc điểm ----------
export type KetQuaDiem =
  | { loai: "trong" }
  | { loai: "hopLe"; gia: number }
  | { loai: "khongPhaiSo" }
  | { loai: "ngoaiKhoang" };

/** Đọc chữ em gõ thành điểm. Chấp nhận dấu phẩy "7,5" và dấu chấm "7.5". */
export function docDiem(chu: string): KetQuaDiem {
  const t = chu.trim().replace(",", ".");
  if (t === "") return { loai: "trong" };
  // "7." hoặc "7," khi em đang gõ dở vẫn coi là 7.
  if (!/^\d{1,2}(\.\d{0,2})?$/.test(t)) return { loai: "khongPhaiSo" };
  const so = Number(t);
  if (Number.isNaN(so)) return { loai: "khongPhaiSo" };
  if (so < 0 || so > 10) return { loai: "ngoaiKhoang" };
  return { loai: "hopLe", gia: Math.round(so * 100) / 100 };
}

export const LOI_DIEM: Record<"khongPhaiSo" | "ngoaiKhoang", string> = {
  khongPhaiSo: "Em nhập số nhé, ví dụ 7,5",
  ngoaiKhoang: "Điểm từ 0 đến 10 nhé",
};

/** Hiện điểm theo kiểu Việt: 7.5 → "7,5". */
export const vietDiem = (so: number | null) => (so === null ? "" : String(so).replace(".", ","));

// ---------- Kiểm tra bước 1 ----------
export type TruongBatBuoc = "khoi" | "tinh" | "nganhQuanTam";
export const THU_TU_BAT_BUOC: TruongBatBuoc[] = ["khoi", "tinh", "nganhQuanTam"];

/** Các trường bắt buộc còn thiếu, theo thứ tự trên màn. Trả về lời nhắc dễ hiểu cho từng trường. */
export function kiemTraBuoc1(h: HoSo): Partial<Record<TruongBatBuoc, string>> {
  const loi: Partial<Record<TruongBatBuoc, string>> = {};
  if (!h.khoi) loi.khoi = "Em chọn đang học lớp 10–11, lớp 12 hay đã tốt nghiệp.";
  if (!h.tinh) loi.tinh = "Em chọn tỉnh/thành phố đang sống.";
  if (!h.nganhQuanTam.length) loi.nganhQuanTam = "Em chọn ít nhất một nhóm ngành (chưa chắc cũng được).";
  return loi;
}

// ---------- Tổ hợp tự tính ----------
export interface KetQuaToHop { ma: MaToHop; mon: MonId[]; tong: number | null; thieu: MonId[] }

/** Tổng điểm các tổ hợp. Tổ hợp còn thiếu môn trả tong = null (không coi môn thiếu là 0). */
export function tinhCacToHop(diem: Record<MonId, number | null>): KetQuaToHop[] {
  return (Object.keys(TO_HOP) as MaToHop[]).map((ma) => {
    const mon = TO_HOP[ma];
    const thieu = mon.filter((m) => diem[m] === null);
    return { ma, mon, thieu, tong: thieu.length ? null : tongDiem(diem, mon) };
  });
}

export const tenMonCuaToHop = (mon: MonId[]) => mon.map((m) => TEN_MON_NGAN[m]).join(" – ");

// ---------- Gợi ý học phí theo ngân sách ----------
export type MucNganSach = NonNullable<HoSo["nganSach"]>;
export const KHOANG_NGAN_SACH: Record<MucNganSach, { tu: number; den: number | null; nhan: string }> = {
  duoi30: { tu: 0, den: 30, nhan: "Dưới 30 triệu" },
  "30-60": { tu: 30, den: 60, nhan: "30 – 60 triệu" },
  "60-100": { tu: 60, den: 100, nhan: "60 – 100 triệu" },
  tren100: { tu: 100, den: null, nhan: "Trên 100 triệu" },
};

export interface GoiYHocPhi { khoang: string; ghiChu: string | null }

/**
 * Câu gợi ý mức học phí nên ưu tiên. Chỉ dựa trên mức em chọn, không tự đặt thêm số.
 * Ở trọ / ký túc xá thì nhắc chừa phần cho tiền ở và ăn uống.
 */
export function goiYHocPhi(nganSach: HoSo["nganSach"], choO: HoSo["choO"]): GoiYHocPhi | null {
  if (!nganSach) return null;
  const k = KHOANG_NGAN_SACH[nganSach];
  const khoang = k.den === null ? `từ ${k.tu} triệu đồng/năm trở lên` : k.tu === 0 ? `dưới ${k.den} triệu đồng/năm` : `${k.tu}–${k.den} triệu đồng/năm`;
  const ghiChu = choO === "oTro" || choO === "kyTucXa"
    ? `Em dự định ${choO === "oTro" ? "ở trọ" : "ở ký túc xá"}, nên chọn trường ở nửa dưới khoảng này để còn tiền ở và ăn uống.`
    : null;
  return { khoang, ghiChu };
}

/** Số lựa chọn mà học phí cao nhất vẫn không vượt mức ngân sách (dùng với dữ liệu mẫu). */
export function demVuaNganSach(nganSach: MucNganSach, ds: { hocPhiMax?: number }[]): number {
  const den = KHOANG_NGAN_SACH[nganSach].den;
  return ds.filter((l) => den === null || (typeof l.hocPhiMax === "number" && l.hocPhiMax <= den)).length;
}
