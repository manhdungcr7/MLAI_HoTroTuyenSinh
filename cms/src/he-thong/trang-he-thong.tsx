import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { usePhien } from "@cms/trang-thai/phien";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { gop } from "@cms/thanh-phan/ui/nut-the";
import QuanLyThanhVien from "./quan-ly-thanh-vien";
import NhatKyHeThong from "./nhat-ky-he-thong";
import ThongBaoTelegram from "./thong-bao-telegram";
import HopThu from "./hop-thu";
import { KhoiCaiDatHeThong } from "./cai-dat-he-thong";

type Tab = "thanh-vien" | "cai-dat" | "hop-thu" | "nhat-ky" | "thong-bao";
const TAB: { id: Tab; nhan: string; choCtv?: boolean }[] = [
  { id: "thanh-vien", nhan: "Thành viên" },
  { id: "cai-dat", nhan: "Cài đặt", choCtv: true },
  { id: "hop-thu", nhan: "Hộp thư", choCtv: true },
  { id: "nhat-ky", nhan: "Nhật ký" },
  { id: "thong-bao", nhan: "Thông báo" },
];

export default function TrangHeThong() {
  const { laQtv } = usePhien();
  const [tab, setTab] = useState<Tab>(laQtv ? "thanh-vien" : "cai-dat");
  const tabHienThi = TAB.filter((t) => laQtv || t.choCtv);
  const tabChon = tabHienThi.some((t) => t.id === tab) ? tab : (tabHienThi[0]?.id ?? "cai-dat");

  return (
    <div className="space-y-3">
      <DauTrangChinh
        tieuDe="Hệ thống"
        moTa={
          laQtv
            ? "Quản lý thành viên, cài đặt vận hành, hộp thư cộng đồng và nhật ký kiểm toán."
            : "Xem cài đặt hệ thống (chỉ đọc) và xử lý báo sai của trường được giao."
        }
      />
      <NoiDung>
        <div role="tablist" className="flex flex-wrap bg-trang border border-vien rounded-xl p-1 gap-1">
          {tabHienThi.map((t) => (
            <button key={t.id} role="tab" aria-selected={tabChon === t.id} onClick={() => setTab(t.id)}
              className={gop("flex-1 min-w-[78px] min-h-12 rounded-lg text-[13px] font-bold px-1.5", tabChon === t.id ? "bg-xanh text-white" : "text-chu-phu")}>{t.nhan}</button>
          ))}
        </div>
        {tabChon === "thanh-vien" && (laQtv ? <QuanLyThanhVien /> : <TrangThaiTrong bieuTuong={<ShieldAlert size={26} />} tieuDe="Bạn không có quyền ở mục này" moTa="Cần thêm quyền thì nhờ quản trị viên." />)}
        {tabChon === "cai-dat" && <KhoiCaiDatHeThong />}
        {tabChon === "hop-thu" && <HopThu />}
        {tabChon === "nhat-ky" && (laQtv ? <NhatKyHeThong /> : <TrangThaiTrong bieuTuong={<ShieldAlert size={26} />} tieuDe="Bạn không có quyền ở mục này" moTa="Cần thêm quyền thì nhờ quản trị viên." />)}
        {tabChon === "thong-bao" && (laQtv ? <ThongBaoTelegram /> : <TrangThaiTrong bieuTuong={<ShieldAlert size={26} />} tieuDe="Bạn không có quyền ở mục này" moTa="Cần thêm quyền thì nhờ quản trị viên." />)}
      </NoiDung>
    </div>
  );
}

