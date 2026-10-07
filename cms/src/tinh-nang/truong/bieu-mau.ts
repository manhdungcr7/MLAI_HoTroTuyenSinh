// Biểu mẫu thông tin theo loại: chuyển chữ người gõ thành body API, kiểm tra bằng đúng bộ kiểm tra của máy chủ.
// Thuần TypeScript, không React.
import { kiemTraThongTin, type LoaiThongTin, type ThongTinTruong } from "@/data/dong-gop-kiem-tra";

/** Mọi ô là chữ (đúng như người dùng gõ); loại nào chỉ dùng ô của loại đó. */
export interface FormThongTin {
  nam: string; linkNguon: string;
  // học phí
  donVi: string; mucThap: string; mucCao: string; phamVi: string; loTrinhTang: string;
  // học bổng
  ten: string; giaTri: string; dieuKien: string; hanNop: string;
  // nơi lưu trú
  coKyTucXa: string; ktxThap: string; ktxCao: string; khuTro: string; troThap: string; troCao: string; khoangCachKm: string;
  // đánh giá, lưu ý
  tieuDe: string; noiDung: string; nguoiVietLa: string;
  // dùng chung
  ghiChu: string;
}

export const FORM_TRONG: FormThongTin = {
  nam: "", linkNguon: "",
  donVi: "trieu_nam", mucThap: "", mucCao: "", phamVi: "", loTrinhTang: "",
  ten: "", giaTri: "", dieuKien: "", hanNop: "",
  coKyTucXa: "", ktxThap: "", ktxCao: "", khuTro: "", troThap: "", troCao: "", khoangCachKm: "",
  tieuDe: "", noiDung: "", nguoiVietLa: "",
  ghiChu: "",
};

/** Loại thông tin có thể thêm tay trong CMS (không có "Khác"). */
export const LOAI_THEM_TAY = ["hoc_phi", "hoc_bong", "noi_luu_tru", "review", "luu_y"] as const satisfies readonly LoaiThongTin[];
export type LoaiThemTay = (typeof LOAI_THEM_TAY)[number];

/** Năm học mặc định khi thêm học phí: năm học đang bắt đầu (từ tháng 8 trở đi thì năm nay, trước đó thì năm ngoái). */
export function namHocMacDinh(bayGio: Date = new Date()): number {
  return bayGio.getMonth() >= 7 ? bayGio.getFullYear() : bayGio.getFullYear() - 1;
}

export function formTrong(loai: LoaiThongTin, bayGio: Date = new Date()): FormThongTin {
  return { ...FORM_TRONG, ...(loai === "hoc_phi" || loai === "luu_y" ? { nam: String(namHocMacDinh(bayGio)) } : {}) };
}

const chu = (v: unknown): string => (v === undefined || v === null ? "" : String(v));
const cap = (c?: readonly [number, number]) => ({ thap: chu(c?.[0]), cao: chu(c?.[1]) });

/** Đổ một bản ghi có sẵn vào biểu mẫu để sửa. */
export function formTuBanGhi(t: ThongTinTruong): FormThongTin {
  const f: FormThongTin = { ...FORM_TRONG, nam: chu(t.nam), linkNguon: chu(t.linkNguon) };
  switch (t.loai) {
    case "hoc_phi": { const d = t.duLieu; return { ...f, donVi: d.donVi, mucThap: chu(d.mucThap), mucCao: chu(d.mucCao), phamVi: d.phamVi, loTrinhTang: chu(d.loTrinhTang), ghiChu: chu(d.ghiChu) }; }
    case "hoc_bong": { const d = t.duLieu; return { ...f, ten: d.ten, giaTri: d.giaTri, dieuKien: d.dieuKien, hanNop: chu(d.hanNop) }; }
    case "noi_luu_tru": {
      const d = t.duLieu, k = cap(d.giaKyTucThang), r = cap(d.giaTroThang);
      return { ...f, coKyTucXa: d.coKyTucXa, ktxThap: k.thap, ktxCao: k.cao, khuTro: d.khuTroXungQuanh, troThap: r.thap, troCao: r.cao, khoangCachKm: chu(d.khoangCachKm), ghiChu: chu(d.ghiChu) };
    }
    case "review": { const d = t.duLieu; return { ...f, tieuDe: d.tieuDe, noiDung: d.noiDung, nguoiVietLa: chu(d.nguoiVietLa) }; }
    case "luu_y": case "khac": { const d = t.duLieu; return { ...f, tieuDe: d.tieuDe, noiDung: d.noiDung }; }
  }
}

