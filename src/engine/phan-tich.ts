// Tính toán cho khoảng cách mục tiêu, nhãn nguyện vọng, độ cân đối danh sách, thử tình huống.
// TypeScript thuần, không import React. Điểm "phù hợp" là điểm gợi ý trên 100, KHÔNG phải xác suất đậu.
import type { HoSo, LuaChon, MonId, NhanNguyenVong } from "@/state/types";
import { TEN_MON } from "@/state/types";
import { coHocPhi } from "@/data/lua-chon-phu";
import { dinhDang } from "./dinh-dang";

export const NGAN_SACH_TOI_DA: Record<NonNullable<HoSo["nganSach"]>, number> = {
  duoi30: 30, "30-60": 60, "60-100": 100, tren100: 150,
};

const lam = (n: number, so = 1) => Math.round(n * 10 ** so) / 10 ** so;
const kep = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Tổng điểm các môn của tổ hợp. Môn chưa nhập đang tính là 0: nơi nào hiển thị số này phải kiểm `monThieuCuaToHop` trước, không đưa số đó ra như điểm thật. */
export function tongDiem(diem: Record<MonId, number | null>, toHop: MonId[]): number {
  return lam(toHop.reduce((s, m) => s + (typeof diem[m] === "number" && Number.isFinite(diem[m]) ? diem[m]! : 0), 0));
}

/** Các môn của tổ hợp em chưa nhập điểm. Rỗng nghĩa là `tongDiem` là điểm thật. */
export const monThieuCuaToHop = (diem: Record<MonId, number | null>, toHop: MonId[]): MonId[] =>
  toHop.filter((m) => diem[m] === null || diem[m] === undefined || typeof diem[m] !== "number" || !Number.isFinite(diem[m]));

export const TEN_PHUONG_THUC: Record<string, string> = {
  THPT: "Điểm thi tốt nghiệp THPT", HOC_BA: "Học bạ THPT", DGNL_HCM: "ĐGNL ĐHQG TP.HCM", DGNL_HN: "ĐGNL ĐHQG Hà Nội",
  DGNL_KHAC: "Đánh giá năng lực (khác)", DGTD: "Đánh giá tư duy", KET_HOP: "Kết hợp nhiều tiêu chí", NANG_KHIEU: "Có thi năng khiếu",
};

/** Điểm chuẩn của phương thức khác (học bạ, ĐGNL, năng khiếu...) không cùng thang với điểm thi tốt nghiệp: trả lý do, hoặc null nếu so được. Dữ liệu cũ không ghi phương thức coi là THPT. */
export function lyDoKhacPhuongThuc(lc: Pick<LuaChon, "phuongThuc">): string | null {
  if (!lc.phuongThuc || lc.phuongThuc === "THPT") return null;
  return `Điểm này thuộc phương thức "${TEN_PHUONG_THUC[lc.phuongThuc] ?? lc.phuongThuc}", chưa so được với điểm thi THPT.`;
}

export type MucUuTienMon = "cao" | "vua" | "duyTri";
export interface KhoangCachMon { mon: MonId; ten: string; hienTai: number; mucTieu: number; thieu: number; uuTien: MucUuTienMon }

/** Chia phần điểm còn thiếu cho từng môn: môn còn nhiều dư địa và môn em tự thấy cần cải thiện nhận phần lớn hơn. */
export function khoangCachTheoMon(diem: Record<MonId, number | null>, toHop: MonId[], diemMucTieu: number, canCaiThien: string[] = []): KhoangCachMon[] {
  if (!toHop || toHop.length === 0) return [];
  const safeMucTieu = typeof diemMucTieu === "number" && Number.isFinite(diemMucTieu) ? Math.max(0, diemMucTieu) : 0;
  const safeCanCaiThien = Array.isArray(canCaiThien) ? canCaiThien : [];
  const hienTai = Object.fromEntries(toHop.map((m) => [m, typeof diem[m] === "number" && Number.isFinite(diem[m]) ? diem[m]! : 0])) as Record<MonId, number>;
  let con = Math.max(0, lam(safeMucTieu - tongDiem(diem, toHop), 2));
  const them = Object.fromEntries(toHop.map((m) => [m, 0])) as Record<MonId, number>;
  for (let vong = 0; vong < 4 && con > 0.001; vong++) {
    const w = toHop.map((m) => ({ m, w: Math.max(0, 10 - hienTai[m] - them[m]) * (safeCanCaiThien.includes(TEN_MON[m]) ? 1.5 : 1) }));
    const tong = w.reduce((s, x) => s + x.w, 0);
    if (tong <= 0) break;
    let daChia = 0;
    for (const { m, w: wi } of w) {
      const chia = Math.min((con * wi) / tong, 10 - hienTai[m] - them[m]);
      them[m] += chia; daChia += chia;
    }
    con -= daChia;
  }
  return toHop.map((m) => {
    const thieu = lam(them[m]);
    return { mon: m, ten: TEN_MON[m], hienTai: lam(hienTai[m]), mucTieu: lam(hienTai[m] + thieu), thieu, uuTien: thieu >= 0.6 ? "cao" : thieu >= 0.25 ? "vua" : "duyTri" };
  });
}

