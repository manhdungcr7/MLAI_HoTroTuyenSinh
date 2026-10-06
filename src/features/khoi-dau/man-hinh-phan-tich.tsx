import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Database, Sparkles, Target } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { LUA_CHON } from "@/data/lua-chon-that";

const SO_TRUONG = new Set(LUA_CHON.map((l) => l.maTruong ?? l.truong)).size;

const CAC_BUOC_AI = [
  { icon: Brain, tieu: "Đối chiếu năng lực & tổ hợp điểm", phu: "Phân tích thế mạnh các môn học..." },
  { icon: Database, tieu: `Đối chiếu ${LUA_CHON.length.toLocaleString("vi-VN")} chương trình của ${SO_TRUONG} trường`, phu: "So sánh điểm chuẩn & mức học phí..." },
  { icon: Target, tieu: "Xếp nhóm nguyện vọng vừa sức", phu: "Phân loại Thử sức · Vừa sức · An toàn..." },
];

export function ManHinhPhanTichAI({ onHoanTat }: { onHoanTat: () => void }) {
  const [buoc, setBuoc] = useState(0);
  const [phanTram, setPhanTram] = useState(20);

  useEffect(() => {
    const t1 = setTimeout(() => { setBuoc(1); setPhanTram(60); }, 380);
    const t2 = setTimeout(() => { setBuoc(2); setPhanTram(95); }, 760);
    const t3 = setTimeout(() => { setPhanTram(100); }, 1050);
    const t4 = setTimeout(() => { onHoanTat(); }, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onHoanTat]);

  return (
    <div className="fixed inset-0 z-50 max-w-[430px] mx-auto bg-nen flex flex-col items-center justify-center px-6 animate-hien-len">
      {/* Vòng sáng AI Core */}
      <div className="relative mb-6">
        <div className="size-24 rounded-3xl gd-xanh text-white grid place-items-center shadow-nut animate-bounce [animation-duration:2s]">
          <Sparkles size={46} strokeWidth={2.2} className="animate-spin [animation-duration:6s]" />
        </div>
        <div className="absolute -inset-2 rounded-[2rem] border-2 border-xanh/30 animate-ping [animation-duration:2s] pointer-events-none" />
      </div>

      <h2 className="text-[20px] font-extrabold text-muc text-center mb-1">
        Nguyện Vọng AI đang tính toán...
      </h2>
      <p className="text-[13.5px] text-chu-phu text-center max-w-[280px] mb-6">
        Hệ thống đang cá nhân hóa danh sách gợi ý phù hợp nhất với em
      </p>

      {/* Thanh tiến trình */}
      <div className="w-full bg-vien rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="h-full gd-xanh rounded-full transition-all duration-300 ease-out"
          style={{ width: `${phanTram}%` }}
        />
      </div>

      {/* Các bước xử lý AI */}
      <div className="w-full space-y-2.5">
        {CAC_BUOC_AI.map((b, idx) => {
          const Icon = b.icon;
          const daXong = buoc > idx;
          const dangChay = buoc === idx;
          return (
            <div
              key={b.tieu}
              className={gop(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                dangChay
                  ? "bg-white border-xanh shadow-sm scale-[1.02]"
                  : daXong
                  ? "bg-luc-nhat/50 border-luc/30 text-chu"
                  : "bg-white/40 border-vien/60 opacity-40",
              )}
            >
              <span
                className={gop(
                  "size-8 rounded-lg grid place-items-center shrink-0",
                  daXong ? "bg-luc text-white" : dangChay ? "gd-xanh text-white" : "bg-vien text-chu-phu",
                )}
              >
                {daXong ? <CheckCircle2 size={18} /> : <Icon size={18} className={dangChay ? "animate-pulse" : ""} />}
              </span>
              <div className="min-w-0 flex-1">
                <b className={gop("block text-[13px] leading-tight", dangChay ? "text-xanh font-bold" : "text-muc font-semibold")}>
                  {b.tieu}
                </b>
                <span className="block text-[11.5px] text-chu-phu leading-tight mt-0.5 truncate">
                  {b.phu}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
