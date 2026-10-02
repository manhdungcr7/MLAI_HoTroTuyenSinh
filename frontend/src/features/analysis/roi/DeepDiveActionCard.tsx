import React from "react";
import Link from "@/components/navigation/HashLink";
import { Send, FlaskConical, ArrowRight } from "lucide-react";

interface DeepDiveActionCardProps {
  className?: string;
}

export const DeepDiveActionCard: React.FC<DeepDiveActionCardProps> = ({ className = "" }) => {
  return (
    <div
      className={`rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      {/* Background Mountain Flag Graphic */}
      <div className="absolute top-2 right-2 select-none pointer-events-none opacity-85">
        <svg
          width="110"
          height="65"
          viewBox="0 0 110 65"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="miniMountain" x1="55" y1="10" x2="55" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="miniFront" x1="75" y1="20" x2="75" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="miniFlag" x1="0" y1="0" x2="16" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
          </defs>
          <polygon points="15,65 45,25 80,65" fill="url(#miniMountain)" />
          <polygon points="40,65 75,12 105,65" fill="url(#miniFront)" />
          {/* Cột cờ */}
          <line x1="75" y1="12" x2="75" y2="2" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
          {/* Lá cờ tím */}
          <path d="M75,3 C81,1 86,5 91,3 L91,9 C86,11 81,7 75,9 Z" fill="url(#miniFlag)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-100/90 text-blue-600 flex items-center justify-center">
            <Send className="h-4 w-4 stroke-[2.2] transform -rotate-12" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Sẵn sàng khám phá sâu hơn?
          </h3>
        </div>
      </div>

      {/* 2 CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
        <Link
          href="/analysis/simulation"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs text-center"
        >
          <FlaskConical className="h-4 w-4" />
          <span>Mô phỏng thay đổi điểm</span>
        </Link>

        <Link
          href="/options"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-blue-700 transition-colors shadow-xs text-center"
        >
          <span>Tiếp tục khám phá phương án</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
