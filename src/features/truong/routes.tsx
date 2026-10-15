import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice Hồ sơ trường: deep link /truong/:ma.
export const routes: RoutesCuaSlice = {
  coThanh: [{ path: MAU.truong, ...trang(() => import("./man-truong")) }],
};
