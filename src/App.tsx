import { useEffect } from "react";
import { Navigate, Outlet, RouterProvider, createHashRouter, useLocation } from "react-router-dom";
import { KhungCoThanhDuoi, KhungKhongThanh } from "@/components/layout/khung";
import { DUONG_DAN } from "@/duong-dan";
import type { RoutesCuaSlice } from "@/routes-type";
import { routes as khoiDau } from "@/features/khoi-dau/routes";
import { routes as hanhTrinh } from "@/features/hanh-trinh/routes";
import { routes as khamPha } from "@/features/kham-pha/routes";
import { routes as nguyenVong } from "@/features/nguyen-vong/routes";
import { routes as thuTinhHuong } from "@/features/thu-tinh-huong/routes";
import { routes as mucTieu } from "@/features/muc-tieu/routes";
import { routes as keHoach } from "@/features/ke-hoach/routes";
import { routes as tuHoc } from "@/features/tu-hoc/routes";
import { routes as thietKe } from "@/features/thiet-ke/routes";

// Thêm slice mới: import `routes` của nó rồi thêm vào mảng này. Không sửa gì khác.
const CAC_SLICE: RoutesCuaSlice[] = [khoiDau, hanhTrinh, khamPha, nguyenVong, thuTinhHuong, mucTieu, keHoach, tuHoc, thietKe];

function Goc() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <Outlet />;
}

const router = createHashRouter([
  {
    element: <Goc />,
    children: [
      { element: <KhungKhongThanh />, children: CAC_SLICE.flatMap((s) => s.khongThanh ?? []) },
      { element: <KhungCoThanhDuoi />, children: CAC_SLICE.flatMap((s) => s.coThanh ?? []) },
      { path: "*", element: <Navigate to={DUONG_DAN.homNay()} replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
