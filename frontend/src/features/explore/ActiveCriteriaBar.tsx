import React from "react";
import Link from "@/components/navigation/HashLink";
import {
  Settings2,
  MapPin,
  Coins,
  BookOpen,
  ListFilter,
  Star,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { OptionsFilterState } from "@/features/explore/types";

interface ActiveCriteriaBarProps {
  filters: OptionsFilterState;
  onResetFilters: () => void;
  portfolioHref?: string;
}

export function ActiveCriteriaBar({
  filters,
  onResetFilters,
  portfolioHref = "/portfolio",
}: ActiveCriteriaBarProps) {
  // Nhãn hiển thị thân thiện
  const regionText = {
    all: "Tất cả",
    hanoi: "Hà Nội",
    tphcm: "TP.HCM",
    mientrung: "Miền Trung",
  }[filters.region];

  const tuitionText = {
    all: "Tất cả",
    under_20: "\u2264 20 triệu",
    under_40: "\u2264 40 triệu",
    under_60: "\u2264 60 triệu",
  }[filters.tuition];

  const majorText = {
    all: "Tất cả",
    cntt: "CNTT & AI",
    kinh_te: "Kinh tế",
    ky_thuat: "Kỹ thuật",
    y_duoc: "Y Dược",
    luat: "Luật",
    ngon_ngu: "Ngôn ngữ",
  }[filters.majorGroup] || "Tất cả";

  const comboText = filters.combination === "all" ? "Tất cả" : filters.combination;

  const matchText = {
    all: "Tất cả",
    kha_phu_hop: "Phù hợp (Target)",
    an_toan: "An toàn (Safety)",
    can_co_gang: "Thử sức (Reach)",
  }[filters.matchLevel];

  const isCustomized =
    filters.region !== "all" ||
    filters.tuition !== "all" ||
    filters.majorGroup !== "all" ||
    filters.combination !== "all" ||
    filters.matchLevel !== "all";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* LEFT: ICON & TITLE */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Tiêu chí đang áp dụng
            </h4>
            <p className="text-xs text-slate-500">
              Các gợi ý phía trên được lọc theo những tiêu chí sau:
            </p>
          </div>
        </div>

        {/* MIDDLE: 5 CRITERIA PILLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* KHU VỰC */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Khu vực:</span>
            <span className="font-bold text-slate-900">{regionText}</span>
          </div>

          {/* HỌC PHÍ */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            <Coins className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Học phí:</span>
            <span className="font-bold text-slate-900">{tuitionText}</span>
          </div>

          {/* NGÀNH */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Ngành:</span>
            <span className="font-bold text-slate-900">{majorText}</span>
          </div>

          {/* TỔ HỢP */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            <ListFilter className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Tổ hợp:</span>
            <span className="font-bold text-slate-900">{comboText}</span>
          </div>

          {/* MỨC ĐỘ PHÙ HỢP */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            <Star className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Mức độ phù hợp:</span>
            <span className="font-bold text-slate-900">{matchText}</span>
          </div>
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {isCustomized && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <Link
            href={portfolioHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition shadow-xs shrink-0"
          >
            <span>Chuyển đến sắp xếp nguyện vọng</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ActiveCriteriaBar;
