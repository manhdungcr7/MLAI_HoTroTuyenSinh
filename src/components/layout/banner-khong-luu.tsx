// Báo khi trình duyệt không cho ghi dữ liệu (đầy bộ nhớ, chế độ riêng tư): em cần tải bản sao lưu kẻo mất.
import { AlertTriangle } from "lucide-react";
import { taoBanSaoLuu } from "@/state/sao-luu";
import { useApp } from "@/state/store";
import { taiTepJson } from "@/state/tai-tep";

export function BannerKhongLuu() {
  const { s, luuDuoc } = useApp();
  if (luuDuoc) return null;
  return (
    <div role="alert" className="mx-4 mt-3 rounded-xl bg-cam-nhat p-3 flex items-center gap-3">
      <AlertTriangle size={20} className="text-cam-chu shrink-0" />
      <p className="text-[13px] text-cam-chu leading-snug flex-1">Máy không lưu được dữ liệu, em tải bản sao lưu nhé.</p>
      <button type="button" onClick={() => taiTepJson(taoBanSaoLuu(s))} className="min-h-11 px-3 rounded-lg bg-trang border border-vien text-[13px] font-bold text-muc shrink-0">Tải về</button>
    </div>
  );
}
