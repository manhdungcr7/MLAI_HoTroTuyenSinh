// Khối nhỏ do slice S8 (Hưng) sở hữu nhưng được trang Hôm nay dùng. GIỮ NGUYÊN tên export và props.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frown, Meh, Quote, RefreshCw, Smile, type LucideIcon } from "lucide-react";
import { The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { homNay, mucTieuDayDu, tuanHienTai } from "@/state/chon";
import type { TamTrang, ToneTen } from "@/state/types";
import { CAU_NOI, TEN_NHOM_CAU_NOI, chonCauNoi, type NhomCauNoi } from "./cau-noi";

const CAC_TAM_TRANG: { gia: TamTrang; nhan: string; icon: LucideIcon; tone: ToneTen; loiNhan: string }[] = [
  { gia: "tot", nhan: "Khỏe", icon: Smile, tone: "luc", loiNhan: "Tuyệt quá! Mình giữ lịch như cũ. Làm việc nên làm trước khi còn nhiều năng lượng nhé." },
  { gia: "binhThuong", nhan: "Bình thường", icon: Meh, tone: "xanh", loiNhan: "Cứ từ từ thôi. Hôm nay xong một việc quan trọng là đã tốt rồi." },
  { gia: "met", nhan: "Hơi mệt", icon: Frown, tone: "cam", loiNhan: "Mình đã làm nhẹ lịch tự học còn lại của tuần. Nghỉ ngơi cũng là một phần của việc học." },
];

const VIEN_CHON: Record<ToneTen, string> = {
  luc: "bg-luc-nhat border-luc text-luc-chu", xanh: "bg-xanh-nhat border-xanh text-xanh", cam: "bg-cam-nhat border-cam text-cam-chu",
  tim: "bg-tim-nhat border-tim text-tim-chu", do: "bg-do-nhat border-do text-do-chu", muc: "bg-xanh-nhat border-xanh text-xanh",
};
const NEN_LOI_NHAN: Record<ToneTen, string> = {
  luc: "bg-luc-nhat text-luc-chu", xanh: "bg-xanh-nhat text-chu", cam: "bg-cam-nhat text-cam-chu", tim: "bg-tim-nhat text-tim-chu", do: "bg-do-nhat text-do-chu", muc: "bg-xanh-nhat text-chu",
};

/** "Hôm nay em thấy thế nào?" Chọn "Hơi mệt" thì lịch tự học các ngày còn lại của tuần được làm nhẹ đi. */
export function TamTrangHomNay() {
  const { s, datTamTrang, xepLai } = useApp();
  const nav = useNavigate();
  // Xếp lại SAU khi tâm trạng mới đã vào state: gọi ngay trong lúc bấm thì xepLai còn đọc tâm trạng cũ.
  const canXep = useRef(false);
  const [vuaDoi, setVuaDoi] = useState(false);
  useEffect(() => {
    if (!canXep.current) return;
    canXep.current = false;
    if (s.viec.length) { xepLai(tuanHienTai(), homNay()); setVuaDoi(true); }
  }, [s.tamTrang, s.viec.length, xepLai]);

  const chon = (t: TamTrang) => {
    if (t === s.tamTrang) return;
    canXep.current = true;
    datTamTrang(t);
  };
  const hienTai = CAC_TAM_TRANG.find((t) => t.gia === s.tamTrang) ?? CAC_TAM_TRANG[1];

  return (
    <The className="space-y-2.5">
      <p id="tam-trang" className="font-extrabold text-muc text-[15px]">Hôm nay em thấy thế nào?</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="tam-trang">
        {CAC_TAM_TRANG.map((t) => {
          const dang = s.tamTrang === t.gia;
          return (
            <button key={t.gia} type="button" role="radio" aria-checked={dang} onClick={() => chon(t.gia)}
              className={gop("min-h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-[13px] font-bold transition-colors",
                dang ? VIEN_CHON[t.tone] : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
              <t.icon size={22} />{t.nhan}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={gop("rounded-xl px-3 py-2 text-[13px] font-semibold leading-snug", NEN_LOI_NHAN[hienTai.tone])}>
        {hienTai.loiNhan}
      </p>
      {vuaDoi && s.viec.length > 0 && (
        <button type="button" onClick={() => nav(DUONG_DAN.tuan("lich"))} className="w-full min-h-11 rounded-xl border border-xanh/40 text-[14px] font-bold text-xanh active:bg-xanh-nhat">
          Lịch tuần đã xếp lại · Xem lịch
        </button>
      )}
    </The>
  );
}

/** Một câu động lực mỗi ngày, bấm để đổi câu khác. Câu đầu tiên hợp với hoàn cảnh của em hôm nay. */
export function CauNoiDongLuc() {
  const { s, doiCauNoi } = useApp();
  const ngayTrongNam = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const uuTien = nhomPhuHop(s);
  const cau = chonCauNoi(ngayTrongNam, s.cauNoiHomNay % CAU_NOI.length, uuTien);
  return (
    <The tone="tim" className="flex gap-3 items-start">
      <Quote className="text-tim shrink-0 mt-0.5" size={22} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-tim-chu">{TEN_NHOM_CAU_NOI[cau.nhom]}</p>
        <p className="text-[15px] font-semibold text-chu leading-snug" aria-live="polite">{cau.cau}</p>
      </div>
      <button type="button" onClick={doiCauNoi} aria-label="Đổi câu khác" className="size-11 -m-2 grid place-items-center rounded-full text-tim-chu active:bg-tim/10"><RefreshCw size={18} /></button>
    </The>
  );
}

/** Nhóm câu hợp hoàn cảnh: mệt → nghỉ ngơi; vừa dời/bỏ qua việc → không sao cả; gần thi → gần kỳ thi. */
function nhomPhuHop(s: ReturnType<typeof useApp>["s"]): NhomCauNoi | null {
  if (s.tamTrang === "met") return "nghiNgoi";
  const ganNhat = s.lichSu[0];
  if (ganNhat && ganNhat.trangThai !== "xong" && Date.now() - new Date(ganNhat.luc).getTime() < 2 * 86_400_000) return "sauKhiSai";
  const m = mucTieuDayDu(s);
  if (m && m.soNgayCon <= 45) return "ganKyThi";
  if (!s.lichSu.length) return "batDau";
  return "kienTri";
}
