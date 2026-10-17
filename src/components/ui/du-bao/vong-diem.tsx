// Vòng điểm: cung gradient trên nền vòng nhạt; số lớn ở giữa. Chưa có điểm thì vòng nét đứt rỗng.
import type { ReactNode } from "react";

export function VongDiem({ diem, toiDa = 30, kichThuoc = 124, nhanGiua, children }: { diem: number | null; toiDa?: number; kichThuoc?: number; nhanGiua?: string; children?: ReactNode }) {
  const bk = 52, chuVi = 2 * Math.PI * bk, ti = diem === null ? 0 : Math.min(1, Math.max(0, diem / toiDa));
  return (
    <div className="relative shrink-0" style={{ width: kichThuoc, height: kichThuoc }} role="img" aria-label={diem === null ? "Chưa có điểm" : `Tổng điểm ${diem} trên ${toiDa}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="vong-diem-gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" className="vong-diem-dau" /><stop offset="100%" className="vong-diem-cuoi" /></linearGradient>
        </defs>
        {diem === null
          ? <circle cx="60" cy="60" r={bk} fill="none" className="stroke-vien" strokeWidth="10" strokeDasharray="3 8" strokeLinecap="round" />
          : <>
              <circle cx="60" cy="60" r={bk} fill="none" className="vong-diem-nen" strokeWidth="10" />
              <circle cx="60" cy="60" r={bk} fill="none" className="vong-diem-cung" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${chuVi * ti} ${chuVi}`} />
            </>}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">{children}{nhanGiua && <span className="text-[13px] text-chu-phu leading-none">{nhanGiua}</span>}</div>
    </div>
  );
}
