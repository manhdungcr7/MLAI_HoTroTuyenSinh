// Kiểm tra và làm sạch nội dung cộng đồng: kênh chính thức của trường, thông tin theo loại, báo sai.
// Thuần TypeScript, không React, không import dữ liệu lớn: dùng được ở Function lẫn trình duyệt.
// Không tin dữ liệu từ client: mọi chuỗi, số, enum đều được kiểm lại ở đây trước khi ghi D1 hoặc dựng bản chụp.

export type TrangThaiBai = "nhap" | "cho" | "duyet" | "an";
export type TrangThaiBaoSai = "moi" | "xong" | "boQua";
/** Cách kiểm link:
 * - facebook: nhóm Facebook hoặc Zalo (cũng nhận trang Facebook)
 * - fanpage: trang Facebook
 * - website: https công khai, ưu tiên *.edu.vn (không nhận Facebook/Zalo, không nhận trình rút gọn)
 * - nguonChinhThuc: *.edu.vn, *.gov.vn hoặc bài/ảnh trên trang Facebook (không phải nhóm)
 * - congKhai: mọi https công khai trừ trình rút gọn link
 * - bat-ky: Facebook, Zalo, *.edu.vn */
export type KieuLink = "facebook" | "fanpage" | "website" | "nguonChinhThuc" | "congKhai" | "bat-ky";
export type LoaiLink = "nhomFacebook" | "facebook" | "zalo" | "edu" | "gov" | "web";

/** Kênh chính thức và kênh cộng đồng của một trường (mỗi trường một dòng). */
export interface BanGhiTruong {
  maTruong: string;
  fanpageUrl?: string;
  nhomTuyenSinhChinhThucUrl?: string;
  nhomCongDongUrl?: string;
  websiteTuyenSinhUrl?: string;
  ghiChu?: string;
}

export const LOAI_THONG_TIN = ["hoc_phi", "hoc_bong", "noi_luu_tru", "review", "luu_y", "khac"] as const;
export type LoaiThongTin = (typeof LOAI_THONG_TIN)[number];
export const NHAN_LOAI: Record<LoaiThongTin, string> = { hoc_phi: "Học phí", hoc_bong: "Học bổng", noi_luu_tru: "Nơi lưu trú", review: "Đánh giá", luu_y: "Lưu ý", khac: "Khác" };
export const NHAN_CONG_DONG = "Thông tin cộng đồng cung cấp, chưa phải số liệu chính thức";
export const NHAN_NOI_LUU_TRU = "Do sinh viên cung cấp";
export type VaiTro = "qtv" | "ctv";

export interface DuLieuHocPhi { donVi: "trieu_nam" | "trieu_tin_chi"; mucThap: number; mucCao: number; phamVi: string; loTrinhTang?: string; ghiChu?: string }
export interface DuLieuHocBong { ten: string; giaTri: string; dieuKien: string; hanNop?: string }
export interface DuLieuNoiLuuTru { coKyTucXa: "co" | "khong" | "chua_ro"; giaKyTucThang?: [number, number]; khuTroXungQuanh: "nhieu" | "it" | "khong" | "chua_ro"; giaTroThang?: [number, number]; khoangCachKm?: number; ghiChu?: string }
export interface DuLieuReview { tieuDe: string; noiDung: string; nguoiVietLa?: "sinh_vien" | "cuu_sinh_vien" | "phu_huynh" }
export interface DuLieuChu { tieuDe: string; noiDung: string }

interface Khung { id: string; maTruong: string; nam?: number; linkNguon?: string; trangThai: TrangThaiBai; nguoiDang?: string; luc: string; phienBan: number }
/** Một bản ghi thông tin về trường; `duLieu` có hình dạng riêng theo `loai`; duyệt riêng từng bản ghi. */
export type ThongTinTruong = Khung & (
  | { loai: "hoc_phi"; duLieu: DuLieuHocPhi }
  | { loai: "hoc_bong"; duLieu: DuLieuHocBong }
  | { loai: "noi_luu_tru"; duLieu: DuLieuNoiLuuTru }
  | { loai: "review"; duLieu: DuLieuReview }
  | { loai: "luu_y"; duLieu: DuLieuChu }
  | { loai: "khac"; duLieu: DuLieuChu }
);
export type ThongTinLoai<L extends LoaiThongTin> = Extract<ThongTinTruong, { loai: L }>;

export interface BaoSai { id: string; maChuongTrinh: string; truongDuLieu: string; noiDung: string; link?: string; trangThai: TrangThaiBaoSai; luc: string }
export interface BanChup { phienBan: 1; luc: string; truong: Record<string, BanGhiTruong>; thongTin: Record<string, ThongTinTruong[]> }

