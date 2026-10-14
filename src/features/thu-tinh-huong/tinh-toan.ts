// Tính toán cho "Thử tình huống" và "Điểm thi thử". TypeScript thuần, không import React.
// Điểm "phù hợp" lấy từ engine/phan-tich (thang 100, là điểm gợi ý, KHÔNG phải xác suất đậu).
import { NGAN_SACH_TOI_DA, NGUONG_PHU_HOP, diemPhuHop, lyDoKhacPhuongThuc, nhanNguyenVong, type DieuKienThu } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { CAC_MON, TEN_MON, TEN_MON_NGAN, TO_HOP, type HoSo, type LuaChon, type MaToHop, type MonId, type MonThem, type NhanNguyenVong, type TinhHuongDaLuu } from "@/state/types";
import { dinhDang, dinhDangDiem } from "@/engine/dinh-dang";

export type Diem = Record<MonId, number | null>;
/** Điểm các môn thêm (Sử, Địa, Tin...) trong hồ sơ: không đổi khi em kéo thử điểm, nhưng cần để tính đúng tổ hợp của từng ngành. */
export type DiemThem = Partial<Record<MonThem, number | null>> & { uuTien?: number };

/**
 * Tổng điểm của em theo ĐÚNG tổ hợp của ngành này (đề án ghi); đề án chưa ghi thì lấy tổ hợp cao nhất của em.
 * null = chưa tính được (thiếu điểm môn của tổ hợp, hoặc tổ hợp có môn năng khiếu). Dùng cho mọi phép so với điểm chuẩn.
 */
/** Tổng điểm của em theo tổ hợp của ngành; null khi chưa đủ điểm hoặc điểm chuẩn thuộc phương thức khác THPT (không so được). */
export const tongTheoNganh = (lc: LuaChon, diem: Diem, them?: DiemThem): number | null => (lyDoKhacPhuongThuc(lc) ? null : tongChoLuaChon(lc, { ...diem, ...them }).tong);

/** Tổ hợp (trong 4 tổ hợp của app) dùng để hiện tổng điểm: theo mục tiêu nếu có, không thì tổ hợp em đủ điểm và cao nhất. */
export function chonToHopHienThi(diem: Diem, mucTieu: { maToHop: MaToHop; toHop: MonId[] } | null): { ma: MaToHop; toHop: MonId[] } {
  if (mucTieu) return { ma: mucTieu.maToHop, toHop: mucTieu.toHop };
  const du = (["A01", "A00", "D01", "B00"] as MaToHop[]).filter((ma) => TO_HOP[ma].every((m) => typeof diem[m] === "number" && Number.isFinite(diem[m])));
  const tot = du.sort((a, b) => TO_HOP[b].reduce((t, m) => t + (diem[m] ?? 0), 0) - TO_HOP[a].reduce((t, m) => t + (diem[m] ?? 0), 0))[0] ?? "A01";
  return { ma: tot, toHop: TO_HOP[tot] };
}
export type UuTien = DieuKienThu["uuTien"];
export type DieuKien = Omit<DieuKienThu, "tong">;

export const lam = (n: number, so = 2) => Math.round(n * 10 ** so) / 10 ** so;
const kep = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Viết số điểm: 8 → "8.0", 7.25 → "7.25". */
export const vietDiem = (n: number) => (Math.abs(n * 10 - Math.round(n * 10)) < 1e-9 ? dinhDang(n, 1) : lam(n).toFixed(2));
/** Viết mức cộng/trừ: +1.0, −0.25, 0. */
export const vietCong = (n: number) => (n === 0 ? "0" : `${n > 0 ? "+" : "−"}${vietDiem(Math.abs(n))}`);

// ---------- Điều kiện ----------

export const TEN_UU_TIEN: Record<UuTien, string> = { viecLam: "Đi làm sớm", hocPhi: "Học phí thấp", gan: "Gần nhà" };
export const MO_TA_UU_TIEN: Record<UuTien, string> = {
  viecLam: "Coi trọng cơ hội việc làm sau khi ra trường",
  hocPhi: "Coi trọng học phí vừa túi tiền",
  gan: "Coi trọng trường ở khu vực bạn chọn",
};
/** Ngân sách khi em chưa chọn trong hồ sơ: tính như không giới hạn (mức cao nhất của thanh trượt). */
export const NGAN_SACH_KHONG_GIOI_HAN = 150;

