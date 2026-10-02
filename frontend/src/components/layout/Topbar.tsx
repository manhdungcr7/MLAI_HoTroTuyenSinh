import React, { useState, useMemo } from "react";
import { usePathname } from "@/routes";
import {
  Menu,
  ChevronDown,
  User,
  UserPlus,
  RefreshCw,
  LogOut,
  Check,
  Bell,
  Trash2,
} from "lucide-react";
import { StudentProfile, TargetProgram, GapMetric } from "@/engine/types";
import { StoredProfileMeta } from "@/state/storage";
import { getNavTitle } from "@/components/layout/Sidebar";

export interface TopbarProps {
  onToggleMobileMenu: () => void;
  title?: string;
  subTitle?: string;
  profile?: StudentProfile;
  target?: TargetProgram | null;
  gapAnalysis?: GapMetric;
  pFailAll?: number;
  isRecalculating?: boolean;
  onOpenMockModal?: () => void;
  onResetToBlank?: () => void;
  savedProfiles?: StoredProfileMeta[];
  activeProfileId?: string;
  onCreateNewProfile?: (name?: string) => void;
  onSwitchProfile?: (profileId: string) => void;
  onDeleteProfile?: (profileId: string) => void;
  onLogoutProfile?: () => void;
  wishlistCount?: number;
}

// Tiêu đề trang lấy từ cùng nguồn với Sidebar để không có 3 tên khác nhau cho một trang
function getRouteTitle(pathname: string): { title: string; subTitle?: string } {
  return { title: getNavTitle(pathname) };
}

