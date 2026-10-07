// Thành viên được vào CMS: thêm, xóa, và giao trường cho cộng tác viên. Mọi thay đổi chỉ báo thành công sau khi máy chủ xác nhận.
import { useMemo, useState } from "react";
import { Search, Trash2, UserPlus, Users } from "lucide-react";
import { LoiApi, datPhanCong, layNguoi, layPhanCong, themNguoi, thongBaoLoi, xoaNguoi, type NguoiCms, type VaiTro } from "@cms/may-chu/api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { HopTruot, KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { OChon, OInput, Truong } from "@cms/thanh-phan/ui/nhap-lieu";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { khongDau } from "@cms/du-lieu-truong/loc-truong";

const NHAN_VAI: Record<VaiTro, string> = { qtv: "Quản trị viên", ctv: "Cộng tác viên" };

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
  const ds = useTai(() => layNguoi());
  const [email, setEmail] = useState("");
  const [vai, setVai] = useState<VaiTro>("ctv");
  const [loiThem, setLoiThem] = useState<string | null>(null);
  const [dangThem, setDangThem] = useState(false);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [giao, setGiao] = useState<NguoiCms | null>(null);
  const [xoa, setXoa] = useState<NguoiCms | null>(null);
  const [dangXoa, setDangXoa] = useState(false);

  const them = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) { setLoiThem("Email chưa đúng. Ví dụ: ten@gmail.com"); return; }
    setDangThem(true); setLoiThem(null);
    try {
      await themNguoi(em, vai);
      setBanTin({ tone: "luc", noiDung: `Đã thêm ${em.toLowerCase()} với vai trò ${NHAN_VAI[vai].toLowerCase()}. Hãy giao trường cho người này nếu là cộng tác viên.` });
      setEmail("");
      ds.taiLai();
    } catch (err) {
      setLoiThem(err instanceof LoiApi && err.chiTiet?.email ? err.chiTiet.email : thongBaoLoi(err));
    } finally { setDangThem(false); }
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
        <Truong nhan="Email đăng nhập" batBuoc htmlFor="tv-email" loi={loiThem ?? undefined} goiY="Dùng đúng email người này sẽ đăng nhập.">
          <OInput id="tv-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@gmail.com" />
        </Truong>
        <Truong nhan="Vai trò" htmlFor="tv-vai">
          <OChon id="tv-vai" value={vai} onChange={(e) => setVai(e.target.value as VaiTro)}>
            <option value="ctv">Cộng tác viên (điền dữ liệu trường được giao)</option>
            <option value="qtv">Quản trị viên (duyệt, xuất bản, quản lý)</option>
          </OChon>
        </Truong>
        <Nut type="submit" bieuTuong={UserPlus} disabled={dangThem}>{dangThem ? "Đang thêm" : "Thêm"}</Nut>
      </form>

      <h2 className="text-[16px] font-extrabold text-muc">Danh sách thành viên</h2>
      {ds.dangTai && !ds.du ? <KhungDangTai soKhung={3} cao="h-20" /> : ds.loi ? <KhungLoi moTa={ds.loi} thuLai={ds.taiLai} /> : (ds.du?.length ?? 0) === 0 ? (
        <TrangThaiTrong bieuTuong={<Users size={26} />} tieuDe="Chưa có thành viên nào" moTa="Thêm email đầu tiên ở khung phía trên." />
      ) : ds.du!.map((n) => (
        <The key={n.email} className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-[15px] text-muc break-all min-w-0">{n.email}</p>
            <Nhan tone={n.vaiTro === "qtv" ? "xanh" : "luc"}>{NHAN_VAI[n.vaiTro]}</Nhan>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {n.vaiTro === "ctv" ? (
              <button type="button" onClick={() => setGiao(n)} className="min-h-11 rounded-xl border border-xanh/40 text-xanh font-bold text-[14px]">Giao trường</button>
            ) : <span className="min-h-11 grid place-items-center text-[13px] text-chu-phu">Sửa được mọi trường</span>}
            {n.email === toi.email ? <span className="min-h-11 grid place-items-center text-[13px] text-chu-phu">Đây là bạn</span> : (
              <button type="button" onClick={() => setXoa(n)} className="min-h-11 rounded-xl border border-do/40 text-do-chu font-bold text-[14px] inline-flex items-center justify-center gap-1.5"><Trash2 size={15} /> Xóa</button>
            )}
          </div>
        </The>
      ))}

      {giao && <HopGiaoTruong nguoi={giao} dong={() => setGiao(null)} onXong={(m) => { setGiao(null); setBanTin({ tone: "luc", noiDung: m }); }} />}
      <HopTruot mo={Boolean(xoa)} dong={() => setXoa(null)} tieuDe="Xóa thành viên">
        <div className="space-y-3">
          <p className="text-[14px] text-chu">Xóa <b className="break-all">{xoa?.email}</b>? Người này sẽ không vào được trang quản trị, và các trường đã giao cũng bị gỡ. Bản ghi họ đã tạo vẫn còn.</p>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => setXoa(null)} disabled={dangXoa}>Hủy</Nut>
            <Nut kieu="nguyHiem" onClick={() => void xacNhanXoa()} disabled={dangXoa}>{dangXoa ? "Đang xóa" : "Xóa"}</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}
