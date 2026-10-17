// Chuyển trang và phản hồi nhấn. Mọi hiệu ứng là CSS (chuyen-vao, nut-lan) và tắt khi giảm chuyển động.
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { giamChuyenDong } from "./chuyen-dong";

/** Bọc Outlet: đổi đường dẫn thì nội dung mới vào bằng fade + trượt 10px. Cuộn về đầu do App.tsx lo. */
export function ChuyenTrang({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="chuyen-trang">{children}</div>;
}

/** Đặt một lần trong khung: ghi vị trí điểm nhấn lên nút chính để ripple nở đúng chỗ. Không render gì. */
export function TheoDoiLanNhan() {
  useEffect(() => {
    if (giamChuyenDong()) return;
    const khiNhan = (e: PointerEvent) => {
      const nut = (e.target as Element | null)?.closest?.(".gd-nut-chinh, .nut-muc") as HTMLElement | null;
      if (!nut) return;
      const r = nut.getBoundingClientRect();
      nut.style.setProperty("--rx", `${e.clientX - r.left}px`);
      nut.style.setProperty("--ry", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointerdown", khiNhan, { passive: true });
    return () => document.removeEventListener("pointerdown", khiNhan);
  }, []);
  return null;
}