export const GIOI_HAN_DONG_GOP = { link: 300, tieuDe: 120, noiDung: 600, ghiChu: 300, noiDungBaoSai: 1000, truongDuLieu: 60, nguoiDang: 120, moiLoaiMoiTruong: 3 } as const;

const TEN_MIEN_FACEBOOK = ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "fb.watch"];
const TEN_MIEN_ZALO = ["zalo.me"];
const TRINH_RUT_GON = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rebrand.ly", "shorturl.at", "tiny.cc", "buff.ly", "lnkd.in", "s.id", "rb.gy", "t.ly", "fb.me", "bit.do", "v.gd", "shorte.st", "adf.ly", "linktr.ee"];
const THAM_SO_THEO_DOI = /^(utm_|fbclid$|gclid$|mibextid$|ref$|__cft__|__tn__)/i;
const KY_TU_DIEU_KHIEN_NGUON = "[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u2028\\u2029\\u202a-\\u202e\\u2066-\\u2069\\ufeff]";
const KY_TU_DIEU_KHIEN = new RegExp(KY_TU_DIEU_KHIEN_NGUON);
const KY_TU_DIEU_KHIEN_TOAN = new RegExp(KY_TU_DIEU_KHIEN_NGUON, "g");

export type KetQuaLink = { ok: true; url: string; loai: LoaiLink } | { ok: false; lyDo: string };

const laTenMienCongKhai = (h: string) =>
  /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && !/^\d+(\.\d+)*$/.test(h) && /[a-z]{2,}$/.test(h) && !h.startsWith("-") && h !== "localhost" && !/\.(local|internal|localhost|lan)$/.test(h);
const laTrinhRutGon = (h: string) => TRINH_RUT_GON.some((d) => h === d || h.endsWith(`.${d}`));

export function kiemTraLink(url: unknown, kieu: KieuLink = "bat-ky"): KetQuaLink {
  if (typeof url !== "string") return { ok: false, lyDo: "Link không hợp lệ" };
  const goc = url.trim();
  if (!goc) return { ok: false, lyDo: "Chưa nhập link" };
  if (goc.length > GIOI_HAN_DONG_GOP.link) return { ok: false, lyDo: `Link dài quá ${GIOI_HAN_DONG_GOP.link} ký tự` };
  if (KY_TU_DIEU_KHIEN.test(goc) || /\s/.test(goc)) return { ok: false, lyDo: "Link có khoảng trắng hoặc ký tự lạ" };
  let u: URL;
  try { u = new URL(goc); } catch { return { ok: false, lyDo: "Link không đúng dạng, cần bắt đầu bằng https://" }; }
  if (u.protocol !== "https:") return { ok: false, lyDo: "Chỉ nhận link https://" };
  if (u.username || u.password) return { ok: false, lyDo: "Link không được chứa tên đăng nhập hoặc mật khẩu" };
  if (u.port) return { ok: false, lyDo: "Link không được chỉ định cổng" };
  const host = u.hostname.toLowerCase();
  if (laTrinhRutGon(host)) return { ok: false, lyDo: "Không nhận link rút gọn, hãy dán link đầy đủ" };
  let loai: LoaiLink;
  if (TEN_MIEN_FACEBOOK.includes(host)) loai = /(^|\/)groups\//i.test(u.pathname) ? "nhomFacebook" : "facebook";
  else if (TEN_MIEN_ZALO.includes(host)) loai = "zalo";
  else if (host.endsWith(".edu.vn") && host.length > ".edu.vn".length) loai = "edu";
  else if (host.endsWith(".gov.vn") && host.length > ".gov.vn".length) loai = "gov";
  else if (laTenMienCongKhai(host)) loai = "web";
  else return { ok: false, lyDo: "Tên miền không hợp lệ" };

  const nhanTen = "Tên miền chưa được phép. Chỉ nhận Facebook, Zalo và trang .edu.vn";
  switch (kieu) {
    case "bat-ky": if (loai === "gov" || loai === "web") return { ok: false, lyDo: nhanTen }; break;
    case "facebook": if (loai !== "nhomFacebook" && loai !== "facebook" && loai !== "zalo") return { ok: false, lyDo: "Cần link nhóm hoặc trang Facebook, hoặc nhóm Zalo" }; break;
    case "fanpage": if (loai !== "facebook" && loai !== "nhomFacebook") return { ok: false, lyDo: "Cần link trang Facebook (facebook.com hoặc fb.com)" }; break;
    case "website": if (loai === "facebook" || loai === "nhomFacebook" || loai === "zalo") return { ok: false, lyDo: "Ô này cần website của trường, không phải Facebook hoặc Zalo" }; break;
    case "nguonChinhThuc": if (loai !== "edu" && loai !== "gov" && loai !== "facebook") return { ok: false, lyDo: "Nguồn cần là trang .edu.vn, .gov.vn hoặc bài trên trang Facebook của trường" }; break;
    case "congKhai": break;
  }
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (THAM_SO_THEO_DOI.test(k)) u.searchParams.delete(k);
  return { ok: true, url: u.toString(), loai };
}

