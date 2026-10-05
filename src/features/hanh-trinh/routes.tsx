import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S2 · Hôm nay + Hồ sơ (Tuấn).
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.homNay, ...trang(() => import("./hom-nay")) },
    { path: MAU.hoSo, ...trang(() => import("./ho-so")) },
    { path: MAU.hoSoCaiDat, element: <TrangTam tieuDe="Cài đặt" man="Cài đặt chung: xóa dữ liệu, quyền riêng tư, nguồn dữ liệu" slice="Hôm nay + Hồ sơ" /> },
  ],
};
