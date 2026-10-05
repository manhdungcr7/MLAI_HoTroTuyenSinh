import React from "react";
import { useApp } from "@/state/AppContext";

/** Chỉ hiển thị nội dung khi dữ liệu điểm chuẩn đã tải xong; có nút thử lại khi lỗi. */
export function CatalogGate({ children }: { children: React.ReactNode }) {
  const { catalogStatus, retryCatalog } = useApp();
  if (catalogStatus === "ready") return <>{children}</>;
  if (catalogStatus === "error") {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">Không tải được dữ liệu</p>
        <button type="button" onClick={retryCatalog} className="h-12 rounded-2xl bg-blue-600 px-8 text-sm font-bold text-white hover:bg-blue-700 cursor-pointer">
          Thử lại
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-base font-bold text-slate-400" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true" />
      Đang tải dữ liệu
    </div>
  );
}