/** Bỏ thẻ HTML, ký tự điều khiển, gộp khoảng trắng, cắt theo ký tự (không cắt đôi cặp thay thế). */
export function lamSachChu(s: unknown, toiDa: number): string {
  if (typeof s !== "string") return "";
  const chu = s
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(KY_TU_DIEU_KHIEN_TOAN, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...chu].slice(0, Math.max(0, toiDa)).join("").trim();
}

export type TapMa = ReadonlySet<string> | readonly string[];
/** Mã (trường hoặc id chương trình) phải nằm trong tập hợp lệ do nơi gọi truyền vào. */
export function hopLeMa(ma: unknown, tap: TapMa): boolean {
  if (typeof ma !== "string" || !ma) return false;
  return Array.isArray(tap) ? tap.includes(ma) : (tap as ReadonlySet<string>).has(ma);
}

export type KetQua<T> = { ok: true; duLieu: T } | { ok: false; loi: Record<string, string> };
export interface TuyChonKiemTra { tapTruong?: TapMa; tapNganh?: TapMa; bayGio?: Date; taoId?: () => string }

const laDoiTuong = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const KHOP_ID = /^[A-Za-z0-9_-]{1,64}$/;
const KHOP_MA = /^[A-Za-z0-9._-]{1,80}$/;
const gio = (o: TuyChonKiemTra) => (o.bayGio ?? new Date()).toISOString();
const laIso = (s: unknown): s is string => typeof s === "string" && s.length <= 40 && !Number.isNaN(Date.parse(s));
const coChu = (v: unknown) => typeof v === "string" && v.trim() !== "";
const coLoi = (loi: Record<string, string>) => Object.keys(loi).length > 0;

const SDT = /(?<!\d)(?:\+?84|0)(?:[\s.\-]?\d){9}(?!\d)/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const CO_URL = /https?:\/\/|www\./i;
/** Phát hiện số điện thoại và email dán lẫn trong chữ. Không bắt được tên riêng, người duyệt phải đọc. */
export function coThongTinCaNhan(chu: string): boolean { return SDT.test(chu) || EMAIL.test(chu); }

/** Đọc một ô chữ: làm sạch, kiểm độ dài, cấm thông tin cá nhân và link trong chữ. Trả "" nếu để trống (và báo lỗi khi bắt buộc). */
function docChu(v: unknown, khoa: string, nhan: string, toiDa: number, toiThieu: number, loi: Record<string, string>): string {
  const s = lamSachChu(v, 100_000);
  if (!s) { if (toiThieu > 0) loi[khoa] = `${nhan} chưa điền`; return ""; }
  if (s.length < toiThieu) loi[khoa] = `${nhan} cần ít nhất ${toiThieu} ký tự`;
  else if (s.length > toiDa) loi[khoa] = `${nhan} dài quá ${toiDa} ký tự`;
  else if (coThongTinCaNhan(s)) loi[khoa] = "Không đưa số điện thoại hoặc email vào ô này";
  else if (CO_URL.test(s)) loi[khoa] = "Link hãy điền vào ô link nguồn, không viết trong nội dung";
  return s;
}
function docSo(v: unknown, khoa: string, nhan: string, min: number, max: number, batBuoc: boolean, loi: Record<string, string>): number | undefined {
  if (v === undefined || v === null || v === "") { if (batBuoc) loi[khoa] = `${nhan} chưa điền`; return undefined; }
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) { loi[khoa] = `${nhan} cần là số từ ${min} đến ${max}`; return undefined; }
  return n;
}
function docKhoang(v: unknown, khoa: string, nhan: string, max: number, loi: Record<string, string>): [number, number] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.length !== 2) { loi[khoa] = `${nhan} cần có hai số: thấp và cao`; return undefined; }
  const l: Record<string, string> = {};
  const thap = docSo(v[0], khoa, nhan, 0, max, true, l);
  const cao = docSo(v[1], khoa, nhan, 0, max, true, l);
  if (thap === undefined || cao === undefined) { loi[khoa] = l[khoa] ?? `${nhan} không hợp lệ`; return undefined; }
  if (cao < thap) { loi[khoa] = `${nhan}: mức cao phải lớn hơn hoặc bằng mức thấp`; return undefined; }
  return [thap, cao];
}
function docEnum<T extends string>(v: unknown, khoa: string, nhan: string, cho: readonly T[], batBuoc: boolean, loi: Record<string, string>): T | undefined {
  if (v === undefined || v === null || v === "") { if (batBuoc) loi[khoa] = `${nhan} chưa chọn`; return undefined; }
  if (typeof v !== "string" || !cho.includes(v as T)) { loi[khoa] = `${nhan} không hợp lệ`; return undefined; }
  return v as T;
}

