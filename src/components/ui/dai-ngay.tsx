import { ChevronLeft, ChevronRight } from "lucide-react";
import { congNgay, isoNgay, taoNgay, thuCuaNgay } from "@/engine/xep-lich";
import { gop } from "./nut-the";

const NHAN_THU = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Dải 7 ngày của một tuần, bấm để chọn. soViec hiển thị chấm nhỏ dưới ngày có việc. */
export function DaiNgay({ cacNgay, chon, onChon, soViec }: { cacNgay: string[]; chon: string; onChon: (n: string) => void; soViec?: Record<string, number> }) {
  const homNay = isoNgay(new Date());
  return (
    <div role="tablist" aria-label="Chọn ngày" className="grid grid-cols-7 gap-1 items-stretch">
      {cacNgay.map((n) => {
        const thu = thuCuaNgay(n), dang = n === chon, la = n === homNay;
        return (
          <button key={n} type="button" role="tab" aria-selected={dang} onClick={() => onChon(n)}
            className={gop("min-h-14 min-w-0 py-1 rounded-xl flex flex-col items-center justify-center text-[12px] font-bold transition-colors",
              dang ? "gd-xanh text-white shadow-nut" : "bg-trang border border-vien text-chu", la && !dang && "border-xanh text-xanh")}>
            <span className={gop(thu === 7 && !dang && "text-do-chu")}>{NHAN_THU[thu]}</span>
            <span className="text-[15px] font-extrabold leading-tight">{taoNgay(n).getDate()}</span>
            <span className={gop("size-1 rounded-full mt-0.5", soViec?.[n] ? (dang ? "bg-white" : "bg-xanh") : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}

/** Tiêu đề tuần có hai mũi tên chuyển tuần trước / sau. */
export function TieuDeTuan({ thuHai, onDoi }: { thuHai: string; onDoi: (thuHaiMoi: string) => void }) {
  const cn = congNgay(thuHai, 6);
  const f = (n: string) => `${taoNgay(n).getDate()}/${taoNgay(n).getMonth() + 1}`;
  return (
    <div className="flex items-center justify-between">
      <button type="button" aria-label="Tuần trước" onClick={() => onDoi(congNgay(thuHai, -7))} className="size-11 grid place-items-center rounded-full bg-trang border border-vien"><ChevronLeft size={20} /></button>
      <span className="text-[14px] font-bold text-muc">Tuần {f(thuHai)} – {f(cn)}</span>
      <button type="button" aria-label="Tuần sau" onClick={() => onDoi(congNgay(thuHai, 7))} className="size-11 grid place-items-center rounded-full bg-trang border border-vien"><ChevronRight size={20} /></button>
    </div>
  );
}
