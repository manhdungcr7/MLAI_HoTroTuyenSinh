import React from "react";
import { Database, Info, BarChart2, FileText, Coins, MapPin, Users } from "lucide-react";

export interface UsedDataCardProps {
  activeCombination?: string;
  combinationDetail?: string;
  className?: string;
}

export function UsedDataCard({
  activeCombination = "A01",
  combinationDetail = "Toán - Vật lý - Tiếng Anh và trọng số (nếu có) của từng trường",
  className = "",
}: UsedDataCardProps) {
  const dataItems = [
    {
      id: "historical-cutoff",
      title: "Điểm chuẩn lịch sử",
      description: "Điểm chuẩn 3 năm gần nhất (2022 - 2024) của các trường, ngành liên quan",
      icon: BarChart2,
      bgColor: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "combination",
      title: `Tổ hợp ${activeCombination}`,
      description: combinationDetail,
      icon: FileText,
      bgColor: "bg-purple-50 text-purple-600",
    },
    {
      id: "tuition",
      title: "Học phí",
      description: "Mức học phí dự kiến theo thông tin tuyển sinh chính thức của các trường",
      icon: Coins,
      bgColor: "bg-amber-50 text-amber-600",
    },
    {
      id: "location",
      title: "Khu vực",
      description: "Ưu tiên khu vực, khoảng cách địa lý và chi phí sinh hoạt",
      icon: MapPin,
      bgColor: "bg-rose-50 text-rose-600",
    },
    {
      id: "suitability",
      title: "Mức độ phù hợp",
      description: "Dựa trên sở thích, năng lực, xu hướng ngành và nhu cầu nhân lực trong tương lai",
      icon: Users,
      bgColor: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between ${className}`}>
      <div>
        {/* Header with info badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Database className="h-5 w-5 stroke-[2.4]" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Dữ liệu đã dùng
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Dữ liệu được cập nhật đến 2024</span>
          </div>
        </div>

        {/* List of Data Inputs */}
        <div className="divide-y divide-slate-100">
          {dataItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3.5">
                <div className={`rounded-xl p-2 shrink-0 ${item.bgColor}`}>
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UsedDataCard;
