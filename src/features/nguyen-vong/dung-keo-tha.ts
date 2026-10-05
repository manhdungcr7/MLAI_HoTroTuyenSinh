// Kéo thả đổi thứ tự bằng pointer events: chạy được với chuột, bút và ngón tay.
// Chỉ phần tay nắm (touch-action: none) bắt đầu kéo, nên phần còn lại của trang vẫn cuộn bình thường.
// Khi kéo sát mép trên/dưới màn hình, trang tự cuộn để kéo được tới hàng xa.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { viTriDich } from "./tinh-toan";

interface DangKeo { tu: number; den: number; dy: number }
interface MocKeo { pointerId: number; yTrang: number; tam: number[]; buoc: number; clientY: number }

const VUNG_MEP = 96; // px tính từ mép để bắt đầu tự cuộn
const DUOI_CHE = 80; // thanh tab dưới che khoảng này

export function useKeoTha(soHang: number, doiViTri: (tu: number, den: number) => void) {
  const hang = useRef<(HTMLElement | null)[]>([]);
  const moc = useRef<MocKeo | null>(null);
  const [keo, setKeo] = useState<DangKeo | null>(null);
  const keoRef = useRef<DangKeo | null>(null);
  const vong = useRef<number | undefined>(undefined);

  const capNhat = useCallback(() => {
    const m = moc.current, k = keoRef.current;
    if (!m || !k) return;
    const dy = m.clientY + window.scrollY - m.yTrang;
    const moi = { tu: k.tu, dy, den: viTriDich(m.tam, k.tu, dy) };
    keoRef.current = moi;
    setKeo(moi);
  }, []);

  const tuCuon = useCallback(() => {
    const m = moc.current;
    if (!m) return;
    const tren = m.clientY - VUNG_MEP, duoi = window.innerHeight - DUOI_CHE - VUNG_MEP - m.clientY;
    const v = tren < 0 ? Math.max(-14, tren / 6) : duoi < 0 ? Math.min(14, -duoi / 6) : 0;
    if (v) { window.scrollBy(0, v); capNhat(); }
    vong.current = requestAnimationFrame(tuCuon);
  }, [capNhat]);

  const ketThuc = useCallback((xacNhan: boolean) => {
    if (vong.current) cancelAnimationFrame(vong.current);
    const k = keoRef.current;
    moc.current = null; keoRef.current = null;
    setKeo(null);
    if (xacNhan && k && k.den !== k.tu) doiViTri(k.tu, k.den);
  }, [doiViTri]);

  useEffect(() => () => { if (vong.current) cancelAnimationFrame(vong.current); }, []);

  const tayNam = (i: number) => ({
    onPointerDown: (e: RPointerEvent<HTMLElement>) => {
      if (e.button !== 0 || soHang < 2) return;
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* con trỏ đã nhả trước khi bắt: vẫn kéo bằng sự kiện trên tay nắm */ }
      const r = hang.current.slice(0, soHang).map((el) => el?.getBoundingClientRect());
      const tam = r.map((x) => (x ? x.top + window.scrollY + x.height / 2 : 0));
      // Khoảng một hàng nhường chỗ = chiều cao hàng đang kéo + khe giữa hai hàng.
      const khe = r[i + 1] && r[i] ? r[i + 1]!.top - r[i]!.bottom : r[i - 1] && r[i] ? r[i]!.top - r[i - 1]!.bottom : 12;
      moc.current = { pointerId: e.pointerId, yTrang: e.clientY + window.scrollY, tam, buoc: (r[i]?.height ?? 0) + khe, clientY: e.clientY };
      keoRef.current = { tu: i, den: i, dy: 0 };
      setKeo(keoRef.current);
      vong.current = requestAnimationFrame(tuCuon);
    },
    onPointerMove: (e: RPointerEvent<HTMLElement>) => {
      if (!moc.current || e.pointerId !== moc.current.pointerId) return;
      moc.current.clientY = e.clientY;
      capNhat();
    },
    onPointerUp: () => ketThuc(true),
    onPointerCancel: () => ketThuc(false),
    onLostPointerCapture: () => { if (moc.current) ketThuc(true); },
  });

  /** Kiểu dịch chuyển cho hàng thứ i trong lúc kéo. */
  const kieuHang = (i: number): CSSProperties | undefined => {
    if (!keo || !moc.current) return undefined;
    const { tu, den, dy } = keo, b = moc.current.buoc;
    if (i === tu) return { transform: `translateY(${dy}px)`, zIndex: 20, position: "relative" };
    let d = 0;
    if (tu < den && i > tu && i <= den) d = -b;
    if (den < tu && i >= den && i < tu) d = b;
    return { transform: `translateY(${d}px)`, transition: "transform 160ms ease" };
  };

  return { keo, tayNam, kieuHang, ganHang: (i: number) => (el: HTMLElement | null) => { hang.current[i] = el; } };
}