export function kiemTraBanGhiTruong(x: unknown, o: TuyChonKiemTra = {}): KetQua<BanGhiTruong> {
  if (!laDoiTuong(x)) return { ok: false, loi: { chung: "Dữ liệu không hợp lệ" } };
  const loi: Record<string, string> = {};
  const ma = typeof x.maTruong === "string" ? x.maTruong.trim() : "";
  if (!KHOP_MA.test(ma)) loi.maTruong = "Mã trường không hợp lệ";
  else if (o.tapTruong && !hopLeMa(ma, o.tapTruong)) loi.maTruong = "Không có trường với mã này";
  const ra: BanGhiTruong = { maTruong: ma };
  const kenh: [keyof Omit<BanGhiTruong, "maTruong" | "ghiChu">, KieuLink][] = [
    ["fanpageUrl", "fanpage"], ["nhomTuyenSinhChinhThucUrl", "facebook"], ["nhomCongDongUrl", "facebook"], ["websiteTuyenSinhUrl", "website"],
  ];
  for (const [k, kieu] of kenh) {
    if (!coChu(x[k])) continue;
    const r = kiemTraLink(x[k], kieu);
    if (r.ok) ra[k] = r.url; else loi[k] = r.lyDo;
  }
  const ghiChu = docChu(x.ghiChu, "ghiChu", "Ghi chú", GIOI_HAN_DONG_GOP.ghiChu, 0, loi);
  if (ghiChu) ra.ghiChu = ghiChu;
  return coLoi(loi) ? { ok: false, loi } : { ok: true, duLieu: ra };
}

/** Mức bắt buộc theo loại: nguồn (link_nguon) và năm. */
const CAN_NGUON: readonly LoaiThongTin[] = ["hoc_phi", "hoc_bong", "luu_y"];
const CAN_NAM: readonly LoaiThongTin[] = ["hoc_phi", "luu_y"];
export const LOAI_CHI_QTV_DUYET: readonly LoaiThongTin[] = ["luu_y"];

