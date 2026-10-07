import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { usePhien } from "@cms/trang-thai/phien";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import QuanLyThanhVien from "./quan-ly-thanh-vien";
import NhatKyHeThong from "./nhat-ky-he-thong";
import ThongBaoTelegram from "./thong-bao-telegram";

type Tab = "thanh-vien" | "nhat-ky" | "thong-bao";
const TAB: { id: Tab; nhan: string }[] = [
  { id: "thanh-vien", nhan: "Thành viên" },
  { id: "nhat-ky", nhan: "Nhật ký" },
  { id: "thong-bao", nhan: "Thông báo" },
];

export default function TrangHeThong() {
  const { laQtv } = usePhien();
  const [tab, setTab] = useState<Tab>("thanh-vien");
  if (!laQtv) {
    return (
      <div className="space-y-3">
        <DauTrangChinh tieuDe="Hệ thống" moTa="Quản lý thành viên và xem nhật ký. Chỉ quản trị viên được vào." />
        <NoiDung><TrangThaiTrong bieuTuong={<ShieldAlert size={26} />} tieuDe="Bạn không có quyền ở mục này" moTa="Cần thêm quyền thì nhờ quản trị viên." /></NoiDung>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <DauTrangChinh tieuDe="Hệ thống" moTa="Thêm thành viên, giao trường cho cộng tác viên, và xem ai đã làm gì." />
      <NoiDung>
        <div role="tablist" className="flex bg-trang border border-vien rounded-xl p-1 gap-1">
          {TAB.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={gop("flex-1 min-h-12 rounded-lg text-[13px] font-bold px-1", tab === t.id ? "bg-xanh text-white" : "text-chu-phu")}>{t.nhan}</button>
          ))}
        </div>
        {tab === "thanh-vien" && <QuanLyThanhVien />}
        {tab === "nhat-ky" && <NhatKyHeThong />}
        {tab === "thong-bao" && <ThongBaoTelegram />}
      </NoiDung>
    </div>
  );
}
