import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { giamChuyenDong, useHienKhiVaoMan } from "./chuyen-dong";

export type TongVong = "xanh" | "luc" | "tim" | "cam" | "do";
const BK = 52, CHU_VI = 2 * Math.PI * BK;
const VACH = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
  return { x1: 60 + c * 36, y1: 60 + s * 36, x2: 60 + c * 40, y2: 60 + s * 40 };
});

export interface VongDiemProps {
  /** Giá trị ĐO ĐƯỢC (điểm/30, % hồ sơ, % tiến độ, số nhóm đủ). null = chưa có: vòng nét đứt. Không dùng cho "xác suất". */
  value: number | null;
  max?: number;
  /** Chữ nhỏ dưới số, trong vòng (ví dụ "/30 điểm"). */
  nhanGiua?: string;
  /** Chữ dưới vòng (ngoài vòng). */
  nhanDuoi?: ReactNode;
  tong?: TongVong;
  size?: number;
  /** Mặc định dinhDangDiem (dấu phẩy). Với % truyền (n) => `${Math.round(n)}%`. */
  dinhDang?: (n: number) => string;
  /** Mô tả cho trình đọc màn hình, ví dụ "Tổng điểm 20,0 trên 30". */
  aria?: string;
}

/** Số đếm lên từ 0 khi vào màn (lần đầu); các lần sau đếm từ giá trị cũ tới giá trị mới. Giảm chuyển động: trả thẳng. */
function useSoDan(dich: number | null, ms: number, chay: boolean): number | null {
  const [v, setV] = useState<number | null>(dich);
  const daChay = useRef(false), cu = useRef(0);
  useEffect(() => {
    if (dich === null || giamChuyenDong() || !chay) { cu.current = dich ?? 0; setV(dich); return; }
    const tu = daChay.current ? cu.current : 0;
    daChay.current = true;
    let raf = 0; const t0 = performance.now();
    const buoc = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const x = tu + (dich - tu) * (1 - Math.pow(1 - p, 3));
      cu.current = x; setV(x);
      if (p < 1) raf = requestAnimationFrame(buoc);
    };
    setV(tu);
    raf = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(raf);
  }, [dich, ms, chay]);
  // Khung hình đầu khi vừa vào màn: hiện 0 ngay, không nháy số đầy rồi mới đếm.
  if (chay && !daChay.current && dich !== null && !giamChuyenDong()) return 0;
  return v;
}

/** Vòng điểm SVG: vạch chia mảnh, viên sáng đầu cung, vòng vẽ 700ms + số đếm lên; đổi giá trị thì cung trượt tới đó. Trạng thái rỗng: vòng nét đứt + "—". */
export function VongDiem({ value, max = 30, nhanGiua, nhanDuoi, tong = "luc", size = 124, dinhDang = dinhDangDiem, aria }: VongDiemProps) {
  const id = "vd-" + useId().replace(/:/g, "");
  const [ref, hien] = useHienKhiVaoMan<HTMLDivElement>(0.3);
  const ti = value === null ? 0 : Math.min(1, Math.max(0, value / max));
  const [ve, setVe] = useState(giamChuyenDong());
  useEffect(() => {
    if (!hien) return;
    const r = requestAnimationFrame(() => setVe(true));
    return () => cancelAnimationFrame(r);
  }, [hien]);
  const so = useSoDan(value, 700, hien);
  const nhan = aria ?? (value === null ? "Chưa có số liệu" : `${dinhDang(value)} trên ${dinhDang(max)}`);
  const hienCung = ve || giamChuyenDong();
  return (
    <div ref={ref} className="inline-flex flex-col items-center gap-1.5 shrink-0">
      <div className={`relative vd-${tong}`} style={{ width: size, height: size }} role="img" aria-label={nhan}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" className="vd-dau" /><stop offset="100%" className="vd-cuoi" /></linearGradient>
          </defs>
          {value === null
            ? <circle cx="60" cy="60" r={BK} fill="none" className="stroke-vien" strokeWidth="10" strokeDasharray="3 8" strokeLinecap="round" />
            : <>
                <circle cx="60" cy="60" r={BK} fill="none" className="vd-nen" strokeWidth="10" />
                {VACH.map((v, i) => <line key={i} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} className="vd-vach" />)}
                <circle cx="60" cy="60" r={BK} fill="none" className="vd-cung" stroke={`url(#${id})`} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CHU_VI} strokeDashoffset={hienCung ? CHU_VI * (1 - ti) : CHU_VI} />
                {/* Viên sáng đầu cung: quay quanh tâm theo ti (cùng hướng nét vẽ), mờ khi chưa vẽ. */}
                <g style={{ transform: `rotate(${hienCung ? ti * 360 : 0}deg)`, transformOrigin: "60px 60px", opacity: hienCung && ti > 0 ? 1 : 0 }} className="vd-dot-cung">
                  <circle cx={60 + BK} cy="60" r="9" className="vd-tia" />
                  <circle cx={60 + BK} cy="60" r="4.5" className="vd-cham" />
                </g>
              </>}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center leading-none">
          <span className="so-lon font-bold text-muc" style={{ fontSize: size * 0.24 }}>{so === null ? "—" : dinhDang(so)}</span>
          {nhanGiua && <span className="mt-1 text-[13px] text-chu-phu">{nhanGiua}</span>}
        </div>
      </div>
      {nhanDuoi && <div className="text-[13px] text-chu-phu text-center">{nhanDuoi}</div>}
    </div>
  );
}
