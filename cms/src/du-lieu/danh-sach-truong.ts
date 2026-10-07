// Danh sách trường (mã, tên, khu vực) sinh sẵn bằng scripts/xuat-danh-sach-truong.ts, khoảng 7KB.
// Không import LUA_CHON của ứng dụng học sinh (hơn 800KB) vào CMS.
import raw from "./danh-sach-truong.json";

export interface TruongCoBan { ma: string; ten: string; khuVuc: string }

export const DANH_SACH_TRUONG: readonly TruongCoBan[] = raw as TruongCoBan[];
export const TAP_MA_TRUONG: ReadonlySet<string> = new Set(DANH_SACH_TRUONG.map((t) => t.ma));

const THEO_MA = new Map(DANH_SACH_TRUONG.map((t) => [t.ma, t]));
export const truongTheoMa = (ma: string): TruongCoBan | undefined => THEO_MA.get(ma);
export const tenTruong = (ma: string): string => THEO_MA.get(ma)?.ten ?? ma;
