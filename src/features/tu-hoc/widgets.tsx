// Khối nhỏ do slice S8 (Hưng) sở hữu nhưng được trang Hôm nay dùng. GIỮ NGUYÊN tên export và props.
import { Frown, Meh, Quote, RefreshCw, Smile, type LucideIcon } from "lucide-react";
import { The, gop } from "@/components/ui/nut-the";
import { CAU_NOI_DONG_LUC } from "@/data/lich-mau";
import { useApp } from "@/state/store";
import { homNay, tuanHienTai } from "@/state/chon";
import type { TamTrang } from "@/state/types";

const CAC_TAM_TRANG: { gia: TamTrang; nhan: string; icon: LucideIcon }[] = [
  { gia: "tot", nhan: "Khỏe", icon: Smile },
  { gia: "binhThuong", nhan: "Bình thường", icon: Meh },
  { gia: "met", nhan: "Hơi mệt", icon: Frown },
];

/** "Hôm nay em thấy thế nào?" Chọn "Hơi mệt" thì lịch tự học các ngày còn lại của tuần được làm nhẹ đi. */
export function TamTrangHomNay() {
  const { s, datTamTrang, xepLai } = useApp();
  const chon = (t: TamTrang) => {
    datTamTrang(t);
    // Cập nhật tâm trạng xong, xếp lại phần còn lại của tuần cho hợp sức em.
    queueMicrotask(() => xepLai(tuanHienTai(), homNay()));
  };
  return (
    <The className="space-y-2.5">
      <p className="font-extrabold text-muc text-[15px]">Hôm nay em thấy thế nào?</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tâm trạng hôm nay">
        {CAC_TAM_TRANG.map((t) => (
          <button key={t.gia} type="button" role="radio" aria-checked={s.tamTrang === t.gia} onClick={() => chon(t.gia)}
            className={gop("min-h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-[13px] font-bold",
              s.tamTrang === t.gia ? "bg-xanh-nhat border-xanh text-xanh" : "bg-trang border-vien text-chu")}>
            <t.icon size={22} />{t.nhan}
          </button>
        ))}
      </div>
      {s.tamTrang === "met" && <p className="text-[13px] text-chu-phu">Mình làm nhẹ lịch tự học giúp em. Nghỉ ngơi cũng là một phần của việc học.</p>}
    </The>
  );
}

/** Một câu động lực mỗi ngày, bấm để đổi câu khác. */
export function CauNoiDongLuc() {
  const { s, doiCauNoi } = useApp();
  const ngayTrongNam = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const cau = CAU_NOI_DONG_LUC[(ngayTrongNam + s.cauNoiHomNay) % CAU_NOI_DONG_LUC.length];
  return (
    <The tone="tim" className="flex gap-3 items-start">
      <Quote className="text-tim shrink-0 mt-0.5" size={22} />
      <p className="flex-1 text-[14px] font-semibold text-chu leading-snug">{cau}</p>
      <button type="button" onClick={doiCauNoi} aria-label="Đổi câu khác" className="size-11 -m-2 grid place-items-center rounded-full text-tim-chu"><RefreshCw size={18} /></button>
    </The>
  );
}
