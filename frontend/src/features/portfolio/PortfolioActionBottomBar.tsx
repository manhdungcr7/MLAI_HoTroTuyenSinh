import React, { useState } from "react";
import { Sparkles, Download, ArrowRight, FileSpreadsheet, Printer, ShieldCheck } from "lucide-react";
import { useRouter } from "@/routes";

interface PortfolioActionBottomBarProps {
  onAutoBalance: () => void;
  onExportCsv: () => void;
  onPrintPdf: () => void;
  onExportDossierJson?: () => void;
  onValidate?: () => void;
}

export function PortfolioActionBottomBar({
  onAutoBalance,
  onExportCsv,
  onPrintPdf,
  onExportDossierJson,
  onValidate,
}: PortfolioActionBottomBarProps) {
  const router = useRouter();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleNextStep = () => {
    router.push("/study-plan");
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
      {/* Left: Auto-balance & Validate buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <button
          type="button"
          onClick={onAutoBalance}
          className="group flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 p-3 px-4 text-left transition shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs md:text-sm font-extrabold text-slate-900 leading-tight">
              Tự động sắp xếp lại
            </div>
          </div>
        </button>

        {onValidate && (
          <button
            type="button"
            onClick={onValidate}
            className="group flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 p-3 px-4 text-left transition shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-extrabold text-emerald-950 leading-tight">
                Kiểm tra hợp lệ TT06
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Right: Export & Next Step CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative">
        {/* Export Button with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl border-2 border-blue-600 bg-white hover:bg-blue-50/60 px-5 py-3 text-left transition text-blue-600 shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 shrink-0 stroke-[2.2]" />
            <span className="text-xs md:text-sm font-extrabold text-blue-700">
              Xuất danh sách
            </span>
          </button>

          {/* Export Dropdown */}
          {showExportMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExportCsv();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Tải file Excel / CSV (Bộ GD&ĐT)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onPrintPdf();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <Printer className="h-4 w-4 text-blue-600" />
                <span>In / Lưu PDF danh mục</span>
              </button>
              {onExportDossierJson && (
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportDossierJson();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>Hồ sơ Thẩm định (JSON Dossier)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Next Step CTA Button */}
        <button
          type="button"
          onClick={handleNextStep}
          className="flex items-center justify-center gap-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-5 py-3 text-white transition shadow-sm hover:shadow-md cursor-pointer group"
        >
          <span className="text-xs md:text-sm font-black leading-tight">
            Tạo kế hoạch học tập
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
