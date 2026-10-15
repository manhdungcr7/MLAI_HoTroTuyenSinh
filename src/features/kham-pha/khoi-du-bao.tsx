// Khối "Điểm chuẩn năm tới có thể ở đâu?" ở trang ngành: khoảng dự kiến có mức bất định rõ ràng và vị trí điểm của em.
// Không phải xác suất đậu; cách tính, giới hạn và kết quả kiểm định đều nói thẳng ngay tại đây.
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { dinhDang } from "@/engine/dinh-dang";
import { MO_TA_VI_TRI, viTriSoVoiDuBao } from "@/engine/du-bao-diem-chuan";
import type { LuaChon } from "@/state/types";
import { duBaoCua } from "./du-bao";

export function KhoiDuBao({ lc, diemEm }: { lc: LuaChon; diemEm: number | null }) {
  const d = useMemo(() => duBaoCua(lc), [lc]);
  if (!d) return null;
  const viTri = diemEm !== null ? viTriSoVoiDuBao(diemEm, d) : null;

  // Trục hẹp quanh khoảng dự kiến để nhìn rõ; điểm của em nằm ngoài trục thì dính vào mép.
  const tu = Math.floor(Math.min(d.thap, diemEm ?? d.thap) - 1), den = Math.ceil(Math.max(d.cao, diemEm ?? d.cao) + 1);
  const vt = (x: number) => `${Math.min(100, Math.max(0, ((x - tu) / (den - tu)) * 100))}%`;

  return (
    <section className="rounded-the bg-trang border border-vien shadow-the p-4 space-y-3" aria-label="Dự báo điểm chuẩn">
      <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-muc"><TrendingUp size={20} className="text-xanh" />Điểm chuẩn năm {d.namDuBao} có thể ở đâu?</h2>
      <p className="text-[14px] text-chu leading-snug">
        Khoảng <b>{dinhDang(d.thap, 1)} đến {dinhDang(d.cao, 1)} điểm</b>, mức giữa {dinhDang(d.kyVong, 1)} (bằng điểm năm {d.namCuoi}).
      </p>

      <div role="img" aria-label={`Khoảng dự kiến từ ${dinhDang(d.thap, 1)} đến ${dinhDang(d.cao, 1)} điểm${diemEm !== null ? `, điểm của bạn ${dinhDang(diemEm, 1)}` : ""}`} className="relative h-12 mt-1">
        <div className="absolute inset-x-0 top-5 h-2 rounded-full bg-vien" />
        <div className="absolute top-5 h-2 rounded-full bg-xanh/35" style={{ left: vt(d.thap), width: `calc(${vt(d.cao)} - ${vt(d.thap)})` }} />
        <div className="absolute top-3.5 h-5 w-0.5 bg-xanh" style={{ left: vt(d.kyVong) }} />
        {diemEm !== null && (
          <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: vt(diemEm), top: 0 }}>
            <span className="text-[12px] font-extrabold text-do-chu leading-none whitespace-nowrap">Bạn {dinhDang(diemEm, 1)}</span>
            <span className="mt-0.5 size-3 rounded-full bg-do border-2 border-trang" />
          </div>
        )}
        <span className="absolute bottom-0 left-0 text-[12px] text-chu-phu">{tu}</span>
        <span className="absolute bottom-0 right-0 text-[12px] text-chu-phu">{den}</span>
      </div>

      {viTri && <p className="text-[14px] text-chu leading-snug rounded-xl bg-nen p-3">{MO_TA_VI_TRI[viTri]}</p>}
    </section>
  );
}
