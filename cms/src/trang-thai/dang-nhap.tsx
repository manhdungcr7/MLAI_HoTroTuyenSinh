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

type CheDoDangNhap = "dangNhap" | "quenMatKhau" | "datLaiMatKhau";

async function goiQuenMatKhau(than: Record<string, unknown>): Promise<{ ok: boolean; thongBao: string }> {
  let res: Response;
  try {
    res = await fetch("/api/quen-mat-khau", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(than),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Bạn kiểm tra mạng rồi thử lại.");
  }
  let duLieu: { ok?: boolean; thongBao?: string; loi?: string } = {};
  try { duLieu = (await res.json()) as typeof duLieu; } catch { /* bỏ qua */ }
  if (!res.ok) {
    throw new Error(duLieu.loi || duLieu.thongBao || "Có lỗi xảy ra, bạn thử lại nhé.");
  }
  return { ok: Boolean(duLieu.ok), thongBao: duLieu.thongBao ?? "Đã xử lý yêu cầu." };
}

function layTokenTuUrl(): string {
  if (typeof window === "undefined") return "";
  const tuSearch = new URLSearchParams(window.location.search).get("reset_token");
  if (tuSearch) return tuSearch.trim();
  const hash = window.location.hash;
  const idx = hash.indexOf("?");
  if (idx >= 0) {
    const tuHash = new URLSearchParams(hash.slice(idx + 1)).get("reset_token");
    if (tuHash) return tuHash.trim();
  }
  return "";
}

function ThanhCong({ noiDung }: { noiDung: string | null }) {
  return noiDung ? <p role="status" className="rounded-xl bg-luc-nhat p-3 text-[13px] font-semibold text-luc-chu">{noiDung}</p> : null;
}

/** Hiện khi chưa đăng nhập hoặc phiên hết hạn. */
export function ManDangNhap({ onXong }: { onXong: () => void }) {
  const tokenBanDau = layTokenTuUrl();
  const [cheDo, setCheDo] = useState<CheDoDangNhap>(tokenBanDau ? "datLaiMatKhau" : "dangNhap");
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [token, setToken] = useState(tokenBanDau);
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [nhapLaiMoi, setNhapLaiMoi] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);

  const chuyenCheDo = (moi: CheDoDangNhap) => {
    setCheDo(moi);
    setLoi(null);
    setThongBao(null);
  };

  const guiDangNhap = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !matKhau) { setLoi("Bạn nhập email và mật khẩu nhé."); return; }
    setDang(true); setLoi(null); setThongBao(null);
    try { await dangNhap(email.trim(), matKhau); onXong(); }
    catch (err) { setLoi(thongBaoLoi(err)); setDang(false); }
  };

  const guiYeuCau = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setLoi("Bạn nhập email tài khoản quản trị nhé."); return; }
    setDang(true); setLoi(null); setThongBao(null);
    try {
      const kq = await goiQuenMatKhau({ hanhDong: "yeu_cau", email: email.trim() });
      setThongBao(kq.thongBao);
    } catch (err) {
      setLoi(err instanceof Error ? err.message : thongBaoLoi(err));
    } finally {
      setDang(false);
    }
  };

  const guiDatLai = async (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim()) { setLoi("Bạn nhập mã khôi phục nhé."); return; }
    if (matKhauMoi.length < TOI_THIEU) { setLoi(`Mật khẩu mới cần ít nhất ${TOI_THIEU} ký tự.`); return; }
    if (matKhauMoi !== nhapLaiMoi) { setLoi("Hai ô mật khẩu mới chưa giống nhau."); return; }
    setDang(true); setLoi(null); setThongBao(null);
    try {
      const kq = await goiQuenMatKhau({ hanhDong: "dat_lai", token: token.trim(), matKhauMoi });
      setMatKhau("");
      setMatKhauMoi("");
      setNhapLaiMoi("");
      setToken("");
      if (typeof window !== "undefined" && window.location.search.includes("reset_token")) {
        window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      }
      setCheDo("dangNhap");
      setThongBao(kq.thongBao);
    } catch (err) {
      setLoi(err instanceof Error ? err.message : thongBaoLoi(err));
    } finally {
      setDang(false);
    }
  };

  return (
    <main className="min-h-screen bg-nen px-4 pt-[10vh] pb-8">
      <div className="mx-auto w-full max-w-[400px] space-y-3 rounded-the bg-trang border border-vien shadow-the p-5">
        <span className="size-10 rounded-xl bg-xanh text-white grid place-items-center"><ShieldCheck size={20} strokeWidth={2.5} /></span>
        <h1 className="text-[20px] font-extrabold text-muc">
          {cheDo === "dangNhap" ? "Đăng nhập quản trị" : cheDo === "quenMatKhau" ? "Khôi phục mật khẩu" : "Đặt lại mật khẩu mới"}
        </h1>

        <div role="tablist" aria-label="Chế độ tài khoản" className="grid grid-cols-3 gap-1 rounded-xl border border-vien bg-nen p-1">
          <button
            type="button"
            role="tab"
            aria-selected={cheDo === "dangNhap"}
            onClick={() => chuyenCheDo("dangNhap")}
            className={`min-h-11 rounded-lg px-2 text-[13px] font-bold transition-colors ${cheDo === "dangNhap" ? "bg-xanh text-white" : "text-chu-phu"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cheDo === "quenMatKhau"}
            onClick={() => chuyenCheDo("quenMatKhau")}
            className={`min-h-11 rounded-lg px-2 text-[13px] font-bold transition-colors ${cheDo === "quenMatKhau" ? "bg-xanh text-white" : "text-chu-phu"}`}
          >
            Quên mật khẩu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cheDo === "datLaiMatKhau"}
            onClick={() => chuyenCheDo("datLaiMatKhau")}
            className={`min-h-11 rounded-lg px-2 text-[13px] font-bold transition-colors ${cheDo === "datLaiMatKhau" ? "bg-xanh text-white" : "text-chu-phu"}`}
          >
            Nhập mã
          </button>
        </div>

        {cheDo === "dangNhap" && (
          <form onSubmit={(e) => void guiDangNhap(e)} noValidate className="space-y-3">
            <Truong nhan="Email" htmlFor="dn-email">
              <OInput id="dn-email" type="email" inputMode="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </Truong>
            <Truong nhan="Mật khẩu" htmlFor="dn-mk">
              <OInput id="dn-mk" type="password" autoComplete="current-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} />
            </Truong>
            <Loi noiDung={loi} />
            <ThanhCong noiDung={thongBao} />
            <Nut type="submit" disabled={dang}>{dang ? "Đang vào" : "Đăng nhập"}</Nut>
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => chuyenCheDo("quenMatKhau")} className="min-h-11 px-1 text-[13px] font-bold text-xanh">
                Quên mật khẩu?
              </button>
              <button type="button" onClick={() => chuyenCheDo("datLaiMatKhau")} className="min-h-11 px-1 text-[13px] font-semibold text-chu-phu">
                Đã có mã khôi phục
              </button>
            </div>
          </form>
        )}

        {cheDo === "quenMatKhau" && (
          <form onSubmit={(e) => void guiYeuCau(e)} noValidate className="space-y-3">
            <p className="text-[13px] text-chu-phu">
              Nhập email tài khoản quản trị để nhận mã khôi phục mật khẩu (hiệu lực 15 phút).
            </p>
            <Truong nhan="Email tài khoản" htmlFor="qmk-email">
              <OInput id="qmk-email" type="email" inputMode="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </Truong>
            <Loi noiDung={loi} />
            <ThanhCong noiDung={thongBao} />
            <Nut type="submit" disabled={dang}>{dang ? "Đang gửi" : "Gửi mã khôi phục"}</Nut>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Nut kieu="vien" onClick={() => chuyenCheDo("dangNhap")} disabled={dang}>Quay lại</Nut>
              <Nut kieu="nhe" onClick={() => chuyenCheDo("datLaiMatKhau")} disabled={dang}>Nhập mã</Nut>
            </div>
          </form>
        )}

        {cheDo === "datLaiMatKhau" && (
          <form onSubmit={(e) => void guiDatLai(e)} noValidate className="space-y-3">
            <p className="text-[13px] text-chu-phu">
              Dán mã khôi phục bạn nhận được và đặt mật khẩu mới (ít nhất {TOI_THIEU} ký tự).
            </p>
            <Truong nhan="Mã khôi phục" htmlFor="dl-token">
              <OInput id="dl-token" type="text" autoComplete="one-time-code" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Nhập mã khôi phục..." />
            </Truong>
            <Truong nhan="Mật khẩu mới" htmlFor="dl-mk-moi" goiY={`Ít nhất ${TOI_THIEU} ký tự.`}>
              <OInput id="dl-mk-moi" type="password" autoComplete="new-password" value={matKhauMoi} onChange={(e) => setMatKhauMoi(e.target.value)} />
            </Truong>
            <Truong nhan="Nhập lại mật khẩu mới" htmlFor="dl-mk-lai">
              <OInput id="dl-mk-lai" type="password" autoComplete="new-password" value={nhapLaiMoi} onChange={(e) => setNhapLaiMoi(e.target.value)} />
            </Truong>
            <Loi noiDung={loi} />
            <ThanhCong noiDung={thongBao} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Nut kieu="vien" onClick={() => chuyenCheDo("dangNhap")} disabled={dang}>Hủy</Nut>
              <Nut type="submit" disabled={dang}>{dang ? "Đang lưu" : "Đặt lại"}</Nut>
            </div>
          </form>
        )}
      </div>
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
