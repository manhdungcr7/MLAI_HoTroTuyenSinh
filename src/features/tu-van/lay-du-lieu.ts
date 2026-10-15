// Chuẩn bị dữ liệu cho Tư vấn AI và trả lời tự động khi chưa có dịch vụ AI. TypeScript thuần, không gọi mạng.
import { duBaoCua } from "@/features/kham-pha/du-bao";
import { LUA_CHON_MAU, tim as timTheoId } from "@/data/lua-chon-mau";
import type { NguonTaiSau } from "@/data/lua-chon-that";
import { chuanHoa as chuanHoaChung, locTheoTinh, maTuVietTat, resolveTruong, tenTruong, tinhCuaTruong } from "@/engine/truong";
import { NGAN_SACH_TOI_DA, nhanNguyenVong, nhanChoLuaChon, khoangCachTheoMon } from "@/engine/phan-tich";
import { hieuCauTim } from "@/engine/hieu-cau-tim";
import type { HanhDongDeXuat, HoSoTomTat, SuKien, TrangThaiDuLieu } from "@/engine/tu-van";
import { chuTruongDinhNghia, ghiChuTinhGop, phanTichCau, timTruongTrongCau, type MucTuongDuong, type YDinhCau } from "./hieu-cau";
import type { ChoTraLoi, LuaChonNhanh, TheTruong, TinNhan } from "./hoi-thoai";
import { tinhCoHoi } from "@/features/kham-pha/co-hoi";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { goiYDanhSach, moNeoNV1 } from "@/features/nguyen-vong/goi-y-danh-sach";
import { cauKhoangCachNV1, phanTichMoNeo } from "@/features/nguyen-vong/mo-neo";
import type { AppState } from "@/state/store";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import type { DiemDayDu, LuaChon } from "@/state/types";
import { danhGiaDanhMucToanDien } from "@/engine/toi-uu-nguyen-vong";

const khongDau = chuanHoaChung;
const BO_QUA = new Set(["nganh", "truong", "hoc", "dai", "diem", "chuan", "em", "la", "co", "khong", "nao", "gi", "the", "can", "muon", "cua", "va", "voi", "cho", "nen", "o", "tai", "nhu", "bao", "nhieu", "hay", "duoc", "thi", "mot", "cac", "nhung", "minh", "toi", "xin", "hoi", "ve", "tu", "den", "thay", "khac", "tot", "so", "sanh", "dau", "ra", "sao", "lam", "chinh", "quy", "con", "kia", "tren", "vay", "truoc", "tuong", "phi", "thap", "nhat", "cao", "dat", "uoc", "chon", "them", "nguyen", "vong"]);

/** Các cụm từ quen thuộc chỉ trường (đối chiếu tên tiếng Việt). */
export const CUM_TU_TRUONG: { regex: RegExp; ma: string }[] = [
  { regex: /\b(bach khoa ha noi|dh bach khoa ha noi|bkhn|hust)\b/i, ma: "BKA" },
  { regex: /\b(bach khoa (?:tp\.?hcm|hcm|sai gon)|qsb)\b/i, ma: "QSB" },
  { regex: /\b(bach khoa da nang|ddk)\b/i, ma: "DDK" },
  { regex: /\b(bach khoa|dai hoc bach khoa)\b/i, ma: "BKA" },
  { regex: /\b(kinh te quoc dan|ktqd|neu)\b/i, ma: "KHA" },
  { regex: /\b(ngoai thuong|ftu)\b/i, ma: "NTH" },
  { regex: /\b(cong nghe thong tin|dh cntt|uit)\b/i, ma: "QSC" },
  { regex: /\b(khoa hoc tu nhien (?:tp\.?hcm|hcm)|hcmus)\b/i, ma: "QST" },
  { regex: /\b(khoa hoc tu nhien (?:ha noi|hn)|hus)\b/i, ma: "QHT" },
  { regex: /\b(buu chinh vien thong|ptit)\b/i, ma: "BVH" },
  { regex: /\b(su pham ky thuat|hcmute|spkt)\b/i, ma: "SPK" },
  { regex: /\b(dai hoc cong nghe|dh cong nghe|uet)\b/i, ma: "QHI" },
  { regex: /\b(dai hoc kinh te|ueb)\b/i, ma: "QHE" },
  { regex: /\b(hoc vien ngan hang|hvnh)\b/i, ma: "NHH" },
  { regex: /\b(hoc vien tai chinh|aof)\b/i, ma: "HTC" },
  { regex: /\b(y ha noi|hmu)\b/i, ma: "YHB" },
  { regex: /\b(y duoc (?:tp\.?hcm|hcm)|ump|yds)\b/i, ma: "YDS" },
  { regex: /\b(thuong mai|tmu)\b/i, ma: "TMU" },
  { regex: /\b(giao thong van tai|utc)\b/i, ma: "GHA" },
  { regex: /\b(xay dung|huce)\b/i, ma: "XDA" },
  { regex: /\b(thuy loi|tlu)\b/i, ma: "TLA" },
];

/** Em gõ có dấu thì so khớp có dấu (để "bạn" không khớp "Bản"); gõ không dấu thì so khớp không dấu. */
const coDauTiengViet = (t: string) => /[^\x00-\x7f]/.test(t);
const chuanHoa = (t: string, coDau: boolean) => (coDau ? t.toLowerCase().replace(/đ/g, "d").replace(/[^\p{L}\p{N}]+/gu, " ").trim() : khongDau(t));

export function tachTuKhoa(cauHoi: string): string[] {
  const coDau = coDauTiengViet(cauHoi);
  return [...new Set(chuanHoa(cauHoi, coDau).split(" ").filter((t) => (t.length >= 3 && !BO_QUA.has(khongDau(t))) || maTuVietTat(t).length > 0))];
}

/** Câu nối tiếp dùng đại từ hoặc "còn … thì sao": ngành/trường phải lấy từ lượt trước. */
export function coDaiTu(cauHoi: string): boolean {
  const q = khongDau(cauHoi);
  return /\b(nganh|truong|khoa|chuong trinh|cai|mon|ban|phuong an|lua chon) (do|nay|kia|ay|tren|dau tien|thu hai|con lai)\b|\b(o tren|vua roi|con lai|nhu vay|nhu the|hai nganh|hai truong)\b|^con .+ (thi )?(sao|the nao|ra sao)\b|\bcon .+ thi sao\b|\b(vay|the|vay thi|the thi) con\b|\b(so voi|cua|giong|hon|kem) no\b/.test(q);
}

/** Câu rất ngắn hỏi tiếp một chỉ tiêu mà không nêu ngành ("Có khó không?", "Bao nhiêu?"): hiểu là hỏi về ngành lượt trước. */
export function cauNganHoiTiep(cauHoi: string): boolean {
  const q = khongDau(cauHoi);
  return q.split(" ").length <= 6 && /^(the nao|sao|bao nhieu|co kho|kho khong|co nen|nen khong|duoc khong|nhieu khong|con gi|tai sao|vi sao)\b|\b(co kho|kho khong|nen khong|duoc khong|nhieu khong|bao nhieu|the nao)$/.test(q);
}

/** Ngành khớp câu hỏi: nhiều từ khóa trùng nhất lên đầu. */
export function timNganhKhop(cauHoi: string, toiDa = 8, ds: LuaChon[] = LUA_CHON_MAU): LuaChon[] {
  const tk = tachTuKhoa(cauHoi);
  if (tk.length === 0) return [];
  const coDau = coDauTiengViet(cauHoi);
  const qKhongDau = khongDau(cauHoi);
  const maTruongUuTien = new Set<string>();
  for (const c of CUM_TU_TRUONG) {
    if (c.regex.test(qKhongDau)) maTruongUuTien.add(c.ma);
  }

  const diem = (l: LuaChon) => {
    const nganh = ` ${chuanHoa(l.nganh, coDau)} `;
    const truong = ` ${chuanHoa(l.tenTruong, coDau)} ${chuanHoa(l.truong, coDau)} `;
    let nganhTrung = 0, truongTrung = 0;
    if (maTruongUuTien.size > 0 && l.maTruong && maTruongUuTien.has(l.maTruong)) {
      truongTrung += 6;
    }
    for (const t of tk) {
      const maVietTat = maTuVietTat(t);
      if (maVietTat.length > 0) { if (l.maTruong && maVietTat.includes(l.maTruong)) truongTrung += 2; continue; }
      if (nganh.includes(` ${t} `) || (t.length >= 5 && nganh.includes(t))) nganhTrung++;
      else if (truong.includes(` ${t} `) || (t.length >= 5 && truong.includes(t))) truongTrung++;
    }
    return nganhTrung * 2 + truongTrung;
  };
  return ds.map((l) => ({ l, d: diem(l) })).filter((x) => x.d > 0)
    .sort((a, b) => b.d - a.d || (Object.keys(b.l.diemTheoNam ?? {}).length - Object.keys(a.l.diemTheoNam ?? {}).length) || b.l.diemMin - a.l.diemMin)
    .slice(0, toiDa).map((x) => x.l);
}


