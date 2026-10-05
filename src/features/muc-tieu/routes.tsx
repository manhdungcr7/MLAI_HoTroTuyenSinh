import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import type { RoutesCuaSlice } from "@/routes-type";

// Slice S5 · Mục tiêu (Kiệt) · màn 15–16. Nằm trong tab Kế hoạch, mục "Mục tiêu".
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.mucTieu, element: <TrangTam goc phuKeHoach tieuDe="Mục tiêu chính" man="Màn 15 · Trường/ngành, điểm hiện tại vs mục tiêu, còn X ngày" slice="Mục tiêu" /> },
    { path: MAU.monKeoDiem, element: <TrangTam tieuDe="Môn nào kéo điểm nhanh nhất?" man="Màn 16 · Công sức, hiệu quả, đề xuất bù điểm" slice="Mục tiêu" /> },
  ],
};
