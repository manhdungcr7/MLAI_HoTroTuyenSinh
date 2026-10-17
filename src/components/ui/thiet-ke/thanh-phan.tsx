// Primitive nền thiết kế 2027. Tài liệu: docs/THIET-KE-2027.md. Chỉ dùng token + class gd-*/the-*; không hex, không gradient tay.
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, GraduationCap, type LucideIcon } from "lucide-react";
import { DUONG_DAN } from "@/duong-dan";
import type { ToneTen } from "@/state/types";
import { gop } from "../nut-the";
import { mauTheoTong, type TongPill } from "./mau-nghia";
import { giamChuyenDong, useHienKhiVaoMan } from "./chuyen-dong";
import { useHieuUngPhatSang } from "./phat-sang";

/* ---------- PillTrangThai ---------- */
export function PillTrangThai({ tong = "xanh", icon: Icon, children, className }: { tong?: TongPill; icon?: LucideIcon; children: ReactNode; className?: string }) {
  const m = mauTheoTong(tong);
  return (
    <span className={gop("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-bold leading-tight whitespace-nowrap", m.nen, m.chu, className)}>
      {Icon && <Icon size={14} strokeWidth={2.4} aria-hidden />}{children}
    </span>
  );
}

/* ---------- ChipLoc + HangChipLoc ---------- */
export function ChipLoc({ chon, onClick, icon: Icon, children, dem }: { chon?: boolean; onClick?: () => void; icon?: LucideIcon; children: ReactNode; dem?: number }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={!!chon}
      className={gop("nay-nhe min-h-11 px-3.5 rounded-lg text-[14px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors",
        chon ? "gd-chip-chon" : "o-mem text-chu active:bg-xanh-nhat")}>
      {Icon && <Icon size={16} strokeWidth={2.2} aria-hidden />}{children}
      {dem !== undefined && <span className={gop("text-[13px]", chon ? "text-white/90" : "text-chu-phu")}>({dem})</span>}
    </button>
  );
}
/** Hàng chip cuộn ngang, bắt dính (snap), ẩn thanh cuộn. */
export function HangChipLoc({ children, nhan }: { children: ReactNode; nhan: string }) {
  return <div role="group" aria-label={nhan} className="flex gap-2 overflow-x-auto an-thanh-cuon cuon-snap-x -mx-4 px-4 py-1">{children}</div>;
}

/* ---------- ONhom ---------- */
export type TongNhom = "cam" | "xanh" | "tim" | "luc" | "ngoc" | "sanHo";
const NHOM: Record<TongNhom, { nen: string; chu: string }> = {
  cam: { nen: "gd-nhom-cam", chu: "text-cam-chu" }, xanh: { nen: "gd-nhom-xanh", chu: "text-xanh-dam" }, tim: { nen: "gd-nhom-tim", chu: "text-tim-chu" },
  luc: { nen: "gd-nhom-luc", chu: "text-luc-chu" }, ngoc: { nen: "gd-nhom-ngoc", chu: "text-ngoc-chu" }, sanHo: { nen: "gd-nhom-san-ho", chu: "text-san-ho-chu" },
};
export const THU_TU_TONG_NHOM: TongNhom[] = ["cam", "xanh", "tim", "luc", "ngoc", "sanHo"];
export function ONhom({ icon: Icon, ten, soNganh, tong = "xanh", onClick }: { icon: LucideIcon; ten: string; soNganh: number | null; tong?: TongNhom; onClick?: () => void }) {
  const m = NHOM[tong];
  const Tag: ElementType = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick}
      className={gop("rounded-2xl p-2.5 min-h-[64px] text-left flex flex-col gap-1 min-w-0", m.nen, m.chu, onClick && "nay-nhe cursor-pointer")}>
      <Icon size={20} strokeWidth={2.2} aria-hidden />
      <span className="text-[13px] font-bold leading-tight line-clamp-1">{ten}</span>
      <span className="text-[13px] leading-tight">{soNganh === null ? "—" : `${soNganh} ngành`}</span>
    </Tag>
  );
}

