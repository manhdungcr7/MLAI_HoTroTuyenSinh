import React from "react";
import Link from "@/components/navigation/HashLink";
import { usePathname } from "@/routes";
import { Search, Building2, GraduationCap, TrendingUp } from "lucide-react";
import { MAIN_NAV_ITEMS } from "@/components/layout/Sidebar";

const TABS = [
  { href: "/start", label: "Tìm ngành", icon: Search },
  { href: "/options", label: "Khám phá", icon: Building2 },
  { href: "/portfolio", label: "Nguyện vọng", icon: GraduationCap },
  { href: "/analysis", label: "Cải thiện", icon: TrendingUp },
] as const;

/** Thanh điều hướng dưới cùng trên điện thoại: bốn bước chính của luồng, kèm số nguyện vọng đã chọn. */
export function MobileTabBar({ wishlistCount }: { wishlistCount: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    const item = MAIN_NAV_ITEMS.find((n) => n.href === href);
    return Boolean(item?.matchPaths?.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"))));
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
              active ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {href === "/portfolio" && wishlistCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[9px] font-black leading-4 text-white">
                  {wishlistCount}
                </span>
              )}
            </span>
            {label}
            {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-blue-600" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
