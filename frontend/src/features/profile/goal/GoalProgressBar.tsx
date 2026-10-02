import React from "react";

interface GoalProgressBarProps {
  currentStep?: number;
  totalSteps?: number;
  stepTitle?: string;
  percent?: number;
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  currentStep = 2,
  totalSteps = 9,
  stepTitle = "Xác định mục tiêu",
  percent = 22,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600">
            Mục tiêu học tập
          </span>
          <span className="text-slate-400 font-medium">—</span>
          <span className="text-sm font-medium text-slate-600">
            {stepTitle}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default GoalProgressBar;