/** Điều kiện lấy từ hồ sơ của em: dùng làm mốc "Hiện tại". */
export function dieuKienTuHoSo(h: Pick<HoSo, "nganSach" | "khuVuc" | "quanTamViecLam" | "hocXaNha">): DieuKien & { coNganSach: boolean } {
  const uuTien: UuTien = h.quanTamViecLam === "rat" ? "viecLam" : h.nganSach === "duoi30" ? "hocPhi" : h.hocXaNha ? "gan" : "viecLam";
  return {
    nganSachTrieu: h.nganSach ? NGAN_SACH_TOI_DA[h.nganSach] : NGAN_SACH_KHONG_GIOI_HAN,
    coNganSach: !!h.nganSach,
    // Một nơi cụ thể thì ràng buộc theo nơi đó. Nhiều nơi hoặc "Tỉnh khác" thì không ràng buộc (tránh phạt oan trường ở nơi em đã chọn).
    khuVuc: Array.isArray(h.khuVuc) && h.khuVuc.length === 1 && h.khuVuc[0] !== "Tỉnh khác" ? h.khuVuc[0] : "",
    uuTien,
  };
}

/** Tình huống em đang chỉnh. null = giữ như hồ sơ. */
export interface TinhHuongDangThu {
  monDangChon: MonId;
  congMon: Partial<Record<MonId, number>>;
  nganSachTrieu: number | null;
  khuVuc: string | null;
  uuTien: UuTien | null;
}
export const DANG_THU_MAC_DINH: TinhHuongDangThu = { monDangChon: "toan", congMon: {}, nganSachTrieu: null, khuVuc: null, uuTien: null };

export function dieuKienMoi(goc: DieuKien, t: Pick<TinhHuongDangThu, "nganSachTrieu" | "khuVuc" | "uuTien">): DieuKien {
  return { nganSachTrieu: t.nganSachTrieu ?? goc.nganSachTrieu, khuVuc: t.khuVuc ?? goc.khuVuc, uuTien: t.uuTien ?? goc.uuTien };
}

/** Chỉ giữ các môn có cộng/trừ khác 0, làm tròn để so sánh cho chắc. */
export function gonCongMon(c: Partial<Record<MonId, number>>): Partial<Record<MonId, number>> {
  const ra: Partial<Record<MonId, number>> = {};
  for (const m of CAC_MON) if (c[m] && Math.abs(c[m]!) > 1e-9) ra[m] = lam(c[m]!);
  return ra;
}

/** Điểm sau khi cộng/trừ, giữ trong khoảng 0–10. Môn chưa có điểm vẫn là null. */
export function apDungCong(diem: Diem, congMon: Partial<Record<MonId, number>>): Diem {
  const ra = { ...diem };
  for (const m of CAC_MON) {
    if (ra[m] !== null && typeof ra[m] === "number" && Number.isFinite(ra[m]) && congMon[m] && Number.isFinite(congMon[m])) {
      ra[m] = lam(kep(ra[m]! + congMon[m]!, 0, 10));
    }
  }
  return ra;
}

/**
 * Tổng 3 môn, làm tròn 2 chữ số. engine/tongDiem làm tròn 1 chữ số nên 8.75 + 8.5 + 8.5 thành 25.8;
 * ở đây em kéo từng 0.25 điểm nên cần tổng chính xác như cách cộng điểm xét tuyển.
 */
export const tongDiem = (diem: Diem, toHop: MonId[]) =>
  lam(toHop.reduce((t, m) => t + (typeof diem[m] === "number" && Number.isFinite(diem[m]) ? diem[m]! : 0), 0));

export const monThieu = (diem: Diem, toHop: MonId[]) =>
  toHop.filter((m) => diem[m] === null || diem[m] === undefined || typeof diem[m] !== "number" || !Number.isFinite(diem[m]));

// ---------- Kết quả một tình huống ----------

