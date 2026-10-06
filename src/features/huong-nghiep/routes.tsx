import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice · Hướng nghiệp: trắc nghiệm sở thích nghề nghiệp, gợi ý nhóm ngành.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.tracNghiem, ...trang(() => import("./trac-nghiem")) },
  ],
};
