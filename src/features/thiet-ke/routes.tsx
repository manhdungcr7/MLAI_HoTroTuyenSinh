import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Chỉ bật khi chạy dev (npm run dev). Không có trong bản build.
export const routes: RoutesCuaSlice = {
  coThanh: import.meta.env.DEV ? [{ path: MAU.thietKe, ...trang(() => import("./trang-thiet-ke")) }] : [],
};