export type TrangThaiThay = "moiPhuHop" | "tangCoHoi" | "giuNguyen" | "vanKho" | "giamDi";
export type NhomLoc = "moiMo" | "tang" | "khongDoi" | "giam";
export const TEN_TRANG_THAI: Record<TrangThaiThay, string> = {
  moiPhuHop: "Mới phù hợp", tangCoHoi: "Tăng cơ hội", giuNguyen: "Giữ nguyên", vanKho: "Vẫn khó", giamDi: "Giảm đi",
};

export interface DongKetQua {
  lc: LuaChon;
  goc: number;
  moi: number;
  chenh: number;
  trangThai: TrangThaiThay;
  nhom: NhomLoc;
  lyDo: string;
}

function phanLoai(goc: number, moi: number): { trangThai: TrangThaiThay; nhom: NhomLoc } {
  if (goc < NGUONG_PHU_HOP && moi >= NGUONG_PHU_HOP) return { trangThai: "moiPhuHop", nhom: "moiMo" };
  if (moi < goc) return { trangThai: "giamDi", nhom: "giam" };
  if (moi > goc) return { trangThai: moi >= NGUONG_PHU_HOP ? "tangCoHoi" : "vanKho", nhom: "tang" };
  return { trangThai: moi >= NGUONG_PHU_HOP ? "giuNguyen" : "vanKho", nhom: "khongDoi" };
}

/** Một câu ngắn giải thích vì sao lựa chọn đổi (hoặc không đổi). */
function lyDoThay(lc: LuaChon, tongTruoc: number, tongSau: number, dkGoc: DieuKien, dkMoi: DieuKien, goc: number, chenh: number): string {
  const ns = dkMoi.nganSachTrieu, nsDoi = ns !== dkGoc.nganSachTrieu, kvDoi = dkMoi.khuVuc !== dkGoc.khuVuc;
  const ngoaiKv = !!dkMoi.khuVuc && lc.khuVuc.replace(/\s/g, "") !== dkMoi.khuVuc.replace(/\s/g, "");
  if (nsDoi && typeof lc.hocPhiMin === "number" && ns < lc.hocPhiMin && chenh < 0) return `Học phí từ ${lc.hocPhiMin} triệu/năm, cao hơn ngân sách ${ns} triệu.`;
  if (kvDoi && ngoaiKv && chenh < 0) return `Trường ở ${lc.khuVuc}, ngoài khu vực bạn ưu tiên.`;
  if (tongSau > tongTruoc) {
    if (tongTruoc < lc.diemMin && tongSau >= lc.diemMin) return `Điểm sau khi tăng (${vietDiem(tongSau)}) đã chạm mức tham khảo ${vietDiem(lc.diemMin)}.`;
    if (tongSau >= lc.diemMin && goc < NGUONG_PHU_HOP && goc + chenh >= NGUONG_PHU_HOP) return `Điểm phù hợp vượt mốc ${NGUONG_PHU_HOP} nhờ tổng điểm cao hơn mức tham khảo ${vietDiem(lam(tongSau - lc.diemMin, 1))}.`;
    if (tongSau < lc.diemMin) return `Còn thiếu ${vietDiem(lam(lc.diemMin - tongSau, 1))} điểm so với mức tham khảo ${vietDiem(lc.diemMin)}.`;
    return `Điểm cao hơn mức tham khảo ${vietDiem(lam(tongSau - lc.diemMin, 1))} điểm.`;
  }
  if (tongSau < tongTruoc && tongSau < lc.diemMin) return `Điểm sau khi giảm thấp hơn mức tham khảo ${vietDiem(lc.diemMin)}.`;
  if (nsDoi && typeof lc.hocPhiMax === "number" && ns >= lc.hocPhiMax && chenh > 0) return `Học phí ${lc.hocPhiMin}–${lc.hocPhiMax} triệu/năm nằm gọn trong ngân sách.`;
  if (kvDoi && !ngoaiKv && chenh > 0) return `Trường ở ${lc.khuVuc}, đúng khu vực bạn ưu tiên.`;
  if (chenh !== 0) return `Ưu tiên "${TEN_UU_TIEN[dkMoi.uuTien]}" làm điểm phù hợp ${chenh > 0 ? "tăng" : "giảm"}.`;
  if (tongSau < lc.diemMin) return `Vẫn còn cách mức tham khảo ${vietDiem(lam(lc.diemMin - tongSau, 1))} điểm.`;
  return "Tình huống này chưa làm thay đổi lựa chọn này.";
}

