// Chuẩn hóa dữ liệu đọc từ localStorage hoặc tệp sao lưu thành một AppState hợp lệ. Thuần TypeScript, không React.
// Nguyên tắc: không bao giờ throw; trường thiếu thì lấy mặc định, sai kiểu hoặc NaN thì bỏ, không tin bất cứ gì từ bên ngoài.
import { CAU_HINH_MAC_DINH } from "@/engine/xep-lich";
import { HO_SO_TRONG, TRANG_THAI_BAN_DAU } from "./mau";
import type { AppState } from "./store";
import {
  CAC_MON, CAC_MON_THEM, TO_HOP,
  type CauHinhTuHoc, type DiemThi, type HoSo, type KhoiHoc, type LichSuHoanThanh, type LoaiSoThich, type LoiNhan, type MaToHop, type MonId,
  type MucTieuChinh, type NhacNho, type TietCoDinh, type TinhHuongDaLuu, type TrangThaiViec, type ViecCanHoc,
} from "./types";

export const PHIEN_BAN_DU_LIEU = 2;

const KHOA_NGUY_HIEM = new Set(["__proto__", "constructor", "prototype"]);
type Obj = Record<string, unknown>;
const laObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const chu = (v: unknown, md = ""): string => (typeof v === "string" ? v : md);
const so = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const mangChu = (v: unknown): string[] => mang(v).filter((x): x is string => typeof x === "string");
const trong = <T extends string>(v: unknown, ds: readonly T[]): T | null => (ds.includes(v as T) ? (v as T) : null);
/** Sao chép đối tượng bỏ các khóa có thể gây prototype pollution. */
const sao = (o: Obj): Obj => { const r: Obj = {}; for (const k of Object.keys(o)) if (!KHOA_NGUY_HIEM.has(k)) r[k] = o[k]; return r; };
const laGio = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const diem10 = (v: unknown): number | null => { const n = so(v); return n !== null && n >= 0 && n <= 10 ? n : null; };

