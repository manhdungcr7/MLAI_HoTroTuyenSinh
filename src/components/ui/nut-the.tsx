import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ToneTen } from "@/state/types";

export const gop = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type Tone = ToneTen | "trung";

/** Nền nhạt, màu chữ trên nền nhạt, và gradient đậm cho từng tông. Dùng các bảng này, đừng tự đặt màu. */
export const TONE_NEN: Record<Tone, string> = {
  xanh: "bg-xanh-nhat", luc: "bg-luc-nhat", cam: "bg-cam-nhat", do: "bg-do-nhat", tim: "bg-tim-nhat", muc: "bg-xanh-nhat", trung: "bg-trang",
};
export const TONE_CHU: Record<Tone, string> = {
  xanh: "text-xanh", luc: "text-luc-chu", cam: "text-cam-chu", do: "text-do-chu", tim: "text-tim-chu", muc: "text-muc", trung: "text-chu-phu",
};
export const TONE_GD: Record<ToneTen, string> = { xanh: "gd-xanh", luc: "gd-luc", cam: "gd-cam", tim: "gd-tim", do: "gd-do", muc: "gd-muc" };
export const TONE_NEN_HERO: Record<ToneTen, string> = { xanh: "nen-xanh", luc: "nen-luc", cam: "nen-cam", tim: "nen-tim", do: "nen-do", muc: "nen-xanh" };
export const TONE_VIEN: Record<ToneTen, string> = { xanh: "border-xanh/30", luc: "border-luc/30", cam: "border-cam/40", tim: "border-tim/30", do: "border-do/30", muc: "border-muc/20" };

type KieuNut = "chinh" | "vien" | "nhe" | "nguyHiem";
const KIEU_NUT: Record<KieuNut, string> = {
  chinh: "gd-xanh text-white shadow-nut active:brightness-95",
  vien: "bg-trang text-xanh border border-xanh/40 active:bg-xanh-nhat",
  nhe: "bg-xanh-nhat text-xanh active:brightness-95",
  nguyHiem: "bg-trang text-do-chu border border-do/50 active:bg-do-nhat",
};

interface NutProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kieu?: KieuNut;
  bieuTuong?: LucideIcon;
  muiTen?: boolean;
  rong?: boolean;
}
/** Nút bấm. Cao tối thiểu 48px. Chữ nút tối đa 2–3 chữ khi đặt hai nút cạnh nhau. */
export function Nut({ kieu = "chinh", bieuTuong: Icon, muiTen, rong = true, className, children, type = "button", ...p }: NutProps) {
  return (
    <button
      type={type}
      {...p}
      className={gop(
        "min-h-12 px-3.5 py-2.5 rounded-xl font-bold text-[15px] inline-flex items-center justify-center gap-2 transition active:scale-[.99] disabled:opacity-50 disabled:pointer-events-none text-center select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh focus-visible:ring-offset-2",
        rong && "w-full", KIEU_NUT[kieu], className,
      )}
    >
      {Icon && <Icon size={18} strokeWidth={2.4} className="shrink-0" />}
      <span className="truncate inline-block max-w-full">{children}</span>
      {muiTen && <ChevronRight size={18} strokeWidth={2.6} className="shrink-0" />}
    </button>
  );
}

interface TheProps extends HTMLAttributes<HTMLDivElement> { tone?: Tone; vien?: boolean }
/** Thẻ nội dung. tone="trung" là thẻ trắng có viền; các tông còn lại là nền nhạt. */
export function The({ tone = "trung", vien = true, className, ...p }: TheProps) {
  return <div {...p} className={gop("rounded-the p-4", TONE_NEN[tone], vien && tone === "trung" && "border border-vien shadow-the", className)} />;
}

export function Nhan({ tone = "xanh", children, className }: { tone?: ToneTen; children: ReactNode; className?: string }) {
  return <span className={gop("inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-bold whitespace-nowrap", TONE_NEN[tone], TONE_CHU[tone], className)}>{children}</span>;
}

/** Hàng bấm được: biểu tượng tròn bên trái, mũi tên bên phải. */
export function HangBam({ bieuTuong: Icon, tone = "xanh", tieuDe, phu, nhan, onClick, className }: {
  bieuTuong?: LucideIcon; tone?: ToneTen; tieuDe: ReactNode; phu?: ReactNode; nhan?: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={gop("w-full min-h-14 flex items-center gap-3 rounded-the bg-trang border border-vien shadow-the px-3 py-2.5 text-left active:bg-xanh-nhat transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh", className)}>
      {Icon && <span className={gop("size-10 rounded-xl grid place-items-center shrink-0", TONE_NEN[tone], TONE_CHU[tone])}><Icon size={20} /></span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-chu leading-snug">{tieuDe}</span>
        {phu && <span className="block text-[13px] text-chu-phu leading-snug">{phu}</span>}
      </span>
      {nhan}
      <ChevronRight size={18} className="text-chu-phu shrink-0" />
    </button>
  );
}
