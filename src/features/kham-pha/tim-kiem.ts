// Module tìm kiếm thông minh cho ngành học & trường đại học / cao đẳng.
// Hỗ trợ tiếng Việt không dấu, viết tắt đại học/học viện, tên viết tắt trường (UET, UIT, HUST, NEU...),
// từ khóa tổ hợp (bách khoa cntt), và xếp hạng độ liên quan.

import type { LuaChon } from "@/state/types";

/** Bỏ dấu tiếng Việt, đưa về chữ thường không dấu chuẩn. */
export function boDau(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
}

/** Bảng ánh xạ mã trường -> danh sách tên gọi thân thuộc, viết tắt sinh viên hay dùng. */
export const BIET_DANH_TRUONG: Record<string, string[]> = {
  QHI: ["uet", "dh cong nghe", "dai hoc cong nghe ha noi", "cong nghe ha noi", "cong nghe dhqghn"],
  QSC: ["uit", "dh cong nghe thong tin", "dai hoc cong nghe thong tin", "cntt tphcm", "cntt dhqg"],
  BKA: ["hust", "bkhn", "bach khoa ha noi", "dai hoc bach khoa ha noi", "bk ha noi", "bach khoa"],
  QSB: ["hcmut", "bk tphcm", "bach khoa tphcm", "dai hoc bach khoa tphcm", "bach khoa sai gon", "bk"],
  DDK: ["bk da nang", "bach khoa da nang", "dai hoc bach khoa da nang", "bkdn"],
  KHA: ["neu", "ktqd", "kinh te quoc dan", "dai hoc kinh te quoc dan"],
  NTH: ["ftu", "ngoai thuong", "ngoai thuong ha noi", "dai hoc ngoai thuong"],
  NTS: ["ftu2", "ngoai thuong co so 2", "ngoai thuong tphcm", "ftu tphcm"],
  BVH: ["ptit", "buu chinh vien thong", "hoc vien buu chinh vien thong ha noi", "buu chinh ha noi"],
  BVT: ["ptit hcm", "buu chinh vien thong tphcm", "ptit tphcm", "buu chinh tphcm"],
  KSA: ["ueh", "kinh te tphcm", "dai hoc kinh te tphcm"],
  QSK: ["uel", "kinh te luat", "dai hoc kinh te luat"],
  DKC: ["hutech", "cong nghe tphcm", "dai hoc cong nghe tphcm"],
  SPK: ["ute", "hcmute", "spkt tphcm", "su pham ky thuat tphcm", "su pham ky thuat"],
  SPH: ["hnue", "su pham ha noi", "dai hoc su pham ha noi"],
  SPS: ["hcmue", "su pham tphcm", "dai hoc su pham tphcm"],
  YHB: ["hmu", "y ha noi", "dai hoc y ha noi"],
  YDS: ["ump", "y duoc tphcm", "dai hoc y duoc tphcm"],
  TYS: ["pntu", "pham ngoc thach", "y khoa pham ngoc thach"],
  QHT: ["hus", "khtn ha noi", "khoa hoc tu nhien ha noi"],
  QST: ["hcmus", "khtn tphcm", "khoa hoc tu nhien tphcm"],
  QSX: ["ussh hcm", "nhan van tphcm", "khoa hoc xa hoi va nhan van tphcm"],
  QHX: ["ussh hn", "nhan van ha noi", "khoa hoc xa hoi va nhan van ha noi"],
  GHA: ["utc", "giao thong van tai ha noi", "giao thong van tai"],
  GSA: ["utc2", "giao thong van tai tphcm"],
  XDA: ["huce", "nuce", "xay dung ha noi", "dai hoc xay dung"],
  KTA: ["hau", "kien truc ha noi", "dai hoc kien truc ha noi"],
  KTS: ["uah", "kien truc tphcm", "dai hoc kien truc tphcm"],
  TMU: ["tmu", "thuong mai", "dai hoc thuong mai"],
  NHH: ["bav", "ba", "hvnh", "ngan hang", "hoc vien ngan hang"],
  HQT: ["dav", "ngoai giao", "hoc vien ngoai giao"],
  LPH: ["hlu", "luat ha noi", "dai hoc luat ha noi"],
  FPT: ["fpt", "dai hoc fpt"],
  PKA: ["phenikaa", "dai hoc phenikaa"],
  IUH: ["iuh", "cong nghiep tphcm", "dai hoc cong nghiep tphcm"],
  DCN: ["haui", "cong nghiep ha noi", "dai hoc cong nghiep ha noi"],
  TLA: ["tlu", "thuy loi", "dai hoc thuy loi"],
  HVN: ["vnua", "nong nghiep", "hoc vien nong nghiep viet nam"],
  NHF: ["hanu", "ha noi", "dai hoc ha noi"],
  QHF: ["ulis", "ngoai ngu ha noi", "dai hoc ngoai ngu dhqghn"],
  HBT: ["ajc", "bao chi", "hoc vien bao chi va tuyen truyen"],
  DQN: ["qnu", "quy nhon", "dai hoc quy nhon"],
  TDL: ["dlu", "da lat", "dai hoc da lat"],
  DVL: ["vlu", "van lang", "dai hoc van lang"],
  TDM: ["tdmu", "thu dau mot", "dai hoc thu dau mot"],
  DMT: ["hunre", "tai nguyen moi truong"],
  TDV: ["vinhuni", "vinh", "dai hoc vinh"],
  QHE: ["ueb", "kinh te vnu", "dai hoc kinh te dhqghn"],
  HTC: ["aof", "tai chinh", "hoc vien tai chinh"],
  KMA: ["kma", "mat ma", "hoc vien ky thuat mat ma"],
  UEF: ["uef", "kinh te tai chinh tphcm"],
  DTL: ["thang long", "dai hoc thang long"],
  DTT: ["tdtu", "ton duc thang", "dai hoc ton duc thang"],
  DBS: ["ou", "mo tphcm", "dai hoc mo tphcm"],
  SGD: ["sgu", "sai gon", "dai hoc sai gon"],
  DSG: ["stu", "cong nghe sai gon", "dai hoc cong nghe sai gon"],
  DVX: ["van xuan", "dai hoc van xuan", "cong nghe van xuan"],
};

