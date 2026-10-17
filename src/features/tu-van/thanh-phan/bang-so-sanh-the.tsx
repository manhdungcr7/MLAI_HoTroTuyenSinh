import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Scale } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { rutGonTenTruong } from "@/engine/trinh-bay-hoc-thuat";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import type { LuaChon } from "@/state/types";
import { useDuBaoML } from "@/features/kham-pha/dung-du-bao-ml";
import { dungBangSoSanh } from "../bang-so-sanh";

const NUT_PHU = "min-h-11 shrink-0 rounded-lg px-3 text-[13px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";

/**
 * Bảng so sánh 2 đến 3 chương trình ngay trong khung chat. Số liệu dựng từ danh mục và điểm hiện tại của bạn lúc hiển thị,
 * nên luôn khớp màn Khám phá; tin nhắn chỉ lưu id. Ô nền xanh lá là bên có lợi thế khách quan (học phí thấp hơn).
 */
export function BangSoSanhThe({ ids, onDi }: { ids: string[]; onDi?: () => void }) {
  const { s } = useApp();
  const nav = useNavigate();
  const sanML = useDuBaoML(); // nạp dự báo của mô hình học máy rồi vẽ lại bảng
  const bang = useMemo(() => {
    const ls = ids.map((id) => tim(id)).filter((l): l is LuaChon => !!l);
    return ls.length >= 2 ? dungBangSoSanh(ls, diemDayDu(s)) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, s, sanML]);
  if (!bang) return null;
  const luoi = bang.cot.length >= 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <section className="mt-2.5 rounded-the border border-vien bg-trang overflow-hidden" aria-label="Bảng so sánh">
      <div className={gop("grid gap-px bg-vien", luoi)}>
        {bang.cot.map((c) => (
          <div key={c.id} className="bg-xanh-nhat px-2 py-2 text-center min-w-0">
            <b className="block text-[13px] text-muc leading-tight break-words">{rutGonTenTruong(c.truong)}</b>
            <span className="block text-[12px] text-chu-phu leading-snug break-words">{c.nganh}</span>
          </div>
        ))}
      </div>
      {bang.hang.map((h) => (
        <div key={h.khoa} className="border-t border-vien">
          <p className="px-2 pt-1.5 text-[12px] font-bold text-chu-phu">{h.nhan}</p>
          <div className={gop("grid gap-1 px-1.5 pb-1.5", luoi)}>
            {h.o.map((o, i) => (
              <div key={bang.cot[i].id} className={gop("rounded-lg px-1.5 py-1 text-[13px] leading-snug text-chu break-words min-w-0", h.tot === i ? "bg-luc-nhat ring-1 ring-luc/30" : "bg-nen")}>
                {o}
                {h.tot === i && <span className="sr-only"> (lợi thế hơn)</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {bang.luuY.length > 0 && (
        <ul className="border-t border-vien px-2 py-2 space-y-1">
          {bang.luuY.map((x) => (
            <li key={x} className="flex items-start gap-1.5 text-[12px] leading-snug text-chu-phu"><Info size={13} className="mt-0.5 shrink-0" aria-hidden />{x}</li>
          ))}
        </ul>
      )}
      <div className="border-t border-vien px-1.5 py-1 flex justify-end">
        <button type="button" onClick={() => { onDi?.(); nav(DUONG_DAN.soSanh(ids[0], ids[1])); }} className={gop(NUT_PHU, "text-xanh active:bg-xanh-nhat")}>
          <Scale size={14} aria-hidden />Xem so sánh chi tiết
        </button>
      </div>
    </section>
  );
}
