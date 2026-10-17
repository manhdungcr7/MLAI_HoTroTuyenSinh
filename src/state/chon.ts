// Các hàm đọc dữ liệu dẫn xuất từ state. Dùng chung cho nhiều màn.
import { tim } from "@/data/lua-chon-mau";
import { tongCanDatDeDen, mucUuTien } from "@/engine/diem-uu-tien";
import { isoNgay, thuHaiCuaTuan, bayNgayCuaTuan, soNgayTu } from "@/engine/xep-lich";
import { khoangCachTheoMon, monThieuCuaToHop, tongDiem } from "@/engine/phan-tich";
import { lyDoKhongSoDuoc } from "@/engine/trang-thai-du-lieu";
import { diemHienTaiCuaTungMon, type AppState } from "./store";
import { changCuaEm, coDemNguoc, type Chang } from "./chang";
import { TO_HOP, type LuaChon, type MaToHop, type MonId, type ViecCanHoc } from "./types";

export const homNay = () => isoNgay(new Date());
export const tuanHienTai = () => thuHaiCuaTuan(homNay());

/**
 * `hienTai` và `conThieu` chỉ là điểm thật khi `duDiem` (tức `monThieu` rỗng). Có môn thiếu thì `hienTai` chỉ là tổng các môn đã nhập
 * (môn chưa nhập tính 0): nơi hiển thị phải nói "chưa đủ điểm", không đưa số này ra như khoảng cách tới mục tiêu.
 */
export function mucTieuDayDu(s: AppState): { lc: LuaChon; hienTai: number; mucTieu: number; mucTieuTho: number; uuTienCong: number; conThieu: number; soNgayCon: number; anDemNguoc: boolean; toHop: MonId[]; monThieu: MonId[]; duDiem: boolean } | null {
  if (!s.mucTieu) return null;
  const lc = tim(s.mucTieu.luaChonId);
  if (!lc) return null;
  const diem = diemHienTaiCuaTungMon(s);
  const hienTai = tongDiem(diem, s.mucTieu.toHop);
  const monThieu = monThieuCuaToHop(diem, s.mucTieu.toHop);
  // Điểm ưu tiên khu vực/đối tượng bù một phần: em chỉ cần nâng tổng ba môn tới `mucTieuTho` (bằng `mucTieu` khi em không có ưu tiên).
  const muc = mucUuTien(s.hoSo.uuTienTuyenSinh);
  const mucTieuTho = tongCanDatDeDen(s.mucTieu.diemMucTieu, muc);
  return {
    lc, hienTai, mucTieu: s.mucTieu.diemMucTieu, mucTieuTho, uuTienCong: Math.round((s.mucTieu.diemMucTieu - mucTieuTho) * 100) / 100,
    toHop: s.mucTieu.toHop, monThieu, duDiem: monThieu.length === 0,
    conThieu: Math.max(0, Math.round((mucTieuTho - hienTai) * 10) / 10),
    soNgayCon: Math.max(0, soNgayTu(homNay(), s.mucTieu.ngayThi)),
    /** Em lớp 10–11 chưa có kỳ thi sát: các màn không hiện đếm ngược hay câu "gần kỳ thi". */
    anDemNguoc: !coDemNguoc(changCuaEm(s)),
  };
}

export function khoangCachCuaToi(s: AppState) {
  const m = mucTieuDayDu(s);
  if (!m) return [];
  return khoangCachTheoMon(diemHienTaiCuaTungMon(s), m.toHop, m.mucTieuTho, s.hoSo.canCaiThien);
}

const THU_TU = { cao: 0, vua: 1, thap: 2 } as const;

/** Việc của một tuần (thứ 2 = `thuHai`). Việc không ghi tuần (dữ liệu cũ) tính cho mọi tuần. */
export const viecCuaTuan = (viec: ViecCanHoc[], thuHai: string): ViecCanHoc[] => viec.filter((v) => !v.tuan || v.tuan === thuHai);

export function viecConLai(s: AppState) {
  return viecCuaTuan(s.viec, tuanHienTai())
    .filter((v) => !["xong", "boQua"].includes(s.trangThaiViec[v.id] ?? ""))
    .sort((a, b) => THU_TU[a.mucUuTien] - THU_TU[b.mucUuTien]);
}

