// Phát sáng theo con trỏ: quầng sáng + nghiêng 3D tối đa 3 độ, CHỈ trên chuột (hover: hover, pointer: fine).
// Cập nhật CSS variable bằng rAF, không re-render React. Cảm ứng: chỉ hiệu ứng nhấn (class .phat-sang:active trong index.css).
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { gop } from "../nut-the";
import { giamChuyenDong } from "./chuyen-dong";

const NGHIENG_TOI_DA = 3;

/** Gắn hiệu ứng vào phần tử `ref` khi `bat` và thiết bị có chuột. Tắt hẳn khi giảm chuyển động. */
export function useHieuUngPhatSang(ref: RefObject<HTMLElement | null>, bat: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!bat || !el || giamChuyenDong() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0, rect: DOMRect | null = null, lx = 0, ly = 0;
    const capNhat = () => {
      raf = 0;
      if (!rect) return;
      const w = rect.width || 1, h = rect.height || 1;
      el.style.setProperty("--mx", `${lx}px`);
      el.style.setProperty("--my", `${ly}px`);
      el.style.setProperty("--ry", `${(((lx / w) - 0.5) * 2 * NGHIENG_TOI_DA).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - (ly / h)) * 2 * NGHIENG_TOI_DA).toFixed(2)}deg`);
    };
    const vaoTrong = (e: PointerEvent) => { if (e.pointerType === "mouse") rect = el.getBoundingClientRect(); };
    const diChuyen = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !rect) return;
      lx = e.clientX - rect.left; ly = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(capNhat);
    };
    const roi = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; rect = null;
      el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--mx", "50%"); el.style.setProperty("--my", "50%");
    };
    el.addEventListener("pointerenter", vaoTrong);
    el.addEventListener("pointermove", diChuyen);
    el.addEventListener("pointerleave", roi);
    return () => {
      el.removeEventListener("pointerenter", vaoTrong);
      el.removeEventListener("pointermove", diChuyen);
      el.removeEventListener("pointerleave", roi);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, bat]);
}

/** Thẻ lớn có phát sáng theo con trỏ (trên chuột). Dùng khi cần bọc nội dung không phải TheNen. */
export function PhatSang({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useHieuUngPhatSang(ref, true);
  return <div ref={ref} className={gop("phat-sang", className)}>{children}</div>;
}
