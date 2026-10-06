// Bản tóm tắt để em đưa cho phụ huynh, thầy cô, người tư vấn xem. Dữ liệu không rời máy trừ khi em tự bấm chia sẻ.
import { useState } from "react";
import { Copy, Printer, Share2, Users } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { The, Nut } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { tomTatChiaSe } from "./tom-tat";
import { ChiSoTheoDoi } from "./chi-so-theo-doi";

export default function ChiaSe() {
  const { s } = useApp();
  const [tin, setTin] = useState("");
  const { muc, vanBan } = tomTatChiaSe(s, new Date());
  const coShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const sao = async () => {
    try { await navigator.clipboard.writeText(vanBan); setTin("Đã sao chép. Em dán vào tin nhắn hoặc email là được."); }
    catch { setTin("Máy không cho sao chép tự động. Em bấm giữ vào đoạn văn bên dưới để chọn và sao chép."); }
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