const THU_TU_TRANG_THAI: Record<TrangThaiThay, number> = { moiPhuHop: 0, tangCoHoi: 1, vanKho: 2, giuNguyen: 3, giamDi: 4 };

export interface KetQuaTinhHuong {
  tongTruoc: number;
  tongSau: number;
  dkGoc: DieuKien;
  dkMoi: DieuKien;
  dong: DongKetQua[];
  /** Số chương trình không đưa vào so sánh vì điểm chuẩn thuộc phương thức khác THPT. */
  khacPhuongThuc: number;
  dem: Record<NhomLoc, number>;
  /** [trước, sau] */
  phuHop: [number, number];
  datThamKhao: [number, number];
  hocPhiVua: [number, number];
  thayDoiLonNhat: DongKetQua | null;
  coThayDoi: boolean;
}

export function tinhTinhHuong(lcs: LuaChon[], diem: Diem, toHop: MonId[], dkGoc: DieuKien, dangThu: Pick<TinhHuongDangThu, "congMon" | "nganSachTrieu" | "khuVuc" | "uuTien">, them?: DiemThem): KetQuaTinhHuong {
  const cong = gonCongMon(dangThu.congMon);
  const diemSau = apDungCong(diem, cong);
  const tongTruoc = tongDiem(diem, toHop);
  const tongSau = tongDiem(diemSau, toHop);
  const dkMoi = dieuKienMoi(dkGoc, dangThu);
  // Mỗi ngành so bằng tổng điểm theo tổ hợp của chính ngành đó; ngành chưa tính được thì không đưa vào so sánh.
  const hang = lcs.flatMap((lc) => {
    const tt = tongTheoNganh(lc, diem, them), ts = tongTheoNganh(lc, diemSau, them);
    return tt === null || ts === null ? [] : [{ lc, tt, ts }];
  });
  const dong: DongKetQua[] = hang.map(({ lc, tt, ts }) => {
    const goc = diemPhuHop(lc, { ...dkGoc, tong: tt }), moi = diemPhuHop(lc, { ...dkMoi, tong: ts });
    const chenh = moi - goc;
    return { lc, goc, moi, chenh, ...phanLoai(goc, moi), lyDo: lyDoThay(lc, tt, ts, dkGoc, dkMoi, goc, chenh) };
  }).sort((a, b) => THU_TU_TRANG_THAI[a.trangThai] - THU_TU_TRANG_THAI[b.trangThai] || b.chenh - a.chenh || b.moi - a.moi);
  const dem: Record<NhomLoc, number> = { moiMo: 0, tang: 0, khongDoi: 0, giam: 0 };
  dong.forEach((d) => dem[d.nhom]++);
  const demVua = (ns: number) => hang.filter(({ lc }) => typeof lc.hocPhiMin === "number" && lc.hocPhiMin <= ns).length;
  const lon = [...dong].sort((x, y) => Math.abs(y.chenh) - Math.abs(x.chenh))[0] ?? null;
  return {
    tongTruoc, tongSau, dkGoc, dkMoi, dong, dem, khacPhuongThuc: lcs.filter((lc) => lyDoKhacPhuongThuc(lc)).length,
    phuHop: [dong.filter((d) => d.goc >= NGUONG_PHU_HOP).length, dong.filter((d) => d.moi >= NGUONG_PHU_HOP).length],
    datThamKhao: [hang.filter((x) => x.tt >= x.lc.diemMin).length, hang.filter((x) => x.ts >= x.lc.diemMin).length],
    hocPhiVua: [demVua(dkGoc.nganSachTrieu), demVua(dkMoi.nganSachTrieu)],
    thayDoiLonNhat: lon && lon.chenh !== 0 ? lon : null,
    coThayDoi: Object.keys(cong).length > 0 || dkMoi.nganSachTrieu !== dkGoc.nganSachTrieu || dkMoi.khuVuc !== dkGoc.khuVuc || dkMoi.uuTien !== dkGoc.uuTien,
  };
}