/** Chuẩn hóa từ khóa viết tắt hoặc viết dài phổ biến trong tuyển sinh. */
export function chuanHoaTuKhoa(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/(?<![\p{L}\p{N}])(?:trường\s+)?đại\s+học(?![\p{L}\p{N}])/gui, "đh");
  s = s.replace(/(?<![\p{L}\p{N}])(?:truong\s+)?dai\s+hoc(?![\p{L}\p{N}])/gui, "dh");
  s = s.replace(/(?<![\p{L}\p{N}])học\s+viện(?![\p{L}\p{N}])/gui, "hv");
  s = s.replace(/(?<![\p{L}\p{N}])hoc\s+vien(?![\p{L}\p{N}])/gui, "hv");
  s = s.replace(/(?<![\p{L}\p{N}])cao\s+đẳng(?![\p{L}\p{N}])/gui, "cđ");
  s = s.replace(/(?<![\p{L}\p{N}])cao\s+dang(?![\p{L}\p{N}])/gui, "cd");
  s = s.replace(/(?<![\p{L}\p{N}])đại\s+học\s+quốc\s+gia(?![\p{L}\p{N}])/gui, "đhqg");
  s = s.replace(/(?<![\p{L}\p{N}])dai\s+hoc\s+quoc\s+gia(?![\p{L}\p{N}])/gui, "dhqg");
  s = s.replace(/(?<![\p{L}\p{N}])công\s+nghệ\s+thông\s+tin(?![\p{L}\p{N}])/gui, "cntt");
  s = s.replace(/(?<![\p{L}\p{N}])cong\s+nghe\s+thong\s+tin(?![\p{L}\p{N}])/gui, "cntt");
  s = s.replace(/(?<![\p{L}\p{N}])khoa\s+học\s+máy\s+tính(?![\p{L}\p{N}])/gui, "khmt");
  s = s.replace(/(?<![\p{L}\p{N}])kỹ\s+thuật\s+phần\s+mềm(?![\p{L}\p{N}])/gui, "ktpm");
  s = s.replace(/(?<![\p{L}\p{N}])an\s+toàn\s+thông\s+tin(?![\p{L}\p{N}])/gui, "attt");
  s = s.replace(/(?<![\p{L}\p{N}])quản\s+trị\s+kinh\s+doanh(?![\p{L}\p{N}])/gui, "qtkd");
  s = s.replace(/(?<![\p{L}\p{N}])thương\s+mại\s+điện\s+tử(?![\p{L}\p{N}])/gui, "tmdt");
  s = s.replace(/(?<![\p{L}\p{N}])kinh\s+tế\s+quốc\s+dân(?![\p{L}\p{N}])/gui, "ktqd");
  s = s.replace(/(?<![\p{L}\p{N}])sư\s+phạm\s+kỹ\s+thuật(?![\p{L}\p{N}])/gui, "spkt");
  return s;
}

interface ChuoiTimKiem {
  goc: string;
  khongDau: string;
}

const BO_DEM_CHUOI = new WeakMap<LuaChon, ChuoiTimKiem>();

