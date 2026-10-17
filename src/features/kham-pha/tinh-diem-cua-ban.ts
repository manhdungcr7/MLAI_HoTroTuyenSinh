// Đếm số ngành đủ điểm / thử sức theo điểm của em. Chỉ tính chương trình so được: có điểm chuẩn THPT hợp lệ
// (không phải điểm sàn, không phải phương thức khác) và em đủ điểm môn của tổ hợp. Thuần TS, không React.
import { phanLoaiDuLieu } from "@/engine/trang-thai-du-lieu";
import type { DiemDayDu } from "@/state/types";
import type { LuaChon } from "@/state/types";
import { tongChoLuaChon } from "./to-hop";

export interface DiemCuaBan {
  tong: number; toHop: string;
  soDoiSoat: number; soDuDiem: number; soThuSuc: number;
  theoNhom: { nhom: string; so: number }[];
}

export function tinhDiemCuaBan(diem: DiemDayDu, ds: readonly LuaChon[]): DiemCuaBan | null {
  const tot = tongChoLuaChon({ toHopXet: [] }, diem);
  if (tot.tong === null || tot.toHop === null) return null;
  let soDoiSoat = 0, soDuDiem = 0, soThuSuc = 0;
  const nhom = new Map<string, number>();
  for (const l of ds) {
    const diemChuan = phanLoaiDuLieu(l).diemCuoi;
    if (diemChuan === null) continue;
    const t = tongChoLuaChon(l, diem).tong;
    if (t === null) continue;
    soDoiSoat++;
    const chenh = Math.round((t - diemChuan) * 100) / 100;
    if (chenh >= 0) soDuDiem++; else if (chenh >= -2) soThuSuc++; else continue;
    nhom.set(l.nhomNganh, (nhom.get(l.nhomNganh) ?? 0) + 1);
  }
  const theoNhom = [...nhom.entries()].map(([n, so]) => ({ nhom: n, so })).sort((a, b) => b.so - a.so);
  return { tong: tot.tong, toHop: tot.toHop, soDoiSoat, soDuDiem, soThuSuc, theoNhom };
}
