// Trạng thái toàn ứng dụng, lưu trên máy (localStorage). Chưa có máy chủ: hồ sơ không rời khỏi điện thoại.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HO_SO_TRONG, TRANG_THAI_BAN_DAU, taoHoSoMau } from "./mau";
import { chuanHoa } from "./chuan-hoa";
import { xepLaiTuan } from "./xep-lai";
import { isoNgay } from "@/engine/xep-lich";
import type {
  CauHinhTuHoc, DiemThi, HoSo, KhoiHoc, MucTieuChinh, NhacNho, TamTrang, TietCoDinh, TinhHuongDaLuu, TrangThaiViec, ViecCanHoc, LichSuHoanThanh, LoiNhan,
} from "./types";

export interface AppState {
  phienBan: number; // phiên bản cấu trúc dữ liệu, xem chuan-hoa.ts
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
  tamTrangNgay?: string; // ngày đặt tamTrang ("Hơi mệt"), để reset ngày hôm sau
  nhacNho: NhacNho;
  lichSu: LichSuHoanThanh[];
  cauNoiHomNay: number;
  loiNhan: LoiNhan[]; // lời nhắn từ người đồng hành, em chủ động lưu
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
      const n = chuanHoa(JSON.parse(t));
      // Tâm trạng chỉ có hiệu lực trong ngày đặt: sang ngày mới trở về bình thường ở mọi màn.
      return n.tamTrang !== "binhThuong" && n.tamTrangNgay !== isoNgay(new Date()) ? { ...n, tamTrang: "binhThuong", tamTrangNgay: undefined } : n;
    }
  } catch { /* trình duyệt chặn lưu hoặc dữ liệu hỏng: dùng bộ nhớ tạm */ }
  return TRANG_THAI_BAN_DAU;
}

/** Chuỗi thô đang lưu trên máy (kể cả khi hỏng không đọc được), để cho em tải về trước khi đặt lại. */
export function docThoDaLuu(): string | null {
  try { return localStorage.getItem(KHOA); } catch { return null; }
}

/** Xóa mọi khóa nvai:* (đặt lại hoàn toàn). Dùng khi dữ liệu hỏng đến mức app không chạy được. */
export function xoaTatCaDuLieu() {
  for (const kho of [() => localStorage, () => sessionStorage]) {
    try { const k = kho(); for (const ten of Object.keys(k)) if (ten.startsWith("nvai:")) k.removeItem(ten); } catch { /* bỏ qua */ }
  }
}

interface Ctx {
  s: AppState;
  /** false khi trình duyệt không cho ghi dữ liệu (đầy bộ nhớ, chế độ riêng tư): dữ liệu chỉ còn trong phiên này. */
  luuDuoc: boolean;
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
  themLoiNhan: (l: LoiNhan) => void;
  xoaLoiNhan: (id: string) => void;
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
  /** Xóa một lần thi thử theo vị trí trong `diemThi`. */
  xoaDiemThi: (viTri: number) => void;
}

const AppCtx = createContext<Ctx | null>(null);
let dem = 0;
const idMoi = (t: string) => `${t}-${Date.now().toString(36)}-${dem++}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<AppState>(doc);
  const [luuDuoc, setLuuDuoc] = useState(true);
  // sRef luôn là trạng thái mới nhất, kể cả khi hai lệnh gọi liên tiếp trong cùng một lượt: lệnh sau xây trên kết quả của lệnh trước.
  const sRef = useRef(s);
  const dat = useCallback((n: AppState) => { sRef.current = n; setS(n); }, []);
  const cap = useCallback((f: (x: AppState) => AppState) => dat(f(sRef.current)), [dat]);
  useEffect(() => {
    try {
      const j = JSON.stringify(s);
      if (localStorage.getItem(KHOA) !== j) localStorage.setItem(KHOA, j);
      setLuuDuoc(true);
    } catch { setLuuDuoc(false); }
  }, [s]);
  useEffect(() => {
    const khiLuuLoi = () => setLuuDuoc(false); // các màn dùng useLuuCucBo báo ghi thất bại
    // Tab khác đổi dữ liệu thì nhận về, để hai tab không ghi đè nhau bằng bản cũ.
    const khiTabKhacDoi = (e: StorageEvent) => {
      if (e.key !== KHOA || !e.newValue) return;
      try {
        const n = chuanHoa(JSON.parse(e.newValue));
        if (JSON.stringify(n) !== JSON.stringify(sRef.current)) dat(n);
      } catch { /* dữ liệu từ tab khác không đọc được: giữ bản hiện tại */ }
    };
    window.addEventListener("nvai-luu-loi", khiLuuLoi);
    window.addEventListener("storage", khiTabKhacDoi);
    return () => { window.removeEventListener("nvai-luu-loi", khiLuuLoi); window.removeEventListener("storage", khiTabKhacDoi); };
  }, [dat]);

  const api = useMemo<Ctx>(() => ({
    s, luuDuoc,
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
    dungHoSoMau: () => { xoaDuLieuPhu(); dat(taoHoSoMau()); },
    lamLai: () => { xoaDuLieuPhu(); dat({ ...TRANG_THAI_BAN_DAU, hoSo: HO_SO_TRONG }); },
    themLoiNhan: (l) => cap((x) => (x.loiNhan.some((k) => k.id === l.id) ? x : { ...x, loiNhan: [l, ...x.loiNhan].slice(0, 30) })),
    xoaLoiNhan: (id) => cap((x) => ({ ...x, loiNhan: x.loiNhan.filter((k) => k.id !== id) })),
    khoiPhuc: (n) => { xoaDuLieuPhu(); dat(chuanHoa(n)); },
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
    datTamTrang: (t) => cap((x) => ({
      ...x,
      tamTrang: t,
      tamTrangNgay: t === "binhThuong" ? undefined : isoNgay(new Date()),
    })),
    capNhatNhacNho: (p) => cap((x) => ({ ...x, nhacNho: { ...x.nhacNho, ...p } })),
    doiCauNoi: () => cap((x) => ({ ...x, cauNoiHomNay: x.cauNoiHomNay + 1 })),
    xepLai: (tuanBatDau, tuNgay, viecMoi) => {
      const r = xepLaiTuan(sRef.current, tuanBatDau, tuNgay, viecMoi);
      dat(r.s);
      return { chuaXep: r.chuaXep, ghiChu: r.ghiChu };
    },
    xoaDiemThi: (viTri) => cap((x) => (viTri < 0 || viTri >= x.diemThi.length ? x : { ...x, diemThi: x.diemThi.filter((_, i) => i !== viTri) })),
  }), [s, luuDuoc, cap, dat]);

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp phải nằm trong AppProvider");
  return c;
}

export { diemHienTaiCuaTungMon } from "./diem-hien-tai";
