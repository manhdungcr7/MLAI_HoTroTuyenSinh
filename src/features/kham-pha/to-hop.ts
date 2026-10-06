// Tính tổng điểm 3 môn theo đúng tổ hợp của từng ngành (đề án ghi), từ điểm hồ sơ (6 môn chính + 5 môn thêm). TypeScript thuần.
import { MON_CUA_TO_HOP, TO_HOP_NANG_KHIEU } from "@/data/to-hop-chinh-thuc";
import { diemHienTaiCuaTungMon } from "@/state/diem-hien-tai";
import type { AppState } from "@/state/store";
import { CAC_MON_THEM, type DiemDayDu, type LuaChon, type MonKhoi } from "@/state/types";

export { MON_CUA_TO_HOP };

/** Điểm hiện tại của em ở cả 11 môn: 6 môn chính (ưu tiên lần thi thử gần nhất) và các môn thêm trong hồ sơ. */
export function diemDayDu(s: AppState): DiemDayDu {
  const them = s.hoSo.diemThem ?? {};
  const ra = { ...diemHienTaiCuaTungMon(s) } as DiemDayDu;
  for (const m of CAC_MON_THEM) ra[m] = them[m] ?? null;
  return ra;
}

export interface TongToHop {
  tong: number | null; // null = em chưa nhập đủ điểm cho tổ hợp nào của ngành
  toHop: string | null; // tổ hợp được dùng
  suyRa: boolean; // đề án chưa ghi tổ hợp, đã lấy tổ hợp cao nhất của em
  khongTinhDuoc?: string[]; // đề án ghi tổ hợp nhưng chưa tính được (môn năng khiếu, ngoại ngữ khác)
  thieuMon?: MonKhoi[]; // tổ hợp tính được nhưng em chưa nhập các môn này
}

type DiemTuyY = Partial<Record<MonKhoi, number | null>>;

export function tongChoLuaChon(lc: Pick<LuaChon, "toHopXet">, diem: DiemTuyY): TongToHop {
  const daGhi = lc.toHopXet ?? [];
  const khaiBao = daGhi.filter((c) => MON_CUA_TO_HOP[c]);
  if (daGhi.length > 0 && khaiBao.length === 0) return { tong: null, toHop: null, suyRa: false, khongTinhDuoc: daGhi };
  const suyRa = khaiBao.length === 0;
  let tot: { tong: number; toHop: string } | null = null;
  const thieu = new Set<MonKhoi>();
  for (const ma of suyRa ? Object.keys(MON_CUA_TO_HOP) : khaiBao) {
    const mon = MON_CUA_TO_HOP[ma];
    const thieuMon = mon.filter((m) => diem[m] === null || diem[m] === undefined);
    if (thieuMon.length) { if (!suyRa) thieuMon.forEach((m) => thieu.add(m)); continue; }
    const tong = Math.round(mon.reduce((s, m) => s + (diem[m] as number), 0) * 100) / 100;
    if (!tot || tong > tot.tong) tot = { tong, toHop: ma };
  }
  if (tot) return { tong: tot.tong, toHop: tot.toHop, suyRa };
  return { tong: null, toHop: null, suyRa, ...(thieu.size ? { thieuMon: [...thieu] } : {}) };
}

export const laToHopNangKhieu = (ma: string) => TO_HOP_NANG_KHIEU.includes(ma);
