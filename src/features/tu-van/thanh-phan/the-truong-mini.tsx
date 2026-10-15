import { Link } from "react-router-dom";
import { GitCompareArrows, School } from "lucide-react";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { tenTruong, tinhCuaTruong } from "@/engine/truong";
import { gop } from "@/components/ui/nut-the";

const NUT = "min-h-11 min-w-0 rounded-[10px] px-2 text-[13px] font-bold inline-flex items-center justify-center gap-1.5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";

/**
 * Thẻ trường nhỏ trong khung chat: tên đầy đủ, nơi đặt trường, một ngành liên quan, hai nút. Thông tin còn lại nằm ở hồ sơ trường.
 * Loại hình (công lập, tư thục) chưa có trong dữ liệu nên ghi rõ là chưa có, không đoán.
 */
export function UniversityMiniCard({ ma, idNganh, muc, onSoSanh, onDi }: {
  ma: string;
  /** Chương trình liên quan đã khớp câu hỏi. */
  idNganh?: string;
  muc?: "chinh-xac" | "lien-quan";
  onSoSanh: () => void;
  /** Gọi khi bấm Xem trường (để khung chat nổi tự đóng). */
  onDi?: () => void;
}) {
  const ct = idNganh ? tim(idNganh) : undefined;
  const noi = tinhCuaTruong(ma).slice(0, 2).join(", ");
  return (
    <li className="rounded-xl border border-vien bg-trang p-2.5 space-y-2 min-w-0">
      <div className="flex items-start gap-2 min-w-0">
        <span className="size-8 rounded-lg bg-xanh-nhat text-xanh grid place-items-center shrink-0" aria-hidden><School size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-muc leading-snug break-words">{tenTruong(ma) ?? ma}</p>
          <p className="text-[12.5px] text-chu-phu leading-snug break-words">{noi || "Chưa rõ nơi đặt trường"} · Loại hình: chưa có dữ liệu</p>
          {ct && (
            <p className="mt-0.5 text-[12.5px] text-chu leading-snug break-words">
              Ngành: {ct.nganh}
              {muc === "lien-quan" && <span className="ml-1 rounded bg-cam-nhat px-1 text-[12px] font-semibold text-cam-chu">liên quan, không trùng tên</span>}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link to={DUONG_DAN.truong(ma)} onClick={onDi} className={gop(NUT, "bg-xanh text-white active:brightness-95")}>Xem trường</Link>
        <button type="button" onClick={onSoSanh} className={gop(NUT, "border border-xanh/40 bg-trang text-xanh active:bg-xanh-nhat")}><GitCompareArrows size={15} aria-hidden />So sánh</button>
      </div>
    </li>
  );
}
