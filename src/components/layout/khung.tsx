// BỘ KHUNG DUY NHẤT. Slice không tự vẽ thanh dưới hay đầu trang, chỉ dùng các thành phần ở đây.
import { type CSSProperties, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, GraduationCap, Heart, Home, Search, UserRound, type LucideIcon } from "lucide-react";
import { CAC_MUC_KE_HOACH, CAC_TAB, DUONG_DAN } from "@/duong-dan";
import { gop } from "@/components/ui/nut-the";
import { BannerNgoaiTuyen } from "@/components/ui/du-bao/banner-ngoai-tuyen";
import { BannerKhongLuu } from "./banner-khong-luu";
import { ThongBaoYeuThich } from "./thong-bao-yeu-thich";
import { NutTroLyAI } from "@/features/tu-van/tro-ly-noi-bot";
import { ChuyenTrang, NenTrangTroi, TheoDoiLanNhan, TieuDeMan, type BienTheNen } from "@/components/ui/thiet-ke";
import { KetNoiNen } from "@/features/ket-noi/the-de-xuat";

const ICON_TAB: Record<(typeof CAC_TAB)[number]["id"], LucideIcon> = {
  homNay: Home, khamPha: Search, nguyenVong: Heart, keHoach: CalendarDays, hoSo: UserRound,
};

/** Khung có thanh 5 tab ở dưới. Dùng cho mọi trang trừ Chào mừng và các bước Bắt đầu. */
export function KhungCoThanhDuoi() {
  const { pathname } = useLocation();
  const iDang = CAC_TAB.findIndex((t) => t.khop(pathname));
  return (
    <div className="khung-ung-dung pb-[calc(var(--cao-nav)+4.25rem)]" style={{ "--cao-nav": "calc(4.5rem + env(safe-area-inset-bottom))" } as CSSProperties}>
      <BannerNgoaiTuyen />
      <BannerKhongLuu />
      <ChuyenTrang><Outlet /></ChuyenTrang>
      <ThongBaoYeuThich />
      <KetNoiNen />
      <NutTroLyAI />
      <TheoDoiLanNhan />
      <nav aria-label="Điều hướng chính" className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[430px] bg-trang nav-noi vung-an-toan-duoi">
        <div className="relative">
          {/* Viên chỉ báo duy nhất: trượt tới tab đang mở (--i), ẩn khi không thuộc tab nào. */}
          <span aria-hidden className="nav-chi-bao" style={{ "--i": Math.max(0, iDang), opacity: iDang < 0 ? 0 : 1 } as CSSProperties}>
            <span className="nav-chi-bao-hop nav-chip-dang" />
          </span>
          <ul className="grid grid-cols-5 px-1 pt-1">
            {CAC_TAB.map((t) => {
              const dang = t.khop(pathname);
              const Icon = ICON_TAB[t.id];
              return (
                <li key={t.id}>
                  <Link to={t.den} aria-current={dang ? "page" : undefined}
                    className={gop("nay-nhe relative min-h-16 flex flex-col items-center justify-start pt-2 gap-0.5 text-[11px] whitespace-nowrap cursor-pointer", dang ? "text-xanh-dam font-extrabold" : "text-chu-phu font-semibold hover:text-chu")}>
                    <span className={gop("nav-bieu-tuong grid place-items-center h-8 w-14 rounded-full", dang && "dang")}>
                      <Icon size={22} strokeWidth={dang ? 2.4 : 1.8} fill={dang && t.id === "nguyenVong" ? "currentColor" : "none"} aria-hidden />
                    </span>
                    {t.nhan}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export function KhungKhongThanh() {
  return (
    <div className="khung-ung-dung">
      <BannerNgoaiTuyen />
      <BannerKhongLuu />
      <Outlet />
      <ThongBaoYeuThich />
      <TheoDoiLanNhan />
      <NutTroLyAI khongThanh />
    </div>
  );
}

export function Logo({ nho }: { nho?: boolean }) {
  return (
    <Link to={DUONG_DAN.gioiThieu()} className="inline-flex items-center gap-1.5 min-h-11 font-extrabold text-muc hover:opacity-90 transition-opacity">
      <span className="size-8 rounded-lg gd-xanh text-white grid place-items-center"><GraduationCap size={18} /></span>
      <span className={gop("so-lon", nho ? "text-[14px]" : "text-[15px]")}>Nguyện Vọng AI</span>
    </Link>
  );
}

/** Đầu trang CỦA TAB (trang gốc): logo + chuông nhắc nhở + tiêu đề lớn. Dùng TieuDeMan của nền thiết kế. */
export function DauTrangChinh({ tieuDe, moTa, phai, bienThe }: { tieuDe: ReactNode; moTa?: string; phai?: ReactNode; bienThe?: BienTheNen }) {
  const nav = useNavigate();
  return (
    <>
      <NenTrangTroi bienThe={bienThe} />
      <TieuDeMan tieuDe={tieuDe} phuDe={moTa} phai={phai} onChuong={() => nav(DUONG_DAN.nhacNho())} />
    </>
  );
}

/** Đầu trang CON: nút quay lại, tiêu đề giữa, ghi chú nhỏ (ví dụ "Bước 2/3") hoặc nút ở bên phải. */
export function DauTrangCoQuayLai({ tieuDe, buoc, quayLai, phai }: { tieuDe: string; buoc?: string; quayLai?: string; phai?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-nen border-b border-vien/60 grid grid-cols-[auto_1fr_auto] items-center min-h-14 px-3 gap-2">
      <button type="button" onClick={() => (quayLai ? nav(quayLai) : nav(-1))} aria-label="Quay lại" className="size-11 grid place-items-center rounded-full active:bg-xanh-nhat shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh"><ArrowLeft size={22} /></button>
      <h1 className="text-center text-[15px] font-extrabold text-muc line-clamp-2 leading-tight px-1">{tieuDe}</h1>
      <span className="min-w-[44px] text-right text-[13px] font-bold text-xanh whitespace-nowrap shrink-0">{phai ?? buoc}</span>
    </header>
  );
}

/** 3 mục chuyển nhanh của tab Kế hoạch: Mục tiêu · Kế hoạch tuần · Tiến độ. Đặt ngay dưới đầu trang. */
export function ThanhPhuKeHoach() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Mục của Kế hoạch" className="px-4 pb-3">
      <ul className="flex bg-trang border border-vien rounded-xl p-1 gap-1">
        {CAC_MUC_KE_HOACH.map((m) => {
          const dang = m.khop(pathname);
          return (
            <li key={m.id} className="flex-1">
              <Link to={m.den} aria-current={dang ? "page" : undefined}
                className={gop("min-h-11 rounded-lg grid place-items-center text-[13px] font-bold transition-colors cursor-pointer", dang ? "bg-xanh text-white" : "text-chu-phu hover:text-chu active:bg-xanh-nhat")}>
                {m.nhan}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NoiDung({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={gop("px-4 pb-6 space-y-3 hien-len", className)}>{children}</main>;
}
