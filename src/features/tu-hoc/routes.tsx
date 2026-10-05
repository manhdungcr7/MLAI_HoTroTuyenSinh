import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S8 · Tiến độ + cài đặt tự học (Hưng) · màn 19–20. Khối dùng ở Hôm nay nằm ở widgets.tsx.
// Hook nhắc nhở cho cả ứng dụng: useNhacNho ở dung-nhac-nho.ts (người điều phối gắn ở App).
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.tienDo, ...trang(() => import("./tien-do")) },
    { path: MAU.caiDatLichHoc, ...trang(() => import("./lich-hoc")) },
    { path: MAU.caiDatTuHoc, ...trang(() => import("./cai-dat-tu-hoc")) },
    { path: MAU.nhacNho, ...trang(() => import("./nhac-nho-trang")) },
  ],
};
