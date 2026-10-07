import { AlertCircle } from "lucide-react";
import { dangDungDuLieuMau, vaiTroMau } from "../may-chu/che-do";

export function DangDungDuLieuMau() {
  if (!dangDungDuLieuMau()) return null;
  const vai = vaiTroMau();
  return (
    <div className="bg-cam-nhat border-b border-cam/20 px-4 py-2 text-[13px] text-cam-chu flex items-center gap-2">
      <AlertCircle size={16} className="shrink-0" />
      <span>
        Chế độ dữ liệu mẫu ({vai === "ctv" ? "Tình nguyện viên" : "Quản trị viên"}). Dữ liệu không ghi vào máy chủ thật.
      </span>
    </div>
  );
}
