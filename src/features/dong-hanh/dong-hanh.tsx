// Màn của người đồng hành (phụ huynh, thầy cô, người tư vấn): xem bản tóm tắt em chia sẻ, viết lời nhắn gửi lại. Không cần tài khoản.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Send, Share2, Users } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { OInput } from "@/components/ui/nhap-lieu";
import { Nut, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { DUONG_DAN } from "@/duong-dan";
import type { VaiDongHanh } from "@/state/types";
import { CAC_VAI, TOI_DA_LOI_NHAN, TOI_DA_TEN, docGoiChiaSe, lienKetDayDu, maHoa, taoLoiNhan } from "./goi-tin";

const ngayDai = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };

export default function DongHanh() {
  const [q] = useSearchParams();
  const goi = docGoiChiaSe(q.get("d"));
  const [vai, setVai] = useState<VaiDongHanh>("phuHuynh");
  const [tu, setTu] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [lienKet, setLienKet] = useState("");
  const [tin, setTin] = useState("");
  const coShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (!goi) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Người đồng hành" quayLai={DUONG_DAN.homNay()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<Users size={26} />} tieuDe="Liên kết này không đọc được"
            moTa="Liên kết có thể bị cắt ngắn khi gửi. Em nhờ bạn học sinh gửi lại, nhớ chép cả đường dẫn." />
        </NoiDung>
      </>
    );
  }

  const loi = taoLoiNhan(tu, vai, noiDung, new Date());
  const tao = () => {
    if (!loi) return;
    setLienKet(lienKetDayDu(DUONG_DAN.nhanLoiNhan(maHoa(loi))));
    setTin("");
  };
  const sao = async () => {
    try { await navigator.clipboard.writeText(lienKet); setTin("Đã sao chép liên kết. Bạn gửi cho em qua Zalo hoặc tin nhắn."); }
    catch { setTin("Máy không cho sao chép tự động. Bạn bấm giữ vào liên kết bên dưới để chọn và sao chép."); }
  };
  const chiaSe = async () => {
    try { await navigator.share({ title: "Lời nhắn gửi em", url: lienKet }); }
    catch (e) { if ((e as Error).name !== "AbortError") setTin("Không mở được chia sẻ. Bạn thử nút Sao chép nhé."); }
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Người đồng hành" quayLai={DUONG_DAN.homNay()} />
      <NoiDung className="space-y-4">
        <DongThongBao tone="xanh" icon={Users} tieuDe={goi.ten ? `Hồ sơ của ${goi.ten}` : "Hồ sơ một học sinh chia sẻ"}
          moTa={`Bản tóm tắt ngày ${ngayDai(goi.luc)}. Bạn không cần tài khoản. Nội dung nằm ngay trong liên kết, không lưu trên máy chủ nào. Điểm chuẩn là số các năm trước, chỉ để cân nhắc.`} />

        {goi.chiSo.length > 0 && (
          <section aria-label="Chỉ số">
            <TieuDeMuc>Tình hình hiện tại</TieuDeMuc>
            <The className="grid grid-cols-2 gap-3">
              {goi.chiSo.map((c) => (
                <div key={c.ten}><p className="text-[18px] font-extrabold text-muc leading-none">{c.giaTri}</p><p className="mt-1 text-[12px] text-chu-phu leading-snug">{c.ten}</p></div>
              ))}
            </The>
          </section>
        )}

        <section aria-label="Nội dung tóm tắt">
          <The className="space-y-3.5">
            {goi.muc.map((k) => (
              <div key={k.tieuDe}>
                <h2 className="text-[14px] font-bold text-muc">{k.tieuDe}</h2>
                <ul className="mt-1 space-y-1">{k.dong.map((d) => <li key={d} className="text-[14px] text-chu leading-snug">{d}</li>)}</ul>
              </div>
            ))}
          </The>
        </section>

        <section aria-label="Viết lời nhắn" className="space-y-3">
          <TieuDeMuc>Gửi lời nhắn cho em</TieuDeMuc>
          <p className="text-[13px] text-chu-phu leading-snug">Bạn viết vài dòng động viên hoặc góp ý. Mình tạo một liên kết, bạn gửi lại cho em; em mở liên kết thì lời nhắn được lưu vào hồ sơ của em.</p>
          <fieldset>
            <legend className="text-[14px] font-bold text-chu mb-1.5">Bạn là</legend>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {CAC_VAI.map((v) => (
                <button key={v.gia} type="button" role="radio" aria-checked={vai === v.gia} onClick={() => setVai(v.gia)}
                  className={gop("min-h-12 rounded-xl border px-2 text-[14px] font-semibold", vai === v.gia ? "border-xanh bg-xanh-nhat text-xanh" : "border-vien bg-trang text-chu")}>{v.nhan}</button>
              ))}
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor="dh-ten" className="text-[14px] font-bold text-chu">Tên của bạn</label>
            <OInput id="dh-ten" value={tu} maxLength={TOI_DA_TEN} placeholder="Ví dụ: Mẹ của Minh Anh, Cô Lan" onChange={(e) => { setTu(e.target.value); setLienKet(""); }} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dh-noi-dung" className="text-[14px] font-bold text-chu">Lời nhắn</label>
            <div className="rounded-xl border border-vien bg-trang focus-within:border-xanh">
              <textarea id="dh-noi-dung" rows={4} maxLength={TOI_DA_LOI_NHAN} value={noiDung} onChange={(e) => { setNoiDung(e.target.value); setLienKet(""); }}
                placeholder="Ví dụ: Gia đình ủng hộ em theo ngành này. Em nhớ giữ thêm một trường an toàn nhé."
                className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[15px] text-chu placeholder:text-chu-phu/70 outline-none" />
              <p className="px-3 pb-2 text-right text-[12px] font-semibold text-chu-phu">{noiDung.length}/{TOI_DA_LOI_NHAN}</p>
            </div>
          </div>
          <Nut bieuTuong={Send} disabled={!loi} onClick={tao}>Tạo liên kết lời nhắn</Nut>
          {!loi && (tu || noiDung) && <p className="text-[12px] text-chu-phu">Cần điền cả tên và lời nhắn.</p>}

          {lienKet && (
            <The className="space-y-2.5">
              <p className="text-[13px] text-chu">Liên kết đã sẵn sàng. Gửi cho em:</p>
              <p className="break-all rounded-lg bg-nen p-2.5 text-[12px] text-chu-phu select-all max-h-24 overflow-y-auto">{lienKet}</p>
              <Nut bieuTuong={Copy} onClick={sao}>Sao chép liên kết</Nut>
              {coShare && <Nut kieu="vien" bieuTuong={Share2} onClick={chiaSe}>Gửi qua ứng dụng khác</Nut>}
            </The>
          )}
          <div aria-live="polite" className="min-h-5 text-[13px] text-chu-phu">{tin}</div>
        </section>
      </NoiDung>
    </>
  );
}
