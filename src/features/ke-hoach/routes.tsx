import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S7 · Kế hoạch tuần (Hưng) · màn 17–18. Danh sách việc + Lịch + Xếp lịch giúp em + chi tiết việc.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.keHoach, ...trang(() => import("./chuyen-huong")) },
    { path: MAU.tuan, element: <TrangTam goc phuKeHoach tieuDe="Kế hoạch tuần" man="Màn 17 · Việc cần làm | Lịch, Xếp lịch giúp em, cảnh báo trùng giờ" slice="Kế hoạch tuần" /> },
    { path: MAU.viec, element: <TrangTam tieuDe="Chi tiết việc" man="Màn 18 · Mục tiêu buổi học, các bước, tiêu chí, Hoàn thành/Dời lịch/Bỏ qua" slice="Kế hoạch tuần" /> },
  ],
};
