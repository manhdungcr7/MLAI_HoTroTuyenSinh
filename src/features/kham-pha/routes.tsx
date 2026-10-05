import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S3 · Khám phá (Dũng) · màn 7–10.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.khamPha, ...trang(() => import("./kham-pha")) },
    { path: MAU.boLoc, ...trang(() => import("./man-bo-loc")) },
    { path: MAU.chiTiet, ...trang(() => import("./chi-tiet")) },
    { path: MAU.soSanh, ...trang(() => import("./so-sanh")) },
  ],
};
