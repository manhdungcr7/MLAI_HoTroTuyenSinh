import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { ToneTen } from "@/state/types";
import { Nut, TONE_GD, gop } from "./nut-the";

const MAU_THANH: Record<ToneTen, string> = { xanh: "bg-xanh", luc: "bg-luc", cam: "bg-cam", do: "bg-do", tim: "bg-tim", muc: "bg-muc" };
const MAU_VONG: Record<ToneTen, string> = { xanh: "stroke-xanh", luc: "stroke-luc", cam: "stroke-cam", do: "stroke-do", tim: "stroke-tim", muc: "stroke-muc" };

export function ThanhTienDo({ phanTram, tone = "xanh", cao = "h-2", nhan = "Tiến độ" }: { phanTram: number; tone?: ToneTen; cao?: string; nhan?: string }) {
  return (
    <div className={gop("w-full rounded-full bg-vien overflow-hidden", cao)} role="progressbar" aria-label={nhan} aria-valuenow={Math.round(phanTram)} aria-valuemin={0} aria-valuemax={100}>
      <div className={gop("h-full rounded-full transition-all", MAU_THANH[tone])} style={{ width: `${Math.min(100, Math.max(0, phanTram))}%` }} />
    </div>
  );
}

export function VongTienDo({ phanTram, kichThuoc = 84, tone = "luc" }: { phanTram: number; kichThuoc?: number; tone?: ToneTen }) {
  const r = (kichThuoc - 12) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: kichThuoc, height: kichThuoc }}>
      <svg width={kichThuoc} height={kichThuoc} className="-rotate-90" aria-hidden>
        <circle cx={kichThuoc / 2} cy={kichThuoc / 2} r={r} className="stroke-vien" strokeWidth={9} fill="none" />
        <circle cx={kichThuoc / 2} cy={kichThuoc / 2} r={r} className={MAU_VONG[tone]} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - phanTram / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[19px] font-extrabold text-muc">{Math.round(phanTram)}%</span>
    </div>
  );
}

export function TieuDeMuc({ children, phai }: { children: ReactNode; phai?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-1">
      <h2 className="text-[16px] font-extrabold text-muc">{children}</h2>
      {phai && <span className="text-[13px] font-bold text-xanh">{phai}</span>}
    </div>
  );
}

/** Trạng thái trống: chưa có dữ liệu. Luôn nói rõ vì sao trống và làm gì tiếp. */
export function TrangThaiTrong({ bieuTuong, tieuDe, moTa, children }: { bieuTuong: ReactNode; tieuDe: string; moTa: string; children?: ReactNode }) {
  return (
    <div className="rounded-lon border border-dashed border-xanh/30 bg-trang p-6 text-center">
      <div className="mx-auto size-14 rounded-full gd-xanh text-white grid place-items-center mb-3">{bieuTuong}</div>
      <p className="font-extrabold text-muc text-[16px]">{tieuDe}</p>
      <p className="text-[14px] text-chu-phu mt-1 mb-4">{moTa}</p>
      {children}
    </div>
  );
}

/** Trạng thái đang tải: khối xám nhấp nháy theo chiều cao truyền vào. */
export function KhungDangTai({ cao = "h-24", soKhung = 1 }: { cao?: string; soKhung?: number }) {
  return <div className="space-y-3" aria-busy="true" aria-label="Đang tải">{Array.from({ length: soKhung }, (_, i) => <div key={i} className={gop("dang-tai", cao)} />)}</div>;
}

/** Trạng thái lỗi: nói thật chuyện gì sai và cho thử lại. */
export function KhungLoi({ tieuDe = "Chưa tải được", moTa, thuLai }: { tieuDe?: string; moTa: string; thuLai?: () => void }) {
  return (
    <div role="alert" className="rounded-the bg-do-nhat p-4 text-center">
      <AlertTriangle className="mx-auto text-do mb-1" />
      <p className="font-extrabold text-do-chu">{tieuDe}</p>
      <p className="text-[13px] text-chu my-1">{moTa}</p>
      {thuLai && <Nut kieu="nguyHiem" rong={false} className="mt-2" onClick={thuLai}>Thử lại</Nut>}
    </div>
  );
}

/** Hộp trượt từ dưới lên, thuận tay cầm điện thoại. */
export function HopTruot({ mo, dong, tieuDe, children }: { mo: boolean; dong: () => void; tieuDe: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!mo || !dialog) return;
    const truoc = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = truoc; };
  }, [mo]);
  if (!mo) return null;
  return (
    <dialog ref={ref} aria-label={tieuDe} aria-modal="true" onCancel={(e) => { e.preventDefault(); dong(); }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const ds = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(x => x.getClientRects().length > 0);
        const dau = ds[0], cuoi = ds.at(-1);
        if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi?.focus(); }
        if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau?.focus(); }
      }}
      className="fixed inset-0 z-50 m-0 h-dvh w-screen max-w-none max-h-none border-0 p-0 open:flex items-end sm:items-center justify-center bg-muc/50 backdrop-blur-sm sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) dong(); }}>
      <div onClick={(e) => e.stopPropagation()}
        className="hien-len w-full max-w-[430px] sm:max-w-[480px] max-h-[88dvh] overflow-y-auto bg-trang rounded-t-lon sm:rounded-2xl p-5 vung-an-toan-duoi shadow-lon">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[18px] font-extrabold text-muc">{tieuDe}</h3>
          <button type="button" onClick={dong} aria-label="Đóng" className="size-11 grid place-items-center rounded-full bg-nen cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh"><X size={20} /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** Con số lớn kèm nhãn nhỏ, dùng cho điểm hiện tại / mục tiêu / còn thiếu. */
export function SoLon({ nhan, so, don, tone = "muc" }: { nhan: string; so: string; don?: string; tone?: ToneTen }) {
  const mau: Record<ToneTen, string> = { xanh: "text-xanh", luc: "text-luc-chu", cam: "text-cam-chu", do: "text-do-chu", tim: "text-tim-chu", muc: "text-muc" };
  return (
    <span className="block">
      <span className="block text-[12px] text-chu-phu">{nhan}</span>
      <b className={gop("text-[24px] leading-tight font-extrabold", mau[tone])}>{so}</b>
      {don && <span className="text-[13px] text-chu-phu"> {don}</span>}
    </span>
  );
}

export { TONE_GD };
