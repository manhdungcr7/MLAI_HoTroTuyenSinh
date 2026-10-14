// Thuật toán xếp lịch tự học (phụ trách: Hưng). TypeScript thuần, KHÔNG import React.
// Ý tưởng: lịch học chính khóa / học thêm là cố định. Phần thời gian còn lại được chia
// cho các việc cần học, ưu tiên việc quan trọng, rải đều các ngày, tránh học một môn liền nhau.
import { TEN_MON_NGAN, type CauHinhTuHoc, type KhoiHoc, type MonId, type TamTrang, type TietCoDinh, type ViecCanHoc } from "@/state/types";

export const phutTuGio = (g: string): number => {
  if (typeof g !== "string") return 0;
  const [h, m] = g.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};
export const gioTuPhut = (p: number): string => {
  const safe = Math.max(0, Number.isFinite(p) ? p : 0);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const MOT_NGAY = 86_400_000;
export const isoNgay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const taoNgay = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** Thứ 2 = 1 ... Chủ nhật = 7 */
export const thuCuaNgay = (iso: string): number => taoNgay(iso).getDay() || 7;
export const thuHaiCuaTuan = (iso: string): string => {
  const d = taoNgay(iso);
  d.setDate(d.getDate() - (thuCuaNgay(iso) - 1));
  return isoNgay(d);
};
export const congNgay = (iso: string, n: number): string => {
  const d = taoNgay(iso);
  d.setDate(d.getDate() + n);
  return isoNgay(d);
};
export const bayNgayCuaTuan = (thuHai: string): string[] => Array.from({ length: 7 }, (_, i) => congNgay(thuHai, i));
export const soNgayTu = (tu: string, den: string): number =>
  Math.round((taoNgay(den).getTime() - taoNgay(tu).getTime()) / MOT_NGAY);

export const CAU_HINH_MAC_DINH: CauHinhTuHoc = {
  gioBatDau: "06:30",
  gioKetThuc: "21:30",
  gioHocToiDaMoiNgay: 3,
  thoiDiemTot: "toi",
  ngayNghi: [7], // Chủ nhật (7) mặc định nghỉ
  nghiGiuaBuoi: 10,
};

/** Khung giờ luôn dành cho ăn uống, nghỉ ngơi. Thuật toán không bao giờ xếp việc vào đây. */
export const KHUNG_BAO_VE_GIO: { ten: string; batDau: string; ketThuc: string }[] = [
  { ten: "Ăn trưa & nghỉ ngơi", batDau: "11:45", ketThuc: "13:00" },
  { ten: "Ăn tối & nghỉ ngơi", batDau: "18:00", ketThuc: "19:00" },
];
const KHUNG_BAO_VE = KHUNG_BAO_VE_GIO.map((k) => ({ batDau: phutTuGio(k.batDau), ketThuc: phutTuGio(k.ketThuc) }));
/** Khung bảo vệ tùy chỉnh: mảng rỗng = tắt hẳn giờ ăn; không truyền = dùng KHUNG_BAO_VE_GIO. Giờ dạng "HH:mm". */
export type KhungBaoVeTuyChon = { batDau: string; ketThuc: string }[];
const MUC_QUY_DOI_TAM_TRANG: Record<TamTrang, number> = { tot: 1, binhThuong: 0.85, met: 0.5 };
const TOI_DA_MOT_BUOI = 90;
const TOI_THIEU_MOT_BUOI = 25;
/** Buổi từ 60 phút trở lên là buổi nặng: phải xong trước giờ nghỉ cuối ngày ít nhất chừng này phút. */
export const BUOI_NANG_PHUT = 60;
export const CACH_GIO_NGU = 30;

interface Khung { batDau: number; ketThuc: number }

export interface Doan { id: string; ten: string; batDau: string; ketThuc: string }

/** Tìm các cặp giờ chồng nhau trong cùng một ngày. */
export function phatHienTrung(cacDoan: Doan[]): [Doan, Doan][] {
  const ketQua: [Doan, Doan][] = [];
  const xep = [...cacDoan].sort((a, b) => phutTuGio(a.batDau) - phutTuGio(b.batDau));
  for (let i = 0; i < xep.length; i++) {
    for (let j = i + 1; j < xep.length; j++) {
      if (phutTuGio(xep[j].batDau) < phutTuGio(xep[i].ketThuc)) ketQua.push([xep[i], xep[j]]);
      else break;
    }
  }
  return ketQua;
}

function truKhung(khungs: Khung[], bo: Khung): Khung[] {
  const ra: Khung[] = [];
  for (const k of khungs) {
    if (bo.ketThuc <= k.batDau || bo.batDau >= k.ketThuc) { ra.push(k); continue; }
    if (bo.batDau > k.batDau) ra.push({ batDau: k.batDau, ketThuc: bo.batDau });
    if (bo.ketThuc < k.ketThuc) ra.push({ batDau: bo.ketThuc, ketThuc: k.ketThuc });
  }
  return ra;
}

export function khungTrongTrongNgay(
  ngay: string, coDinh: TietCoDinh[], cfg: CauHinhTuHoc, khoiDaCo: KhoiHoc[] = [], khungBaoVe?: KhungBaoVeTuyChon,
): Khung[] {
  const bdCfg = phutTuGio(cfg.gioBatDau);
  const ktCfg = phutTuGio(cfg.gioKetThuc);
  if (ktCfg <= bdCfg) return [];
  let khungs: Khung[] = [{ batDau: bdCfg, ketThuc: ktCfg }];
  const thu = thuCuaNgay(ngay);
  const baoVe = khungBaoVe ? khungBaoVe.map((k) => ({ batDau: phutTuGio(k.batDau), ketThuc: phutTuGio(k.ketThuc) })) : KHUNG_BAO_VE;
  const hocThem = (Array.isArray(coDinh) ? coDinh : []).filter((x) => x.thu === thu && x.loai === "hocThem").map((x) => ({ batDau: phutTuGio(x.batDau), ketThuc: phutTuGio(x.ketThuc) }));
  for (const k of baoVe) {
    if (k.ketThuc <= k.batDau) continue;
    // Lớp học thêm của em đã đè lên giờ ăn: em tự lo bữa quanh lớp, không cấm thêm phần còn lại của khung ăn.
    if (hocThem.some((h) => h.batDau < k.ketThuc && h.ketThuc > k.batDau)) continue;
    khungs = truKhung(khungs, k);
  }
  for (const t of (Array.isArray(coDinh) ? coDinh : []).filter((x) => x.thu === thu)) {
    // chừa 10 phút di chuyển / chuẩn bị quanh tiết cố định
    khungs = truKhung(khungs, { batDau: phutTuGio(t.batDau) - 10, ketThuc: phutTuGio(t.ketThuc) + 10 });
  }
  for (const k of (Array.isArray(khoiDaCo) ? khoiDaCo : []).filter((x) => x.ngay === ngay)) {
    khungs = truKhung(khungs, { batDau: phutTuGio(k.batDau), ketThuc: phutTuGio(k.ketThuc) });
  }
  return khungs.filter((k) => k.ketThuc - k.batDau >= TOI_THIEU_MOT_BUOI);
}

const TAM_UU_TIEN: Record<CauHinhTuHoc["thoiDiemTot"], number> = { sang: 8 * 60, chieu: 15 * 60, toi: 20 * 60 };
const DIEM_UU_TIEN = { cao: 3, vua: 2, thap: 1 } as const;

interface DauVao {
  tuanBatDau: string; // thứ 2
  tuNgay?: string; // chỉ xếp từ ngày này trở đi
  tuPhut?: number; // trong ngày tuNgay, chỉ xếp từ phút này trở đi (giờ hiện tại), để không xếp vào giờ đã qua
  coDinh: TietCoDinh[];
  viec: ViecCanHoc[];
  cfg: CauHinhTuHoc;
  tamTrang?: TamTrang;
  khoiDaCo?: KhoiHoc[]; // các khối người dùng tự thêm / đã khóa
  khungBaoVe?: KhungBaoVeTuyChon; // giờ ăn tùy chỉnh; [] = tắt; mặc định giữ KHUNG_BAO_VE_GIO
}

export interface KetQuaXepLich {
  khoi: KhoiHoc[];
  chuaXep: { viec: ViecCanHoc; phutThieu: number }[];
  ghiChu: string[];
}

export function xepLichTuan(dv: DauVao): KetQuaXepLich {
  const { coDinh, cfg, viec } = dv;
  const tam = dv.tamTrang ?? "binhThuong";
  const hesoTam = MUC_QUY_DOI_TAM_TRANG[tam];
  const khoiDaCo = dv.khoiDaCo ?? [];
  const ghiChu: string[] = [];
  const ngays = bayNgayCuaTuan(dv.tuanBatDau).filter(
    (n) => !cfg.ngayNghi.includes(thuCuaNgay(n)) && (!dv.tuNgay || n >= dv.tuNgay),
  );
  const tran = Math.round(cfg.gioHocToiDaMoiNgay * 60 * hesoTam);
  if (tam === "met") ghiChu.push("Tâm trạng đang mệt nên lịch được giảm tải một nửa.");

  const khungTheoNgay = new Map<string, Khung[]>();
  const taiTheoNgay = new Map<string, number>();
  const monTheoNgay = new Map<string, MonId[]>();
  // Chủ nhật nghỉ vẫn được dành tối cuối để xem trước bài thứ Hai, nên cũng dựng khung cho ngày đó.
  const ngayKhoiTao = bayNgayCuaTuan(dv.tuanBatDau).filter((n) => (!dv.tuNgay || n >= dv.tuNgay) && (ngays.includes(n) || thuCuaNgay(n) === 7));
  for (const n of ngayKhoiTao) {
    let khungs = khungTrongTrongNgay(n, coDinh, cfg, khoiDaCo, dv.khungBaoVe);
    if (dv.tuNgay && n === dv.tuNgay && dv.tuPhut) khungs = truKhung(khungs, { batDau: 0, ketThuc: dv.tuPhut }).filter((k) => k.ketThuc - k.batDau >= TOI_THIEU_MOT_BUOI);
    khungTheoNgay.set(n, khungs);
    // tính phần tự học đã có vào mức tải của ngày
    taiTheoNgay.set(n, khoiDaCo.filter((k) => k.ngay === n && k.loai === "tuHoc").reduce((s, k) => s + phutTuGio(k.ketThuc) - phutTuGio(k.batDau), 0));
    monTheoNgay.set(n, []);
  }

  const ra: KhoiHoc[] = [];
  // id không được trùng với khối đang giữ lại (ví dụ khối của việc đã xong vẫn nằm trong tuần)
  const idDaDung = new Set(khoiDaCo.map((k) => k.id));
  let dem = 0;
  const them = (k: Omit<KhoiHoc, "id">) => {
    let id = `auto-${k.ngay}-${dem++}`;
    while (idDaDung.has(id)) id = `auto-${k.ngay}-${dem++}`;
    idDaDung.add(id);
    ra.push({ ...k, id });
  };
  const gioNgu = phutTuGio(cfg.gioKetThuc) - CACH_GIO_NGU;

  const datVao = (ngay: string, batDau: number, phut: number) => {
    const khungs = khungTheoNgay.get(ngay) ?? [];
    khungTheoNgay.set(ngay, truKhung(khungs, { batDau, ketThuc: batDau + phut + cfg.nghiGiuaBuoi }).filter((k) => k.ketThuc - k.batDau >= TOI_THIEU_MOT_BUOI));
    taiTheoNgay.set(ngay, (taiTheoNgay.get(ngay) ?? 0) + phut);
  };

  // 1) Chuẩn bị bài: tối hôm trước mỗi môn có tiết ngày mai, dành 15 phút xem trước
  for (const n of ngayKhoiTao) {
    const mai = congNgay(n, 1);
    // mỗi môn một buổi, ghi theo tiết sớm nhất của môn đó ngày mai
    const tietMai = coDinh.filter((t) => t.thu === thuCuaNgay(mai) && t.mon).sort((a, b) => phutTuGio(a.batDau) - phutTuGio(b.batDau));
    const cacMon = new Map<MonId, string>();
    for (const t of tietMai) if (!cacMon.has(t.mon!)) cacMon.set(t.mon!, buoiTrongNgay(t.batDau));
    for (const [mon, buoiMai] of cacMon) {
      const khungs = khungTheoNgay.get(n) ?? [];
      const o = khungs.find((k) => k.ketThuc >= 19 * 60 + 15 && k.ketThuc - Math.max(k.batDau, 19 * 60) >= 15);
      if (!o || (taiTheoNgay.get(n) ?? 0) + 15 > tran) continue;
      const bd = Math.max(o.batDau, 19 * 60);
      them({ viecId: null, ten: `Xem trước bài ${tenMonNgan(mon)} (${buoiMai} mai có tiết)`, loai: "tuHoc", mon, ngay: n, batDau: gioTuPhut(bd), ketThuc: gioTuPhut(bd + 15), ghiChu: `Đọc lướt 15 phút để ${buoiMai} mai nghe giảng dễ hơn.` });
      datVao(n, bd, 15);
      if (!monTheoNgay.has(n)) monTheoNgay.set(n, []);
      monTheoNgay.get(n)!.push(mon);
    }
  }

  // 2) Chia việc thành các buổi ngắn rồi xếp, việc quan trọng trước
  const buoi: { viec: ViecCanHoc; phut: number }[] = [];
  for (const v of viec) {
    let con = typeof v.phut === "number" && Number.isFinite(v.phut) ? v.phut : 0;
    while (con > 0) {
      const p = con > TOI_DA_MOT_BUOI + TOI_THIEU_MOT_BUOI ? TOI_DA_MOT_BUOI : con;
      buoi.push({ viec: v, phut: p });
      con -= p;
    }
  }
  buoi.sort((a, b) => DIEM_UU_TIEN[b.viec.mucUuTien] - DIEM_UU_TIEN[a.viec.mucUuTien] || b.phut - a.phut);

  const thieu = new Map<string, number>();
  for (const b of buoi) {
    let tot: { ngay: string; bd: number; diem: number } | null = null;
    for (const [thuTu, n] of ngays.entries()) {
      const tai = taiTheoNgay.get(n) ?? 0;
      if (tai + b.phut > tran) continue;
      const cacKhung = khungTheoNgay.get(n) ?? [];
      for (const k of cacKhung) {
        if (k.ketThuc - k.batDau < b.phut) continue;
        const uaThich = TAM_UU_TIEN[cfg.thoiDiemTot];
        const cacUngVien = new Set([k.batDau, Math.max(k.batDau, Math.min(uaThich, k.ketThuc - b.phut))]);
        for (const bd of cacUngVien) {
          if (b.phut >= BUOI_NANG_PHUT && bd + b.phut > gioNgu) continue; // không học nặng sát giờ ngủ
          const daHocMon = (monTheoNgay.get(n) ?? []).includes(b.viec.mon);
          const trungMon = daHocMon ? 60 : 0; // đỡ học một môn hai lần trong ngày
          const xaGio = DIEM_UU_TIEN[b.viec.mucUuTien] >= 2 ? Math.abs(bd - uaThich) / 4 : Math.abs(bd - uaThich) / 12;
          const somTrongTuan = b.viec.mucUuTien === "cao" ? thuTu * 8 : 0; // việc nên làm trước thì làm sớm trong tuần
          const diem = tai * 0.5 + trungMon + xaGio + somTrongTuan;
          if (!tot || diem < tot.diem) tot = { ngay: n, bd, diem };
        }
      }
    }
    if (!tot) { thieu.set(b.viec.id, (thieu.get(b.viec.id) ?? 0) + b.phut); continue; }
    them({ viecId: b.viec.id, ten: b.viec.tieuDe, loai: "tuHoc", mon: b.viec.mon, ngay: tot.ngay, batDau: gioTuPhut(tot.bd), ketThuc: gioTuPhut(tot.bd + b.phut) });
    datVao(tot.ngay, tot.bd, b.phut);
    if (!monTheoNgay.has(tot.ngay)) monTheoNgay.set(tot.ngay, []);
    monTheoNgay.get(tot.ngay)!.push(b.viec.mon);
  }

  const chuaXep = viec.filter((v) => thieu.has(v.id)).map((v) => ({ viec: v, phutThieu: thieu.get(v.id)! }));
  if (chuaXep.length) ghiChu.push(`Còn ${chuaXep.length} việc chưa có chỗ trong tuần này. Bạn có thể nới giờ học hoặc dời bớt việc.`);
  ra.sort((a, b) => a.ngay.localeCompare(b.ngay) || a.batDau.localeCompare(b.batDau));
  return { khoi: ra, chuaXep, ghiChu };
}

const tenMonNgan = (m: MonId): string => TEN_MON_NGAN[m];
const buoiTrongNgay = (gio: string) => (phutTuGio(gio) < 12 * 60 ? "sáng" : phutTuGio(gio) < 18 * 60 ? "chiều" : "tối");

export interface KhungGoiY { ngay: string; batDau: string; ketThuc: string }

/**
 * Tìm các khung trống gần nhất đủ `phut` phút, bắt đầu từ ngày `tuNgay` (và từ `tuPhut` trong ngày đó).
 * Có `ganMoc`: trong mỗi khung trống chọn giờ gần mốc nhất (dùng khi dời một khối bị trùng giờ),
 * kết quả xếp theo ngày rồi theo độ gần mốc. Không có `ganMoc`: lấy giờ sớm nhất của mỗi khung.
 */
export function khungTrongGanNhat(dv: {
  tuNgay: string; tuPhut?: number; phut: number; coDinh: TietCoDinh[]; cfg: CauHinhTuHoc; khoiDaCo?: KhoiHoc[];
  soKhung?: number; soNgay?: number; ganMoc?: number;
}): KhungGoiY[] {
  const ra: (KhungGoiY & { thuTu: number; lech: number })[] = [];
  const soNgay = dv.soNgay ?? 7;
  for (let i = 0; i < soNgay; i++) {
    const ngay = congNgay(dv.tuNgay, i);
    if (dv.cfg.ngayNghi.includes(thuCuaNgay(ngay))) continue;
    for (const k of khungTrongTrongNgay(ngay, dv.coDinh, dv.cfg, dv.khoiDaCo ?? [])) {
      const dau = Math.ceil(Math.max(k.batDau, i === 0 ? dv.tuPhut ?? 0 : 0) / 5) * 5;
      if (k.ketThuc - dau < dv.phut) continue;
      const bd = dv.ganMoc === undefined ? dau : Math.min(Math.max(Math.round(dv.ganMoc / 5) * 5, dau), k.ketThuc - dv.phut);
      ra.push({ ngay, batDau: gioTuPhut(bd), ketThuc: gioTuPhut(bd + dv.phut), thuTu: i, lech: dv.ganMoc === undefined ? bd : Math.abs(bd - dv.ganMoc) });
    }
  }
  ra.sort((a, b) => a.thuTu - b.thuTu || a.lech - b.lech);
  return ra.slice(0, dv.soKhung ?? 4).map(({ ngay, batDau, ketThuc }) => ({ ngay, batDau, ketThuc }));
}
