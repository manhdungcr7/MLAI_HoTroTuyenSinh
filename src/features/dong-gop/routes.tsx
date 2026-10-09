import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice · Đóng góp dữ liệu: sinh viên, thầy cô, cán bộ tuyển sinh đăng ký làm tình nguyện viên cập nhật dữ liệu trường.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.dongGop, ...trang(() => import("./dong-gop")) },
  ],
};
