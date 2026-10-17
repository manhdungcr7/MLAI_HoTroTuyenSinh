// Khối nhỏ do slice S8 (Hưng) sở hữu nhưng được trang Hôm nay dùng. GIỮ NGUYÊN tên export và props.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frown, Meh, Quote, RefreshCw, Smile, type LucideIcon } from "lucide-react";
import { The, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { homNay, mucTieuDayDu, tuanHienTai, viecCuaTuan } from "@/state/chon";
import type { TamTrang, ToneTen } from "@/state/types";
import { CAU_NOI, TEN_NHOM_CAU_NOI, chonCauNoi, type NhomCauNoi } from "./cau-noi";

const CAC_TAM_TRANG: { gia: TamTrang; nhan: string; icon: LucideIcon; tone: ToneTen; loiNhan: string }[] = [
  { gia: "tot", nhan: "Khỏe", icon: Smile, tone: "luc", loiNhan: "Tuyệt! Làm việc khó trước khi còn sung sức." },
  { gia: "binhThuong", nhan: "Ổn", icon: Meh, tone: "xanh", loiNhan: "Xong một việc quan trọng là đủ tốt rồi." },
  { gia: "met", nhan: "Hơi mệt", icon: Frown, tone: "cam", loiNhan: "Đã làm nhẹ lịch còn lại của tuần. Nghỉ ngơi nhé." },
];

const VIEN_CHON: Record<ToneTen, string> = {
  luc: "bg-luc-nhat border-luc text-luc-chu", xanh: "bg-xanh-nhat border-xanh text-xanh", cam: "bg-cam-nhat border-cam text-cam-chu",
  tim: "bg-tim-nhat border-tim text-tim-chu", do: "bg-do-nhat border-do text-do-chu", muc: "bg-xanh-nhat border-xanh text-xanh",
};
const NEN_LOI_NHAN: Record<ToneTen, string> = {
  luc: "bg-luc-nhat text-luc-chu", xanh: "bg-xanh-nhat text-chu", cam: "bg-cam-nhat text-cam-chu", tim: "bg-tim-nhat text-tim-chu", do: "bg-do-nhat text-do-chu", muc: "bg-xanh-nhat text-chu",
};

/** "Hôm nay em thấy thế nào?" Đổi tâm trạng chỉ lưu tâm trạng; lịch tuần chỉ được xếp lại khi em bấm xác nhận (không tự sửa lịch). */
export function TamTrangHomNay() {
  const { s, datTamTrang, xepLai } = useApp();
  const nav = useNavigate();
  const [deXuat, setDeXuat] = useState(false);
  const [vuaDoi, setVuaDoi] = useState(false);
  const coViec = viecCuaTuan(s.viec, tuanHienTai()).length > 0;

  const chon = (t: TamTrang) => {
    if (t === s.tamTrang) return;
    datTamTrang(t);
    setVuaDoi(false);
    setDeXuat(coViec);
  };
  // Xác nhận chạy khi tâm trạng mới đã nằm trong state (bấm sau, nên xepLai đọc đúng giá trị).
  const dongY = () => { xepLai(tuanHienTai(), homNay()); setDeXuat(false); setVuaDoi(true); };
  const hienTai = CAC_TAM_TRANG.find((t) => t.gia === s.tamTrang) ?? CAC_TAM_TRANG[1];

  return (
    <The className="space-y-2.5">
      <p id="tam-trang" className="font-extrabold text-muc text-[15px]">Hôm nay bạn thấy thế nào?</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="tam-trang">
        {CAC_TAM_TRANG.map((t) => {
          const dang = s.tamTrang === t.gia;
          return (
            <button key={t.gia} type="button" role="radio" aria-checked={dang} onClick={() => chon(t.gia)}
              className={gop("min-h-11 rounded-xl border flex items-center justify-center gap-1.5 text-[13px] font-bold transition-colors",
                dang ? VIEN_CHON[t.tone] : "bg-trang border-vien text-chu active:bg-xanh-nhat")}>
              <t.icon size={18} />{t.nhan}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={gop("rounded-xl px-3 py-2 text-[13px] font-semibold leading-snug", NEN_LOI_NHAN[hienTai.tone])}>
        {hienTai.loiNhan}
      </p>
      {deXuat && coViec && (
        <div role="group" aria-label="Xếp lại lịch tuần theo tâm trạng" className="rounded-xl border border-xanh/40 bg-trang p-2.5 space-y-2">
          <p className="text-[13px] text-chu leading-snug">Bạn muốn mình xếp lại lịch tự học các ngày còn lại của tuần theo tâm trạng này không? Lịch hiện tại giữ nguyên cho tới khi bạn đồng ý.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDeXuat(false)} className="min-h-11 rounded-xl border border-vien text-[13px] font-bold text-chu active:bg-xanh-nhat">Giữ nguyên</button>
            <button type="button" onClick={dongY} className="min-h-11 rounded-xl border border-xanh bg-xanh text-[13px] font-bold text-white">Xếp lại lịch</button>
          </div>
        </div>
      )}
      {vuaDoi && coViec && (
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
        <p className="text-[14px] font-semibold text-chu leading-snug" aria-live="polite" title={TEN_NHOM_CAU_NOI[cau.nhom]}>{cau.cau}</p>
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
  if (m && !m.anDemNguoc && m.soNgayCon <= 45) return "ganKyThi";
  if (!s.lichSu.length) return "batDau";
  return "kienTri";
}
