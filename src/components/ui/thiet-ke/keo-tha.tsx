import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { gop } from "../nut-the";

export interface HangKeoThaProps<T> {
  muc: T[];
  khoa: (m: T) => string;
  /** Gọi khi đổi chỗ (kéo hoặc bấm Lên/Xuống). Phía gọi tự dựng mảng mới theo thứ tự mới. */
  onDoiCho: (tu: number, den: number) => void;
  /** Tên đọc cho trình đọc màn hình, ví dụ "Luật Kinh tế". */
  ten: (m: T) => string;
  /** Vẽ nội dung một hàng. `dieuKhien` là cụm Lên / nắm kéo / Xuống, đặt ở chỗ em muốn. */
  veMuc: (m: T, i: number, dieuKhien: ReactNode) => ReactNode;
  className?: string;
}

/** Danh sách sắp xếp: kéo nút nắm (chuột/cảm ứng) HOẶC nút Lên/Xuống HOẶC phím mũi tên trên nút nắm. Luôn có nút Lên/Xuống. */
export function HangKeoTha<T>({ muc, khoa, onDoiCho, ten, veMuc, className }: HangKeoThaProps<T>) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [keo, setKeo] = useState<{ i: number; dy: number; den: number } | null>(null);
  const [thongBao, setThongBao] = useState("");
  const bat = useRef<{ y0: number } | null>(null);

  const doi = (tu: number, den: number) => {
    if (den < 0 || den >= muc.length || tu === den) return;
    onDoiCho(tu, den);
    setThongBao(`Đã chuyển ${ten(muc[tu])} tới vị trí ${den + 1} trên ${muc.length}`);
  };
  const diemDen = (y: number) => {
    let best = 0, gan = Infinity;
    refs.current.forEach((el, k) => {
      if (!el) return;
      const r = el.getBoundingClientRect(), d = Math.abs(y - (r.top + r.height / 2));
      if (d < gan) { gan = d; best = k; }
    });
    return best;
  };
  const batDau = (e: React.PointerEvent, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    bat.current = { y0: e.clientY };
    setKeo({ i, dy: 0, den: i });
  };
  const dichuyen = (e: React.PointerEvent) => {
    if (!bat.current || !keo) return;
    setKeo({ ...keo, dy: e.clientY - bat.current.y0, den: diemDen(e.clientY) });
  };
  const tha = () => {
    if (keo) doi(keo.i, keo.den);
    bat.current = null;
    setKeo(null);
  };
  const phim = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowUp") { e.preventDefault(); doi(i, i - 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); doi(i, i + 1); }
  };

  return (
    <>
      <ol className={gop("space-y-2", className)}>
        {muc.map((m, i) => {
          const dangKeo = keo?.i === i;
          const dieuKhien = (
            <div className="flex flex-col items-center shrink-0" role="group" aria-label={`Sắp xếp ${ten(m)}`}>
              <button type="button" aria-label={`Chuyển ${ten(m)} lên`} disabled={i === 0} onClick={() => doi(i, i - 1)}
                className="size-11 grid place-items-center rounded-xl text-chu-phu disabled:opacity-30 active:bg-xanh-nhat cursor-pointer"><ChevronUp size={20} aria-hidden /></button>
              <button type="button" aria-label={`Kéo để sắp xếp ${ten(m)}, hoặc dùng phím mũi tên lên xuống`} onKeyDown={(e) => phim(e, i)}
                onPointerDown={(e) => batDau(e, i)} onPointerMove={dichuyen} onPointerUp={tha} onPointerCancel={tha}
                className="size-11 grid place-items-center rounded-xl text-chu-phu active:bg-xanh-nhat cursor-grab touch-none"><GripVertical size={20} aria-hidden /></button>
              <button type="button" aria-label={`Chuyển ${ten(m)} xuống`} disabled={i === muc.length - 1} onClick={() => doi(i, i + 1)}
                className="size-11 grid place-items-center rounded-xl text-chu-phu disabled:opacity-30 active:bg-xanh-nhat cursor-pointer"><ChevronDown size={20} aria-hidden /></button>
            </div>
          );
          return (
            <li key={khoa(m)} ref={(el) => { refs.current[i] = el; }}
              className={gop("relative", dangKeo && "z-10 shadow-lg scale-[1.01]", keo && !dangKeo && keo.den === i && "outline-2 outline-dashed outline-xanh rounded-2xl")}
              style={dangKeo ? { transform: `translateY(${keo.dy}px)` } : undefined}>
              {veMuc(m, i, dieuKhien)}
            </li>
          );
        })}
      </ol>
      <p role="status" aria-live="polite" className="sr-only">{thongBao}</p>
    </>
  );
}