/** Tiến độ tuần: việc đã xong / tổng số việc của tuần. */
export function tienDoTuan(s: AppState) {
  const viec = viecCuaTuan(s.viec, tuanHienTai());
  const tong = viec.length;
  const xong = viec.filter((v) => s.trangThaiViec[v.id] === "xong").length;
  return { tong, xong, phanTram: tong ? Math.round((xong / tong) * 100) : 0 };
}

export function khoiTrongNgay(s: AppState, ngay: string) {
  return s.khoiHoc.filter((k) => k.ngay === ngay).sort((a, b) => a.batDau.localeCompare(b.batDau));
}

export const cacNgayTuanNay = () => bayNgayCuaTuan(tuanHienTai());

export function tenGoi(hoTen: string) {
  const p = hoTen.trim().split(/\s+/);
  if (p.length >= 3) return `${p[p.length - 2]} ${p[p.length - 1]}`;
  if (p.length === 2) return p[p.length - 1];
  return p.length ? p[0] : "bạn";
}


/** Tổng điểm 3 môn Toán – Lý – Anh hiện tại; null nếu em chưa nhập đủ. */
export function tongA01(s: AppState): number | null {
  const d = diemHienTaiCuaTungMon(s);
  if (TO_HOP.A01.some((m) => d[m] === null)) return null;
  return tongDiem(d, TO_HOP.A01);
}

/** Tổ hợp của app (A00, A01, D01, B00) mà đề án của ngành cho xét; em có điểm thì chọn tổ hợp cao nhất, không thì A01 nếu ngành cho xét. */
function toHopChoMucTieu(lc: LuaChon, diem?: Record<MonId, number | null>): MaToHop {
  const cho = (Object.keys(TO_HOP) as MaToHop[]).filter((ma) => !lc.toHopXet?.length || lc.toHopXet.includes(ma));
  const ung = cho.length ? cho : (["A01"] as MaToHop[]);
  if (!diem) return ung.includes("A01") ? "A01" : ung[0];
  const tong = (ma: MaToHop) => (TO_HOP[ma].some((m) => diem[m] === null || diem[m] === undefined) ? -1 : TO_HOP[ma].reduce((t, m) => t + (diem[m] as number), 0));
  return [...ung].sort((a, b) => tong(b) - tong(a))[0];
}

/** Mục tiêu chính chỉ lập kế hoạch học cho phương thức thi tốt nghiệp THPT và 4 tổ hợp A00, A01, D01, B00. Ngành khác thì nói rõ lý do, không đặt bừa. */
export function coTheDatMucTieu(lc: LuaChon): { ok: true } | { ok: false; lyDo: string } {
  if (lc.phuongThuc && lc.phuongThuc !== "THPT") return { ok: false, lyDo: "Điểm chuẩn này thuộc phương thức xét khác (học bạ, đánh giá năng lực...), không so được với điểm thi tốt nghiệp nên mình chưa lập kế hoạch ôn thi cho nó." };
  const khongSo = lyDoKhongSoDuoc(lc); // chỉ có điểm sàn 15,0 hoặc chưa có điểm: không có mốc để đặt mục tiêu
  if (khongSo) return { ok: false, lyDo: `${khongSo} Nên mình chưa đặt được mục tiêu điểm cho ngành này.` };
  if (lc.toHopXet?.length && !lc.toHopXet.some((c) => c in TO_HOP)) return { ok: false, lyDo: `Ngành này xét tổ hợp ${lc.toHopXet.slice(0, 4).join(", ")}. Kế hoạch ôn thi hiện hỗ trợ A00, A01, D01, B00, nên mình chưa đặt được làm mục tiêu chính.` };
  return { ok: true };
}

/**
 * Ngày thi THPT dự kiến (26/6). Chặng nước rút và thi lại: kỳ thi sắp tới. Em lớp 10–11: kỳ thi của năm em học xong lớp 12,
 * tức muộn hơn một năm (lớp 10 sẽ sớm hơn thực tế một năm, em sửa ở màn Mục tiêu).
 */
export function ngayThiDuKien(chang: Chang = "nuocRut", bayGio: Date = new Date()): string {
  const nam = bayGio.getFullYear() + (bayGio.getMonth() > 5 ? 1 : 0) + (chang === "dinhHuong" ? 1 : 0);
  return isoNgay(new Date(nam, 5, 26));
}

