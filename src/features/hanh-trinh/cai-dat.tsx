import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpenCheck, CalendarDays, Download, GraduationCap, HeartHandshake, Upload, RotateCcw, Sparkles, UserPen } from "lucide-react";
import { DauTrangCoQuayLai, Logo, NoiDung } from "@/components/layout/khung";
import { HangBam, Nhan, Nut, The } from "@/components/ui/nut-the";
import { HopTruot, TieuDeMuc } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { docLichSu, ghiLichSu } from "@/features/tu-van/hoi-thoai";
import { docBanSaoLuu, taoBanSaoLuu } from "@/state/sao-luu";

// Giữ khớp với "version" trong package.json.
const PHIEN_BAN = "0.1.0";

type HoiLai = null | "mau" | "xoa";

export default function CaiDat() {
  const { s, dungHoSoMau, lamLai, khoiPhuc } = useApp();
  const oTep = useRef<HTMLInputElement>(null);
  const [tin, setTin] = useState<{ ok: boolean; chu: string } | null>(null);
  const nav = useNavigate();
  const [kemChat, setKemChat] = useState(false); // mặc định tắt: lịch sử chat chỉ vào tệp khi bạn tự bật
  const [hoi, setHoi] = useState<HoiLai>(null);
  const [choKhoiPhuc, setChoKhoiPhuc] = useState<Extract<ReturnType<typeof docBanSaoLuu>, { ok: true }> | null>(null);
  const dong = () => setHoi(null);
  const coDuLieu = !!s.hoSo.hoTen.trim() || s.hoSo.hoanTat || s.mucTieu !== null || s.nguyenVong.length > 0 || s.yeuThich.length > 0;
  const soTiet = s.coDinh.length;
  const c = s.cauHinh;

  const dungMau = () => { dungHoSoMau(); setHoi(null); nav(DUONG_DAN.homNay()); };
  const xuat = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const dateStr = `${year}-${month}-${day}`;
    const url = URL.createObjectURL(new Blob([taoBanSaoLuu(s, now, kemChat ? docLichSu(localStorage) : [])], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `nguyen-vong-ai-${dateStr}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setTin({ ok: true, chu: "Đã tải tệp sao lưu về máy. Bạn giữ tệp này ở nơi an toàn." });
  };
  const nhap = async (f: File | undefined) => {
    if (!f) return;
    const kq = f.size > 5_000_000 ? { ok: false as const, lyDo: "Tệp quá lớn so với một bản sao lưu." } : docBanSaoLuu(await f.text());
    if (kq.ok) setChoKhoiPhuc(kq);
    else setTin({ ok: false, chu: kq.lyDo });
    if (oTep.current) oTep.current.value = "";
  };
  const xoaHet = () => { lamLai(); setHoi(null); nav(DUONG_DAN.chao()); };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Cài đặt" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-5">
        <section>
          <TieuDeMuc>Hồ sơ</TieuDeMuc>
          <div className="grid grid-cols-2 gap-2">
            <HangBam bieuTuong={UserPen} tone="xanh" tieuDe="Sửa hồ sơ" onClick={() => nav(DUONG_DAN.batDau(1))} />
            <HangBam bieuTuong={GraduationCap} tone="tim" tieuDe="Sửa điểm" onClick={() => nav(DUONG_DAN.batDau(2))} />
          </div>
        </section>

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
          <TieuDeMuc>Dữ liệu trên máy này</TieuDeMuc>
          <The className="space-y-3">
            <label className="flex items-start gap-3 min-h-11">
              <input type="checkbox" checked={kemChat} onChange={(e) => setKemChat(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-xanh)]" />
              <span className="text-[14px] text-chu">Kèm lịch sử trò chuyện trong tệp sao lưu <span className="text-chu-phu">(câu bạn đã hỏi AI cũng nằm trong tệp)</span></span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" bieuTuong={Download} onClick={xuat}>Xuất JSON</Nut>
              <Nut kieu="vien" bieuTuong={Upload} onClick={() => oTep.current?.click()}>Nhập JSON</Nut>
            </div>
            <input ref={oTep} type="file" accept="application/json,.json" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => void nhap(e.target.files?.[0])} />
            <p role="status" className={tin ? (tin.ok ? "text-[13px] text-luc-chu" : "text-[13px] text-do-chu") : "sr-only"}>{tin?.chu}</p>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => (coDuLieu ? setHoi("mau") : dungMau())}>Hồ sơ mẫu</Nut>
              <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={() => setHoi("xoa")}>Xóa hết</Nut>
            </div>
          </The>
        </section>

        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <Logo nho />
          <p className="text-[13px] text-chu-phu">Phiên bản {PHIEN_BAN} · bản thử nghiệm</p>
          <button type="button" onClick={() => nav(DUONG_DAN.dongGop())} className="inline-flex items-center gap-1.5 min-h-11 px-3 text-[13px] font-semibold text-xanh cursor-pointer">
            <HeartHandshake size={16} className="shrink-0" />Cùng cập nhật dữ liệu trường
          </button>
        </div>
      </NoiDung>

      <HopTruot mo={hoi === "mau"} dong={dong} tieuDe="Dùng hồ sơ mẫu?">
        <p className="text-[14px] text-chu mb-4">Hồ sơ mẫu sẽ thay toàn bộ thông tin bạn đang có trên máy này (điểm, mục tiêu, nguyện vọng, lịch học). Thông tin hiện tại không lấy lại được.</p>
        <div className="space-y-2">
          <Nut onClick={dungMau}>Dùng hồ sơ mẫu</Nut>
          <Nut kieu="vien" onClick={dong}>Giữ hồ sơ của bạn</Nut>
        </div>
      </HopTruot>
      <HopTruot mo={choKhoiPhuc !== null} dong={() => setChoKhoiPhuc(null)} tieuDe="Khôi phục bản sao lưu?">
        <p className="text-[14px] text-chu mb-4">Dữ liệu trong tệp sẽ thay toàn bộ hồ sơ, nguyện vọng, kế hoạch và lịch sử trò chuyện hiện tại. Em nên xuất bản sao lưu trước khi tiếp tục.</p>
        <div className="space-y-2">
          <Nut onClick={() => { if (!choKhoiPhuc) return; khoiPhuc(choKhoiPhuc.s); const coChat = !!choKhoiPhuc.lichSu?.length && ghiLichSu(localStorage, choKhoiPhuc.lichSu); setTin({ ok: true, chu: coChat ? "Đã khôi phục dữ liệu và lịch sử trò chuyện từ tệp sao lưu." : "Đã khôi phục dữ liệu từ tệp sao lưu." }); setChoKhoiPhuc(null); }}>Khôi phục</Nut>
          <Nut kieu="vien" onClick={() => setChoKhoiPhuc(null)}>Giữ dữ liệu hiện tại</Nut>
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