/** Chỉ gọi khi `tong` là số hữu hạn và `lc` là điểm THPT. Màn hình nên gọi `nhanChoLuaChon` (trả null khi không so được). */
export function nhanNguyenVong(lc: LuaChon, tong: number): NhanNguyenVong {
  const dMin = typeof lc.diemMin === "number" && Number.isFinite(lc.diemMin) ? lc.diemMin : 0;
  const t = typeof tong === "number" && Number.isFinite(tong) ? tong : 0;
  // Làm tròn 2 chữ số: điểm chuẩn có 2 số lẻ, phép trừ số thực có thể lệch 1e-15 và xếp sai nhãn ở đúng ngưỡng.
  const x = Math.round((t - dMin) * 100) / 100;
  if (x < 0) return "Thử sức";
  if (x < 1.5) return "Vừa sức";
  if (x < 4) return "An toàn";
  return "Dự phòng";
}

/** Nhãn nếu so được; null khi điểm khác phương thức THPT hoặc tổng điểm không phải số. Không bao giờ đoán. */
export function nhanChoLuaChon(lc: LuaChon, tong: number | null): NhanNguyenVong | null {
  if (tong === null || !Number.isFinite(tong) || lyDoKhacPhuongThuc(lc)) return null;
  return nhanNguyenVong(lc, tong);
}

export interface PhanTichDanhSach {
  dem: Record<NhanNguyenVong, number>;
  tyLe: Record<NhanNguyenVong, number>;
  canBang: { diem: number; nhanXet: string };
  taiChinh: { diem: number; nhanXet: string; chiTiet: string };
  khuVuc: { diem: number; nhanXet: string; chiTiet: string };
  canhBao: string[];
}

const nhanXetDiem = (d: number, tu: [string, string, string, string]) => (d >= 85 ? tu[0] : d >= 70 ? tu[1] : d >= 50 ? tu[2] : tu[3]);

