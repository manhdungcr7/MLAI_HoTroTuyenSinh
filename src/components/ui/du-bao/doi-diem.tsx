// "Đổi điểm": xem thử điểm khác ngay trong khối dự báo. Chỉ là trạng thái cục bộ của cha, không ghi vào hồ sơ.
import { useId } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { Nut } from "@/components/ui/nut-the";
import { NHAN_XEM_THU } from "@/noi-dung/du-bao";

const BUOC = 0.25;
const lam = (n: number) => Math.round(n * 4) / 4;

export function BoDoiDiem({ gia, nho, lon, goc, onDoi, moTaVT }: {
  gia: number; nho: number; lon: number;
  /** Điểm thật của em (null nếu chưa có): để hiện nút "Về điểm của em". */
  goc: number | null; onDoi: (v: number) => void; moTaVT: string;
}) {
  const id = useId();
  const dat = (v: number) => onDoi(Math.min(lon, Math.max(nho, lam(v))));
  const nutTron = "size-11 shrink-0 grid place-items-center rounded-full border border-vien bg-trang text-xanh cursor-pointer active:bg-xanh-nhat disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";
  return (
    <div className="rounded-xl bg-nen p-3 space-y-2">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[14px] font-bold text-muc">
        <span>Đổi điểm để xem thử</span><span className="text-tim-chu tabular-nums">{dinhDangDiem(gia)} điểm</span>
      </label>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Giảm 0,25 điểm" className={nutTron} disabled={gia <= nho} onClick={() => dat(gia - BUOC)}><Minus size={18} /></button>
        <input id={id} type="range" min={nho} max={lon} step={BUOC} value={gia} onChange={(e) => dat(Number(e.target.value))}
          aria-valuetext={moTaVT} className="flex-1 min-w-0 h-11 accent-tim cursor-pointer" />
        <button type="button" aria-label="Tăng 0,25 điểm" className={nutTron} disabled={gia >= lon} onClick={() => dat(gia + BUOC)}><Plus size={18} /></button>
      </div>
      <p className="text-[13px] text-chu-phu leading-snug">{NHAN_XEM_THU}</p>
      {goc !== null && gia !== goc && <Nut kieu="vien" bieuTuong={RotateCcw} rong={false} onClick={() => onDoi(goc)}>Về điểm của em</Nut>}
    </div>
  );
}
