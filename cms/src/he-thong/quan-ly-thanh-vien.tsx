import { useMemo, useState, type FormEvent } from "react";
import { KeyRound, Search, Trash2, UserPlus, Users } from "lucide-react";
import { LoiApi, datLaiMatKhau, datPhanCong, doiVaiNguoi, layNguoi, layPhanCong, themNguoi, thongBaoLoi, xoaNguoi, type NguoiCms, type VaiTro } from "@cms/may-chu/api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { HopTruot, KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OChon, OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, Nut, The, gop } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { duocQuanLy } from "@/data/quyen-nguoi";
import { khongDau } from "@cms/du-lieu-truong/loc-truong";

const NHAN_VAI: Record<VaiTro, string> = { sa: "Siêu quản trị", qtv: "Quản trị viên", ctv: "Cộng tác viên" };
const MO_TA_VAI: Record<VaiTro, string> = {
  sa: "Siêu quản trị (mọi quyền, quản lý quản trị viên)",
  qtv: "Quản trị viên (duyệt, xuất bản, quản lý cộng tác viên)",
  ctv: "Cộng tác viên (điền dữ liệu trường được giao)",
};
const THU_TU: VaiTro[] = ["sa", "qtv", "ctv"];
const TONE_VAI = { sa: "xanh", qtv: "xanh", ctv: "luc" } as const;

function HopGiaoTruong({ nguoi, dong, onXong }: { nguoi: NguoiCms; dong: () => void; onXong: (m: string) => void }) {
  const ds = useTai(() => layDanhSachTenTruong());
  const hien = useTai(() => layPhanCong(nguoi.email));
  const [chon, setChon] = useState<Set<string> | null>(null);
  const [tim, setTim] = useState("");
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const dangChon = chon ?? new Set((hien.du ?? []).map((p) => p.maTruong));
  const hienThi = useMemo(() => {
    const q = khongDau(tim);
    return (ds.du ?? []).filter((t) => !q || khongDau(t.ten ?? "").includes(q) || t.maTruong.toLowerCase().includes(q));
  }, [ds.du, tim]);
  const bat = (ma: string) => { const m = new Set(dangChon); if (m.has(ma)) m.delete(ma); else m.add(ma); setChon(m); };

  const luu = async () => {
    setDang(true); setLoi(null);
    try { await datPhanCong(nguoi.email, [...dangChon]); onXong(`Đã giao ${dangChon.size} trường cho ${nguoi.email}.`); }
    catch (e) { setLoi(thongBaoLoi(e)); }
    finally { setDang(false); }
  };

  return (
    <HopTruot mo dong={dong} tieuDe="Giao trường">
      <div className="space-y-3">
        <p className="text-[13px] text-chu-phu">Cộng tác viên chỉ điền được các trường được giao. Đang giao cho <b className="text-chu">{nguoi.email}</b>.</p>
        {(ds.dangTai && !ds.du) || (hien.dangTai && !hien.du) ? <KhungDangTai cao="h-12" soKhung={3} /> : ds.loi || hien.loi ? (
          <KhungLoi moTa={(ds.loi ?? hien.loi)!} thuLai={() => { ds.taiLai(); hien.taiLai(); }} />
        ) : (
          <>
            <OInput bieuTuong={Search} type="search" placeholder="Tìm mã hoặc tên trường" aria-label="Tìm trường" value={tim} onChange={(e) => setTim(e.target.value)} />
            <p className="text-[13px] text-chu-phu">Đã chọn {dangChon.size} trường</p>
            <ul className="max-h-[40dvh] overflow-y-auto divide-y divide-vien rounded-xl border border-vien">
              {hienThi.map((t) => (
                <li key={t.maTruong}>
                  <label className="flex items-center gap-3 min-h-12 px-3 cursor-pointer">
                    <input type="checkbox" className="size-5 accent-xanh" checked={dangChon.has(t.maTruong)} onChange={() => bat(t.maTruong)} />
                    <span className="text-[14px] text-chu min-w-0"><b>{t.maTruong}</b> · {t.ten}</span>
                  </label>
                </li>
              ))}
              {hienThi.length === 0 && <li className="p-3 text-[13px] text-chu-phu">Không có trường nào khớp.</li>}
            </ul>
          </>
        )}
        {loi && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loi}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={dong} disabled={dang}>Hủy</Nut>
          <Nut onClick={() => void luu()} disabled={dang || hien.dangTai || Boolean(hien.loi)}>{dang ? "Đang lưu" : "Lưu"}</Nut>
        </div>
      </div>
    </HopTruot>
  );
}

