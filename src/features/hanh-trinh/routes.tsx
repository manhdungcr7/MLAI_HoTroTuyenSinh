import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S2 · Hôm nay + Hồ sơ (Tuấn).
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.homNay, ...trang(() => import("./hom-nay"), { nhe: true }) },
    { path: MAU.hoSo, ...trang(() => import("./ho-so")) },
    { path: MAU.hoSoCaiDat, ...trang(() => import("./cai-dat")) },
    { path: MAU.chiaSe, ...trang(() => import("./chia-se")) },
  ],
};
