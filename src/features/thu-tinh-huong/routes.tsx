import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import type { RoutesCuaSlice } from "@/routes-type";

// Slice S6 · Thử tình huống + Điểm thi thử (Kiệt) · màn 13–14. Hai luồng này mở từ trang Nguyện vọng.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.thuTinhHuong, element: <TrangTam tieuDe="Nếu tăng điểm thì sao?" man="Màn 13 · Chọn môn, kéo +/-, tổng điểm trước→sau" slice="Thử tình huống" /> },
    { path: MAU.thuTinhHuongKetQua, element: <TrangTam tieuDe="Kết quả sau khi tăng điểm" man="Màn 13 · Danh sách Mới phù hợp / Tăng cơ hội / Vẫn khó" slice="Thử tình huống" /> },
    { path: MAU.diemThiThu, element: <TrangTam tieuDe="Nhập điểm thi thử mới" man="Màn 14 · Nhập điểm, tổ hợp tự tính" slice="Thử tình huống" /> },
    { path: MAU.diemThiThuKetQua, element: <TrangTam tieuDe="Danh sách đã thay đổi thế nào?" man="Màn 14 · Kết quả tính lại" slice="Thử tình huống" /> },
  ],
};
