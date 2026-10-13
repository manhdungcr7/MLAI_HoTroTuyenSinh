// Khung duy nhất của CMS: menu bên (máy tính), thanh dưới (điện thoại), đầu trang và vùng nội dung.
import type { ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ClipboardCheck, School, ShieldCheck, ExternalLink, UserCheck, Shield, LayoutDashboard, Settings, UploadCloud, type LucideIcon,
} from "lucide-react";
import { CAC_TAB } from "@cms/duong-dan";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import { KhungPhien, usePhien } from "@cms/trang-thai/phien";
import { NutTaiKhoan } from "@cms/trang-thai/dang-nhap";

const ICON_TAB: Record<(typeof CAC_TAB)[number]["id"], LucideIcon> = {
  tongQuan: LayoutDashboard,
  truong: School,
  duyet: ClipboardCheck,
  xuatBan: UploadCloud,
  heThong: Settings,
};

/** Các mục menu người này được thấy: cộng tác viên không có Xuất bản và Hệ thống. */
function useCacTab() {
  const { laQtv } = usePhien();
  return CAC_TAB.filter((t) => laQtv || !t.chiQtv);
}

function TheNguoiDung() {
  const { toi, laQtv } = usePhien();
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={gop("size-8 rounded-lg grid place-items-center text-white shrink-0", laQtv ? "bg-xanh" : "bg-luc")}>
        {laQtv ? <Shield size={16} strokeWidth={2.5} /> : <UserCheck size={16} strokeWidth={2.5} />}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-muc truncate">{toi.email}</p>
        <p className={gop("text-[11px] font-extrabold leading-none mt-0.5", laQtv ? "text-xanh" : "text-luc-chu")}>
          {laQtv ? "Quản trị viên" : "Cộng tác viên"}
        </p>
      </div>
    </div>
  );
}

