// Hiểu câu tìm kiếm tự nhiên ("ngân hàng sài gòn dưới 30 triệu 24 điểm") thành bộ lọc + từ khóa còn lại. TypeScript thuần, chạy tại máy, không gọi AI.
// Chỉ nhận ra những gì dữ liệu có: nhóm ngành, khu vực (tỉnh trường), học phí, điểm chuẩn. Không đoán "trường công" vì dữ liệu chưa ghi loại hình trường.
import { hangTimKiem } from "@/engine/tim-kiem";
import { dinhDang } from "@/engine/dinh-dang";
import type { LuaChon } from "@/state/types";

export interface YDinh {
  nhom: string[];
  /** Tỉnh/thành đúng như `LuaChon.khuVuc`. */
  khuVuc: string[];
  nhanKhuVuc: string;
  hocPhiToiDa?: number;
  diem?: { gia: number; kieu: "quanh" | "duoi" | "tren" };
  /** Từ khóa ngành thích hợp: ngành chứa các cụm này được xếp lên trước (không loại ngành khác). */
  uuTien: string[];
  /** Phần câu chưa hiểu được: đi tiếp vào tìm theo tên trường/ngành. */
  tuKhoaConLai: string;
  chip: string[];
}

const chuanHoa = (q: string) => q.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
  .replace(/(\d)[,.](\d)/g, "$1_$2").replace(/[^a-z0-9_]+/g, " ").trim();
const so = (s: string) => Number(s.replace("_", "."));
const cum = (p: string) => new RegExp(`(^| )${p}(?= |$)`);

const MIEN_BAC = ["Hà Nội", "Bắc Ninh", "Phú Thọ", "Ninh Bình", "Hải Phòng", "Hưng Yên", "Thái Nguyên"];
const MIEN_TRUNG = ["Đà Nẵng", "Huế", "Quảng Ngãi", "Quảng Trị", "Thanh Hóa", "Nghệ An", "Khánh Hòa", "Gia Lai", "Đắk Lắk", "Lâm Đồng"];
const MIEN_NAM = ["TP.HCM", "Đồng Nai", "Tây Ninh", "Cần Thơ", "Cà Mau", "Vĩnh Long", "Đồng Tháp"];
const KHU_VUC: { p: string; ds: string[]; nhan: string }[] = [
  { p: "mien nam", ds: MIEN_NAM, nhan: "miền Nam" }, { p: "mien bac", ds: MIEN_BAC, nhan: "miền Bắc" }, { p: "mien trung", ds: MIEN_TRUNG, nhan: "miền Trung" },
  { p: "(?:sai gon|tp ?hcm|tphcm|hcm|ho chi minh|thanh pho ho chi minh)", ds: ["TP.HCM"], nhan: "TP.HCM" },
  { p: "(?:ha noi|hn)", ds: ["Hà Nội"], nhan: "Hà Nội" }, { p: "da nang", ds: ["Đà Nẵng"], nhan: "Đà Nẵng" },
  { p: "can tho", ds: ["Cần Thơ"], nhan: "Cần Thơ" }, { p: "hai phong", ds: ["Hải Phòng"], nhan: "Hải Phòng" }, { p: "hue", ds: ["Huế"], nhan: "Huế" },
  { p: "(?:dong nai|bien hoa)", ds: ["Đồng Nai"], nhan: "Đồng Nai" }, { p: "(?:nha trang|khanh hoa)", ds: ["Khánh Hòa"], nhan: "Khánh Hòa" },
  { p: "(?:da lat|lam dong)", ds: ["Lâm Đồng"], nhan: "Lâm Đồng" }, { p: "(?:vinh|nghe an)", ds: ["Nghệ An"], nhan: "Nghệ An" },
];

