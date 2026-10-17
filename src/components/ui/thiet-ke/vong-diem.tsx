import { useId, useState, useEffect, type ReactNode } from "react";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { giamChuyenDong, useHienKhiVaoMan, useSoChay } from "./chuyen-dong";

export type TongVong = "xanh" | "luc" | "tim" | "cam" | "do";
const BK = 52, CHU_VI = 2 * Math.PI * BK;

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

/** Vòng điểm SVG: vẽ vòng + đếm số khi vào màn (một lần). Trạng thái rỗng: vòng nét đứt + "—". */
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
  const so = useSoChay(value, 800, hien);
  const nhan = aria ?? (value === null ? "Chưa có số liệu" : `${dinhDang(value)} trên ${dinhDang(max)}`);
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
                <circle cx="60" cy="60" r={BK} fill="none" className="vd-cung" stroke={`url(#${id})`} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CHU_VI} strokeDashoffset={ve ? CHU_VI * (1 - ti) : CHU_VI} />
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
