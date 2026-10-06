// Trạng thái toàn ứng dụng, lưu trên máy (localStorage). Chưa có máy chủ: hồ sơ không rời khỏi điện thoại.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bayNgayCuaTuan, isoNgay, xepLichTuan } from "@/engine/xep-lich";
import { HO_SO_TRONG, TRANG_THAI_BAN_DAU, taoHoSoMau } from "./mau";
import type {
  CauHinhTuHoc, DiemThi, HoSo, KhoiHoc, MucTieuChinh, NhacNho, TamTrang, TietCoDinh, TinhHuongDaLuu, TrangThaiViec, ViecCanHoc, LichSuHoanThanh,
} from "./types";

export interface AppState {
  hoSo: HoSo;
  mucTieu: MucTieuChinh | null;
  nguyenVong: string[]; // id lựa chọn, theo thứ tự ưu tiên
  yeuThich: string[];
  soSanh: string[]; // tối đa 2
  diemThi: DiemThi[];
  tinhHuong: TinhHuongDaLuu[]; // các tình huống "nếu tăng điểm" đã lưu
  coDinh: TietCoDinh[];
  viec: ViecCanHoc[];
  trangThaiViec: Record<string, TrangThaiViec>;
  khoiHoc: KhoiHoc[]; // các khối tự học đã xếp (tự động hoặc em tự chọn)
  cauHinh: CauHinhTuHoc;
  tamTrang: TamTrang;
  nhacNho: NhacNho;
  lichSu: LichSuHoanThanh[];
  cauNoiHomNay: number;
}

const KHOA = "nvai:v2";

/** Xóa mọi dữ liệu phụ của các màn (tình huống đang thử, bộ lọc, nhắc đã gửi...) để "làm lại" thật sự là làm lại. */
function xoaDuLieuPhu() {
  for (const kho of [() => localStorage, () => sessionStorage]) {
    try {
      const k = kho();
      for (const ten of Object.keys(k)) if (ten.startsWith("nvai:") && ten !== KHOA) k.removeItem(ten);
    } catch { /* trình duyệt chặn lưu: bỏ qua */ }
  }
  window.dispatchEvent(new Event("nvai-lam-lai")); // các màn đang giữ dữ liệu trong bộ nhớ tự đặt lại
}

function doc(): AppState {
  try {
    const t = localStorage.getItem(KHOA);
    if (t) {
      const luu = JSON.parse(t) as Partial<AppState>;
      return { ...TRANG_THAI_BAN_DAU, ...luu, hoSo: { ...TRANG_THAI_BAN_DAU.hoSo, ...luu.hoSo } };
    }
  } catch { /* trình duyệt chặn lưu: dùng bộ nhớ tạm */ }
  return TRANG_THAI_BAN_DAU;
}

