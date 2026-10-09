import { useEffect } from "react";
import { Outlet, RouterProvider, createHashRouter, useLocation } from "react-router-dom";
import { useBanDuLieu } from "@/state/dung-kho-du-lieu";
import { KhungCoThanhDuoi, KhungKhongThanh } from "@/components/layout/khung";
import { TrangLoi } from "@/components/layout/trang-loi";
import { Trang404 } from "@/components/layout/trang-404";
import type { RoutesCuaSlice } from "@/routes-type";
import { routes as khoiDau } from "@/features/khoi-dau/routes";
import { routes as hanhTrinh } from "@/features/hanh-trinh/routes";
import { routes as khamPha } from "@/features/kham-pha/routes";
import { routes as nguyenVong } from "@/features/nguyen-vong/routes";
import { routes as thuTinhHuong } from "@/features/thu-tinh-huong/routes";
import { routes as mucTieu } from "@/features/muc-tieu/routes";
import { routes as keHoach } from "@/features/ke-hoach/routes";
import { routes as tuHoc } from "@/features/tu-hoc/routes";
import { NhacNhoNen } from "@/features/tu-hoc/nhac-nho-nen";
import { routes as thietKe } from "@/features/thiet-ke/routes";
import { routes as tuVan } from "@/features/tu-van/routes";
import { routes as huongNghiep } from "@/features/huong-nghiep/routes";
import { routes as dongHanh } from "@/features/dong-hanh/routes";
import { routes as dongGop } from "@/features/dong-gop/routes";
import { routes as landingPage } from "@/features/landing-page/routes";

// Thêm slice mới: import `routes` của nó rồi thêm vào mảng này. Không sửa gì khác.
const CAC_SLICE: RoutesCuaSlice[] = [khoiDau, hanhTrinh, khamPha, nguyenVong, thuTinhHuong, mucTieu, keHoach, tuHoc, thietKe, tuVan, huongNghiep, dongHanh, dongGop, landingPage];

// Tiêu đề tab trình duyệt theo màn (khớp theo đầu đường dẫn, dài nhất thắng).
const TIEU_DE: [string, string][] = [
  ["/kham-pha/bo-loc", "Bộ lọc"], ["/kham-pha", "Khám phá"], ["/so-sanh", "So sánh"],
  ["/nguyen-vong/an-toan", "Cơ cấu danh sách"], ["/nguyen-vong", "Nguyện vọng"],
  ["/thu-tinh-huong", "Thử tình huống"], ["/diem-thi-thu", "Điểm thi thử"],
  ["/ke-hoach/tuan", "Kế hoạch tuần"], ["/ke-hoach/tien-do", "Tiến độ"], ["/ke-hoach/viec", "Chi tiết việc"], ["/ke-hoach/cai-dat", "Cài đặt"], ["/ke-hoach", "Mục tiêu"],
  ["/ho-so/chia-se", "Chia sẻ với người đồng hành"], ["/ho-so", "Hồ sơ"], ["/huong-nghiep", "Trắc nghiệm hướng nghiệp"], ["/dong-hanh", "Người đồng hành"], ["/dong-gop", "Cùng cập nhật dữ liệu"], ["/loi-nhan", "Lời nhắn cho em"], ["/tu-van", "Tư vấn"], ["/bat-dau", "Tạo hồ sơ"], ["/chao", "Chào mừng"],
];
const tieuDeCua = (p: string) => (p === "/" ? "Hôm nay" : [...TIEU_DE].sort((a, b) => b[0].length - a[0].length).find(([d]) => p.startsWith(d))?.[1]);

function Goc() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { const t = tieuDeCua(pathname); document.title = t ? `${t} · Nguyện Vọng AI` : "Nguyện Vọng AI"; }, [pathname]);
  const ban = useBanDuLieu();
  return <Outlet key={ban} />;
}

const router = createHashRouter([
  {
    element: <Goc />,
    errorElement: <TrangLoi />,
    children: [
      { element: <KhungKhongThanh />, children: CAC_SLICE.flatMap((s) => s.khongThanh ?? []) },
      { element: <KhungCoThanhDuoi />, children: CAC_SLICE.flatMap((s) => s.coThanh ?? []) },
      { path: "*", element: <Trang404 /> },
    ],
  },
]);


export default function App() {
  return <><NhacNhoNen /><RouterProvider router={router} /></>;
}
