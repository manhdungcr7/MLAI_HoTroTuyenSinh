// Bản chụp nội dung cộng đồng đi kèm bản build (dự phòng khi GET /api/dong-gop lỗi). Thuần, có kiểu.
import goc from "./dong-gop.json";
import { dungBanChup, thongTinCuaTruong, type BanChup, type BanGhiTruong, type LoaiThongTin, type ThongTinTruong } from "./dong-gop-kiem-tra";

const banRong = (): BanChup => ({ phienBan: 1, luc: "2026-10-01T00:00:00.000Z", truong: {}, thongTin: {} });
const laDoiTuong = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Kiểm hình dạng dữ liệu nhận từ mạng/JSON. Sai hình dạng thì trả bản rỗng; dòng lẻ không hợp lệ bị bỏ, dòng còn lại được làm sạch lại. */
export function docBanChupAnToan(raw: unknown): BanChup {
  if (!laDoiTuong(raw) || raw.phienBan !== 1 || typeof raw.luc !== "string" || Number.isNaN(Date.parse(raw.luc)) || !laDoiTuong(raw.truong) || !laDoiTuong(raw.thongTin)) return banRong();
  const truong = Object.entries(raw.truong).map(([ma, v]) => ({ ...(laDoiTuong(v) ? v : {}), maTruong: ma }) as BanGhiTruong);
  const ds = Object.values(raw.thongTin).flatMap((v) => (Array.isArray(v) ? (v as ThongTinTruong[]) : []));
  return dungBanChup(truong, ds, new Date(raw.luc));
}

export const banChupGoc: BanChup = docBanChupAnToan(goc);

export const nhomCuaTruong = (b: BanChup, maTruong: string): string | null => b.truong[maTruong]?.nhomTuyenSinhChinhThucUrl ?? b.truong[maTruong]?.nhomCongDongUrl ?? null;

export const thongTinTruong = (b: BanChup, maTruong: string, q: { loai?: LoaiThongTin; toiDa?: number } = {}): ThongTinTruong[] => thongTinCuaTruong(b, maTruong, q);
