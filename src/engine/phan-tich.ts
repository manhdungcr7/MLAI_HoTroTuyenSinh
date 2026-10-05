// Tính toán cho khoảng cách mục tiêu, nhãn nguyện vọng, độ cân đối danh sách, thử tình huống.
// TypeScript thuần, không import React. Điểm "phù hợp" là điểm gợi ý trên 100, KHÔNG phải xác suất đậu.
import type { HoSo, LuaChon, MonId, NhanNguyenVong } from "@/state/types";
import { TEN_MON } from "@/state/types";
import { coHocPhi } from "@/data/lua-chon-phu";

export const NGAN_SACH_TOI_DA: Record<NonNullable<HoSo["nganSach"]>, number> = {
  duoi30: 30, "30-60": 60, "60-100": 100, tren100: 150,
};

const lam = (n: number, so = 1) => Math.round(n * 10 ** so) / 10 ** so;
const kep = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export function tongDiem(diem: Record<MonId, number | null>, toHop: MonId[]): number {
  return lam(toHop.reduce((s, m) => s + (diem[m] ?? 0), 0));
}

export type MucUuTienMon = "cao" | "vua" | "duyTri";
export interface KhoangCachMon { mon: MonId; ten: string; hienTai: number; mucTieu: number; thieu: number; uuTien: MucUuTienMon }

/** Chia phần điểm còn thiếu cho từng môn: môn còn nhiều dư địa và môn em tự thấy cần cải thiện nhận phần lớn hơn. */
export function khoangCachTheoMon(diem: Record<MonId, number | null>, toHop: MonId[], diemMucTieu: number, canCaiThien: string[] = []): KhoangCachMon[] {
  const hienTai = Object.fromEntries(toHop.map((m) => [m, diem[m] ?? 0])) as Record<MonId, number>;
  let con = Math.max(0, lam(diemMucTieu - tongDiem(diem, toHop), 2));
  const them = Object.fromEntries(toHop.map((m) => [m, 0])) as Record<MonId, number>;
  for (let vong = 0; vong < 4 && con > 0.001; vong++) {
    const w = toHop.map((m) => ({ m, w: Math.max(0, 10 - hienTai[m] - them[m]) * (canCaiThien.includes(TEN_MON[m]) ? 1.5 : 1) }));
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

export function nhanNguyenVong(lc: LuaChon, tong: number): NhanNguyenVong {
  const x = tong - lc.diemMin;
  if (x < 0) return "Thử sức";
  if (x < 1.5) return "Vừa sức";
  if (x < 4) return "An toàn";
  return "Dự phòng";
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
  if (ds.length === 0) { diemCB = 0; canhBao.push("Em chưa thêm nguyện vọng nào."); }
  else {
    if (dem["An toàn"] + dem["Dự phòng"] === 0) { diemCB -= 40; canhBao.push("Danh sách chưa có nguyện vọng an toàn. Nên thêm ít nhất 1 nguyện vọng chắc chân."); }
    if (dem["Thử sức"] / n > 0.5) { diemCB -= 20; canhBao.push("Hơn một nửa danh sách là thử sức, mức chắc chắn còn thấp."); }
    if (dem["Vừa sức"] === 0) { diemCB -= 15; canhBao.push("Chưa có nguyện vọng vừa sức với điểm hiện tại."); }
    if (dem["Dự phòng"] === 0 && dem["An toàn"] < 2) diemCB -= 5;
    if (dem["Thử sức"] === 0 && ds.length >= 3) { diemCB -= 5; canhBao.push("Danh sách hơi an toàn, em có thể thêm một nguyện vọng thử sức."); }
  }
  diemCB = kep(diemCB, 0, 100);

  const ns = hoSo.nganSach ? NGAN_SACH_TOI_DA[hoSo.nganSach] : null;
  let diemTC = 0, chiTietTC = "Em chưa chọn ngân sách học phí.";
  if (ns !== null && ds.length) {
    const coPhi = ds.filter((d) => coHocPhi(d.lc));
    if (coPhi.length === 0) chiTietTC = "Các nguyện vọng này chưa có dữ liệu học phí để so với ngân sách.";
    else {
      const vua = coPhi.filter((d) => (d.lc.hocPhiMin as number) <= ns).length;
      diemTC = Math.round((vua / coPhi.length) * 100);
      chiTietTC = `${vua}/${coPhi.length} nguyện vọng có học phí nằm trong ngân sách ${ns} triệu/năm${coPhi.length < ds.length ? ` (${ds.length - coPhi.length} nguyện vọng chưa có dữ liệu học phí)` : ""}.`;
      if (vua < coPhi.length) canhBao.push(`Có ${coPhi.length - vua} nguyện vọng vượt ngân sách học phí của em.`);
    }
  }
  let diemKV = 0, chiTietKV = "Em chưa chọn khu vực ưu tiên.";
  if (hoSo.khuVuc.length && ds.length) {
    const dung = ds.filter((d) => hoSo.khuVuc.some((k) => d.lc.khuVuc.replace(/\s/g, "").includes(k.replace(/\s/g, "")))).length;
    diemKV = Math.round((dung / ds.length) * 100);
    chiTietKV = `${dung}/${ds.length} nguyện vọng ở khu vực em ưu tiên.`;
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
  const diemThi = kep(50 + (dk.tong - lc.diemMin) * 15, 5, 100);
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
  return Math.round(co.reduce((s, x) => s + x[0] * x[1], 0) / tongTrong);
}

export const NGUONG_PHU_HOP = 70;

export function soSanhTinhHuong(lcs: LuaChon[], goc: DieuKienThu, moi: DieuKienThu) {
  const a = lcs.map((l) => ({ lc: l, goc: diemPhuHop(l, goc), moi: diemPhuHop(l, moi) }));
  return {
    dong: a,
    phuHopHon: a.filter((x) => x.goc < NGUONG_PHU_HOP && x.moi >= NGUONG_PHU_HOP).length,
    itPhuHopHon: a.filter((x) => x.goc >= NGUONG_PHU_HOP && x.moi < NGUONG_PHU_HOP).length,
    thayDoiLonNhat: [...a].sort((x, y) => Math.abs(y.moi - y.goc) - Math.abs(x.moi - x.goc))[0],
  };
}
