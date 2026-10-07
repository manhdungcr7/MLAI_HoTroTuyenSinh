import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History, PackageCheck, RotateCcw, UploadCloud } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { LoiApi, thongBaoLoi } from "@cms/may-chu/api";
import { layHetBanGhi, type BanGhiCms } from "@cms/may-chu/ban-ghi-api";
import { dongBoLaiKv, layTrangThaiXuatBan, quayVePhienBan, xuatBanNgay } from "@cms/may-chu/xuat-ban-api";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { HopTruot, KhungDangTai, KhungLoi, TrangThaiTrong } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, Nut, The } from "@cms/thanh-phan/ui/nut-the";
import { DongThongBao } from "@cms/thanh-phan/ui/thong-bao";
import { dinhDangLuc } from "@cms/du-lieu-truong/dinh-dang";
import { maTruongCua } from "@cms/du-lieu-truong/mo-hinh";
import { nhanBan, tomTatBan } from "@cms/du-lieu-truong/tom-tat-ban";
import { SoSanhBan } from "@cms/phe-duyet/so-sanh-ban";

type Hop = { kieu: "xuat-ban" } | { kieu: "quay-ve"; phienBan: string } | null;
const RONG = { ds: [] as BanGhiCms[], daCatBot: false, tong: 0 };