export const moTaNguon = (l: LuaChon, nguon: NguonTaiSau | null): string => {
  const x = nguon?.nam[l.id]?.find((n) => n.nam === String(l.namDiem)) ?? nguon?.nam[l.id]?.[0];
  if (x) return `Đề án ${x.tai ?? x.nam}${x.trang ? `, trang ${x.trang}` : ""}`;
  return l.nguonCap === "official_pdf" ? "Đề án của trường" : "Trang tổng hợp, chưa đối chiếu với đề án";
};

/** SuKien kèm tổng điểm và tổ hợp của CHÍNH chương trình (cùng số màn chi tiết hiển thị). Máy chủ chưa đọc hai trường này. */
export type SuKienKemTong = SuKien & { tongCuaEm?: number; toHopDaTinh?: string };

export function dungSuKien(l: LuaChon, diem: DiemDayDu, nguon: NguonTaiSau | null): SuKienKemTong {
  const t = tongChoLuaChon(l, diem);
  const duBao = duBaoCua(l);
  const chenh = t.tong === null ? undefined : Math.round((t.tong - l.diemMin) * 100) / 100; // 2 chữ số, giống danhGia (phu-hop.ts)
  return {
    id: l.id, nganh: l.nganh, truong: l.truong, tenTruong: l.tenTruong, tinh: l.khuVuc, phuongThuc: l.phuongThuc ?? "THPT",
    toHop: l.toHopXet ?? [], diem: l.diemTheoNam ?? {},
    ...(t.tong !== null ? { nhanCuaEm: nhanNguyenVong(l, t.tong), chenh, tongCuaEm: t.tong, ...(t.toHop ? { toHopDaTinh: t.toHop } : {}) } : {}),
    ...(l.hocPhiMin !== undefined ? {
      hocPhiTrieu: l.hocPhiMin,
      ...(l.hocPhiUocTinh ? { hocPhiUocTinh: true } : {}),
      ...(l.hocPhiMax !== undefined && l.hocPhiMax !== l.hocPhiMin ? { hocPhiMaxTrieu: l.hocPhiMax } : {})
    } : {}),
    ...(l.tiLeViecLam !== undefined ? { tiLeViecLam: l.tiLeViecLam } : {}),
    ...(duBao ? { duBao: { nam: duBao.namDuBao, thap: duBao.thap, cao: duBao.cao } } : {}),
    nguon: moTaNguon(l, nguon),
  };
}

export function tomTatHoSo(s: AppState): HoSoTomTat {
  const h = s.hoSo;
  const diem = diemDayDu(s);
  const t = tongChoLuaChon({ toHopXet: [] }, diem);
  return {
    lop: h.khoi, tinh: h.tinh || undefined, nganhQuanTam: h.nganhQuanTam, nganSachToiDaTrieu: h.nganSach ? NGAN_SACH_TOI_DA[h.nganSach] : null, khuVuc: h.khuVuc,
    toHopCaoNhat: t.tong !== null && t.toHop ? { ma: t.toHop, tong: t.tong } : null,
    chungChiNgoaiNgu: h.chungChiNgoaiNgu?.diem ? `${h.chungChiNgoaiNgu.loai} ${h.chungChiNgoaiNgu.diem}` : null,
    diemDgnl: h.diemDgnl?.hcm ? `ĐHQG-HCM ${h.diemDgnl.hcm}/1200` : h.diemDgnl?.hn ? `HSA ${h.diemDgnl.hn}/150` : null,
    hocBa: h.hocBa?.dtb3Nam ? `ĐTB 3 năm ${h.hocBa.dtb3Nam}` : null,
    giaiThuongHsg: h.giaiThuongHsg?.cap ? `Giải ${h.giaiThuongHsg.giai ?? ""} môn ${h.giaiThuongHsg.mon ?? ""} cấp ${h.giaiThuongHsg.cap}` : null,
  };
}

/** Chọn các ngành đưa kèm câu hỏi: ngành khớp từ khóa, và (nếu hỏi về danh sách) các nguyện vọng của em. */
export function chonDuLieuKemTheo(cauHoi: string, s: AppState, nguon: NguonTaiSau | null, toiDa = 8, giuId: string[] = []): SuKienKemTong[] {
  const diem = diemDayDu(s);
  const hoiDanhSach = /nguyen vong|danh sach|can bang|an toan|thu suc/.test(khongDau(cauHoi));
  const chon: LuaChon[] = [];
  const them = (l?: LuaChon) => { if (l && !chon.some((c) => c.id === l.id) && chon.length < toiDa) chon.push(l); };
  // Câu hỏi nêu mức học phí ("dưới 40 triệu"): không gửi ngành có học phí (kể cả ước tính) cao hơn mức đó cho AI.
  const tran = hieuCauTim(cauHoi, LUA_CHON_MAU).hocPhiToiDa;
  const trongTran = (l: LuaChon) => tran === undefined || l.hocPhiMin === undefined || l.hocPhiMin <= tran;
  // Câu hỏi khám phá trường theo tỉnh/ngành ("Ở Vĩnh Long có trường nào dạy CNTT?"): gửi đúng các trường thật khớp, không khớp mờ địa danh.
  const y = phanTichCau(cauHoi);
  const khamPha = y.kieu === "kham-pha-truong" && timTruongTrongCau(cauHoi, [y.tinhGoc]).length === 0;
  const khop = khamPha
    ? (() => { const r = timTruongTheoYDinh(y); return [...r.chinhXac, ...r.lienQuan].flatMap((x) => (x.ct ? [x.ct] : [])).filter(trongTran).slice(0, toiDa); })()
    : timNganhKhop(cauHoi, toiDa * 3).filter(trongTran).slice(0, toiDa);
  if (khamPha) { khop.forEach(them); return chon.map((l) => dungSuKien(l, diem, nguon)); }
  // Câu nối tiếp ("ngành đó", "còn trường kia thì sao", hoặc không nêu ngành nào): giữ các ngành đã nói ở lượt trước.
  // Nếu câu còn nêu ngành mới thì chỉ giữ tối đa 4 để ngành mới vẫn có chỗ.
  const noiTiep = giuId.length > 0 && !hoiDanhSach && (coDaiTu(cauHoi) || khop.length === 0);
  if (noiTiep) giuId.slice(0, khop.length ? 4 : toiDa).forEach((id) => them(LUA_CHON_MAU.find((l) => l.id === id)));
  if (hoiDanhSach) s.nguyenVong.forEach((id) => them(LUA_CHON_MAU.find((l) => l.id === id)));
  khop.forEach(them);
  if (chon.length === 0) goiYDanhSach(diem, s.hoSo, s.nguyenVong, undefined, moNeoNV1(s)).filter((d) => trongTran(d.lc)).slice(0, 5).forEach((d) => them(d.lc));
  return chon.map((l) => dungSuKien(l, diem, nguon));
}


// ---------- Trả lời tự động (không cần dịch vụ AI) ----------
// Nguyên tắc: hiểu ý định trước (hieu-cau.ts), lọc dữ liệu thật, trả ngắn (2 đến 4 câu, tối đa 3 kết quả).
// Mọi con số lấy từ dữ liệu hoặc hồ sơ; thiếu thì hỏi lại đúng một câu hoặc nói chưa có, không điền thay.
const so1 = (x: number) => x.toFixed(1).replace(".", ",");
const NHAC_NGAN = "Điểm chuẩn là của các năm trước, năm nay có thể khác.";
const TOI_DA_HIEN = 3;

interface TuyChonDong { hocPhi?: boolean; duBao?: boolean; viecLam?: boolean }
const dongNganh = (d: SuKien, o: TuyChonDong | boolean = {}): string => {
  const t: TuyChonDong = typeof o === "boolean" ? { hocPhi: o } : o;
  const nam = Object.keys(d.diem).sort().reverse();
  const diemGanNhat = nam.length ? `điểm chuẩn ${nam[0]} là ${so1(d.diem[nam[0]])}` : "chưa có điểm chuẩn";
  const nhan = d.nhanCuaEm ? `, với điểm của bạn: ${d.nhanCuaEm}${d.chenh !== undefined ? ` (${d.chenh >= 0 ? "hơn" : "kém"} ${so1(Math.abs(d.chenh))} điểm)` : ""}` : "";
  const mucHp = d.hocPhiTrieu !== undefined
    ? `học phí khoảng ${so1(d.hocPhiTrieu)}${d.hocPhiMaxTrieu && d.hocPhiMaxTrieu !== d.hocPhiTrieu ? `–${so1(d.hocPhiMaxTrieu)}` : ""} triệu/năm${d.hocPhiUocTinh ? " (ước tính, chưa có văn bản của trường)" : ""}`
    : "chưa có dữ liệu học phí của ngành này";
  const hp = t.hocPhi ? `; ${mucHp}` : "";
  const duBaoStr = t.duBao && d.duBao ? `; dự báo ${d.duBao.nam}: ${so1(d.duBao.thap)}–${so1(d.duBao.cao)} (khoảng dự kiến, không phải điểm chính thức)` : "";
  const viecLamStr = t.viecLam ? (d.tiLeViecLam !== undefined ? `; việc làm ${so1(d.tiLeViecLam)}%` : "; chưa có dữ liệu việc làm") : "";
  return `• ${d.nganh}, ${d.tenTruong || d.truong} (${d.tinh}): ${diemGanNhat}${nhan}${duBaoStr}${hp}${viecLamStr}. Nguồn: ${d.nguon}.`;
};

