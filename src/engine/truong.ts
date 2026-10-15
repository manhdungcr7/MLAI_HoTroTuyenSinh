// University Entity System: một nơi duy nhất biết "trường" là gì. TypeScript thuần, không React, dùng chung client và functions/.
// - chuanHoa: chuẩn hóa tiếng Việt duy nhất (bỏ dấu, hạ chữ, đ -> d, ký tự lạ thành khoảng trắng).
// - resolveTruong: chuỗi người dùng gõ -> mã trường. Trùng nghĩa thì trả "mơ hồ" và liệt kê ứng viên, không đoán.
// - tinhCuaTruong / coSoCuaChuongTrinh / locTheoTinh: cơ sở và tỉnh (kể cả tỉnh sau sáp nhập).
// Bí danh sinh từ danh mục thật (mã, tên, tên trong ngoặc), cộng bảng tay nhỏ BI_DANH_TAY bên dưới.
import { DANH_MUC_TRUONG } from "../data/truong-danh-muc";

/** Bỏ dấu, đ -> d, hạ chữ; giữ nguyên mọi ký tự khác (dấu chấm, gạch...). Dùng khi cần so chuỗi thô như "tp.hcm". */
export function boDauGiuKyTu(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();
}

/** Chuẩn hóa duy nhất: bỏ dấu, đ -> d, chữ thường, mọi ký tự không phải chữ/số thành một khoảng trắng. */
export function chuanHoa(t: string): string {
  return boDauGiuKyTu(t).replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Bí danh viết tay. Nguồn: gộp từ ba bảng cũ (tu-van/lay-du-lieu.ts, kham-pha/tim-kiem.ts, engine/tim-kiem.ts, ai/ten-truong.ts),
 * mỗi bí danh là tên gọi thông dụng của chính trường đó. Mã không có trong dữ liệu thì bị bỏ khi dựng chỉ mục (ví dụ QSB, ĐH Bách Khoa TP.HCM,
 * chưa có chương trình nào trong dữ liệu nên không thể coi là trường hợp lệ).
 * Bí danh một từ là "viết tắt" (dùng được khi tách từ câu hỏi); bí danh nhiều từ chỉ dùng khi so cả cụm.
 * Cố ý KHÔNG có "bk", "bach khoa", "ha noi", "nong nghiep": các cụm này chung cho nhiều trường, để bộ phân giải tự báo mơ hồ.
 */
const BI_DANH_TAY: Record<string, string[]> = {
  QHI: ["uet", "vnuuet", "cong nghe dhqghn"],
  QSC: ["uit", "cntt tphcm", "cntt dhqg"],
  BKA: ["hust", "bkhn", "bka"],
  KHA: ["neu", "ktqd"],
  NTH: ["ftu"],
  NTS: ["ftu2", "ftu", "ngoai thuong co so 2", "ngoai thuong tphcm"],
  BVH: ["ptit", "hvbcvt", "buu chinh ha noi"],
  BVT: ["ptit hcm", "buu chinh tphcm"],
  KSA: ["ueh"],
  QSK: ["uel"],
  DKC: ["hutech"],
  SPK: ["hcmute", "ute", "spkt", "spkt tphcm"],
  SPH: ["hnue"],
  SPS: ["hcmue"],
  YHB: ["hmu"],
  YDS: ["ump"],
  TYS: ["huph", "pntu"],
  QHT: ["hus"],
  QST: ["hcmus", "khtn tphcm"],
  QSX: ["ussh", "hcmussh", "ussh hcm", "nhan van tphcm"],
  QHX: ["ussh", "hussh", "ussh hn", "nhan van ha noi"],
  GHA: ["utc"],
  GSA: ["utc2", "utc"],
  XDA: ["huce", "nuce"],
  KTA: ["hau"],
  KTS: ["uah", "kien truc tphcm"],
  TMU: ["tmu"],
  NHH: ["hvnh", "bav"],
  HQT: ["dav"],
  LPH: ["hlu"],
  FPT: ["fpt"],
  PKA: ["phenikaa"],
  IUH: ["iuh", "cong nghiep tphcm"],
  DCN: ["haui"],
  TLA: ["tlu"],
  HVN: ["vnua"],
  NHF: ["hanu"],
  QHF: ["ulis"],
  HBT: ["ajc"],
  DQN: ["qnu"],
  TDL: ["dlu"],
  DVL: ["vlu"],
  TDM: ["tdmu"],
  DMT: ["hunre"],
  TDV: ["vinhuni"],
  QHE: ["ueb"],
  HTC: ["aof", "hvtc", "ufa"],
  KMA: ["kma", "actvn"],
  UEF: ["uef"],
  DTL: ["thanglong"],
  DTT: ["tdtu"],
  DBS: ["ou"],
  MBS: ["ou", "hcmcou"],
  SGD: ["sgu"],
  DSG: ["stu"],
  DDK: ["dut", "bkdn", "bk da nang"],
  DDQ: ["due"],
  DDF: ["ufl"],
  DDS: ["ued"],
  DDT: ["dtu"],
  DCT: ["huit"],
  NLS: ["hcmuaf"],
  LPS: ["hcmulaw", "hcmul"],
  DNT: ["huflit"],
  TCT: ["ctu"],
  YCT: ["ctump"],
  TSN: ["ntu"],
  HHK: ["vaa"],
  // Tên tiếng Anh của ĐH Trà Vinh (Tra Vinh University, viết tắt TVU). Mã trong dữ liệu là DTV, không phải DTL (DTL là ĐH Thăng Long).
  DTV: ["tvu", "tra vinh university"],
};

/** Cụm viết tắt tuyển sinh -> cụm đầy đủ (đã chuẩn hóa), chỉ dùng khi so theo từ trong tên trường. */
const MO_RONG: Record<string, string> = { bk: "bach khoa", kt: "kinh te", sp: "su pham", nt: "ngoai thuong", tphcm: "tp hcm", hcm: "tp hcm", tp: "tp" };
/** Từ đệm bỏ qua khi so theo từ. */
const TU_DEM = new Set(["truong", "dai", "hoc", "dh", "hv", "vien", "university", "uni", "college", "cua", "va"]);
const TIEN_TO = /^((truong|dai hoc|dh|hoc vien|hv) )+/;

export interface TruongDanhMuc { ma: string; ten: string; tinh: string[]; loi: string; tu: string[] }

export const DS_TRUONG: readonly TruongDanhMuc[] = DANH_MUC_TRUONG.map(([ma, ten, tinh]) => {
  const loi = chuanHoa(ten.replace(/\([^)]*\)/g, " ")).replace(TIEN_TO, "");
  return { ma, ten, tinh: [...tinh], loi, tu: chuanHoa(ten).split(" ").filter((x) => !TU_DEM.has(x)) };
});
const THEO_MA = new Map(DS_TRUONG.map((t) => [t.ma, t]));

