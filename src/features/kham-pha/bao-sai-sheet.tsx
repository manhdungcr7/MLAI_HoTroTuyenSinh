// Báo một số liệu sai của một chương trình. Gửi vào hộp thư của CMS để tình nguyện viên của trường kiểm tra nguồn rồi sửa; không tự đè số liệu.
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { OChon, OInput, Truong } from "@/components/ui/nhap-lieu";
import { Nut } from "@/components/ui/nut-the";

export const CAC_TRUONG_BAO_SAI = ["Điểm chuẩn", "Học phí", "Tổ hợp xét tuyển", "Khu vực hoặc địa chỉ", "Tỷ lệ có việc làm", "Khác"] as const;

export type KetQuaGui = { ok: true } | { ok: false; loi: string };

/** Gửi báo sai lên máy chủ. Lỗi mạng hoặc máy chủ được nói thật, không báo "đã gửi" khi chưa lưu. */
export async function guiBaoSai(p: { maChuongTrinh: string; truongDuLieu: string; noiDung: string; link: string }, f: typeof fetch = fetch): Promise<KetQuaGui> {
  try {
    const r = await f("/api/bao-sai", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ maChuongTrinh: p.maChuongTrinh, truongDuLieu: p.truongDuLieu, noiDung: p.noiDung, ...(p.link.trim() && { link: p.link.trim() }) }),
    });
    const j = (await r.json().catch(() => null)) as { thanhCong?: boolean; loi?: string } | null;
    if (r.ok && j?.thanhCong) return { ok: true };
    return { ok: false, loi: j?.loi ?? "Chưa gửi được, bạn thử lại sau nhé" };
  } catch {
    return { ok: false, loi: "Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé." };
  }
}

export function NutBaoSai({ maChuongTrinh, tenNganh }: { maChuongTrinh: string; tenNganh: string }) {
  const [mo, setMo] = useState(false);
  const [truong, setTruong] = useState<string>(CAC_TRUONG_BAO_SAI[0]);
  const [noiDung, setNoiDung] = useState("");
  const [link, setLink] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState(false);

  const dong = () => { setMo(false); if (xong) { setXong(false); setNoiDung(""); setLink(""); } setLoi(null); };
  const gui = async () => {
    if (noiDung.trim().length < 5) { setLoi("Bạn cho mình biết số đúng là bao nhiêu, ít nhất vài chữ nhé."); return; }
    setDang(true); setLoi(null);
    const kq = await guiBaoSai({ maChuongTrinh, truongDuLieu: truong, noiDung, link });
    setDang(false);
    if (kq.ok) setXong(true); else setLoi(kq.loi);
  };

  return (
    <>
      <button type="button" onClick={() => setMo(true)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-do-chu hover:underline cursor-pointer">
        <AlertCircle size={13} />Báo số liệu sai
      </button>
      <HopTruot mo={mo} dong={dong} tieuDe="Báo số liệu sai">
        {xong ? (
          <div className="space-y-3 pb-1">
            <p className="flex items-start gap-2 text-[14px] text-chu leading-snug"><CheckCircle2 size={20} className="text-luc shrink-0" />Cảm ơn bạn. Mình đã nhận báo cáo. Người phụ trách trường sẽ kiểm tra nguồn rồi cập nhật nếu đúng.</p>
            <Nut onClick={dong}>Đóng</Nut>
          </div>
        ) : (
          <div className="space-y-3.5 pb-1">
            <p className="text-[13px] text-chu-phu leading-snug">Ngành: <b className="text-chu">{tenNganh}</b>. Báo cáo của bạn không tự đổi số liệu; người của trường sẽ đối chiếu với nguồn chính thức.</p>
            <Truong nhan="Số liệu nào sai?" htmlFor="bs-truong">
              <OChon id="bs-truong" value={truong} onChange={(e) => setTruong(e.target.value)}>{CAC_TRUONG_BAO_SAI.map((t) => <option key={t}>{t}</option>)}</OChon>
            </Truong>
            <Truong nhan="Số đúng là gì?" batBuoc htmlFor="bs-noi-dung" goiY="Ví dụ: điểm chuẩn 2025 là 27,5 chứ không phải 26,1.">
              <div className="rounded-xl border border-vien bg-white focus-within:border-xanh">
                <textarea id="bs-noi-dung" rows={4} maxLength={1000} value={noiDung} onChange={(e) => setNoiDung(e.target.value)}
                  className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[15px] text-chu outline-none" />
                <p className="px-3 pb-2 text-right text-[12px] text-chu-phu">{noiDung.length}/1000</p>
              </div>
            </Truong>
            <Truong nhan="Link nguồn (nếu có)" htmlFor="bs-link" goiY="Trang của trường hoặc thông báo chính thức. Có nguồn thì người phụ trách sửa nhanh hơn.">
              <OInput id="bs-link" inputMode="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            </Truong>
            {loi && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loi}</p>}
            <Nut onClick={() => void gui()} disabled={dang}>{dang ? "Đang gửi" : "Gửi báo cáo"}</Nut>
          </div>
        )}
      </HopTruot>
    </>
  );
}
