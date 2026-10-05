import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S5 · Mục tiêu (Kiệt) · màn 15–16. Nằm trong tab Kế hoạch, mục "Mục tiêu".
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.mucTieu, ...trang(() => import("./muc-tieu")) },
    { path: MAU.monKeoDiem, ...trang(() => import("./mon-keo-diem")) },
  ],
};