// ---------- Tên, tiêu đề ----------

const vietCongTen = (n: number) => `${n > 0 ? "+" : "−"}${Number.isInteger(n) ? Math.abs(n) : vietDiem(Math.abs(n))}`;

/** Tên tự động: "Toán +1", "Toán +1 · Lý +0.5 · Ngân sách 30 tr". */
export function tenTinhHuong(t: Pick<TinhHuongDangThu, "congMon" | "nganSachTrieu" | "khuVuc" | "uuTien">, goc: DieuKien): string {
  const cong = gonCongMon(t.congMon);
  const dk = dieuKienMoi(goc, t);
  const phan = (Object.keys(cong) as MonId[]).map((m) => `${TEN_MON_NGAN[m]} ${vietCongTen(cong[m]!)}`);
  if (dk.nganSachTrieu !== goc.nganSachTrieu) phan.push(`Ngân sách ${dk.nganSachTrieu} tr`);
  if (dk.khuVuc !== goc.khuVuc) phan.push(dk.khuVuc || "Mọi khu vực");
  if (dk.uuTien !== goc.uuTien) phan.push(TEN_UU_TIEN[dk.uuTien]);
  return phan.length ? phan.join(" · ") : "Hiện tại";
}

/** "Toán tăng 1 điểm", "Toán +1, Lý +0.5", hoặc null nếu không đổi điểm. */
export function moTaCongDiem(congMon: Partial<Record<MonId, number>>): string | null {
  const cong = gonCongMon(congMon);
  const mon = Object.keys(cong) as MonId[];
  if (mon.length === 0) return null;
  if (mon.length === 1) {
    const n = cong[mon[0]]!;
    return `${TEN_MON[mon[0]]} ${n > 0 ? "tăng" : "giảm"} ${Number.isInteger(n) ? Math.abs(n) : vietDiem(Math.abs(n))} điểm`;
  }
  return mon.map((m) => `${TEN_MON_NGAN[m]} ${vietCongTen(cong[m]!)}`).join(", ");
}

// ---------- Tình huống đã lưu ----------

/** Dữ liệu để gọi luuTinhHuong (store tự thêm id và thời điểm). */
export function taoTinhHuongLuu(t: TinhHuongDangThu, goc: DieuKien, tongSau: number): Omit<TinhHuongDaLuu, "id" | "luc"> {
  const dk = dieuKienMoi(goc, t);
  return { ten: tenTinhHuong(t, goc), tongDiem: tongSau, congMon: gonCongMon(t.congMon), nganSachTrieu: dk.nganSachTrieu, khuVuc: dk.khuVuc, uuTien: dk.uuTien };
}

export function trungTinhHuong(a: Omit<TinhHuongDaLuu, "id" | "luc">, b: Omit<TinhHuongDaLuu, "id" | "luc">): boolean {
  const ca = gonCongMon(a.congMon), cb = gonCongMon(b.congMon);
  return CAC_MON.every((m) => (ca[m] ?? 0) === (cb[m] ?? 0)) && a.nganSachTrieu === b.nganSachTrieu && a.khuVuc === b.khuVuc && a.uuTien === b.uuTien;
}

export interface CotSoSanh { id: string; ten: string; tong: number; nganSachTrieu: number }
export interface DongSoSanh { lc: LuaChon; diem: number[] }

/**
 * Bảng so sánh "Hiện tại | tình huống 1 | tình huống 2…" cho top lựa chọn.
 * Tính lại điểm từ congMon trên điểm hiện tại (để bảng vẫn đúng khi em vừa nhập điểm mới).
 */
