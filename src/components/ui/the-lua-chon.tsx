import { Building2, MapPin, Wallet } from "lucide-react";
import type { LuaChon, MucPhuHop, ToneTen } from "@/state/types";
import { HuyHieuTruong } from "./hinh-nen";
import { DongDiemThe } from "./du-bao/dong-diem-the";
import { Nhan } from "./nut-the";
import { coHocPhi, hocPhiChu } from "@/data/lua-chon-phu";

export const TONE_PHU_HOP: Record<MucPhuHop, ToneTen> = { "Phù hợp": "luc", "Có thể thử sức": "tim", "Cần cân nhắc": "cam" };

/** Thẻ tóm tắt một lựa chọn (trường + ngành). Dùng chung ở Khám phá, Thử tình huống, Nguyện vọng. */
export function TheLuaChon({ l, onClick, phai, diemEm = null }: { l: LuaChon; onClick?: () => void; phai?: React.ReactNode; diemEm?: number | null }) {
  const Goc = onClick ? "button" : "div";
  return (
    <Goc {...(onClick ? { type: "button" as const, onClick } : {})} className="nay-nhe w-full text-left rounded-the bg-trang border border-vien shadow-the p-3.5 active:bg-xanh-nhat block">
      <span className="flex items-start gap-3">
        <HuyHieuTruong ten={l.truong} tone={l.tone} />
        <span className="flex-1 min-w-0">
          <span className="flex items-start justify-between gap-2">
            <b className="min-w-0 line-clamp-2 break-words text-[16px] text-muc leading-snug [text-wrap:balance]">{l.nganh}</b>
            {phai ?? (l.mucPhuHop ? <Nhan tone={TONE_PHU_HOP[l.mucPhuHop]}>{l.mucPhuHop}</Nhan> : null)}
          </span>
          <span className="block line-clamp-2 break-words text-[13px] text-chu-phu leading-snug [text-wrap:pretty]">{l.truong} · {l.moTa}</span>
        </span>
      </span>
      <span className="mt-2.5 block border-t border-vien pt-2"><DongDiemThe lc={l} diemEm={diemEm} /></span>
      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-chu-phu">
        <span className="inline-flex items-center gap-1"><Building2 size={14} />{l.bac}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={14} />{l.khuVuc}</span>
        <span className="inline-flex items-center gap-1"><Wallet size={14} />{coHocPhi(l) ? `${hocPhiChu(l)} tr/năm` : "Chưa có học phí"}</span>
      </span>
    </Goc>
  );
}
