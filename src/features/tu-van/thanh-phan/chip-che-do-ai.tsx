import { Sparkles } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { nhanChip } from "../che-do-ai";
import { useCheDoAI } from "../dung-che-do-ai";

/** Chip bật/tắt chế độ AI trong khung chat: "AI: còn 48/50" khi bật, "AI: tắt" khi Tiết kiệm. `tren` = đặt trên nền xanh của khung nổi. */
export function ChipCheDoAI({ tren = false }: { tren?: boolean }) {
  const { cheDo, luot, doiCheDo } = useCheDoAI();
  const bat = cheDo === "ai";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={bat}
      aria-label={bat ? "Đang dùng AI, bấm để chuyển sang chế độ Tiết kiệm" : "Đang ở chế độ Tiết kiệm, bấm để dùng AI"}
      onClick={() => doiCheDo(bat ? "tietKiem" : "ai")}
      className={gop(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[12px] font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh",
        tren ? "h-8" : "min-h-11",
        tren
          ? (bat ? "border-white/60 bg-white text-xanh" : "border-white/40 bg-white/15 text-white")
          : (bat ? "border-xanh/40 bg-trang text-xanh" : "border-vien bg-trang text-chu-phu"),
      )}
    >
      <Sparkles size={13} aria-hidden />{nhanChip(cheDo, luot)}
    </button>
  );
}
