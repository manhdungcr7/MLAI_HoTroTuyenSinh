import type { ToneTen } from "@/state/types";
import { gop } from "./nut-the";

const CHU: Record<ToneTen, string> = { xanh: "text-xanh", luc: "text-luc", cam: "text-cam", do: "text-do", tim: "text-tim", muc: "text-muc" };

/** Đường xu hướng nhỏ cho 3–6 giá trị, kèm chấm ở giá trị cuối. */
export function DuongXuHuong({ gia, tone = "xanh", rong = 88, cao = 34, className }: { gia: number[]; tone?: ToneTen; rong?: number; cao?: number; className?: string }) {
  if (gia.length < 2) return <span className="text-[12px] text-chu-phu">Chưa đủ điểm để vẽ</span>;
  const min = Math.min(...gia), max = Math.max(...gia), khoang = max - min || 1;
  const x = (i: number) => 4 + (i * (rong - 8)) / (gia.length - 1);
  const y = (v: number) => cao - 5 - ((v - min) / khoang) * (cao - 10);
  const d = gia.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const cuoi = gia.length - 1;
  return (
    <svg width={rong} height={cao} viewBox={`0 0 ${rong} ${cao}`} className={gop(CHU[tone], className)} role="img" aria-label={`Xu hướng: ${gia.join(", ")}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {gia.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === cuoi ? 3.6 : 2.4} fill="currentColor" />)}
    </svg>
  );
}
