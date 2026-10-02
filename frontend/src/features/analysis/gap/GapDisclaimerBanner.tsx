import React from "react";
import { Lightbulb } from "lucide-react";

export const GapDisclaimerBanner: React.FC = () => {
  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-4.5 shadow-2xs flex items-start gap-3.5">
      <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-4.5 h-4.5 fill-amber-300 stroke-amber-700" />
      </div>

      <div className="text-xs leading-relaxed">
        <strong className="text-amber-950 font-bold block mb-0.5">
          Lưu ý quan trọng
        </strong>
        <span className="text-amber-900/90 font-medium">
          Các khuyến nghị của hệ thống Nguyện Vọng được xây dựng dựa trên phân tích dữ liệu điểm chuẩn các năm trước, mang tính tham khảo và không đảm bảo kết quả trúng tuyển trong tương lai.
        </span>
      </div>
    </div>
  );
};

export default GapDisclaimerBanner;