export function Topbar({
  onToggleMobileMenu,
  title: propTitle,
  profile,
  target,
  gapAnalysis,
  onOpenMockModal,
  onResetToBlank,
  savedProfiles = [],
  activeProfileId,
  onCreateNewProfile,
  onSwitchProfile,
  onDeleteProfile,
  onLogoutProfile,
  wishlistCount = 0,
}: TopbarProps) {
  const pathname = usePathname();
  const routeInfo = getRouteTitle(pathname);
  const displayTitle = routeInfo.title || propTitle;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Tạo danh sách thông báo và nhắc nhở thông minh dựa trên dữ liệu thật
  const notifications = useMemo(() => {
    const list = [];

    // 1. Nhắc nhở khoảng cách điểm chuẩn mục tiêu
    if (target) {
      const rawGap = gapAnalysis?.rawGap ?? 0;
      const currentScore = gapAnalysis?.currentCompositeScore ?? 0;
      if (rawGap < 0) {
        list.push({
          id: "notif-target-gap",
          type: "warning",
          title: `Thiếu ${Math.abs(rawGap).toFixed(2)}đ so với mục tiêu ${target.schoolCode}`,
          message: `Điểm hiện tại (${currentScore.toFixed(2)}đ) cần cải thiện thêm ${Math.abs(rawGap).toFixed(2)} điểm để đạt ngưỡng tham chiếu P50 ngành ${target.majorName}.`,
          link: "#/analysis",
          linkText: "Xem môn ưu tiên bứt phá",
          time: "Gợi ý thông minh",
        });
      } else {
        list.push({
          id: "notif-target-safe",
          type: "success",
          title: `Đạt ngưỡng an toàn mục tiêu (+${rawGap.toFixed(2)}đ)`,
          message: `Điểm thi của bạn (${currentScore.toFixed(2)}đ) vượt ngưỡng tham chiếu P50 ngành ${target.majorName} (${target.schoolCode}).`,
          link: "#/portfolio",
          linkText: "Xếp danh mục nguyện vọng",
          time: "Gợi ý thông minh",
        });
      }
    } else {
      list.push({
        id: "notif-target-missing",
        type: "info",
        title: "Chưa chọn trường mục tiêu",
        message: "Hãy chọn 1 trường đại học mơ ước ở trang Hồ sơ để AI tính toán chính xác bạn cần bao nhiêu điểm.",
        link: "#/profile",
        linkText: "Chọn trường mục tiêu ngay",
        time: "Nhắc nhở",
      });
    }

    // 2. Nhắc nhở danh mục 15 nguyện vọng
    if (wishlistCount === 0) {
      list.push({
        id: "notif-wishlist-empty",
        type: "warning",
        title: "Danh mục xét tuyển: Chưa chọn nguyện vọng nào (0/15)",
        message: "Bạn chưa đưa ngành nào vào danh mục xét tuyển 15 NV. Hãy khám phá và lưu tối thiểu 8–15 NV để bảo vệ cơ hội đỗ.",
        link: "#/options",
        linkText: "Khám phá ngành phù hợp",
        time: "Chiến lược",
      });
    } else if (wishlistCount < 6) {
      list.push({
        id: "notif-wishlist-thin",
        type: "info",
        title: `Danh mục đang có ${wishlistCount}/15 nguyện vọng`,
        message: "Nên phân bổ tối thiểu 8-10 nguyện vọng (chia đều Thử sức - Phù hợp - An toàn) để tránh nguy cơ trượt tất cả.",
        link: "#/portfolio",
        linkText: "Tối ưu cơ cấu 3 tầng",
        time: "Chiến lược",
      });
    } else {
      list.push({
        id: "notif-wishlist-good",
        type: "success",
        title: `Đã cơ cấu ${wishlistCount}/15 nguyện vọng`,
        message: "Danh mục của bạn đã có độ dày tương đối tốt. Kiểm tra phân tầng xác suất để chốt phương án cuối cùng.",
        link: "#/portfolio",
        linkText: "Kiểm tra danh mục",
        time: "Chiến lược",
      });
    }

    // 3. Quy chế tuyển sinh TT06/2026
    list.push({
      id: "notif-tt06",
      type: "system",
      title: "Lưu ý Quy chế tuyển sinh TT06/2026",
      message: "Từ 22.5 điểm trở lên, điểm ưu tiên giảm tuyến tính. Thí sinh phải đạt điểm sàn xét tuyển đại học tối thiểu 15.0 điểm.",
      link: "#/verify",
      linkText: "Xem thẩm định quy chế TT06",
      time: "Bộ GD&ĐT",
    });

    return list;
  }, [target, gapAnalysis, wishlistCount]);

  return (
    <header className="flex-none z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shrink-0">
      {/* Cột bên trái: Mobile toggle + Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer shrink-0"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          {/* Tiêu đề điều hướng */}
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 leading-none tracking-tight">
            {displayTitle}
          </p>
        </div>
      </div>

      {/* Cột bên phải: Notification Bell + Student Profile Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Notification Bell with Smart Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            aria-label="Thông báo và nhắc nhở"
          >
            <Bell className="w-4.5 h-4.5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/5"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Thông báo & Nhắc nhở
                    </span>
                    {hasUnread && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                        {notifications.length} mới
                      </span>
                    )}
                  </div>
                  {hasUnread && (
                    <button
                      type="button"
                      onClick={() => setHasUnread(false)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-2 mt-2 max-h-80 overflow-y-auto pr-0.5">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-100 bg-slate-50/50 hover:bg-blue-50/30 transition space-y-1.5 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                      {item.link && (
                        <a
                          href={item.link}
                          onClick={() => setShowNotifications(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 pt-0.5"
                        >
                          <span>{item.linkText}</span>
                          <span className="text-xs">→</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Student profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            {/* Avatar tròn học sinh */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
              <svg
                viewBox="0 0 36 36"
                className="w-full h-full text-white"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="18" cy="18" r="18" fill="#3B82F6" />
                {/* Tóc */}
                <path
                  d="M10 14C10 9.58172 13.5817 6 18 6C22.4183 6 26 9.58172 26 14C26 14.5 25.8 15.5 25.5 16C24 15 22 14.5 18 14.5C14 14.5 12 15 10.5 16C10.2 15.5 10 14.5 10 14Z"
                  fill="#0F172A"
                />
                {/* Khuôn mặt */}
                <circle cx="18" cy="17" r="6" fill="#FED7AA" />
                {/* Mắt */}
                <circle cx="16" cy="16.5" r="0.75" fill="#0F172A" />
                <circle cx="20" cy="16.5" r="0.75" fill="#0F172A" />
                {/* Miệng cười */}
                <path
                  d="M16.5 19.5C17 20.2 19 20.2 19.5 19.5"
                  stroke="#0F172A"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
                {/* Áo học sinh */}
                <path
                  d="M8 32C8 26.4772 12.4772 22 18 22C23.5228 22 28 26.4772 28 32V36H8V32Z"
                  fill="#1E40AF"
                />
                {/* Cổ áo trắng */}
                <path d="M15 22L18 25L21 22H15Z" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Thông tin tên và lớp */}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-extrabold text-slate-900 leading-tight">
                {profile?.name?.trim() ? profile.name : "Hồ sơ của bạn"}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 leading-none mt-0.5">
                {profile?.grade?.trim()
                  ? (/^lớp\s/i.test(profile.grade) ? profile.grade : `Lớp ${profile.grade}`)
                  : "Chưa cập nhật lớp"}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <>
              {/* Backdrop bắt click ngoài */}
              <div
                className="fixed inset-0 z-40 bg-black/5"
                onClick={() => setShowProfileMenu(false)}
              />

              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Header Hồ sơ hiện tại */}
                <div className="px-2 py-2 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Hồ sơ đang mở
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang hoạt động
                    </span>
                  </div>

                  <div className="text-sm font-black text-slate-900 mt-1">
                    {profile?.name?.trim() ? profile.name : "Hồ sơ chưa đặt tên"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {profile?.highSchool
                      ? `${profile.grade ? profile.grade + " • " : ""}${profile.highSchool}`
                      : "Chưa cập nhật trường THPT"}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-lg bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-bold border border-blue-100">
                      {gapAnalysis && gapAnalysis.currentCompositeScore > 0
                        ? `Tổ hợp ${profile?.activeCombination || "A00"}: ${gapAnalysis.currentCompositeScore.toFixed(1)}đ`
                        : "Chưa có điểm"}
                    </span>
                    <span className="rounded-lg bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-bold border border-emerald-100">
                      {target ? `Mục tiêu: ${target.schoolCode}` : "Chưa chọn mục tiêu"}
                    </span>
                  </div>
                </div>

                {/* 2. Danh sách Hồ sơ trên máy này (Multi-Profile Switcher Thật) */}
                <div className="px-2 pt-3 pb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Hồ sơ trên thiết bị này
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {savedProfiles.length} hồ sơ
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {savedProfiles.map((p) => {
                    const isActive = p.id === activeProfileId;
                    return (
                      <div
                        key={p.id}
                        className={`w-full rounded-xl p-2.5 transition flex items-center justify-between gap-2 border ${
                          isActive
                            ? "bg-blue-50/70 border-blue-200 text-blue-900"
                            : "bg-slate-50/60 hover:bg-slate-100 border-slate-100 text-slate-700 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isActive && onSwitchProfile) {
                            onSwitchProfile(p.id);
                            setShowProfileMenu(false);
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">
                              {p.name?.trim() ? p.name : "Hồ sơ chưa đặt tên"}
                            </span>
                            {isActive && (
                              <span className="shrink-0 text-[10px] font-black text-blue-600 bg-white px-1.5 py-0.2 rounded border border-blue-200">
                                Hiện tại
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {p.grade ? `Lớp ${p.grade}` : "Lớp chưa rõ"}
                            {p.highSchool ? ` • ${p.highSchool}` : ""}
                            {p.activeCombination ? ` • Khối ${p.activeCombination}` : ""}
                          </div>
                        </div>

                        {isActive ? (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            {savedProfiles.length > 1 && onDeleteProfile && (
                              <button
                                type="button"
                                title="Xóa hồ sơ này khỏi máy"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Bạn có chắc muốn xóa "${p.name || "hồ sơ này"}" không?`)) {
                                    onDeleteProfile(p.id);
                                  }
                                }}
                                className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Thao tác hồ sơ */}
                <div className="pt-2.5 mt-2 border-t border-slate-100 space-y-1">
                  {/* Nút Tạo hồ sơ mới */}
                  {onCreateNewProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNewProfile();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>+ Tạo hồ sơ người dùng mới</span>
                    </button>
                  )}

                  {/* Nút Cập nhật nhanh điểm thi */}
                  {onOpenMockModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMockModal();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 rounded-xl p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cập nhật nhanh điểm thi</span>
                    </button>
                  )}

                  {/* Nút Thoát / Đăng xuất hồ sơ */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogoutProfile) {
                        onLogoutProfile();
                      } else if (onResetToBlank) {
                        onResetToBlank();
                      }
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Thoát / Đăng xuất hồ sơ này</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