/** Tri thức so sánh bản chất chuyên môn giữa các cặp ngành quen thuộc */
export const SO_SANH_NGANH_KIENTHUC: {
  regex: RegExp;
  tieuDe: string;
  phanTich: string;
}[] = [
  {
    regex: /(khoa hoc may tinh|cs).*(ky thuat phan mem|se)|(ky thuat phan mem|se).*(khoa hoc may tinh|cs)/i,
    tieuDe: "Khoa học máy tính (CS) và Kỹ thuật phần mềm (SE)",
    phanTich: `• **Khoa học máy tính (CS)**: nghiêng về nền tảng tính toán, giải thuật, trí tuệ nhân tạo và tối ưu thuật toán. Hợp với bạn thích toán và đào sâu cách hệ thống hoạt động.
• **Kỹ thuật phần mềm (SE)**: nghiêng về quy trình làm sản phẩm, thiết kế hệ thống, kiểm thử và triển khai. Hợp với bạn thích xây sản phẩm thật và làm việc nhóm.`
  },
  {
    regex: /(tri tue nhan tao|ai).*(khoa hoc du lieu|data science)|(khoa hoc du lieu|data science).*(tri tue nhan tao|ai)/i,
    tieuDe: "Trí tuệ nhân tạo (AI) và Khoa học dữ liệu",
    phanTich: `• **Trí tuệ nhân tạo (AI)**: xây mô hình học máy, học sâu, thị giác máy tính, xử lý ngôn ngữ.
• **Khoa học dữ liệu**: dùng thống kê và lập trình để thu thập, làm sạch, khai phá dữ liệu và dự báo xu hướng phục vụ ra quyết định.`
  },
  {
    regex: /(logistics).*(chuoi cung ung|supply chain)|(chuoi cung ung|supply chain).*(logistics)/i,
    tieuDe: "Logistics và Quản lý chuỗi cung ứng",
    phanTich: `• **Logistics**: khâu giao nhận, kho vận, vận chuyển, thủ tục hải quan.
• **Quản lý chuỗi cung ứng**: bao quát hơn, từ thu mua, hoạch định sản xuất, nhà cung cấp đến phân phối.`
  },
  {
    regex: /(cong nghe thong tin|cntt).*(an toan thong tin|attt|cybersecurity)|(an toan thong tin|attt|cybersecurity).*(cong nghe thong tin|cntt)/i,
    tieuDe: "Công nghệ thông tin và An toàn thông tin",
    phanTich: `• **Công nghệ thông tin**: ngành rộng về hệ thống, mạng, cơ sở dữ liệu và ứng dụng cho doanh nghiệp.
• **An toàn thông tin**: chuyên sâu bảo vệ hệ thống, kiểm thử xâm nhập, điều tra số và ứng cứu sự cố.`
  }
];

export interface KetQuaTuDong {
  traLoi: string;
  nguon: string[];
  /** Trường đề xuất, vẽ thành thẻ. */
  the?: TheTruong[];
  hanhDong?: HanhDongDeXuat[];
  hoiLai?: string;
  luaChon?: LuaChonNhanh[];
  trangThaiDuLieu?: TrangThaiDuLieu;
  cho?: ChoTraLoi;
}

// ---------- Ngữ cảnh lượt trước và tra cứu chương trình ----------
export interface NguCanhLuot { truong: string[]; nganh: string[]; cho?: ChoTraLoi }
const duy = <T,>(ds: T[]): T[] => [...new Set(ds)];
const maCua = (id: string): string | undefined => timTheoId(id)?.maTruong;

/** Trường và ngành của câu trả lời gần nhất: thẻ trường trước, rồi nguồn được trích, rồi các ngành đã gửi kèm. */
export function nguCanhLuotTruoc(truoc: TinNhan[], giuId: string[] = []): NguCanhLuot {
  const m = [...truoc].reverse().find((t) => t.vai === "mayChu");
  const theId = (m?.the ?? []).flatMap((t) => (t.id ? [t.id] : []));
  const ids = duy([...theId, ...(m?.nguon ?? []), ...(m ? (m.idDuLieu ?? []) : giuId)]).filter((id) => !!timTheoId(id));
  const truong = duy([...(m?.the ?? []).map((t) => t.ma), ...ids.map(maCua).filter((x): x is string => !!x)]);
  return { truong, nganh: ids, cho: m?.cho };
}

const chuongTrinhCuaTruong = (ma: string): LuaChon[] => LUA_CHON_MAU.filter((l) => l.maTruong === ma);
const xepUuTien = (a: LuaChon, b: LuaChon) =>
  (a.bac === "Đại học" ? 0 : 1) - (b.bac === "Đại học" ? 0 : 1)
  || ((a.phuongThuc ?? "THPT") === "THPT" ? 0 : 1) - ((b.phuongThuc ?? "THPT") === "THPT" ? 0 : 1)
  || Object.keys(b.diemTheoNam ?? {}).length - Object.keys(a.diemTheoNam ?? {}).length;
/** Mỗi tên ngành một chương trình (ưu tiên đại học, xét THPT, nhiều năm điểm). */
function gomTheoTenNganh(ds: LuaChon[]): LuaChon[] {
  const m = new Map<string, LuaChon>();
  for (const l of [...ds].sort(xepUuTien)) { const k = khongDau(l.nganh); if (!m.has(k)) m.set(k, l); }
  return [...m.values()];
}

function mucKhop(l: LuaChon, y: Pick<YDinhCau, "nhom" | "cumNganh">): MucTuongDuong | null {
  const n = khongDau(l.nganh);
  if (y.nhom) return y.nhom.chinhXac(n) ? "chinh-xac" : y.nhom.lienQuan(n) ? "lien-quan" : null;
  if (y.cumNganh) { const nn = ` ${n} `; return y.cumNganh.split(" ").every((t) => nn.includes(` ${t} `)) ? "chinh-xac" : null; }
  return "chinh-xac";
}

interface TruongTimThay { ma: string; ct: LuaChon | null; muc: MucTuongDuong }
/** Trường có ngành khớp (mỗi trường một chương trình tốt nhất), tách đúng ngành và gần nghĩa. Có tỉnh thì chỉ lấy trường ở tỉnh đó. */
export function timTruongTheoYDinh(y: Pick<YDinhCau, "tinh" | "nhom" | "cumNganh">): { chinhXac: TruongTimThay[]; lienQuan: TruongTimThay[]; truongTrongTinh: string[] } {
  let ds = LUA_CHON_MAU.filter((l) => l.maTruong && l.bac === "Đại học");
  if (y.tinh) ds = locTheoTinh(ds, y.tinh);
  const coNganh = !!(y.nhom || y.cumNganh);
  const tot = new Map<string, TruongTimThay>();
  for (const l of [...ds].sort(xepUuTien)) {
    const muc = mucKhop(l, y);
    if (!muc || !l.maTruong) continue;
    const cu = tot.get(l.maTruong);
    if (!cu || (cu.muc === "lien-quan" && muc === "chinh-xac")) tot.set(l.maTruong, { ma: l.maTruong, ct: coNganh ? l : null, muc });
  }
  const sapTen = (a: TruongTimThay, b: TruongTimThay) => (tenTruong(a.ma) ?? a.ma).localeCompare(tenTruong(b.ma) ?? b.ma, "vi");
  const ra = [...tot.values()];
  return {
    chinhXac: ra.filter((x) => x.muc === "chinh-xac").sort(sapTen),
    lienQuan: ra.filter((x) => x.muc === "lien-quan").sort(sapTen),
    truongTrongTinh: duy(ds.map((l) => l.maTruong!)).sort((a, b) => (tenTruong(a) ?? a).localeCompare(tenTruong(b) ?? b, "vi")),
  };
}

const ten = (ma: string) => tenTruong(ma) ?? ma;
const noiTen = (ms: string[], toiDa = TOI_DA_HIEN) => {
  const t = ms.slice(0, toiDa).map(ten);
  if (ms.length > toiDa) return `${t.join(", ")} cùng ${ms.length - toiDa} trường khác`;
  return t.length > 1 ? `${t.slice(0, -1).join(", ")} và ${t[t.length - 1]}` : (t[0] ?? "");
};
const hanhXemTruong = (ma: string): HanhDongDeXuat => ({ loai: "xem-truong", maTruong: ma, nhan: "Xem trường" });
const taoThe = (ds: TruongTimThay[]): TheTruong[] => ds.map((x) => ({ ma: x.ma, ...(x.ct ? { id: x.ct.id } : {}), muc: x.muc }));
const trangThaiTu = (ds: (LuaChon | null)[]): TrangThaiDuLieu => (ds.length && ds.every((l) => l?.nguonCap === "official_pdf") ? "da-xac-minh" : "lich-su");

