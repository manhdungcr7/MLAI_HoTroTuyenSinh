import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice · Đồng hành: phụ huynh, thầy cô, người tư vấn xem bản tóm tắt qua liên kết và gửi lời nhắn lại (không cần tài khoản).
export const routes: RoutesCuaSlice = {
  khongThanh: [
    { path: MAU.dongHanh, ...trang(() => import("./dong-hanh")) },
    { path: MAU.nhanLoiNhan, ...trang(() => import("./nhan-loi-nhan")) },
  ],
};
