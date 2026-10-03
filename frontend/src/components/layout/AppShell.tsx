import React, { useState } from "react";
import Link from "@/components/navigation/HashLink";
import { usePathname, useRouter } from "@/routes";
import { Search, ListOrdered, GraduationCap, TrendingUp, Info, RotateCcw } from "lucide-react";
import { useApp } from "@/state/AppContext";

export const NAV = [
  { href: "/start", label: "Tìm ngành", icon: Search },
  { href: "/results", label: "Kết quả", icon: ListOrdered },
  { href: "/portfolio", label: "Nguyện vọng", icon: GraduationCap },
  { href: "/improve", label: "Cải thiện điểm", icon: TrendingUp },
] as const;

function Brand() {
  return (
    <Link href="/start" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900">
      <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-xl" />
      <span className="text-lg">Nguyện Vọng</span>
    </Link>
  );
}

/** Vỏ ứng dụng: thanh trên trên máy tính, thanh dưới trên điện thoại. Mỗi trang chỉ là một việc. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { wishlist, resetAll } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const active = (href: string) => pathname === href;

  const doReset = () => {
    resetAll();
    setConfirmReset(false);
    router.push("/start");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Brand />
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${active(href) ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {label}
                {href === "/portfolio" && wishlist.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{wishlist.length}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/about" aria-label="Thông tin" className={`rounded-lg p-2 transition ${active("/about") ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>
              <Info className="h-5 w-5" />
            </Link>
            <button type="button" onClick={() => setConfirmReset(true)} aria-label="Làm lại từ đầu" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 cursor-pointer">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 md:pb-12 md:pt-10">{children}</main>

      <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${active(href) ? "text-blue-600" : "text-slate-500"}`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {href === "/portfolio" && wishlist.length > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[9px] font-bold leading-4 text-white">{wishlist.length}</span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </nav>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Làm lại từ đầu">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-base font-semibold text-slate-900">Xóa toàn bộ điểm và danh sách nguyện vọng?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Giữ lại</button>
              <button type="button" onClick={doReset} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 cursor-pointer">Xóa và làm lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppShell;
