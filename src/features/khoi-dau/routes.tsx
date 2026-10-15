import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S1 · Khởi đầu (Tuấn) · màn 1–5 trong kế hoạch.
export const routes: RoutesCuaSlice = {
  khongThanh: [
    { path: MAU.chao, ...trang(() => import("./chao-mung"), { nhe: true }) },
    { path: MAU.batDau, ...trang(() => import("./bat-dau"), { nhe: true }) },
  ],
};