export function phanTichDanhSach(ds: { lc: LuaChon; nhan: NhanNguyenVong }[], hoSo: Pick<HoSo, "nganSach" | "khuVuc">): PhanTichDanhSach {
  const dem: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 0, "An toàn": 0, "Dự phòng": 0 };
  ds.forEach((d) => dem[d.nhan]++);
  const n = Math.max(1, ds.length);
  const tyLe = Object.fromEntries((Object.keys(dem) as NhanNguyenVong[]).map((k) => [k, Math.round((dem[k] / n) * 100)])) as Record<NhanNguyenVong, number>;

  const canhBao: string[] = [];
  let diemCB = 100;
  if (ds.length === 0) { diemCB = 0; canhBao.push("Bạn chưa thêm nguyện vọng nào."); }
  else {
    if (dem["An toàn"] + dem["Dự phòng"] === 0) { diemCB -= 40; canhBao.push("Danh sách chưa có nguyện vọng An toàn hay Dự phòng. Bạn có thể thêm ít nhất 1 nguyện vọng có điểm chuẩn thấp hơn điểm của bạn."); }
    if (dem["Thử sức"] / n > 0.5) { diemCB -= 20; canhBao.push("Hơn một nửa danh sách là thử sức (điểm chuẩn cao hơn điểm của bạn)."); }
    if (dem["Vừa sức"] === 0) { diemCB -= 15; canhBao.push("Chưa có nguyện vọng vừa sức với điểm hiện tại."); }
    if (dem["Dự phòng"] === 0 && dem["An toàn"] < 2) diemCB -= 5;
    if (dem["Thử sức"] === 0 && ds.length >= 3) { diemCB -= 5; canhBao.push("Danh sách hơi an toàn, bạn có thể thêm một nguyện vọng thử sức."); }
  }
  diemCB = kep(diemCB, 0, 100);

  const ns = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : null;
  let diemTC = 0, chiTietTC = "Bạn chưa chọn ngân sách học phí.";
  if (ns !== null && ds.length) {
    const coPhi = ds.filter((d) => coHocPhi(d.lc));
    if (coPhi.length === 0) chiTietTC = "Các nguyện vọng này chưa có dữ liệu học phí để so với ngân sách.";
    else {
      const vua = coPhi.filter((d) => (d.lc.hocPhiMin as number) <= ns).length;
      diemTC = Math.round((vua / coPhi.length) * 100);
      chiTietTC = `${vua}/${coPhi.length} nguyện vọng có học phí nằm trong ngân sách ${ns} triệu/năm${coPhi.length < ds.length ? ` (${ds.length - coPhi.length} nguyện vọng chưa có dữ liệu học phí)` : ""}.`;
      if (vua < coPhi.length) canhBao.push(`Có ${coPhi.length - vua} nguyện vọng vượt ngân sách học phí của bạn.`);
    }
  }
  let diemKV = 0, chiTietKV = "Bạn chưa chọn khu vực ưu tiên.";
  if (Array.isArray(hoSo.khuVuc) && hoSo.khuVuc.length && ds.length) {
    const dung = ds.filter((d) => hoSo.khuVuc.some((k) => d.lc.khuVuc.replace(/\s/g, "").includes(k.replace(/\s/g, "")))).length;
    diemKV = Math.round((dung / ds.length) * 100);
    chiTietKV = `${dung}/${ds.length} nguyện vọng ở khu vực bạn ưu tiên.`;
  }
  return {
    dem, tyLe, canhBao,
    canBang: { diem: diemCB, nhanXet: nhanXetDiem(diemCB, ["Rất cân đối", "Khá hợp lý", "Cần chỉnh thêm", "Mất cân đối"]) },
    taiChinh: { diem: diemTC, nhanXet: nhanXetDiem(diemTC, ["Rất phù hợp", "Phù hợp", "Hơi căng", "Vượt khả năng"]), chiTiet: chiTietTC },
    khuVuc: { diem: diemKV, nhanXet: nhanXetDiem(diemKV, ["Rất phù hợp", "Phù hợp", "Khá xa", "Rất xa"]), chiTiet: chiTietKV },
  };
}

export interface DieuKienThu {
  tong: number;
  nganSachTrieu: number;
  khuVuc: string; // "TP.HCM" hoặc "" nếu không ràng buộc
  uuTien: "viecLam" | "hocPhi" | "gan";
}

/** Điểm phù hợp /100 của một lựa chọn trong một tình huống. */
export function diemPhuHop(lc: LuaChon, dk: DieuKienThu): number {
  const tongAnToan = typeof dk.tong === "number" && Number.isFinite(dk.tong) ? dk.tong : 0;
  const dMin = typeof lc.diemMin === "number" && Number.isFinite(lc.diemMin) ? lc.diemMin : 0;
  const diemThi = kep(50 + (tongAnToan - dMin) * 15, 5, 100);
  const tc = coHocPhi(lc)
    ? dk.nganSachTrieu >= (lc.hocPhiMax as number) ? 100 : dk.nganSachTrieu >= (lc.hocPhiMin as number) ? 70 : Math.max(0, 100 - ((lc.hocPhiMin as number) - dk.nganSachTrieu) * 8)
    : null;
  const kv = !dk.khuVuc || lc.khuVuc.replace(/\s/g, "") === dk.khuVuc.replace(/\s/g, "") ? 100 : 30;
  const viec = lc.coHoiViecLam ? { "Rất cao": 100, Cao: 85, Khá: 65 }[lc.coHoiViecLam] : null;
  const trongSo = dk.uuTien === "viecLam" ? [0.45, 0.2, 0.1, 0.25] : dk.uuTien === "hocPhi" ? [0.4, 0.35, 0.1, 0.15] : [0.45, 0.2, 0.25, 0.1];
  // Thành phần nào chưa có dữ liệu (học phí, việc làm) thì bỏ ra và chia lại trọng số cho các phần còn lại.
  const phan: [number | null, number][] = [[diemThi, trongSo[0]], [tc, trongSo[1]], [kv, trongSo[2]], [viec, trongSo[3]]];
  const co = phan.filter((x): x is [number, number] => x[0] !== null);
  const tongTrong = co.reduce((s, x) => s + x[1], 0);
  return tongTrong > 0 ? Math.round(co.reduce((s, x) => s + x[0] * x[1], 0) / tongTrong) : 50;
}

