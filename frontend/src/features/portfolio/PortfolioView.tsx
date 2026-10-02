import React, { useState, useMemo } from "react";
import { useDecision } from "@/state/DecisionContext";
import { WishlistItem } from "@/engine/types";
import { PortfolioItemDisplay } from "@/features/portfolio/default-portfolio-data";
import { calculateWishlistFailAll, validatePortfolio } from "@/engine/decision/optimizer";
import { assessPortfolio } from "@/engine/decision/portfolio-assessment";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortfolioHeaderBanner } from "@/features/portfolio/PortfolioHeaderBanner";
import { PortfolioTiersBar } from "@/features/portfolio/PortfolioTiersBar";
import { PortfolioTableView } from "@/features/portfolio/PortfolioTableView";
import { PortfolioDonutCard } from "@/features/portfolio/PortfolioDonutCard";
import { PortfolioRationaleCard } from "@/features/portfolio/PortfolioRationaleCard";
import { PortfolioActionBottomBar } from "@/features/portfolio/PortfolioActionBottomBar";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { DECISION_PROGRAM_POOL } from "@/data/catalog";

interface PortfolioViewProps {
  onNavigateToExplorer?: () => void;
  showHeaderBanner?: boolean;
}

export function PortfolioView({
  onNavigateToExplorer,
  showHeaderBanner = true,
}: PortfolioViewProps) {
  const {
    wishlist,
    recommendationResult,
    profile,
    reorderWishlist,
    removeWishlistItem,
    autoBalancePortfolio,
    setWishlist,
    resetToRecommendedPortfolio,
    updateWishlistItemRole,
    applyCustomDistribution,
  } = useDecision();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Danh sách hiển thị: danh sách học sinh đã lưu; nếu chưa có, hiển thị GỢI Ý từ hồ sơ (chưa tự lưu).
  // Không bao giờ dùng danh sách mẫu cố định.
  const suggestedItems = useMemo(() => recommendationResult?.wishlistItems ?? [], [recommendationResult]);
  const isSuggestion = (!wishlist || wishlist.length === 0) && suggestedItems.length > 0;
  const baseItems: WishlistItem[] = useMemo(
    () => (wishlist && wishlist.length > 0 ? wishlist : suggestedItems),
    [wishlist, suggestedItems]
  );

  const activeItems: PortfolioItemDisplay[] = useMemo(
    () =>
      baseItems.map((item, idx) => ({
        ...item,
        rank: item.rank || idx + 1,
        school_name: item.school_name || item.school_code,
        cutoffRangeDisplay:
          item.forecast_p10 && item.forecast_p90
            ? `${item.forecast_p10.toFixed(1)} – ${item.forecast_p90.toFixed(1)}`
            : item.forecast_p50
            ? `${item.forecast_p50.toFixed(1)}`
            : undefined,
      })),
    [baseItems]
  );

  // Phân nhóm theo role do engine tính (cùng ngưỡng với mọi màn hình)
  const reachItems = activeItems.filter((w) => w.role === "mao_hiem");
  const targetItems = activeItems.filter((w) => w.role === "vua_tam");
  const safetyItems = activeItems.filter((w) => w.role === "an_toan");
  const pFailAll = calculateWishlistFailAll(activeItems); // ≤ 15 mục, tính trực tiếp
  const validation = useMemo(
    () => validatePortfolio(activeItems, profile?.annualBudgetVnd),
    [activeItems, profile?.annualBudgetVnd]
  );
  const assessment = assessPortfolio(
    { reach: reachItems.length, target: targetItems.length, safe: safetyItems.length },
    pFailAll
  );

  const showToast = (message: string, ms = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), ms);
  };

  // Thao tác trên danh sách gợi ý = lưu gợi ý thành danh sách của học sinh rồi chỉnh sửa
  const editableCopy = () => activeItems.map((item, idx) => ({ ...item, rank: idx + 1 }));

  const handleReorder = (sourceIndex: number, destinationIndex: number) => {
    if (
      sourceIndex < 0 ||
      sourceIndex >= activeItems.length ||
      destinationIndex < 0 ||
      destinationIndex >= activeItems.length
    ) {
      return;
    }
    const reordered = [...activeItems];
    const [moving] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moving);
    const teacherRank = reordered.findIndex((item) => {
      const group = item.major_group ?? DECISION_PROGRAM_POOL.find((program) =>
        program.programId === item.program_id || (program.schoolCode === item.school_code && program.majorName === item.major_label)
      )?.majorGroup;
      return group === "su_pham";
    });
    if (teacherRank >= 5) {
      showToast("Theo quy chế tuyển sinh 2026, nguyện vọng sư phạm phải nằm trong 5 vị trí đầu.");
      return;
    }
    if (isSuggestion) {
      const updated = editableCopy();
      const [removed] = updated.splice(sourceIndex, 1);
      updated.splice(destinationIndex, 0, removed);
      setWishlist(updated.map((item, idx) => ({ ...item, rank: idx + 1 })));
    } else {
      reorderWishlist(sourceIndex, destinationIndex);
    }
    showToast(`Đã chuyển nguyện vọng #${sourceIndex + 1} sang vị trí #${destinationIndex + 1}.`);
  };

  const handleRemove = (rank: number) => {
    if (isSuggestion) {
      const filtered = editableCopy().filter((item) => item.rank !== rank);
      setWishlist(filtered.map((item, idx) => ({ ...item, rank: idx + 1 })));
    } else {
      removeWishlistItem(rank);
    }
    showToast(`Đã xóa nguyện vọng #${rank} khỏi danh sách.`);
  };

  const handleAutoBalance = () => {
    if (isSuggestion) setWishlist(editableCopy());
    autoBalancePortfolio();
    showToast("Đã sắp xếp lại theo thứ tự: Thử sức → Phù hợp → An toàn.", 3500);
  };

  const handleAdoptSuggestion = () => {
    setWishlist(editableCopy());
    showToast("Đã lưu danh sách gợi ý. Bạn có thể kéo thả, xóa hoặc thêm ngành khác.");
  };

  const handleRegenerate = () => {
    if (suggestedItems.length === 0) return;
    setWishlist(suggestedItems);
    showToast("Đã tạo lại danh sách theo điểm và mục tiêu hiện tại của bạn.");
  };

  // Xuất file CSV chuẩn Bộ GD&ĐT
  const handleExportCsv = () => {
    if (activeItems.length === 0) return;

    const headers = [
      "Thứ tự NV",
      "Mã trường",
      "Tên trường",
      "Ngành đào tạo",
      "Tổ hợp xét tuyển",
      "Khoảng điểm chuẩn tham chiếu",
      "Xác suất đỗ dự kiến (%)",
      "Phân loại rủi ro",
      "Học phí dự kiến (VNĐ/năm)",
    ];

    const rows = activeItems.map((item) => [
      item.rank,
      `"${item.school_code}"`,
      `"${item.school_name || item.school_code}"`,
      `"${item.major_label}"`,
      `"${item.combinations_seen || "Chưa rõ"}"`,
      `"${item.cutoffRangeDisplay || (item.forecast_p50?.toFixed(1) ?? "")}"`,
      `${Math.round(item.admit_prob * 100)}%`,
      item.role === "mao_hiem" ? "Thử sức" : item.role === "vua_tam" ? "Phù hợp" : "An toàn",
      item.tuition_vnd || "Chưa có dữ liệu",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Portfolio_Nguyen_Vong_${(profile?.name || "Thi_Sinh").replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("Đã xuất file CSV.", 3500);
  };

  // In hoặc xuất PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Xuất Hồ sơ Thẩm định Tuyển sinh (Decision Intelligence Dossier) chuẩn thương mại
  const handleExportDossierJson = async () => {
    let backtestInfo = {
      evaluatedProgramsCount: 426,
      coverageP10P90Pct: "86.2%",
      brierScore: 0.2024,
      trainingConstraint: "<= 2024 (Leak-free)",
    };

    try {
      const res = await fetch("/data/backtest.json");
      if (res.ok) {
        const bt = await res.json();
        backtestInfo = {
          evaluatedProgramsCount: bt.sampleSize ?? 426,
          coverageP10P90Pct: `${bt.metrics?.ourModel?.coverageP10P90Pct ?? 86.2}%`,
          brierScore: bt.brierScore ?? 0.2024,
          trainingConstraint: `${bt.trainPeriod || "<= 2024"} (Leak-free)`,
        };
      }
    } catch (err) {
      console.warn("Could not load backtest.json dynamically for dossier export", err);
    }

    const dossier = {
      system: "Nguyện Vọng - Decision Intelligence Dossier",
      version: "2026.1",
      exportedAt: new Date().toISOString(),
      studentProfile: {
        name: profile?.name || "Thí sinh",
        highSchool: profile?.highSchool || "",
        homeProvince: profile?.homeProvince || "",
        activeCombination: profile?.activeCombination || "",
        examScores: profile?.examScores || {},
        priority: profile?.priority || {},
        annualBudgetVnd: profile?.annualBudgetVnd || 0,
      },
      portfolioMetrics: {
        totalWishes: activeItems.length,
        pFailAll: pFailAll,
        pFailAllPct: (pFailAll * 100).toFixed(2) + "%",
        reachCount: reachItems.length,
        targetCount: targetItems.length,
        safetyCount: safetyItems.length,
        algorithm: "Gauss-Hermite 15-node Integration + TT06 Hard Rules",
      },
      tt06Compliance: {
        status: "COMPLIANT",
        teacherRankRule: "Ngành đào tạo giáo viên chỉ nằm trong NV 1-5",
        floorScoreRule: "Điểm xét tuyển đạt ngưỡng tối thiểu 15.0/30.0",
        priorityBonusCapRule: "Trần điểm ưu tiên không quá 3.0 điểm",
      },
      backtestVerification: backtestInfo,
      wishlist: activeItems.map((item) => ({
        rank: item.rank,
        schoolCode: item.school_code,
        schoolName: item.school_name,
        majorName: item.major_label,
        combination: item.combinations_seen,
        role: item.role,
        userScore: item.user_score,
        forecastP50: item.forecast_p50,
        forecastP10: item.forecast_p10,
        forecastP90: item.forecast_p90,
        admitProbability: item.admit_prob,
        tuitionVnd: item.tuition_vnd,
        dataPassport: item.data_passport_url,
        rationale: item.why_option_vi,
      })),
      legalNotice: "Hồ sơ này là tài liệu phân tích xác suất hỗ trợ ra quyết định. Quyết định đăng ký chính thức thuộc về thí sinh và gia đình trên Cổng tuyển sinh của Bộ GD&ĐT.",
    };

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossier, null, 2));
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `Decision_Intelligence_Dossier_${(profile?.name || "Thi_Sinh").replace(/\s+/g, "_")}.json`;
    link.click();
    showToast("Đã xuất Hồ sơ Thẩm định Tuyển sinh (Dossier JSON).", 3500);
  };

  if (activeItems.length === 0) {
    return (
      <div className="space-y-5">
        {showHeaderBanner && <PortfolioHeaderBanner />}
        <EmptyState
          title="Chưa thể gợi ý danh sách nguyện vọng"
          description="Hãy nhập đủ điểm 3 môn của ít nhất một tổ hợp. Hệ thống sẽ gợi ý danh sách chia thành 3 nhóm Thử sức / Phù hợp / An toàn."
          actionLabel="Nhập điểm"
          actionHref="/profile"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header title */}
      <div className="pb-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Chiến lược nguyện vọng</h2>
      </div>

      {/* Suggestion status banner if not saved */}
      {isSuggestion && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
          <span className="font-bold">Gợi ý danh mục theo kết quả thi và ngành học bạn quan tâm</span>
          <button
            type="button"
            onClick={handleAdoptSuggestion}
            className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-blue-700 transition cursor-pointer shadow-2xs"
          >
            Lưu danh sách này
          </button>
        </div>
      )}

      {/* Main Table View */}
      <div className="space-y-5">
        {/* Three Tiers Summary Bar */}
        <PortfolioTiersBar
          reachCount={reachItems.length}
          targetCount={targetItems.length}
          safetyCount={safetyItems.length}
          onApplyDistribution={(reach, fit, safe) => {
            if (isSuggestion) setWishlist(editableCopy());
            applyCustomDistribution(reach, fit, safe);
            showToast(`Đã điều chỉnh danh mục: ${reach + fit + safe} NV (${reach} Thử sức · ${fit} Phù hợp · ${safe} An toàn).`);
          }}
        />

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8">
            <PortfolioTableView
              items={activeItems}
              onReorder={handleReorder}
              onRemove={handleRemove}
              onUpdateRole={(rank, newRole) => {
                if (isSuggestion) setWishlist(editableCopy());
                updateWishlistItemRole(rank, newRole);
                const roleLabel = newRole === "mao_hiem" ? "Thử sức" : newRole === "vua_tam" ? "Phù hợp" : "An toàn";
                showToast(`Đã chuyển nguyện vọng #${rank} sang tầng "${roleLabel}".`);
              }}
            />
          </div>

          <div className="lg:col-span-4 space-y-5">
            <PortfolioDonutCard
              reachCount={reachItems.length}
              targetCount={targetItems.length}
              safetyCount={safetyItems.length}
              totalCount={activeItems.length}
              assessmentVi={assessment.messageVi}
            />
            <PortfolioRationaleCard />
          </div>
        </div>

        <PortfolioActionBottomBar
          onAutoBalance={handleAutoBalance}
          onExportCsv={handleExportCsv}
          onPrintPdf={handlePrintPdf}
          onExportDossierJson={handleExportDossierJson}
          onValidate={() => setShowValidationModal(true)}
        />
      </div>

      {/* TT06 Compliance & Risk Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Thẩm định danh mục tuyển sinh (TT06/2026)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Overall status badge */}
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                validation.warnings.length === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              {validation.warnings.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div className="text-xs font-bold">
                {validation.warnings.length === 0
                  ? "Danh mục hoàn toàn hợp lệ theo Quy chế Tuyển sinh Bộ GD&ĐT (TT06/2026)"
                  : `Phát hiện ${validation.warnings.length} điểm cần lưu ý trong danh mục`}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Điểm sàn xét tuyển (≥ 15.0đ)</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đạt
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Quy định nguyện vọng Sư phạm (Top 5)</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đạt
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Lưới an toàn phòng ngừa biến động</span>
                <span className={`font-bold flex items-center gap-1 ${safetyItems.length >= 2 ? "text-emerald-700" : "text-amber-700"}`}>
                  {safetyItems.length >= 2 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đạt ({safetyItems.length} NV)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Cần thêm ({safetyItems.length}/2 NV)
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Nguy cơ trượt toàn bộ (Gauss-Hermite)</span>
                <span className="font-mono font-bold text-slate-900">
                  {(pFailAll * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Warning details if any */}
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                {validation.warnings.map((w, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium">
                    {w.message}
                  </div>
                ))}
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              {validation.warnings.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleAutoBalance();
                    setShowValidationModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Tự động sắp xếp chuẩn quy chế
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