/** Tạo hoặc lấy từ bộ đệm chuỗi văn bản phục vụ so khớp nhanh cho mỗi lựa chọn. */
export function layChuoiTimKiem(l: LuaChon): ChuoiTimKiem {
  const daCo = BO_DEM_CHUOI.get(l);
  if (daCo) return daCo;

  const ma = l.truong || "";
  const tenTruong = l.tenTruong || l.truong || "";
  const nganh = l.nganh || "";
  const nhom = l.nhomNganh || "";
  const khuVuc = l.khuVuc || "";
  const toHop = (l.toHopXet || []).join(" ");
  const moTa = l.moTa || "";

  // Tạo thêm các biến thể tên trường đầy đủ: "ĐH" -> "Đại học", "HV" -> "Học viện"
  const tenMoRong = tenTruong
    .replace(/\bĐH\b/g, "Đại học")
    .replace(/\bHV\b/g, "Học viện")
    .replace(/\bCĐ\b/g, "Cao đẳng")
    .replace(/\bĐHQG\b/g, "Đại học Quốc gia");

  // Các biệt danh / tên viết tắt sinh viên hay gọi
  const bietDanh = (BIET_DANH_TRUONG[ma] || []).join(" ");

  const goc = `${ma} ${tenTruong} ${tenMoRong} ${nganh} ${nhom} ${khuVuc} ${toHop} ${bietDanh} ${moTa}`.toLowerCase();
  const khongDau = boDau(goc);

  const ketQua: ChuoiTimKiem = { goc, khongDau };
  BO_DEM_CHUOI.set(l, ketQua);
  return ketQua;
}

/** Từ đệm không mang nghĩa phân biệt trong tìm kiếm trường/ngành */
const TU_DEM = new Set([
  "trường", "truong", "đại", "học", "dai", "hoc", "ngành", "nganh",
  "khoa", "viện", "vien", "và", "va", "của", "cua", "ở", "o", "tại", "tai"
]);

/**
 * Kiểm tra xem một lựa chọn ngành học có khớp với từ khóa người dùng nhập hay không.
 * Xử lý thông minh: không dấu, viết tắt, từ đồng nghĩa, tìm kiếm đa từ (multi-token).
 */
export function khopTuKhoa(l: LuaChon, tuKhoa: string): boolean {
  if (!tuKhoa || !tuKhoa.trim()) return true;

  const rawK = tuKhoa.trim().toLowerCase();
  const kKhongDau = boDau(rawK);
  const target = layChuoiTimKiem(l);

  // 1. Khớp cụm trực tiếp (có dấu và không dấu)
  if (target.goc.includes(rawK) || target.khongDau.includes(kKhongDau)) {
    return true;
  }

  // 2. Thử với cụm từ đã chuẩn hóa từ đồng nghĩa tuyển sinh ("đại học công nghệ" -> "đh công nghệ")
  const kChuanHoa = chuanHoaTuKhoa(rawK);
  if (target.goc.includes(kChuanHoa) || target.khongDau.includes(boDau(kChuanHoa))) {
    return true;
  }

  // 3. Phân tách thành các token và so khớp đa từ (VD: "bách khoa cntt", "công nghệ tphcm", "kinh tế luật")
  const tokens = rawK.split(/\s+/).filter(Boolean);
  const tokensKhongDau = kKhongDau.split(/\s+/).filter(Boolean);

  // Lọc bỏ từ đệm nếu người dùng gõ từ 2 từ trở lên
  const tokensCanKhop = tokens.filter((t) => tokens.length === 1 || !TU_DEM.has(t));
  const tokensKdCanKhop = tokensKhongDau.filter((t) => tokensKhongDau.length === 1 || !TU_DEM.has(t));

  if (tokensCanKhop.length === 0) return true;

  const tatCaKhop = tokensCanKhop.every((tok, idx) => {
    const tokKd = tokensKdCanKhop[idx];
    return target.goc.includes(tok) || target.khongDau.includes(tokKd);
  });

  return tatCaKhop;
}

/**
 * Tính điểm liên quan của kết quả tìm kiếm để đưa kết quả khớp nhất lên đầu.
 * Điểm càng cao thì càng ưu tiên hiển thị.
 */
export function diemLienQuan(l: LuaChon, tuKhoa: string): number {
  if (!tuKhoa || !tuKhoa.trim()) return 0;

  const k = tuKhoa.trim().toLowerCase();
  const kKd = boDau(k);
  const ma = (l.truong || "").toLowerCase();
  const nganh = (l.nganh || "").toLowerCase();
  const nganhKd = boDau(nganh);
  const truong = (l.tenTruong || "").toLowerCase();
  const truongKd = boDau(truong);

  let diem = 0;

  // 1. Khớp chính xác mã trường (VD: "QSC", "BKA", "UET")
  if (ma === k || ma === kKd) diem += 100;
  else if (ma.startsWith(k) || ma.startsWith(kKd)) diem += 50;

  // 2. Khớp biệt danh trường (VD: "uet", "uit", "hust", "neu")
  const bietDanh = BIET_DANH_TRUONG[l.truong] || [];
  if (bietDanh.some((b) => b === k || b === kKd)) diem += 80;

  // 3. Khớp chính xác tên ngành
  if (nganh === k || nganhKd === kKd) diem += 60;
  else if (nganh.startsWith(k) || nganhKd.startsWith(kKd)) diem += 45;
  else if (nganh.includes(k) || nganhKd.includes(kKd)) diem += 30;

  // 4. Khớp tên trường
  if (truong.includes(k) || truongKd.includes(kKd)) diem += 25;

  return diem;
}
