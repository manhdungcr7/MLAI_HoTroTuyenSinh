// Tính tổng điểm 3 môn theo đúng tổ hợp của từng ngành (đề án ghi), từ điểm 6 môn em đã nhập. TypeScript thuần.
import type { LuaChon, MonId } from "@/state/types";

/** Chỉ các tổ hợp mà 6 môn của hồ sơ đủ để tính. Tổ hợp có Sử, Địa, Tin... chưa tính được vì hồ sơ chưa có các môn đó. */
export const MON_CUA_TO_HOP: Record<string, MonId[]> = {
  A00: ["toan", "vatLy", "hoaHoc"], A01: ["toan", "vatLy", "tiengAnh"], A02: ["toan", "vatLy", "sinh"],
  B00: ["toan", "hoaHoc", "sinh"], B03: ["toan", "sinh", "nguVan"], B08: ["toan", "sinh", "tiengAnh"],
  C01: ["nguVan", "toan", "vatLy"], C02: ["nguVan", "toan", "hoaHoc"], C05: ["nguVan", "vatLy", "hoaHoc"], C08: ["nguVan", "hoaHoc", "sinh"],
  D01: ["toan", "nguVan", "tiengAnh"], D07: ["toan", "hoaHoc", "tiengAnh"], D08: ["toan", "sinh", "tiengAnh"],
  D11: ["nguVan", "vatLy", "tiengAnh"], D12: ["nguVan", "hoaHoc", "tiengAnh"], D13: ["nguVan", "sinh", "tiengAnh"],
};

export interface TongToHop {
  tong: number | null; // null = em chưa nhập đủ điểm cho tổ hợp nào của ngành
  toHop: string | null; // tổ hợp được dùng
  suyRa: boolean; // đề án chưa ghi tổ hợp, đã lấy tổ hợp cao nhất của em
  khongTinhDuoc?: string[]; // đề án ghi tổ hợp nhưng hồ sơ chưa có các môn đó (Sử, Địa, Tin...): chưa so được
}

export function tongChoLuaChon(lc: Pick<LuaChon, "toHopXet">, diem: Record<MonId, number | null>): TongToHop {
  const daGhi = lc.toHopXet ?? [];
  const khaiBao = daGhi.filter((c) => MON_CUA_TO_HOP[c]);
  if (daGhi.length > 0 && khaiBao.length === 0) return { tong: null, toHop: null, suyRa: false, khongTinhDuoc: daGhi };
  const suyRa = khaiBao.length === 0;
  let tot: { tong: number; toHop: string } | null = null;
  for (const ma of suyRa ? Object.keys(MON_CUA_TO_HOP) : khaiBao) {
    const mon = MON_CUA_TO_HOP[ma];
    if (mon.some((m) => diem[m] === null || diem[m] === undefined)) continue;
    const tong = Math.round(mon.reduce((s, m) => s + (diem[m] as number), 0) * 100) / 100;
    if (!tot || tong > tot.tong) tot = { tong, toHop: ma };
  }
  return tot ? { tong: tot.tong, toHop: tot.toHop, suyRa } : { tong: null, toHop: null, suyRa };
}