/* ---------- HuyHieuTruong (giữ API cũ) ---------- */
const HUY: Record<ToneTen, string> = { xanh: "gd-huy-hieu-xanh", luc: "gd-huy-hieu-luc", cam: "gd-huy-hieu-cam", tim: "gd-huy-hieu-tim", do: "gd-huy-hieu-do", muc: "gd-huy-hieu-muc" };
export function HuyHieuTruong({ ten, tone = "xanh", kichThuoc = 44 }: { ten: string; tone?: ToneTen; kichThuoc?: number }) {
  const chu = ten.replace(/[^A-Za-zÀ-ỹ]/g, "").slice(0, 4).toUpperCase();
  return (
    <span aria-hidden className={gop("rounded-xl grid place-items-center text-white font-bold tracking-tight shrink-0 shadow-sm", HUY[tone])}
      style={{ width: kichThuoc, height: kichThuoc, fontSize: Math.max(10, kichThuoc * (chu.length > 3 ? 0.24 : 0.3)) }}>{chu}</span>
  );
}

/* ---------- TheNen ---------- */
/** phatSang: quầng sáng + nghiêng theo con trỏ (chỉ chuột). Mặc định tắt. */
export function TheNen({ tong, className, children, as: Tag = "div", phatSang = false, ...p }: { tong?: "xanh" | "luc" | "cam" | "tim" | "do"; className?: string; children: ReactNode; as?: ElementType; phatSang?: boolean; "aria-label"?: string }) {
  const ref = useRef<HTMLElement>(null);
  useHieuUngPhatSang(ref, phatSang);
  return <Tag {...p} ref={ref} className={gop("the-mem p-4", tong && `the-nen-nhe-${tong}`, phatSang && "phat-sang", className)}>{children}</Tag>;
}