export const mucTieuTuLuaChon = (lc: LuaChon, diem?: Record<MonId, number | null>, chang: Chang = "nuocRut") => ({
  luaChonId: lc.id, phuongThuc: "THPT" as const, maToHop: toHopChoMucTieu(lc, diem), toHop: TO_HOP[toHopChoMucTieu(lc, diem)], diemMucTieu: lc.diemMin,
  ngayThi: ngayThiDuKien(chang),
});

/** Chọn ngành làm mục tiêu từ danh sách nguyện vọng: lấy NV1, nếu chưa đặt được thì thử NV kế tiếp; hết thì trả lý do của NV đầu. */
export function chonNguyenVongLamMucTieu(
  s: Pick<AppState, "nguyenVong" | "hoSo" | "diemThi">,
  timLc: (id: string) => LuaChon | undefined = tim,
): { ok: true; lc: LuaChon; mucTieu: ReturnType<typeof mucTieuTuLuaChon> } | { ok: false; lyDo: string } {
  const diem = diemHienTaiCuaTungMon(s);
  let lyDoDau: string | null = null;
  for (const id of s.nguyenVong) {
    const lc = timLc(id);
    if (!lc) continue;
    const kt = coTheDatMucTieu(lc);
    if (kt.ok) return { ok: true, lc, mucTieu: mucTieuTuLuaChon(lc, diem, changCuaEm(s)) };
    lyDoDau ??= `${lc.nganh} (${lc.truong}): ${kt.lyDo}`;
  }
  return { ok: false, lyDo: lyDoDau ?? "Danh sách nguyện vọng chưa có ngành nào để chọn làm mục tiêu." };
}

const coSo = (o: Record<string, unknown> | null | undefined) => !!o && Object.values(o).some((v) => typeof v === "number" && Number.isFinite(v));

/**
 * Trên máy có thứ gì do chính em nhập chưa (hồ sơ, điểm, mục tiêu, nguyện vọng, lịch...)? Một định nghĩa duy nhất cho mọi nơi
 * cần hỏi trước khi ghi đè hoặc xóa. Hồ sơ mẫu (`laMau`) không phải dữ liệu của em: chỉ tính những gì em thêm hẳn vào (lời nhắn, tình huống).
 * Sửa một trường của hồ sơ mẫu sẽ bỏ `laMau` (store.capNhatHoSo), từ đó mọi thứ đều được tính.
 */
export function coDuLieuNguoiDung(s: AppState): boolean {
  if (s.loiNhan.length > 0 || s.tinhHuong.length > 0) return true;
  const h = s.hoSo;
  if (h.laMau) return false;
  return !!h.hoTen.trim() || h.hoanTat || h.khoi !== null || !!h.tinh.trim() || !!h.giaiDoan
    || h.nganhQuanTam.length > 0 || h.diemManh.length > 0 || h.canCaiThien.length > 0 || h.khuVuc.length > 0
    || h.nganSach !== null || h.choO !== null || h.hocXaNha !== null || h.quanTamViecLam !== null
    || coSo(h.diem) || coSo(h.diemThem) || coSo(h.diemThiThat) || coSo(h.diemMucTieuMon) || coSo(h.diemDgnl)
    || (!!h.uuTienTuyenSinh && (!!h.uuTienTuyenSinh.khuVuc || (!!h.uuTienTuyenSinh.doiTuong && h.uuTienTuyenSinh.doiTuong !== "khong")))
    || !!h.chungChiNgoaiNgu || !!h.giaiThuongHsg || !!h.soThich
    || (!!h.hocBa && (coSo(h.hocBa) || !!h.hocBa.hocLuc || !!h.hocBa.hanhKiem || typeof h.hocBa.truongChuyen === "boolean"))
    || (!!h.tienDoKienThuc && Object.keys(h.tienDoKienThuc).length > 0)
    || s.mucTieu !== null || s.nguyenVong.length > 0 || s.yeuThich.length > 0 || s.soSanh.length > 0
    || s.diemThi.length > 0 || s.coDinh.length > 0 || s.viec.length > 0 || s.khoiHoc.length > 0
    || Object.keys(s.trangThaiViec).length > 0 || s.lichSu.length > 0 || s.nhacNho.bat;
}

/** Có gì để hiện ở Hôm nay / Hồ sơ: dữ liệu của em hoặc hồ sơ mẫu em chủ động nạp. Chưa có thì đưa về màn Chào. */
export const coHoSoDeHienThi = (s: AppState): boolean => s.hoSo.laMau === true || coDuLieuNguoiDung(s);