/** Kiểm `duLieu` theo schema của loại. Khóa lỗi có tiền tố `duLieu.`. Trả undefined nếu có lỗi. */
function kiemTraDuLieu(loai: LoaiThongTin, d: unknown, loi: Record<string, string>): ThongTinTruong["duLieu"] | undefined {
  if (!laDoiTuong(d)) { loi.duLieu = "Thiếu nội dung chi tiết"; return undefined; }
  const L: Record<string, string> = {};
  let ra: ThongTinTruong["duLieu"] | undefined;
  switch (loai) {
    case "hoc_phi": {
      const donVi = docEnum(d.donVi, "donVi", "Đơn vị học phí", ["trieu_nam", "trieu_tin_chi"] as const, true, L);
      const mucThap = docSo(d.mucThap, "mucThap", "Mức thấp", 0, 10_000, true, L);
      const mucCao = docSo(d.mucCao, "mucCao", "Mức cao", 0, 10_000, true, L);
      if (mucThap !== undefined && mucCao !== undefined && mucCao < mucThap) L.mucCao = "Mức cao phải lớn hơn hoặc bằng mức thấp";
      const phamVi = docChu(d.phamVi, "phamVi", "Phạm vi", 80, 2, L);
      const loTrinhTang = docChu(d.loTrinhTang, "loTrinhTang", "Lộ trình tăng", 120, 0, L);
      const ghiChu = docChu(d.ghiChu, "ghiChu", "Ghi chú", GIOI_HAN_DONG_GOP.ghiChu, 0, L);
      if (!coLoi(L) && donVi && mucThap !== undefined && mucCao !== undefined) ra = { donVi, mucThap, mucCao, phamVi, ...(loTrinhTang && { loTrinhTang }), ...(ghiChu && { ghiChu }) };
      break;
    }
    case "hoc_bong": {
      const ten = docChu(d.ten, "ten", "Tên học bổng", 100, 2, L);
      const giaTri = docChu(d.giaTri, "giaTri", "Giá trị", 100, 1, L);
      const dieuKien = docChu(d.dieuKien, "dieuKien", "Điều kiện", 300, 3, L);
      const hanNop = docChu(d.hanNop, "hanNop", "Hạn nộp", 40, 0, L);
      if (!coLoi(L)) ra = { ten, giaTri, dieuKien, ...(hanNop && { hanNop }) };
      break;
    }
    case "noi_luu_tru": {
      const coKyTucXa = docEnum(d.coKyTucXa, "coKyTucXa", "Ký túc xá", ["co", "khong", "chua_ro"] as const, true, L);
      const khuTro = docEnum(d.khuTroXungQuanh, "khuTroXungQuanh", "Khu trọ xung quanh", ["nhieu", "it", "khong", "chua_ro"] as const, true, L);
      const giaKtx = docKhoang(d.giaKyTucThang, "giaKyTucThang", "Giá ký túc xá (nghìn đồng/tháng)", 100_000, L);
      const giaTro = docKhoang(d.giaTroThang, "giaTroThang", "Giá trọ (nghìn đồng/tháng)", 100_000, L);
      const km = docSo(d.khoangCachKm, "khoangCachKm", "Khoảng cách", 0, 500, false, L);
      const ghiChu = docChu(d.ghiChu, "ghiChu", "Ghi chú", GIOI_HAN_DONG_GOP.ghiChu, 0, L);
      if (!coLoi(L) && coKyTucXa && khuTro) ra = { coKyTucXa, khuTroXungQuanh: khuTro, ...(giaKtx && { giaKyTucThang: giaKtx }), ...(giaTro && { giaTroThang: giaTro }), ...(km !== undefined && { khoangCachKm: km }), ...(ghiChu && { ghiChu }) };
      break;
    }
    case "review": {
      const tieuDe = docChu(d.tieuDe, "tieuDe", "Tiêu đề", GIOI_HAN_DONG_GOP.tieuDe, 3, L);
      const noiDung = docChu(d.noiDung, "noiDung", "Nội dung", GIOI_HAN_DONG_GOP.noiDung, 3, L);
      const nguoiVietLa = docEnum(d.nguoiVietLa, "nguoiVietLa", "Người viết", ["sinh_vien", "cuu_sinh_vien", "phu_huynh"] as const, false, L);
      if (!coLoi(L)) ra = { tieuDe, noiDung, ...(nguoiVietLa && { nguoiVietLa }) };
      break;
    }
    case "luu_y":
    case "khac": {
      const tieuDe = docChu(d.tieuDe, "tieuDe", "Tiêu đề", GIOI_HAN_DONG_GOP.tieuDe, 3, L);
      const noiDung = docChu(d.noiDung, "noiDung", "Nội dung", GIOI_HAN_DONG_GOP.noiDung, 3, L);
      if (!coLoi(L)) ra = { tieuDe, noiDung };
      break;
    }
  }
  for (const [k, v] of Object.entries(L)) loi[`duLieu.${k}`] = v;
  return coLoi(L) ? undefined : ra;
}