/** Nghề/sở thích → nhóm ngành trong dữ liệu + từ khóa ngành ưu tiên. */
const NGHE: { p: string; nhom: string[]; uu?: string[] }[] = [
  { p: "(?:ai|tri tue nhan tao|machine learning|hoc may)", nhom: ["CNTT"], uu: ["tri tue nhan tao", "hoc may", "khoa hoc du lieu", "may tinh"] },
  { p: "(?:lap trinh(?: vien)?|code|coding|phan mem|cntt|cong nghe thong tin|it)", nhom: ["CNTT"], uu: ["phan mem", "khoa hoc may tinh", "cong nghe thong tin"] },
  { p: "(?:du lieu|data|an ninh mang|bao mat)", nhom: ["CNTT"], uu: ["du lieu", "an toan thong tin"] },
  { p: "(?:ngan hang|chung khoan|dau tu|bao hiem)", nhom: ["Tài chính"], uu: ["ngan hang", "tai chinh"] },
  { p: "(?:ke toan|kiem toan|tai chinh)", nhom: ["Tài chính"], uu: ["ke toan", "kiem toan", "tai chinh"] },
  { p: "(?:kinh doanh|quan tri|khoi nghiep|thuong mai)", nhom: ["Kinh tế"], uu: ["quan tri", "kinh doanh"] },
  { p: "(?:chua benh|bac si|y khoa|y hoc|duoc si|duoc)", nhom: ["Y Dược"], uu: ["y khoa", "duoc"] },
  { p: "(?:dieu duong|cham soc benh nhan|ho sinh)", nhom: ["Điều dưỡng"], uu: ["dieu duong"] },
  { p: "(?:day hoc|giao vien|su pham)", nhom: ["Sư phạm"] },
  { p: "(?:ve|thiet ke|do hoa|my thuat|sang tao)", nhom: ["Thiết kế"], uu: ["thiet ke", "do hoa", "my thuat"] },
  { p: "(?:logistics|chuoi cung ung|van tai|xuat nhap khau)", nhom: ["Logistics"], uu: ["logistics", "chuoi cung ung"] },
  { p: "(?:marketing|quang cao|truyen thong|pr)", nhom: ["Marketing", "Báo chí"], uu: ["marketing", "truyen thong"] },
  { p: "(?:bao chi|nha bao|bien tap)", nhom: ["Báo chí"] },
  { p: "(?:luat su|luat|phap ly)", nhom: ["Luật"] },
  { p: "(?:kien truc su|kien truc|quy hoach)", nhom: ["Kiến trúc"] },
  { p: "(?:xay dung|cau duong)", nhom: ["Xây dựng"] },
  { p: "(?:du lich|khach san|nha hang|am thuc)", nhom: ["Du lịch"] },
  { p: "(?:ngoai ngu|tieng anh|tieng nhat|tieng han|tieng trung|phien dich)", nhom: ["Ngôn ngữ"] },
  { p: "(?:nong nghiep|lam nghiep|thuy san|thu y)", nhom: ["Nông Lâm"] },
  { p: "(?:co khi|dien tu|o to|tu dong hoa|ky thuat)", nhom: ["Kỹ thuật"] },
  { p: "(?:the thao|huan luyen vien)", nhom: ["Thể thao"] },
];

const TU_DEM = new Set(["nganh", "truong", "dai", "hoc", "muon", "toi", "em", "minh", "o", "tai", "co", "va", "gan", "diem", "phi", "chuan", "khoang", "quanh", "tim", "cho", "la", "nam", "khu", "vuc", "duoi", "tren", "re", "thap"]);