/** Phần câu hỏi còn lại sau khi bỏ tên trường và từ đệm: chỉ còn cụm ngành. */
function cumConLai(y: YDinhCau, truongs: { chuoi: string }[]): string {
  const bo = new Set(truongs.flatMap((t) => t.chuoi.split(" ")));
  return y.cumNganh.split(" ").filter((t) => t && !bo.has(t)).join(" ");
}

// ---------- Các hướng trả lời theo ý định ----------
function traLoiKhamPha(y: YDinhCau): KetQuaTuDong {
  const r = timTruongTheoYDinh(y);
  const tenNganh = y.nhom?.ten ?? (y.cumNganh ? y.cumHienThi || y.cumNganh : "");
  const noiTinh = y.tinh ? ghiChuTinhGop(y.tinh) : "";
  const phanNganh = tenNganh ? ` có ngành ${tenNganh}` : "";
  const hienTat = [...r.chinhXac, ...r.lienQuan];
  if (hienTat.length === 0) {
    const coTruong = r.truongTrongTinh.length;
    const goiY = y.tinh && coTruong
      ? ` Dữ liệu có ${coTruong} trường ở ${y.tinh} (${noiTen(r.truongTrongTinh)}), bạn có thể xem ngành khác của họ.`
      : y.tinh ? ` Dữ liệu hiện chưa có trường nào ở ${y.tinh}.` : "";
    return {
      traLoi: `Mình chưa tìm thấy trường nào${noiTinh ? ` ở ${noiTinh}` : ""}${phanNganh} trong dữ liệu hiện có.${goiY}`,
      nguon: [], trangThaiDuLieu: "chua-co",
      ...(y.tinh && coTruong ? { luaChon: [{ nhan: `Trường ở ${y.tinh}`, cau: `Ở ${y.tinh} có những trường nào?` }] } : {}),
    };
  }
  const E = r.chinhXac, R = r.lienQuan;
  let traLoi: string;
  if (!tenNganh) traLoi = `${noiTinh ? `Ở ${noiTinh}` : "Trong dữ liệu"} có ${E.length} trường: ${noiTen(E.map((x) => x.ma))}.`;
  else if (E.length) traLoi = `${noiTinh ? `Ở ${noiTinh}` : "Trong dữ liệu"} mình thấy ${E.length} trường có đúng ngành ${tenNganh}: ${noiTen(E.map((x) => x.ma))}.${R.length ? ` Có thêm ${R.length} trường có ngành gần nghĩa (ghi là liên quan, không trùng tên ngành).` : ""}`;
  else traLoi = `${noiTinh ? `Ở ${noiTinh}` : "Trong dữ liệu"} mình chưa thấy trường có đúng ngành ${tenNganh}. Có ${R.length} trường có ngành gần nghĩa (liên quan, không trùng tên ngành): ${noiTen(R.map((x) => x.ma))}.`;
  const the = taoThe(hienTat).slice(0, 12);
  return {
    traLoi, nguon: duy(hienTat.slice(0, TOI_DA_HIEN).flatMap((x) => (x.ct ? [x.ct.id] : []))), the,
    trangThaiDuLieu: trangThaiTu(hienTat.map((x) => x.ct)),
    ...(!y.tinh && hienTat.length > TOI_DA_HIEN ? { hoiLai: "Bạn muốn học ở tỉnh hay thành phố nào để mình lọc gọn hơn?" } : {}),
  };
}

function traLoiLaTruongGi(cau: string): KetQuaTuDong | null {
  const x = chuTruongDinhNghia(cau);
  if (!x) return null;
  const goc = cau.split(/\s+(?:là|la)\s/i)[0].trim();
  const kq = resolveTruong(x);
  if (kq.kieu === "chinh-xac" && kq.ma) return theTruongDon(kq.ma, `${goc} là ${ten(kq.ma)}`);
  if (kq.kieu === "mo-ho") {
    const ds = kq.ung_vien.slice(0, 4);
    return {
      traLoi: kq.gan_dung ? `Mình chưa thấy "${goc}". Có phải ${noiTen(ds, 4)} không?` : `"${goc}" dùng chung cho ${kq.ung_vien.length} trường: ${noiTen(ds, 4)}.`,
      nguon: [], hoiLai: "Bạn muốn hỏi trường nào?", luaChon: ds.map((m) => ({ nhan: ten(m), cau: ten(m) })), trangThaiDuLieu: "chua-co",
    };
  }
  if (!/\btruong\b/.test(khongDau(cau))) return null; // "CNTT là gì?" không phải câu hỏi về trường
  return { traLoi: `Mình chưa thấy trường nào tên "${goc}" trong danh mục. Bạn thử viết tên đầy đủ hoặc mã trường nhé.`, nguon: [], trangThaiDuLieu: "chua-co" };
}

/** Một trường: tên đầy đủ, nơi đặt trường, số chương trình có trong dữ liệu và nút xem hồ sơ. */
function theTruongDon(ma: string, mo: string): KetQuaTuDong {
  const n = chuongTrinhCuaTruong(ma).length;
  const o = tinhCuaTruong(ma);
  return {
    traLoi: `${mo}${o.length ? `, ở ${o.slice(0, 3).join(", ")}` : ""}. Trong dữ liệu có ${n} chương trình của trường này.`,
    nguon: [], the: [{ ma }], hanhDong: [hanhXemTruong(ma)],
  };
}

type XacDinh =
  | { loai: "mot"; l: LuaChon }
  | { loai: "chon-nganh"; ma: string; ds: LuaChon[] }
  | { loai: "chon-truong"; ma: string[] }
  | { loai: "khong" };

/** Xác định đúng một chương trình từ câu hỏi và lượt trước; thiếu thì nói rõ thiếu gì (trường hay ngành). */
function xacDinhChuongTrinh(cau: string, y: YDinhCau, ctx: NguCanhLuot, s: AppState): XacDinh {
  const neu = timTruongTrongCau(cau);
  const maNeu = duy(neu.map((n) => n.kq.ma!));
  const ma = maNeu.length ? maNeu : ctx.truong;
  if (ma.length === 0) {
    const l = ctx.nganh.length === 1 ? timTheoId(ctx.nganh[0]) : undefined;
    return l ? { loai: "mot", l } : { loai: "khong" };
  }
  if (ma.length > 1) return { loai: "chon-truong", ma };
  const m = ma[0];
  const cum = cumConLai(y, neu);
  const cua = chuongTrinhCuaTruong(m);
  if (cum || y.nhom) {
    const kh = gomTheoTenNganh(cua.filter((l) => mucKhop(l, { nhom: y.nhom, cumNganh: cum }) === "chinh-xac"));
    if (kh.length === 1) return { loai: "mot", l: kh[0] };
    if (kh.length > 1) return { loai: "chon-nganh", ma: m, ds: kh.slice(0, 3) };
  }
  const trongCtx = ctx.nganh.map((id) => timTheoId(id)).filter((l): l is LuaChon => !!l && l.maTruong === m);
  const gon = gomTheoTenNganh(trongCtx);
  if (gon.length === 1) return { loai: "mot", l: gon[0] };
  if (gon.length > 1) return { loai: "chon-nganh", ma: m, ds: gon.slice(0, 3) };
  // Chưa biết ngành nào: gợi ý theo ngành quan tâm trong hồ sơ, không chọn thay.
  const quanTam = s.hoSo.nganhQuanTam.flatMap((n) => timNganhKhop(n, 20, cua).slice(0, 2));
  const goiY = gomTheoTenNganh([...quanTam, ...cua]).slice(0, 3);
  return goiY.length ? { loai: "chon-nganh", ma: m, ds: goiY } : { loai: "khong" };
}

const xacNhanThem = (l: LuaChon): HanhDongDeXuat => ({ loai: "them-nguyen-vong", idChuongTrinh: l.id, maTruong: l.maTruong, nhan: "Thêm vào nguyện vọng", canXacNhan: true });

function hoiChonTruong(ma: string[], lamCau: (m: string) => string, lead: string): KetQuaTuDong {
  return { traLoi: lead, nguon: [], hoiLai: "Bạn muốn nói trường nào?", luaChon: ma.slice(0, 4).map((m) => ({ nhan: ten(m), cau: lamCau(m) })), the: ma.slice(0, 4).map((m) => ({ ma: m })) };
}

