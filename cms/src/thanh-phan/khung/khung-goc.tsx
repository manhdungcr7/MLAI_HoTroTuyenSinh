// BỘ KHUNG DUY NHẤT của CMS.
import { type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChartNoAxesColumn, ClipboardCheck, School, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { CAC_TAB } from "@cms/duong-dan";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import { DangDungDuLieuMau } from "@cms/trang-thai/phien";

const ICON_TAB: Record<(typeof CAC_TAB)[number]["id"], LucideIcon> = {
  truong: School, duyet: ClipboardCheck, tienDo: ChartNoAxesColumn, toi: UserRound,
};

/** Khung có thanh 4 mục ở dưới. Mọi màn của CMS nằm trong khung này. */
export function KhungCoThanhDuoi() {
  const { pathname } = useLocation();
  return (
    <div className="khung-ung-dung min-h-screen pb-24 md:pb-28 antialiased">
      <DangDungDuLieuMau />
      <Outlet />
      <nav aria-label="Điều hướng chính" className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[430px] md:max-w-[600px] bg-trang/95 backdrop-blur-none border-t border-vien shadow-[0_-2px_10px_rgba(0,0,0,0.03)] vung-an-toan-duoi">
        <ul className="grid grid-cols-4 px-1">
          {CAC_TAB.map((t) => {
            const dang = t.khop(pathname);
            const Icon = ICON_TAB[t.id];
            return (
              <li key={t.id}>
                <Link
                  to={t.den}
                  aria-current={dang ? "page" : undefined}
                  className={gop(
                    "min-h-[58px] py-1.5 flex flex-col items-center justify-center gap-1 text-[11.5px] font-semibold transition-colors select-none",
                    dang ? "text-xanh font-bold" : "text-chu-phu hover:text-chu active:bg-nen/60"
                  )}
                >
                  <span className={gop(
                    "px-3.5 py-1 rounded-full flex items-center justify-center transition-all",
                    dang ? "bg-xanh-nhat text-xanh" : "text-chu-phu"
                  )}>
                    <Icon size={20} strokeWidth={dang ? 2.5 : 1.8} />
                  </span>
                  <span className="leading-none">{t.nhan}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function KhungKhongThanh() {
  return <div className="khung-ung-dung min-h-screen antialiased"><Outlet /></div>;
}

export function Logo({ nho }: { nho?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold text-muc tracking-tight">
      <span className="size-7 rounded-lg gd-xanh text-white grid place-items-center shadow-xs">
        <ShieldCheck size={16} strokeWidth={2.5} />
      </span>
      <span className={nho ? "text-[13.5px] font-bold text-chu" : "text-[15px] font-extrabold text-muc"}>
        Nguyện Vọng CMS
      </span>
    </span>
  );
}

/** Đầu trang CỦA MỤC (trang gốc): logo + tiêu đề lớn, tối ưu không rớt dòng. */
export function DauTrangChinh({ tieuDe, moTa, phai }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode }) {
  return (
    <header className="px-4 pt-3.5 pb-2">
      <div className="flex items-center justify-between">
        <Logo nho />
        {phai}
      </div>
      <div className="mt-2.5 min-w-0">
        <h1 className="text-[22px] md:text-[24px] leading-tight font-extrabold text-muc tracking-tight">{tieuDe}</h1>
        {moTa && <p className="text-[13px] text-chu-phu mt-0.5 leading-snug">{moTa}</p>}
      </div>
    </header>
  );
}

/** Đầu trang CON: nút quay lại, tiêu đề giữa, tối ưu touch 44px. */
export function DauTrangCoQuayLai({ tieuDe, quayLai, phai, moTa }: { tieuDe: string; quayLai?: string; phai?: ReactNode; moTa?: string }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-nen border-b border-vien/80 px-2 min-h-[52px] flex items-center gap-2 shadow-2xs">
      <button
        type="button"
        onClick={() => (quayLai ? nav(quayLai) : nav(-1))}
        aria-label="Quay lại"
        className="size-11 grid place-items-center rounded-xl text-chu hover:bg-trang active:bg-xanh-nhat transition-colors shrink-0"
      >
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
      <div className="flex-1 min-w-0 text-center py-1">
        <h1 className="text-[15px] font-extrabold text-muc truncate leading-tight">{tieuDe}</h1>
        {moTa && <p className="text-[11.5px] text-chu-phu truncate leading-none mt-0.5">{moTa}</p>}
      </div>
      <div className="min-w-[44px] flex justify-end shrink-0">
        {phai}
      </div>
    </header>
  );
}

export function NoiDung({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={gop("px-4 pb-6 space-y-3.5 hien-len", className)}>{children}</main>;
}

