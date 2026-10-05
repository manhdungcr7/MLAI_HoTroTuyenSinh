import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S3 · Khám phá (Dũng) · màn 7–10.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.khamPha, ...trang(() => import("./kham-pha")) },
    { path: MAU.boLoc, ...trang(() => import("./man-bo-loc")) },
    { path: MAU.chiTiet, element: <TrangTam tieuDe="Chi tiết lựa chọn" man="Màn 9 · Chi tiết lựa chọn" slice="Khám phá" /> },
    { path: MAU.soSanh, element: <TrangTam tieuDe="So sánh 2 trường" man="Màn 10 · So sánh 2 trường" slice="Khám phá" /> },
  ],
};
