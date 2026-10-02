import React from "react";
import Image from "@/components/navigation/ProgramImage";
import {
  MapPin,
  Coins,
  BarChart2,
  ArrowRight,
  Bookmark,
  Check,
  Sparkles,
  Heart,
  Scale,
} from "lucide-react";
import { ProgramDisplayItem } from "@/features/explore/types";
import { formatProbability } from "@/lib/format";

interface OptionCardProps {
  item: ProgramDisplayItem;
  isInWishlist: boolean;
  wishlistRank?: number | null;
  isFavorite?: boolean;
  isCompared?: boolean;
  onToggleWishlist: (item: ProgramDisplayItem) => void;
  onViewDetails: (item: ProgramDisplayItem) => void;
  onAskAiFit?: (item: ProgramDisplayItem) => void;
  onToggleFavorite?: (item: ProgramDisplayItem) => void;
  onToggleCompare?: (item: ProgramDisplayItem) => void;
  onHideOption?: (item: ProgramDisplayItem) => void;
}

export function OptionCard({
  item,
  isInWishlist,
  wishlistRank,
  isFavorite = false,
  isCompared = false,
  onToggleWishlist,
  onViewDetails,
  onAskAiFit,
  onToggleFavorite,
  onToggleCompare,
}: OptionCardProps) {
  const normalizedMatchLabel =
    item.role === "mao_hiem" ? "Thử sức" : item.role === "an_toan" ? "An toàn" : "Phù hợp";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 min-w-0">
      {/* UPPER SECTION: THUMBNAIL (112px) + PROGRAM INFO */}
      <div className="flex items-start gap-3.5 min-w-0">
        {/* CAMPUS THUMBNAIL PHOTO: 112px, aspect-ratio fixed, object-cover, shrink-0 */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-square">
          {item.imageSrc ? (
            <Image
              src={item.imageSrc}
              alt={item.schoolName}
              fill
              sizes="112px"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-500" aria-hidden="true">
              {item.schoolCode}
            </div>
          )}
        </div>

        {/* CONTENT: min-w-0 flex-1 */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          {/* HEADER CONTENT: SCHOOL NAME + MAJOR ON LEFT, BADGE + FAVORITE ON RIGHT */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm sm:text-[15px] font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 break-words text-pretty"
                title={item.schoolName}
              >
                {item.schoolName}
              </h3>
              <div
                className="text-xs sm:text-[13px] font-medium text-slate-600 leading-snug line-clamp-2 break-words mt-0.5 text-pretty"
                title={item.majorName}
              >
                {item.majorName}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {item.sourceTier === "aggregator_verified" ? (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    title="Dữ liệu tổng hợp từ Tuyensinh247 - Chưa đối chiếu văn bản gốc"
                  >
                    🌐 Nguồn Tuyensinh247
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    title="Bóc tách từ văn bản Đề án tuyển sinh chính thức có con dấu pháp nhân"
                  >
                    🏛️ Đề án chính thức
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border whitespace-nowrap shrink-0 ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}
              >
                {normalizedMatchLabel}
              </span>

              {/* NÚT YÊU THÍCH (FAVORITE) */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(item)}
                  title={isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* 3 METRIC ROWS WITH ALIGNED 16px ICONS */}
          <div className="pt-2 space-y-1.5 text-xs text-slate-600">
            {/* LOCATION */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-700 truncate">
                <span className="text-slate-400 font-normal">Khu vực:</span> {item.regionLabel}
              </span>
            </div>

            {/* TUITION */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <Coins className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="font-medium text-slate-800 break-words">
                <span className="text-slate-400 font-normal">Học phí:</span>{" "}
                <span className={item.tuitionDisplay === "Đang cập nhật đề án" ? "text-slate-500 font-normal italic" : "font-extrabold text-slate-900"}>
                  {item.tuitionDisplay}
                </span>
              </span>
            </div>

            {/* CUTOFF SCORE */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <BarChart2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="font-semibold text-slate-800 break-words">
                <span className="text-slate-400 font-normal">Điểm chuẩn:</span> {item.cutoffDisplay}
              </span>
            </div>
          </div>

          {/* DECISION INTELLIGENCE METRIC STRIP */}
          {typeof item.admitProbability === "number" && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-500 font-medium text-[11px]">Khả năng đỗ:</span>
                <span
                  className={
                    item.admitProbability >= 0.8
                      ? "text-emerald-700"
                      : item.admitProbability >= 0.4
                      ? "text-blue-700"
                      : "text-amber-700"
                  }
                >
                  {formatProbability(item.admitProbability)}
                </span>
              </div>
              {typeof item.userScore === "number" && typeof item.cutoffP50 === "number" && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    item.userScore >= item.cutoffP50
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {item.userScore >= item.cutoffP50
                    ? `Dư +${(item.userScore - item.cutoffP50).toFixed(1)}đ`
                    : `Thiếu ${(item.cutoffP50 - item.userScore).toFixed(1)}đ`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* ACTION 1: XEM CHI TIẾT */}
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition cursor-pointer shrink-0"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* ACTION 2: HỎI AI COPILOT */}
          {onAskAiFit && (
            <button
              type="button"
              onClick={() => onAskAiFit(item)}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition cursor-pointer shrink-0 text-xs font-bold"
              title="Xem vì sao lựa chọn này hợp hoặc chưa hợp với bạn"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Vì sao?</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* ACTION 3: SO SÁNH (COMPARE) */}
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(item)}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border transition cursor-pointer text-xs font-bold ${
                isCompared
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title={isCompared ? "Bỏ khỏi so sánh" : "Thêm vào bảng so sánh"}
            >
              <Scale className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isCompared ? "Đã chọn" : "So sánh"}</span>
            </button>
          )}

          {/* ACTION 4: LƯU / ĐÃ LƯU NGUYỆN VỌNG */}
          <button
            type="button"
            onClick={() => onToggleWishlist(item)}
            className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${
              isInWishlist
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
            title={
              isInWishlist
                ? "Bấm để xóa khỏi danh mục nguyện vọng"
                : "Bấm để lưu vào danh mục nguyện vọng"
            }
          >
            {isInWishlist ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{wishlistRank ? `NV #${wishlistRank}` : "Đã lưu"}</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                <span>Lưu NV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OptionCard;