function traLoiThemNguyenVong(cau: string, y: YDinhCau, ctx: NguCanhLuot, s: AppState): KetQuaTuDong {
  const x = xacDinhChuongTrinh(cau, y, ctx, s);
  if (x.loai === "khong") return { traLoi: "Mình chưa biết bạn muốn thêm trường hay ngành nào, vì chưa có trường nào ở lượt trước.", nguon: [], hoiLai: "Bạn cho mình tên trường và ngành nhé?" };
  if (x.loai === "chon-truong") return hoiChonTruong(x.ma, (m) => `Thêm ${ten(m)} vào nguyện vọng`, "Trong lượt trước có nhiều trường, mình chưa biết bạn muốn thêm trường nào.");
  if (x.loai === "chon-nganh") {
    return {
      traLoi: `${ten(x.ma)} có nhiều ngành, mình chưa biết bạn muốn thêm ngành nào.`, nguon: x.ds.map((l) => l.id), the: [{ ma: x.ma }],
      hoiLai: `Bạn muốn thêm ngành nào của ${ten(x.ma)}?`,
      hanhDong: x.ds.map((l) => ({ loai: "them-nguyen-vong" as const, idChuongTrinh: l.id, maTruong: l.maTruong, nhan: l.nganh.slice(0, 40), canXacNhan: true })),
    };
  }
  const l = x.l;
  if (s.nguyenVong.includes(l.id)) return { traLoi: `${l.nganh} của ${ten(l.maTruong!)} đã có trong danh sách nguyện vọng của bạn.`, nguon: [l.id], the: [{ ma: l.maTruong!, id: l.id }] };
  return {
    traLoi: `Mình sẽ thêm ${l.nganh} của ${ten(l.maTruong!)} vào nguyện vọng khi bạn bấm xác nhận.`,
    nguon: [l.id], the: [{ ma: l.maTruong!, id: l.id }], hanhDong: [xacNhanThem(l)],
  };
}

function traLoiCoHoi(cau: string, y: YDinhCau, ctx: NguCanhLuot, s: AppState, diem: DiemDayDu): KetQuaTuDong {
  // Câu trả lời ngắn cho lượt hỏi điểm trước đó ("23", "23 điểm").
  const choL = ctx.cho && !timTruongTrongCau(cau).length ? timTheoId(ctx.cho.id) : undefined;
  const x: XacDinh = choL ? { loai: "mot", l: choL } : xacDinhChuongTrinh(cau, y, ctx, s);
  const dem = y.diem !== null ? `${so1(y.diem)} điểm` : "";
  if (x.loai === "khong") return { traLoi: "Để so điểm mình cần biết bạn hỏi trường và ngành nào.", nguon: [], hoiLai: "Bạn đang hỏi trường và ngành nào?" };
  if (x.loai === "chon-truong") return hoiChonTruong(x.ma, (m) => `Em ${dem ? `được ${dem}, ` : ""}có nên đăng ký ${ten(m)} không?`, "Có nhiều trường trong lượt trước, mình chưa biết bạn hỏi trường nào.");
  if (x.loai === "chon-nganh") {
    return {
      traLoi: `${ten(x.ma)} có nhiều ngành, mình cần biết bạn hỏi ngành nào.`, nguon: x.ds.map((l) => l.id), the: [{ ma: x.ma }],
      hoiLai: `Bạn hỏi ngành nào của ${ten(x.ma)}?`,
      luaChon: x.ds.map((l) => ({ nhan: l.nganh.slice(0, 40), cau: `Em ${dem ? `được ${dem}, ` : ""}có nên đăng ký ${l.nganh} ${ten(l.maTruong!)} không?` })),
    };
  }
  const l = x.l, goc = ten(l.maTruong!);
  const tuHoSo = y.diem === null ? tongChoLuaChon(l, diem).tong : null;
  const tong = y.diem ?? tuHoSo;
  if (tong === null) {
    return {
      traLoi: `Để so với ${l.nganh} của ${goc}, mình cần tổng điểm 3 môn của bạn.`, nguon: [l.id], the: [{ ma: l.maTruong!, id: l.id }],
      hoiLai: "Tổng điểm 3 môn của bạn (thang 30) là bao nhiêu?", cho: { y: "co-hoi-diem", id: l.id },
    };
  }
  const nhan = nhanChoLuaChon(l, tong);
  if (nhan === null) {
    return {
      traLoi: `${l.nganh} của ${goc} xét theo ${l.phuongThuc ?? "phương thức khác"}, thang điểm khác điểm thi tốt nghiệp nên mình chưa so với ${so1(tong)} điểm. Bạn cho mình biết điểm theo đúng phương thức này nhé.`,
      nguon: [l.id], the: [{ ma: l.maTruong!, id: l.id }], trangThaiDuLieu: "chua-co",
    };
  }
  const chenh = Math.round((tong - l.diemMin) * 100) / 100;
  const toHop = l.toHopXet?.length ? ` Ngành xét tổ hợp ${l.toHopXet.slice(0, 4).join(", ")}.` : " Đề án chưa ghi rõ tổ hợp xét.";
  const nguonDiem = y.diem !== null ? `Mình hiểu ${so1(tong)} là tổng 3 môn theo thang 30, chưa cộng điểm ưu tiên.` : "Mình dùng điểm trong hồ sơ của bạn.";
  return {
    traLoi: `Với ${so1(tong)} điểm, ${l.nganh} của ${goc} là nhóm ${nhan}: điểm chuẩn ${l.namDiem} là ${so1(l.diemMin)}, bạn ${chenh >= 0 ? "hơn" : "kém"} ${so1(Math.abs(chenh))} điểm.${toHop} ${nguonDiem} Đây là so với điểm chuẩn năm trước, không phải khả năng đỗ.`,
    nguon: [l.id], the: [{ ma: l.maTruong!, id: l.id }], trangThaiDuLieu: trangThaiTu([l]),
    ...(s.nguyenVong.includes(l.id) ? {} : { hanhDong: [xacNhanThem(l)] }),
  };
}

function traLoiSoSanhTruong(cau: string, y: YDinhCau, ctx: NguCanhLuot): KetQuaTuDong {
  const neu = timTruongTrongCau(cau);
  let ma = duy(neu.map((n) => n.kq.ma!));
  if (ma.length === 1 && ctx.truong.length === 2) { const khac = ctx.truong.find((m) => m !== ma[0]); if (khac) ma = [ma[0], khac]; }
  if (ma.length === 0 && ctx.truong.length === 2) ma = ctx.truong;
  // Lượt trước có nhiều hơn hai trường: không chọn thay, hiện vài thẻ để bạn chọn hai trường.
  if (ma.length === 0 && ctx.truong.length > 2) {
    return { traLoi: "Lượt trước có nhiều trường, mình chưa biết bạn muốn so sánh hai trường nào.", nguon: [], the: ctx.truong.slice(0, 4).map((m) => ({ ma: m })), hoiLai: "Bạn muốn so sánh hai trường nào trong số này?" };
  }
  if (ma.length < 2) {
    return {
      traLoi: ma.length === 1 ? `Mình cần thêm một trường nữa để so sánh với ${ten(ma[0])}.` : "Mình chưa biết bạn muốn so sánh những trường nào.",
      nguon: [], ...(ma.length === 1 ? { the: [{ ma: ma[0] }] } : {}),
      hoiLai: ma.length === 1 ? `Bạn muốn so sánh ${ten(ma[0])} với trường nào?` : "Bạn muốn so sánh hai trường nào?",
    };
  }
  const [a, b] = ma;
  const cum = cumConLai(y, neu);
  const theNganh = (m: string): LuaChon[] => {
    const cua = chuongTrinhCuaTruong(m);
    const tuCau = cum || y.nhom ? cua.filter((l) => mucKhop(l, { nhom: y.nhom, cumNganh: cum }) === "chinh-xac") : [];
    const tuNgCanh = cua.filter((l) => ctx.nganh.includes(l.id));
    return gomTheoTenNganh(tuCau.length ? tuCau : tuNgCanh);
  };
  const A = theNganh(a), B = theNganh(b);
  if (A.length === 1 && B.length === 1) {
    const [la, lb] = [A[0], B[0]];
    const dong = (l: LuaChon) => `${l.nganh} của ${ten(l.maTruong!)}: điểm chuẩn ${l.namDiem} là ${so1(l.diemMin)}`;
    return {
      traLoi: `Mình đặt ${dong(la)} cạnh ${dong(lb)}. Bấm xem so sánh để thấy thêm học phí, tổ hợp và nhãn theo điểm của bạn. ${NHAC_NGAN}`,
      nguon: [la.id, lb.id], the: [{ ma: a, id: la.id }, { ma: b, id: lb.id }], trangThaiDuLieu: trangThaiTu([la, lb]),
      hanhDong: [{ loai: "so-sanh", ids: [la.id, lb.id], nhan: "Xem so sánh" }],
    };
  }
  // Chưa biết ngành nào: chỉ gợi ý những tên ngành cả hai trường đều có, không chọn thay.
  const chung = gomTheoTenNganh(chuongTrinhCuaTruong(a)).filter((l) => gomTheoTenNganh(chuongTrinhCuaTruong(b)).some((k) => khongDau(k.nganh) === khongDau(l.nganh))).sort((p, q) => p.nganh.length - q.nganh.length).slice(0, 3);
  return {
    traLoi: `Mình so ${ten(a)} và ${ten(b)} theo từng ngành, nên cần biết bạn muốn xem ngành nào.${chung.length ? "" : " Hai trường này chưa có ngành trùng tên trong dữ liệu."}`,
    nguon: [], the: [{ ma: a }, { ma: b }], hoiLai: "Bạn muốn so sánh theo ngành nào?",
    luaChon: chung.map((l) => ({ nhan: l.nganh.slice(0, 40), cau: `So sánh ${ten(a)} và ${ten(b)} ngành ${l.nganh}` })),
  };
}

