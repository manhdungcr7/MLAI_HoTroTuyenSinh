import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import type { RoutesCuaSlice } from "@/routes-type";

// Slice S8 · Tiến độ + cài đặt tự học (Hưng) · màn 19–20. Widget Hôm nay nằm ở widgets.tsx.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.tienDo, element: <TrangTam goc phuKeHoach tieuDe="Tiến độ & điều chỉnh" man="Màn 19 · Vòng % tuần, xu hướng điểm, việc gần đây, cảnh báo có hành động" slice="Tiến độ & tự học" /> },
    { path: MAU.caiDatLichHoc, element: <TrangTam tieuDe="Lịch học của em" man="Nhập lịch chính khóa và học thêm" slice="Tiến độ & tự học" /> },
    { path: MAU.caiDatTuHoc, element: <TrangTam tieuDe="Cài đặt tự học" man="Giờ học, môn ưu tiên, ngày nghỉ" slice="Tiến độ & tự học" /> },
    { path: MAU.nhacNho, element: <TrangTam tieuDe="Nhắc nhở" man="Nhắc trước giờ học, chuẩn bị bài tối hôm trước" slice="Tiến độ & tự học" /> },
  ],
};
