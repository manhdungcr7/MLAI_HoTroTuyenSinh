import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpenCheck, CalendarDays, Download, GraduationCap, HeartHandshake, Upload, RotateCcw, Sparkles, UserPen } from "lucide-react";
import { DauTrangCoQuayLai, Logo, NoiDung } from "@/components/layout/khung";
import { HangBam, Nhan, Nut, The } from "@/components/ui/nut-the";
import { HopTruot, TieuDeMuc } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { coDuLieuNguoiDung } from "@/state/chon";
import { docLichSu, ghiLichSu } from "@/features/tu-van/hoi-thoai";
import { LUOT_AI_MOI_NGAY } from "@/features/tu-van/che-do-ai";
import { useCheDoAI } from "@/features/tu-van/dung-che-do-ai";
import { docBanSaoLuu, taoBanSaoLuu } from "@/state/sao-luu";
import { KhoiKetNoi } from "@/features/ket-noi/khoi-ket-noi";

// Giữ khớp với "version" trong package.json.
const PHIEN_BAN = "0.1.0";

type HoiLai = null | "mau" | "xoa";

export default function CaiDat() {
  const { s, dungHoSoMau, lamLai, khoiPhuc } = useApp();
  const oTep = useRef<HTMLInputElement>(null);
  const [tin, setTin] = useState<{ ok: boolean; chu: string } | null>(null);
  const nav = useNavigate();
  const ai = useCheDoAI();
  const [kemChat, setKemChat] = useState(false); // mặc định tắt: lịch sử chat chỉ vào tệp khi bạn tự bật
  const [hoi, setHoi] = useState<HoiLai>(null);
  const [choKhoiPhuc, setChoKhoiPhuc] = useState<Extract<ReturnType<typeof docBanSaoLuu>, { ok: true }> | null>(null);
  const dong = () => setHoi(null);
  const coDuLieu = coDuLieuNguoiDung(s);
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
          <TieuDeMuc>Trợ lý AI</TieuDeMuc>
          <The className="space-y-1.5">
            <label className="flex items-start gap-3 min-h-11">
              <input type="checkbox" checked={ai.cheDo === "ai"} onChange={(e) => ai.doiCheDo(e.target.checked ? "ai" : "tietKiem")} className="mt-0.5 size-5 shrink-0 accent-[var(--color-xanh)]" />
              <span className="text-[14px] text-chu">Dùng AI để diễn giải câu hỏi mở <span className="text-chu-phu">(tối đa {LUOT_AI_MOI_NGAY} lượt mỗi ngày, đặt lại lúc 0 giờ giờ Việt Nam)</span></span>
            </label>
            <p role="status" className="text-[13px] text-chu-phu">
              {ai.cheDo === "ai"
                ? `Hôm nay còn ${(ai.luot ?? { con: LUOT_AI_MOI_NGAY, toiDa: LUOT_AI_MOI_NGAY }).con}/${(ai.luot ?? { toiDa: LUOT_AI_MOI_NGAY }).toiDa} lượt AI. Tra cứu số liệu và chào hỏi không tính lượt.`
                : "Đang ở chế độ Tiết kiệm: chỉ trả lời từ số liệu có sẵn, không gửi câu hỏi tới AI."}
            </p>
          </The>
        </section>

        <KhoiKetNoi />

        <section>
          <TieuDeMuc>Dữ liệu của em</TieuDeMuc>
          <The className="space-y-3">
            <p className="text-[13px] text-chu-phu">Mọi thứ nằm trên máy này, không gửi lên máy chủ. Em tải bản sao lưu để giữ hoặc chuyển sang máy khác.</p>
            <label className="flex items-start gap-3 min-h-11">
              <input type="checkbox" checked={kemChat} onChange={(e) => setKemChat(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-xanh)]" />
              <span className="text-[14px] text-chu">Kèm lịch sử trò chuyện trong tệp sao lưu <span className="text-chu-phu">(câu bạn đã hỏi AI cũng nằm trong tệp)</span></span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Nut kieu="vien" bieuTuong={Download} onClick={xuat}>Tải sao lưu</Nut>
              <Nut kieu="vien" bieuTuong={Upload} onClick={() => oTep.current?.click()}>Khôi phục</Nut>
            </div>
            <input ref={oTep} type="file" accept="application/json,.json" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => void nhap(e.target.files?.[0])} />
            <p role="status" className={tin ? (tin.ok ? "text-[13px] text-luc-chu" : "text-[13px] text-do-chu") : "sr-only"}>{tin?.chu}</p>
            <Nut kieu="vien" bieuTuong={Sparkles} onClick={() => (coDuLieu ? setHoi("mau") : dungMau())}>Hồ sơ mẫu</Nut>
          </The>
        </section>

        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <Logo nho />
          <p className="text-[13px] text-chu-phu">Phiên bản {PHIEN_BAN} · bản thử nghiệm</p>
          <button type="button" onClick={() => nav(DUONG_DAN.dongGop())} className="inline-flex items-center gap-1.5 min-h-11 px-3 text-[13px] font-semibold text-xanh cursor-pointer">
            <HeartHandshake size={16} className="shrink-0" />Cùng cập nhật dữ liệu trường
          </button>
        </div>

        <section aria-labelledby="vung-nguy-hiem" className="rounded-xl border border-do/40 p-3.5 space-y-2.5">
          <h2 id="vung-nguy-hiem" className="text-[15px] font-bold text-do-chu">Vùng nguy hiểm</h2>
          <p className="text-[13px] text-chu-phu">Xóa hồ sơ, điểm, nguyện vọng, mục tiêu, kế hoạch, lịch sử trò chuyện và liên kết lịch trên máy này. Không hoàn tác được.</p>
          <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={() => setHoi("xoa")}>Xóa hết và làm lại</Nut>
        </section>
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
        <p className="text-[14px] text-chu mb-2">Sẽ mất toàn bộ trên máy này:</p>
        <ul className="list-disc pl-5 text-[14px] text-chu mb-3 space-y-0.5">
          <li>Hồ sơ và điểm</li>
          <li>Nguyện vọng và mục tiêu</li>
          <li>Kế hoạch học và lịch sử hoàn thành</li>
          <li>Lịch sử trò chuyện với AI</li>
          <li>Liên kết lịch đã đăng ký (sẽ bị thu hồi)</li>
        </ul>
        <p className="text-[13px] text-chu-phu mb-4">Không hoàn tác được. Em nên tải bản sao lưu trước.</p>
        <div className="space-y-2">
          <Nut kieu="vien" bieuTuong={Download} onClick={xuat}>Tải bản sao lưu trước</Nut>
          <Nut kieu="nguyHiem" bieuTuong={RotateCcw} onClick={xoaHet}>Xóa hết và làm lại</Nut>
          <Nut kieu="vien" onClick={dong}>Không, giữ lại</Nut>
        </div>
      </HopTruot>
    </>
  );
}
