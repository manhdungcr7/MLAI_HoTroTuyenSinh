// Đăng nhập bằng email + mật khẩu, đổi mật khẩu (tự nguyện hoặc bắt buộc với mật khẩu tạm) và nút tài khoản ở đầu trang.
import { useState, type FormEvent } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { dangNhap, dangXuat, doiMatKhau, thongBaoLoi } from "@cms/may-chu/api";
import { HopTruot } from "@cms/thanh-phan/ui/hien-thi";
import { OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nut } from "@cms/thanh-phan/ui/nut-the";

const TOI_THIEU = 8;

function Loi({ noiDung }: { noiDung: string | null }) {
  return noiDung ? <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{noiDung}</p> : null;
}

/** Hiện khi chưa đăng nhập hoặc phiên hết hạn. */
export function ManDangNhap({ onXong }: { onXong: () => void }) {
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const gui = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !matKhau) { setLoi("Bạn nhập email và mật khẩu nhé."); return; }
    setDang(true); setLoi(null);
    try { await dangNhap(email.trim(), matKhau); onXong(); }
    catch (err) { setLoi(thongBaoLoi(err)); setDang(false); }
  };

  return (
    <main className="min-h-screen bg-nen px-4 pt-[12vh]">
      <form onSubmit={(e) => void gui(e)} noValidate className="mx-auto w-full max-w-[400px] space-y-3 rounded-the bg-trang border border-vien shadow-the p-5">
        <span className="size-10 rounded-xl bg-xanh text-white grid place-items-center"><ShieldCheck size={20} strokeWidth={2.5} /></span>
        <h1 className="text-[20px] font-extrabold text-muc">Đăng nhập quản trị</h1>
        <Truong nhan="Email" htmlFor="dn-email">
          <OInput id="dn-email" type="email" inputMode="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Truong>
        <Truong nhan="Mật khẩu" htmlFor="dn-mk">
          <OInput id="dn-mk" type="password" autoComplete="current-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} />
        </Truong>
        <Loi noiDung={loi} />
        <Nut type="submit" disabled={dang}>{dang ? "Đang vào" : "Đăng nhập"}</Nut>
        <p className="text-[12px] text-chu-phu">Quên mật khẩu? Nhờ quản trị viên đặt lại cho bạn.</p>
      </form>
    </main>
  );
}

/** Form đổi mật khẩu; dùng cả cho màn bắt buộc lẫn hộp "Đổi mật khẩu". */
function FormDoiMatKhau({ onXong, onHuy }: { onXong: () => void; onHuy?: () => void }) {
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [lai, setLai] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const gui = async (e: FormEvent) => {
    e.preventDefault();
    if (moi.length < TOI_THIEU) { setLoi(`Mật khẩu mới cần ít nhất ${TOI_THIEU} ký tự.`); return; }
    if (moi !== lai) { setLoi("Hai ô mật khẩu mới chưa giống nhau."); return; }
    setDang(true); setLoi(null);
    try { await doiMatKhau(cu, moi); onXong(); }
    catch (err) { setLoi(thongBaoLoi(err)); setDang(false); }
  };

  return (
    <form onSubmit={(e) => void gui(e)} noValidate className="space-y-3">
      <Truong nhan="Mật khẩu hiện tại" htmlFor="mk-cu"><OInput id="mk-cu" type="password" autoComplete="current-password" value={cu} onChange={(e) => setCu(e.target.value)} /></Truong>
      <Truong nhan="Mật khẩu mới" htmlFor="mk-moi" goiY={`Ít nhất ${TOI_THIEU} ký tự.`}><OInput id="mk-moi" type="password" autoComplete="new-password" value={moi} onChange={(e) => setMoi(e.target.value)} /></Truong>
      <Truong nhan="Nhập lại mật khẩu mới" htmlFor="mk-lai"><OInput id="mk-lai" type="password" autoComplete="new-password" value={lai} onChange={(e) => setLai(e.target.value)} /></Truong>
      <Loi noiDung={loi} />
      <div className={onHuy ? "grid grid-cols-2 gap-2" : ""}>
        {onHuy && <Nut kieu="vien" onClick={onHuy} disabled={dang}>Hủy</Nut>}
        <Nut type="submit" disabled={dang}>{dang ? "Đang lưu" : "Đổi"}</Nut>
      </div>
    </form>
  );
}

/** Chặn toàn màn hình khi đang dùng mật khẩu tạm. */
export function ManBatBuocDoiMatKhau({ onXong }: { onXong: () => void }) {
  return (
    <main className="min-h-screen bg-nen px-4 pt-[12vh]">
      <div className="mx-auto w-full max-w-[400px] space-y-3 rounded-the bg-trang border border-vien shadow-the p-5">
        <span className="size-10 rounded-xl bg-xanh text-white grid place-items-center"><KeyRound size={20} strokeWidth={2.5} /></span>
        <h1 className="text-[20px] font-extrabold text-muc">Đặt mật khẩu của bạn</h1>
        <p className="text-[13px] text-chu-phu">Mật khẩu hiện tại là mật khẩu tạm do quản trị viên cấp. Hãy đặt mật khẩu riêng để tiếp tục.</p>
        <FormDoiMatKhau onXong={onXong} />
      </div>
    </main>
  );
}

/** Hai nút nhỏ ở đầu trang: Đổi mật khẩu, Đăng xuất. */
export function NutTaiKhoan() {
  const [mo, setMo] = useState(false);
  const [xong, setXong] = useState(false);
  const thoat = async () => {
    try { await dangXuat(); } finally { window.location.reload(); }
  };
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => { setXong(false); setMo(true); }} className="min-h-11 min-w-11 justify-center px-2.5 rounded-lg border border-vien text-[12px] font-bold text-chu inline-flex items-center gap-1" aria-label="Đổi mật khẩu"><KeyRound size={14} /><span className="hidden sm:inline md:hidden lg:inline">Đổi mật khẩu</span></button>
      <button type="button" onClick={() => void thoat()} className="min-h-11 min-w-11 justify-center px-2.5 rounded-lg border border-vien text-[12px] font-bold text-chu inline-flex items-center gap-1" aria-label="Đăng xuất"><LogOut size={14} /><span className="hidden sm:inline md:hidden lg:inline">Đăng xuất</span></button>
      <HopTruot mo={mo} dong={() => setMo(false)} tieuDe="Đổi mật khẩu">
        {xong ? (
          <div className="space-y-3">
            <p className="text-[14px] text-chu">Đã đổi mật khẩu.</p>
            <Nut onClick={() => setMo(false)}>Xong</Nut>
          </div>
        ) : <FormDoiMatKhau onXong={() => setXong(true)} onHuy={() => setMo(false)} />}
      </HopTruot>
    </div>
  );
}
