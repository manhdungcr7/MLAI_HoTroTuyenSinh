// Danh mục dùng cho cả ứng dụng: số liệu thật (xem lua-chon-that.ts). 14 mục mẫu cũ để ở data/tham-khao/ chỉ để đối chiếu.
//
// `LUA_CHON_MAU` là danh mục ĐANG DÙNG: ban đầu bằng dữ liệu gốc, và khi CMS xuất bản bản mới (điểm chuẩn, học phí do tình nguyện viên cập nhật)
// kho dữ liệu thay nội dung mảng này TẠI CHỖ bằng `datDanhMuc`. Nhờ vậy mọi màn (Khám phá, Nguyện vọng, nhãn, so sánh) đều thấy số mới
// mà không phải sửa từng nơi; app dựng lại màn khi có bản mới (xem `useKhoDuLieu`). Dữ liệu gốc không bị đụng tới: `LUA_CHON` ở lua-chon-that.ts.
import type { LuaChon } from "@/state/types";
import { LUA_CHON, napLuaChon, timLuaChon } from "./lua-chon-that";

/** RỖNG cho đến khi `napDanhMuc()` xong (dữ liệu gốc nạp lười, xem lua-chon-that.ts). Màn dùng danh mục phải chờ `useDuLieuSan` hoặc `trang()`. */
export const LUA_CHON_MAU: LuaChon[] = [];
let theoId = new Map<string, LuaChon>();

/** Nạp dữ liệu gốc rồi đặt làm danh mục đang dùng, trừ khi kho đã đặt bản hợp nhất với CMS. */
export async function napDanhMuc(): Promise<void> {
  await napLuaChon();
  if (LUA_CHON_MAU.length === 0) datDanhMuc(LUA_CHON);
}

export function datDanhMuc(ds: readonly LuaChon[]): void {
  LUA_CHON_MAU.splice(0, LUA_CHON_MAU.length, ...ds);
  theoId = new Map(ds.map((l) => [l.id, l]));
}

export const tim = (id: string): LuaChon | undefined => theoId.get(id) ?? timLuaChon(id);