/** Ký túc xá, giá trọ: dữ liệu chưa có, nên nói rõ chưa có và chỉ ra trường đang nói tới (nêu trong câu hoặc ở lượt trước), không đoán. */
function traLoiChoO(cau: string, ctx: NguCanhLuot, s: AppState): KetQuaTuDong {
  const neu = duy(timTruongTrongCau(cau).map((n) => n.kq.ma!));
  const ma = neu.length ? neu : ctx.truong.length === 1 ? ctx.truong : [];
  const ghiChu = s.hoSo.choO === "kyTucXa" ? " Bạn dự định ở ký túc xá nên chi phí chỗ ở thường nhẹ hơn thuê trọ." : s.hoSo.choO === "oTro" ? " Bạn dự định ở trọ, nên tìm trọ gần trường hoặc ở ghép để giảm chi phí." : "";
  const dau = ma.length === 1 ? `Mình chưa có dữ liệu về ký túc xá hay giá trọ quanh ${ten(ma[0])}.` : "Mình chưa có dữ liệu về ký túc xá hay giá trọ của các trường.";
  return {
    traLoi: `${dau} Bạn xem trang tuyển sinh hoặc phòng quản lý sinh viên của trường để có số liệu đúng.${ghiChu}`,
    nguon: [], trangThaiDuLieu: "chua-co", ...(ma.length === 1 ? { the: [{ ma: ma[0] }] } : {}),
  };
}

function traLoiXepHangHocPhi(y: YDinhCau): KetQuaTuDong {
  const r = timTruongTheoYDinh({ tinh: y.tinh, nhom: y.nhom, cumNganh: y.cumNganh });
  const ma = new Set([...r.chinhXac, ...(y.nhom ? [] : r.lienQuan)].map((x) => x.ma));
  let ds = LUA_CHON_MAU.filter((l) => l.bac === "Đại học" && l.hocPhiMin !== undefined && l.maTruong && ((y.tinh || y.nhom || y.cumNganh) ? ma.has(l.maTruong) : true));
  if (y.nhom || y.cumNganh) ds = ds.filter((l) => mucKhop(l, y) === "chinh-xac");
  const thap = y.xepHang === "hoc-phi-thap";
  const dem = gomTheoTenNganh(ds).sort((a, b) => (thap ? a.hocPhiMin! - b.hocPhiMin! : b.hocPhiMin! - a.hocPhiMin!));
  // Mỗi trường một dòng
  const moiTruong: LuaChon[] = [];
  for (const l of dem) if (!moiTruong.some((k) => k.maTruong === l.maTruong)) moiTruong.push(l);
  const pham = [y.tinh ? `ở ${ghiChuTinhGop(y.tinh)}` : "", y.nhom?.ten ?? y.cumHienThi].filter(Boolean).join(", ");
  if (moiTruong.length === 0) return { traLoi: `Mình chưa có dữ liệu học phí${pham ? ` (${pham})` : ""} để xếp hạng.`, nguon: [], trangThaiDuLieu: "chua-co" };
  const top = moiTruong.slice(0, TOI_DA_HIEN);
  const dong = (l: LuaChon) => `• ${l.nganh}, ${ten(l.maTruong!)}: khoảng ${so1(l.hocPhiMin!)}${l.hocPhiMax !== undefined && l.hocPhiMax !== l.hocPhiMin ? `–${so1(l.hocPhiMax)}` : ""} triệu/năm${l.hocPhiUocTinh ? " (ước tính)" : ""}`;
  const uoc = top.some((l) => l.hocPhiUocTinh);
  return {
    traLoi: `Học phí ${thap ? "thấp" : "cao"} nhất trong dữ liệu${pham ? ` (${pham})` : ""}:\n${top.map(dong).join("\n")}\n${uoc ? "Mục ghi ước tính là suy theo khối ngành, chưa có văn bản học phí của trường; bạn đối chiếu với đề án trước khi quyết định." : "Học phí lấy từ đề án của trường."}${moiTruong.length > TOI_DA_HIEN ? ` Còn ${moiTruong.length - TOI_DA_HIEN} lựa chọn khác, bạn muốn xem tiếp không?` : ""}`,
    nguon: top.map((l) => l.id), trangThaiDuLieu: uoc ? "uoc-tinh" : "da-xac-minh",
  };
}

