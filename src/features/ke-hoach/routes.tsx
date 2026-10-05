import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S7 · Kế hoạch tuần (Hưng) · màn 17–18. Danh sách việc + Lịch + Xếp lịch giúp em + chi tiết việc.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.keHoach, ...trang(() => import("./chuyen-huong")) },
    { path: MAU.tuan, ...trang(() => import("./ke-hoach-tuan")) },
    { path: MAU.viec, ...trang(() => import("./chi-tiet-viec")) },
  ],
};
