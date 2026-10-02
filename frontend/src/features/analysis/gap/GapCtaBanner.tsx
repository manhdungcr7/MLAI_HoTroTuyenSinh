import React from "react";
import Link from "@/components/navigation/HashLink";
import { ArrowRight } from "lucide-react";

interface GapCtaBannerProps {
  href?: string;
  title?: string;
  subtitle?: string;
}

export const GapCtaBanner: React.FC<GapCtaBannerProps> = ({
  href = "/analysis/roi",
  title = "Xem môn nên ưu tiên ->",
  subtitle = "Khám phá những môn cần tập trung để thu hẹp khoảng cách",
}) => {
  return (
    <Link
      href={href}
      className="group block w-full rounded-2xl bg-blue-600 hover:bg-blue-700 p-4 sm:p-5 text-white transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </div>
    </Link>
  );
};

export default GapCtaBanner;
