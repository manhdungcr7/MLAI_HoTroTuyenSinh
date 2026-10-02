import React from "react";
import Link from "@/components/navigation/HashLink";
import { usePathname } from "@/routes";
import {
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Building2,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  FileCheck,
  X,
} from "lucide-react";
import { StudentProfile, TargetProgram, GapMetric } from "@/engine/types";

export interface NavItem {
  href: string;
  label: string;
  subLabel?: string;
  icon: React.ElementType;
  matchPaths?: string[];
}

// Điều hướng theo vòng quyết định (khớp bản live): Tổng quan → Hồ sơ → Phân tích năng lực
// → Khám phá trường → Xếp nguyện vọng → Kế hoạch học → Cách tính. Xem ba.md §6–§7.
// Đây là nguồn tên trang duy nhất — Topbar đọc tiêu đề từ đây (getNavTitle).
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    matchPaths: ["/", "/dashboard"],
  },
  {
    href: "/profile",
    label: "Hồ sơ của em",
    icon: UserCheck,
    matchPaths: ["/profile", "/profile/goal"],
  },
  {
    href: "/analysis",
    label: "Phân tích năng lực",
    icon: TrendingUp,
    matchPaths: ["/analysis", "/analysis/gap", "/analysis/roi", "/analysis/simulation", "/simulation"],
  },
  {
    href: "/options",
    label: "Khám phá trường",
    icon: Building2,
    matchPaths: ["/options", "/explore", "/comparison", "/compare"],
  },
  {
    href: "/portfolio",
    label: "Xếp nguyện vọng",
    icon: GraduationCap,
    matchPaths: ["/portfolio", "/strategy"],
  },
  {
    href: "/study-plan",
    label: "Kế hoạch học",
    icon: CalendarDays,
    matchPaths: ["/study-plan"],
  },
  {
    href: "/explanation",
    label: "Cách tính",
    icon: ShieldCheck,
    matchPaths: ["/explanation", "/method"],
  },
  {
    href: "/verify",
    label: "Kiểm chứng",
    icon: FileCheck,
    matchPaths: ["/verify"],
  },
];

const SUB_PAGE_TITLES: Record<string, string> = {
  "/profile/goal": "Chọn ngành mục tiêu",
  "/analysis/gap": "Khoảng cách điểm",
  "/analysis/roi": "Môn nên ưu tiên",
  "/analysis/simulation": "Nếu điểm thay đổi thì sao?",
  "/simulation": "Nếu điểm thay đổi thì sao?",
  "/comparison": "So sánh lựa chọn",
  "/compare": "So sánh lựa chọn",
  "/verify": "Kiểm chứng / Verify",
};

export function getNavTitle(pathname: string): string {
  if (SUB_PAGE_TITLES[pathname]) return SUB_PAGE_TITLES[pathname];
  const item = MAIN_NAV_ITEMS.find((n) => n.matchPaths?.includes(pathname) || n.href === pathname);
  return item?.label ?? "Nguyện Vọng";
}

// Giữ lại DOMAIN_NAV_ITEMS để tương thích ngược với các file khác import
export const DOMAIN_NAV_ITEMS = MAIN_NAV_ITEMS;

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: StudentProfile;
  target?: TargetProgram | null;
  gapAnalysis?: GapMetric;
  pFailAll?: number;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((p) =>
        p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <aside
      className={`sidebar-shell md:flex-[0_0_250px] md:w-[250px] md:min-w-[250px] md:max-w-[250px] h-[100dvh] bg-white border-r border-slate-200 flex flex-col justify-between overflow-hidden print:hidden transition-transform duration-200 ease-in-out ${
        isOpen
          ? "fixed inset-y-0 left-0 z-50 w-[250px] translate-x-0 shadow-2xl"
          : "fixed inset-y-0 left-0 z-50 w-[250px] -translate-x-full md:static md:translate-x-0"
      }`}
    >
      <div
        className="flex flex-col h-full justify-between overflow-y-auto overflow-x-hidden"
        style={{ scrollbarGutter: "stable" }}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              {/* Logo Mũ cử nhân & Ngôi sao AI bứt phá chuẩn brand */}
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/favicon.svg"
                  alt="Nguyện Vọng"
                  className="w-8 h-8 rounded-xl shadow-xs"
                />
              </div>

              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                Nguyện Vọng
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 7 Main Navigation Items chuẩn theo SSOT */}
          <nav className="px-3.5 space-y-1.5 mt-2">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="truncate leading-none">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
