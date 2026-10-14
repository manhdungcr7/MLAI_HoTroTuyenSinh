import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpenCheck, CalendarDays, Database, Download, HeartHandshake, Info, Upload, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { DauTrangCoQuayLai, Logo, NoiDung } from "@/components/layout/khung";
import { HangBam, Nhan, Nut, The } from "@/components/ui/nut-the";
import { HopTruot, TieuDeMuc } from "@/components/ui/hien-thi";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { docBanSaoLuu, taoBanSaoLuu } from "@/state/sao-luu";

// Giữ khớp với "version" trong package.json.
const PHIEN_BAN = "0.1.0";

type HoiLai = null | "mau" | "xoa";

export default function CaiDat() {
  const { s, dungHoSoMau, lamLai, khoiPhuc } = useApp();
  const oTep = useRef<HTMLInputElement>(null);
  const [tin, setTin] = useState<{ ok: boolean; chu: string } | null>(null);
  const nav = useNavigate();
  const [hoi, setHoi] = useState<HoiLai>(null);
  const dong = () => setHoi(null);
  const coDuLieu = !!s.hoSo.hoTen.trim() || s.hoSo.hoanTat || s.mucTieu !== null || s.nguyenVong.length > 0;
  const soTiet = s.coDinh.length;
  const c = s.cauHinh;

  const dungMau = () => { dungHoSoMau(); setHoi(null); nav(DUONG_DAN.homNay()); };
  const xuat = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const dateStr = `${year}-${month}-${day}`;
    const url = URL.createObjectURL(new Blob([taoBanSaoLuu(s)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `nguyen-vong-ai-${dateStr}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setTin({ ok: true, chu: "Đã tải tệp sao lưu về máy. Em giữ tệp này ở nơi an toàn." });
  };
  const nhap = async (f: File | undefined) => {
    if (!f) return;
    const kq = f.size > 5_000_000 ? { ok: false as const, lyDo: "Tệp quá lớn so với một bản sao lưu." } : docBanSaoLuu(await f.text());
    if (kq.ok) { khoiPhuc(kq.s); setTin({ ok: true, chu: "Đã khôi phục dữ liệu từ tệp sao lưu." }); }
    else setTin({ ok: false, chu: kq.lyDo });
    if (oTep.current) oTep.current.value = "";
  };
  const xoaHet = () => { lamLai(); setHoi(null); nav(DUONG_DAN.chao()); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Cài đặt" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-5">
        <section>
          <TieuDeMuc>Học tập</TieuDeMuc>
          <div className="space-y-2">
            <HangBam bieuTuong={CalendarDays} tone="xanh" tieuDe="Lịch học của bạn" onClick={() => nav(DUONG_DAN.caiDatLichHoc())}
              phu={soTiet ? `${soTiet} buổi cố định mỗi tuần` : "Chưa nhập lịch ở trường và lớp học thêm"} />
            <HangBam bieuTuong={BookOpenCheck} tone="luc" tieuDe="Cài đặt tự học" onClick={() => nav(DUONG_DAN.caiDatTuHoc())}
              phu={`${c.gioBatDau}–${c.gioKetThuc}, tối đa ${c.gioHocToiDaMoiNgay} giờ mỗi ngày`} />
            <HangBam bieuTuong={Bell} tone="cam" tieuDe="Nhắc nhở" onClick={() => nav(DUONG_DAN.nhacNho())}
              phu={s.nhacNho.bat ? `Nhắc trước ${s.nhacNho.truocPhut} phút mỗi buổi học` : "Nhắc trước giờ học để bạn không quên"}
              nhan={<Nhan tone={s.nhacNho.bat ? "luc" : "xanh"}>{s.nhacNho.bat ? "Đang bật" : "Đang tắt"}</Nhan>} />
          </div>
        </section>

        <section>
          <TieuDeMuc>Dữ liệu của bạn</TieuDeMuc>
          <The className="space-y-3">
            <p className="flex gap-2.5 text-[14px] text-chu leading-snug">
              <ShieldCheck size={22} className="text-luc shrink-0" />
              <span>Mọi thông tin bạn nhập được lưu an toàn trên thiết bị này. Bạn có thể xuất bản sao lưu bất cứ lúc nào.</span>
            </p>
            <Nut kieu="vien" bieuTuong={Download} onClick={xuat}>Tải bản sao lưu</Nut>
            <Nut kieu="vien" bieuTuong={Upload} onClick={() => oTep.current?.click()}>Khôi phục sao lưu</Nut>
            <input ref={oTep} type="file" accept="application/json,.json" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => void nhap(e.target.files?.[0])} />
            <p role="status" className={tin ? (tin.ok ? "text-[13px] text-luc-chu" : "text-[13px] text-do-chu") : "sr-only"}>{tin?.chu}</p>
            <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => (coDuLieu ? setHoi("mau") : dungMau())}>Dùng hồ sơ mẫu</Nut>
            <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={() => setHoi("xoa")}>Xóa hết dữ liệu</Nut>
          </The>
        </section>

        <section>
          <TieuDeMuc>Về dữ liệu</TieuDeMuc>
          <div className="space-y-2">
            <HangBam bieuTuong={HeartHandshake} tone="luc" tieuDe="Cùng cập nhật dữ liệu trường" onClick={() => nav(DUONG_DAN.dongGop())} phu="Dành cho sinh viên, thầy cô, cán bộ tuyển sinh" />
            <DongThongBao tone="cam" icon={Database} tieuDe="Điểm chuẩn là số của các năm trước"
              moTa="Điểm chuẩn lấy từ đề án tuyển sinh của trường hoặc trang tổng hợp, mỗi ngành đều ghi nguồn. Học phí và việc làm nhiều ngành chưa có. Bạn luôn đối chiếu với đề án chính thức của trường trước khi quyết định." />
            <DongThongBao tone="xanh" icon={Info} tieuDe="Điểm phù hợp không phải khả năng đậu"
              moTa="Điểm phù hợp là điểm gợi ý trên 100, tính từ điểm, học phí, khu vực và cơ hội việc làm, hỗ trợ bạn so sánh và cân nhắc." />
          </div>
        </section>

        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <Logo nho />
          <p className="text-[13px] text-chu-phu">Phiên bản {PHIEN_BAN} · bản thử nghiệm</p>
        </div>
      </NoiDung>

      <HopTruot mo={hoi === "mau"} dong={dong} tieuDe="Dùng hồ sơ mẫu?">
        <p className="text-[14px] text-chu mb-4">Hồ sơ mẫu sẽ thay toàn bộ thông tin bạn đang có trên máy này (điểm, mục tiêu, nguyện vọng, lịch học). Thông tin hiện tại không lấy lại được.</p>
        <div className="space-y-2">
          <Nut onClick={dungMau}>Dùng hồ sơ mẫu</Nut>
          <Nut kieu="vien" onClick={dong}>Giữ hồ sơ của bạn</Nut>
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
