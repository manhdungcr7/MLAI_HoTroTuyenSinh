import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { gop } from "./nut-the";

export function Truong({ nhan, batBuoc, goiY, htmlFor, children }: { nhan: string; batBuoc?: boolean; goiY?: string; htmlFor?: string; children: ReactNode }) {
  if (htmlFor) {
    return (
      <fieldset className="border-none p-0 min-w-0">
        <label htmlFor={htmlFor} className="block text-[14px] font-bold text-chu mb-1.5 cursor-pointer">
          {nhan}{batBuoc && <span className="text-do"> *</span>}
        </label>
        {children}
        {goiY && <span className="block text-[12px] text-chu-phu mt-1">{goiY}</span>}
      </fieldset>
    );
  }
  return (
    <fieldset className="border-none p-0 min-w-0">
      <legend className="block text-[14px] font-bold text-chu mb-1.5">
        {nhan}{batBuoc && <span className="text-do"> *</span>}
      </legend>
      {children}
      {goiY && <span className="block text-[12px] text-chu-phu mt-1">{goiY}</span>}
    </fieldset>
  );
}

const KHUNG = "w-full min-h-12 rounded-xl border border-vien bg-white px-3 text-[15px] text-chu placeholder:text-chu-phu/70 focus:border-xanh";

export function OInput({ bieuTuong: Icon, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { bieuTuong?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu" />}
      <input {...p} className={gop(KHUNG, Icon && "pl-10", className)} />
    </div>
  );
}

export function OChon({ bieuTuong: Icon, className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { bieuTuong?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />}
      <select {...p} className={gop(KHUNG, "appearance-none pr-10", Icon && "pl-10", className)}>{children}</select>
      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-chu-phu pointer-events-none" />
    </div>
  );
}

/** Nút chọn dạng viên thuốc. Một lựa chọn hoặc nhiều lựa chọn. */
export function ChonNhanh<T extends string | number | boolean>({ cacLua, giaTri, onChange, nhieu, cot }: {
  cacLua: { gia: T; nhan: string }[];
  giaTri: T | T[] | null;
  onChange: (v: any) => void;
  nhieu?: boolean;
  cot?: 2 | 3;
}) {
  const dangChon = (g: T) => (nhieu ? (giaTri as T[]).includes(g) : giaTri === g);
  const bam = (g: T) => {
    if (!nhieu) return onChange(g);
    const a = giaTri as T[];
    onChange(a.includes(g) ? a.filter((x) => x !== g) : [...a, g]);
  };
  return (
    <div className={gop(cot ? (cot === 2 ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-2") : "flex flex-wrap gap-2")}>
      {cacLua.map((c) => {
        const chon = dangChon(c.gia);
        return (
          <button
            type="button" key={String(c.gia)} onClick={() => bam(c.gia)} aria-pressed={chon}
            className={gop(
              "min-h-12 px-3 rounded-xl border text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors",
              chon ? "bg-xanh-nhat border-xanh text-xanh" : "bg-white border-vien text-chu active:bg-xanh-nhat",
            )}
          >
            {c.nhan}
            {chon && <span className="size-4 rounded-full bg-xanh text-white grid place-items-center"><Check size={11} strokeWidth={4} /></span>}
          </button>
        );
      })}
    </div>
  );
}

export function OTich({ dang, onChange, nhan }: { dang: boolean; onChange: (v: boolean) => void; nhan: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={dang} onClick={() => onChange(!dang)} className="min-h-11 flex items-center gap-2 text-[14px] font-semibold text-chu">
      <span className={gop("size-6 rounded-md border grid place-items-center", dang ? "bg-xanh border-xanh text-white" : "bg-white border-vien")}>{dang && <Check size={15} strokeWidth={3.5} />}</span>
      {nhan}
    </button>
  );
}

export function CongTac({ dang, onChange, nhan }: { dang: boolean; onChange: (v: boolean) => void; nhan: string }) {
  return (
    <button type="button" role="switch" aria-checked={dang} aria-label={nhan} onClick={() => onChange(!dang)}
      className={gop("w-12 h-7 rounded-full p-0.5 transition-colors shrink-0", dang ? "bg-xanh" : "bg-chu-phu/40")}>
      <span className={gop("block size-6 rounded-full bg-white shadow transition-transform", dang && "translate-x-5")} />
    </button>
  );
}

/** Thanh chia 2-3 phần để chuyển nhanh giữa các màn cùng chủ đề. */
export function ThanhChuyen<T extends string>({ cacMuc, giaTri, onChange }: { cacMuc: { gia: T; nhan: string }[]; giaTri: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex bg-white border border-vien rounded-xl p-1 gap-1">
      {cacMuc.map((m) => (
        <button key={m.gia} role="tab" aria-selected={giaTri === m.gia} onClick={() => onChange(m.gia)}
          className={gop("flex-1 min-h-12 rounded-lg text-[13px] font-bold transition-colors", giaTri === m.gia ? "bg-xanh text-white" : "text-chu-phu")}>
          {m.nhan}
        </button>
      ))}
    </div>
  );
}
