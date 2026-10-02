import React from "react";
import { Target } from "lucide-react";

interface HeroLeverageBannerProps {
  topSubjectName?: string;
  unlockedCount?: number;
  deltaPoint?: number;
}

export const HeroLeverageBanner: React.FC<HeroLeverageBannerProps> = ({
  topSubjectName = "Tiếng Anh",
  unlockedCount = 12,
  deltaPoint = 1,
}) => {
  return (
    <div className="relative">
      {/* Hero Banner Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 z-10 max-w-2xl">
          {/* Target Icon in Double Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center shadow-xs">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white flex items-center justify-center shadow-xs">
                <Target className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 stroke-[2.2]" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight leading-snug text-pretty">
              Tăng điểm ở {topSubjectName} đang tạo ra nhiều lựa chọn mới nhất
            </h2>
            <p className="text-sm text-slate-700 mt-1.5 leading-relaxed text-pretty">
              Chỉ cần tăng {deltaPoint} điểm {topSubjectName}, bạn có thể mở thêm khoảng{" "}
              <strong className="text-blue-700 font-bold">{unlockedCount} lựa chọn</strong> ngành/trường phù hợp.
            </p>
          </div>
        </div>

        {/* Vector ngọn núi cắm cờ tím tinh tế góc phải */}
        <div className="shrink-0 hidden md:flex items-center justify-end pr-2 select-none pointer-events-none opacity-90">
          <svg
            width="180"
            height="110"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="mountainGrad" x1="100" y1="10" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="mountainFront" x1="130" y1="30" x2="130" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="flagGrad" x1="0" y1="0" x2="24" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
            </defs>
            {/* Núi phía sau */}
            <polygon points="30,120 80,45 140,120" fill="url(#mountainGrad)" />
            {/* Núi chính giữa đỉnh cờ */}
            <polygon points="70,120 130,22 195,120" fill="url(#mountainFront)" />
            {/* Tuyết đỉnh núi */}
            <polygon points="120,38 130,22 140,38 135,34 130,37 125,33" fill="#FFFFFF" opacity="0.9" />
            {/* Cột cờ */}
            <line x1="130" y1="22" x2="130" y2="6" stroke="#4B5563" strokeWidth="2.2" strokeLinecap="round" />
            {/* Cờ màu tím bay */}
            <path
              d="M130,7 C138,4 144,11 152,8 L152,18 C144,21 138,14 130,17 Z"
              fill="url(#flagGrad)"
            />
            {/* Mặt trăng hoặc mặt trời mờ */}
            <circle cx="165" cy="20" r="12" fill="#FEF08A" opacity="0.5" />
            {/* Mây trôi nhẹ */}
            <ellipse cx="60" cy="55" rx="25" ry="7" fill="#FFFFFF" opacity="0.75" />
            <ellipse cx="160" cy="65" rx="20" ry="6" fill="#FFFFFF" opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
