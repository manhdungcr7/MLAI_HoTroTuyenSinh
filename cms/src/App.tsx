import { RouterProvider, createHashRouter } from "react-router-dom";
import { KhungCoThanhDuoi } from "@cms/thanh-phan/khung/khung-goc";
import { TrangLoi } from "@cms/thanh-phan/khung/trang-loi";
import { MAU } from "@cms/duong-dan";
import TongQuanDashboard from "@cms/tong-quan/tong-quan-dashboard";
import DanhSachTruong from "@cms/du-lieu-truong/danh-sach-truong";
import ChiTietTruong from "@cms/du-lieu-truong/chi-tiet-truong";
import DanhSachDuyet from "@cms/phe-duyet/danh-sach-duyet";
import PublishCenter from "@cms/xuat-ban/publish-center";
import TrangHeThong from "@cms/he-thong/trang-he-thong";

// Năm mục: Tổng quan, Dữ liệu trường, Phê duyệt, Xuất bản, Hệ thống. Đăng nhập do Cloudflare Access lo, không có trang đăng nhập riêng.
const router = createHashRouter([
  {
    element: <KhungCoThanhDuoi />,
    errorElement: <TrangLoi />,
    children: [
      { path: MAU.tongQuan, element: <TongQuanDashboard /> },
      { path: MAU.truong, element: <DanhSachTruong /> },
      { path: MAU.chiTietTruong, element: <ChiTietTruong /> },
      { path: MAU.duyet, element: <DanhSachDuyet /> },
      { path: MAU.xuatBan, element: <PublishCenter /> },
      { path: MAU.heThong, element: <TrangHeThong /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
