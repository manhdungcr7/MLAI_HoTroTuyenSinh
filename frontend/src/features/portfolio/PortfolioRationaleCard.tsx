import React from "react";
import { Lightbulb } from "lucide-react";

export function PortfolioRationaleCard() {
  const points = [
    {
      step: 1,
      title: "Ưu tiên ngành và trường bạn mong muốn nhất lên đầu tiên",
    },
    {
      step: 2,
      title: "Đan xen hợp lý giữa nhóm Thử sức và Phù hợp theo năng lực",
    },
    {
      step: 3,
      title: "Luôn giữ ít nhất 2 nguyện vọng An toàn ở cuối danh sách",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-500">
          <Lightbulb className="h-4 w-4" />
        </div>
        <h3 className="font-extrabold text-base tracking-tight">Nguyên tắc xếp nguyện vọng</h3>
      </div>

      {/* 3 Strategic Points */}
      <div className="space-y-3">
        {points.map((p) => (
          <div key={p.step} className="flex items-center gap-3">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
              {p.step}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                {p.title}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