export function traLoiTuDong(cauHoi: string, s: AppState, nguon: NguonTaiSau | null, giuId: string[] = [], truoc: TinNhan[] = []): KetQuaTuDong {
  const q = khongDau(cauHoi);
  const diem = diemDayDu(s);
  const coHoi = tinhCoHoi(diem);
  const NHAC = `${NHAC_NGAN} Bạn đối chiếu với đề án của trường trước khi quyết định.`;
  const y = phanTichCau(cauHoi);
  const ctx = nguCanhLuotTruoc(truoc, giuId);

  // Nguyên lý nhãn nguyện vọng
  if (/3 tang la gi|nguyen ly 3 tang|nguyen tac 3 tang|chien luoc 3 tang|cach xep nguyen vong|nguyen tac xep nguyen vong|huong dan xep nguyen vong/.test(q)) {
    return {
      traLoi: `Mình gán nhãn theo chênh giữa điểm của bạn và điểm chuẩn năm trước: **Thử sức** (điểm bạn thấp hơn điểm chuẩn), **Vừa sức** (hơn dưới 1,5 điểm), **An toàn** (hơn từ 1,5 đến dưới 4 điểm), **Dự phòng** (hơn từ 4 điểm). Một danh sách cân bằng nên có cả Thử sức và An toàn. Nhãn không phải xác suất đỗ.${s.nguyenVong.length > 0 ? ` Bạn đang có ${s.nguyenVong.length} nguyện vọng, hỏi "Danh sách nguyện vọng của mình đã cân bằng chưa?" để mình đối chiếu.` : " Bạn thêm ngành ở mục Nguyện vọng, nhãn sẽ tự hiện."}`,
      nguon: [],
    };
  }

  // Câu trả lời ngắn cho lượt hỏi điểm trước đó
  if (ctx.cho && y.diem !== null && y.kieu !== "them-nguyen-vong") return traLoiCoHoi(cauHoi, y, ctx, s, diem);
  switch (y.kieu) {
    case "them-nguyen-vong": return traLoiThemNguyenVong(cauHoi, y, ctx, s);
    case "la-truong-gi": { const r = traLoiLaTruongGi(cauHoi); if (r) return r; break; }
    case "co-hoi": return traLoiCoHoi(cauHoi, y, ctx, s, diem);
    case "so-sanh-truong": return traLoiSoSanhTruong(cauHoi, y, ctx);
    case "xep-hang-hoc-phi": return traLoiXepHangHocPhi(y);
    case "cho-o": return traLoiChoO(cauHoi, ctx, s);
    case "kham-pha-truong": if (timTruongTrongCau(cauHoi, [y.tinhGoc]).length === 0) return traLoiKhamPha(y); break;
  }
  // Chỉ nêu tên một trường (ví dụ bấm lựa chọn "ĐH Bách Khoa Hà Nội"): cho thẻ trường.
  {
    const neu = timTruongTrongCau(cauHoi);
    if (neu.length === 1 && !cumConLai(y, neu) && y.diem === null && !/\b(diem|hoc phi|nganh|viec lam|so sanh|nguyen vong)\b/.test(y.q)) {
      return theTruongDon(neu[0].kq.ma!, ten(neu[0].kq.ma!));
    }
  }

  // 1) Hỏi về một ngành/trường cụ thể
  let khop = timNganhKhop(cauHoi, 5);
  const huongDan = /bat dau|tu dau|chon nganh|nen hoc|hop voi|nganh nao/.test(q);
  const canBang = /can bang|nguyen vong|danh sach|an toan/.test(q);
  const thieu = /thieu|nhap diem|so sanh duoc|chua du/.test(q);
  const hocPhi = /hoc phi|chi phi|tien hoc/.test(q);
  const noiTiep = giuId.length > 0 && !canBang && !thieu && (coDaiTu(cauHoi) || (khop.length === 0 && (/hoc phi|diem chuan|viec lam|to hop|du bao|nen chon|nen hoc|ky tuc|ktx|o tro/.test(q) || (!huongDan && cauNganHoiTiep(cauHoi)))));
  if (noiTiep) {
    const cu = giuId.slice(0, khop.length ? 3 : 5).map((id) => LUA_CHON_MAU.find((l) => l.id === id)).filter((l): l is LuaChon => !!l);
    khop = [...khop, ...cu.filter((l) => !khop.some((k) => k.id === l.id))].slice(0, 5);
  }

  const soSanhChuyenMon = SO_SANH_NGANH_KIENTHUC.find((x) => x.regex.test(q) || x.regex.test(cauHoi));
  const hoi3Nam = /3 nam|ba nam|cac nam|gan day|xu huong|2025|2026/.test(q);
  const hoiNamMoi = /2026|2027/.test(q);
  const hoiDuBao = /du bao|nam toi|nam sau|2026|2027|du kien/.test(q);

  // Học sinh nêu điểm trực tiếp ("Em được 24,5 điểm khối A00, vào ngành CNTT ở trường nào?")
  const diemHoi = y.diem;
  const toHopKhop = cauHoi.match(/\b(A00|A01|B00|C00|D01|D07)\b/i);
  const toHopHoi = toHopKhop ? toHopKhop[1].toUpperCase() : null;

  if (diemHoi !== null && khop.length > 0 && !soSanhChuyenMon) {
    const xet = khop.slice(0, TOI_DA_HIEN).map((l) => ({ l, nhan: nhanChoLuaChon(l, diemHoi), chenh: Math.round((diemHoi - l.diemMin) * 100) / 100 }));
    const dong = xet.map(({ l, nhan, chenh }) => `• ${l.nganh}, ${l.tenTruong}: điểm chuẩn ${l.namDiem} là ${so1(l.diemMin)}${nhan ? ` → ${nhan} (${chenh >= 0 ? "hơn" : "kém"} ${so1(Math.abs(chenh))} điểm)` : ` (xét theo ${l.phuongThuc ?? "phương thức khác"}, chưa so được)`}`).join("\n");
    return {
      traLoi: `Với ${so1(diemHoi)} điểm${toHopHoi ? ` (tổ hợp ${toHopHoi})` : ""}, mình hiểu là tổng 3 môn thang 30, chưa cộng ưu tiên:\n${dong}\n${NHAC_NGAN}`,
      nguon: xet.map((x) => x.l.id), trangThaiDuLieu: trangThaiTu(xet.map((x) => x.l)),
    };
  }

  const soSanh = Boolean(soSanhChuyenMon) || (khop.length >= 2 && /so sanh|khac nhau|hon|chon.*nao|chon.*hay|phan van/.test(q)) || (khop.length >= 1 && hoi3Nam);

  if (soSanh) {
    const sk = khop.slice(0, 4).map((l) => dungSuKien(l, diem, nguon));
    const bang3Nam = [
      // Mỗi cột năm chỉ ghi điểm thật của đúng năm đó ("—" nếu chưa có). Khoảng dự báo ở cột riêng, ghi rõ năm dự báo.
      "| Ngành | Trường | Điểm 2024 | Điểm 2025 | Điểm 2026 | Dự kiến năm tới | Nhãn | Học phí/năm |",
      "|---|---|---|---|---|---|---|---|",
      ...sk.map((d) => {
        const nam = (yr: string) => (d.diem[yr] ? so1(d.diem[yr]) : "—");
        const duKien = d.duBao ? `${so1(d.duBao.thap)}–${so1(d.duBao.cao)} (${d.duBao.nam})` : "—";
        const nhan = d.nhanCuaEm || "Tham khảo";
        const hp = d.hocPhiTrieu !== undefined ? `${d.hocPhiUocTinh ? "≈ " : ""}${so1(d.hocPhiTrieu)} tr` : "—";
        return `| ${d.nganh} | ${d.tenTruong || d.truong} | ${nam("2024")} | ${nam("2025")} | ${nam("2026")} | ${duKien} | ${nhan} | ${hp} |`;
      }),
    ].join("\n");

    const phanTichChuyenMonStr = soSanhChuyenMon ? `**${soSanhChuyenMon.tieuDe}**\n${soSanhChuyenMon.phanTich}\n\n` : "";
    const ghiChuNamMoi = hoiNamMoi ? "Năm tuyển sinh hiện tại chưa có điểm chuẩn chính thức, nên bảng dưới là các năm trước kèm khoảng dự kiến.\n\n" : "";
    return {
      traLoi: `${phanTichChuyenMonStr}${ghiChuNamMoi}Điểm chuẩn các năm gần đây (năm nào chưa có ghi "—"):\n\n${bang3Nam}\n\n${NHAC}`,
      nguon: sk.map((l) => l.id), trangThaiDuLieu: trangThaiTu(khop.slice(0, 4)),
    };
  }

  const hoiViecLam = /viec lam|co hoi viec lam|ra truong|de xin viec|nghe nghiep|muc luong/.test(q);
  if (hoiViecLam && khop.length > 0) {
    const sk = khop.slice(0, TOI_DA_HIEN).map((l) => dungSuKien(l, diem, nguon));
    return {
      traLoi: `Tỉ lệ có việc làm theo khảo sát trong đề án của trường:\n${sk.map((d) => dongNganh(d, { hocPhi, viecLam: true })).join("\n")}\nChỉ ngành nào đề án có nêu thì mình mới có số.`,
      nguon: khop.slice(0, TOI_DA_HIEN).map((l) => l.id), trangThaiDuLieu: "da-xac-minh",
    };
  }

  if (khop.length > 0 && !canBang && !thieu && (!huongDan || noiTiep)) {
    const hien = khop.slice(0, TOI_DA_HIEN);
    const sk = hien.map((l) => dungSuKien(l, diem, nguon));
    const them = khop.length > TOI_DA_HIEN ? `\nCòn ${khop.length - TOI_DA_HIEN} ngành khác khớp, bạn muốn xem tiếp không?` : "";
    return {
      traLoi: `Mình tìm thấy ${khop.length} ngành khớp với câu hỏi:\n${sk.map((d) => dongNganh(d, { hocPhi, duBao: hoiDuBao })).join("\n")}${them}\n${NHAC}`,
      nguon: khop.map((l) => l.id), trangThaiDuLieu: hocPhi && hien.some((l) => l.hocPhiUocTinh) ? "uoc-tinh" : trangThaiTu(hien),
    };
  }

  const hoiPhuongPhap = /tang diem|keo diem|on thi|phuong phap|cach hoc|lam sao de tang|on tap|ke hoach|lich hoc|de xuat viec|viec can hoc|xep lich/.test(q);
  if (hoiPhuongPhap) {
    const mt = s.mucTieu;
    const lcMt = mt ? LUA_CHON_MAU.find((l) => l.id === mt.luaChonId) : undefined;
    const mtStr = mt && lcMt ? `Mục tiêu của bạn là ${lcMt.nganh}, ${lcMt.tenTruong} (tổ hợp ${mt.maToHop}, điểm mục tiêu ${so1(mt.diemMucTieu)}).` : (mt ? `Mục tiêu của bạn là tổ hợp ${mt.maToHop} (${so1(mt.diemMucTieu)} điểm).` : "Bạn chưa đặt mục tiêu, hãy chọn một ngành mục tiêu ở mục Kế hoạch để có lộ trình cụ thể.");
    const kc = mt ? khoangCachTheoMon(diem, mt.toHop, mt.diemMucTieu, s.hoSo.canCaiThien) : [];
    const thieuMon = kc.filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu).slice(0, 2);
    const phanTichMon = thieuMon.length > 0 ? ` Môn cần kéo nhiều nhất: ${thieuMon.map((m) => `${m.mon.toUpperCase()} (hiện ${so1(m.hienTai)}, cần ${so1(m.mucTieu)}, thiếu ${so1(m.thieu)})`).join("; ")}.` : (mt ? " Điểm hiện tại đã gần mốc mục tiêu, nên giữ nhịp luyện đề." : "");
    return {
      traLoi: `${mtStr}${phanTichMon} Vào mục Kế hoạch, bấm Tạo việc và xếp lịch để đưa các việc này vào lịch tự học tuần của bạn.`,
      nguon: [], hanhDong: [],
    };
  }

  const hoiXetTuyenSom = /ielts|ngoai ngu|chung chi|dgnl|danh gia nang luc|hoc ba|xet tuyen som/.test(q);
  if (hoiXetTuyenSom) {
    const cc = s.hoSo.chungChiNgoaiNgu?.diem ? `Hồ sơ của bạn có ${s.hoSo.chungChiNgoaiNgu.loai} ${s.hoSo.chungChiNgoaiNgu.diem}.` : "Bạn chưa nhập chứng chỉ ngoại ngữ trong hồ sơ.";
    const dg = s.hoSo.diemDgnl?.hcm ? ` Điểm ĐGNL ĐHQG-HCM: ${s.hoSo.diemDgnl.hcm}/1200.` : s.hoSo.diemDgnl?.hn ? ` Điểm ĐGNL HSA: ${s.hoSo.diemDgnl.hn}/150.` : "";
    return {
      traLoi: `${cc}${dg} Cách quy đổi chứng chỉ, điểm ĐGNL và mốc nhận hồ sơ khác nhau theo từng trường, mình không có bảng quy đổi chung trong dữ liệu. Bạn xem đề án của trường mình quan tâm; nếu cho mình tên trường, mình chỉ ra ngành nào của trường xét bằng phương thức đó.`,
      nguon: [], trangThaiDuLieu: "chua-co",
    };
  }

  if (thieu) {
    if (coHoi) return { traLoi: `Bạn đã đủ điểm 3 môn ở tổ hợp ${coHoi.toHop} (${so1(coHoi.tong)} điểm), nên mình so được ${coHoi.soNganh} ngành. Nhập thêm điểm Sử, Địa, Tin hoặc các môn còn lại ở Hồ sơ để mình so thêm các ngành xét tổ hợp khác.`, nguon: [] };
    return { traLoi: "Bạn chưa nhập đủ điểm 3 môn của bất kỳ tổ hợp nào (ví dụ Toán, Lý, Anh). Có điểm 3 môn, mình sẽ so được với điểm chuẩn của từng ngành. Bạn vào Hồ sơ, bước Điểm các môn để nhập nhé.", nguon: [] };
  }

  if (canBang) {
    const ds = s.nguyenVong.map((id) => LUA_CHON_MAU.find((l) => l.id === id)).filter((l): l is LuaChon => !!l);
    if (ds.length === 0) {
      const g = coHoi ? goiYDanhSach(diem, s.hoSo, [], undefined, moNeoNV1(s)).slice(0, TOI_DA_HIEN) : [];
      return { traLoi: g.length ? `Bạn chưa có nguyện vọng nào. Dựa trên điểm của bạn (tổ hợp ${coHoi?.toHop}, ${so1(coHoi?.tong ?? 0)} điểm${s.hoSo.nganhQuanTam.length ? `, quan tâm ${s.hoSo.nganhQuanTam.join(", ")}` : ""}), mình gợi ý:\n${g.map((x) => `• ${x.lc.nganh}, ${x.lc.tenTruong} (${x.nhan}): điểm chuẩn ${so1(x.lc.diemMin)}`).join("\n")}\nVào mục Nguyện vọng, bấm “Gợi ý danh sách cho bạn” để xem đầy đủ.` : "Bạn chưa có nguyện vọng nào, và chưa đủ điểm để mình gợi ý. Bạn nhập điểm 3 môn của một tổ hợp trước nhé.", nguon: g.map((x) => x.lc.id) };
    }
    const cd = danhGiaDanhMucToanDien(s.nguyenVong, timTheoId, diem, { nganSach: s.hoSo.nganSach, khuVuc: s.hoSo.khuVuc, uuTienTuyenSinh: s.hoSo.uuTienTuyenSinh });
    const sk = ds.map((l) => dungSuKien(l, diem, nguon));
    const dem: Record<string, number> = {};
    sk.forEach((x) => { if (x.nhanCuaEm) dem[x.nhanCuaEm] = (dem[x.nhanCuaEm] ?? 0) + 1; });
    const lietKe = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"].map((n) => `${dem[n] ?? 0} ${n}`).join(", ");
    const coLuoiDo = (dem["An toàn"] ?? 0) + (dem["Dự phòng"] ?? 0);
    const loi = coLuoiDo === 0
      ? "Danh sách chưa có ngành An toàn hay Dự phòng, bạn nên thêm 1 đến 2 ngành có điểm chuẩn thấp hơn điểm của bạn từ 1,5 điểm trở lên để có chỗ đỡ."
      : (dem["Thử sức"] ?? 0) > sk.length / 2
        ? "Hơn một nửa danh sách là Thử sức, bạn cân nhắc thêm ngành Vừa sức."
        : (dem["Thử sức"] ?? 0) === 0 && sk.length >= 3
          ? "Danh sách khá an toàn, bạn có thể tự tin thêm 1 ngành Thử sức ở Nguyện Vọng 1 để không bỏ lỡ ước mơ."
          : "Danh sách của bạn có cơ cấu 3 tầng khá cân bằng giữa Thử sức, Vừa sức và An toàn.";

    const canhBaoNghichDaoStr = cd.canhBaoNghiemTrong.length > 0
      ? `\n\n⚠️ **CẢNH BÁO NGHỊCH ĐẢO THỨ TỰ (NGUY CƠ CAO):**\n` + cd.canhBaoNghiemTrong.map((cb) => `• ${cb}`).join("\n") + "\n👉 Bạn hãy vào mục **Nguyện vọng** và bấm nút **Tự động chỉnh thứ tự chuẩn** để bảo vệ cơ hội trúng tuyển vào ngành mơ ước!"
      : "";

    const xacSuatStr = `\n\n📈 **Đánh giá xác suất (Decision Intelligence Engine):**\n• **Tổng xác suất đỗ ít nhất 1 nguyện vọng**: **${cd.xacSuatDoItNhatMotNV}%**.\n• **Cơ cấu 3 tầng**: ${cd.coCau.thuSuc} Thử sức, ${cd.coCau.vuaSuc} Vừa sức, ${cd.coCau.anToan} An toàn.`;

    const mn = phanTichMoNeo(s);
    const gocNV1 = mn
      ? ` Lấy Nguyện Vọng 1 ${mn.lc.tenTruong}, ${mn.lc.nganh} làm gốc: ${cauKhoangCachNV1(mn) ?? (mn.monChuaCoDiem.length ? "bạn nhập đủ điểm các môn của tổ hợp để mình tính khoảng cách." : "điểm hiện tại của bạn đã chạm mốc điểm chuẩn.")}${mn.luoiDo.length ? ` Các nguyện vọng sau đỡ cho nó: ${mn.luoiDo.slice(0, 3).map((d) => `Nguyện Vọng ${d.thuTu} ${d.lc.truong} (${d.nhan})`).join(", ")}.` : ""}`
      : "";
    return {
      traLoi: `Danh sách của bạn có ${sk.length} nguyện vọng: ${lietKe}.${gocNV1}${xacSuatStr}${canhBaoNghichDaoStr} ${loi}\n${sk.slice(0, TOI_DA_HIEN).map((d) => dongNganh(d)).join("\n")}${sk.length > TOI_DA_HIEN ? `\nCòn ${sk.length - TOI_DA_HIEN} nguyện vọng khác trong mục Nguyện vọng.` : ""}\n${NHAC}`,
      nguon: ds.map((l) => l.id), trangThaiDuLieu: "lich-su",
    };
  }

  if (huongDan) {
    if (!coHoi) return { traLoi: "Để gợi ý ngành, mình cần điểm 3 môn của một tổ hợp. Bạn nhập điểm ở Hồ sơ, rồi vào Khám phá: mình sẽ cho bạn biết điểm của bạn đủ cho bao nhiêu ngành, nhiều nhất ở nhóm nào.", nguon: [] };
    const top = coHoi.theoNhom.slice(0, 3).map((g) => `${g.nhom} (${g.duDiem} ngành đủ điểm)`).join(", ");
    const sq = s.hoSo.nganhQuanTam.length ? ` Bạn đang quan tâm ${s.hoSo.nganhQuanTam.join(", ")}: vào Khám phá, chọn nhóm đó để xem các ngành sát điểm của bạn nhất.` : " Chọn một nhóm ngành bạn quan tâm ở Khám phá để xem các ngành sát điểm của bạn nhất.";
    return {
      traLoi: `Với tổ hợp ${coHoi.toHop} (${so1(coHoi.tong)} điểm), bạn đủ điểm chuẩn năm gần nhất của ${coHoi.soDuDiem} ngành đủ điểm và có thể thử sức thêm ${coHoi.soThuSuc} ngành. Nhiều nhất ở: ${top}.${sq}\n${NHAC}`,
      nguon: [],
    };
  }

  // Chỉ nêu điểm, không nêu trường/ngành: hỏi lại đúng một câu thay vì "chưa hiểu".
  if (diemHoi !== null && khop.length === 0) return traLoiCoHoi(cauHoi, y, ctx, s, diem);

  return {
    traLoi: "Mình chưa hiểu rõ câu hỏi. Bạn nêu giúp một ngành, một trường hoặc một tỉnh (ví dụ “điểm chuẩn Khoa học máy tính UIT”, “ở Cần Thơ có trường nào dạy Y khoa”).",
    nguon: [],
    luaChon: [
      { nhan: "Danh sách nguyện vọng", cau: "Danh sách nguyện vọng của mình có cân bằng không?" },
      { nhan: "Nên bắt đầu từ đâu", cau: "Nên bắt đầu tìm ngành từ đâu?" },
    ],
  };
}
