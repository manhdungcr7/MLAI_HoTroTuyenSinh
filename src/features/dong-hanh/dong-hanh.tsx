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
import { phanGiaiTenTruong, tachNganhVaBienThe } from "@/engine/trinh-bay-hoc-thuat";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import type { NhanNguyenVong } from "@/state/types";

const ngayDai = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
const soLuaChon = (tieuDe: string, dong: string[]) => {
  const trongTieuDe = tieuDe.match(/\((\d+)\)/);
  if (trongTieuDe) return Number(trongTieuDe[1]);
  return dong.filter((x) => !/^(Chưa lưu nguyện vọng nào\.|Không còn trong dữ liệu)/i.test(x)).length;
};

function docDongNguyenVong(dong: string) {
  const m = dong.match(/^Nguyện Vọng (\d+): (.+?) – (.+?) \((Thử sức|Vừa sức|An toàn|Dự phòng|chưa so được:[^;]+)(?:; điểm chuẩn ([^ ]+) năm (\d+))?\)$/i);
  if (!m) return null;
  const truong = phanGiaiTenTruong(m[2]);
  const nganh = tachNganhVaBienThe(m[3]);
  const nhan = ["Thử sức", "Vừa sức", "An toàn", "Dự phòng"].includes(m[4]) ? m[4] as NhanNguyenVong : null;
  return {
    viTri: Number(m[1]),
    tenTruong: truong.tenHienThi,
    tenTruongDayDu: truong.tenChinhThuc,
    nganh: nganh.core,
    nganhDayDu: m[3],
    bienThe: nganh.variant,
    nhan,
    diemChuan: m[5],
    nam: m[6],
  };
}

function TheNguyenVong({ dong, i }: { dong: string; i: number }) {
  const nv = docDongNguyenVong(dong);
  if (!nv) return <li className="rounded-xl border border-vien bg-trang p-3 text-[13px] text-chu-phu">Thông tin lựa chọn {i + 1} cần được cập nhật.</li>;
  return (
    <li className="rounded-xl border border-vien bg-trang p-3">
      <details className="group">
        <summary className="list-none cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[12px] font-bold text-chu-phu">NV {String(nv.viTri).padStart(2, "0")}</span>
            {nv.nhan ? <NhanNguyenVongTag nhan={nv.nhan} /> : <span className="text-[12px] text-chu-phu">Chưa so được</span>}
          </div>
          <b className="block text-[15px] font-extrabold text-muc leading-snug">{nv.nganh}</b>
          <span className="block text-[13px] text-chu-phu leading-snug">{nv.tenTruong}</span>
          {nv.bienThe && <span className="inline-flex mt-1 text-[11px] font-semibold text-xanh bg-xanh-nhat px-2 py-0.5 rounded-md">{nv.bienThe}</span>}
          <span className="mt-1 block text-[12px] font-semibold text-xanh">Xem chi tiết</span>
        </summary>
        <div className="mt-3 rounded-lg bg-nen p-3 text-[12px] space-y-1.5">
          <p><span className="text-chu-phu">Tên trường đầy đủ: </span><span className="font-medium text-muc">{nv.tenTruongDayDu}</span></p>
          <p><span className="text-chu-phu">Tên ngành trong đề án: </span><span className="font-medium text-muc">{nv.nganhDayDu}</span></p>
          {nv.diemChuan && nv.nam && <p className="text-chu-phu">Điểm tham khảo {nv.nam}: {nv.diemChuan}. Đây là điểm của năm trước, không bảo đảm kết quả xét tuyển.</p>}
        </div>
      </details>
    </li>
  );
}

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
  const mucNguyenVong = goi.muc.find((k) => /^Danh sách nguyện vọng/.test(k.tieuDe));
  const soNguyenVong = mucNguyenVong ? soLuaChon(mucNguyenVong.tieuDe, mucNguyenVong.dong) : 0;
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
        <DongThongBao tone="xanh" icon={Users} tieuDe={goi.ten ? `Nguyện vọng của ${goi.ten.split(/\s+/).slice(-2).join(" ")}` : "Nguyện vọng học sinh chia sẻ"}
          moTa={`${soNguyenVong} lựa chọn đang cân nhắc · Bản chia sẻ ngày ${ngayDai(goi.luc)}. Bạn có thể xem ngành, trường và góp ý cho học sinh.`} />

        {mucNguyenVong && (
          <section aria-label="Các nguyện vọng đang cân nhắc" className="space-y-2">
            <TieuDeMuc>Các lựa chọn</TieuDeMuc>
            <ol className="space-y-2">{mucNguyenVong.dong.map((d, i) => <TheNguyenVong key={`${i}-${d}`} dong={d} i={i} />)}</ol>
            <p className="text-[12px] text-chu-phu">Nhãn tham khảo từ điểm chuẩn năm trước, không bảo đảm kết quả xét tuyển.</p>
          </section>
        )}

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
            {goi.muc.filter((k) => !/^Danh sách nguyện vọng/.test(k.tieuDe)).map((k) => (
              <div key={k.tieuDe}>
                <h2 className="text-[14px] font-bold text-muc">{k.tieuDe}</h2>
                <ul className="mt-1 space-y-1">{k.dong.map((d) => <li key={d} className="text-[14px] text-chu leading-snug">{d}</li>)}</ul>
              </div>
            ))}
          </The>
        </section>

        <section aria-label="Viết lời nhắn" className="space-y-3">
          <TieuDeMuc>Gửi lời nhắn động viên</TieuDeMuc>
          <p className="text-[13px] text-chu-phu leading-snug">Bạn viết vài dòng động viên hoặc góp ý để gửi cho học sinh.</p>
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
            <OInput id="dh-ten" value={tu} maxLength={TOI_DA_TEN} placeholder="Ví dụ: Phụ huynh Minh Anh, Thầy Tuấn" onChange={(e) => { setTu(e.target.value); setLienKet(""); }} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dh-noi-dung" className="text-[14px] font-bold text-chu">Lời nhắn</label>
            <div className="rounded-xl border border-vien bg-trang focus-within:border-xanh">
              <textarea id="dh-noi-dung" rows={4} maxLength={TOI_DA_LOI_NHAN} value={noiDung} onChange={(e) => { setNoiDung(e.target.value); setLienKet(""); }}
                placeholder="Ví dụ: Chúc bạn luôn giữ vững phong độ và đạt kết quả tốt nhất."
                className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[15px] text-chu placeholder:text-chu-phu/70 outline-none" />
              <p className="px-3 pb-2 text-right text-[12px] font-semibold text-chu-phu">{noiDung.length}/{TOI_DA_LOI_NHAN}</p>
            </div>
          </div>
          <Nut bieuTuong={Send} disabled={!loi} onClick={tao}>Tạo liên kết lời nhắn</Nut>
          {!loi && (tu || noiDung) && <p className="text-[12px] text-chu-phu">Cần điền cả tên và lời nhắn.</p>}

          {lienKet && (
            <The className="space-y-2.5">
              <p className="text-[13px] text-chu">Liên kết đã sẵn sàng để gửi:</p>
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
