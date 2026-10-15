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
    }, 400);
  };

  const xuLyApDung = () => {
    const viecAI = chuyenDoiThanhViecHeThong(buoiHocs, tuan);
    const viecDaXong = s.viec.filter((v) => v.tuan === tuan && s.trangThaiViec[v.id] === "xong");
    const danhSachMoi = [...viecDaXong, ...viecAI];

    xepLai(tuan, undefined, danhSachMoi);
    setDaApDung(true);
    if (onThanhCong) {
      onThanhCong(`Đã áp dụng ${buoiHocs.length} buổi học cá thể hóa từ AI vào kế hoạch tuần!`);
    }
    setTimeout(() => {
      dong();
    }, 400);
  };

  return (
    <HopTruot mo={mo} dong={dong} tieuDe="Lập lịch học chi tiết cùng AI">
      <div className="space-y-3 pb-1">
        {/* Hộp nhận định trọng tâm cá nhân hóa */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-xanh-nhat to-trang border border-xanh/30 px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-xanh shrink-0" />
            <span
              className="text-[13px] text-chu font-medium leading-snug"
              dangerouslySetInnerHTML={{
                __html: khoiDau.phanTichCaNhan
                  .replace(/\*\*(.*?)\*\*/g, "<strong class='text-muc font-bold'>$1</strong>"),
              }}
            />
          </div>
          <button
            type="button"
            onClick={xuLyTaoLai}
            disabled={dangTao}
            title="Đổi phương án khác"
            className="shrink-0 ml-2 size-8 grid place-items-center rounded-lg hover:bg-nen/80 text-chu-phu hover:text-xanh cursor-pointer transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} className={dangTao ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Danh sách các buổi học đề xuất */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
          {buoiHocs.map((b, idx) => {
            const monInfo = MON_HIEN_THI[b.mon];
            return (
              <The key={idx} className="!p-3 border border-vien hover:border-xanh/30 transition-all space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BieuTuongTron icon={monInfo.icon} tone={monInfo.tone} kichThuoc={34} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
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

                <div className="text-[12px] text-chu-phu leading-relaxed bg-nen/40 px-2.5 py-1.5 rounded-lg">
                  {b.chiTiet}
                </div>
              </The>
            );
          })}
        </div>

        {/* Nút hành động áp dụng */}
        <div className="pt-1.5">
          <Nut
            bieuTuong={daApDung ? CheckCircle2 : CalendarCheck}
            onClick={xuLyApDung}
            disabled={dangTao}
            className="w-full min-h-12 text-[14px] font-bold shadow-sm"
          >
            {daApDung ? "Đã áp dụng vào lịch học!" : "Áp dụng vào Kế hoạch tuần của tôi"}
          </Nut>
        </div>
      </div>
    </HopTruot>
  );
}
