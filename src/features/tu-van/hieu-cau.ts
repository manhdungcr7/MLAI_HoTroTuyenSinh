// Hiểu câu hỏi của học sinh thành ý định có cấu trúc (tỉnh, ngành, điểm, xếp hạng, trường). TypeScript thuần, không React, không gọi mạng.
// Chỉ nhận ra, không trả lời: trả lời nằm ở lay-du-lieu.ts (traLoiTuDong) và dựa trên dữ liệu thật.
import { chuanHoa, chuanHoaTinh, maTuVietTat, resolveTruong, TINH_CU_SANG_MOI, type KetQuaTruong } from "@/engine/truong";

const tachTu = (q: string): string[] => chuanHoa(q).split(" ").filter(Boolean);

/** Từ đệm khi tách cụm ngành ra khỏi câu hỏi. Có cả từ chỉ ý định (thấp, rẻ, nhất) để không khớp nhầm vào tên ngành. */
const TU_DEM = new Set([
  "truong", "nao", "co", "nganh", "day", "dao", "tao", "hoc", "o", "tai", "nhung", "cac", "gi", "khong", "a", "vay", "la", "nhe", "ha", "nha", "voi", "va",
  "em", "toi", "minh", "ban", "muon", "can", "tim", "hoi", "cho", "xin", "duoc", "thi", "mot", "nhu", "the", "nay", "do", "kia", "dang", "ky", "dai", "dh", "hoc", "vien",
  "tinh", "thanh", "pho", "khu", "vuc", "thuoc", "gan", "ve", "cua", "nen", "chon", "bao", "nhieu", "tien", "phi", "chi", "uoc", "tinh", "mac", "thap", "re", "nhat", "cao", "dat", "dau", "xem", "danh", "sach",
  "diem", "chuan", "so", "sanh", "them", "vao", "nguyen", "vong", "co", "hoi", "do", "tren", "duoi", "tam", "khoang", "vao", "goi",
]);

/** Viết tắt ngành thông dụng (đã chuẩn hóa) -> cụm đầy đủ. "it", "ai" bị bỏ vì trùng từ thường. */
const VIET_TAT_NGANH: Record<string, string> = {
  cntt: "cong nghe thong tin", ktpm: "ky thuat phan mem", attt: "an toan thong tin", khmt: "khoa hoc may tinh", httt: "he thong thong tin",
  qtkd: "quan tri kinh doanh", tcnh: "tai chinh ngan hang", ktdn: "ke toan", ngon: "ngon ngu",
};

export type MucTuongDuong = "chinh-xac" | "lien-quan";
export interface NhomNganh {
  ten: string;
  /** Tên ngành (đã chuẩn hóa) khớp đúng với ngành người hỏi. */
  chinhXac: (nganh: string) => boolean;
  /** Ngành gần nghĩa, phải ghi rõ "liên quan" khi hiển thị. */
  lienQuan: (nganh: string) => boolean;
}

const bat = (n: string, ds: string[]) => ds.some((x) => n.includes(x));
export const NHOM_NGANH: NhomNganh[] = [
  {
    ten: "Công nghệ thông tin",
    chinhXac: (n) => n.startsWith("cong nghe thong tin") || n === "tin hoc",
    lienQuan: (n) => !n.startsWith("su pham") && bat(n, ["khoa hoc may tinh", "ky thuat phan mem", "cong nghe phan mem", "he thong thong tin", "an toan thong tin", "an ninh mang", "tri tue nhan tao", "khoa hoc du lieu", "mang may tinh", "ky thuat may tinh", "tin hoc"]),
  },
];
/** Cụm đã chuẩn hóa cho thấy người hỏi nói về nhóm ngành nào. */
const NHAN_NHOM: { nhom: number; dau: RegExp }[] = [{ nhom: 0, dau: /\b(cong nghe thong tin|tin hoc|cntt)\b/ }];

export type TheLoaiHoi =
  | "them-nguyen-vong" | "la-truong-gi" | "co-hoi" | "so-sanh-truong" | "kham-pha-truong" | "xep-hang-hoc-phi" | "cho-o" | "khac";

export interface YDinhCau {
  q: string;
  kieu: TheLoaiHoi;
  tinh: string | null;
  /** Tỉnh người dùng gõ (có thể là tên cũ). */
  tinhGoc: string | null;
  nhom: NhomNganh | null;
  /** Cụm ngành chung (đã chuẩn hóa, bỏ từ đệm), rỗng nếu không nêu. */
  cumNganh: string;
  /** Cụm ngành giữ nguyên chữ có dấu như người dùng gõ, để hiển thị. */
  cumHienThi: string;
  diem: number | null;
  xepHang: "hoc-phi-thap" | "hoc-phi-cao" | null;
  /** "trường này", "trường đó", "nó": trỏ về lượt trước. */
  daiTu: boolean;
}

