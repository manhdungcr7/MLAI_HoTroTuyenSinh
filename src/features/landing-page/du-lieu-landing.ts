// Số liệu và ví dụ trên trang giới thiệu: tính từ bộ dữ liệu thật và hồ sơ mẫu, không gõ tay con số nào.
import { LUA_CHON } from "@/data/lua-chon-that";
import { coHocPhi } from "@/data/lua-chon-phu";
import { nhanNguyenVong } from "@/engine/phan-tich";
import { tongChoLuaChon } from "@/features/kham-pha/to-hop";
import { taoHoSoMau } from "@/state/mau";
import type { LuaChon, NhanNguyenVong } from "@/state/types";

export const THONG_KE = {
  chuongTrinh: LUA_CHON.length,
  truong: new Set(LUA_CHON.map((l) => l.maTruong ?? l.truong)).size,
  nhieuNam: LUA_CHON.filter((l) => Object.keys(l.diemTheoNam ?? {}).length >= 2).length,
  hocPhi: LUA_CHON.filter(coHocPhi).length,
  chinhThuc: LUA_CHON.filter((l) => l.nguonCap === "official_pdf").length,
};

export interface DongMau { lc: LuaChon; tong: number; nhan: NhanNguyenVong; nhanKhiToanTang1: NhanNguyenVong }

/** Nguyện vọng của hồ sơ mẫu "Minh Anh" kèm nhãn tính thật, và nhãn nếu Toán tăng 1 điểm. */
export function layViDuMau() {
  const app = taoHoSoMau();
  const diem = app.hoSo.diem;
  const cong = { ...diem, toan: (diem.toan ?? 0) + 1 };
  const dong: DongMau[] = [];
  for (const id of app.nguyenVong) {
    const lc = LUA_CHON.find((l) => l.id === id);
    const tong = lc ? tongChoLuaChon(lc, diem).tong : null;
    const tongMoi = lc ? tongChoLuaChon(lc, cong).tong : null;
    if (lc && tong !== null && tongMoi !== null) dong.push({ lc, tong, nhan: nhanNguyenVong(lc, tong), nhanKhiToanTang1: nhanNguyenVong(lc, tongMoi) });
  }
  return { dong, soDoiNhan: dong.filter((d) => d.nhan !== d.nhanKhiToanTang1).length, toan: diem.toan };
}
