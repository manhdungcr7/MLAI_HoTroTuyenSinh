// BỘ KHUNG DUY NHẤT của CMS - Hỗ trợ Mobile và Desktop Sidebar chuẩn Responsive.
import { useState, useEffect, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChartNoAxesColumn, ClipboardCheck, School, ShieldCheck,
  UserRound, ExternalLink, RefreshCw, UserCheck, Shield, type LucideIcon
} from "lucide-react";
import { CAC_TAB } from "@cms/duong-dan";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import { DangDungDuLieuMau } from "@cms/trang-thai/phien";
import { chuyenDoiVaiTroMau, vaiTroMau, dangDungDuLieuMau } from "@cms/may-chu/che-do";

const ICON_TAB: Record<(typeof CAC_TAB)[number]["id"], LucideIcon> = {
  truong: School, duyet: ClipboardCheck, tienDo: ChartNoAxesColumn, toi: UserRound,
};

/** Sidebar cho màn hình máy tính (md: >= 768px) */
function SidebarDesktop() {
  const { pathname } = useLocation();
  const [vaiTro, setVaiTro] = useState(vaiTroMau());
  const giaLap = dangDungDuLieuMau();

  useEffect(() => {
    const handleDoi = () => setVaiTro(vaiTroMau());
    window.addEventListener("cms:vai-doi", handleDoi);
    return () => window.removeEventListener("cms:vai-doi", handleDoi);
  }, []);

  const handleToggleRole = () => {
    const moi = chuyenDoiVaiTroMau();
    setVaiTro(moi);
    window.location.reload();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-trang border-r border-vien shrink-0 sticky top-0 h-screen select-none z-30">
      {/* 1. Header & Logo */}
      <div className="p-5 border-b border-vien">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded bg-xanh-nhat text-xanh">v1.0</span>
        </div>

        {/* Thẻ người dùng & Vai trò */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-vien/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={gop(
                "size-8 rounded-lg grid place-items-center text-white shrink-0 shadow-2xs",
                vaiTro === "qtv" ? "bg-xanh" : "bg-luc"
              )}>
                {vaiTro === "qtv" ? <Shield size={16} strokeWidth={2.5} /> : <UserCheck size={16} strokeWidth={2.5} />}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-muc truncate">ban@nguyenvongai</p>
                <p className={gop("text-[11px] font-extrabold leading-none mt-0.5", vaiTro === "qtv" ? "text-xanh" : "text-luc-chu")}>
                  {vaiTro === "qtv" ? "Quản trị viên (QTV)" : "Tình nguyện viên (CTV)"}
                </p>
              </div>
            </div>
          </div>

          {giaLap && (
            <button
              type="button"
              onClick={handleToggleRole}
              title="Nhấn để đổi vai trò thử nghiệm"
              className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-trang hover:bg-xanh-nhat border border-vien text-[11.5px] font-bold text-chu flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className="text-xanh shrink-0" />
              <span>Đổi sang: {vaiTro === "qtv" ? "CTV" : "QTV"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Menu Điều Hướng Chính */}
      <nav aria-label="Điều hướng desktop" className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-chu-phu/70">Mục Quản Trị</p>
        {CAC_TAB.map((t) => {
          const dang = t.khop(pathname);
          const Icon = ICON_TAB[t.id];
          return (
            <Link
              key={t.id}
              to={t.den}
              aria-current={dang ? "page" : undefined}
              className={gop(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-[14px] transition-all",
                dang
                  ? "bg-xanh text-white shadow-xs font-extrabold"
                  : "text-chu hover:bg-nen hover:text-muc"
              )}
            >
              <Icon size={19} strokeWidth={dang ? 2.5 : 2} className={dang ? "text-white" : "text-chu-phu"} />
              <span className="flex-1">{t.nhan}</span>
              {t.id === "duyet" && vaiTro === "ctv" && (
                <span className={gop("text-[10px] font-extrabold px-1.5 py-0.5 rounded", dang ? "bg-white/20 text-white" : "bg-cam-nhat text-cam-chu")}>
                  QTV
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer Sidebar */}
      <div className="p-4 border-t border-vien bg-slate-50/70 text-[12px] space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-trang border border-vien text-chu hover:text-xanh font-bold transition-colors"
        >
          <span>Xem Web học sinh</span>
          <ExternalLink size={14} className="text-chu-phu" />
        </a>
        <div className="px-1 text-[11px] text-chu-phu leading-relaxed">
          <p>Hệ thống dữ liệu tuyển sinh 2026</p>
        </div>
      </div>
    </aside>
  );
}

/** Khung có thanh điều hướng: Mobile có thanh dưới, Desktop có Sidebar trái */
export function KhungCoThanhDuoi() {
  const { pathname } = useLocation();
  return (
    <div className="khung-ung-dung min-h-screen antialiased flex flex-col md:flex-row bg-nen">
      {/* Sidebar bên trái cho Laptop / Desktop */}
      <SidebarDesktop />

      {/* Vùng nội dung chính */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <DangDungDuLieuMau />
        <div className="flex-1 pb-24 md:pb-12 max-w-5xl w-full mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation chỉ hiện trên Mobile */}
      <nav aria-label="Điều hướng chính mobile" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-trang/95 backdrop-blur-none border-t border-vien shadow-[0_-2px_10px_rgba(0,0,0,0.03)] vung-an-toan-duoi">
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
    <header className="px-4 md:px-6 pt-3.5 md:pt-6 pb-2">
      <div className="flex items-center justify-between">
        <div className="md:hidden"><Logo nho /></div>
        <div className="hidden md:block" />
        {phai}
      </div>
      <div className="mt-2.5 min-w-0">
        <h1 className="text-[22px] md:text-[26px] leading-tight font-extrabold text-muc tracking-tight">{tieuDe}</h1>
        {moTa && <p className="text-[13px] md:text-[14px] text-chu-phu mt-0.5 leading-snug">{moTa}</p>}
      </div>
    </header>
  );
}

/** Đầu trang CON: nút quay lại, tiêu đề giữa, tối ưu touch 44px. */
export function DauTrangCoQuayLai({ tieuDe, quayLai, phai, moTa }: { tieuDe: string; quayLai?: string; phai?: ReactNode; moTa?: string }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-nen border-b border-vien/80 px-2 md:px-6 min-h-[52px] md:min-h-[60px] flex items-center gap-2 shadow-2xs">
      <button
        type="button"
        onClick={() => (quayLai ? nav(quayLai) : nav(-1))}
        aria-label="Quay lại"
        className="size-11 grid place-items-center rounded-xl text-chu hover:bg-trang active:bg-xanh-nhat transition-colors shrink-0"
      >
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>
      <div className="flex-1 min-w-0 text-center md:text-left py-1 md:px-2">
        <h1 className="text-[15px] md:text-[17px] font-extrabold text-muc truncate leading-tight">{tieuDe}</h1>
        {moTa && <p className="text-[11.5px] md:text-[12.5px] text-chu-phu truncate leading-none mt-0.5">{moTa}</p>}
      </div>
      <div className="min-w-[44px] flex justify-end shrink-0">
        {phai}
      </div>
    </header>
  );
}

export function NoiDung({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={gop("px-4 md:px-6 pb-6 space-y-4 hien-len", className)}>{children}</main>;
}