export const tenTruong = (ma: string): string | undefined => THEO_MA.get(ma)?.ten;
export const coTruong = (ma: string): boolean => THEO_MA.has(ma);

// ---- Chỉ mục bí danh: chuỗi đã chuẩn hóa -> tập mã ----
type Loai = "viet-tat" | "cum";
const chiMuc = new Map<string, Set<string>>();
const vietTatCua = new Map<string, Set<string>>(); // bí danh một từ -> mã (dùng cho tách từ câu hỏi)
const bietDanhCua_ = new Map<string, string[]>();
function them(khoa: string, ma: string, loai: Loai, loiTran = false) {
  if (!khoa) return;
  // Tên tỉnh trần ("ha noi") không được coi là tên một trường; chỉ chấp nhận khi có tiền tố "dai hoc ..."
  if (loiTran && chuanHoaTinh(khoa) !== null) return;
  (chiMuc.get(khoa) ?? chiMuc.set(khoa, new Set()).get(khoa)!).add(ma);
  if (loai === "viet-tat" && !khoa.includes(" ")) (vietTatCua.get(khoa) ?? vietTatCua.set(khoa, new Set()).get(khoa)!).add(ma);
  const ds = bietDanhCua_.get(ma) ?? []; if (!ds.includes(khoa)) ds.push(khoa); bietDanhCua_.set(ma, ds);
}

