import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

export const routes: RoutesCuaSlice = {
  khongThanh: [
    { path: MAU.gioiThieu, ...trang(() => import("./index"), { nhe: true }) },
  ],
};
