import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { goDoanChat, docCacDoan, luuDoanChat, TOI_DA_DOAN, type DoanChat } from "../kho-doan-chat";
import type { TinNhan } from "../hoi-thoai";

const ngay = (luc: number) => new Date(luc).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Danh sách tối đa TOI_DA_DOAN đoạn chat đã lưu; chọn một đoạn thì cất đoạn đang mở rồi mở lại đoạn đó. */
export function LichSuDoanChat({ tin, dang, onMo }: { tin: TinNhan[]; dang: boolean; onMo: (tin: TinNhan[]) => void }) {
  const [mo, setMo] = useState(false);
  const [ds, setDs] = useState<DoanChat[]>([]);
  const bat = () => { setDs(docCacDoan(localStorage)); setMo((m) => !m); };
  const chon = (id: string) => {
    const d = goDoanChat(localStorage, id);
    if (!d) { setDs(docCacDoan(localStorage)); return; }
    luuDoanChat(localStorage, tin);
    onMo(d.tin);
    setMo(false);
  };
  const xoa = (id: string) => { goDoanChat(localStorage, id); setDs(docCacDoan(localStorage)); };
  return <div className="w-full">
    <button type="button" disabled={dang} onClick={bat} aria-expanded={mo} className="inline-flex items-center gap-1.5 min-h-9 px-1 text-[12.5px] font-bold text-xanh disabled:opacity-50 cursor-pointer"><History size={14} />Lịch sử chat</button>
    {mo && <div className="mt-1 rounded-xl border border-vien bg-white p-1.5 space-y-1">
      {ds.length === 0 ? <p className="px-2 py-2 text-[12.5px] text-chu-phu">Chưa có đoạn chat nào được lưu. Bấm "mới" để cất đoạn đang chat (giữ tối đa {TOI_DA_DOAN} đoạn).</p>
        : ds.map((d) => <div key={d.id} className="flex items-center gap-1">
          <button type="button" onClick={() => chon(d.id)} className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left hover:bg-xanh-nhat/40 cursor-pointer"><span className="block truncate text-[13px] font-medium text-chu">{d.tieuDe}</span><span className="block text-[11px] text-chu-phu">{ngay(d.luc)} · {d.tin.length} tin</span></button>
          <button type="button" onClick={() => xoa(d.id)} aria-label={`Xóa đoạn chat ${d.tieuDe}`} className="size-8 grid place-items-center rounded-lg text-chu-phu hover:bg-slate-100 shrink-0 cursor-pointer"><Trash2 size={14} /></button>
        </div>)}
    </div>}
  </div>;
}
