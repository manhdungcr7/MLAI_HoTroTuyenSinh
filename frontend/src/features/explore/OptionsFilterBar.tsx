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
} from "lucide-react";
import {
  OptionsFilterState,
  RegionFilter,
  TuitionFilter,
  MajorGroupFilter,
  CombinationFilter,
  MatchFilter,
} from "@/features/explore/types";

interface OptionsFilterBarProps {
  filters: OptionsFilterState;
  onChange: (updates: Partial<OptionsFilterState>) => void;
  totalMatches: number;
}

export function OptionsFilterBar({
  filters,
  onChange,
  totalMatches,
}: OptionsFilterBarProps) {
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
                <option value="utility">Độ phù hợp tối ưu</option>
                <option value="cutoff_desc">Điểm chuẩn: Cao → Thấp</option>
                <option value="cutoff_asc">Điểm chuẩn: Thấp → Cao</option>
                <option value="admit_prob">Khả năng đỗ cao nhất</option>
                <option value="tuition_asc">Học phí: Thấp → Cao</option>
                <option value="employment_desc">Tỷ lệ việc làm cao nhất</option>
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
            phương án
          </span>
        </div>
      </div>

      {/* HÀNG DƯỚI: 5 BỘ LỌC ĐA CHIỀU */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
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
              <option value="all">Tất cả</option>
              <option value="hanoi">Hà Nội</option>
              <option value="tphcm">TP.HCM</option>
              <option value="mientrung">Miền Trung</option>
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
              <option value="cntt">CNTT &amp; AI</option>
              <option value="kinh_te">Kinh tế &amp; Quản trị</option>
              <option value="ky_thuat">Kỹ thuật &amp; Công nghệ</option>
              <option value="y_duoc">Y Dược</option>
              <option value="luat">Luật</option>
              <option value="ngon_ngu">Ngôn ngữ</option>
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
              <option value="A00">A00 (Toán, Lý, Hóa)</option>
              <option value="A01">A01 (Toán, Lý, Anh)</option>
              <option value="D01">D01 (Toán, Văn, Anh)</option>
              <option value="D07">D07 (Toán, Hóa, Anh)</option>
              <option value="B00">B00 (Toán, Hóa, Sinh)</option>
              <option value="C00">C00 (Văn, Sử, Địa)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* 5. MỨC ĐỘ PHÙ HỢP */}
        <div className="relative rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:p-2.5 transition-colors hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 min-w-0 col-span-2 sm:col-span-1">
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
