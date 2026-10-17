// Biểu đồ nhỏ: điểm chuẩn thật các năm (nét liền), dự báo (nét đứt) và "quạt" khoảng dao động. SVG thuần, có bảng chữ thay thế.
import { useId } from "react";
import type { DuBaoDiemChuan } from "@/engine/du-bao-diem-chuan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { MAU_CHUA_CO_DIEM, type MauKetLuan } from "./mau-ket-luan";

const R = 300, C = 170, LE_TRAI = 30, LE_PHAI = 26, TREN = 14, DUOI = 26; // LE_PHAI chừa chỗ cho nhãn điểm/năm căn phải không bị cắt

export function BieuDoLichSu({ diem, d, diemEm, mau = MAU_CHUA_CO_DIEM }: { diem: [number, number][]; d: DuBaoDiemChuan | null; diemEm?: number | null; mau?: MauKetLuan }) {
  const id = useId();
  if (diem.length === 0) return null;
  const nam0 = Math.min(diem[0][0], d?.namCuoi ?? diem[0][0]);
  const nam1 = d ? d.namDuBao : diem[diem.length - 1][0];
  const cacGiaTri = [...diem.map(([, v]) => v), ...(d ? [d.thap, d.cao] : []), ...(diemEm != null ? [diemEm] : [])];
  const tu = Math.max(10, Math.floor(Math.min(...cacGiaTri) - 1)), den = Math.min(30, Math.ceil(Math.max(...cacGiaTri) + 1));
  const x = (n: number) => LE_TRAI + (nam1 === nam0 ? (R - LE_TRAI - LE_PHAI) / 2 : ((n - nam0) / (nam1 - nam0)) * (R - LE_TRAI - LE_PHAI));
  const y = (v: number) => TREN + (1 - (v - tu) / (den - tu)) * (C - TREN - DUOI);
  const duong = diem.map(([n, v], i) => `${i ? "L" : "M"}${x(n).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const [nc, dc] = diem[diem.length - 1];
  const nhanNam = [...new Set([...diem.map(([n]) => n), ...(d ? [d.namDuBao] : [])])];
  const moTa = `Điểm chuẩn các năm: ${diem.map(([n, v]) => `${n}: ${dinhDangDiem(v)}`).join(", ")}${d ? `. Dự báo ${d.namDuBao}: từ ${dinhDangDiem(d.thap)} đến ${dinhDangDiem(d.cao)}, trung tâm ${dinhDangDiem(d.kyVong)}` : ""}.`;
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${R} ${C}`} className="block w-full h-auto" role="img" aria-labelledby={`${id}-t`}>
        <title id={`${id}-t`}>{moTa}</title>
        {[tu, Math.round((tu + den) / 2), den].map((g) => (
          <g key={g}>
            <line x1={LE_TRAI} x2={R - LE_PHAI} y1={y(g)} y2={y(g)} className="stroke-vien" strokeWidth={1} strokeDasharray="1 4" />
            <text x={LE_TRAI - 5} y={y(g) + 4} textAnchor="end" fontSize={13} className="fill-chu-phu">{g}</text>
          </g>
        ))}
        {d && <polygon points={`${x(d.namCuoi)},${y(dc)} ${x(d.namDuBao)},${y(d.cao)} ${x(d.namDuBao)},${y(d.thap)}`} className={mau.svgFill} />}
        {diemEm != null && <line x1={LE_TRAI} x2={R - LE_PHAI} y1={y(diemEm)} y2={y(diemEm)} className={mau.svgStroke} strokeWidth={2} strokeDasharray="2 3" />}
        {d && <line x1={x(nc)} y1={y(dc)} x2={x(d.namDuBao)} y2={y(d.kyVong)} className="stroke-xanh" strokeWidth={2} strokeDasharray="5 4" />}
        {diem.length > 1 && <path d={duong} fill="none" className="stroke-xanh" strokeWidth={2.5} strokeLinejoin="round" />}
        {diem.map(([n, v]) => <circle key={n} cx={x(n)} cy={y(v)} r={6} className="fill-xanh stroke-trang" strokeWidth={2.5} />)}
        {diem.map(([n, v]) => <text key={`v${n}`} x={x(n)} y={y(v) - 11} textAnchor={n === nam0 && nam0 !== nam1 ? "start" : n === nam1 && nam0 !== nam1 ? "end" : "middle"} fontSize={13} className="fill-muc font-bold">{dinhDangDiem(v)}</text>)}
        {d && <circle cx={x(d.namDuBao)} cy={y(d.kyVong)} r={6} className={`fill-trang ${mau.svgStroke}`} strokeWidth={3} />}
        {nhanNam.map((n) => (
          <text key={n} x={x(n)} y={C - 7} textAnchor={n === nam1 && nhanNam.length > 1 ? "end" : n === nam0 && nhanNam.length > 1 ? "start" : "middle"} fontSize={13} className={n === d?.namDuBao ? "fill-xanh font-bold" : "fill-chu-phu"}>{n}</text>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-chu-phu">
        <span className="inline-flex items-center gap-1"><span aria-hidden className="h-0.5 w-4 bg-xanh" />Điểm chuẩn thật</span>
        {d && <span className="inline-flex items-center gap-1"><span aria-hidden className="w-4 border-t-2 border-dashed border-xanh" />Dự báo</span>}
        {diemEm != null && <span className="inline-flex items-center gap-1"><span aria-hidden className={`size-2.5 rounded-full ${mau.dot}`} />Điểm của bạn {dinhDangDiem(diemEm)}</span>}
      </figcaption>
      <table className="sr-only">
        <caption>Điểm chuẩn theo năm</caption>
        <thead><tr><th>Năm</th><th>Điểm</th></tr></thead>
        <tbody>
          {diem.map(([n, v]) => <tr key={n}><td>{n}</td><td>{dinhDangDiem(v)}</td></tr>)}
          {d && <tr><td>{d.namDuBao} (dự báo)</td><td>{dinhDangDiem(d.thap)} đến {dinhDangDiem(d.cao)}</td></tr>}
        </tbody>
      </table>
    </figure>
  );
}