export function kiemTraThongTin(x: unknown, o: TuyChonKiemTra = {}): KetQua<ThongTinTruong> {
  if (!laDoiTuong(x)) return { ok: false, loi: { chung: "Dữ liệu không hợp lệ" } };
  const loi: Record<string, string> = {};
  const id = typeof x.id === "string" && x.id ? x.id.trim() : o.taoId?.() ?? "";
  if (!KHOP_ID.test(id)) loi.id = "Thiếu mã bản ghi hoặc mã không hợp lệ";
  const ma = typeof x.maTruong === "string" ? x.maTruong.trim() : "";
  if (!KHOP_MA.test(ma)) loi.maTruong = "Mã trường không hợp lệ";
  else if (o.tapTruong && !hopLeMa(ma, o.tapTruong)) loi.maTruong = "Không có trường với mã này";
  const loai = x.loai as LoaiThongTin;
  const loaiOk = typeof loai === "string" && LOAI_THONG_TIN.includes(loai);
  if (!loaiOk) loi.loai = "Loại thông tin không hợp lệ";

  // năm: hoc_phi có thể gửi trong duLieu.nam, hai nơi phải khớp
  const namToiDa = (o.bayGio ?? new Date()).getFullYear() + 1;
  const thoDuLieu = laDoiTuong(x.duLieu) ? x.duLieu : {};
  const namTho = x.nam !== undefined && x.nam !== null && x.nam !== "" ? x.nam : loai === "hoc_phi" ? thoDuLieu.nam : undefined;
  if (loai === "hoc_phi" && x.nam !== undefined && x.nam !== "" && thoDuLieu.nam !== undefined && Number(x.nam) !== Number(thoDuLieu.nam)) loi.nam = "Năm ở hai nơi không khớp nhau";
  let nam: number | undefined;
  if (namTho !== undefined && namTho !== null && namTho !== "") {
    const n = Number(namTho);
    if (!Number.isInteger(n) || n < 2000 || n > namToiDa) loi.nam = `Năm cần từ 2000 đến ${namToiDa}`; else nam = n;
  } else if (loaiOk && CAN_NAM.includes(loai)) loi.nam = "Loại này bắt buộc ghi năm";

  let linkNguon: string | undefined;
  const kieuNguon: KieuLink = loai === "hoc_phi" || loai === "hoc_bong" ? "nguonChinhThuc" : loai === "luu_y" ? "congKhai" : "bat-ky";
  if (coChu(x.linkNguon)) {
    const r = kiemTraLink(x.linkNguon, kieuNguon);
    if (r.ok) linkNguon = r.url; else loi.linkNguon = r.lyDo;
  } else if (loaiOk && CAN_NGUON.includes(loai)) loi.linkNguon = "Loại này bắt buộc có link nguồn https";

  const duLieu = loaiOk ? kiemTraDuLieu(loai, x.duLieu, loi) : undefined;
  const trangThai = x.trangThai === undefined ? "nhap" : x.trangThai;
  if (trangThai !== "nhap" && trangThai !== "cho" && trangThai !== "duyet" && trangThai !== "an") loi.trangThai = "Trạng thái không hợp lệ";
  const luc = x.luc === undefined ? gio(o) : x.luc;
  if (!laIso(luc)) loi.luc = "Thời điểm không hợp lệ";
  const pb = x.phienBan === undefined ? 1 : x.phienBan;
  if (typeof pb !== "number" || !Number.isInteger(pb) || pb < 1) loi.phienBan = "Phiên bản không hợp lệ";
  if (coLoi(loi) || !duLieu || !laIso(luc)) return { ok: false, loi: coLoi(loi) ? loi : { chung: "Dữ liệu không hợp lệ" } };
  const khung: Khung = { id, maTruong: ma, trangThai: trangThai as TrangThaiBai, luc: new Date(luc).toISOString(), phienBan: pb as number };
  if (nam !== undefined) khung.nam = nam;
  if (linkNguon) khung.linkNguon = linkNguon;
  const nguoi = lamSachChu(x.nguoiDang, GIOI_HAN_DONG_GOP.nguoiDang);
  if (nguoi) khung.nguoiDang = nguoi;
  return { ok: true, duLieu: { ...khung, loai, duLieu } as ThongTinTruong };
}

/** Quyền ghi: qtv sửa mọi trường; ctv chỉ sửa trường được giao. */
export function coQuyenSuaTruong(vaiTro: VaiTro | null | undefined, maTruong: string, phanCong: TapMa): boolean {
  if (vaiTro === "qtv") return true;
  return vaiTro === "ctv" && hopLeMa(maTruong, phanCong);
}
/** Quyền đặt trạng thái: ctv chỉ đặt nháp hoặc chờ duyệt; duyệt, ẩn (kể cả lưu ý) chỉ qtv. */
export function duocDatTrangThai(vaiTro: VaiTro | null | undefined, trangThai: TrangThaiBai): boolean {
  if (vaiTro === "qtv") return true;
  return vaiTro === "ctv" && (trangThai === "nhap" || trangThai === "cho");
}
/** Khóa lạc quan: true nếu phiên bản client gửi lên khớp phiên bản hiện có (lệch thì API trả 409). */
export const khopPhienBan = (hienTai: number, guiLen: unknown): boolean => typeof guiLen === "number" && Number.isInteger(guiLen) && guiLen === hienTai;

export type MucTienDo = "kenh" | LoaiThongTin;
/** Mục cần có để trường được coi là "đã đủ" (luu_y và khac không bắt buộc). `kenh` = có ít nhất một kênh. */
export const MUC_CAN_DU: readonly MucTienDo[] = ["kenh", "hoc_phi", "hoc_bong", "noi_luu_tru", "review"];
export interface TienDoTruong { maTruong: string; co: MucTienDo[]; thieu: MucTienDo[]; du: boolean }
const coKenh = (b: BanGhiTruong | undefined) => !!b && !!(b.fanpageUrl || b.nhomTuyenSinhChinhThucUrl || b.nhomCongDongUrl || b.websiteTuyenSinhUrl);
/** Tiến độ một trường. Tính bản ghi 'cho' và 'duyet'. */
export function tienDoTruong(maTruong: string, banGhi: BanGhiTruong | undefined, thongTin: readonly ThongTinTruong[]): TienDoTruong {
  const co = new Set<MucTienDo>();
  if (coKenh(banGhi)) co.add("kenh");
  for (const t of thongTin) if (t.maTruong === maTruong && (t.trangThai === "duyet" || t.trangThai === "cho")) co.add(t.loai);
  const thieu = MUC_CAN_DU.filter((m) => !co.has(m));
  return { maTruong, co: (["kenh", ...LOAI_THONG_TIN] as MucTienDo[]).filter((m) => co.has(m)), thieu: [...thieu], du: thieu.length === 0 };
}

