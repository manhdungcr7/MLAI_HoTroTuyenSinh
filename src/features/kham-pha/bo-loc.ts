import { LUA_CHON_MAU } from "@/data/lua-chon-mau";
import type { LuaChon } from "@/state/types";

export const CAC_NHOM = [...new Set(LUA_CHON_MAU.map((l) => l.nhomNganh))];
export const CAC_KHU_VUC = [...new Set(LUA_CHON_MAU.map((l) => l.khuVuc))];

export interface BoLoc {
  diemTu: number;
  diemDen: number;
  hocPhi: "tatCa" | "duoi20" | "20-40" | "tren40";
  khuVuc: string; // "" = tất cả
  nhom: string; // nhóm ngành (CNTT, Kinh tế…), "" = tất cả; dùng chung với chip ở màn Khám phá
  hocXa: "khong" | "co" | "tuyTruongHop";
  bac: { daiHoc: boolean; caoDang: boolean };
}

export const BO_LOC_MAC_DINH: BoLoc = {
  diemTu: 15, diemDen: 30, hocPhi: "tatCa", khuVuc: "", nhom: "", hocXa: "co", bac: { daiHoc: true, caoDang: true },
};

export const CAC_MUC_HOC_PHI: { gia: BoLoc["hocPhi"]; nhan: string }[] = [
  { gia: "tatCa", nhan: "Không giới hạn" }, { gia: "duoi20", nhan: "Dưới 20 triệu" }, { gia: "20-40", nhan: "20 – 40 triệu" }, { gia: "tren40", nhan: "Trên 40 triệu" },
];

/** So khu vực của trường với nơi em sống ("TP. Hồ Chí Minh" ~ "TP.HCM"). */
export const cungNoi = (khuVucTruong: string, noi: string) => {
  const chuan = (x: string) => x.replace(/\s/g, "").replace("TP.HồChíMinh", "TP.HCM").toLowerCase();
  return chuan(noi).includes(chuan(khuVucTruong)) || chuan(khuVucTruong).includes(chuan(noi));
};

export function loc(ds: LuaChon[], b: BoLoc, tinhCuaEm?: string): LuaChon[] {
  return ds.filter((l) => {
    if (l.diemMin > b.diemDen || l.diemMax < b.diemTu) return false;
    if (b.hocPhi === "duoi20" && l.hocPhiMin >= 20) return false;
    if (b.hocPhi === "20-40" && (l.hocPhiMin > 40 || l.hocPhiMax < 20)) return false;
    if (b.hocPhi === "tren40" && l.hocPhiMax <= 40) return false;
    if (b.khuVuc && l.khuVuc !== b.khuVuc) return false;
    if (b.nhom && l.nhomNganh !== b.nhom) return false;
    // "Không học xa": chỉ giữ trường cùng nơi em sống. Chưa biết nơi sống thì không lọc được.
    if (b.hocXa === "khong" && tinhCuaEm && !cungNoi(l.khuVuc, tinhCuaEm)) return false;
    if (l.bac === "Đại học" && !b.bac.daiHoc) return false;
    if (l.bac === "Cao đẳng" && !b.bac.caoDang) return false;
    return true;
  });
}

/** Số tiêu chí đang khác mặc định, hiện trên nút "Bộ lọc". */
export const dem = (b: BoLoc): number => {
  const m = BO_LOC_MAC_DINH;
  return [b.diemTu !== m.diemTu || b.diemDen !== m.diemDen, b.hocPhi !== m.hocPhi, !!b.khuVuc, !!b.nhom, b.hocXa !== m.hocXa, !(b.bac.daiHoc && b.bac.caoDang)].filter(Boolean).length;
};
