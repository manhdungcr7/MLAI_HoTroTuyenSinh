// Chuyển động dùng chung. Đo prefers-reduced-motion MỘT lần; tắt hết khi người dùng giảm chuyển động. Không thư viện.
import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

let _giam: boolean | null = null;
/** true nếu người dùng chọn giảm chuyển động (đo một lần, nhớ lại). */
export function giamChuyenDong(): boolean {
  if (_giam === null) _giam = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return _giam;
}

/** Đếm số từ 0 đến `dich` khi bắt đầu chạy. Giảm chuyển động hoặc dich=null: trả thẳng giá trị. */
export function useSoChay(dich: number | null, ms = 700, chay = true): number | null {
  const [v, setV] = useState<number | null>(() => (dich === null || giamChuyenDong() || !chay ? dich : 0));
  useEffect(() => {
    if (dich === null || giamChuyenDong() || !chay) { setV(dich); return; }
    let raf = 0; const t0 = performance.now();
    const buoc = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(dich * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(raf);
  }, [dich, ms, chay]);
  return v;
}

/** Trả [ref, daHien]: đổi thành true MỘT lần khi phần tử vào màn hình. Giảm chuyển động: true ngay. */
export function useHienKhiVaoMan<T extends Element = HTMLDivElement>(nguong = 0.15): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [hien, setHien] = useState(() => giamChuyenDong() || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (hien || !el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHien(true); io.disconnect(); } }, { threshold: nguong });
    io.observe(el);
    return () => io.disconnect();
  }, [hien, nguong]);
  return [ref, hien];
}

/** Bọc danh sách con: hiện dần so le, chỉ 10 phần tử đầu có hiệu ứng (phần sau hiện ngay). */
export function HienDan({ children, className, toiDa = 10 }: { children: ReactNode; className?: string; toiDa?: number }) {
  const [ref, hien] = useHienKhiVaoMan<HTMLDivElement>(0.05);
  return (
    <div ref={ref} className={className}>
      {Children.toArray(children).map((c, i) =>
        i < toiDa
          ? <div key={i} className={"hien-dan" + (hien ? " da-hien" : "")} style={{ "--i": i } as CSSProperties}>{c}</div>
          : c)}
    </div>
  );
}