export function bangSoSanh(lcs: LuaChon[], diem: Diem, toHop: MonId[], dkGoc: DieuKien, cacTh: TinhHuongDaLuu[], soDong = 3, them?: DiemThem): { cot: CotSoSanh[]; dong: DongSoSanh[] } {
  const tongGoc = tongDiem(diem, toHop);
  const cot: (CotSoSanh & { dk: Omit<DieuKienThu, "tong">; diem: Diem })[] = [
    { id: "hien-tai", ten: "Hiện tại", tong: tongGoc, nganSachTrieu: dkGoc.nganSachTrieu, dk: dkGoc, diem },
    ...cacTh.map((t) => {
      const d = apDungCong(diem, t.congMon);
      return { id: t.id, ten: t.ten, tong: tongDiem(d, toHop), nganSachTrieu: t.nganSachTrieu, dk: { nganSachTrieu: t.nganSachTrieu, khuVuc: t.khuVuc, uuTien: t.uuTien }, diem: d };
    }),
  ];
  // Mỗi cột tính từng ngành theo tổng điểm của đúng tổ hợp ngành đó (ngành chưa tính được thì bỏ).
  const dong = lcs.flatMap((lc) => {
    const diemCot = cot.map((c) => { const t = tongTheoNganh(lc, c.diem, them); return t === null ? null : diemPhuHop(lc, { ...c.dk, tong: t }); });
    return diemCot.some((x) => x === null) ? [] : [{ lc, diem: diemCot as number[] }];
  }).sort((a, b) => Math.max(...b.diem) - Math.max(...a.diem) || b.diem[0] - a.diem[0]).slice(0, soDong);
  return { cot: cot.map(({ dk: _dk, diem: _d, ...c }) => c), dong };
}

// ---------- Điểm thi thử ----------

/** Đọc một ô điểm: chấp nhận dấu phẩy. Trống = không nhập. */
export function docODiem(chuoi: string): { gia: number | null; loi?: string } {
  const t = chuoi.trim().replace(",", ".");
  if (t === "") return { gia: null };
  if (!/^\d{1,2}(\.\d{0,2})?$/.test(t)) return { gia: null, loi: "Chỉ nhập số, ví dụ 7,5" };
  const n = Number(t);
  if (n > 10) return { gia: null, loi: "Điểm chỉ từ 0 đến 10" };
  return { gia: lam(n) };
}

export const CAC_TO_HOP: MaToHop[] = ["A00", "A01", "D01", "B00"];

export function tongCacToHop(diem: Diem): Record<MaToHop, { tong: number | null; thieu: MonId[] }> {
  return Object.fromEntries(CAC_TO_HOP.map((ma) => {
    const thieu = monThieu(diem, TO_HOP[ma]);
    return [ma, { tong: thieu.length ? null : tongDiem(diem, TO_HOP[ma]), thieu }];
  })) as Record<MaToHop, { tong: number | null; thieu: MonId[] }>;
}

export const HANG_NHAN: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 };

export interface DongTruocSau {
  id: string;
  tongTruoc: number; // tổng điểm của em theo tổ hợp của ngành này, trước và sau
  tongSau: number;
  coTruoc: boolean; // false: trước đó em chưa đủ điểm tổ hợp của ngành này
  nhanTruoc: NhanNguyenVong;
  nhanSau: NhanNguyenVong;
  phuHopTruoc: number;
  phuHopSau: number;
}

/** Ảnh chụp trước/sau khi em nhập điểm thi thử. Lưu ở máy để màn kết quả đọc lại. */
export interface AnhTruocSau {
  luc: string | null;
  maToHop: MaToHop;
  tongTruoc: number;
  tongSau: number;
  /** "nguyenVong" khi em đã có danh sách; "goiY" khi chưa có nên dùng danh sách gợi ý. */
  nguon: "nguyenVong" | "goiY";
  nganSachTrieu: number | null;
  /** false khi trước lần nhập này em chưa đủ điểm 3 môn của tổ hợp (nhãn "trước" không có ý nghĩa). */
  coTruoc: boolean;
  /** Môn của tổ hợp vẫn còn thiếu sau khi nhập. */
  thieuSau: MonId[];
  monDoi: { mon: MonId; truoc: number | null; sau: number }[];
  dong: DongTruocSau[];
}
export const ANH_TRONG: AnhTruocSau = { luc: null, maToHop: "A01", tongTruoc: 0, tongSau: 0, nguon: "nguyenVong", nganSachTrieu: null, coTruoc: true, thieuSau: [], monDoi: [], dong: [] };

