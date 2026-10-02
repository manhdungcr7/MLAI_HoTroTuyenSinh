import React, { useState } from "react";
import {
  ListOrdered,
  Flame,
  Scale,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Trash2,
  GripVertical,
} from "lucide-react";
import { PortfolioItemDisplay } from "@/features/portfolio/default-portfolio-data";

interface PortfolioTableViewProps {
  items: PortfolioItemDisplay[];
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onRemove: (rank: number) => void;
  onUpdateRole?: (rank: number, newRole: "mao_hiem" | "vua_tam" | "an_toan") => void;
}

export function PortfolioTableView({
  items,
  onReorder,
  onRemove,
  onUpdateRole,
}: PortfolioTableViewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set transparent image or drag data
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Table Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4 md:px-6 md:py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <ListOrdered className="h-5 w-5" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Danh sách nguyện vọng ({items.length})
          </h2>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3.5 pl-6 pr-3 w-16 text-center">
                #
              </th>
              <th scope="col" className="py-3.5 px-4">
                Trường / Ngành
              </th>
              <th scope="col" className="py-3.5 px-4 w-32">
                Tổ hợp xét tuyển
              </th>
              <th scope="col" className="py-3.5 px-4 w-44">
                Điểm chuẩn tham chiếu
              </th>
              <th scope="col" className="py-3.5 px-4 w-36">
                Mức độ phù hợp
              </th>
              <th scope="col" className="py-3.5 pr-6 pl-4 w-36 min-w-[130px] text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((item, index) => {
              const itemRole = item.role || (item.admit_prob < 0.45 ? "mao_hiem" : item.admit_prob < 0.8 ? "vua_tam" : "an_toan");
              const isReach = itemRole === "mao_hiem";
              const isTarget = itemRole === "vua_tam";
              const isSafety = itemRole === "an_toan";

              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              // Format khoảng điểm tham chiếu
              const cutoffDisplay =
                item.cutoffRangeDisplay ||
                (item.forecast_p10 && item.forecast_p90
                  ? `${item.forecast_p10.toFixed(1)} – ${item.forecast_p90.toFixed(1)}`
                  : item.forecast_p50
                  ? item.forecast_p50.toFixed(1)
                  : "Chưa có dữ liệu");

              return (
                <tr
                  key={item.program_id || `${item.school_code}-${item.rank}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group transition-colors duration-150 ${
                    isDragging
                      ? "opacity-40 bg-slate-100"
                      : isDragOver
                      ? "bg-blue-50/70 border-y-2 border-blue-400"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* STT Column */}
                  <td className="py-4 pl-6 pr-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-black tracking-tight ${
                        isReach
                          ? "bg-rose-100 text-rose-800"
                          : isTarget
                          ? "bg-amber-100 text-amber-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      NV {item.rank || index + 1}
                    </span>
                  </td>

                  {/* School & Major Column */}
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 text-[13px] leading-snug">
                      {item.school_name || item.school_code}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">
                      {item.major_label}
                    </div>
                  </td>

                  {/* Combination Column */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-700 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.combinations_seen || "Chưa rõ"}
                    </span>
                  </td>

                  {/* Cutoff Range Column */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-slate-700 text-xs font-mono">
                      {cutoffDisplay}
                    </span>
                  </td>

                  {/* Role / Fit Level Column */}
                  <td className="py-4 px-4">
                    <select
                      value={itemRole}
                      onChange={(e) =>
                        onUpdateRole?.(item.rank, e.target.value as "mao_hiem" | "vua_tam" | "an_toan")
                      }
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isReach
                          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : isTarget
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      title="Bấm để thay đổi tầng của nguyện vọng này"
                    >
                      <option value="mao_hiem">🔥 Thử sức</option>
                      <option value="vua_tam">⚖️ Phù hợp</option>
                      <option value="an_toan">🛡️ An toàn</option>
                    </select>
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 pr-6 pl-4">
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      {/* Drag Handle */}
                      <button
                        type="button"
                        aria-label="Kéo để đổi thứ tự"
                        title="Kéo thả để sắp xếp"
                        className="cursor-grab active:cursor-grabbing flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onReorder(index, index - 1)}
                        aria-label="Di chuyển lên"
                        title="Chuyển lên trên"
                        className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => onReorder(index, index + 1)}
                        aria-label="Di chuyển xuống"
                        title="Chuyển xuống dưới"
                        className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.rank || index + 1)}
                        aria-label="Xóa khỏi danh sách"
                        title="Xóa nguyện vọng"
                        className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
