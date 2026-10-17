// Bản đồ cơ hội và Phòng thử điểm: đếm ngành theo 4 nhãn, độ nhạy theo từng môn, so hai bộ điểm. TypeScript thuần, không React.
//
// Không có xác suất. Chỉ ngành mà `tomTatDiemChoNganh` cho phép so (điểm chuẩn THPT hợp lệ, không phải điểm sàn 15,0, không phải phương thức khác)
// mới được đếm vào nhãn; phần còn lại đếm riêng kèm lý do. Thiếu điểm môn thì nói thiếu, không điền 0.
// Nhãn lấy đúng từ `nhanNguyenVong` với điểm chuẩn gần nhất của `phanLoaiDuLieu` và tổng điểm của `tongChoLuaChon` (cùng nguồn với
// `tomTatDiemChoNganh`; tests/ban-do-co-hoi.test.ts đối chiếu hai đường này). Tham số `tk` giữ cho khớp chữ ký `tomTatDiemChoNganh`:
// nhãn không phụ thuộc dự báo nên không cần tính dự báo từng ngành (chậm hơn nhiều).
import { MON_CUA_TO_HOP, tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { phanLoaiDuLieu } from "@/engine/trang-thai-du-lieu";
import { nhanNguyenVong } from "@/engine/phan-tich";
import type { ThongKeBienDong } from "@/engine/du-bao-diem-chuan";
import { TEN_MON, TEN_MON_THEM, type DiemDayDu, type LuaChon, type MonKhoi, type NhanNguyenVong } from "@/state/types";

export const THU_TU_NHAN: NhanNguyenVong[] = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"];
/** Bậc nhãn theo mức điểm của em so với điểm chuẩn: càng cao càng vượt điểm chuẩn nhiều. */
export const BAC_NHAN: Record<NhanNguyenVong, number> = { "Thử sức": 0, "Vừa sức": 1, "An toàn": 2, "Dự phòng": 3 };
export const DIEM_MON_TOI_DA = 10;

export type LyDoChuaSo = "diemSan" | "phuongThucKhac" | "chuaCoDiemChuan" | "thieuDiemMon" | "toHopChuaTinh";
export const TEN_LY_DO: Record<LyDoChuaSo, string> = {
  diemSan: "chỉ có điểm sàn",
  phuongThucKhac: "điểm của phương thức khác",
  chuaCoDiemChuan: "chưa có điểm chuẩn",
  thieuDiemMon: "em chưa nhập đủ điểm môn",
  toHopChuaTinh: "tổ hợp mình chưa tính được",
};
const CAC_LY_DO: LyDoChuaSo[] = ["diemSan", "phuongThucKhac", "chuaCoDiemChuan", "thieuDiemMon", "toHopChuaTinh"];

interface NganhChuan {
  lc: LuaChon;
  /** Điểm chuẩn gần nhất được phép so; null khi không so được. */
  diemChuan: number | null;
  lyDo: LyDoChuaSo | null;
}

// Phần không đổi theo điểm của em: tính một lần cho cả danh mục (khoảng 2.500 ngành), nhớ lại theo mảng và độ dài.
const nho = new WeakMap<readonly LuaChon[], { dai: number; dau?: LuaChon; cuoi?: LuaChon; ra: NganhChuan[] }>();
function chuanBi(ds: readonly LuaChon[], namDuBao: number): NganhChuan[] {
  const c = nho.get(ds);
  if (c && c.dai === ds.length && c.dau === ds[0] && c.cuoi === ds[ds.length - 1]) return c.ra;
  const ra = ds.map((lc): NganhChuan => {
    const t = phanLoaiDuLieu(lc, undefined, namDuBao);
    if (t.loai === "nhieuNam" || t.loai === "motNam") return { lc, diemChuan: t.diemCuoi, lyDo: t.diemCuoi === null ? "chuaCoDiemChuan" : null };
    return { lc, diemChuan: null, lyDo: t.loai === "chiDiemSan" ? "diemSan" : t.loai === "phuongThucKhac" ? "phuongThucKhac" : "chuaCoDiemChuan" };
  });
  nho.set(ds, { dai: ds.length, dau: ds[0], cuoi: ds[ds.length - 1], ra });
  return ra;
}

/** Mã ngành đã so: bậc nhãn 0..3, hoặc lý do chưa so được. */
type KetQuaMot = { bac: number } | { lyDo: LyDoChuaSo };

function danhGiaMot(n: NganhChuan, diem: DiemDayDu): KetQuaMot {
  if (n.lyDo || n.diemChuan === null) return { lyDo: n.lyDo ?? "chuaCoDiemChuan" };
  const tl = tongChoLuaChon(n.lc, diem);
  if (tl.tong === null) return { lyDo: tl.khongTinhDuoc ? "toHopChuaTinh" : "thieuDiemMon" };
  return { bac: BAC_NHAN[nhanNguyenVong({ ...n.lc, diemMin: n.diemChuan }, tl.tong)] };
}

/** Bậc nhãn của từng ngành (cùng thứ tự danh sách): 0..3, hoặc -1 khi chưa so được. Dùng để so hai bộ điểm nhanh. */
function bacCuaTatCa(ch: NganhChuan[], diem: DiemDayDu): Int8Array {
  const ra = new Int8Array(ch.length);
  for (let i = 0; i < ch.length; i++) { const k = danhGiaMot(ch[i], diem); ra[i] = "bac" in k ? k.bac : -1; }
  return ra;
}

export interface DemTheoNhom { nhom: string; theoNhan: Record<NhanNguyenVong, number>; tong: number }
export interface DemNganhTheoNhan {
  /** Số ngành mỗi nhãn (chỉ ngành so được). */
  theoNhan: Record<NhanNguyenVong, number>;
  /** Số ngành so được (= tổng 4 nhãn). */
  soSoDuoc: number;
  /** Số ngành chưa so được, theo lý do. */
  chuaSo: Record<LyDoChuaSo, number>;
  tongChuaSo: number;
  /** Tổng số ngành trong danh mục. */
  tong: number;
  /** Đếm theo nhóm ngành, nhóm nhiều ngành so được đứng trước. */
  theoNhom: DemTheoNhom[];
}

const khongNhan = (): Record<NhanNguyenVong, number> => ({ "Thử sức": 0, "Vừa sức": 0, "An toàn": 0, "Dự phòng": 0 });
const khongLyDo = (): Record<LyDoChuaSo, number> => ({ diemSan: 0, phuongThucKhac: 0, chuaCoDiemChuan: 0, thieuDiemMon: 0, toHopChuaTinh: 0 });

/** Đếm ngành theo 4 nhãn với điểm hiện tại. Ngành chưa so được đếm riêng theo lý do, không bao giờ rơi vào một nhãn. */
export function demNganhTheoNhan(danhSach: readonly LuaChon[], diemDayDu: DiemDayDu, _tk: ThongKeBienDong | undefined, namDuBao: number): DemNganhTheoNhan {
  const ch = chuanBi(danhSach, namDuBao);
  const theoNhan = khongNhan(), chuaSo = khongLyDo();
  const nhom = new Map<string, DemTheoNhom>();
  for (const n of ch) {
    const k = danhGiaMot(n, diemDayDu);
    if ("lyDo" in k) { chuaSo[k.lyDo]++; continue; }
    const nhan = THU_TU_NHAN[k.bac];
    theoNhan[nhan]++;
    const g = nhom.get(n.lc.nhomNganh) ?? { nhom: n.lc.nhomNganh, theoNhan: khongNhan(), tong: 0 };
    g.theoNhan[nhan]++; g.tong++;
    nhom.set(n.lc.nhomNganh, g);
  }
  const soSoDuoc = THU_TU_NHAN.reduce((s, x) => s + theoNhan[x], 0);
  const tongChuaSo = CAC_LY_DO.reduce((s, x) => s + chuaSo[x], 0);
  const theoNhom = [...nhom.values()].sort((a, b) => b.tong - a.tong || a.nhom.localeCompare(b.nhom, "vi"));
  return { theoNhan, soSoDuoc, chuaSo, tongChuaSo, tong: ch.length, theoNhom };
}

/** Điểm với một môn cộng thêm `buoc` (kẹp trong 0..10). Môn chưa có điểm thì giữ nguyên null: không điền thay. */
export function congDiemMon(diem: DiemDayDu, mon: MonKhoi, buoc: number): DiemDayDu {
  const v = diem[mon];
  if (typeof v !== "number" || !Number.isFinite(v)) return diem;
  return { ...diem, [mon]: Math.min(DIEM_MON_TOI_DA, Math.max(0, Math.round((v + buoc) * 100) / 100)) };
}

export interface DoNhayMon {
  mon: MonKhoi;
  ten: string;
  /** Môn đã đạt 10 thì cộng thêm không đổi gì. */
  daToiDa: boolean;
  /** Số ngành đổi sang nhãn cao hơn khi cộng `buoc` điểm môn này. */
  doiNhan: number;
  /** Trong đó, số ngành từ Thử sức lên ít nhất Vừa sức (điểm của em chạm điểm chuẩn năm gần nhất). */
  moRa: number;
}

export interface KetQuaDoNhay { toHop: string | null; buoc: number; theoMon: DoNhayMon[]; monThieu: string[] }

/** Với mỗi môn của tổ hợp tốt nhất mà em đã có điểm: cộng `buoc` điểm thì bao nhiêu ngành đổi sang nhãn cao hơn. Môn thiếu điểm bị bỏ, nêu ở `monThieu`. */
export function doNhayTheoMon(danhSach: readonly LuaChon[], diemDayDu: DiemDayDu, _tk: ThongKeBienDong | undefined, namDuBao: number, buoc = 1): KetQuaDoNhay {
  const tot = tongChoLuaChon({ toHopXet: [] }, diemDayDu);
  if (tot.toHop === null) return { toHop: null, buoc, theoMon: [], monThieu: [] };
  const ch = chuanBi(danhSach, namDuBao);
  const goc = bacCuaTatCa(ch, diemDayDu);
  const cacMon = MON_CUA_TO_HOP[tot.toHop] ?? [];
  const theoMon: DoNhayMon[] = [], monThieu: string[] = [];
  for (const mon of cacMon) {
    const v = diemDayDu[mon];
    const ten = TEN_MON[mon as keyof typeof TEN_MON] ?? TEN_MON_THEM[mon as keyof typeof TEN_MON_THEM] ?? mon;
    if (typeof v !== "number" || !Number.isFinite(v)) { monThieu.push(ten); continue; } // môn thiếu điểm: bỏ, không điền
    const daToiDa = typeof v === "number" && v >= DIEM_MON_TOI_DA;
    const moi = bacCuaTatCa(ch, congDiemMon(diemDayDu, mon, buoc));
    let doiNhan = 0, moRa = 0;
    for (let i = 0; i < goc.length; i++) {
      if (goc[i] < 0 || moi[i] < 0 || moi[i] <= goc[i]) continue;
      doiNhan++;
      if (goc[i] === 0) moRa++;
    }
    theoMon.push({ mon, ten, daToiDa, doiNhan, moRa });
  }
  return { toHop: tot.toHop, buoc, theoMon, monThieu };
}

export interface NganhDoiNhan { id: string; truong: string; nganh: string; cu: NhanNguyenVong; moi: NhanNguyenVong; huong: "len" | "xuong" }
export interface SoSanhHaiDiem {
  /** Số ngành đổi sang nhãn cao hơn. */
  len: number;
  /** Số ngành đổi sang nhãn thấp hơn. */
  xuong: number;
  /** Đếm nhãn sau khi đổi điểm. */
  theoNhanMoi: Record<NhanNguyenVong, number>;
  /** Tối đa `soNoiBat` ngành đổi nhãn nhiều nhất, ngành gần ngưỡng đứng trước, trải đều các trường. */
  noiBat: NganhDoiNhan[];
}

/** So nhãn của từng ngành giữa điểm gốc và điểm đã chỉnh (Phòng thử điểm). Chỉ ngành so được ở cả hai bên. */
export function soSanhHaiDiem(danhSach: readonly LuaChon[], diemGoc: DiemDayDu, diemMoi: DiemDayDu, namDuBao: number, soNoiBat = 5): SoSanhHaiDiem {
  const ch = chuanBi(danhSach, namDuBao);
  const a = bacCuaTatCa(ch, diemGoc), b = bacCuaTatCa(ch, diemMoi);
  let len = 0, xuong = 0;
  const theoNhanMoi = khongNhan();
  const doi: { nd: NganhDoiNhan; muc: number; gan: number }[] = [];
  for (let i = 0; i < ch.length; i++) {
    if (b[i] >= 0) theoNhanMoi[THU_TU_NHAN[b[i]]]++;
    if (a[i] < 0 || b[i] < 0 || a[i] === b[i]) continue;
    const huong = b[i] > a[i] ? "len" : "xuong";
    if (huong === "len") len++; else xuong++;
    const n = ch[i];
    doi.push({
      nd: { id: n.lc.id, truong: n.lc.truong, nganh: n.lc.nganh, cu: THU_TU_NHAN[a[i]], moi: THU_TU_NHAN[b[i]], huong },
      muc: Math.abs(b[i] - a[i]), gan: Math.min(a[i], b[i]),
    });
  }
  // Nổi bật: đổi nhiều bậc trước, rồi ngành quanh ngưỡng Thử sức/Vừa sức (đổi ở đó có ý nghĩa nhất), rồi theo id cho ổn định.
  doi.sort((x, y) => y.muc - x.muc || x.gan - y.gan || (x.nd.id < y.nd.id ? -1 : 1));
  // Mỗi trường nhiều nhất một ngành ở lượt đầu để danh sách không bị một trường chiếm hết; thiếu thì bù theo thứ tự cũ.
  const chon: NganhDoiNhan[] = [], daChon = new Set<string>(), truong = new Set<string>();
  for (const x of doi) if (chon.length < soNoiBat && !truong.has(x.nd.truong)) { chon.push(x.nd); daChon.add(x.nd.id); truong.add(x.nd.truong); }
  for (const x of doi) if (chon.length < soNoiBat && !daChon.has(x.nd.id)) { chon.push(x.nd); daChon.add(x.nd.id); }
  return { len, xuong, theoNhanMoi, noiBat: chon };
}

/** Số ngành đang xét và tổ hợp tốt nhất, cho thanh kéo ở Phòng thử điểm: các môn của tổ hợp tốt nhất mà em đã có điểm. */
export function monCuaToHopTotNhat(diemDayDu: DiemDayDu): { toHop: string; mon: { mon: MonKhoi; ten: string; diem: number }[]; monThieu: string[] } | null {
  const tot = tongChoLuaChon({ toHopXet: [] }, diemDayDu);
  if (tot.toHop === null) return null;
  const mon: { mon: MonKhoi; ten: string; diem: number }[] = [];
  const monThieu: string[] = [];
  for (const m of MON_CUA_TO_HOP[tot.toHop] ?? []) {
    const ten = TEN_MON[m as keyof typeof TEN_MON] ?? TEN_MON_THEM[m as keyof typeof TEN_MON_THEM] ?? m;
    const v = diemDayDu[m];
    if (typeof v === "number" && Number.isFinite(v)) mon.push({ mon: m, ten, diem: v }); else monThieu.push(ten);
  }
  return { toHop: tot.toHop, mon, monThieu };
}

/**
 * Chia lô để không chặn luồng giao diện: gọi `tinh` rồi nhường luồng, trả kết quả khi xong.
 * Phép đếm cả danh mục chỉ vài chục mili giây; `nhuongLuong` chỉ để màn kịp vẽ trạng thái "đang tính" trước.
 */
export function tinhKhiRanh<T>(tinh: () => T): { huy: () => void; xong: Promise<T> } {
  let huy = () => {};
  const xong = new Promise<T>((giai, tu) => {
    const chay = () => { try { giai(tinh()); } catch (e) { tu(e); } };
    if (typeof requestIdleCallback === "function") { const id = requestIdleCallback(chay, { timeout: 200 }); huy = () => cancelIdleCallback(id); }
    else { const id = setTimeout(chay, 0); huy = () => clearTimeout(id); }
  });
  return { huy, xong };
}
