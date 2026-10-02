import React from "react";
import {
  Search,
  X,
  ArrowUpDown,
  MapPin,
  Coins,
  BookOpen,
  ListFilter,
  Star,
  ChevronDown,
  FileCheck2,
} from "lucide-react";
import {
  OptionsFilterState,
  RegionFilter,
  TuitionFilter,
  MajorGroupFilter,
  CombinationFilter,
  MatchFilter,
  MethodFilter,
} from "@/features/explore/types";
import { MAJOR_GROUPS } from "@/engine/types";
import { combinationLabel } from "@/data/universities/combinations";

interface OptionsFilterBarProps {
  filters: OptionsFilterState;
  onChange: (updates: Partial<OptionsFilterState>) => void;
  totalMatches: number;
  /** Tổ hợp xuất hiện trong danh sách hiện tại (để không gợi ý tổ hợp vô nghĩa). */
  availableCombinations: string[];
  homeProvince?: string;
  annualBudgetVnd?: number;
  interestCount?: number;
}

export function OptionsFilterBar({
  filters,
  onChange,
  totalMatches,
  availableCombinations,
  homeProvince,
  annualBudgetVnd = 0,
  interestCount = 0,
}: OptionsFilterBarProps) {
  const budgetMillions = Math.round(annualBudgetVnd / 1_000_000);
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* HÀNG TRÊN: TÌM KIẾM + SẮP XẾP + TỔNG KẾT QUẢ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* THANH TÌM KIẾM TÊN TRƯỜNG / MÃ TRƯỜNG / NGÀNH */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Tìm theo tên trường, mã trường (BKA, NEU...) hoặc ngành học..."
            aria-label="Tìm kiếm trường hoặc ngành học"
            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-9.5 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onChange({ searchQuery: "" })}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* SẮP XẾP */}
        <div className="relative shrink-0 flex items-center">
          <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <select
                value={filters.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value as any })}
                aria-label="Sắp xếp kết quả"
                className="appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="admit_prob">Xác suất đỗ: Cao → Thấp</option>
                <option value="cutoff_desc">Điểm chuẩn: Cao → Thấp</option>
                <option value="cutoff_asc">Điểm chuẩn: Thấp → Cao</option>
                <option value="tuition_asc">Học phí: Thấp → Cao</option>
                <option value="employment_desc">Tỷ lệ việc làm (nếu có dữ liệu)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* STAT SUMMARY CHIP */}
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-900 shrink-0">
          <span className="text-sm sm:text-base font-black text-blue-700 leading-none">
            {totalMatches}
          </span>
          <span className="text-xs font-bold text-slate-700 leading-none whitespace-nowrap">
            ngành thỏa điều kiện
          </span>
        </div>
      </div>

      {/* HÀNG DƯỚI: 6 BỘ LỌC RÀNG BUỘC */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* 1. KHU VỰC */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Khu vực</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.region}
              onChange={(e) => onChange({ region: e.target.value as RegionFilter })}
              aria-label="Lọc theo khu vực"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Cả nước</option>
              <option value="bac">Miền Bắc</option>
              <option value="trung">Miền Trung</option>
              <option value="nam">Miền Nam</option>
              {homeProvince && <option value="home">Cùng tỉnh nhà ({homeProvince})</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* 2. HỌC PHÍ */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Coins className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Học phí</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.tuition}
              onChange={(e) => onChange({ tuition: e.target.value as TuitionFilter })}
              aria-label="Lọc theo học phí"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              {budgetMillions > 0 && <option value="budget">Trong ngân sách (&le; {budgetMillions} triệu)</option>}
              <option value="under_20">&le; 20 triệu/năm</option>
              <option value="under_40">&le; 40 triệu/năm</option>
              <option value="under_60">&le; 60 triệu/năm</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* 3. NGÀNH */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Ngành</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.majorGroup}
              onChange={(e) => onChange({ majorGroup: e.target.value as MajorGroupFilter })}
              aria-label="Lọc theo nhóm ngành"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              {interestCount > 0 && <option value="interest">Ngành em quan tâm ({interestCount} nhóm)</option>}
              {MAJOR_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
              <option value="other">Nhóm khác</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* PHƯƠNG THỨC */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <FileCheck2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Phương thức</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.method}
              onChange={(e) => onChange({ method: e.target.value as MethodFilter })}
              aria-label="Lọc theo phương thức xét tuyển"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Phương thức tốt nhất</option>
              <option value="THPT">Điểm thi tốt nghiệp THPT</option>
              <option value="HOC_BA">Học bạ</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* 4. TỔ HỢP */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <ListFilter className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Tổ hợp</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.combination}
              onChange={(e) => onChange({ combination: e.target.value as CombinationFilter })}
              aria-label="Lọc theo tổ hợp môn"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              {availableCombinations.map((code) => (
                <option key={code} value={code}>{combinationLabel(code)}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* 5. MỨC ĐỘ PHÙ HỢP */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Star className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Mức độ</span>
          </label>
          <div className="relative mt-1">
            <select
              value={filters.matchLevel}
              onChange={(e) => onChange({ matchLevel: e.target.value as MatchFilter })}
              aria-label="Lọc theo mức độ phù hợp"
              className="w-full appearance-none bg-transparent pr-5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="kha_phu_hop">Phù hợp</option>
              <option value="an_toan">An toàn</option>
              <option value="can_co_gang">Thử sức</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptionsFilterBar;
