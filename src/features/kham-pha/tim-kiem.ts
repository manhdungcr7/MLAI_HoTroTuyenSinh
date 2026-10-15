// Module tìm kiếm thông minh cho ngành học & trường đại học / cao đẳng.
// Hỗ trợ tiếng Việt không dấu, viết tắt đại học/học viện, tên viết tắt trường (UET, UIT, HUST, NEU...),
// từ khóa tổ hợp (bách khoa cntt), và xếp hạng độ liên quan.

import type { LuaChon } from "@/state/types";
import { DS_TRUONG, bietDanhCua, boDauGiuKyTu } from "@/engine/truong";

/** Bỏ dấu tiếng Việt, đưa về chữ thường không dấu (giữ ký tự khác). Logic bỏ dấu ở engine/truong.ts. */
export function boDau(str: string): string {
  return boDauGiuKyTu(str).trim();
}

/** Mã trường -> các tên gọi thân thuộc, sinh từ bảng bí danh dùng chung (engine/truong.ts). */
export const BIET_DANH_TRUONG: Record<string, string[]> = Object.fromEntries(DS_TRUONG.map((t) => [t.ma, bietDanhCua(t.ma)]));

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
