// Bản tóm tắt để em đưa cho phụ huynh, thầy cô, người tư vấn xem. Dữ liệu không rời máy trừ khi em tự bấm chia sẻ.
import { useState } from "react";
import { Copy, Link2, MessageCircleHeart, Printer, Share2, Trash2, Users } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { The, Nut } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { TEN_VAI, lienKetDayDu, maHoa, taoGoiChiaSe } from "@/features/dong-hanh/goi-tin";
import { CongTac } from "@/components/ui/nhap-lieu";
import { Nhan } from "@/components/ui/nut-the";
import { chiSoTheoDoi, tomTatChiaSe } from "./tom-tat";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";

export default function ChiaSe() {
  const { s, xoaLoiNhan } = useApp();
  const [tin, setTin] = useState("");
  const [kemTen, setKemTen] = useState(false);
  const [lienKet, setLienKet] = useState("");
  const { muc, vanBan } = tomTatChiaSe(s, new Date());
  const coShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const sao = async () => {
    try { await navigator.clipboard.writeText(vanBan); setTin("Đã sao chép. Em dán vào tin nhắn hoặc email là được."); }
    catch { setTin("Máy không cho sao chép tự động. Em bấm giữ vào đoạn văn bên dưới để chọn và sao chép."); }
  };
  const taoLienKet = () => {
    const goi = taoGoiChiaSe(muc, chiSoTheoDoi(s).map((c) => ({ ten: c.ten, giaTri: c.giaTri })), new Date(), kemTen ? s.hoSo.hoTen : undefined);
    setLienKet(lienKetDayDu(DUONG_DAN.dongHanh(maHoa(goi))));
  };
  const saoLienKet = async () => {
    try { await navigator.clipboard.writeText(lienKet); setTin("Đã sao chép liên kết. Em gửi cho phụ huynh hoặc thầy cô qua Zalo, tin nhắn."); }
    catch { setTin("Máy không cho sao chép tự động. Em bấm giữ vào liên kết để chọn và sao chép."); }
  };
  const chiaSe = async () => {
    try { await navigator.share({ title: "Tóm tắt Nguyện Vọng AI", text: vanBan }); }
    catch (e) { if ((e as Error).name !== "AbortError") setTin("Không mở được chia sẻ. Em thử nút Sao chép nhé."); }
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Chia sẻ với người đồng hành" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-4">
        <DongThongBao tone="xanh" icon={Users} tieuDe="Để người lớn cùng em cân nhắc"
          moTa="Đây là bản tóm tắt hồ sơ, mục tiêu, danh sách nguyện vọng và những điều nên trao đổi. Em gửi cho phụ huynh, thầy cô hoặc người tư vấn để họ nắm đúng tình hình của em. Mình không gửi gì lên máy chủ." />

        <section aria-label="Chỉ số theo dõi">
          <TieuDeMuc>Tiến bộ của em</TieuDeMuc>
          <ChiSoTheoDoi s={s} />
        </section>

        <section aria-label="Liên kết cho người đồng hành" className="space-y-2.5 print:hidden">
          <TieuDeMuc>Gửi liên kết cho người đồng hành</TieuDeMuc>
          <The className="space-y-3">
            <p className="text-[14px] text-chu leading-snug">Người nhận mở liên kết là xem được bản tóm tắt này và viết lời nhắn gửi lại em, không cần tài khoản. Nội dung nằm trong chính liên kết, không lưu trên máy chủ.</p>
            <div className="flex items-center justify-between gap-3 min-h-11">
              <span className="text-[14px] text-chu leading-snug">Kèm tên của em trong liên kết</span>
              <CongTac dang={kemTen} onChange={(v) => { setKemTen(v); setLienKet(""); }} nhan="Kèm tên của em trong liên kết" />
            </div>
            <Nut bieuTuong={Link2} onClick={taoLienKet}>Tạo liên kết</Nut>
            {lienKet && (
              <>
                <p className="break-all rounded-lg bg-nen p-2.5 text-[12px] text-chu-phu select-all max-h-24 overflow-y-auto">{lienKet}</p>
                <Nut kieu="vien" bieuTuong={Copy} onClick={saoLienKet}>Sao chép liên kết</Nut>
                <p className="text-[12px] text-chu-phu leading-snug">Ai có liên kết đều xem được nội dung này. Em chỉ gửi cho người em tin tưởng.</p>
              </>
            )}
          </The>
        </section>

        {s.loiNhan.length > 0 && (
          <section aria-label="Lời nhắn đã nhận" className="print:hidden">
            <TieuDeMuc>Lời nhắn em đã nhận</TieuDeMuc>
            <div className="space-y-2">
              {s.loiNhan.map((l) => (
                <The key={l.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MessageCircleHeart size={18} className="text-xanh shrink-0" />
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-chu">{l.tu}</p>
                    <Nhan tone="xanh">{TEN_VAI[l.vai]}</Nhan>
                    <button type="button" aria-label={`Xóa lời nhắn của ${l.tu}`} onClick={() => xoaLoiNhan(l.id)} className="size-11 -mr-2 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><Trash2 size={18} /></button>
                  </div>
                  <p className="text-[14px] text-chu leading-snug whitespace-pre-line">{l.noiDung}</p>
                </The>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Nội dung bản tóm tắt" className="print-vung">
          <TieuDeMuc>Nội dung sẽ được chia sẻ</TieuDeMuc>
          <The className="space-y-3.5">
            {muc.map((k) => (
              <div key={k.tieuDe}>
                <h3 className="text-[14px] font-bold text-muc">{k.tieuDe}</h3>
                <ul className="mt-1 space-y-1">
                  {k.dong.map((d) => <li key={d} className="text-[14px] text-chu leading-snug">{d}</li>)}
                </ul>
              </div>
            ))}
          </The>
        </section>

        <div aria-live="polite" className="min-h-5 text-[13px] text-chu-phu">{tin}</div>
        <div className="space-y-2 print:hidden">
          <Nut bieuTuong={Copy} onClick={sao}>Sao chép bản tóm tắt</Nut>
          {coShare && <Nut kieu="vien" bieuTuong={Share2} onClick={chiaSe}>Gửi qua ứng dụng khác</Nut>}
          <Nut kieu="vien" bieuTuong={Printer} onClick={() => window.print()}>In hoặc lưu thành PDF</Nut>
        </div>
      </NoiDung>
    </>
  );
}