export function chupTruocSau(p: {
  lcs: LuaChon[]; nguon: AnhTruocSau["nguon"]; diemTruoc: Diem; diemSau: Diem; maToHop: MaToHop; toHop: MonId[];
  dk: DieuKien & { coNganSach: boolean }; luc: string; them?: DiemThem;
}): AnhTruocSau {
  const tongTruoc = tongDiem(p.diemTruoc, p.toHop), tongSau = tongDiem(p.diemSau, p.toHop);
  const monDoi = CAC_MON.filter((m) => p.diemSau[m] !== null && p.diemSau[m] !== p.diemTruoc[m]).map((m) => ({ mon: m, truoc: p.diemTruoc[m], sau: p.diemSau[m]! }));
  // Nhãn từng nguyện vọng tính theo tổ hợp của chính ngành đó; ngành chưa tính được (thiếu điểm) thì bỏ khỏi so sánh.
  const dong = p.lcs.flatMap((lc): DongTruocSau[] => {
    const tt = tongTheoNganh(lc, p.diemTruoc, p.them), ts = tongTheoNganh(lc, p.diemSau, p.them);
    if (ts === null) return [];
    const tTruoc = tt ?? ts; // chưa đủ điểm trước đó: nhãn "trước" không có ý nghĩa (coTruoc = false)
    return [{
      id: lc.id, tongTruoc: tTruoc, tongSau: ts, coTruoc: tt !== null,
      nhanTruoc: nhanNguyenVong(lc, tTruoc), nhanSau: nhanNguyenVong(lc, ts),
      phuHopTruoc: diemPhuHop(lc, { ...p.dk, tong: tTruoc }), phuHopSau: diemPhuHop(lc, { ...p.dk, tong: ts }),
    }];
  });
  return {
    luc: p.luc, maToHop: p.maToHop, tongTruoc, tongSau, nguon: p.nguon, monDoi,
    coTruoc: dong.length > 0 ? dong.every((d) => d.coTruoc) : monThieu(p.diemTruoc, p.toHop).length === 0, thieuSau: monThieu(p.diemSau, p.toHop),
    nganSachTrieu: p.dk.coNganSach ? p.dk.nganSachTrieu : null,
    dong,
  };
}

export type HuongThay = "tang" | "giam" | "giu";
export const huongThay = (d: DongTruocSau): HuongThay => {
  const h = HANG_NHAN[d.nhanSau] - HANG_NHAN[d.nhanTruoc];
  if (h !== 0) return h > 0 ? "tang" : "giam";
  return d.phuHopSau > d.phuHopTruoc ? "tang" : d.phuHopSau < d.phuHopTruoc ? "giam" : "giu";
};

export interface DongTomTat { loai: "len" | "xuong" | "giu" | "anToan" | "thieuAnToan" | "xemLai" | "on"; tieuDe: string; moTa: string; id?: string }

const phoBien = (ds: DongTruocSau[]) => {
  const dem = new Map<string, number>();
  for (const d of ds) { const k = `${d.nhanTruoc} → ${d.nhanSau}`; dem.set(k, (dem.get(k) ?? 0) + 1); }
  return [...dem.entries()].sort((x, y) => y[1] - x[1])[0];
};

/** Dòng 1: bao nhiêu lựa chọn đổi nhóm. Lần đầu đủ điểm thì chưa có "trước" để so. */
function dongChuyenNhom(a: AnhTruocSau, ten: string): DongTomTat {
  if (!a.coTruoc) {
    const vua = a.dong.filter((d) => d.nhanSau !== "Thử sức").length;
    return { loai: "len", tieuDe: `Lần đầu đủ điểm ${a.maToHop}: ${dinhDangDiem(a.tongSau)}`, moTa: `${vua}/${a.dong.length} ${ten} ở mức Vừa sức trở lên` };
  }
  const len = a.dong.filter((d) => HANG_NHAN[d.nhanSau] > HANG_NHAN[d.nhanTruoc]);
  const xuong = a.dong.filter((d) => HANG_NHAN[d.nhanSau] < HANG_NHAN[d.nhanTruoc]);
  if (len.length) {
    const [k, n] = phoBien(len);
    return { loai: "len", tieuDe: `${len.length} ${ten} lên nhóm có điểm chuẩn thấp hơn điểm em`, moTa: n === len.length ? `chuyển từ ${k}` : `nhiều nhất là ${k} (${n})` };
  }
  if (xuong.length) return { loai: "xuong", tieuDe: `${xuong.length} ${ten} xuống nhóm khó hơn`, moTa: `chuyển từ ${phoBien(xuong)[0]}` };
  return { loai: "giu", tieuDe: `Chưa có ${ten} nào đổi nhóm`, moTa: "nhãn của danh sách vẫn như trước" };
}

