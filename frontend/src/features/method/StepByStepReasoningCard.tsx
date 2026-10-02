import React from "react";
import { Settings } from "lucide-react";

export interface StepByStepReasoningCardProps {
  topSubjectName?: string;
  className?: string;
}

export function StepByStepReasoningCard({
  topSubjectName = "Tiếng Anh",
  className = "",
}: StepByStepReasoningCardProps) {
  const steps = [
    {
      num: 1,
      text: "Đánh giá năng lực hiện tại của bạn dựa trên điểm số, hồ sơ và kết quả dự báo.",
      highlight: "Khảo sát năng lực & ràng buộc",
    },
    {
      num: 2,
      text: "So sánh với điểm chuẩn lịch sử và xu hướng biến động của từng ngành, trường.",
      highlight: "Định vị khoảng cách mục tiêu (Gap Analysis)",
    },
    {
      num: 3,
      text: "Tính toán khoảng cách điểm giữa năng lực hiện tại và mức điểm mục tiêu.",
      highlight: "Xác định môn học ưu tiên bứt phá điểm số",
    },
    {
      num: 4,
      text: "Xác định các ngành, trường phù hợp dựa trên mức độ phù hợp và cơ hội trúng tuyển.",
      highlight: "Xây dựng danh mục phân tán rủi ro (3-3-2 Portfolio)",
    },
    {
      num: 5,
      text: `Đề xuất kế hoạch ôn tập, ưu tiên các môn có tác động lớn nhất (hiện tại là ${topSubjectName}).`,
      highlight: "Chuyển đổi thành hành động tuần khả thi (Study Schedule)",
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Settings className="h-5 w-5 stroke-[2.4]" />
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Suy luận từng bước
          </h2>
        </div>

        {/* 5 Steps */}
        <div className="space-y-3.5">
          {steps.map((step) => (
            <div key={step.num} className="flex items-start gap-3.5 group">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black shadow-xs">
                {step.num}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed pt-0.5">
                <span>{step.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StepByStepReasoningCard;
