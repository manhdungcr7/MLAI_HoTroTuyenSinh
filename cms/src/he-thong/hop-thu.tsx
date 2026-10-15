// Hộp thư: báo sai từ học sinh (quản trị viên và cộng tác viên của trường đó xử lý) và đăng ký tình nguyện viên (chỉ quản trị viên).
// Báo sai không tự sửa số liệu: người của trường mở trang trường, kiểm tra nguồn, sửa qua quy trình duyệt, rồi đánh dấu đã xử lý.
import { useState } from "react";
import { ExternalLink, Inbox, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { DUONG_DAN } from "@cms/duong-dan";
import { thongBaoLoi } from "@cms/may-chu/api";
import { capQuyenTinhNguyen, doiBaoSai, doiTinhNguyen, layBaoSai, layDangKySom, layTinhNguyen, type BaoSai, type DangKyTinhNguyen } from "@cms/may-chu/hop-thu-api";
import { HopTruot } from "@/components/ui/hien-thi";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, Nut, The, gop } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc } from "@cms/du-lieu-truong/dinh-dang";

const TEN_VAI: Record<string, string> = { sinh_vien: "Sinh viên", giao_vien: "Thầy cô", can_bo_tuyen_sinh: "Cán bộ tuyển sinh", khac: "Khác" };

