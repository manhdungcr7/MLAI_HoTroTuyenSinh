import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

export const routes: RoutesCuaSlice = {
  coThanh: [{ path: MAU.tuVan, ...trang(() => import("./tu-van")) }],
};