export function kiemTraBaoSai(x: unknown, o: TuyChonKiemTra = {}): KetQua<BaoSai> {
  if (!laDoiTuong(x)) return { ok: false, loi: { chung: "Dữ liệu không hợp lệ" } };
  const loi: Record<string, string> = {};
  const id = typeof x.id === "string" && x.id ? x.id.trim() : o.taoId?.() ?? "";
  if (!KHOP_ID.test(id)) loi.id = "Thiếu mã báo sai hoặc mã không hợp lệ";
  const ma = typeof x.maChuongTrinh === "string" ? x.maChuongTrinh.trim() : "";
  if (!KHOP_MA.test(ma)) loi.maChuongTrinh = "Mã chương trình không hợp lệ";
  else if (o.tapNganh && !hopLeMa(ma, o.tapNganh)) loi.maChuongTrinh = "Không có chương trình với mã này";
  const truongDuLieu = lamSachChu(x.truongDuLieu, GIOI_HAN_DONG_GOP.truongDuLieu);
  if (!truongDuLieu) loi.truongDuLieu = "Chưa nói số liệu nào bị sai";
  const noiDung = lamSachChu(x.noiDung, 100_000);
  if (noiDung.length < 5) loi.noiDung = "Nội dung cần ít nhất 5 ký tự";
  else if (noiDung.length > GIOI_HAN_DONG_GOP.noiDungBaoSai) loi.noiDung = `Nội dung dài quá ${GIOI_HAN_DONG_GOP.noiDungBaoSai} ký tự`;
  let link: string | undefined;
  if (coChu(x.link)) {
    const r = kiemTraLink(x.link, "bat-ky");
    if (r.ok) link = r.url; else loi.link = r.lyDo;
  }
  const trangThai = x.trangThai === undefined ? "moi" : x.trangThai;
  if (trangThai !== "moi" && trangThai !== "xong" && trangThai !== "boQua") loi.trangThai = "Trạng thái không hợp lệ";
  const luc = x.luc === undefined ? gio(o) : x.luc;
  if (!laIso(luc)) loi.luc = "Thời điểm không hợp lệ";
  if (coLoi(loi) || !laIso(luc)) return { ok: false, loi };
  const ra: BaoSai = { id, maChuongTrinh: ma, truongDuLieu, noiDung, trangThai: trangThai as TrangThaiBaoSai, luc: new Date(luc).toISOString() };
  if (link) ra.link = link;
  return { ok: true, duLieu: ra };
}

const THU_TU_LOAI = (l: LoaiThongTin) => LOAI_THONG_TIN.indexOf(l);
const moiHon = (a: ThongTinTruong, b: ThongTinTruong) => a.phienBan > b.phienBan || (a.phienBan === b.phienBan && Date.parse(a.luc) >= Date.parse(b.luc));
const khoaHocPhi = (t: ThongTinLoai<"hoc_phi">) => `${t.maTruong}|${t.nam}|${t.duLieu.phamVi.toLowerCase()}`;

/** Dựng bản chụp công khai: chỉ bản ghi đã duyệt, dòng không qua kiểm tra thì bỏ; trùng id lấy dòng phiên bản/thời điểm mới hơn;
 * học phí trùng (trường, năm, phạm vi) lấy bản mới nhất; trùng mã trường (kênh) lấy dòng sau. */
