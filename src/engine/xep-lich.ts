// Thuật toán xếp lịch tự học (phụ trách: Hưng). TypeScript thuần, KHÔNG import React.
// Ý tưởng: lịch học chính khóa / học thêm là cố định. Phần thời gian còn lại được chia
// cho các việc cần học, ưu tiên việc quan trọng, rải đều các ngày, tránh học một môn liền nhau.
import { TEN_MON_NGAN, type CauHinhTuHoc, type KhoiHoc, type MonId, type TamTrang, type TietCoDinh, type ViecCanHoc } from "@/state/types";

export const phutTuGio = (g: string): number => {
  const [h, m] = g.split(":").map(Number);
  return h * 60 + (m || 0);
};
export const gioTuPhut = (p: number): string =>
  `${String(Math.floor(p / 60)).padStart(2, "0")}:${String(p % 60).padStart(2, "0")}`;

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
  ngayNghi: [],
  nghiGiuaBuoi: 10,
};

// Khung giờ luôn dành cho ăn uống, nghỉ ngơi
const KHUNG_BAO_VE = [
  { batDau: 11 * 60 + 45, ketThuc: 13 * 60 },
  { batDau: 18 * 60, ketThuc: 19 * 60 },
];
const MUC_QUY_DOI_TAM_TRANG: Record<TamTrang, number> = { tot: 1, binhThuong: 0.85, met: 0.5 };
const TOI_DA_MOT_BUOI = 90;
const TOI_THIEU_MOT_BUOI = 25;

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
  ngay: string, coDinh: TietCoDinh[], cfg: CauHinhTuHoc, khoiDaCo: KhoiHoc[] = [],
): Khung[] {
  let khungs: Khung[] = [{ batDau: phutTuGio(cfg.gioBatDau), ketThuc: phutTuGio(cfg.gioKetThuc) }];
  for (const k of KHUNG_BAO_VE) khungs = truKhung(khungs, k);
  const thu = thuCuaNgay(ngay);
  for (const t of coDinh.filter((x) => x.thu === thu)) {
    // chừa 10 phút di chuyển / chuẩn bị quanh tiết cố định
    khungs = truKhung(khungs, { batDau: phutTuGio(t.batDau) - 10, ketThuc: phutTuGio(t.ketThuc) + 10 });
  }
  for (const k of khoiDaCo.filter((x) => x.ngay === ngay)) {
    khungs = truKhung(khungs, { batDau: phutTuGio(k.batDau), ketThuc: phutTuGio(k.ketThuc) });
  }
  return khungs.filter((k) => k.ketThuc - k.batDau >= TOI_THIEU_MOT_BUOI);
}

const TAM_UU_TIEN: Record<CauHinhTuHoc["thoiDiemTot"], number> = { sang: 8 * 60, chieu: 15 * 60, toi: 20 * 60 };
const DIEM_UU_TIEN = { cao: 3, vua: 2, thap: 1 } as const;

interface DauVao {
  tuanBatDau: string; // thứ 2
  tuNgay?: string; // chỉ xếp từ ngày này trở đi
  coDinh: TietCoDinh[];
  viec: ViecCanHoc[];
  cfg: CauHinhTuHoc;
  tamTrang?: TamTrang;
  khoiDaCo?: KhoiHoc[]; // các khối người dùng tự thêm / đã khóa
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
  if (tam === "met") ghiChu.push("Em đang mệt nên lịch được làm nhẹ đi một nửa.");

  const khungTheoNgay = new Map<string, Khung[]>();
  const taiTheoNgay = new Map<string, number>();
  const monTheoNgay = new Map<string, MonId[]>();
  for (const n of ngays) {
    khungTheoNgay.set(n, khungTrongTrongNgay(n, coDinh, cfg, khoiDaCo));
    // tính phần tự học đã có vào mức tải của ngày
    taiTheoNgay.set(n, khoiDaCo.filter((k) => k.ngay === n && k.loai === "tuHoc").reduce((s, k) => s + phutTuGio(k.ketThuc) - phutTuGio(k.batDau), 0));
    monTheoNgay.set(n, []);
  }

  const ra: KhoiHoc[] = [];
  let dem = 0;
  const them = (k: Omit<KhoiHoc, "id">) => { ra.push({ ...k, id: `auto-${k.ngay}-${dem++}` }); };