/* ---------- TabPhan: segmented, chip active trượt ---------- */
export function TabPhan<T extends string>({ cacTab, gia, onChange, nhan }: { cacTab: { gia: T; nhan: string; icon?: LucideIcon }[]; gia: T; onChange: (g: T) => void; nhan: string }) {
  const n = cacTab.length, i = Math.max(0, cacTab.findIndex((t) => t.gia === gia));
  const phim = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (d) { e.preventDefault(); onChange(cacTab[(i + d + n) % n].gia); }
  };
  return (
    <div role="tablist" aria-label={nhan} onKeyDown={phim} className="relative flex rounded-2xl bg-trang p-1 border border-vien/60 shadow-the">
      <span aria-hidden className="chip-truot absolute top-1 bottom-1 left-1 rounded-xl gd-chip-chon"
        style={{ width: `calc((100% - 0.5rem) / ${n})`, transform: `translateX(${i * 100}%)` }} />
      {cacTab.map((t) => {
        const dang = t.gia === gia, Icon = t.icon;
        return (
          <button key={t.gia} type="button" role="tab" aria-selected={dang} tabIndex={dang ? 0 : -1} onClick={() => onChange(t.gia)}
            className={gop("relative z-10 flex-1 min-h-11 rounded-xl text-[13px] font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors", dang ? "text-white" : "text-chu-phu")}>
            {Icon && <Icon size={16} aria-hidden />}{t.nhan}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- ThanhTienDo: nhãn nổi, chạy từ 0 ---------- */
export function ThanhTienDo({ phanTram, tong = "xanh", nhanNoi, nhan = "Tiến độ" }: { phanTram: number | null; tong?: "xanh" | "luc" | "cam" | "tim" | "do"; nhanNoi?: string; nhan?: string }) {
  const [ref, hien] = useHienKhiVaoMan<HTMLDivElement>(0.3);
  const [chay, setChay] = useState(giamChuyenDong());
  useEffect(() => {
    if (!hien) return;
    const r = requestAnimationFrame(() => setChay(true));
    return () => cancelAnimationFrame(r);
  }, [hien]);
  const p = phanTram === null ? 0 : Math.min(100, Math.max(0, phanTram));
  const hienTai = chay ? p : 0;
  return (
    <div ref={ref} className="relative pt-7">
      {phanTram !== null && p > 0 && (
        <span aria-hidden className="tg-thanh absolute top-0 -translate-x-1/2 rounded-lg bg-muc px-2 py-0.5 text-[13px] font-bold text-white whitespace-nowrap"
          style={{ left: `${Math.min(88, Math.max(12, hienTai))}%` }}>{nhanNoi ?? `Đạt ${Math.round(p)}%`}</span>
      )}
      <div className="h-2.5 w-full rounded-full bg-vien/70 overflow-hidden" role="progressbar" aria-label={nhan}
        aria-valuenow={phanTram === null ? undefined : Math.round(p)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={phanTram === null ? "Chưa có số liệu" : `${Math.round(p)} phần trăm`}>
        <div className={gop("tg-thanh h-full rounded-full", `gd-thanh-${tong}`)} style={{ width: `${hienTai}%` }} />
      </div>
    </div>
  );
}

/* ---------- TieuDeMan: đầu trang tab (logo + chuông + tiêu đề lớn) ---------- */
export function TieuDeMan({ tieuDe, phuDe, phai, onChuong, chamChuong }: { tieuDe: ReactNode; phuDe?: string; phai?: ReactNode; onChuong?: () => void; chamChuong?: boolean }) {
  return (
    <header className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between">
        <Link to={DUONG_DAN.gioiThieu()} className="inline-flex items-center gap-2 min-h-11 text-muc">
          <span className="size-8 rounded-[10px] gd-huy-hieu-xanh text-white grid place-items-center"><GraduationCap size={18} aria-hidden /></span>
          <span className="so-lon text-[15px] font-bold">Nguyện Vọng AI</span>
        </Link>
        {onChuong && (
          <button type="button" aria-label="Nhắc nhở" onClick={onChuong} className="nay-nhe relative size-11 grid place-items-center rounded-full o-mem cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh">
            <Bell size={20} aria-hidden />{chamChuong && <span aria-hidden className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-do ring-2 ring-trang" />}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight text-muc">{tieuDe}</h1>
          {phuDe && <p className="text-[14px] text-chu-phu mt-1">{phuDe}</p>}
        </div>
        {phai}
      </div>
    </header>
  );
}

/* ---------- ToastNho ---------- */
export function ToastNho({ mo, noiDung, hoanTac, dong, thoiGian = 5000 }: { mo: boolean; noiDung: string; hoanTac?: () => void; dong: () => void; thoiGian?: number }) {
  useEffect(() => {
    if (!mo) return;
    const t = setTimeout(dong, thoiGian);
    return () => clearTimeout(t);
  }, [mo, noiDung, thoiGian, dong]);
  if (!mo) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] z-[60] mx-auto max-w-[430px] px-4 pointer-events-none">
      <div className="toast-vao pointer-events-auto flex items-center gap-3 rounded-2xl bg-muc text-white pl-4 pr-1 min-h-12 shadow-md">
        <span className="flex-1 text-[14px] py-2">{noiDung}</span>
        {hoanTac && <button type="button" onClick={() => { hoanTac(); dong(); }} className="min-h-11 px-3 rounded-xl text-[14px] font-bold text-da-quang cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Hoàn tác</button>}
      </div>
    </div>
  );
}

/** Biến thể nền trang trời sáng. Màu nằm trong index.css (.nen-trang-troi*). */
export type BienTheNen = "xanh" | "am" | "luc" | "tim";
const LOP_NEN: Record<BienTheNen, string> = { xanh: "nen-trang-troi", am: "nen-trang-troi-am", luc: "nen-trang-troi-luc", tim: "nen-trang-troi-tim" };

/** Đặt một lần ở đầu màn: khung ứng dụng nhận nền trời sáng nhiều lớp (đổi bienThe để đổi tông). */
export function NenTrangTroi({ bienThe = "xanh" }: { bienThe?: BienTheNen }) {
  return <span className={`dau-nen-troi ${LOP_NEN[bienThe]}`} aria-hidden />;
}
