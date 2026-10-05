import { MAU } from "@/duong-dan";
import { trang, type RoutesCuaSlice } from "@/routes-type";

// Slice S6 · Thử tình huống + Điểm thi thử (Kiệt) · màn 13–14. Hai luồng này mở từ trang Nguyện vọng.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.thuTinhHuong, ...trang(() => import("./thu-tinh-huong")) },
    { path: MAU.thuTinhHuongKetQua, ...trang(() => import("./ket-qua-tinh-huong")) },
    { path: MAU.diemThiThu, ...trang(() => import("./diem-thi-thu")) },
    { path: MAU.diemThiThuKetQua, ...trang(() => import("./ket-qua-diem-thi")) },
  ],
};
