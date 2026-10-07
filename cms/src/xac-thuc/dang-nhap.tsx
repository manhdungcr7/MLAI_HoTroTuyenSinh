import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCheck, Shield, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { The, Nut, Nhan, gop } from "@cms/thanh-phan/ui/nut-the";
import { OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { DUONG_DAN } from "@cms/duong-dan";
import {
  TAI_KHOAN_MAU, luuTaiKhoan, layTaiKhoanHienTai, type TaiKhoanCms
} from "./phien-lam-viec";
import type { VaiTro } from "@cms/may-chu/kieu";

export default function TrangDangNhap() {
  const navigate = useNavigate();
  const [hienTai] = useState(layTaiKhoanHienTai());
  const [vaiTroChon, setVaiTroChon] = useState<VaiTro>(hienTai.vaiTro);
  const [emailTuyChon, setEmailTuyChon] = useState(hienTai.email);
  const [hoTenTuyChon, setHoTenTuyChon] = useState(hienTai.hoTen);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const xuLyDangNhap = (e: React.FormEvent) => {
    e.preventDefault();
    const tk: TaiKhoanCms = {
      email: emailTuyChon.trim() || TAI_KHOAN_MAU[vaiTroChon].email,
      hoTen: hoTenTuyChon.trim() || TAI_KHOAN_MAU[vaiTroChon].hoTen,
      vaiTro: vaiTroChon,
      truongDuocGiao: vaiTroChon === "qtv" ? ["*"] : TAI_KHOAN_MAU.ctv.truongDuocGiao,
    };
    luuTaiKhoan(tk, true);
    setThongBao(`Đăng nhập thành công với vai trò ${vaiTroChon === "qtv" ? "Quản trị viên" : "Cộng tác viên"}!`);
    setTimeout(() => {
      navigate(DUONG_DAN.tongQuan());
    }, 400);
  };

  const chonNhanh = (vai: VaiTro) => {
    setVaiTroChon(vai);
    setEmailTuyChon(TAI_KHOAN_MAU[vai].email);
    setHoTenTuyChon(TAI_KHOAN_MAU[vai].hoTen);
  };

  return (
    <div className="min-h-screen bg-nen flex flex-col justify-center items-center px-4 py-8 antialiased">
      <div className="w-full max-w-md space-y-5">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl gd-xanh text-white items-center justify-center shadow-md">
            <ShieldCheck size={32} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-muc tracking-tight">
            CMS Nguyện Vọng AI
          </h1>
          <p className="text-xs md:text-sm text-chu-phu">
            Hệ thống quản trị và kiểm chứng dữ liệu tuyển sinh đại học 2026
          </p>
        </div>

        {thongBao && (
          <div className="p-3 bg-luc-nhat/80 border border-luc/40 rounded-xl text-xs font-bold text-luc-chu flex items-center gap-2">
            <CheckCircle2 size={16} className="text-luc shrink-0" />
            <span>{thongBao}</span>
          </div>
        )}

        {/* Card Đăng Nhập & Chọn Phân Quyền */}
        <The className="p-5 md:p-6 border-vien shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-muc uppercase tracking-wider">
              Chọn tài khoản & Phân quyền
            </h2>
            <p className="text-xs text-chu-phu">
              Phân quyền theo vai trò thực tế để quản lý và kiểm chứng thông tin
            </p>
          </div>

          {/* Chọn 2 vai trò trực quan */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => chonNhanh("qtv")}
              className={gop(
                "p-3 rounded-xl border text-left transition-all relative select-none",
                vaiTroChon === "qtv"
                  ? "border-xanh bg-xanh-nhat/40 ring-2 ring-xanh/30 shadow-xs"
                  : "border-vien bg-trang hover:bg-nen/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={gop("size-8 rounded-lg grid place-items-center text-white", vaiTroChon === "qtv" ? "bg-xanh" : "bg-chu-phu/60")}>
                  <Shield size={16} strokeWidth={2.5} />
                </span>
                {vaiTroChon === "qtv" && <Nhan tone="xanh">Đang chọn</Nhan>}
              </div>
              <p className="font-extrabold text-xs text-muc">Quản trị viên</p>
              <p className="text-[10.5px] text-chu-phu mt-0.5 leading-tight">Toàn quyền duyệt & xuất bản</p>
            </button>

            <button
              type="button"
              onClick={() => chonNhanh("ctv")}
              className={gop(
                "p-3 rounded-xl border text-left transition-all relative select-none",
                vaiTroChon === "ctv"
                  ? "border-luc bg-luc-nhat/40 ring-2 ring-luc/30 shadow-xs"
                  : "border-vien bg-trang hover:bg-nen/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={gop("size-8 rounded-lg grid place-items-center text-white", vaiTroChon === "ctv" ? "bg-luc" : "bg-chu-phu/60")}>
                  <UserCheck size={16} strokeWidth={2.5} />
                </span>
                {vaiTroChon === "ctv" && <Nhan tone="luc">Đang chọn</Nhan>}
              </div>
              <p className="font-extrabold text-xs text-muc">Cộng tác viên</p>
              <p className="text-[10.5px] text-chu-phu mt-0.5 leading-tight">Nhập liệu & gửi duyệt</p>
            </button>
          </div>

          {/* Form thông tin chi tiết */}
          <form onSubmit={xuLyDangNhap} className="space-y-3 pt-1">
            <Truong nhan="Họ và tên hiển thị">
              <OInput
                value={hoTenTuyChon}
                onChange={(e) => setHoTenTuyChon(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </Truong>

            <Truong nhan="Email làm việc">
              <OInput
                type="email"
                value={emailTuyChon}
                onChange={(e) => setEmailTuyChon(e.target.value)}
                placeholder="ten@nguyenvongai.vn"
              />
            </Truong>

            <div className="pt-2">
              <Nut
                kieu="chinh"
                bieuTuong={ArrowRight}
                rong
                className="py-3 font-extrabold text-sm"
              >
                Vào bảng điều khiển ({vaiTroChon === "qtv" ? "QTV" : "CTV"})
              </Nut>
            </div>
          </form>

          {/* Quyền hạn chi tiết */}
          <div className="p-3 rounded-xl bg-nen/80 border border-vien/70 text-[11.5px] space-y-1.5">
            <p className="font-bold text-muc flex items-center gap-1">
              <Sparkles size={13} className="text-xanh" /> Quyền hạn của vai trò này:
            </p>
            {vaiTroChon === "qtv" ? (
              <ul className="list-disc pl-4 space-y-0.5 text-chu-phu">
                <li>Phê duyệt / Từ chối các bản ghi do CTV gửi lên</li>
                <li>Đóng gói và xuất bản dữ liệu tuyển sinh Snapshot</li>
                <li>Quản lý danh sách thành viên & phân công trường</li>
                <li>Cấu hình thông báo tức thời qua Telegram Webhook</li>
              </ul>
            ) : (
              <ul className="list-disc pl-4 space-y-0.5 text-chu-phu">
                <li>Nhập mới & cập nhật thông tin trường được phân công</li>
                <li>Bổ sung đề án, học phí, điểm chuẩn, nguồn kiểm chứng</li>
                <li>Gửi yêu cầu phê duyệt trực tiếp tới Quản trị viên</li>
                <li>Theo dõi tiến độ duyệt & nhận phản hồi sửa bài</li>
              </ul>
            )}
          </div>
        </The>

        <p className="text-center text-[11px] text-chu-phu">
          Hệ thống bảo mật dữ liệu nguồn mở · Nguyện Vọng AI 2026
        </p>
      </div>
    </div>
  );
}
