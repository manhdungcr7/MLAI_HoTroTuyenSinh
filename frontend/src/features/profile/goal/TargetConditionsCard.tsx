import React from "react";
import { MapPin } from "lucide-react";
import { useDecision } from "@/state/DecisionContext";

interface TargetConditionsCardProps {
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  maxTuition: number;
  onChangeTuition: (val: number) => void;
}

const REGION_OPTIONS = [
  { id: "hanoi", label: "Hà Nội" },
  { id: "hcm", label: "TP.HCM" },
  { id: "mientrung", label: "Miền Trung" },
];

const TUITION_CHIPS = [
  { label: "<= 20", value: 20 },
  { label: "<= 40", value: 40 },
  { label: "<= 60", value: 60 },
  { label: "Không giới hạn", value: 120 },
];

export const TargetConditionsCard: React.FC<TargetConditionsCardProps> = ({
  selectedRegions,
  onToggleRegion,
  maxTuition,
  onChangeTuition,
}) => {
  const { updateProfile } = useDecision();

  const handleChipClick = (val: number) => {
    onChangeTuition(val);
    updateProfile({ annualBudgetVnd: val === 120 ? 0 : val * 1000000 });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChangeTuition(val);
    updateProfile({ annualBudgetVnd: val >= 100 ? 0 : val * 1000000 });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Khu vực & điều kiện</h3>
        </div>

        {/* Khu vực ưu tiên */}
        <div>
          <label className="text-xs text-slate-500 font-medium block mb-2">
            Khu vực ưu tiên (có thể chọn nhiều)
          </label>
          <div className="flex flex-wrap gap-2">
            {REGION_OPTIONS.map((reg) => {
              const isSelected = selectedRegions.includes(reg.id);
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => onToggleRegion(reg.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs transition font-bold cursor-pointer border ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 text-blue-700 shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Học phí */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-500 font-medium">
              Mức học phí mong muốn (triệu đồng/năm)
            </label>
            <span className="text-xs font-bold text-blue-600">
              {maxTuition >= 100 ? "Không giới hạn" : `<= ${maxTuition} tr/năm`}
            </span>
          </div>

          {/* Slider visual */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>0</span>
              <span>100+</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={maxTuition > 100 ? 100 : maxTuition}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Quick Chips for tuition */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-2">
          {TUITION_CHIPS.map((chip) => {
            const isChipActive =
              (chip.value === 120 && maxTuition >= 100) ||
              chip.value === maxTuition;

            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer ${
                  isChipActive
                    ? "bg-blue-50 border border-blue-500 text-blue-700 font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TargetConditionsCard;
