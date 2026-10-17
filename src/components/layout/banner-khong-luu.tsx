// Báo khi dữ liệu không an toàn: (1) trình duyệt không cho ghi (đầy bộ nhớ, chế độ riêng tư), (2) dữ liệu cũ bị hỏng lúc mở app.
import { AlertTriangle } from "lucide-react";
import { taoBanSaoLuu } from "@/state/sao-luu";
import { docBanHong, useApp } from "@/state/store";
import { taiTepJson } from "@/state/tai-tep";

export function BannerKhongLuu() {
  const { s, luuDuoc, duLieuCuHong, boBaoHong } = useApp();
  if (luuDuoc && !duLieuCuHong) return null;
  return (
    <>
      {!luuDuoc && (
        <div role="alert" className="mx-4 mt-3 rounded-xl bg-cam-nhat p-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-cam-chu shrink-0" />
          <p className="text-[13px] text-cam-chu leading-snug flex-1">Máy không lưu được dữ liệu, em tải bản sao lưu nhé.</p>
          <button type="button" onClick={() => taiTepJson(taoBanSaoLuu(s))} className="min-h-11 px-3 rounded-lg bg-trang border border-vien text-[13px] font-bold text-muc shrink-0">Tải về</button>
        </div>
      )}
      {duLieuCuHong && (
        <div role="alert" className="mx-4 mt-3 rounded-xl bg-cam-nhat p-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-cam-chu shrink-0" />
          <p className="text-[13px] text-cam-chu leading-snug flex-1">Dữ liệu cũ bị hỏng, đã lưu bản sao để khôi phục.</p>
          <button type="button" onClick={() => { const t = docBanHong(); if (t) taiTepJson(t, "nguyen-vong-ai-du-lieu-hong.json"); }} className="min-h-11 px-3 rounded-lg bg-trang border border-vien text-[13px] font-bold text-muc shrink-0">Tải về</button>
          <button type="button" onClick={boBaoHong} className="min-h-11 px-3 rounded-lg bg-trang border border-vien text-[13px] font-bold text-muc shrink-0">Đã rõ</button>
        </div>
      )}
    </>
  );
}