function SidebarDesktop() {
  const { pathname } = useLocation();
  const tabs = useCacTab();
  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-trang border-r border-vien shrink-0 sticky top-0 h-screen select-none z-30">
      <div className="p-5 border-b border-vien space-y-4">
        <Logo />
        <div className="p-3 rounded-xl bg-nen border border-vien space-y-2"><TheNguoiDung /><NutTaiKhoan /></div>
      </div>
      <nav aria-label="Điều hướng chính" className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        {tabs.map((t) => {
          const dang = t.khop(pathname);
          const Icon = ICON_TAB[t.id];
          return (
            <Link key={t.id} to={t.den} aria-current={dang ? "page" : undefined}
              className={gop("flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-[14px] transition-colors",
                dang ? "bg-xanh text-white" : "text-chu hover:bg-nen hover:text-muc")}>
              <Icon size={19} strokeWidth={dang ? 2.5 : 2} className={dang ? "text-white" : "text-chu-phu"} />
              <span className="flex-1">{t.nhan}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-vien text-[12px]">
        <a href="/" target="_blank" rel="noreferrer"
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-trang border border-vien text-chu hover:text-xanh font-bold transition-colors">
          <span>Xem web học sinh</span>
          <ExternalLink size={14} className="text-chu-phu" />
        </a>
      </div>
    </aside>
  );
}

function ThanhDuoiMobile() {
  const { pathname } = useLocation();
  const tabs = useCacTab();
  return (
    <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-trang border-t border-vien vung-an-toan-duoi">
      <ul className="flex px-1 py-1">
        {tabs.map((t) => {
          const dang = t.khop(pathname);
          const Icon = ICON_TAB[t.id];
          return (
            <li key={t.id} className="flex-1 min-w-0">
              <Link to={t.den} aria-current={dang ? "page" : undefined}
                className={gop("min-h-[52px] py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold select-none",
                  dang ? "text-xanh font-bold" : "text-chu-phu active:bg-nen")}>
                <span className={gop("px-3 py-0.5 rounded-full", dang && "bg-xanh-nhat")}>
                  <Icon size={19} strokeWidth={dang ? 2.5 : 1.8} />
                </span>
                <span className="leading-tight text-center truncate max-w-full px-0.5">{t.nhanNgan}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DauMobile() {
  const { toi, laQtv } = usePhien();
  return (
    <header className="md:hidden sticky top-0 z-30 bg-trang border-b border-vien px-4 py-2.5 flex items-center justify-between gap-2">
      <Logo nho />
      <span title={toi.email} aria-label={laQtv ? "Quản trị viên" : "Cộng tác viên"} className={gop("px-2.5 py-1 rounded-full font-extrabold text-xs flex items-center gap-1 shrink-0",
        laQtv ? "bg-xanh-nhat text-xanh" : "bg-luc-nhat text-luc-chu")}>
        {laQtv ? <Shield size={12} /> : <UserCheck size={12} />}
        <span className="hidden min-[430px]:inline">{laQtv ? "Quản trị viên" : "Cộng tác viên"}</span>
      </span>
      <NutTaiKhoan />
    </header>
  );
}

/** Khung có menu. Chỉ hiện sau khi máy chủ xác nhận bạn là ai. */
export function KhungCoThanhDuoi() {
  return (
    <KhungPhien>
      <div className="khung-ung-dung min-h-screen antialiased flex flex-col md:flex-row bg-nen">
        <SidebarDesktop />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <DauMobile />
          <div className="flex-1 pb-24 md:pb-12 max-w-5xl w-full mx-auto"><Outlet /></div>
        </div>
        <ThanhDuoiMobile />
      </div>
    </KhungPhien>
  );
}

export function Logo({ nho }: { nho?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-extrabold text-muc tracking-tight min-w-0">
      <span className="size-7 rounded-lg bg-xanh text-white grid place-items-center shrink-0">
        <ShieldCheck size={16} strokeWidth={2.5} />
      </span>
      <span className={gop("truncate", nho ? "text-[14px]" : "text-[15px]")}>Quản trị Nguyện Vọng</span>
    </span>
  );
}

/** Đầu trang của mục. `moTa` là MỘT câu: trang này để làm gì. `tiepTheo` là việc nên làm tiếp. */
export function DauTrangChinh({ tieuDe, moTa, phai }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode }) {
  return (
    <header className="px-4 md:px-6 pt-3.5 md:pt-6 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] md:text-[24px] leading-tight font-extrabold text-muc tracking-tight">{tieuDe}</h1>
          {moTa && <p className="text-[13px] md:text-[14px] text-chu-phu mt-0.5 leading-snug">{moTa}</p>}
        </div>
        {phai && <div className="shrink-0">{phai}</div>}
      </div>
    </header>
  );
}

/** Đầu trang con: nút quay lại cao 44px, tiêu đề ở giữa. */
export function DauTrangCoQuayLai({ tieuDe, quayLai, phai, moTa }: { tieuDe: string; quayLai?: string; phai?: ReactNode; moTa?: string }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 md:top-0 z-30 bg-nen border-b border-vien/80 px-2 md:px-6 min-h-[52px] md:min-h-[58px] flex items-center gap-2">
      <button type="button" onClick={() => (quayLai ? nav(quayLai) : nav(-1))} aria-label="Quay lại"
        className="size-11 grid place-items-center rounded-xl text-chu hover:bg-trang active:bg-xanh-nhat transition-colors shrink-0">
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
      <div className="flex-1 min-w-0 py-1 md:px-2">
        <h1 className="text-[15px] md:text-[17px] font-extrabold text-muc truncate leading-tight">{tieuDe}</h1>
        {moTa && <p className="text-[12px] text-chu-phu truncate leading-none mt-0.5">{moTa}</p>}
      </div>
      <div className="shrink-0 flex justify-end">{phai}</div>
    </header>
  );
}

export function NoiDung({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={gop("px-4 md:px-6 pb-6 space-y-4 hien-len", className)}>{children}</main>;
}
