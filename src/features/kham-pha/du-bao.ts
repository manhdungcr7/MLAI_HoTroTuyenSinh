// Dự báo khoảng điểm chuẩn cho dữ liệu của app: thống kê biến động tính một lần từ toàn bộ dữ liệu thật rồi dùng lại.
import { LUA_CHON } from "@/data/lua-chon-that";
import { duBaoDiemChuan, namTuyenSinhToi, thongKeBienDong, type DuBaoDiemChuan } from "@/engine/du-bao-diem-chuan";
import type { LuaChon } from "@/state/types";

let tkCache: ReturnType<typeof thongKeBienDong> | null = null;
/** Biến động điểm chuẩn tính một lần từ toàn bộ dữ liệu thật (mất vài mili giây). */
export const thongKeChung = () => (tkCache ??= thongKeBienDong(LUA_CHON));

export const duBaoCua = (lc: LuaChon, bayGio = new Date()): DuBaoDiemChuan | null => duBaoDiemChuan(lc, thongKeChung(), namTuyenSinhToi(bayGio));
