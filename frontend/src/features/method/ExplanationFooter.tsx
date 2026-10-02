import React from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowLeft, RefreshCw, CheckCircle2, FileDown } from "lucide-react";

export interface ExplanationFooterProps {
  onOpenMockModal: () => void;
  onOpenReportModal: () => void;
  className?: string;
}

export function ExplanationFooter({
  onOpenMockModal,
  onOpenReportModal,
  className = "",
}: ExplanationFooterProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden ${className}`}
    >
      {/* Left handwritten motivational slogan with mountain flag doodle */}
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-10 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 64 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-blue-600"
          >
            {/* Mountain body */}
            <path
              d="M8 44L28 16L38 28L46 18L58 44H8Z"
              fill="#DBEAFE"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Snowcap */}
            <path
              d="M28 16L22 24L26 27L29 23L33 28L38 28L28 16Z"
              fill="#93C5FD"
            />
            {/* Flagpole */}
            <line
              x1="28"
              y1="16"
              x2="28"
              y2="6"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Flag */}
            <path
              d="M28 6L38 10L28 14V6Z"
              fill="#2563EB"
            />
          </svg>
        </div>

        <div>
          <span className="text-sm md:text-base font-bold text-slate-900 tracking-tight block">
            Hiểu rõ dữ liệu, Quyết định sáng suốt hơn!
          </span>
          <p className="text-[11px] text-slate-500 font-medium">
            Toàn bộ khuyến nghị đều có căn cứ toán học & minh bạch nguồn dữ liệu.
          </p>
        </div>
      </div>

      {/* Right action buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Nút 1: Quay lại hồ sơ */}
        <Link
          href="/profile"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại hồ sơ</span>
        </Link>

        {/* Nút 2: Cập nhật điểm mới */}
        <button
          type="button"
          onClick={onOpenMockModal}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Cập nhật điểm mới</span>
        </button>

        {/* Nút 3: Hoàn tất & Xuất báo cáo */}
        <button
          type="button"
          onClick={onOpenReportModal}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 text-xs font-black text-white shadow-xs transition-all cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Xuất báo cáo quyết định</span>
        </button>
      </div>
    </div>
  );
}

export default ExplanationFooter;