function MucBaoSai({ b, xong }: { b: BaoSai; xong: (m: string, loi?: boolean) => void }) {
  const [dang, setDang] = useState(false);
  const doi = async (tt: "xong" | "boQua") => {
    setDang(true);
    try { await doiBaoSai(b.id, tt); xong(tt === "xong" ? "Đã đánh dấu đã xử lý." : "Đã bỏ qua báo cáo này."); }
    catch (e) { xong(thongBaoLoi(e), true); } finally { setDang(false); }
  };
  return (
    <The className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-muc leading-snug">{b.truongDuLieu} · {b.maTruong}</p>
          <p className="text-[12px] text-chu-phu">Chương trình {b.maChuongTrinh} · {dinhDangLuc(b.luc)}</p>
        </div>
        <Nhan tone={b.trangThai === "moi" ? "cam" : b.trangThai === "xong" ? "luc" : "muc"}>{b.trangThai === "moi" ? "Mới" : b.trangThai === "xong" ? "Đã xử lý" : "Bỏ qua"}</Nhan>
      </div>
      <p className="rounded-xl bg-nen p-2.5 text-[13.5px] text-chu whitespace-pre-line">{b.noiDung}</p>
      {b.link && <a href={b.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 min-h-11 text-[13px] text-xanh font-semibold min-w-0"><span className="shrink-0">Nguồn người báo gửi:</span><span className="truncate">{b.link}</span><ExternalLink size={12} className="shrink-0" /></a>}
      <div className="grid grid-cols-3 gap-2">
        <Link to={DUONG_DAN.chiTietTruong(b.maTruong)} className="min-h-11 rounded-xl border border-xanh/40 text-xanh font-bold text-[13px] grid place-items-center">Mở trường</Link>
        {b.trangThai === "moi" ? (
          <>
            <button type="button" disabled={dang} onClick={() => void doi("boQua")} className="min-h-11 rounded-xl border border-vien text-chu-phu font-bold text-[13px] disabled:opacity-50">Bỏ qua</button>
            <button type="button" disabled={dang} onClick={() => void doi("xong")} className="min-h-11 rounded-xl bg-xanh text-white font-bold text-[13px] disabled:opacity-50">Đã xử lý</button>
          </>
        ) : <span className="col-span-2" />}
      </div>
    </The>
  );
}

function MucTinhNguyen({ d, xong }: { d: DangKyTinhNguyen; xong: (m: string, loi?: boolean) => void }) {
  const [dang, setDang] = useState(false);
  const [taiKhoan, setTaiKhoan] = useState<{ email: string; matKhauTam?: string } | null>(null);
  const coEmail = d.lienHe.includes("@");
  const capQuyen = async () => {
    setDang(true);
    try { const r = await capQuyenTinhNguyen(d.id); setTaiKhoan(r); }
    catch (e) { xong(thongBaoLoi(e), true); } finally { setDang(false); }
  };
  const doi = async (tt: "da_lien_he" | "tu_choi") => {
    setDang(true);
    try { await doiTinhNguyen(d.id, tt); xong(tt === "da_lien_he" ? "Đã đánh dấu đã liên hệ." : "Đã từ chối đăng ký."); }
    catch (e) { xong(thongBaoLoi(e), true); } finally { setDang(false); }
  };
  const tt = { moi: ["cam", "Mới"], da_lien_he: ["xanh", "Đã liên hệ"], da_cap_quyen: ["luc", "Đã cấp quyền"], tu_choi: ["muc", "Từ chối"] }[d.trangThai] as ["cam" | "xanh" | "luc" | "muc", string];
  return (
    <The className="space-y-2">
      <HopTruot mo={taiKhoan !== null} dong={() => { setTaiKhoan(null); xong("Đã cấp quyền và giao trường."); }} tieuDe="Tài khoản cộng tác viên">
        <p className="text-[14px] text-chu break-all">Email: <b>{taiKhoan?.email}</b></p>
        {taiKhoan?.matKhauTam ? <><p className="my-3 text-[14px] text-chu">Mật khẩu tạm: <code className="select-all">{taiKhoan.matKhauTam}</code></p><p className="text-[13px] text-chu-phu mb-3">Chỉ hiện một lần. Gửi riêng cho người đăng ký. Họ phải đổi mật khẩu khi đăng nhập.</p></> : <p className="my-3 text-[14px] text-chu">Tài khoản đã tồn tại. Người dùng tiếp tục dùng mật khẩu hiện tại.</p>}
        <Nut onClick={() => { setTaiKhoan(null); xong("Đã cấp quyền và giao trường."); }}>Đã ghi nhận</Nut>
      </HopTruot>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-muc leading-snug">{d.hoTen}</p>
          <p className="text-[12px] text-chu-phu">{TEN_VAI[d.vaiTro] ?? d.vaiTro} · trường {d.maTruong} · {dinhDangLuc(d.luc)}</p>
        </div>
        <Nhan tone={tt[0]}>{tt[1]}</Nhan>
      </div>
      <p className="text-[13.5px] text-chu break-all">Liên hệ: <b>{d.lienHe}</b></p>
      {d.ghiChu && <p className="rounded-xl bg-nen p-2.5 text-[13px] text-chu whitespace-pre-line">{d.ghiChu}</p>}
      {(d.trangThai === "moi" || d.trangThai === "da_lien_he") && (
        <div className="grid grid-cols-2 gap-2">
          {coEmail ? <Nut className="col-span-2" onClick={() => void capQuyen()} disabled={dang}>Cấp quyền cộng tác viên</Nut>
            : <p className="col-span-2 text-[12px] text-cam-chu">Người này để số điện thoại. Liên hệ xin email đăng nhập rồi thêm ở mục Thành viên.</p>}
          {d.trangThai === "moi" && <button type="button" disabled={dang} onClick={() => void doi("da_lien_he")} className="min-h-11 rounded-xl border border-xanh/40 text-xanh font-bold text-[13px] disabled:opacity-50">Đã liên hệ</button>}
          <button type="button" disabled={dang} onClick={() => void doi("tu_choi")} className="min-h-11 rounded-xl border border-do/40 text-do-chu font-bold text-[13px] disabled:opacity-50">Từ chối</button>
        </div>
      )}
    </The>
  );
}

export default function HopThu() {
  const { laQtv } = usePhien();
  const [muc, setMuc] = useState<"bao-sai" | "tinh-nguyen" | "truy-cap-som">("bao-sai");
  const [trang, setTrang] = useState(1);
  const [chiMoi, setChiMoi] = useState(true);
  const [tin, setTin] = useState<{ noiDung: string; loi: boolean } | null>(null);
  const bs = useTai(() => layBaoSai(chiMoi ? "moi" : undefined, trang), `bs-${chiMoi}-${trang}`);
  const tn = useTai(() => (laQtv ? layTinhNguyen(chiMoi ? "moi" : undefined, trang) : Promise.resolve({ dangKy: [], tong: 0 })), `tn-${chiMoi}-${laQtv}-${trang}`);
  const som = useTai(() => laQtv ? layDangKySom(trang) : Promise.resolve({ dangKySom: [], tong: 0 }), `som-${laQtv}-${trang}`);
  const xong = (noiDung: string, loi = false) => { setTin({ noiDung, loi }); bs.taiLai(); tn.taiLai(); };
  const dang = muc === "bao-sai" ? bs : muc === "tinh-nguyen" ? tn : som;

  return (
    <div className="space-y-3">
      {tin && <DongThongBao tone={tin.loi ? "do" : "luc"} tieuDe={tin.noiDung} onClick={() => setTin(null)} />}
      <div className="grid grid-cols-3 gap-2">
        {([["bao-sai", "Báo số liệu sai", bs.du?.tong], ["tinh-nguyen", "Đăng ký tình nguyện", laQtv ? tn.du?.tong : undefined], ["truy-cap-som", "Truy cập sớm", laQtv ? som.du?.tong : undefined]] as const).map(([id, nhan, n]) => (
          <button key={id} type="button" onClick={() => { setMuc(id); setTrang(1); }} disabled={id !== "bao-sai" && !laQtv}
            className={gop("min-h-12 rounded-xl border text-[13px] font-bold px-2 disabled:opacity-40", muc === id ? "border-xanh bg-xanh-nhat text-xanh" : "border-vien bg-trang text-chu-phu")}>{nhan}{n ? ` (${n})` : ""}</button>
        ))}
      </div>
      {muc !== "truy-cap-som" && <label className="flex items-center gap-2 min-h-11 text-[13px] text-chu"><input type="checkbox" className="size-5 accent-xanh" checked={chiMoi} onChange={(e) => { setChiMoi(e.target.checked); setTrang(1); }} />Chỉ hiện mục chưa xử lý</label>}
      {muc === "truy-cap-som" && som.du && <div className="space-y-2">{som.du.dangKySom.map(d => <The key={d.id}><b>{d.hoTen}</b><p className="text-[13px] text-chu-phu">Lớp {d.lop} · {dinhDangLuc(d.luc)}</p><p className="text-[14px] break-all">{d.lienHe}</p><p className="text-[13px] text-chu">Nhu cầu: {({ nganh: "Chọn ngành", truong: "Chọn trường", nguyen_vong: "Xếp nguyện vọng", ke_hoach: "Kế hoạch học" } as Record<string, string>)[d.nhuCau] ?? d.nhuCau}</p></The>)}{som.du.tong === 0 && <p className="text-[14px] text-chu-phu">Chưa có đăng ký truy cập sớm.</p>}</div>}
      {dang.dangTai && !dang.du ? <KhungDangTai soKhung={2} cao="h-28" /> : dang.loi ? <KhungLoi moTa={dang.loi} thuLai={dang.taiLai} /> : muc === "bao-sai" ? (
        bs.du && bs.du.baoSai.length > 0 ? <div className="space-y-2.5">{bs.du.baoSai.map((b) => <MucBaoSai key={b.id} b={b} xong={xong} />)}</div>
          : <TrangThaiTrong bieuTuong={<Inbox size={26} />} tieuDe="Không có báo sai nào" moTa={laQtv ? "Khi học sinh báo số liệu sai, báo cáo hiện ở đây." : "Chỉ hiện báo sai của các trường được giao cho bạn."} />
      ) : muc === "tinh-nguyen" ? (
        tn.du && tn.du.dangKy.length > 0 ? <div className="space-y-2.5">{tn.du.dangKy.map((d) => <MucTinhNguyen key={d.id} d={d} xong={xong} />)}</div>
          : <TrangThaiTrong bieuTuong={<UserCheck size={26} />} tieuDe="Chưa có đăng ký nào" moTa="Sinh viên, thầy cô, cán bộ tuyển sinh đăng ký ở trang Cùng cập nhật dữ liệu của app học sinh." />
      ) : null}
      {(dang.du?.tong ?? 0) > 50 && <div className="flex items-center justify-between gap-2"><Nut rong={false} kieu="vien" disabled={trang === 1} onClick={() => setTrang(t => t - 1)}>Trang trước</Nut><span className="text-[13px]">{trang} / {Math.ceil((dang.du?.tong ?? 0) / 50)}</span><Nut rong={false} kieu="vien" disabled={trang * 50 >= (dang.du?.tong ?? 0)} onClick={() => setTrang(t => t + 1)}>Trang sau</Nut></div>}
    </div>
  );
}
