// Nhập điểm các môn thêm: Lịch sử, Địa lý, GD kinh tế và pháp luật, Tin học, Công nghệ.
// Để so được các ngành xét tổ hợp xã hội (C00, D14...) và tổ hợp mới (X26, X70...). Không bắt buộc.
import { useState } from "react";
import { BookOpenCheck, ChevronDown } from "lucide-react";
import { gop } from "@/components/ui/nut-the";
import { CAC_MON_THEM, TEN_MON_THEM, type HoSo, type MonThem } from "@/state/types";
import { LoiNho } from "./thanh-phan";
import { LOI_DIEM, docDiem, vietDiem } from "./tinh-toan";

const NHOM_XA_HOI = ["Sư phạm", "Luật", "Xã hội", "Ngôn ngữ", "Báo chí", "Du lịch", "Kinh tế", "Tài chính", "Marketing", "Logistics"];

export default function DiemMonThem({ h, sua }: { h: HoSo; sua: (p: Partial<HoSo>) => void }) {
  const them = h.diemThem ?? {};
  const [chu, setChu] = useState<Record<MonThem, string>>(() => Object.fromEntries(CAC_MON_THEM.map((m) => [m, vietDiem(them[m] ?? null)])) as Record<MonThem, string>);
  const daCo = CAC_MON_THEM.some((m) => them[m] !== null && them[m] !== undefined);
  const [mo, setMo] = useState(daCo || h.nganhQuanTam.some((n) => NHOM_XA_HOI.includes(n)));
  const loi = CAC_MON_THEM.map((m) => ({ m, kq: docDiem(chu[m]) })).filter(({ kq }) => kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang");

  const go = (m: MonThem, c: string) => {
    setChu((x) => ({ ...x, [m]: c }));
    const kq = docDiem(c);
    if (kq.loai === "hopLe") sua({ diemThem: { ...them, [m]: kq.gia } });
    else sua({ diemThem: { ...them, [m]: null } });
  };

  return (
    <section className="rounded-the border border-vien bg-trang">
      <button type="button" onClick={() => setMo(!mo)} aria-expanded={mo} aria-controls="bd-mon-them" className="w-full min-h-14 flex items-center gap-3 px-4 text-left">
        <span className="size-9 rounded-xl grid place-items-center bg-tim-nhat text-tim shrink-0"><BookOpenCheck size={18} /></span>
        <span className="flex-1">
          <b className="block text-[15px] text-chu">Điểm các môn khác (Sử, Địa, Tin...)</b>
        </span>
        <ChevronDown size={20} className={gop("text-chu-phu transition-transform", mo && "rotate-180")} />
      </button>
      {mo && (
        <div id="bd-mon-them" className="px-4 pb-4 border-t border-vien pt-3">
          <div className="grid grid-cols-2 gap-2">
            {CAC_MON_THEM.map((m) => {
              const kq = docDiem(chu[m]);
              const sai = kq.loai === "khongPhaiSo" || kq.loai === "ngoaiKhoang";
              return (
                <div key={m} className={gop("rounded-the border bg-nen p-2 min-w-0", sai ? "border-do/60" : "border-vien")}>
                  <label htmlFor={`bd-them-${m}`} className="block text-[13px] font-bold text-chu mb-1 leading-snug">{TEN_MON_THEM[m]}</label>
                  <div className="flex items-center gap-1">
                    <input id={`bd-them-${m}`} inputMode="decimal" autoComplete="off" placeholder="–" value={chu[m]} maxLength={5} aria-invalid={sai}
                      onChange={(e) => go(m, e.target.value)}
                      className={gop("w-full min-w-0 min-h-11 rounded-xl border bg-trang px-1 text-center text-[16px] font-bold text-muc placeholder:text-chu-phu/60 focus:border-xanh", sai ? "border-do text-do-chu" : "border-vien")} />
                    <span className="text-[12px] text-chu-phu shrink-0">/10</span>
                  </div>
                </div>
              );
            })}
          </div>
          {loi.length > 0 && (
            <div role="alert" className="mt-2 space-y-0.5">
              {loi.map(({ m, kq }) => <LoiNho key={m}>{TEN_MON_THEM[m]}: {LOI_DIEM[kq.loai as "khongPhaiSo" | "ngoaiKhoang"]}</LoiNho>)}
            </div>
          )}
          <p className="mt-2 text-[12px] text-chu-phu">Công nghệ: nhập môn em học (công nghiệp hoặc nông nghiệp). Để trống môn em không thi.</p>
        </div>
      )}
    </section>
  );
}
