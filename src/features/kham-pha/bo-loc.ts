import type { LuaChon } from "@/state/types";

export interface BoLoc {
  diemTu: number;
  diemDen: number;
  hocPhi: "tatCa" | "duoi20" | "20-40" | "tren40";
  khuVuc: string; // "" = tất cả
  nganh: string; // "" = tất cả
  hocXa: "khong" | "co" | "tuyTruongHop";
  bac: { daiHoc: boolean; caoDang: boolean };
}

export const BO_LOC_MAC_DINH: BoLoc = {
  diemTu: 15, diemDen: 30, hocPhi: "tatCa", khuVuc: "", nganh: "", hocXa: "co", bac: { daiHoc: true, caoDang: true },
};

export function loc(ds: LuaChon[], b: BoLoc, tinhCuaEm?: string): LuaChon[] {
  return ds.filter((l) => {
    if (l.diemMin > b.diemDen || l.diemMax < b.diemTu) return false;
    if (b.hocPhi === "duoi20" && l.hocPhiMin >= 20) return false;
    if (b.hocPhi === "20-40" && (l.hocPhiMin > 40 || l.hocPhiMax < 20)) return false;
    if (b.hocPhi === "tren40" && l.hocPhiMax <= 40) return false;
    if (b.khuVuc && l.khuVuc !== b.khuVuc) return false;
    if (b.nganh && l.nganh !== b.nganh) return false;
    if (b.hocXa === "khong" && tinhCuaEm && !tinhCuaEm.includes(l.khuVuc.replace("TP.HCM", "Hồ Chí Minh"))) return false;
    if (l.bac === "Đại học" && !b.bac.daiHoc) return false;
    if (l.bac === "Cao đẳng" && !b.bac.caoDang) return false;
    return true;
  });
}

export const dem = (b: BoLoc): number => {
  const m = BO_LOC_MAC_DINH;
  return [b.diemTu !== m.diemTu || b.diemDen !== m.diemDen, b.hocPhi !== m.hocPhi, !!b.khuVuc, !!b.nganh, b.hocXa !== m.hocXa, !(b.bac.daiHoc && b.bac.caoDang)].filter(Boolean).length;
};

export const MUC_THU_TU = { "Phù hợp": 0, "Có thể thử sức": 1, "Cần cân nhắc": 2 } as const;