// ---- Tỉnh ----
/** Tỉnh cũ đã nhập vào tỉnh mới. Mỗi dòng có ví dụ trong dữ liệu (mã trường có tên tỉnh cũ, tỉnh ghi trong dữ liệu là tỉnh mới); Bến Tre theo cùng đợt sáp nhập, chưa có trường nào trong dữ liệu. */
export const TINH_CU_SANG_MOI: Record<string, string> = {
  "Trà Vinh": "Vĩnh Long", // DTV
  "Bến Tre": "Vĩnh Long",
  "Hòa Bình": "Phú Thọ", // C23
  "Nam Định": "Ninh Bình", // C25
  "Bạc Liêu": "Cà Mau", // DBL
  "Phú Yên": "Đắk Lắk", // DPY, NHP
  "Quảng Bình": "Quảng Trị", // DQB
  "Quảng Nam": "Đà Nẵng", // DQU
  "Tiền Giang": "Đồng Tháp", // TTN
  "Thái Bình": "Hưng Yên", // YTB
  "Long An": "Tây Ninh", // DLA
  "Bà Rịa - Vũng Tàu": "TP.HCM", // BVU
  "Bình Dương": "TP.HCM", // TDM
};
const TINH_CU_KHOA = new Set(Object.keys(TINH_CU_SANG_MOI).map(chuanHoa)); // tỉnh đã bãi bỏ có thể trùng tên trường (ĐH Trà Vinh)
const TINH_HIEN_HANH = [...new Set(DS_TRUONG.flatMap((t) => t.tinh))];
const TINH_KHOA = new Map<string, string>();
for (const t of TINH_HIEN_HANH) TINH_KHOA.set(chuanHoa(t), t);
for (const [cu, moi] of Object.entries(TINH_CU_SANG_MOI)) TINH_KHOA.set(chuanHoa(cu), moi);
for (const k of ["tphcm", "tp hcm", "hcm", "ho chi minh", "thanh pho ho chi minh", "sai gon"]) TINH_KHOA.set(k, "TP.HCM");
TINH_KHOA.set("hn", "Hà Nội");

/** Tên tỉnh (cũ hoặc mới, có dấu hay không) -> tên tỉnh hiện hành trong dữ liệu; null nếu không phải tỉnh. */
export function chuanHoaTinh(ten: string): string | null {
  return TINH_KHOA.get(chuanHoa(ten)) ?? null;
}
/** Chuẩn hóa nếu nhận ra, không thì giữ nguyên chuỗi đã chuẩn hóa để so sánh. */
const khoaTinh = (ten: string) => chuanHoa(chuanHoaTinh(ten) ?? ten);

/** Các tỉnh/cơ sở có chương trình của trường, nhiều chương trình nhất trước. [] nếu mã lạ. */
export const tinhCuaTruong = (ma: string): string[] => [...(THEO_MA.get(ma)?.tinh ?? [])];

/** Lọc danh sách theo tỉnh, hiểu tên tỉnh cũ: "Trà Vinh", "Bến Tre" và "Vĩnh Long" là cùng một nhóm. `tinhCua` lấy tỉnh của phần tử (mặc định `khuVuc`). */
export function locTheoTinh<T>(ds: readonly T[], tinh: string, tinhCua: (x: T) => string | undefined = (x) => (x as { khuVuc?: string }).khuVuc): T[] {
  const k = khoaTinh(tinh);
  if (!k) return [...ds];
  return ds.filter((x) => { const t = tinhCua(x); return !!t && khoaTinh(t) === k; });
}