/** Ba dòng tóm tắt sinh từ so sánh trước/sau. */
export function tomTatTruocSau(a: AnhTruocSau, tim: (id: string) => LuaChon | undefined): DongTomTat[] {
  const ra: DongTomTat[] = [];
  const ten = a.nguon === "nguyenVong" ? "nguyện vọng" : "lựa chọn";
  const chac = (n: NhanNguyenVong) => n === "An toàn" || n === "Dự phòng";
  ra.push(dongChuyenNhom(a, ten));
  // 2) Nguyện vọng An toàn / Dự phòng
  const giuChac = a.dong.filter((d) => chac(d.nhanTruoc) && chac(d.nhanSau)).length;
  const moiChac = a.dong.filter((d) => !chac(d.nhanTruoc) && chac(d.nhanSau)).length;
  const soChacSau = a.dong.filter((d) => chac(d.nhanSau)).length;
  if (!a.coTruoc) ra.push(soChacSau ? { loai: "anToan", tieuDe: `${soChacSau} ${ten} an toàn`, moTa: "với điểm vừa nhập" } : { loai: "thieuAnToan", tieuDe: `Chưa có ${ten} an toàn`, moTa: "bạn có thể thêm ít nhất 1 lựa chọn có điểm chuẩn thấp hơn điểm bạn" });
  else if (soChacSau === 0) ra.push({ loai: "thieuAnToan", tieuDe: `Chưa có ${ten} an toàn`, moTa: "bạn có thể thêm ít nhất 1 lựa chọn có điểm chuẩn thấp hơn điểm bạn" });
  else if (moiChac) ra.push({ loai: "anToan", tieuDe: `${soChacSau} ${ten} an toàn`, moTa: giuChac ? `${giuChac} vẫn giữ nguyên, thêm ${moiChac} mới` : `thêm ${moiChac} so với trước` });
  else ra.push({ loai: "anToan", tieuDe: `${giuChac} ${ten} an toàn`, moTa: "vẫn giữ nguyên" });
  // 3) Trường nên xem lại: học phí vượt ngân sách, rồi tới trường còn cách xa mức tham khảo
  const vuotPhi = a.nganSachTrieu === null ? [] : a.dong.filter((d) => (tim(d.id)?.hocPhiMin ?? 0) > a.nganSachTrieu!);
  const xa = a.dong.filter((d) => { const lc = tim(d.id); return lc && lc.diemMin - d.tongSau > 2; });
  if (vuotPhi.length) ra.push({ loai: "xemLai", tieuDe: `Nên xem lại ${vuotPhi.length} trường`, moTa: "có học phí cao so với điều kiện hiện tại", id: vuotPhi[0].id });
  else if (xa.length) ra.push({ loai: "xemLai", tieuDe: `Nên xem lại ${xa.length} trường`, moTa: "điểm mới còn cách mức tham khảo hơn 2 điểm", id: xa[0].id });
  else ra.push({ loai: "on", tieuDe: "Chưa thấy trường nào cần xem lại", moTa: "học phí và điểm đều nằm trong tầm" });
  return ra;
}

/** Các dòng đáng chú ý: đổi nhãn trước, rồi đổi điểm phù hợp nhiều nhất. */
export function dongDangChuY(a: AnhTruocSau): DongTruocSau[] {
  const diem = (d: DongTruocSau) => Math.abs(HANG_NHAN[d.nhanSau] - HANG_NHAN[d.nhanTruoc]) * 100 + Math.abs(d.phuHopSau - d.phuHopTruoc);
  return [...a.dong].sort((x, y) => diem(y) - diem(x));
}