/** Tìm tên tỉnh trong câu: cụm dài nhất, bỏ qua khi đứng ngay sau "đại học/trường/học viện" (đó là tên trường như "ĐH Hà Nội"). */
export function timTinhTrongCau(cau: string): { tinh: string; goc: string; tu: string[] } | null {
  const tu = tachTu(cau);
  for (let n = 4; n >= 1; n--) {
    for (let i = 0; i + n <= tu.length; i++) {
      const cum = tu.slice(i, i + n).join(" ");
      if (cum.length < 2) continue;
      const tinh = chuanHoaTinh(cum);
      if (!tinh) continue;
      const truoc = tu.slice(Math.max(0, i - 2), i).join(" ");
      if (/(^| )(dai hoc|dh|truong|hoc vien|hv)$/.test(truoc)) continue;
      return { tinh, goc: cum, tu: [...tu.slice(0, i), ...tu.slice(i + n)] };
    }
  }
  return null;
}

/** Cũ -> mới: "Vĩnh Long (gồm Trà Vinh, Bến Tre cũ)" cho người dùng hiểu vì sao có trường tên tỉnh khác. */
export function ghiChuTinhGop(tinh: string): string {
  const cu = Object.entries(TINH_CU_SANG_MOI).filter(([, moi]) => moi === tinh).map(([c]) => c);
  return cu.length ? `${tinh} (gồm ${cu.join(", ")} cũ)` : tinh;
}

/** Số điểm người dùng nêu (10 đến 30). Chấp nhận "23", "23 điểm", "được 24,5", bỏ qua năm, học phí, tuổi. */
export function timDiemTrongCau(cau: string): number | null {
  const q = cau.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const m of q.matchAll(/(?<![\d.,/])(\d{2}(?:[.,]\d{1,2})?)(?![\d/])(?:\s*(\S+))?/g)) {
    const v = parseFloat(m[1].replace(",", "."));
    if (!(v >= 10 && v <= 30)) continue;
    const sau = m[2] ?? "";
    if (/^(trieu|tr|nam|tuoi|%|phan|truong|nganh|nguyen|mon|ngay|thang|lop|nghin|k$)/.test(sau)) continue;
    const truoc = q.slice(Math.max(0, (m.index ?? 0) - 14), m.index ?? 0);
    if (/(hoc phi|duoi|tren|toi da|ngan sach|lop|nam|thang|ngay)\s*$/.test(truoc)) continue;
    return v;
  }
  return null;
}

/** "X là trường gì / là gì / là ai": phần X. Không bắt "ngành X là gì". */
export function chuTruongDinhNghia(cau: string): string | null {
  const q = chuanHoa(cau);
  const m = q.match(/^(?:truong |dai hoc |dh )?(.+?) la (?:mot )?(?:truong|dai hoc|hoc vien)? ?(?:gi|nao|o dau|the nao)$/) ?? q.match(/^(?:truong|dh) (.+?) la (?:gi|truong gi)$/);
  if (!m) return null;
  const x = m[1].trim();
  if (!x || /^nganh /.test(x)) return null;
  return x;
}

