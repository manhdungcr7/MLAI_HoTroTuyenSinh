// BỘ KHUNG DUY NHẤT của CMS. Tính năng không tự vẽ thanh dưới hay đầu trang, chỉ dùng các thành phần ở đây.
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
    <div className="khung-ung-dung pb-24">
      <DangDungDuLieuMau />
      <Outlet />
      <nav aria-label="Điều hướng chính" className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[430px] bg-trang border-t border-vien vung-an-toan-duoi">
        <ul className="grid grid-cols-4">
          {CAC_TAB.map((t) => {
            const dang = t.khop(pathname);
            const Icon = ICON_TAB[t.id];
            return (
              <li key={t.id}>
                <Link to={t.den} aria-current={dang ? "page" : undefined}
                  className={gop("min-h-16 flex flex-col items-center justify-center gap-0.5 text-[13px] font-bold", dang ? "text-xanh" : "text-chu-phu")}>
                  <Icon size={22} strokeWidth={dang ? 2.6 : 2} />
                  {t.nhan}
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
  return <div className="khung-ung-dung"><Outlet /></div>;
}

export function Logo({ nho }: { nho?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-extrabold text-muc">
      <span className="size-8 rounded-lg gd-xanh text-white grid place-items-center"><ShieldCheck size={18} /></span>
      <span className={nho ? "text-[14px]" : "text-[15px]"}>Quản trị Nguyện Vọng</span>
    </span>
  );
}

/** Đầu trang CỦA MỤC (trang gốc): logo + tiêu đề lớn. */
export function DauTrangChinh({ tieuDe, moTa, phai }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode }) {
  return (
    <header className="px-4 pt-3 pb-2">
      <Logo nho />
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-extrabold text-muc">{tieuDe}</h1>
          {moTa && <p className="text-[14px] text-chu-phu mt-1">{moTa}</p>}
        </div>
        {phai}
      </div>
    </header>
  );
}

/** Đầu trang CON: nút quay lại, tiêu đề giữa, ghi chú nhỏ hoặc nút ở bên phải. */
export function DauTrangCoQuayLai({ tieuDe, quayLai, phai }: { tieuDe: string; quayLai?: string; phai?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-nen border-b border-vien/60 grid grid-cols-[auto_1fr_auto] items-center min-h-14 px-3 gap-2">
      <button type="button" onClick={() => (quayLai ? nav(quayLai) : nav(-1))} aria-label="Quay lại" className="size-12 grid place-items-center rounded-full active:bg-xanh-nhat shrink-0"><ArrowLeft size={22} /></button>
      <h1 className="text-center text-[15px] font-extrabold text-muc line-clamp-2 leading-tight px-1">{tieuDe}</h1>
      <span className="min-w-[48px] text-right text-[13px] font-bold text-xanh whitespace-nowrap shrink-0">{phai}</span>
    </header>
  );
}

export function NoiDung({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={gop("px-4 pb-6 space-y-3 hien-len", className)}>{children}</main>;
}