export function dungBanChup(truong: readonly BanGhiTruong[], thongTin: readonly ThongTinTruong[], bayGio: Date, o: Pick<TuyChonKiemTra, "tapTruong"> = {}): BanChup {
  const t: Record<string, BanGhiTruong> = {};
  for (const x of truong) {
    const kt = kiemTraBanGhiTruong(x, o);
    if (!kt.ok) continue;
    if (Object.keys(kt.duLieu).length === 1) { delete t[kt.duLieu.maTruong]; continue; } // dòng rỗng xóa dòng trước
    t[kt.duLieu.maTruong] = kt.duLieu;
  }
  const theoId = new Map<string, ThongTinTruong>();
  for (const x of thongTin) {
    if (!laDoiTuong(x) || x.trangThai !== "duyet") continue;
    const kt = kiemTraThongTin(x, { ...o, bayGio });
    if (!kt.ok) continue;
    const cu = theoId.get(kt.duLieu.id);
    if (!cu || moiHon(kt.duLieu, cu)) theoId.set(kt.duLieu.id, kt.duLieu);
  }
  const theoKhoa = new Map<string, ThongTinTruong>();
  for (const x of theoId.values()) {
    const k = x.loai === "hoc_phi" ? khoaHocPhi(x) : x.id;
    const cu = theoKhoa.get(k);
    if (!cu || moiHon(x, cu)) theoKhoa.set(k, x);
  }
  const nhom: Record<string, ThongTinTruong[]> = {};
  for (const x of theoKhoa.values()) (nhom[x.maTruong] ??= []).push(x);
  for (const ds of Object.values(nhom)) ds.sort((a, b) => THU_TU_LOAI(a.loai) - THU_TU_LOAI(b.loai) || Date.parse(b.luc) - Date.parse(a.luc) || a.id.localeCompare(b.id));
  return { phienBan: 1, luc: bayGio.toISOString(), truong: t, thongTin: nhom };
}

/** Phía đọc: chỉ bản ghi duyệt, mới nhất trước, tối đa `toiDa` bản ghi mỗi loại (mặc định 3). */
export function thongTinCuaTruong(b: BanChup, maTruong: string, q: { loai?: LoaiThongTin; toiDa?: number } = {}): ThongTinTruong[] {
  const toiDa = Math.max(0, q.toiDa ?? GIOI_HAN_DONG_GOP.moiLoaiMoiTruong);
  const dem = new Map<LoaiThongTin, number>();
  const ra: ThongTinTruong[] = [];
  const ds = (b.thongTin[maTruong] ?? []).filter((x) => x.trangThai === "duyet" && (!q.loai || x.loai === q.loai))
    .sort((x, y) => THU_TU_LOAI(x.loai) - THU_TU_LOAI(y.loai) || Date.parse(y.luc) - Date.parse(x.luc));
  for (const x of ds) {
    const n = dem.get(x.loai) ?? 0;
    if (n < toiDa) { ra.push(x); dem.set(x.loai, n + 1); }
  }
  return ra;
}

export interface TomTatTruong {
  kenh: { fanpage?: string; nhomTuyenSinhChinhThuc?: string; nhomCongDong?: string; websiteTuyenSinh?: string; ghiChu?: string };
  hocPhiTheoNam: ThongTinLoai<"hoc_phi">[];
  hocBong: ThongTinLoai<"hoc_bong">[];
  noiLuuTru: ThongTinLoai<"noi_luu_tru"> | null;
  review: ThongTinLoai<"review">[];
  luuY: ThongTinLoai<"luu_y">[];
  /** Mục còn thiếu, dùng cho bảng tiến độ. */
  thieu: MucTienDo[];
}

/** Gom dữ liệu đã duyệt của một trường thành cấu trúc dễ hiển thị (UI học sinh, bảng tiến độ). */
export function tomTatTruong(b: BanChup, maTruong: string): TomTatTruong {
  const g = b.truong[maTruong];
  const duyet = (b.thongTin[maTruong] ?? []).filter((x) => x.trangThai === "duyet");
  const loai = <L extends LoaiThongTin>(l: L) => duyet.filter((x): x is ThongTinLoai<L> => x.loai === l)
    .sort((x, y) => Date.parse(y.luc) - Date.parse(x.luc) || x.id.localeCompare(y.id));
  const hocPhi = loai("hoc_phi").sort((x, y) => (y.nam ?? 0) - (x.nam ?? 0) || x.duLieu.phamVi.localeCompare(y.duLieu.phamVi));
  const kenh: TomTatTruong["kenh"] = {};
  if (g?.fanpageUrl) kenh.fanpage = g.fanpageUrl;
  if (g?.nhomTuyenSinhChinhThucUrl) kenh.nhomTuyenSinhChinhThuc = g.nhomTuyenSinhChinhThucUrl;
  if (g?.nhomCongDongUrl) kenh.nhomCongDong = g.nhomCongDongUrl;
  if (g?.websiteTuyenSinhUrl) kenh.websiteTuyenSinh = g.websiteTuyenSinhUrl;
  if (g?.ghiChu) kenh.ghiChu = g.ghiChu;
  return {
    kenh,
    hocPhiTheoNam: hocPhi,
    hocBong: loai("hoc_bong"),
    noiLuuTru: loai("noi_luu_tru")[0] ?? null,
    review: loai("review").slice(0, GIOI_HAN_DONG_GOP.moiLoaiMoiTruong),
    luuY: loai("luu_y"),
    thieu: tienDoTruong(maTruong, g, duyet).thieu,
  };
}
