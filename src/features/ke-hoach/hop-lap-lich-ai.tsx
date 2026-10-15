import { useState, useMemo } from "react";
import { Sparkles, CheckCircle2, Clock, CalendarCheck, RotateCcw, Flame } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { Nut, The } from "@/components/ui/nut-the";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { useApp } from "@/state/store";
import { MON_HIEN_THI } from "./thanh-phan";
import { sinhLichHocAI, chuyenDoiThanhViecHeThong, type KeHoachAIBuoi } from "./ai-lap-lich";

interface Props {
  mo: boolean;
  dong: () => void;
  tuan: string;
  onThanhCong?: (thongBao: string) => void;
}

export function HopLapLichAI({ mo, dong, tuan, onThanhCong }: Props) {
  const { s, xepLai } = useApp();
  const khoiDau = useMemo(() => sinhLichHocAI(s, tuan), [s, tuan]);

  const [prompt, setPrompt] = useState(khoiDau.promptGoiY);
  const [dangTao, setDangTao] = useState(false);
  const [buoiHocs, setBuoiHocs] = useState<KeHoachAIBuoi[]>(khoiDau.danhSachBuoi);
  const [daApDung, setDaApDung] = useState(false);

  const xuLyTaoLai = () => {
    setDangTao(true);
    setDaApDung(false);
    setTimeout(() => {
      const moi = sinhLichHocAI(s, tuan);
      setBuoiHocs(moi.danhSachBuoi);
      setDangTao(false);
    }, 600);
  };

  const xuLyApDung = () => {
    const viecAI = chuyenDoiThanhViecHeThong(buoiHocs, tuan);
    // Giữ lại các việc đã hoàn thành trong tuần này để không làm mất tiến độ học sinh
    const viecDaXong = s.viec.filter((v) => v.tuan === tuan && s.trangThaiViec[v.id] === "xong");
    const danhSachMoi = [...viecDaXong, ...viecAI];

    xepLai(tuan, undefined, danhSachMoi);
    setDaApDung(true);
    if (onThanhCong) {
      onThanhCong(`Đã áp dụng ${buoiHocs.length} buổi học cá thể hóa từ AI vào kế hoạch tuần!`);
    }
    setTimeout(() => {
      dong();
    }, 500);
  };

  return (
    <HopTruot mo={mo} dong={dong} tieuDe="Lập lịch học chi tiết cùng AI">
      <div className="space-y-3.5 pb-2">
        {/* Hộp phân tích cá nhân hóa */}
        <div className="rounded-xl bg-gradient-to-r from-xanh-nhat to-trang border border-xanh/30 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-xanh">
            <Sparkles size={15} />
            <span>Đề xuất cá thể hóa theo năng lực</span>
          </div>
          <p className="text-[13px] text-chu leading-relaxed">{khoiDau.phanTichCaNhan}</p>
        </div>

        {/* Khung Prompt điều chỉnh */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="prompt-ai" className="text-[12.5px] font-bold text-chu-phu">
              Câu lệnh (Prompt) gửi tới AI:
            </label>
            <button
              type="button"
              onClick={xuLyTaoLai}
              disabled={dangTao}
              className="text-[12px] font-semibold text-xanh inline-flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={12} className={dangTao ? "animate-spin" : ""} />
              Tạo lại phương án khác
            </button>
          </div>
          <textarea
            id="prompt-ai"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full text-[13px] text-chu p-2.5 rounded-xl border border-vien bg-nen/40 focus:bg-white focus:border-xanh focus:outline-none transition-colors leading-relaxed"
          />
        </div>

        {/* Tiêu đề danh sách buổi học */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[13.5px] font-extrabold text-muc">
            Lịch học tuần đề xuất ({buoiHocs.length} buổi):
          </span>
          <span className="text-[11.5px] text-chu-phu font-medium">Theo phương pháp 60-35-5</span>
        </div>

        {/* Danh sách các buổi học đề xuất */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
          {buoiHocs.map((b, idx) => {
            const monInfo = MON_HIEN_THI[b.mon];
            return (
              <The key={idx} className="!p-3 border border-vien hover:border-xanh/30 transition-all space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BieuTuongTron icon={monInfo.icon} tone={monInfo.tone} kichThuoc={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-bold text-muc bg-nen px-1.5 py-0.5 rounded-md">
                          {b.thu}
                        </span>
                        {b.mucUuTien === "cao" && (
                          <span className="text-[11px] font-bold text-do bg-do-nhat px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                            <Flame size={11} /> Môn kéo điểm
                          </span>
                        )}
                      </div>
                      <b className="block text-[13.5px] text-muc leading-tight mt-1 truncate">
                        {b.tieuDe}
                      </b>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-chu-phu shrink-0 inline-flex items-center gap-1">
                    <Clock size={13} className="text-xanh" /> {b.phut}'
                  </span>
                </div>

                <p className="text-[12px] text-chu-phu leading-relaxed bg-nen/50 p-2 rounded-lg">
                  💡 {b.chiTiet}
                </p>
              </The>
            );
          })}
        </div>

        {/* Nút hành động áp dụng */}
        <div className="pt-2 space-y-2">
          <Nut
            bieuTuong={daApDung ? CheckCircle2 : CalendarCheck}
            onClick={xuLyApDung}
            disabled={dangTao}
            className="w-full min-h-12 text-[14px] font-bold shadow-sm"
          >
            {daApDung ? "Đã áp dụng vào lịch học!" : "Áp dụng vào Kế hoạch tuần của tôi"}
          </Nut>
          <p className="text-center text-[12px] text-chu-phu">
            Sau khi áp dụng, bạn có thể bấm vào từng việc trong Kế hoạch tuần để đổi giờ, dời lịch hoặc chỉnh sửa bất cứ lúc nào.
          </p>
        </div>
      </div>
    </HopTruot>
  );
}
