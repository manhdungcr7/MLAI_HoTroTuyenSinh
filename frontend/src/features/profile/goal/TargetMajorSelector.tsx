import React, { useState } from "react";
import { GraduationCap, HelpCircle, Code2, ChevronDown } from "lucide-react";

interface TargetMajorSelectorProps {
  selectedMajor: string;
  onSelectMajor: (major: string) => void;
}

const MAJOR_OPTIONS = [
  "Công nghệ thông tin",
  "Khoa học máy tính",
  "Kỹ thuật phần mềm",
  "An toàn thông tin",
  "Kỹ thuật Máy tính",
  "Trí tuệ nhân tạo (AI)",
  "Hệ thống thông tin",
  "Quản trị kinh doanh",
  "Kinh tế quốc tế",
];

const SUGGESTED_CHIPS = [
  "Khoa học máy tính",
  "Kỹ thuật phần mềm",
  "An toàn thông tin",
];

export const TargetMajorSelector: React.FC<TargetMajorSelectorProps> = ({
  selectedMajor,
  onSelectMajor,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Ngành mục tiêu</h3>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition"
            title="Ngành đào tạo trọng tâm bạn hướng tới"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium block mb-2">
            Chọn ngành bạn quan tâm nhất
          </label>

          {/* Custom Select Box */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition text-left cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedMajor || "Công nghệ thông tin"}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                {MAJOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onSelectMajor(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      selectedMajor === opt
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <span className="text-[11px] font-medium text-slate-500 block mb-2">
          Các ngành gợi ý khác
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CHIPS.map((chip) => {
            const isChipSelected = selectedMajor === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onSelectMajor(chip)}
                className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer ${
                  isChipSelected
                    ? "bg-blue-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TargetMajorSelector;
