import React from "react";
import Link from "@/components/navigation/HashLink";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

/** Trạng thái trống dùng chung: nói rõ vì sao chưa có kết quả và việc cần làm tiếp theo. */
export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center space-y-3 shadow-xs">
      <h2 className="text-base font-extrabold text-slate-900 text-pretty">{title}</h2>
      <p className="text-sm text-slate-600 leading-relaxed text-pretty max-w-md mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export const NO_TARGET_EMPTY_STATE = {
  title: "Bạn chưa chọn ngành mục tiêu",
  description:
    "Chọn một ngành bạn muốn vào để xem khoảng cách điểm, môn nên ưu tiên và các kịch bản thay đổi điểm.",
  actionLabel: "Chọn ngành mục tiêu",
  actionHref: "/profile/goal",
} as const;