/** Tách "(CS: Cần Thơ)" khỏi tên ngành. Không có cơ sở thì coSo = null. "(CSE)" không phải cơ sở. */
export function coSoCuaChuongTrinh(tenNganh: string): { nganh: string; coSo: string | null } {
  const m = /\(\s*CS\s*:\s*([^)]+?)\s*\)/i.exec(tenNganh);
  if (!m) return { nganh: tenNganh.trim(), coSo: null };
  return { nganh: tenNganh.replace(m[0], " ").replace(/\s{2,}/g, " ").trim(), coSo: m[1].trim() };
}

// ---- Dựng chỉ mục ----
for (const t of DS_TRUONG) {
  them(chuanHoa(t.ma), t.ma, "viet-tat");
  const day = chuanHoa(t.ten.replace(/\([^)]*\)/g, " "));
  them(day, t.ma, "cum");
  them(day.replace(TIEN_TO, "dai hoc "), t.ma, "cum");
  const [truocGach, ...sauGach] = t.ten.replace(/\([^)]*\)/g, " ").split(" - ");
  const loiTruoc = chuanHoa(truocGach).replace(TIEN_TO, "");
  if (sauGach.length === 0) {
    them(t.loi, t.ma, "cum", true);
    them(`dh ${t.loi}`, t.ma, "cum"); them(`dai hoc ${t.loi}`, t.ma, "cum");
  } else {
    const gop = `${loiTruoc} ${chuanHoa(sauGach.join(" ")).replace(TIEN_TO, "")}`.trim();
    them(gop, t.ma, "cum");
  }
  for (const m of t.ten.matchAll(/\(([^)]+)\)/g)) them(chuanHoa(m[1]), t.ma, "viet-tat"); // (HUTECH), (UEF), (HUFLIT)
}
for (const [ma, ds] of Object.entries(BI_DANH_TAY)) {
  if (!THEO_MA.has(ma)) continue;
  for (const b of ds) them(chuanHoa(b), ma, "viet-tat");
}

/** Mọi bí danh (đã chuẩn hóa) của một trường, dùng để dựng kho từ tìm kiếm. */
export const bietDanhCua = (ma: string): string[] => [...(bietDanhCua_.get(ma) ?? [])];
/** Chỉ các bí danh một từ (viết tắt: uit, hust, ute...), dùng để xếp hạng "trùng đúng định danh". */
export const bietDanhDon = (ma: string): string[] => bietDanhCua(ma).filter((b) => !b.includes(" "));
/** Từ viết tắt một từ (đã chuẩn hóa) -> các mã trường dùng tên đó; [] nếu không phải viết tắt trường. Dùng để nhận ra trường trong câu hỏi dài. */
export const maTuVietTat = (tu: string): string[] => [...(vietTatCua.get(chuanHoa(tu)) ?? [])].sort();

// ---- Bộ phân giải ----
export type KieuKhop = "chinh-xac" | "mo-ho" | "khong-thay";
export interface KetQuaTruong {
  kieu: KieuKhop;
  /** Có mã khi và chỉ khi kieu = "chinh-xac". */
  ma: string | null;
  ung_vien: string[];
  /** Một câu giải thích để hiển thị hoặc ghi log. */
  ly_do: string;
  /** true khi phải sửa chính tả mới khớp; luôn đi kèm kieu "mo-ho". */
  gan_dung?: boolean;
}

