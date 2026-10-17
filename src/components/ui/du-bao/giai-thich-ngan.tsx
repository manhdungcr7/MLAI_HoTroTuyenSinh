// Dấu "?" nhỏ: bấm (hoặc Enter/Space) để đọc nghĩa thuật ngữ, Esc hoặc bấm ra ngoài để đóng.
import { useEffect, useId, useRef, useState } from "react";
import { THUAT_NGU } from "@/noi-dung/du-bao";

const RONG = 256;

export function GiaiThichNgan({ khoa }: { khoa: keyof typeof THUAT_NGU | (string & {}) }) {
  const tn = THUAT_NGU[khoa];
  const [mo, setMo] = useState(false);
  const [vt, setVt] = useState({ left: 16, top: 0 });
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!mo) return;
    const dong = () => setMo(false);
    const ngoai = (e: Event) => { if (!hop.current?.contains(e.target as Node) && !nut.current?.contains(e.target as Node)) dong(); };
    const phim = (e: KeyboardEvent) => { if (e.key === "Escape") { dong(); nut.current?.focus(); } };
    document.addEventListener("pointerdown", ngoai);
    document.addEventListener("keydown", phim);
    window.addEventListener("scroll", dong, true);
    window.addEventListener("resize", dong);
    return () => {
      document.removeEventListener("pointerdown", ngoai); document.removeEventListener("keydown", phim);
      window.removeEventListener("scroll", dong, true); window.removeEventListener("resize", dong);
    };
  }, [mo]);

  if (!tn) return null;
  const bam = () => {
    if (!mo && nut.current) {
      const r = nut.current.getBoundingClientRect();
      const rong = Math.min(RONG, window.innerWidth - 32);
      setVt({ left: Math.min(Math.max(16, r.left + r.width / 2 - rong / 2), window.innerWidth - 16 - rong), top: r.bottom + 8 });
    }
    setMo(!mo);
  };
  return (
    <>
      <button ref={nut} type="button" onClick={bam} aria-expanded={mo} aria-controls={mo ? id : undefined} aria-label={`${tn.ten} là gì?`}
        className="relative inline-grid size-5 place-items-center rounded-full border border-chu-phu/50 text-[13px] font-bold leading-none text-chu-phu cursor-pointer align-middle after:absolute after:-inset-3 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh">?</button>
      {mo && (
        <span ref={hop} id={id} role="dialog" aria-label={tn.ten} className="fixed z-50 block rounded-the border border-vien bg-trang p-3 text-left shadow-lg"
          style={{ left: vt.left, top: vt.top, width: Math.min(RONG, window.innerWidth - 32) }}>
          <b className="block text-[14px] text-muc">{tn.ten}</b>
          <span className="mt-0.5 block text-[13px] font-normal leading-snug text-chu">{tn.nghia}</span>
        </span>
      )}
    </>
  );
}