/** yyyy-mm-dd có thật trên lịch. */
export function laNgayIso(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
const laThoiDiem = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

const NHOM_SO_THICH: LoaiSoThich[] = ["R", "I", "A", "S", "E", "C"];
const GIA_TRI_HOP_LE = ["thuNhap", "onDinh", "sangTao", "giupNguoi", "tuChu", "diChuyen"]; // khớp CAC_GIA_TRI ở features/huong-nghiep/cau-hoi.ts

function chuanHoaHoSo(raw: unknown): HoSo {
  const b = HO_SO_TRONG;
  const o: Obj = laObj(raw) ? raw : {};
  const diem = { ...b.diem };
  const dRaw = laObj(o.diem) ? o.diem : {};
  for (const m of CAC_MON) diem[m] = diem10(dRaw[m]);
  const h: HoSo = {
    hoTen: chu(o.hoTen).slice(0, 200),
    khoi: o.khoi === 11 || o.khoi === 12 ? o.khoi : null,
    tinh: chu(o.tinh), giaiDoan: chu(o.giaiDoan),
    nganhQuanTam: mangChu(o.nganhQuanTam),
    // Dữ liệu cũ còn nguonDiem, mucTieuHienTai, truongMoUoc, cachHoc, conDuong, ghiChuChiPhi (đã bỏ ô nhập): không chép sang, tự rơi khi đọc.
    diem,
    diemManh: mangChu(o.diemManh), canCaiThien: mangChu(o.canCaiThien),
    nganSach: trong(o.nganSach, ["duoi30", "30-60", "60-100", "tren100"] as const),
    choO: trong(o.choO, ["oNha", "oTro", "kyTucXa"] as const),
    khuVuc: mangChu(o.khuVuc),
    hocXaNha: typeof o.hocXaNha === "boolean" ? o.hocXaNha : null,
    quanTamViecLam: trong(o.quanTamViecLam, ["rat", "binhThuong", "chuaRo"] as const),
    hoanTat: o.hoanTat === true,
  };
  if (laObj(o.diemThem)) {
    const them: NonNullable<HoSo["diemThem"]> = {};
    for (const m of CAC_MON_THEM) if (m in o.diemThem) them[m] = diem10(o.diemThem[m]);
    h.diemThem = them;
  }
  // Điểm thi thật và điểm mục tiêu từng môn: hai trường mới, bản cũ không có thì để trống (không tự điền). Chỉ nhận số 0 đến 10.
  for (const k of ["diemThiThat", "diemMucTieuMon"] as const) {
    const raw = o[k];
    if (!laObj(raw)) continue;
    const r: Partial<Record<MonId, number | null>> = {};
    for (const m of CAC_MON) if (m in raw) r[m] = diem10(raw[m]);
    h[k] = r;
  }
  // Điểm ưu tiên khu vực/đối tượng em khai: giữ khi tải lại, chỉ nhận giá trị trong danh sách quy định.
  if (laObj(o.uuTienTuyenSinh)) {
    h.uuTienTuyenSinh = {
      khuVuc: trong(o.uuTienTuyenSinh.khuVuc, ["KV1", "KV2-NT", "KV2", "KV3"] as const),
      doiTuong: trong(o.uuTienTuyenSinh.doiTuong, ["khong", "UT1", "UT2"] as const),
    };
  }
  if (o.laMau === true) h.laMau = true;
  if (laObj(o.chungChiNgoaiNgu)) {
    const loai = trong(o.chungChiNgoaiNgu.loai, ["IELTS", "TOEFL", "TOEIC", "VSTEP", "HSK", "JLPT", "khac"] as const);
    const diem = so(o.chungChiNgoaiNgu.diem);
    if (loai && diem !== null && diem >= 0) {
      h.chungChiNgoaiNgu = { loai, diem };
      if (typeof o.chungChiNgoaiNgu.ngayCap === "string") h.chungChiNgoaiNgu.ngayCap = o.chungChiNgoaiNgu.ngayCap;
    }
  }
  if (laObj(o.diemDgnl)) {
    const dgnl: NonNullable<HoSo["diemDgnl"]> = {};
    if ("hcm" in o.diemDgnl) dgnl.hcm = so(o.diemDgnl.hcm);
    if ("hn" in o.diemDgnl) dgnl.hn = so(o.diemDgnl.hn);
    if ("tsa" in o.diemDgnl) dgnl.tsa = so(o.diemDgnl.tsa);
    if ("khac" in o.diemDgnl) dgnl.khac = so(o.diemDgnl.khac);
    h.diemDgnl = dgnl;
  }
  if (laObj(o.hocBa)) {
    const hb: NonNullable<HoSo["hocBa"]> = {};
    if ("dtbLop10" in o.hocBa) hb.dtbLop10 = diem10(o.hocBa.dtbLop10);
    if ("dtbLop11" in o.hocBa) hb.dtbLop11 = diem10(o.hocBa.dtbLop11);
    if ("dtbLop12" in o.hocBa) hb.dtbLop12 = diem10(o.hocBa.dtbLop12);
    if ("dtb3Nam" in o.hocBa) hb.dtb3Nam = diem10(o.hocBa.dtb3Nam);
    if ("hocLuc" in o.hocBa) hb.hocLuc = trong(o.hocBa.hocLuc, ["xuatSac", "gioi", "kha", "trungBinh"] as const);
    if ("hanhKiem" in o.hocBa) hb.hanhKiem = trong(o.hocBa.hanhKiem, ["tot", "kha", "trungBinh"] as const);
    if ("truongChuyen" in o.hocBa) hb.truongChuyen = typeof o.hocBa.truongChuyen === "boolean" ? o.hocBa.truongChuyen : null;
    h.hocBa = hb;
  }
  if (laObj(o.giaiThuongHsg)) {
    h.giaiThuongHsg = {
      cap: trong(o.giaiThuongHsg.cap, ["quocGia", "tinh", "truongChuyen"] as const),
      mon: typeof o.giaiThuongHsg.mon === "string" ? o.giaiThuongHsg.mon : undefined,
      giai: trong(o.giaiThuongHsg.giai, ["nhat", "nhi", "ba", "khuyenKhich"] as const),
    };
  }
  if (laObj(o.tienDoKienThuc)) {
    const td: Record<string, "chuaHoc" | "dangHoc" | "namVung" | "canOnTap"> = {};
    for (const [k, v] of Object.entries(o.tienDoKienThuc)) {
      if (!KHOA_NGUY_HIEM.has(k) && ["chuaHoc", "dangHoc", "namVung", "canOnTap"].includes(v as string)) {
        td[k] = v as "chuaHoc" | "dangHoc" | "namVung" | "canOnTap";
      }
    }
    h.tienDoKienThuc = td;
  }
  const st = o.soThich;
  if (laObj(st) && laObj(st.diem) && NHOM_SO_THICH.every((k) => so((st.diem as Obj)[k]) !== null) && Array.isArray(st.top)) {
    const d = {} as Record<LoaiSoThich, number>;
    for (const k of NHOM_SO_THICH) d[k] = (st.diem as Obj)[k] as number;
    h.soThich = { diem: d, top: st.top.filter((x): x is LoaiSoThich => NHOM_SO_THICH.includes(x as LoaiSoThich)), luc: chu(st.luc) };
    const gt = mangChu(st.giaTri).filter((g) => GIA_TRI_HOP_LE.includes(g)).slice(0, 2);
    if (gt.length) h.soThich.giaTri = gt;
  }
  return h;
}

function chuanHoaMucTieu(raw: unknown): MucTieuChinh | null {
  if (!laObj(raw)) return null;
  const maToHop = trong(raw.maToHop, Object.keys(TO_HOP) as MaToHop[]);
  const phuongThuc = trong(raw.phuongThuc, ["THPT", "DGNL", "hocBa"] as const);
  const diemMucTieu = so(raw.diemMucTieu);
  if (!maToHop || !phuongThuc || diemMucTieu === null || diemMucTieu < 0 || diemMucTieu > 30 || typeof raw.luaChonId !== "string" || !raw.luaChonId || !laNgayIso(raw.ngayThi)) return null;
  const toHop = Array.from(new Set(mang(raw.toHop).filter((m): m is MonId => CAC_MON.includes(m as MonId))));
  return { luaChonId: raw.luaChonId, phuongThuc, maToHop, toHop: toHop.length === 3 ? toHop : TO_HOP[maToHop], diemMucTieu, ngayThi: raw.ngayThi };
}

function chuanHoaCauHinh(raw: unknown): CauHinhTuHoc {
  const b = CAU_HINH_MAC_DINH;
  const o: Obj = laObj(raw) ? raw : {};
  const toiDa = so(o.gioHocToiDaMoiNgay), nghi = so(o.nghiGiuaBuoi);
  return {
    gioBatDau: laGio(o.gioBatDau) ? o.gioBatDau : b.gioBatDau,
    gioKetThuc: laGio(o.gioKetThuc) ? o.gioKetThuc : b.gioKetThuc,
    gioHocToiDaMoiNgay: toiDa !== null && toiDa > 0 && toiDa <= 16 ? toiDa : b.gioHocToiDaMoiNgay,
    thoiDiemTot: trong(o.thoiDiemTot, ["sang", "chieu", "toi"] as const) ?? b.thoiDiemTot,
    ngayNghi: mang(o.ngayNghi).filter((n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 7),
    nghiGiuaBuoi: nghi !== null && nghi >= 0 && nghi <= 120 ? nghi : b.nghiGiuaBuoi,
  };
}

function chuanHoaNhacNho(raw: unknown): NhacNho {
  const b = TRANG_THAI_BAN_DAU.nhacNho;
  const o: Obj = laObj(raw) ? raw : {};
  const truoc = so(o.truocPhut);
  return {
    bat: o.bat === true,
    truocPhut: truoc !== null && truoc >= 0 && truoc <= 1440 ? truoc : b.truocPhut,
    nhacChuanBiBai: typeof o.nhacChuanBiBai === "boolean" ? o.nhacChuanBiBai : b.nhacChuanBiBai,
    gioChuanBiBai: laGio(o.gioChuanBiBai) ? o.gioChuanBiBai : b.gioChuanBiBai,
  };
}

const TRANG_THAI_VIEC: readonly TrangThaiViec[] = ["chua", "xong", "doi", "boQua"];
const LOAI_LICH: readonly unknown[] = ["chinhKhoa", "hocThem", "khac", "tuHoc", "nghi"];

function danhSach<T>(raw: unknown, f: (o: Obj) => T | null): T[] {
  const r: T[] = [];
  for (const x of mang(raw)) if (laObj(x)) { const k = f(sao(x)); if (k) r.push(k); }
  return r;
}

/** Nhận bất cứ thứ gì (null, thiếu trường, sai kiểu) và luôn trả về AppState hợp lệ. */
export function chuanHoa(raw: unknown): AppState {
  const o: Obj = laObj(raw) ? raw : {};
  const trangThaiViec: Record<string, TrangThaiViec> = {};
  if (laObj(o.trangThaiViec)) for (const k of Object.keys(o.trangThaiViec)) {
    const v = trong(o.trangThaiViec[k], TRANG_THAI_VIEC);
    if (v && !KHOA_NGUY_HIEM.has(k)) trangThaiViec[k] = v;
  }
  const cauNoi = so(o.cauNoiHomNay);
  return {
    phienBan: PHIEN_BAN_DU_LIEU,
    hoSo: chuanHoaHoSo(o.hoSo),
    mucTieu: chuanHoaMucTieu(o.mucTieu),
    nguyenVong: Array.from(new Set(mangChu(o.nguyenVong))),
    yeuThich: Array.from(new Set(mangChu(o.yeuThich))),
    soSanh: Array.from(new Set(mangChu(o.soSanh))).slice(0, 2),
    diemThi: danhSach<DiemThi>(o.diemThi, (d) => {
      const diem = diem10(d.diem);
      return CAC_MON.includes(d.mon as MonId) && diem !== null && typeof d.ngay === "string" ? { mon: d.mon as MonId, diem, ngay: d.ngay } : null;
    }),
    tinhHuong: danhSach<TinhHuongDaLuu>(o.tinhHuong, (t) => {
      const tong = so(t.tongDiem), ns = so(t.nganSachTrieu), uu = trong(t.uuTien, ["viecLam", "hocPhi", "gan"] as const);
      if (typeof t.id !== "string" || tong === null || ns === null || !uu) return null;
      const congMon: Partial<Record<MonId, number>> = {};
      if (laObj(t.congMon)) for (const m of CAC_MON) { const n = so(t.congMon[m]); if (n !== null) congMon[m] = n; }
      return { id: t.id, ten: chu(t.ten), tongDiem: tong, congMon, nganSachTrieu: ns, khuVuc: chu(t.khuVuc), uuTien: uu, luc: chu(t.luc) };
    }),
    coDinh: danhSach<TietCoDinh>(o.coDinh, (t) =>
      typeof t.id === "string" && typeof t.ten === "string" && so(t.thu) !== null && laGio(t.batDau) && laGio(t.ketThuc) && LOAI_LICH.includes(t.loai)
        ? (t as unknown as TietCoDinh) : null),
    viec: danhSach<ViecCanHoc>(o.viec, (v) =>
      typeof v.id === "string" && typeof v.tieuDe === "string" && CAC_MON.includes(v.mon as MonId) && so(v.phut) !== null
        ? ({ ...v, chiTiet: chu(v.chiTiet), lyDo: chu(v.lyDo), mucUuTien: trong(v.mucUuTien, ["cao", "vua", "thap"] as const) ?? "vua", tieuChi: mangChu(v.tieuChi), taiLieu: mang(v.taiLieu).filter(laObj) } as unknown as ViecCanHoc) : null),
    trangThaiViec,
    khoiHoc: danhSach<KhoiHoc>(o.khoiHoc, (k) =>
      typeof k.id === "string" && typeof k.ten === "string" && laNgayIso(k.ngay) && laGio(k.batDau) && laGio(k.ketThuc) && LOAI_LICH.includes(k.loai)
        ? ({ ...k, viecId: typeof k.viecId === "string" ? k.viecId : null } as unknown as KhoiHoc) : null),
    cauHinh: chuanHoaCauHinh(o.cauHinh),
    tamTrang: trong(o.tamTrang, ["tot", "binhThuong", "met"] as const) ?? TRANG_THAI_BAN_DAU.tamTrang,
    tamTrangNgay: laNgayIso(o.tamTrangNgay) ? o.tamTrangNgay : undefined,
    nhacNho: chuanHoaNhacNho(o.nhacNho),
    lichSu: danhSach<LichSuHoanThanh>(o.lichSu, (l) => {
      const tt = trong(l.trangThai, TRANG_THAI_VIEC);
      return typeof l.viecId === "string" && laThoiDiem(l.luc) && tt ? { viecId: l.viecId, ten: chu(l.ten), luc: l.luc, trangThai: tt } : null;
    }).slice(0, 100),
    cauNoiHomNay: cauNoi !== null && cauNoi >= 0 ? Math.floor(cauNoi) : 0,
    loiNhan: danhSach<LoiNhan>(o.loiNhan, (l) => {
      const vai = trong(l.vai, ["phuHuynh", "giaoVien", "tuVan"] as const);
      const tu = chu(l.tu).trim().slice(0, 40), nd = chu(l.noiDung).trim().slice(0, 600);
      return typeof l.id === "string" && l.id && vai && tu && nd && laThoiDiem(l.luc) ? { id: l.id, tu, vai, noiDung: nd, luc: l.luc } : null;
    }).slice(0, 30),
  };
}
