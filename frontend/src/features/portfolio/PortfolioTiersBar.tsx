import React, { useState } from "react";
import { Flame, Scale, ShieldCheck, Target, SlidersHorizontal, Plus, Minus, X, Check } from "lucide-react";

interface PortfolioTiersBarProps {
  reachCount: number;
  targetCount: number;
  safetyCount: number;
  onApplyDistribution?: (reach: number, fit: number, safe: number) => void;
}

export function PortfolioTiersBar({
  reachCount,
  targetCount,
  safetyCount,
  onApplyDistribution,
}: PortfolioTiersBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReach, setEditReach] = useState(reachCount);
  const [editFit, setEditFit] = useState(targetCount);
  const [editSafe, setEditSafe] = useState(safetyCount);

  const openModal = () => {
    setEditReach(reachCount);
    setEditFit(targetCount);
    setEditSafe(safetyCount);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (r: number, f: number, s: number) => {
    setEditReach(r);
    setEditFit(f);
    setEditSafe(s);
  };

  const handleConfirm = () => {
    onApplyDistribution?.(editReach, editFit, editSafe);
    setIsModalOpen(false);
  };

  const totalEdit = editReach + editFit + editSafe;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Side: Target Icon & Strategy statement */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <Target className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                Danh mục phân bổ theo 3 tầng nguyện vọng
              </h3>
            </div>
          </div>

          {/* Right Side: 3 Tier Badges + Adjust Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* 1. Thách thức */}
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-3.5 py-2 transition">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-500 text-white shadow-xs">
                <Flame className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="text-rose-900">Thử sức:</span>
                <span className="text-rose-700">{reachCount} NV</span>
              </div>
            </div>

            {/* 2. Cân bằng */}
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2 transition">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Scale className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="text-amber-900">Phù hợp:</span>
                <span className="text-amber-700">{targetCount} NV</span>
              </div>
            </div>

            {/* 3. An toàn */}
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2 transition">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="text-emerald-900">An toàn:</span>
                <span className="text-emerald-700">{safetyCount} NV</span>
              </div>
            </div>

            {/* Nút Điều chỉnh số lượng & tầng */}
            {onApplyDistribution && (
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Bấm để tùy chỉnh số lượng nguyện vọng và tỷ lệ 3 tầng"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Điều chỉnh cơ cấu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tùy chỉnh số lượng & cơ cấu 3 tầng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Điều chỉnh số lượng & tầng NV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets nhanh */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Gợi ý quy mô danh mục nhanh:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1, 2, 2)}
                  className={`p-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                    editReach === 1 && editFit === 2 && editSafe === 2
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs ring-1 ring-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-sm">5 NV</p>
                  <p className="text-[10px] text-slate-500 font-normal">1 - 2 - 2</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(2, 3, 3)}
                  className={`p-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                    editReach === 2 && editFit === 3 && editSafe === 3
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs ring-1 ring-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-sm">8 NV</p>
                  <p className="text-[10px] text-slate-500 font-normal">2 - 3 - 3</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(3, 4, 3)}
                  className={`p-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                    editReach === 3 && editFit === 4 && editSafe === 3
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs ring-1 ring-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-sm">10 NV</p>
                  <p className="text-[10px] text-slate-500 font-normal">3 - 4 - 3</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(4, 5, 6)}
                  className={`p-2 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                    editReach === 4 && editFit === 5 && editSafe === 6
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs ring-1 ring-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <p className="font-black text-sm">15 NV</p>
                  <p className="text-[10px] text-slate-500 font-normal">4 - 5 - 6</p>
                </button>
              </div>
            </div>

            {/* Steppers từng tầng */}
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
                Tùy chỉnh chi tiết số lượng:
              </span>

              {/* Thử sức */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-extrabold text-slate-800">Thử sức</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditReach(Math.max(0, editReach - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-rose-700">{editReach}</span>
                  <button
                    type="button"
                    onClick={() => setEditReach(Math.min(10, editReach + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Phù hợp */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-slate-800">Phù hợp</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFit(Math.max(0, editFit - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-amber-700">{editFit}</span>
                  <button
                    type="button"
                    onClick={() => setEditFit(Math.min(10, editFit + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* An toàn */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-slate-800">An toàn</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSafe(Math.max(0, editSafe - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-emerald-700">{editSafe}</span>
                  <button
                    type="button"
                    onClick={() => setEditSafe(Math.min(10, editSafe + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-black cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tổng số lượng */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <span className="font-bold text-slate-700">Tổng quy mô danh mục:</span>
              <span className="font-black text-blue-700 text-sm">
                {totalEdit} nguyện vọng
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={totalEdit === 0}
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng cơ cấu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
