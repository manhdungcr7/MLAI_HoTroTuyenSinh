// Tìm kiếm ngành/trường dùng chung cho Khám phá và hộp chọn ngành (Nguyện vọng, So sánh). TypeScript thuần, có test.
// Gõ có dấu hay không dấu đều khớp; "đại học" ~ "ĐH", "công nghệ thông tin" ~ "CNTT"...; khớp đa trường (tên trường, tên ngành,
// mã trường, biệt danh như UIT/UET) theo từng từ, không cần liền kề hay đúng thứ tự.
import type { LuaChon } from "@/state/types";

/** Bỏ dấu, đ → d, chữ thường, mọi ký tự không phải chữ/số thành khoảng trắng. */
export function khongDau(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Cụm từ (đã bỏ dấu) → dạng viết tắt chuẩn. Xếp cụm dài trước để không bị cụm ngắn ăn mất. */
const CUM_VIET_TAT: [string, string][] = ([
  ["dai hoc quoc gia", "dhqg"],
  ["truong dai hoc", "dh"], ["dai hoc", "dh"], ["truong dh", "dh"],
  ["truong cao dang", "cd"], ["cao dang", "cd"],
  ["hoc vien", "hv"],
  ["cong nghe thong tin", "cntt"],
  ["thanh pho ho chi minh", "hcm"], ["tp ho chi minh", "hcm"], ["ho chi minh", "hcm"], ["tp hcm", "hcm"], ["tphcm", "hcm"],
  ["kinh te", "kt"], ["su pham", "sp"], ["bach khoa", "bk"], ["ngoai thuong", "nt"], ["quoc gia", "qg"],
] as [string, string][]).sort((a, b) => b[0].split(" ").length - a[0].split(" ").length);

/** Từ chung chung: bỏ qua khi tìm, và là thứ đầu tiên được nới khi không ra kết quả nào. */
const TU_CHUNG = new Set(["dh", "cd", "hv"]);
const TU_BO_QUA = new Set(["truong"]);

/** Biệt danh sinh viên hay gọi theo mã trường (chỉ những mã có trong dữ liệu). Mỗi biệt danh là một từ; có thể có nhiều biệt danh. */
const BIET_DANH: Record<string, string> = {
  // Hà Nội
  BKA: "hust bkhn", KHA: "neu ktqd", NTH: "ftu", TMU: "tmu", HTC: "hvtc ufa aof", NHH: "hvnh bav", GHA: "utc", GSA: "utc2 utc", GTA: "utt",
  XDA: "huce nuce", DCN: "haui", BVH: "ptit hvbcvt", KMA: "actvn kma", HBT: "ajc hvbc", HQT: "dav", HCS: "pbc", HPN: "hvpn",
  SPH: "hnue", SP2: "hpu2", NHF: "hanu", HNM: "hnmu", TLA: "tlu", LPH: "hlu", YHB: "hmu", DKH: "hup", MTA: "mta", HVN: "vnua",
  DMT: "hunre", LNH: "vnuf", DQK: "ubt", DTL: "thanglong", PKA: "phenikaa", DBH: "bhiu", DDN: "dainam", DDU: "dongdo", DKK: "uneti",
  QHI: "uet vnuuet", QHT: "hus", QHX: "ussh hussh", QHE: "ueb", QHF: "ulis", QHL: "ulaw", QHS: "uedvnu", QHY: "vnumed smp", QHQ: "vnusba",
  // TP.HCM
  QSC: "uit", QST: "hcmus", QSX: "ussh hcmussh", QSY: "vnuhcmmed", MBS: "ou hcmcou", SPK: "hcmute ute", SPS: "hcmue", DCT: "huit", IUH: "iuh",
  DKC: "hutech", NLS: "hcmuaf", LPS: "hcmulaw hcmul", KTS: "uah", SGD: "sgu", DSG: "stu", DNT: "huflit", UEF: "uef", DVL: "vlu", HSU: "hsu",
  SIU: "siu", NTT: "ntt", HIU: "hiu", YDS: "ump", NTS: "ftu2 ftu", TDM: "tdmu", VGU: "vgu", FPT: "fpt", BVU: "bvu",
  // Miền Trung, Tây Nguyên, Nam
  DDK: "dut bkdn", DDQ: "due", DDF: "ufl", DDP: "ute", DDS: "ued", DDY: "udmp", DHY: "huemed huemp", DHS: "hued", DDT: "dtu", TDL: "dlu",
  DQN: "qnu", TSN: "ntu", TDV: "vinh vinhuni", TCT: "ctu", YCT: "ctump", SPD: "dthu", TTN: "tgu", TTU: "tantao", DPQ: "pdu", XDT: "muce",
  HHK: "vaa", TYS: "huph pntu",
};

const tachTu = (s: string) => (s ? s.split(" ") : []);

/** Thay cụm bằng dạng viết tắt trên danh sách từ. */
function thayCum(tu: string[]): string[] {
  const ra: string[] = [];
  for (let i = 0; i < tu.length; ) {
    const khop = CUM_VIET_TAT.find(([cum]) => { const c = tachTu(cum); return c.every((x, j) => tu[i + j] === x); });
    if (khop) { ra.push(khop[1]); i += tachTu(khop[0]).length; } else { ra.push(tu[i]); i++; }
  }
  return ra;
}

/** Các viết tắt xuất hiện trong văn bản (để thêm vào kho từ của ngành/trường, giữ cả dạng gốc). */
function vietTatTrong(tu: string[]): string[] {
  const ra: string[] = [];
  for (const [cum, tat] of CUM_VIET_TAT) {
    const c = tachTu(cum);
    for (let i = 0; i + c.length <= tu.length; i++) if (c.every((x, j) => tu[i + j] === x)) { ra.push(tat); break; }
  }
  return ra;
}

/** Từ khóa người dùng gõ → danh sách từ chuẩn hóa (đã gộp cụm viết tắt, bỏ từ thừa). */
export function tuCuaTruyVan(q: string): string[] {
  return thayCum(tachTu(khongDau(q))).filter((t) => !TU_BO_QUA.has(t));
}

const kho = new WeakMap<LuaChon, string[]>();
/** Kho từ của một chương trình: tên trường, tên ngành, mã trường, nhóm ngành, khu vực, biệt danh, cộng thêm các dạng viết tắt. */
function khoTuCua(l: LuaChon): string[] {
  let k = kho.get(l);
  if (!k) {
    const tu = tachTu(khongDau([l.tenTruong, l.truong, l.maTruong ?? "", l.nganh, l.nhomNganh, l.khuVuc, BIET_DANH[l.maTruong ?? l.truong] ?? ""].join(" ")));
    k = [...tu, ...vietTatTrong(tu)];
    kho.set(l, k);
  }
  return k;
}

/** Từ khóa ngắn (≤ 4 ký tự: uit, neu, bk, an...) phải trùng nguyên một từ, không được là đầu của từ dài hơn ("uit" ≠ "uitm"). Từ dài hơn được gõ dở ("cong ngh"). */
const TU_NGAN = 4;
function khopTu(l: LuaChon, tu: string[], noiCuoi = false): boolean {
  const k = khoTuCua(l);
  return tu.every((t, i) => k.some((x) => x === t || (t.length > TU_NGAN || (noiCuoi && i === tu.length - 1) ? x.startsWith(t) : false)));
}

/** Mã trường và biệt danh (đã chuẩn hóa) của chương trình: khớp đúng một trong số này là ưu tiên cao nhất. */
function dinhDanhCua(l: LuaChon): string[] {
  return tachTu(khongDau(`${l.maTruong ?? ""} ${BIET_DANH[l.maTruong ?? l.truong] ?? ""}`));
}

/** Cụm từ khóa nằm liền nhau trong văn bản (sau khi gộp viết tắt), từ cuối được gõ dở nếu đủ dài. */
function cumLienNhau(van: string, tu: string[]): boolean {
  const v = thayCum(tachTu(khongDau(van)));
  for (let i = 0; i + tu.length <= v.length; i++) {
    if (tu.every((t, j) => v[i + j] === t || (j === tu.length - 1 && t.length > TU_NGAN && v[i + j].startsWith(t)))) return true;
  }
  return false;
}

/** Mức liên quan: 3 = trùng mã/biệt danh hoặc cụm từ khóa nằm liền trong tên trường; 2 = cụm nằm liền trong tên ngành; 1 = chỉ khớp đủ các từ. */
export function hangTimKiem(l: LuaChon, q: string): number {
  const tu = tuCuaTruyVan(q).filter((t) => !TU_CHUNG.has(t));
  if (tu.length === 0) return 1;
  const dd = dinhDanhCua(l);
  if (tu.some((t) => dd.includes(t)) || cumLienNhau(l.tenTruong || l.truong, tu)) return 3;
  if (cumLienNhau(l.nganh, tu)) return 2;
  return 1;
}

/** Sắp ổn định theo mức liên quan (giảm dần): các dòng cùng mức giữ nguyên thứ tự đã có (ví dụ kiểu sắp xếp người dùng chọn). */
export function xepHangTimKiem<T extends LuaChon>(ds: T[], q: string): T[] {
  if (tuCuaTruyVan(q).length === 0) return ds;
  const hang = new Map(ds.map((l) => [l.id, hangTimKiem(l, q)]));
  return [...ds].sort((a, b) => (hang.get(b.id) as number) - (hang.get(a.id) as number));
}

/**
 * Lọc danh sách theo từ khóa, kết quả xếp theo mức liên quan. Trống thì trả nguyên danh sách.
 * Không ra gì thì thử lần lượt: coi từ cuối là đang gõ dở; bỏ các từ chung ("đại học", "cao đẳng", "học viện").
 */
export function locTimKiem<T extends LuaChon>(ds: T[], q: string): T[] {
  const tu = tuCuaTruyVan(q);
  if (tu.length === 0) return ds;
  const thu = (t: string[]): T[] => {
    const chat = ds.filter((l) => khopTu(l, t));
    return chat.length > 0 ? chat : ds.filter((l) => khopTu(l, t, true));
  };
  let kq = thu(tu);
  if (kq.length === 0) {
    const noi = tu.filter((t) => !TU_CHUNG.has(t));
    if (noi.length > 0 && noi.length < tu.length) kq = thu(noi);
  }
  return xepHangTimKiem(kq, q);
}

/**
 * Trường lớn học sinh hay tìm nhưng CHƯA có trong dữ liệu (kiểm 15/10/2026). Khi tìm ra 0 ngành mà câu khớp một tên ở đây,
 * app nói thẳng "chưa có dữ liệu" thay vì "không tìm thấy". Thêm trường vào dữ liệu thì xóa dòng tương ứng.
 */
export const TRUONG_CHUA_CO: { ten: string; goi: string[] }[] = [
  { ten: "ĐH Bách khoa – ĐHQG TP.HCM", goi: ["hcmut", "bkhcm", "bk tphcm", "bach khoa tphcm", "bach khoa hcm", "bach khoa sai gon", "bach khoa ho chi minh"] },
  { ten: "ĐH Kinh tế TP.HCM (UEH)", goi: ["ueh", "kinh te tphcm", "kinh te hcm", "kinh te ho chi minh"] },
  { ten: "ĐH Kinh tế – Luật – ĐHQG TP.HCM (UEL)", goi: ["uel", "kinh te luat"] },
  { ten: "ĐH Tôn Đức Thắng", goi: ["tdtu", "ton duc thang"] },
  { ten: "Học viện Bưu chính Viễn thông cơ sở TP.HCM", goi: ["ptit hcm", "ptithcm", "buu chinh tphcm", "buu chinh hcm"] },
  { ten: "ĐH Kiến trúc Hà Nội", goi: ["kien truc ha noi"] },
];

/** Tên trường chưa có dữ liệu mà câu tìm đang nhắc tới, hoặc null. */
export function truongChuaCoDuLieu(q: string): string | null {
  const chu = ` ${khongDau(q).replace(/[^a-z0-9]+/g, " ").replace(/\btp hcm\b|\bho chi minh\b/g, "tphcm").trim()} `;
  return TRUONG_CHUA_CO.find((t) => t.goi.some((g) => chu.includes(` ${g} `)))?.ten ?? null;
}
