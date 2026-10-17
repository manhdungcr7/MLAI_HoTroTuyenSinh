import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice Cơ hội · Bản đồ cơ hội của em và Phòng thử điểm. Mở từ Khám phá và Hôm nay.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.banDoCoHoi, ...trang(() => import("./ban-do-co-hoi")) },
    { path: MAU.phongThuDiem, ...trang(() => import("./phong-thu-diem")) },
  ],
};
