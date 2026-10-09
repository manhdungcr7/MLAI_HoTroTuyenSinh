// Trang "Cùng cập nhật dữ liệu": sinh viên, giáo viên, cán bộ tuyển sinh đăng ký làm tình nguyện viên cho một trường.
// Dữ liệu tuyển sinh đổi mỗi năm và rất khó thu thập tự động; người trong cuộc là nguồn đáng tin nhất. Mọi nội dung họ nhập đều qua duyệt và phải có nguồn.
import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, ShieldCheck } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { TieuDeMuc } from "@/components/ui/hien-thi";
import { OChon, OInput, Truong } from "@/components/ui/nhap-lieu";
import { Nut, The } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON } from "@/data/lua-chon-that";
import { DUONG_DAN } from "@/duong-dan";

export const CAC_VAI_TRO = [
  { gia: "sinh_vien", nhan: "Sinh viên của trường" },
  { gia: "giao_vien", nhan: "Thầy cô, giáo viên" },
  { gia: "can_bo_tuyen_sinh", nhan: "Cán bộ tuyển sinh" },
  { gia: "khac", nhan: "Khác" },
] as const;

export async function guiDangKy(p: { hoTen: string; vaiTro: string; maTruong: string; lienHe: string; ghiChu: string }, f: typeof fetch = fetch): Promise<{ ok: true } | { ok: false; loi: string }> {
  try {
    const r = await f("/api/tinh-nguyen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) });
    const j = (await r.json().catch(() => null)) as { thanhCong?: boolean; loi?: string } | null;
    if (r.ok && j?.thanhCong) return { ok: true };
    return { ok: false, loi: j?.loi ?? "Chưa gửi được, bạn thử lại sau nhé" };
  } catch {
    return { ok: false, loi: "Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé." };
  }
}

export default function DongGop() {
  const truong = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of LUA_CHON) if (l.maTruong) m.set(l.maTruong.toUpperCase(), l.tenTruong);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, []);
  const [f, setF] = useState({ hoTen: "", vaiTro: "sinh_vien", maTruong: "", lienHe: "", ghiChu: "" });
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState(false);
  const dat = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((c) => ({ ...c, [k]: e.target.value }));

  const gui = async () => {
    if (f.hoTen.trim().length < 2) return setLoi("Bạn cho mình biết họ tên nhé.");
    if (!f.maTruong) return setLoi("Bạn chọn trường mình muốn giúp.");
    if (!f.lienHe.trim()) return setLoi("Bạn nhập email hoặc số điện thoại để mình liên hệ.");
    setDang(true); setLoi(null);
    const kq = await guiDangKy(f);
    setDang(false);
    if (kq.ok) setXong(true); else setLoi(kq.loi);
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Cùng cập nhật dữ liệu" quayLai={DUONG_DAN.hoSo()} />
      <NoiDung className="space-y-4">
        <The className="space-y-2">
          <p className="text-[18px] font-extrabold text-muc leading-tight">Bạn có thể giúp các em chọn trường đúng hơn</p>
          <p className="text-[14px] text-chu leading-snug">Điểm chuẩn, học phí, học bổng, ký túc xá đổi mỗi mùa tuyển sinh, và chỉ người trong trường mới nắm rõ nhất. Nếu bạn là sinh viên, thầy cô hay cán bộ tuyển sinh, bạn giúp cập nhật dữ liệu của trường mình bằng điện thoại, mỗi lần vài phút.</p>
        </The>

        <section aria-label="Cách hoạt động">
          <TieuDeMuc>Cách hoạt động</TieuDeMuc>
          <ul className="space-y-2">
            {[
              [ClipboardCheck, "Bạn điền thông tin trường mình quen, luôn kèm link nguồn (trang tuyển sinh, thông báo chính thức)."],
              [ShieldCheck, "Quản trị viên đối chiếu nguồn rồi duyệt. Thông tin chưa duyệt không bao giờ hiện cho học sinh."],
              [CheckCircle2, "Thông tin đã duyệt hiện ở trang ngành, ghi rõ nguồn và ai cung cấp (chính thức hay cộng đồng)."],
            ].map(([Icon, chu], i) => {
              const I = Icon as typeof ClipboardCheck;
              return <li key={i} className="flex items-start gap-2.5 text-[14px] text-chu leading-snug"><I size={20} className="text-xanh shrink-0 mt-px" /><span>{chu as string}</span></li>;
            })}
          </ul>
        </section>

        {xong ? (
          <The className="space-y-3">
            <p className="flex items-start gap-2 text-[15px] font-bold text-luc-chu"><CheckCircle2 size={22} className="shrink-0" />Cảm ơn bạn! Mình đã nhận đăng ký.</p>
            <p className="text-[14px] text-chu leading-snug">Quản trị viên sẽ liên hệ để xác minh, rồi cấp quyền và giao đúng trường của bạn. Bạn chưa cần làm gì thêm.</p>
          </The>
        ) : (
          <section aria-label="Đăng ký" className="space-y-3.5">
            <TieuDeMuc>Đăng ký làm tình nguyện viên</TieuDeMuc>
            <Truong nhan="Họ tên" batBuoc htmlFor="tn-ten"><OInput id="tn-ten" autoComplete="name" value={f.hoTen} onChange={dat("hoTen")} maxLength={100} /></Truong>
            <Truong nhan="Bạn là" batBuoc htmlFor="tn-vai"><OChon id="tn-vai" value={f.vaiTro} onChange={dat("vaiTro")}>{CAC_VAI_TRO.map((v) => <option key={v.gia} value={v.gia}>{v.nhan}</option>)}</OChon></Truong>
            <Truong nhan="Trường bạn muốn giúp" batBuoc htmlFor="tn-truong">
              <OChon id="tn-truong" value={f.maTruong} onChange={dat("maTruong")}>
                <option value="">Chọn trường</option>
                {truong.map(([ma, ten]) => <option key={ma} value={ma}>{ten}</option>)}
              </OChon>
            </Truong>
            <Truong nhan="Email hoặc số điện thoại" batBuoc htmlFor="tn-lien-he" goiY="Chỉ dùng để quản trị viên liên hệ và cấp quyền, không hiện cho ai khác. Có email thì mình cấp quyền được ngay.">
              <OInput id="tn-lien-he" inputMode="email" autoComplete="email" value={f.lienHe} onChange={dat("lienHe")} maxLength={120} />
            </Truong>
            <Truong nhan="Giới thiệu ngắn (không bắt buộc)" htmlFor="tn-ghi-chu" goiY="Ví dụ: sinh viên năm 3 ngành CNTT, thuộc ban truyền thông của trường.">
              <div className="rounded-xl border border-vien bg-white focus-within:border-xanh">
                <textarea id="tn-ghi-chu" rows={3} maxLength={500} value={f.ghiChu} onChange={dat("ghiChu")} className="block w-full resize-none rounded-xl bg-transparent px-3 pt-2.5 text-[15px] text-chu outline-none" />
                <p className="px-3 pb-2 text-right text-[12px] text-chu-phu">{f.ghiChu.length}/500</p>
              </div>
            </Truong>
            {loi && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loi}</p>}
            <Nut onClick={() => void gui()} disabled={dang}>{dang ? "Đang gửi" : "Gửi đăng ký"}</Nut>
            <DongThongBao tone="xanh" icon={ShieldCheck} tieuDe="Mình không đăng thông tin cá nhân của bạn" moTa="Họ tên và liên hệ chỉ quản trị viên thấy. Học sinh chỉ thấy nguồn của thông tin, không thấy tên người nhập." />
          </section>
        )}
      </NoiDung>
    </>
  );
}