export default function QuanLyThanhVien() {
  const { toi } = usePhien();
  const [loc, setLoc] = useState<VaiTro | "">("");
  const ds = useTai(() => layNguoi());
  const [email, setEmail] = useState("");
  const [vai, setVai] = useState<VaiTro>("ctv");
  const [loiThem, setLoiThem] = useState<string | null>(null);
  const [dangThem, setDangThem] = useState(false);
  const [mkTam, setMkTam] = useState<{ email: string; matKhau: string; daSaoChep: boolean } | null>(null);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [giao, setGiao] = useState<NguoiCms | null>(null);
  const [xoa, setXoa] = useState<NguoiCms | null>(null);
  const [dangXoa, setDangXoa] = useState(false);
  const [dangDoi, setDangDoi] = useState<string | null>(null);

  // Giao diện chỉ ẩn nút cho gọn; máy chủ mới là nơi ép quyền.
  const vaiThem = THU_TU.filter((v) => duocQuanLy(toi.vaiTro, v, "them"));
  const vaiChon: VaiTro = vaiThem.includes(vai) ? vai : vaiThem[vaiThem.length - 1] ?? "ctv";
  const vaiDoi = THU_TU.filter((v) => duocQuanLy(toi.vaiTro, v, "doi-vai"));
  const hienThi = (ds.du ?? []).filter((n) => !loc || n.vaiTro === loc);

  const them = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) { setLoiThem("Email chưa đúng. Ví dụ: ten@gmail.com"); return; }
    setDangThem(true); setLoiThem(null);
    try {
      const moi = await themNguoi(em, vaiChon);
      setMkTam({ email: moi.email, matKhau: moi.matKhauTam, daSaoChep: false });
      setBanTin({ tone: "luc", noiDung: `Đã thêm ${em.toLowerCase()} với vai trò ${NHAN_VAI[vaiChon].toLowerCase()}.${vaiChon === "ctv" ? " Hãy giao trường cho người này." : ""}` });
      setEmail("");
      ds.taiLai();
    } catch (err) {
      setLoiThem(err instanceof LoiApi && err.chiTiet?.email ? err.chiTiet.email : thongBaoLoi(err));
    } finally { setDangThem(false); }
  };

  const datLai = async (n: NguoiCms) => {
    if (!window.confirm(`Đặt lại mật khẩu của ${n.email}? Mật khẩu cũ và các phiên đang đăng nhập sẽ hết hiệu lực.`)) return;
    try {
      const r = await datLaiMatKhau(n.email);
      setMkTam({ email: r.email, matKhau: r.matKhauTam, daSaoChep: false });
    } catch (err) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(err) });
    }
  };

  const saoChep = async () => {
    if (!mkTam) return;
    try { await navigator.clipboard.writeText(mkTam.matKhau); setMkTam({ ...mkTam, daSaoChep: true }); } catch { /* người dùng tự chép */ }
  };

  const doiVai = async (n: NguoiCms, moi: VaiTro) => {
    if (moi === n.vaiTro) return;
    setDangDoi(n.email);
    try {
      await doiVaiNguoi(n.email, moi);
      setBanTin({ tone: "luc", noiDung: `Đã đổi ${n.email} thành ${NHAN_VAI[moi].toLowerCase()}.` });
      ds.taiLai();
    } catch (err) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(err) });
    } finally { setDangDoi(null); }
  };

  const xacNhanXoa = async () => {
    if (!xoa) return;
    setDangXoa(true);
    try {
      await xoaNguoi(xoa.email);
      setBanTin({ tone: "luc", noiDung: `Đã xóa ${xoa.email}. Người này không vào được trang quản trị nữa.` });
      setXoa(null);
      ds.taiLai();
    } catch (err) {
      setBanTin({ tone: "do", noiDung: thongBaoLoi(err) });
      setXoa(null);
    } finally { setDangXoa(false); }
  };

  return (
    <div className="space-y-3">
      {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

      <form onSubmit={(e) => void them(e)} className="space-y-3 rounded-the bg-trang border border-vien shadow-the p-4" noValidate>
        <h2 className="font-extrabold text-[16px] text-muc">Thêm thành viên</h2>
        <p className="text-[13px] text-chu-phu">Thêm email và vai trò, hệ thống cấp một mật khẩu tạm hiển thị một lần. Người đó đổi mật khẩu ở lần đăng nhập đầu.</p>
        <Truong nhan="Email đăng nhập" batBuoc htmlFor="tv-email" loi={loiThem ?? undefined} goiY="Dùng đúng email người này sẽ đăng nhập.">
          <OInput id="tv-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@gmail.com" />
        </Truong>
        <Truong nhan="Vai trò" htmlFor="tv-vai">
          <OChon id="tv-vai" value={vaiChon} onChange={(e) => setVai(e.target.value as VaiTro)}>
            {vaiThem.map((v) => <option key={v} value={v}>{MO_TA_VAI[v]}</option>)}
          </OChon>
        </Truong>
        <Nut type="submit" bieuTuong={UserPlus} disabled={dangThem || vaiThem.length === 0}>{dangThem ? "Đang thêm" : "Thêm"}</Nut>
      </form>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-extrabold text-muc">Danh sách thành viên</h2>
        <div className="w-[48%]">
          <OChon aria-label="Lọc theo vai trò" value={loc} onChange={(e) => setLoc(e.target.value as VaiTro | "")}>
            <option value="">Tất cả vai trò</option>
            {THU_TU.map((v) => <option key={v} value={v}>{NHAN_VAI[v]}</option>)}
          </OChon>
        </div>
      </div>
      {ds.dangTai && !ds.du ? <KhungDangTai soKhung={3} cao="h-20" /> : ds.loi ? <KhungLoi moTa={ds.loi} thuLai={ds.taiLai} /> : hienThi.length === 0 ? (
        <TrangThaiTrong bieuTuong={<Users size={26} />} tieuDe={loc ? "Không có ai ở vai trò này" : "Chưa có thành viên nào"} moTa={loc ? "Chọn vai trò khác để xem." : "Thêm email đầu tiên ở khung phía trên."} />
      ) : hienThi.map((n) => {
        const laToi = n.email === toi.email;
        const doiDuoc = !laToi && duocQuanLy(toi.vaiTro, n.vaiTro, "doi-vai");
        const xoaDuoc = !laToi && duocQuanLy(toi.vaiTro, n.vaiTro, "xoa");
        const datLaiDuoc = !laToi && duocQuanLy(toi.vaiTro, n.vaiTro, "dat-lai-mat-khau");
        return (
          <The key={n.email} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-[15px] text-muc break-all min-w-0">{n.email}{laToi && <span className="font-normal text-chu-phu"> (bạn)</span>}</p>
              <Nhan tone={TONE_VAI[n.vaiTro]}>{NHAN_VAI[n.vaiTro]}</Nhan>
            </div>
            <p className="text-[13px] text-chu-phu">{n.vaiTro === "ctv" ? (n.soTruong ? `Đang được giao ${n.soTruong} trường` : "Chưa được giao trường nào") : "Sửa được mọi trường"}</p>
            {(n.vaiTro === "ctv" || doiDuoc || xoaDuoc || datLaiDuoc) && (
              <div className="grid grid-cols-5 gap-2">
                {n.vaiTro === "ctv" && (
                  <button type="button" onClick={() => setGiao(n)} className="col-span-5 min-h-12 rounded-xl border border-xanh/40 text-xanh font-bold text-[14px]">Giao trường</button>
                )}
                {datLaiDuoc && (
                  <button type="button" onClick={() => void datLai(n)} className="col-span-5 min-h-12 rounded-xl border border-vien text-chu font-bold text-[14px] inline-flex items-center justify-center gap-1.5"><KeyRound size={15} /> Đặt lại mật khẩu</button>
                )}
                {doiDuoc && (
                  <div className={xoaDuoc ? "col-span-3" : "col-span-5"}>
                    <OChon aria-label={`Đổi vai trò của ${n.email}`} value={n.vaiTro} disabled={dangDoi === n.email} onChange={(e) => void doiVai(n, e.target.value as VaiTro)}>
                      {vaiDoi.map((v) => <option key={v} value={v}>{NHAN_VAI[v]}</option>)}
                    </OChon>
                  </div>
                )}
                {xoaDuoc && (
                  <button type="button" onClick={() => setXoa(n)} className={gop("min-h-12 rounded-xl border border-do/40 text-do-chu font-bold text-[14px] inline-flex items-center justify-center gap-1.5", doiDuoc ? "col-span-2" : "col-span-5")}><Trash2 size={15} /> Xóa</button>
                )}
              </div>
            )}
          </The>
        );
      })}

      <HopTruot mo={Boolean(mkTam)} dong={() => setMkTam(null)} tieuDe="Mật khẩu tạm">
        <div className="space-y-3">
          <p className="text-[14px] text-chu">Mật khẩu tạm của <b className="break-all">{mkTam?.email}</b>:</p>
          <p className="rounded-xl bg-nen border border-vien p-3 text-center font-mono text-[18px] tracking-wider select-all break-all">{mkTam?.matKhau}</p>
          <p className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">Chỉ hiện một lần. Gửi riêng cho người đó, không đăng vào nhóm chung. Họ sẽ phải đổi mật khẩu khi đăng nhập.</p>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => void saoChep()}>{mkTam?.daSaoChep ? "Đã chép" : "Sao chép"}</Nut>
            <Nut onClick={() => setMkTam(null)}>Xong</Nut>
          </div>
        </div>
      </HopTruot>
      {giao && <HopGiaoTruong nguoi={giao} dong={() => setGiao(null)} onXong={(m) => { setGiao(null); setBanTin({ tone: "luc", noiDung: m }); ds.taiLai(); }} />}
      <HopTruot mo={Boolean(xoa)} dong={() => setXoa(null)} tieuDe="Xóa thành viên">
        <div className="space-y-3">
          <p className="text-[14px] text-chu">Xóa <b className="break-all">{xoa?.email}</b> ({xoa ? NHAN_VAI[xoa.vaiTro].toLowerCase() : ""})? Người này sẽ không vào được trang quản trị, và các trường đã giao cũng bị gỡ. Bản ghi họ đã tạo vẫn còn.</p>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => setXoa(null)} disabled={dangXoa}>Hủy</Nut>
            <Nut kieu="nguyHiem" onClick={() => void xacNhanXoa()} disabled={dangXoa}>{dangXoa ? "Đang xóa" : "Xóa"}</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}