function khoangCach(a: string, b: string, gioiHan: number): number {
  if (Math.abs(a.length - b.length) > gioiHan) return gioiHan + 1;
  let truoc = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const hang = [i];
    for (let j = 1; j <= b.length; j++) hang[j] = Math.min(truoc[j] + 1, hang[j - 1] + 1, truoc[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    truoc = hang;
  }
  return truoc[b.length];
}

const TU_VUNG = (() => { const s = new Set<string>(); for (const k of chiMuc.keys()) if (!k.includes(" ")) s.add(k); for (const t of DS_TRUONG) t.tu.forEach((x) => s.add(x)); return [...s]; })();
const SAP = (ds: Iterable<string>) => [...ds].sort();

function theoTu(tu: string[]): string[] {
  if (tu.join("").length < 3) return [];
  return DS_TRUONG.filter((t) => tu.every((x) => t.tu.includes(x))).map((t) => t.ma);
}

function giaiTheoChuoi(q: string): { ma: string[]; cach: "bi-danh" | "tu" } | null {
  const ex = chiMuc.get(q);
  if (ex) return { ma: SAP(ex), cach: "bi-danh" };
  const tu = q.split(" ").flatMap((x) => (MO_RONG[x] ?? x).split(" ")).filter((x) => !TU_DEM.has(x));
  if (tu.length === 0) return null;
  const ex2 = chiMuc.get(tu.join(" "));
  if (ex2) return { ma: SAP(ex2), cach: "bi-danh" };
  const ma = theoTu(tu);
  return ma.length ? { ma: SAP(ma), cach: "tu" } : null;
}

/**
 * Chuỗi người dùng gõ -> trường.
 *  - "chinh-xac": đúng một trường (mã, tên, bí danh, hoặc mọi từ khóa chỉ nằm trong tên một trường).
 *  - "mo-ho": nhiều trường cùng khớp ("bk", "utc", "kinh te"), hoặc phải sửa chính tả mới khớp. `ung_vien` liệt kê, `ma` = null.
 *  - "khong-thay": không có căn cứ trong danh mục.
 * Không bao giờ chọn bừa một ứng viên.
 */
export function resolveTruong(chuoi: string): KetQuaTruong {
  const q = chuanHoa(chuoi);
  if (!q) return { kieu: "khong-thay", ma: null, ung_vien: [], ly_do: "Chuỗi rỗng." };
  const r = giaiTheoChuoi(q);
  if (r && r.cach === "tu" && chuanHoaTinh(q) !== null && !TINH_CU_KHOA.has(q)) return { kieu: "khong-thay", ma: null, ung_vien: [], ly_do: `"${chuoi.trim()}" là tên tỉnh, không phải tên một trường; dùng bộ lọc tỉnh (locTheoTinh).` };
  if (r) {
    if (r.ma.length === 1) return { kieu: "chinh-xac", ma: r.ma[0], ung_vien: r.ma, ly_do: `Khớp ${r.cach === "bi-danh" ? "tên/bí danh" : "từ khóa trong tên"} của ${tenTruong(r.ma[0])}.` };
    return { kieu: "mo-ho", ma: null, ung_vien: r.ma, ly_do: `"${chuoi.trim()}" dùng chung cho ${r.ma.length} trường: ${r.ma.map((m) => `${tenTruong(m)} (${m})`).join("; ")}.` };
  }
  // Sửa chính tả nhẹ: thay từ lạ bằng từ gần nhất (cách 1 ký tự, từ >= 4 ký tự; cách 2 nếu >= 9 ký tự)
  const sua = q.split(" ").map((x) => {
    if (TU_VUNG.includes(x) || MO_RONG[x] || TU_DEM.has(x) || x.length < 3) return x;
    const gh = x.length >= 9 ? 2 : 1;
    const gan = TU_VUNG.filter((v) => khoangCach(x, v, gh) <= gh);
    return gan.length === 1 ? gan[0] : x;
  }).join(" ");
  if (sua !== q) {
    const r2 = giaiTheoChuoi(sua);
    if (r2) return { kieu: "mo-ho", gan_dung: true, ma: null, ung_vien: r2.ma, ly_do: `Không có "${chuoi.trim()}"; có phải "${sua}" (${r2.ma.map((m) => tenTruong(m)).join("; ")})?` };
  }
  return { kieu: "khong-thay", ma: null, ung_vien: [], ly_do: `Không có trường nào khớp "${chuoi.trim()}" trong danh mục.` };
}
