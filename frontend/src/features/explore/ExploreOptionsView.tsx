import React, { useState, useMemo } from "react";
import Link from "@/components/navigation/HashLink";
import { useDecision } from "@/state/DecisionContext";
import { OptionsFilterBar } from "@/features/explore/OptionsFilterBar";
import { OptionCard } from "@/features/explore/OptionCard";
import { ActiveCriteriaBar } from "@/features/explore/ActiveCriteriaBar";
import { ProgramDetailModal } from "@/features/explore/ProgramDetailModal";
import { OptionsFilterState, INITIAL_OPTIONS_FILTER, ProgramDisplayItem } from "@/features/explore/types";
import { CandidateOption, Role } from "@/engine/types";
import { formatTuitionPerYear, isWithinBudget } from "@/lib/format";
import {
  CheckCircle2,
  Layers,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { ContextualAiCopilotModal } from "@/components/ui/ContextualAiCopilotModal";
import { askAiAboutOptionFit, AiDecisionStructuredOutput } from "@/engine/explain/ai-decision-engine";

interface ExploreOptionsViewProps {
  onNavigateToPortfolio?: () => void;
}

// Hàm ánh xạ ảnh trường đại học
function getUniversityImage(schoolCode: string): string {
  switch (schoolCode) {
    case "BKA":
      return "/images/universities/bka.jpg";
    case "QHI":
    case "VNU":
      return "/images/universities/vnu.jpg";
    case "KHA":
    case "NEU":
      return "/images/universities/neu.jpg";
    case "KSA":
    case "UEH":
      return "/images/universities/ueh.jpg";
    case "BVH":
    case "PTIT":
      return "/images/universities/ptit.jpg";
    case "DDK":
    case "DUT":
      return "/images/universities/dut.jpg";
    default:
      return ""; // Không dùng ảnh trường khác làm ảnh minh họa
  }
}

const PAGE_SIZE = 24;
const ROLE_LABEL: Record<Role, string> = { an_toan: "An toàn", vua_tam: "Phù hợp", mao_hiem: "Thử sức" };
const ROLE_ORDER: Record<Role, number> = { vua_tam: 0, an_toan: 1, mao_hiem: 2 };

export function ExploreOptionsView({ onNavigateToPortfolio }: ExploreOptionsViewProps) {
  const {
    profile,
    target,
    candidates,
    wishlist,
    addWishlistItem,
    removeWishlistItem,
    favoriteProgramIds,
    compareProgramIds,
    hiddenProgramIds,
    toggleFavoriteRecommendation,
    toggleCompareRecommendation,
    toggleHideRecommendation,
    clearCompareRecommendations,
  } = useDecision();

  const [filters, setFilters] = useState<OptionsFilterState>(INITIAL_OPTIONS_FILTER);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDisplayItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // State Contextual AI Copilot
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiOutput, setAiOutput] = useState<AiDecisionStructuredOutput | null>(null);
  const [aiModalTitle, setAiModalTitle] = useState("");
  const [aiModalSubtitle, setAiModalSubtitle] = useState("");

  const handleAskAiFit = (item: ProgramDisplayItem) => {
    const cand: CandidateOption = {
      programId: item.programId,
      schoolCode: item.schoolCode,
      schoolName: item.schoolName,
      majorName: item.majorName,
      majorGroup: item.majorGroup,
      combination: item.combination,
      cutoffP50: item.cutoffP50,
      userScore: item.userScore,
      gap: Math.round((item.userScore - item.cutoffP50) * 100) / 100,
      admitProbability: item.admitProbability,
      tuitionVnd: item.tuitionVnd,
      employmentRate: item.employmentRate,
      aiExposure: item.aiExposure,
      role: item.role || "vua_tam",
      whyThisOptionVi: item.whyThisOptionVi || "",
      dataPassportUrl: item.dataPassportUrl || "",
    };
    const out = askAiAboutOptionFit(cand, profile, target);
    setAiOutput(out);
    setAiModalTitle("Vì sao lựa chọn này hợp (hoặc chưa hợp) với bạn?");
    setAiModalSubtitle(`${item.majorName} — ${item.schoolName} (${item.schoolCode})`);
    setIsAiModalOpen(true);
  };

  const handleFilterChange = (updates: Partial<OptionsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setVisibleCount(PAGE_SIZE);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_OPTIONS_FILTER);
    setVisibleCount(PAGE_SIZE);
  };

  // Ánh xạ wishlist hiện thời để check bookmark
  const wishlistMap = useMemo(() => {
    const map = new Map<string, number>();
    wishlist.forEach((w) => {
      if (w.program_id) map.set(w.program_id, w.rank);
      map.set(`${w.school_code}_${w.major_label}`, w.rank);
    });
    return map;
  }, [wishlist]);

  // Danh sách hiển thị = kết quả tính từ hồ sơ (không trộn dữ liệu mẫu).
  // Sắp xếp: Phù hợp → An toàn → Thử sức; trong nhóm, đúng nhóm ngành quan tâm trước, đề án chính thức trước, rồi điểm chuẩn cao trước
  const allPrograms = useMemo<ProgramDisplayItem[]>(() => {
    const targetGroup = target?.majorGroup ?? profile.interestMajorGroups?.[0];
    return [...candidates]
      .sort((a, b) => {
        const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
        if (roleDiff !== 0) return roleDiff;

        const targetGroupDiff = Number(b.majorGroup === targetGroup) - Number(a.majorGroup === targetGroup);
        if (targetGroupDiff !== 0) return targetGroupDiff;

        const aIsOfficial = ((a as any).sourceTier || (a as any).source_tier) !== "aggregator_verified";
        const bIsOfficial = ((b as any).sourceTier || (b as any).source_tier) !== "aggregator_verified";
        if (aIsOfficial !== bIsOfficial) return bIsOfficial ? 1 : -1;

        return b.cutoffP50 - a.cutoffP50;
      })
      .map((c) => {
        const regionKey = c.region === "nam" ? "tphcm" : c.region === "trung" ? "mientrung" : "hanoi";
        const regionText =
          c.province || (c.region === "nam" ? "TP. Hồ Chí Minh" : c.region === "trung" ? "Miền Trung" : "Hà Nội");
        const matchLevel = c.role === "an_toan" ? "an_toan" : c.role === "mao_hiem" ? "can_co_gang" : "kha_phu_hop";
        const badgeStyle =
          c.role === "an_toan"
            ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
            : c.role === "mao_hiem"
            ? { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
            : { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
        const low = c.cutoffP10 ?? c.cutoffP50;
        const high = c.cutoffP90 ?? c.cutoffP50;

        return {
          id: c.programId,
          programId: c.programId,
          schoolCode: c.schoolCode,
          schoolName: c.schoolName,
          majorName: c.majorName,
          majorGroup: c.majorGroup,
          combination: c.combination,
          region: regionKey,
          regionLabel: regionText,
          tuitionDisplay: formatTuitionPerYear(c.tuitionVnd),
          tuitionVnd: c.tuitionVnd,
          cutoffDisplay: low === high ? `${c.cutoffP50} điểm` : `${low.toFixed(1)} – ${high.toFixed(1)} điểm`,
          cutoffP50: c.cutoffP50,
          yearsOfData: c.yearsOfData,
          matchLevel,
          matchLabel: ROLE_LABEL[c.role],
          badgeStyle,
          imageSrc: getUniversityImage(c.schoolCode),
          dataPassportUrl: c.dataPassportUrl,
          employmentRate: c.employmentRate,
          aiExposure: c.aiExposure,
          whyThisOptionVi: c.whyThisOptionVi,
          userScore: c.userScore,
          admitProbability: c.admitProbability,
          role: c.role,
          sourceTier: ((c as any).sourceTier || (c as any).source_tier || "official_pdf") as "official_pdf" | "aggregator_verified",
        } satisfies ProgramDisplayItem;
      });
  }, [candidates, target?.majorGroup, profile.interestMajorGroups]);

  // Bộ lọc đa chiều 5 tiêu chuẩn & tìm kiếm từ khóa
  const filteredPrograms = useMemo(() => {
    return allPrograms
      .filter((item) => {
        // 0. Tìm kiếm theo từ khóa (tên trường, mã trường, ngành)
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.trim().toLowerCase();
          const matchName = item.schoolName.toLowerCase().includes(q);
          const matchCode = item.schoolCode.toLowerCase().includes(q);
          const matchMajor = item.majorName.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchMajor) {
            return false;
          }
        }

        // 1. Khu vực
        if (filters.region !== "all" && item.region !== filters.region) {
          return false;
        }

        // 2. Học phí
        if (filters.tuition !== "all") {
          // Học phí chưa xác thực không bị loại (thẻ hiển thị rõ "Chưa có dữ liệu")
          if (filters.tuition === "under_20" && !isWithinBudget(item.tuitionVnd, 20_000_000, 1)) return false;
          if (filters.tuition === "under_40" && !isWithinBudget(item.tuitionVnd, 40_000_000, 1)) return false;
          if (filters.tuition === "under_60" && !isWithinBudget(item.tuitionVnd, 60_000_000, 1)) return false;
        }

        // 3. Nhóm ngành
        if (filters.majorGroup !== "all" && item.majorGroup !== filters.majorGroup) {
          return false;
        }

        // 4. Tổ hợp môn
        if (filters.combination !== "all" && !item.combination.includes(filters.combination)) {
          return false;
        }

        // 5. Mức độ phù hợp
        if (filters.matchLevel !== "all" && item.matchLevel !== filters.matchLevel) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "cutoff_desc":
            return b.cutoffP50 - a.cutoffP50;
          case "cutoff_asc":
            return a.cutoffP50 - b.cutoffP50;
          case "admit_prob":
            return b.admitProbability - a.admitProbability;
          case "tuition_asc": {
            const tA = a.tuitionVnd ?? 999_000_000;
            const tB = b.tuitionVnd ?? 999_000_000;
            return tA - tB;
          }
          case "employment_desc": {
            const eA = a.employmentRate ?? 0;
            const eB = b.employmentRate ?? 0;
            return eB - eA;
          }
          case "utility":
          default:
            return 0; // Giữ nguyên thứ tự ưu tiên
        }
      });
  }, [allPrograms, filters]);

  // Bookmark 2 chiều với wishlist của DecisionContext
  const handleToggleWishlist = (item: ProgramDisplayItem) => {
    const existingRank =
      wishlistMap.get(item.programId) ||
      wishlistMap.get(`${item.schoolCode}_${item.majorName}`);

    if (existingRank) {
      removeWishlistItem(existingRank);
      setToastMessage(`Đã xóa "${item.majorName}" khỏi danh mục nguyện vọng.`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      if (wishlist.length >= 15) {
        setToastMessage("Danh mục đã đủ tối đa 15 nguyện vọng! Bạn có thể xóa bớt để thêm mới.");
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      const candOption: CandidateOption = {
        programId: item.programId,
        schoolCode: item.schoolCode,
        schoolName: item.schoolName,
        majorName: item.majorName,
        majorGroup: item.majorGroup,
        combination: item.combination,
        cutoffP50: item.cutoffP50,
        userScore: item.userScore,
        gap: Number((item.userScore - item.cutoffP50).toFixed(2)),
        admitProbability: item.admitProbability,
        tuitionVnd: item.tuitionVnd,
        employmentRate: item.employmentRate,
        aiExposure: item.aiExposure,
        role: item.role,
        whyThisOptionVi: item.whyThisOptionVi,
        dataPassportUrl: item.dataPassportUrl,
        region: item.region === "tphcm" ? "nam" : item.region === "mientrung" ? "trung" : "bac",
        province: item.regionLabel,
      };

      const success = addWishlistItem(candOption);
      if (success) {
        setToastMessage(`Đã thêm "${item.majorName}" (${item.schoolCode}) vào danh mục NV #${wishlist.length + 1}!`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const visiblePrograms = filteredPrograms.slice(0, visibleCount);
  const hasScores = candidates.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOAST THÔNG BÁO THÊM / XÓA NGUYỆN VỌNG */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-blue-200 bg-white p-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* 1. THANH TÌM KIẾM & BỘ LỌC ĐA CHIỀU */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-800">
              Danh sách trường &amp; ngành học
            </span>
          </div>
          <Link
            href="/comparison"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            So sánh chi tiết →
          </Link>
        </div>

        <OptionsFilterBar
          filters={filters}
          onChange={handleFilterChange}
          totalMatches={filteredPrograms.length}
        />
      </section>

      {/* 4. LƯỚI THẺ CHƯƠNG TRÌNH: RESPONSIVE 1 COL (<900px), 2 COLS (900-1359px), 3 COLS (>=1360px) */}
      {!hasScores ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 text-pretty">
            Nhập điểm để xem những ngành phù hợp với bạn
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed text-pretty max-w-md mx-auto">
            Hệ thống cần đủ điểm 3 môn của ít nhất một tổ hợp để so sánh với điểm chuẩn các năm trước.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition"
          >
            Nhập điểm ngay
          </Link>
        </div>
      ) : filteredPrograms.length > 0 ? (
        <>
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 min-[1360px]:grid-cols-3 gap-4.5 sm:gap-5">
          {visiblePrograms.map((item) => {
            const wishlistRank =
              wishlistMap.get(item.programId) ||
              wishlistMap.get(`${item.schoolCode}_${item.majorName}`) ||
              null;
            const isInWishlist = Boolean(wishlistRank);

            return (
              <OptionCard
                key={item.id}
                item={item}
                isInWishlist={isInWishlist}
                wishlistRank={wishlistRank}
                isFavorite={favoriteProgramIds.includes(item.programId)}
                isCompared={compareProgramIds.includes(item.programId)}
                onToggleWishlist={handleToggleWishlist}
                onViewDetails={(selected) => setSelectedProgram(selected)}
                onAskAiFit={(selected) => {
                  handleAskAiFit(selected);
                }}
                onToggleFavorite={() => toggleFavoriteRecommendation(item.programId)}
                onToggleCompare={() => toggleCompareRecommendation(item.programId)}
                onHideOption={() => {
                  toggleHideRecommendation(item.programId);
                  setToastMessage(`Đã ẩn "${item.majorName}" khỏi danh sách gợi ý.`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
              />
            );
          })}
        </div>
        {visibleCount < filteredPrograms.length && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Xem thêm ({filteredPrograms.length - visibleCount} phương án)
            </button>
          </div>
        )}
        </>
      ) : (
        /* TRẠNG THÁI KHÔNG TÌM THẤY KẾT QUẢ KHI LỌC QUÁ HẸP */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Layers className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-extrabold text-slate-900 text-pretty">
              Không có phương án phù hợp với bộ lọc hiện tại
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed text-pretty">
              Bạn có thể nới lỏng trần học phí, chuyển sang chọn &quot;Tất cả khu vực&quot; hoặc &quot;Tất cả tổ hợp&quot; để tìm thấy nhiều cơ hội hơn.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi phục bộ lọc</span>
          </button>
        </div>
      )}

      {/* 5. THANH TÓM TẮT TIÊU CHÍ ĐANG ÁP DỤNG Ở ĐÁY KÈM NÚT CHUYỂN ĐẾN SẮP XẾP NGUYỆN VỌNG */}
      <ActiveCriteriaBar
        filters={filters}
        onResetFilters={handleResetFilters}
        portfolioHref="/portfolio"
      />

      {/* 6. FLOATING COMPARE DOCK */}
      {compareProgramIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-4 duration-300 max-w-[92vw]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black shrink-0">
              {compareProgramIds.length}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold whitespace-nowrap">
                Đang chọn so sánh ({compareProgramIds.length}/4)
              </span>
              {compareProgramIds.length < 2 && (
                <span className="text-[11px] text-amber-300 font-medium whitespace-nowrap">
                  Chọn từ 2 đến 4 ngành để so sánh đối đầu
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={compareProgramIds.length < 2}
              onClick={() => {
                if (compareProgramIds.length >= 2) {
                  setShowCompareModal(true);
                }
              }}
              title={
                compareProgramIds.length < 2
                  ? "Chọn từ 2 đến 4 ngành để so sánh đối đầu"
                  : "Mở bảng so sánh đối đầu"
              }
              className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-black transition cursor-pointer ${
                compareProgramIds.length < 2
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              }`}
            >
              So sánh ngay
            </button>
            <button
              type="button"
              onClick={clearCompareRecommendations}
              className="px-3 py-2 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* POPUP BẢNG SO SÁNH ĐỐI ĐẦU */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4">
          <div role="dialog" aria-modal="true" aria-label="Bảng so sánh" className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 text-pretty">
                  Bảng so sánh đối đầu ({compareProgramIds.length} ngành)
                </h2>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            {/* GUARD KIỂM TRA ĐỦ DỮ LIỆU */}
            {compareProgramIds.length < 2 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
                <p className="text-sm font-bold text-amber-900 text-pretty">
                  Cần chọn tối thiểu 2 ngành để thực hiện so sánh đối đầu.
                </p>
                <p className="text-xs text-amber-700 text-pretty">
                  Vui lòng quay lại danh sách và bấm nút &quot;So sánh&quot; trên các thẻ ngành học khác để đối chiếu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {compareProgramIds.map((id) => {
                  const prog = allPrograms.find((p) => p.programId === id);
                  if (!prog) return null;
                  return (
                    <div key={id} className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50">
                      <div className="text-xs font-black text-blue-600 uppercase tracking-wide">{prog.schoolCode}</div>
                      <div className="text-sm font-bold text-slate-900 line-clamp-2 text-pretty">{prog.majorName}</div>
                      <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-200">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Điểm chuẩn:</span>
                          <strong className="text-slate-900">{prog.cutoffDisplay}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Học phí:</span>
                          <strong className="text-slate-900">{prog.tuitionDisplay}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Việc làm:</span>
                          <strong className="text-slate-900">
                            {prog.employmentRate === null ? "Chưa có dữ liệu" : `${prog.employmentRate}%`}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Mức độ:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${prog.badgeStyle.bg} ${prog.badgeStyle.text} ${prog.badgeStyle.border} border`}>
                            {prog.matchLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. MODAL CHI TIẾT CHƯƠNG TRÌNH */}
      <ProgramDetailModal
        item={selectedProgram}
        isOpen={Boolean(selectedProgram)}
        onClose={() => setSelectedProgram(null)}
        isInWishlist={
          Boolean(
            selectedProgram &&
              (wishlistMap.get(selectedProgram.programId) ||
                wishlistMap.get(`${selectedProgram.schoolCode}_${selectedProgram.majorName}`))
          )
        }
        wishlistRank={
          selectedProgram
            ? wishlistMap.get(selectedProgram.programId) ||
              wishlistMap.get(`${selectedProgram.schoolCode}_${selectedProgram.majorName}`) ||
              null
            : null
        }
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 8. MODAL CONTEXTUAL AI COPILOT */}
      <ContextualAiCopilotModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title={aiModalTitle}
        subtitle={aiModalSubtitle}
        data={aiOutput}
      />
    </div>
  );
}

export default ExploreOptionsView;