export function phanTichCau(cau: string): YDinhCau {
  const q = chuanHoa(cau);
  let tinhTim = timTinhTrongCau(cau);
  // Tên tỉnh nằm trong tên một trường ("ĐH Bách Khoa Hà Nội"): đó là tên trường, không phải bộ lọc tỉnh.
  const truongs = timTruongTrongCau(cau);
  if (tinhTim && truongs.some((t) => t.chuoi.split(" ").length > tinhTim!.goc.split(" ").length && ` ${t.chuoi} `.includes(` ${tinhTim!.goc} `))) tinhTim = null;
  // Từ thuộc tên trường không tính vào cụm ngành ("ĐH Công nghệ Thông tin - ĐHQG" không có nghĩa là hỏi ngành CNTT).
  const tuTenTruong = new Set(truongs.flatMap((t) => t.chuoi.split(" ")));
  const conLai = (tinhTim?.tu ?? tachTu(cau)).filter((t) => !tuTenTruong.has(t)).map((t) => VIET_TAT_NGANH[t] ?? t);
  const nhomIdx = NHAN_NHOM.find((n) => n.dau.test(conLai.join(" ")));
  const cumNganh = conLai.join(" ").split(" ").filter((t) => t && !TU_DEM.has(t) && !/^\d+$/.test(t)).join(" ");
  const diem = timDiemTrongCau(cau);
  const cumTu = new Set(cumNganh.split(" "));
  const cumHienThi = cau.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w && cumTu.has(chuanHoa(w))).join(" ");
  const hocPhi = /\bhoc phi\b|\bchi phi\b|\bhoc re\b|\bre nhat\b/.test(q);
  const xepHang = hocPhi && /\b(thap|re|it|thap nhat|re nhat|vua tui)\b/.test(q) ? "hoc-phi-thap" : hocPhi && /\b(cao nhat|dat nhat|dat)\b/.test(q) ? "hoc-phi-cao" : null;
  const daiTu = /\b(truong|nganh|khoa|cai|no|noi) (nay|do|kia|ay)\b|\b(truong|nganh) vua roi\b|\bno\b/.test(q);
  let kieu: TheLoaiHoi = "khac";
  if (/\bthem\b.*\bnguyen vong\b|\bdua\b.*\bnguyen vong\b|\bluu\b.*\bnguyen vong\b|\bbo sung\b.*\bnguyen vong\b/.test(q)) kieu = "them-nguyen-vong";
  else if (chuTruongDinhNghia(cau)) kieu = "la-truong-gi";
  else if (/\b(co co hoi|co nen|co kha nang|do khong|dau khong|do duoc khong|vao duoc khong|co du diem|nen dang ky|nen chon|co dau|co do)\b/.test(q) && (diem !== null || daiTu || /co hoi|do khong|dau khong/.test(q)) && !/viec lam|nghe nghiep|luong|ra truong/.test(q)) kieu = "co-hoi";
  else if (/\bso sanh\b/.test(q) && (new Set(truongs.filter((t) => t.chuoi !== tinhTim?.goc).map((t) => t.kq.ma)).size >= 2 || (/\btruong\b/.test(q) && !/\bnganh\b/.test(q)))) kieu = "so-sanh-truong";
  else if (/\b(ky tuc|ktx|o tro|nha tro|cho o|noi o)\b/.test(q)) kieu = "cho-o";
  else if (xepHang) kieu = "xep-hang-hoc-phi";
  else if (tinhTim && (/\btruong\b/.test(q) || cumNganh) && !/\b(diem chuan|hoc phi|viec lam)\b/.test(q)) kieu = "kham-pha-truong";
  else if (/\btruong nao\b|\bnhung truong\b|\bco truong\b/.test(q) && cumNganh) kieu = "kham-pha-truong";
  return { q, kieu, tinh: tinhTim?.tinh ?? null, tinhGoc: tinhTim?.goc ?? null, nhom: nhomIdx ? NHOM_NGANH[nhomIdx.nhom] : null, cumNganh, cumHienThi, diem, xepHang, daiTu };
}

/** Các trường được nêu trong câu (tên, mã, viết tắt). Chỉ nhận khớp chính xác; mơ hồ thì bỏ qua, để lớp trên hỏi lại. `boQuaCum`: cụm đã dùng làm tên tỉnh. */
export interface TruongNeu { chuoi: string; kq: KetQuaTruong }
export function timTruongTrongCau(cau: string, boQuaCum: (string | null)[] = []): TruongNeu[] {
  const tu = tachTu(cau);
  const dung = new Array<boolean>(tu.length).fill(false);
  for (const c of boQuaCum) {
    if (!c) continue;
    const ct = c.split(" ");
    for (let i = 0; i + ct.length <= tu.length; i++) if (ct.every((x, j) => tu[i + j] === x)) for (let j = 0; j < ct.length; j++) dung[i + j] = true;
  }
  const ra: { chuoi: string; kq: KetQuaTruong; vt: number }[] = [];
  for (let n = Math.min(10, tu.length); n >= 1; n--) {
    for (let i = 0; i + n <= tu.length; i++) {
      if (dung.slice(i, i + n).some(Boolean)) continue;
      const cum = tu.slice(i, i + n).join(" ");
      // Một từ đơn chỉ được coi là trường khi nó là mã hoặc viết tắt riêng của đúng một trường (uit, dtl), không phải từ thường như "viet".
      if (n === 1 && (TU_DEM.has(cum) || VIET_TAT_NGANH[cum] || maTuVietTat(cum).length !== 1)) continue;
      const kq = resolveTruong(cum);
      if (kq.kieu !== "chinh-xac" || !kq.ma) continue;
      ra.push({ chuoi: cum, kq, vt: i });
      for (let j = i; j < i + n; j++) dung[j] = true;
    }
  }
  return ra.sort((a, b) => a.vt - b.vt).map(({ chuoi, kq }) => ({ chuoi, kq }));
}