  const datVao = (ngay: string, batDau: number, phut: number) => {
    const khungs = khungTheoNgay.get(ngay)!;
    khungTheoNgay.set(ngay, truKhung(khungs, { batDau, ketThuc: batDau + phut + cfg.nghiGiuaBuoi }).filter((k) => k.ketThuc - k.batDau >= TOI_THIEU_MOT_BUOI));
    taiTheoNgay.set(ngay, (taiTheoNgay.get(ngay) ?? 0) + phut);
  };

  // 1) Chuẩn bị bài: tối hôm trước mỗi môn có tiết ngày mai, dành 15 phút xem trước
  for (const n of ngays) {
    const mai = congNgay(n, 1);
    const cacMon = new Set(coDinh.filter((t) => t.thu === thuCuaNgay(mai) && t.mon).map((t) => t.mon!));
    for (const mon of cacMon) {
      const khungs = khungTheoNgay.get(n)!;
      const o = khungs.find((k) => k.ketThuc >= 19 * 60 + 15 && k.ketThuc - Math.max(k.batDau, 19 * 60) >= 15);
      if (!o || (taiTheoNgay.get(n) ?? 0) + 15 > tran) continue;
      const bd = Math.max(o.batDau, 19 * 60);
      them({ viecId: null, ten: `Xem trước bài ${tenMonNgan(mon)} (sáng mai có tiết)`, loai: "tuHoc", mon, ngay: n, batDau: gioTuPhut(bd), ketThuc: gioTuPhut(bd + 15), ghiChu: "Đọc lướt 15 phút để sáng mai nghe giảng dễ hơn." });
      datVao(n, bd, 15);
      monTheoNgay.get(n)!.push(mon);
    }
  }

  // 2) Chia việc thành các buổi ngắn rồi xếp, việc quan trọng trước
  const buoi: { viec: ViecCanHoc; phut: number }[] = [];
  for (const v of viec) {
    let con = v.phut;
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
    for (const n of ngays) {
      const tai = taiTheoNgay.get(n) ?? 0;
      if (tai + b.phut > tran) continue;
      for (const k of khungTheoNgay.get(n)!) {
        if (k.ketThuc - k.batDau < b.phut) continue;
        const uaThich = TAM_UU_TIEN[cfg.thoiDiemTot];
        const cacUngVien = new Set([k.batDau, Math.max(k.batDau, Math.min(uaThich, k.ketThuc - b.phut))]);
        for (const bd of cacUngVien) {
          const trungMon = monTheoNgay.get(n)!.includes(b.viec.mon) ? 60 : 0; // đỡ học một môn hai lần trong ngày
          const xaGio = DIEM_UU_TIEN[b.viec.mucUuTien] >= 2 ? Math.abs(bd - uaThich) / 4 : Math.abs(bd - uaThich) / 12;
          const diem = tai * 0.5 + trungMon + xaGio;
          if (!tot || diem < tot.diem) tot = { ngay: n, bd, diem };
        }
      }
    }
    if (!tot) { thieu.set(b.viec.id, (thieu.get(b.viec.id) ?? 0) + b.phut); continue; }
    them({ viecId: b.viec.id, ten: b.viec.tieuDe, loai: "tuHoc", mon: b.viec.mon, ngay: tot.ngay, batDau: gioTuPhut(tot.bd), ketThuc: gioTuPhut(tot.bd + b.phut) });
    datVao(tot.ngay, tot.bd, b.phut);
    monTheoNgay.get(tot.ngay)!.push(b.viec.mon);
  }

  const chuaXep = viec.filter((v) => thieu.has(v.id)).map((v) => ({ viec: v, phutThieu: thieu.get(v.id)! }));
  if (chuaXep.length) ghiChu.push(`Còn ${chuaXep.length} việc chưa có chỗ trong tuần này. Em có thể giảm bớt hoặc nới giờ học.`);
  ra.sort((a, b) => a.ngay.localeCompare(b.ngay) || a.batDau.localeCompare(b.batDau));
  return { khoi: ra, chuaXep, ghiChu };
}

const tenMonNgan = (m: MonId): string => TEN_MON_NGAN[m];
