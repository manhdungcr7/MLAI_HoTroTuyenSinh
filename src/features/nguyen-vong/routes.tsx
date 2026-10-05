import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S4 · Nguyện vọng (Dũng) · màn 11–12.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.nguyenVong, ...trang(() => import("./danh-sach")) },
    { path: MAU.nguyenVongAnToan, ...trang(() => import("./an-toan")) },
  ],
};