export const NGUONG_PHU_HOP = 70;

export function soSanhTinhHuong(lcs: LuaChon[], goc: DieuKienThu, moi: DieuKienThu) {
  const a = lcs.map((l) => ({ lc: l, goc: diemPhuHop(l, goc), moi: diemPhuHop(l, moi) }));
  return {
    dong: a,
    phuHopHon: a.filter((x) => x.goc < NGUONG_PHU_HOP && x.moi >= NGUONG_PHU_HOP).length,
    itPhuHopHon: a.filter((x) => x.goc >= NGUONG_PHU_HOP && x.moi < NGUONG_PHU_HOP).length,
    thayDoiLonNhat: [...a].sort((x, y) => Math.abs(y.moi - y.goc) - Math.abs(x.moi - x.goc))[0] ?? null,
  };
}

export interface DiemNghenToHop {
  toHop: string;
  monNghen: MonId;
  tenMonNghen: string;
  diemHienTai: number;
  diemTbMonKhac: number;
  doLech: number;
  mucTieuGoiY: number;
  thongDiep: string;
}

/**
 * Phân tích điểm nghẽn môn thi trong một tổ hợp:
 * Tìm môn có điểm thấp hơn đáng kể so với các môn còn lại trong cùng tổ hợp xét tuyển.
 * Trả về null nếu chưa đủ điểm 3 môn hoặc các môn đã cân bằng (độ lệch < 0.5).
 */
export function phanTichDiemNghen(
  diem: Record<MonId, number | null>,
  toHopMon: MonId[],
  maToHop: string,
): DiemNghenToHop | null {
  if (!toHopMon || toHopMon.length !== 3) return null;
  const thieu = monThieuCuaToHop(diem, toHopMon);
  if (thieu.length > 0) return null;

  const diemCacMon = toHopMon.map((m) => ({
    mon: m,
    ten: TEN_MON[m],
    diem: diem[m]!,
  }));

  diemCacMon.sort((a, b) => a.diem - b.diem);
  const thapNhat = diemCacMon[0];
  const haiMonConLai = [diemCacMon[1], diemCacMon[2]];
  const diemTbHaiMon = lam((haiMonConLai[0].diem + haiMonConLai[1].diem) / 2, 2);
  const doLech = lam(diemTbHaiMon - thapNhat.diem, 2);

  // Nếu lệch từ 0.5 điểm trở lên và môn thấp nhất còn dư địa kéo (dưới 9.5)
  if (doLech >= 0.5 && thapNhat.diem < 9.5) {
    const mucKeo = Math.min(1.0, Math.min(doLech, lam(10 - thapNhat.diem, 1)));
    return {
      toHop: maToHop,
      monNghen: thapNhat.mon,
      tenMonNghen: thapNhat.ten,
      diemHienTai: thapNhat.diem,
      diemTbMonKhac: diemTbHaiMon,
      doLech,
      mucTieuGoiY: lam(thapNhat.diem + mucKeo, 1),
      thongDiep: `Môn ${thapNhat.ten} (${dinhDang(thapNhat.diem, 1)}) đang thấp hơn trung bình các môn khác ${dinhDang(doLech, 1)} điểm. Kéo môn này thêm +${dinhDang(mucKeo, 1)} điểm sẽ cải thiện mạnh tổ hợp ${maToHop}.`,
    };
  }

  return null;
}