/** "28,5" -> 28.5; ô trống -> undefined; chữ không phải số giữ nguyên để bộ kiểm tra báo lỗi. */
export function docSoTuChu(s: string): number | string | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : t;
}

const khoang = (a: string, b: string): [unknown, unknown] | undefined =>
  a.trim() === "" && b.trim() === "" ? undefined : [docSoTuChu(a) ?? "", docSoTuChu(b) ?? ""];
const tuyChon = (s: string): string | undefined => (s.trim() === "" ? undefined : s);

export interface BodyThongTin { nam?: number | string; linkNguon?: string; duLieu: Record<string, unknown> }

/** Biểu mẫu thành phần thân gửi API (chưa kiểm tra; dùng kiemTraForm để kiểm). */
export function bodyTuForm(loai: LoaiThongTin, f: FormThongTin): BodyThongTin {
  const nam = docSoTuChu(f.nam);
  const goc = { ...(nam !== undefined && { nam }), ...(tuyChon(f.linkNguon) && { linkNguon: f.linkNguon.trim() }) };
  switch (loai) {
    case "hoc_phi":
      return { ...goc, duLieu: { donVi: f.donVi, mucThap: docSoTuChu(f.mucThap), mucCao: docSoTuChu(f.mucCao), phamVi: f.phamVi, loTrinhTang: tuyChon(f.loTrinhTang), ghiChu: tuyChon(f.ghiChu) } };
    case "hoc_bong":
      return { ...goc, duLieu: { ten: f.ten, giaTri: f.giaTri, dieuKien: f.dieuKien, hanNop: tuyChon(f.hanNop) } };
    case "noi_luu_tru":
      return { ...goc, duLieu: { coKyTucXa: f.coKyTucXa, giaKyTucThang: khoang(f.ktxThap, f.ktxCao), khuTroXungQuanh: f.khuTro, giaTroThang: khoang(f.troThap, f.troCao), khoangCachKm: docSoTuChu(f.khoangCachKm), ghiChu: tuyChon(f.ghiChu) } };
    case "review":
      return { ...goc, duLieu: { tieuDe: f.tieuDe, noiDung: f.noiDung, nguoiVietLa: tuyChon(f.nguoiVietLa) } };
    case "luu_y": case "khac":
      return { ...goc, duLieu: { tieuDe: f.tieuDe, noiDung: f.noiDung } };
  }
}

/** Lỗi từng ô theo bộ kiểm tra dùng chung với máy chủ (khóa như "nam", "linkNguon", "duLieu.mucThap"). Rỗng nghĩa là hợp lệ. */
export function kiemTraForm(loai: LoaiThongTin, f: FormThongTin, bayGio: Date = new Date()): Record<string, string> {
  const b = bodyTuForm(loai, f);
  const kq = kiemTraThongTin({ id: "tam", maTruong: "TAM", loai, ...b, trangThai: "nhap" }, { bayGio });
  return kq.ok ? {} : kq.loi;
}

/** Lỗi của một ô: nhận cả khóa "mucThap" lẫn "duLieu.mucThap". */
export const loiO = (loi: Record<string, string>, o: string): string | undefined => loi[`duLieu.${o}`] ?? loi[o];

/** Máy chủ trả lỗi ở ô mà biểu mẫu không có (ví dụ "chung", "id") thì gom thành câu chung. */
export function loiChung(loi: Record<string, string>, cacO: readonly string[]): string[] {
  const co = new Set(cacO.flatMap((o) => [o, `duLieu.${o}`]));
  return Object.entries(loi).filter(([k]) => !co.has(k)).map(([, v]) => v);
}

export const CAC_O_FORM: Record<LoaiThongTin, readonly string[]> = {
  hoc_phi: ["nam", "linkNguon", "donVi", "mucThap", "mucCao", "phamVi", "loTrinhTang", "ghiChu"],
  hoc_bong: ["linkNguon", "ten", "giaTri", "dieuKien", "hanNop"],
  noi_luu_tru: ["linkNguon", "coKyTucXa", "giaKyTucThang", "khuTroXungQuanh", "giaTroThang", "khoangCachKm", "ghiChu"],
  review: ["linkNguon", "tieuDe", "noiDung", "nguoiVietLa"],
  luu_y: ["nam", "linkNguon", "tieuDe", "noiDung"],
  khac: ["linkNguon", "tieuDe", "noiDung"],
};