interface Ctx {
  s: AppState;
  capNhatHoSo: (p: Partial<HoSo>) => void;
  datMucTieu: (m: MucTieuChinh | null) => void;
  themNguyenVong: (id: string) => void;
  xoaNguyenVong: (id: string) => void;
  doiViTri: (tu: number, den: number) => void;
  doiYeuThich: (id: string) => void;
  doiSoSanh: (id: string) => void;
  datSoSanh: (ids: string[]) => void;
  datNguyenVong: (ids: string[]) => void;
  themDiemThi: (d: DiemThi) => void;
  luuTinhHuong: (t: Omit<TinhHuongDaLuu, "id" | "luc">) => void;
  xoaTinhHuong: (id: string) => void;
  dungHoSoMau: () => void;
  lamLai: () => void;
  /** Thay toàn bộ dữ liệu bằng bản đã khôi phục từ tệp sao lưu. */
  khoiPhuc: (s: AppState) => void;
  datTrangThaiViec: (v: ViecCanHoc, tt: TrangThaiViec) => void;
  ghimKhoi: (k: Omit<KhoiHoc, "id" | "khoa">) => void;
  themKhoi: (k: Omit<KhoiHoc, "id">) => void;
  xoaKhoi: (id: string) => void;
  themTiet: (t: Omit<TietCoDinh, "id">) => void;
  xoaTiet: (id: string) => void;
  datCoDinh: (t: TietCoDinh[]) => void;
  datViec: (v: ViecCanHoc[]) => void;
  capNhatCauHinh: (p: Partial<CauHinhTuHoc>) => void;
  datTamTrang: (t: TamTrang) => void;
  capNhatNhacNho: (p: Partial<NhacNho>) => void;
  /** Xếp lại lịch tự học của một tuần. `viecMoi`: thay luôn danh sách việc (dùng khi tạo việc mới cho tuần) trong cùng một lần cập nhật. */
  xepLai: (tuanBatDau: string, tuNgay?: string, viecMoi?: ViecCanHoc[]) => { chuaXep: number; ghiChu: string[] };
  doiCauNoi: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
let dem = 0;
const idMoi = (t: string) => `${t}-${Date.now().toString(36)}-${dem++}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(doc);
  useEffect(() => {
    try { localStorage.setItem(KHOA, JSON.stringify(s)); } catch { /* bỏ qua */ }
  }, [s]);
  const cap = useCallback((f: (x: AppState) => AppState) => setS(f), []);

  const api = useMemo<Ctx>(() => ({
    s,
    capNhatHoSo: (p) => cap((x) => ({ ...x, hoSo: { ...x.hoSo, ...p } })),
    datMucTieu: (m) => cap((x) => ({ ...x, mucTieu: m })),
    themNguyenVong: (id) => cap((x) => (x.nguyenVong.includes(id) ? x : { ...x, nguyenVong: [...x.nguyenVong, id] })),
    xoaNguyenVong: (id) => cap((x) => ({ ...x, nguyenVong: x.nguyenVong.filter((i) => i !== id) })),
    doiViTri: (tu, den) => cap((x) => {
      if (den < 0 || den >= x.nguyenVong.length) return x;
      const a = [...x.nguyenVong]; const [m] = a.splice(tu, 1); a.splice(den, 0, m);
      return { ...x, nguyenVong: a };
    }),
    doiYeuThich: (id) => cap((x) => ({ ...x, yeuThich: x.yeuThich.includes(id) ? x.yeuThich.filter((i) => i !== id) : [...x.yeuThich, id] })),
    doiSoSanh: (id) => cap((x) => ({ ...x, soSanh: x.soSanh.includes(id) ? x.soSanh.filter((i) => i !== id) : [...x.soSanh, id].slice(-2) })),
    datSoSanh: (ids) => cap((x) => ({ ...x, soSanh: ids.slice(0, 2) })),
    datNguyenVong: (ids) => cap((x) => {
      const duy = Array.from(new Set(ids));
      return { ...x, nguyenVong: duy };
    }),
    themDiemThi: (d) => cap((x) => ({ ...x, diemThi: [...x.diemThi, d] })),
    luuTinhHuong: (th) => cap((x) => ({ ...x, tinhHuong: [...x.tinhHuong, { ...th, id: idMoi("th"), luc: new Date().toISOString() }].slice(-6) })),
    xoaTinhHuong: (id) => cap((x) => ({ ...x, tinhHuong: x.tinhHuong.filter((t) => t.id !== id) })),
    dungHoSoMau: () => { xoaDuLieuPhu(); setS(taoHoSoMau()); },
    lamLai: () => { xoaDuLieuPhu(); setS({ ...TRANG_THAI_BAN_DAU, hoSo: HO_SO_TRONG }); },
    khoiPhuc: (n) => { xoaDuLieuPhu(); setS(n); },
    datTrangThaiViec: (v, tt) => cap((x) => ({
      ...x,
      trangThaiViec: { ...x.trangThaiViec, [v.id]: tt },
      lichSu: [{ viecId: v.id, ten: v.tieuDe, luc: new Date().toISOString(), trangThai: tt }, ...x.lichSu].slice(0, 100),
    })),
    ghimKhoi: (k) => cap((x) => ({
      ...x,
      khoiHoc: [...x.khoiHoc.filter((b) => !(k.viecId && b.viecId === k.viecId)), { ...k, id: idMoi("ghim"), khoa: true }],
    })),
    themKhoi: (k) => cap((x) => ({ ...x, khoiHoc: [...x.khoiHoc, { ...k, id: idMoi("tay") }] })),
    xoaKhoi: (id) => cap((x) => ({ ...x, khoiHoc: x.khoiHoc.filter((b) => b.id !== id) })),
    themTiet: (t) => cap((x) => ({ ...x, coDinh: [...x.coDinh, { ...t, id: idMoi("tiet") }] })),
    xoaTiet: (id) => cap((x) => ({ ...x, coDinh: x.coDinh.filter((t) => t.id !== id) })),
    datCoDinh: (t) => cap((x) => ({ ...x, coDinh: t })),
    datViec: (v) => cap((x) => ({ ...x, viec: v })),
    capNhatCauHinh: (p) => cap((x) => ({ ...x, cauHinh: { ...x.cauHinh, ...p } })),
    datTamTrang: (t) => cap((x) => ({ ...x, tamTrang: t })),
    capNhatNhacNho: (p) => cap((x) => ({ ...x, nhacNho: { ...x.nhacNho, ...p } })),
    doiCauNoi: () => cap((x) => ({ ...x, cauNoiHomNay: x.cauNoiHomNay + 1 })),
    xepLai: (tuanBatDau, tuNgay, viecMoi) => {
      const x = viecMoi ? { ...s, viec: viecMoi } : s;
      const ngays = bayNgayCuaTuan(tuanBatDau);
      const xong = (k: KhoiHoc) => k.viecId && x.trangThaiViec[k.viecId] === "xong";
      const giu = x.khoiHoc.filter((k) => !ngays.includes(k.ngay) || k.khoa || !k.id.startsWith("auto-") || xong(k) || (tuNgay && k.ngay < tuNgay));
      const viecCan = x.viec.filter((v) => {
        if (v.tuan && v.tuan !== tuanBatDau) return false; // việc của tuần khác không xếp vào tuần này
        const tt = x.trangThaiViec[v.id];
        if (tt === "xong" || tt === "boQua") return false;
        return !giu.some((k) => k.viecId === v.id && k.khoa);
      });
      const bayGio = new Date();
      const tuPhut = tuNgay && tuNgay === isoNgay(bayGio) ? bayGio.getHours() * 60 + bayGio.getMinutes() : undefined;
      const r = xepLichTuan({ tuanBatDau, tuNgay, tuPhut, coDinh: x.coDinh, viec: viecCan, cfg: x.cauHinh, tamTrang: x.tamTrang, khoiDaCo: giu });
      setS({ ...x, khoiHoc: [...giu, ...r.khoi] });
      return { chuaXep: r.chuaXep.length, ghiChu: r.ghiChu };
    },
  }), [s, cap]);

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp phải nằm trong AppProvider");
  return c;
}

export { diemHienTaiCuaTungMon } from "./diem-hien-tai";
