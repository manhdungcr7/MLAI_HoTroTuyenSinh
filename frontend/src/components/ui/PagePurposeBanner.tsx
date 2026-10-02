import React from "react";
import { LucideIcon } from "lucide-react";

export interface PagePurposeBannerProps {
  step?: string; // e.g. "BƯỚC 1/6"
  title: string; // e.g. "Xem tổng quan vị trí năng lực"
  description?: string; // optional
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function PagePurposeBanner({
  step,
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
}: PagePurposeBannerProps) {
  return (
    <div className="mb-6 p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            {step && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
                {step}
              </span>
            )}
            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="self-stretch md:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold transition shrink-0 cursor-pointer shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default PagePurposeBanner;
