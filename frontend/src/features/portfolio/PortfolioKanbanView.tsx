import React, { useState, useMemo } from "react";
import {
  GripVertical,
  Plus,
  Sparkles,
  ArrowUpDown,
  Trash2,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Scale,
  Flame,
} from "lucide-react";
import { PortfolioItemDisplay } from "@/features/portfolio/default-portfolio-data";
import { SchoolAvatar } from "@/components/ui/SchoolAvatar";
import { validatePortfolio, calculateWishlistFailAll } from "@/engine/decision/optimizer";

interface PortfolioKanbanViewProps {
  items: PortfolioItemDisplay[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (rank: number) => void;
  onAutoBalance?: () => void;
  onAddClick?: (role: "mao_hiem" | "vua_tam" | "an_toan") => void;
  onAiCheck?: () => void;
}

export function PortfolioKanbanView({
  items,
  onReorder,
  onRemove,
  onAutoBalance,
  onAddClick,
}: PortfolioKanbanViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Phân chia items theo 3 nhóm
  const reachItems = items.filter((i) => i.role === "mao_hiem");
  const targetItems = items.filter((i) => i.role === "vua_tam");
  const safetyItems = items.filter((i) => i.role === "an_toan");

  // Tính toán xác suất trượt tất cả & thẩm định quy chế TT06
  const pFailAll = useMemo(() => calculateWishlistFailAll(items), [items]);
  const validation = useMemo(() => validatePortfolio(items), [items]);
  const hasSafetyAlert = safetyItems.length < 2;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const sourceIdx = items.findIndex((i) => (i.program_id || i.school_code + i.major_label) === draggedId);
    const targetIdx = items.findIndex((i) => (i.program_id || i.school_code + i.major_label) === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      onReorder(sourceIdx, targetIdx);
    }
    setDraggedId(null);
  };

  const moveItem = (item: PortfolioItemDisplay, direction: "up" | "down") => {
    const idx = items.findIndex((i) => i.rank === item.rank);
    if (idx === -1) return;
    const destIdx = direction === "up" ? idx - 1 : idx + 1;
    if (destIdx >= 0 && destIdx < items.length) {
      onReorder(idx, destIdx);
    }
  };

  const renderTierColumn = (
    title: string,
    role: "mao_hiem" | "vua_tam" | "an_toan",
    tierItems: PortfolioItemDisplay[],
    icon: React.ReactNode,
    badgeColor: { bg: string; text: string; border: string },
    cutoffTone: string
  ) => {
    return (
      <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex-1 min-w-[280px]">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">{icon}</span>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">
              {title} ({tierItems.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onAddClick?.(role)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm
          </button>
        </div>

        {/* Column Items */}
        <div className="mt-3 space-y-2.5 flex-1 min-h-[160px]">
          {tierItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-400 font-semibold">Chưa có nguyện vọng</p>
              <button
                type="button"
                onClick={() => onAddClick?.(role)}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Thêm lựa chọn
              </button>
            </div>
          ) : (
            tierItems.map((item) => {
              const itemId = item.program_id || `${item.school_code}-${item.major_label}`;
              const scoreVal = item.latest_score || item.forecast_p50 || 0;

              return (
                <div
                  key={itemId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, itemId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, itemId)}
                  className="group relative flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Real National Rank Number */}
                    <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-black text-xs shrink-0 tracking-tight">
                      NV {item.rank}
                    </div>

                    {/* School Avatar */}
                    <SchoolAvatar schoolCode={item.school_code} schoolName={item.school_name} size="sm" />

                    {/* School & Major info */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.school_name}>
                        {item.school_name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate" title={item.major_label}>
                        {item.major_label}
                      </p>
                    </div>
                  </div>

                  {/* Cutoff pill & handles */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.combinations_seen && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200 hidden sm:inline-block">
                        {item.combinations_seen}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-tight ${cutoffTone}`}
                    >
                      Điểm chuẩn: {scoreVal > 0 ? scoreVal.toFixed(1) : "—"}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveItem(item, "up")}
                        disabled={item.rank === 1}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                        title="Đẩy lên"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item, "down")}
                        disabled={item.rank === items.length}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                        title="Đẩy xuống"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.rank)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa nguyện vọng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {renderTierColumn(
          "Thử sức",
          "mao_hiem",
          reachItems,
          <Flame className="w-4 h-4 text-rose-600" />,
          { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
          "bg-rose-50 text-rose-700 border-rose-200"
        )}

        {renderTierColumn(
          "Phù hợp",
          "vua_tam",
          targetItems,
          <Scale className="w-4 h-4 text-emerald-600" />,
          { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
          "bg-emerald-50 text-emerald-700 border-emerald-200"
        )}

        {renderTierColumn(
          "An toàn",
          "an_toan",
          safetyItems,
          <ShieldCheck className="w-4 h-4 text-blue-600" />,
          { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
          "bg-blue-50 text-blue-700 border-blue-200"
        )}
      </div>

      {/* 2. Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setShowValidationModal(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Kiểm tra hợp lệ danh mục
        </button>

        <button
          type="button"
          onClick={onAutoBalance}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-2xs transition cursor-pointer"
        >
          <ArrowUpDown className="w-4 h-4" />
          Tự động sắp xếp
        </button>
      </div>

      {/* 3. Bottom Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Safety status */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            hasSafetyAlert
              ? "bg-rose-50/70 border-rose-200 text-rose-950"
              : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasSafetyAlert ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-semibold text-slate-600">Lưới an toàn</p>
              <p className="text-sm font-black mt-0.5">
                {hasSafetyAlert ? "Thiếu nguyện vọng an toàn" : `${safetyItems.length} nguyện vọng an toàn`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {safetyItems.length}/15 NV
          </span>
        </div>

        {/* Card 2: Structure */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-600">Phân bổ 3 tầng</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {reachItems.length} Thử sức · {targetItems.length} Phù hợp · {safetyItems.length} An toàn
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Tổng {items.length} NV
          </span>
        </div>

        {/* Card 3: P(Fail all) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-600">Nguy cơ trượt toàn bộ</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {(pFailAll * 100).toFixed(2)}% ({pFailAll <= 0.05 ? "Rất an toàn" : pFailAll <= 0.15 ? "Ổn định" : "Cần lưu ý"})
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Gauss-Hermite
          </span>
        </div>
      </div>

      {/* 4. TT06 & Portfolio Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Thẩm định danh mục tuyển sinh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
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
                      <AlertTriangle className="w-3.5 h-3.5" /> Cần thêm ({safetyItems.length}/2 NV)
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
              {validation.warnings.length > 0 && onAutoBalance && (
                <button
                  type="button"
                  onClick={() => {
                    onAutoBalance();
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

export default PortfolioKanbanView;
