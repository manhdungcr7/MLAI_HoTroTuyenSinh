import React, { useEffect } from "react";
import Image from "@/components/navigation/ProgramImage";
import {
  X,
  MapPin,
  Coins,
  BarChart2,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Cpu,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { ProgramDisplayItem } from "@/features/explore/types";
import { formatProbability } from "@/lib/format";

interface ProgramDetailModalProps {
  item: ProgramDisplayItem | null;
  isOpen: boolean;
  isInWishlist: boolean;
  wishlistRank?: number | null;
  onClose: () => void;
  onToggleWishlist: (item: ProgramDisplayItem) => void;
}

export function ProgramDetailModal({
  item,
  isOpen,
  isInWishlist,
  wishlistRank,
  onClose,
  onToggleWishlist,
}: ProgramDetailModalProps) {
  useEffect(() => {
    if (!isOpen || !item) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, item, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-900/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết chương trình"
        className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl relative max-h-[calc(100dvh-1.5rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-start gap-4 pr-8">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {item.imageSrc ? (
              <Image src={item.imageSrc} alt={item.schoolName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-500" aria-hidden="true">
                {item.schoolCode}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white">
                {item.schoolCode}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}
              >
                {item.matchLabel}
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {item.regionLabel}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
              {item.majorName}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {item.schoolName}
            </p>
          </div>
        </div>

        {/* 4 CORE METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Học phí năm đầu</div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {item.tuitionDisplay}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm chuẩn thường dao động</div>
            <div className="text-sm font-extrabold text-blue-700 mt-0.5">
              {item.cutoffDisplay}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ có việc</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span>{item.employmentRate === null ? "Chưa có dữ liệu" : `${item.employmentRate.toFixed(1)}%`}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Số năm có điểm chuẩn</div>
            <div className="text-sm font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>{item.yearsOfData ? `${item.yearsOfData} năm` : "Chưa rõ"}</span>
            </div>
          </div>
        </div>

        {/* WHY THIS OPTION FITS */}
        <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-100 space-y-1.5 my-3 text-xs">
          <div className="flex items-center gap-1.5 font-black text-blue-900">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Phân tích độ phù hợp với hồ sơ của bạn</span>
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">
            {item.whyThisOptionVi}
          </p>
          <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600 border-t border-blue-200/50">
            <span className="bg-white px-2 py-0.5 rounded-lg border border-blue-200/70">
              Tổ hợp xét tuyển: {item.combination}
            </span>
            <span className="bg-white px-2 py-0.5 rounded-lg border border-blue-200/70">
              Khả năng đỗ (ước tính): {formatProbability(item.admitProbability)}
            </span>
          </div>
        </div>

        {/* DATA PASSPORT MINH CHỨNG GỐC */}
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="truncate">
            Minh chứng dữ liệu: <strong>{item.dataPassportUrl}</strong>
          </span>
        </div>

        {/* FOOTER BUTTONS */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={() => onToggleWishlist(item)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition shadow-xs cursor-pointer ${
              isInWishlist
                ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isInWishlist ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-blue-600 fill-blue-600" />
                <span>{wishlistRank ? `Đã thêm (NV #${wishlistRank})` : "Đã có trong danh sách"}</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Thêm vào danh sách</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgramDetailModal;
