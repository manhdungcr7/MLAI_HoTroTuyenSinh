import { RouterProvider, createHashRouter } from "react-router-dom";
import { KhungCoThanhDuoi } from "@cms/thanh-phan/khung/khung-goc";
import { TrangLoi } from "@cms/thanh-phan/khung/trang-loi";
import { MAU } from "@cms/duong-dan";

import DanhSachTruong from "@cms/tinh-nang/truong/danh-sach-truong";
import ChiTietTruong from "@cms/tinh-nang/truong/chi-tiet-truong";
import DanhSachDuyet from "@cms/tinh-nang/duyet/danh-sach-duyet";
import TongQuanTienDo from "@cms/tinh-nang/tien-do/tong-quan-tien-do";
import TrangToi from "@cms/tinh-nang/toi/trang-toi";
import QuanLyNguoi from "@cms/tinh-nang/toi/quan-ly-nguoi";
import PhanCong from "@cms/tinh-nang/toi/phan-cong";
import NhatKy from "@cms/tinh-nang/toi/nhat-ky";

const router = createHashRouter([
  {
    element: <KhungCoThanhDuoi />,
    errorElement: <TrangLoi />,
    children: [
      { path: MAU.truong, element: <DanhSachTruong /> },
      { path: MAU.chiTietTruong, element: <ChiTietTruong /> },
      { path: MAU.duyet, element: <DanhSachDuyet /> },
      { path: MAU.tienDo, element: <TongQuanTienDo /> },
      { path: MAU.toi, element: <TrangToi /> },
      { path: MAU.nguoi, element: <QuanLyNguoi /> },
      { path: MAU.phanCong, element: <PhanCong /> },
      { path: MAU.nhatKy, element: <NhatKy /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
