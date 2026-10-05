import { MAU } from "@/duong-dan";
import { TrangTam } from "@/components/ui/trang-tam";
import type { RoutesCuaSlice } from "@/routes-type";

// Slice S4 · Nguyện vọng (Dũng) · màn 11–12.
export const routes: RoutesCuaSlice = {
  coThanh: [
    { path: MAU.nguyenVong, element: <TrangTam goc tieuDe="Danh sách nguyện vọng" man="Màn 11 · NV1–NV5, kéo thả, nhãn, sửa/xóa" slice="Nguyện vọng" /> },
    { path: MAU.nguyenVongAnToan, element: <TrangTam tieuDe="Danh sách có an toàn không?" man="Màn 12 · Cảnh báo, 3 gợi ý hành động, cơ cấu 4 nhãn" slice="Nguyện vọng" /> },
  ],
};
