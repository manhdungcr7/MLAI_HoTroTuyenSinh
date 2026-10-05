import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpenCheck, CalendarDays, Database, Info, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, Logo, NoiDung } from "@/components/layout/khung";
import { HangBam, Nhan, Nut, The } from "@/components/ui/nut-the";
import { HopTruot, TieuDeMuc } from "@/components/ui/hien-thi";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";

// Giữ khớp với "version" trong package.json.
const PHIEN_BAN = "0.1.0";

type HoiLai = null | "mau" | "xoa";

export default function CaiDat() {
  const { s, dungHoSoMau, lamLai } = useApp();
  const nav = useNavigate();
  const [hoi, setHoi] = useState<HoiLai>(null);
  const dong = () => setHoi(null);
  const coDuLieu = !!s.hoSo.hoTen.trim() || s.hoSo.hoanTat || s.mucTieu !== null || s.nguyenVong.length > 0;
  const soTiet = s.coDinh.length;
  const c = s.cauHinh;

  const dungMau = () => { dungHoSoMau(); setHoi(null); nav(DUONG_DAN.homNay()); };
  const xoaHet = () => { lamLai(); setHoi(null); nav(DUONG_DAN.chao()); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Cài đặt" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-5">
        <section>
          <TieuDeMuc>Học tập</TieuDeMuc>
          <div className="space-y-2">
            <HangBam bieuTuong={CalendarDays} tone="xanh" tieuDe="Lịch học của em" onClick={() => nav(DUONG_DAN.caiDatLichHoc())}
              phu={soTiet ? `${soTiet} buổi cố định mỗi tuần` : "Chưa nhập lịch ở trường và lớp học thêm"} />
            <HangBam bieuTuong={BookOpenCheck} tone="luc" tieuDe="Cài đặt tự học" onClick={() => nav(DUONG_DAN.caiDatTuHoc())}
              phu={`${c.gioBatDau}–${c.gioKetThuc}, tối đa ${c.gioHocToiDaMoiNgay} giờ mỗi ngày`} />
            <HangBam bieuTuong={Bell} tone="cam" tieuDe="Nhắc nhở" onClick={() => nav(DUONG_DAN.nhacNho())}
              phu={s.nhacNho.bat ? `Nhắc trước ${s.nhacNho.truocPhut} phút mỗi buổi học` : "Nhắc trước giờ học để em không quên"}
              nhan={<Nhan tone={s.nhacNho.bat ? "luc" : "xanh"}>{s.nhacNho.bat ? "Đang bật" : "Đang tắt"}</Nhan>} />
          </div>
        </section>

        <section>
          <TieuDeMuc>Dữ liệu của em</TieuDeMuc>
          <The className="space-y-3">
            <p className="flex gap-2.5 text-[14px] text-chu leading-snug">
              <ShieldCheck size={22} className="text-luc shrink-0" />
              <span>Mọi thông tin em nhập chỉ lưu trên điện thoại này, chưa gửi lên máy chủ nào. Nếu xóa dữ liệu trình duyệt, hồ sơ cũng mất theo.</span>
            </p>
            <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => (coDuLieu ? setHoi("mau") : dungMau())}>Dùng hồ sơ mẫu</Nut>
            <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={() => setHoi("xoa")}>Xóa hết và làm lại</Nut>
          </The>
        </section>

        <section>
          <TieuDeMuc>Về dữ liệu</TieuDeMuc>
          <div className="space-y-2">
            <DongThongBao tone="cam" icon={Database} tieuDe="Số liệu trường và ngành là dữ liệu mẫu"
              moTa="Điểm tham khảo, học phí và thông tin trường chưa được kiểm chứng. Em luôn xem lại trên trang tuyển sinh chính thức của trường trước khi quyết định." />
            <DongThongBao tone="xanh" icon={Info} tieuDe="Điểm phù hợp không phải khả năng đậu"
              moTa="Điểm phù hợp là điểm gợi ý trên 100, tính từ điểm, học phí, khu vực và cơ hội việc làm. Nó giúp em so sánh, không dự đoán kết quả xét tuyển." />
          </div>
        </section>

        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <Logo nho />
          <p className="text-[13px] text-chu-phu">Phiên bản {PHIEN_BAN} · bản thử nghiệm</p>
        </div>
      </NoiDung>

      <HopTruot mo={hoi === "mau"} dong={dong} tieuDe="Dùng hồ sơ mẫu?">
        <p className="text-[14px] text-chu mb-4">Hồ sơ mẫu sẽ thay toàn bộ thông tin em đang có trên máy này (điểm, mục tiêu, nguyện vọng, lịch học). Thông tin hiện tại không lấy lại được.</p>
        <div className="space-y-2">
          <Nut onClick={dungMau}>Dùng hồ sơ mẫu</Nut>
          <Nut kieu="vien" onClick={dong}>Giữ hồ sơ của em</Nut>
        </div>
      </HopTruot>

      <HopTruot mo={hoi === "xoa"} dong={dong} tieuDe="Xóa hết và làm lại?">
        <p className="text-[14px] text-chu mb-4">Toàn bộ hồ sơ, điểm, mục tiêu, nguyện vọng và kế hoạch học trên máy này sẽ bị xóa. Việc này không hoàn tác được.</p>
        <div className="space-y-2">
          <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={xoaHet}>Xóa hết dữ liệu</Nut>
          <Nut kieu="vien" onClick={dong}>Không, giữ lại</Nut>
        </div>
      </HopTruot>
    </>
  );
}