/** Phân tích câu tìm. Câu chỉ là tên trường (có cụm nằm liền trong tên trường, như "đại học hà nội") thì không đoán địa điểm/nghề. */
export function hieuCauTim(q: string, ds: LuaChon[]): YDinh {
  const rong: YDinh = { nhom: [], khuVuc: [], nhanKhuVuc: "", uuTien: [], tuKhoaConLai: q, chip: [] };
  let t = chuanHoa(q);
  if (!t) return rong;
  const y: YDinh = { ...rong, nhom: [], khuVuc: [], uuTien: [], chip: [] };
  const lay = (re: RegExp): RegExpMatchArray | null => { const m = t.match(re); if (m) t = t.replace(re, " ").replace(/\s+/g, " ").trim(); return m; };

  // Học phí: "dưới 30 triệu", "30tr", "học phí rẻ"
  const hp = lay(/(?:\b(?:duoi|toi da|khong qua|nho hon|re hon)\s+)?\b(\d+(?:_\d+)?)\s*(?:trieu|tr)\b(?:\s*nam)?/);
  if (hp) y.hocPhiToiDa = so(hp[1]);
  else if (lay(/\bhoc phi\s+(?:re|thap|vua phai|mem)\b/)) y.hocPhiToiDa = 25;
  if (y.hocPhiToiDa !== undefined) y.chip.push(`Học phí ≤ ${dinhDang(y.hocPhiToiDa, 0)}tr`);

  // Điểm: "24 điểm", "25đ", "dưới 22 điểm", "trên 26 điểm"
  const dm = lay(/(?:\b(duoi|tren|tu|khoang|quanh|tam)\s+)?\b(\d{2}(?:_\d+)?)\s*(?:diem|d)\b/);
  if (dm && so(dm[2]) >= 10 && so(dm[2]) <= 30) {
    const kieu = dm[1] === "duoi" ? "duoi" : dm[1] === "tren" || dm[1] === "tu" ? "tren" : "quanh";
    y.diem = { gia: so(dm[2]), kieu };
    y.chip.push(`Điểm chuẩn ${kieu === "duoi" ? "≤" : kieu === "tren" ? "≥" : "quanh"} ${dinhDang(y.diem.gia, 1)}`);
  }

  // Địa điểm và nghề/sở thích chỉ hiểu khi câu không phải tên trường (hoặc đã có số kèm theo).
  const laTenTruong = y.chip.length === 0 && ds.some((l) => hangTimKiem(l, q) === 3);
  if (!laTenTruong) {
    const tinh = new Set<string>(); const nhan: string[] = [];
    for (const k of KHU_VUC) if (lay(cum(k.p))) { k.ds.forEach((x) => tinh.add(x)); nhan.push(k.nhan); }
    if (tinh.size) { y.khuVuc = [...tinh]; y.nhanKhuVuc = nhan.join(", "); y.chip.push(`Khu vực ${y.nhanKhuVuc}`); }
    const nhom = new Set<string>(); const uu = new Set<string>();
    for (const n of NGHE) if (lay(cum(n.p))) { n.nhom.forEach((x) => nhom.add(x)); n.uu?.forEach((x) => uu.add(x)); }
    if (nhom.size) { y.nhom = [...nhom]; y.uuTien = [...uu]; y.chip.unshift(`Nhóm ${y.nhom.join(" / ")}`); }
  }

  if (y.chip.length === 0) return rong;
  y.tuKhoaConLai = t.split(" ").filter((x) => x && !TU_DEM.has(x)).join(" ");
  return y;
}

/** Lọc theo phần đã hiểu (chưa gồm từ khóa còn lại). */
export function locTheoY<T extends LuaChon>(ds: T[], y: YDinh): T[] {
  if (y.chip.length === 0) return ds;
  return ds.filter((l) => {
    if (y.nhom.length && !y.nhom.includes(l.nhomNganh)) return false;
    if (y.khuVuc.length && !y.khuVuc.includes(l.khuVuc)) return false;
    if (y.hocPhiToiDa !== undefined && !(typeof l.hocPhiMin === "number" && l.hocPhiMin <= y.hocPhiToiDa)) return false;
    if (y.diem) {
      if (l.phuongThuc && l.phuongThuc !== "THPT") return false;
      const d = l.diemMin - y.diem.gia;
      if (y.diem.kieu === "duoi" ? d > 0 : y.diem.kieu === "tren" ? d < 0 : Math.abs(d) > 2) return false;
    }
    return true;
  });
}

const nganhChuan = new WeakMap<LuaChon, string>();
/** Xếp ổn định: ngành chứa từ khóa nghề lên trước, rồi điểm chuẩn gần mốc người dùng nêu; còn lại giữ thứ tự đang có. */
export function xepTheoY<T extends LuaChon>(ds: T[], y: YDinh): T[] {
  if (!y.uuTien.length && !y.diem) return ds;
  const diem = (l: LuaChon) => {
    let v = 0;
    if (y.uuTien.length) {
      let n = nganhChuan.get(l);
      if (n === undefined) { n = chuanHoa(l.nganh); nganhChuan.set(l, n); }
      if (y.uuTien.some((k) => (n as string).includes(k))) v += 3;
    }
    if (y.diem) v -= Math.abs(l.diemMin - y.diem.gia);
    return v;
  };
  const m = new Map(ds.map((l) => [l.id, diem(l)]));
  return [...ds].sort((a, b) => (m.get(b.id) as number) - (m.get(a.id) as number));
}