export default function PublishCenter() {
  const { laQtv } = usePhien();
  const tt = useTai(() => (laQtv ? layTrangThaiXuatBan(1) : Promise.reject(new LoiApi(403, "Chỉ quản trị viên được xuất bản."))), laQtv ? "q" : "c");
  const cho = useTai(() => (laQtv ? layHetBanGhi({ status: "APPROVED" }) : Promise.resolve(RONG)), laQtv ? "q" : "c");
  const tenDs = useTai(() => layDanhSachTenTruong());

  const [hop, setHop] = useState<Hop>(null);
  const [dangLam, setDangLam] = useState(false);
  const [loiHop, setLoiHop] = useState<string | null>(null);
  const [banTin, setBanTin] = useState<{ tone: "luc" | "do"; noiDung: string } | null>(null);
  const [canDongBo, setCanDongBo] = useState(false);

  const tenTheoMa = useMemo(() => new Map((tenDs.du ?? []).map((t) => [t.maTruong, t.ten ?? t.maTruong])), [tenDs.du]);
  const taiLaiTatCa = () => { tt.taiLai(); cho.taiLai(); };

  if (!laQtv) {
    return (
      <div className="space-y-3">
        <DauTrangChinh tieuDe="Xuất bản" moTa="Chỉ quản trị viên được đưa dữ liệu lên web học sinh." />
        <NoiDung><TrangThaiTrong bieuTuong={<UploadCloud size={26} />} tieuDe="Bạn không có quyền ở mục này" moTa="Hãy gửi duyệt mục bạn đã điền. Quản trị viên sẽ xuất bản." /></NoiDung>
      </div>
    );
  }

  const xuLyLoi = (e: unknown) => {
    setLoiHop(thongBaoLoi(e));
    if (e instanceof LoiApi && e.status === 502) setCanDongBo(true);
  };

  const xacNhan = async () => {
    if (!hop) return;
    setDangLam(true);
    setLoiHop(null);
    try {
      if (hop.kieu === "xuat-ban") {
        const r = await xuatBanNgay();
        if (r.thanhCong === false) { setLoiHop(r.thongBao ?? "Chưa có gì để xuất bản."); return; }
        setBanTin({ tone: "luc", noiDung: `Đã xuất bản phiên bản ${r.dataVersion ?? ""} với ${r.soBanGhiMoi ?? 0} mục mới. Học sinh sẽ thấy trong vài phút.` });
      } else {
        const r = await quayVePhienBan(hop.phienBan);
        setBanTin({ tone: "luc", noiDung: r.thongBao ?? `Đã quay về phiên bản ${hop.phienBan}.` });
      }
      setHop(null);
      setCanDongBo(false);
      taiLaiTatCa();
    } catch (e) {
      xuLyLoi(e);
    } finally {
      setDangLam(false);
    }
  };

  const dongBo = async () => {
    setDangLam(true);
    try {
      await dongBoLaiKv();
      setBanTin({ tone: "luc", noiDung: "Đã đồng bộ lại. Web học sinh đã nhận bản đang chạy." });
      setCanDongBo(false);
      setHop(null);
      taiLaiTatCa();
    } catch (e) {
      xuLyLoi(e);
    } finally {
      setDangLam(false);
    }
  };

  const soCho = tt.du?.soChoXuatBan ?? cho.du?.tong ?? 0;
  const chay = tt.du?.dangChay;

  return (
    <div className="space-y-3">
      <DauTrangChinh tieuDe="Xuất bản" moTa="Đưa các mục đã duyệt lên web học sinh. Có thể quay về phiên bản cũ nếu có sai sót." />
      <NoiDung>
        {banTin && <DongThongBao tone={banTin.tone} tieuDe={banTin.noiDung} onClick={() => setBanTin(null)} />}

        {tt.dangTai && !tt.du ? <KhungDangTai soKhung={2} cao="h-28" /> : tt.loi ? (
          <KhungLoi moTa={tt.loi} thuLai={taiLaiTatCa} />
        ) : (
          <>
            <The className="space-y-1.5">
              <h2 className="font-extrabold text-[16px] text-muc flex items-center gap-2"><PackageCheck size={18} className="text-luc" /> Đang chạy trên web</h2>
              {chay ? (
                <>
                  <p className="text-[22px] font-extrabold text-muc">Phiên bản {chay.dataVersion}</p>
                  <p className="text-[13px] text-chu-phu">{chay.totalRecords} mục · xuất bản bởi {chay.publishedBy} · {dinhDangLuc(chay.publishedAt)}</p>
                </>
              ) : (
                <p className="text-[14px] text-chu">Chưa xuất bản lần nào. Web học sinh đang dùng dữ liệu gốc của ứng dụng.</p>
              )}
            </The>

            <section className="space-y-2" aria-label="Sẽ được xuất bản">
              <h2 className="text-[16px] font-extrabold text-muc">Sẽ được xuất bản ({soCho})</h2>
              {cho.dangTai && !cho.du ? <KhungDangTai cao="h-24" /> : cho.loi ? (
                <KhungLoi moTa={cho.loi} thuLai={cho.taiLai} />
              ) : (cho.du?.ds.length ?? 0) === 0 ? (
                <TrangThaiTrong bieuTuong={<UploadCloud size={26} />} tieuDe="Chưa có mục nào chờ xuất bản" moTa="Duyệt các mục đang chờ ở mục Phê duyệt, rồi quay lại đây.">
                  <Link to={DUONG_DAN.duyet("cho")} className="inline-flex min-h-12 items-center rounded-xl border border-xanh/40 px-4 text-xanh font-bold">Mở Phê duyệt</Link>
                </TrangThaiTrong>
              ) : (
                <>
                  {cho.du!.ds.map((b) => {
                    const ma = maTruongCua(b.entityId);
                    const t = tomTatBan(b);
                    return (
                      <The key={b.id} className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] text-chu-phu min-w-0"><b className="text-muc">{ma}</b> · {tenTheoMa.get(ma) ?? ""}</p>
                          <Nhan tone={b.previousVersionId ? "cam" : "luc"}>{b.previousVersionId ? "Sửa" : "Mới"}</Nhan>
                        </div>
                        <p className="font-bold text-[15px] text-muc leading-snug">{nhanBan(b)}: {t.tieuDe}</p>
                        <SoSanhBan ban={b} />
                      </The>
                    );
                  })}
                  <Nut bieuTuong={UploadCloud} onClick={() => { setLoiHop(null); setHop({ kieu: "xuat-ban" }); }}>Xuất bản ngay</Nut>
                </>
              )}
            </section>

            <section className="space-y-2" aria-label="Lịch sử phiên bản">
              <h2 className="text-[16px] font-extrabold text-muc flex items-center gap-2"><History size={18} className="text-xanh" /> Lịch sử phiên bản</h2>
              {(tt.du?.lichSu.length ?? 0) === 0 ? (
                <p className="rounded-xl border border-dashed border-vien bg-trang p-3 text-[13px] text-chu-phu">Chưa có phiên bản nào.</p>
              ) : tt.du!.lichSu.map((v) => (
                <The key={v.dataVersion} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[15px] text-muc">{v.dataVersion}</p>
                    {v.dangChay ? <Nhan tone="luc">Đang chạy</Nhan> : (
                      <button type="button" onClick={() => { setLoiHop(null); setHop({ kieu: "quay-ve", phienBan: v.dataVersion }); }}
                        className="min-h-11 px-3 rounded-xl border border-vien text-chu font-bold text-[13px] inline-flex items-center gap-1.5"><RotateCcw size={14} /> Quay về</button>
                    )}
                  </div>
                  <p className="text-[12px] text-chu-phu">{v.totalRecords} mục · {v.publishedBy} · {dinhDangLuc(v.publishedAt)}</p>
                  {v.changeSummary && <p className="text-[13px] text-chu">{v.changeSummary}</p>}
                </The>
              ))}
              {(tt.du?.tong ?? 0) > (tt.du?.lichSu.length ?? 0) && <p className="text-[12px] text-chu-phu">Đang hiện {tt.du?.lichSu.length}/{tt.du?.tong} phiên bản mới nhất.</p>}
            </section>
          </>
        )}
      </NoiDung>

      <HopTruot mo={Boolean(hop)} dong={() => setHop(null)} tieuDe={hop?.kieu === "quay-ve" ? "Quay về phiên bản cũ" : "Xác nhận xuất bản"}>
        <div className="space-y-3">
          {hop?.kieu === "quay-ve" ? (
            <p className="text-[14px] text-chu">Web học sinh sẽ dùng lại phiên bản <b>{hop.phienBan}</b>. Các mục xuất bản sau đó vẫn còn trong hệ thống, chỉ là web không hiện nữa.</p>
          ) : (
            <p className="text-[14px] text-chu">Đưa <b>{soCho}</b> mục đã duyệt lên web. Học sinh sẽ thấy sau vài phút. Bạn có thể quay về phiên bản trước nếu cần.</p>
          )}
          {loiHop && <p role="alert" className="rounded-xl bg-do-nhat p-3 text-[13px] font-semibold text-do-chu">{loiHop}</p>}
          {canDongBo && <Nut kieu="nhe" onClick={() => void dongBo()} disabled={dangLam}>Đồng bộ lại</Nut>}
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => setHop(null)} disabled={dangLam}>Hủy</Nut>
            <Nut onClick={() => void xacNhan()} disabled={dangLam}>{dangLam ? "Đang làm" : hop?.kieu === "quay-ve" ? "Quay về" : "Xuất bản"}</Nut>
          </div>
        </div>
      </HopTruot>
    </div>
  );
}
