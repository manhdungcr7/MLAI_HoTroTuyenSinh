import { Link } from "react-router-dom";
import { ChevronRight, ClipboardCheck, FileEdit, School, UploadCloud, CheckCircle2, type LucideIcon } from "lucide-react";
import { DUONG_DAN } from "@cms/duong-dan";
import { layHetBanGhi } from "@cms/may-chu/ban-ghi-api";
import { layDanhSachTenTruong } from "@cms/trang-thai/ten-truong";
import { usePhien } from "@cms/trang-thai/phien";
import { useTai } from "@cms/trang-thai/dung-tai";
import { DauTrangChinh, NoiDung } from "@cms/thanh-phan/khung/khung-goc";
import { KhungDangTai, KhungLoi } from "@cms/thanh-phan/ui/hien-thi";
import { Nhan, The, gop } from "@cms/thanh-phan/ui/nut-the";
import { MUC_CAN_DU } from "@/data/dong-gop-kiem-tra";
import { nhanMuc } from "@cms/du-lieu-truong/dinh-dang";
import { tiLeDu } from "@cms/du-lieu-truong/loc-truong";
import { nhomTheoTruong, tienDoTuBanGhi } from "@cms/du-lieu-truong/mo-hinh";
import { useMemo } from "react";

interface ViecProps { bieuTuong: LucideIcon; tone: "cam" | "xanh" | "luc"; so: number | null; tieuDe: string; phu: string; den: string }

/** Một việc cần làm: số lớn bên trái, bấm để đi tới đúng màn. so = null nghĩa là chưa đọc được. */
function Viec({ bieuTuong: Icon, tone, so, tieuDe, phu, den }: ViecProps) {
  const xong = so === 0;
  const mau = { cam: "bg-cam-nhat text-cam-chu", xanh: "bg-xanh-nhat text-xanh", luc: "bg-luc-nhat text-luc-chu" }[xong ? "luc" : tone];
  return (
    <Link to={den} className="flex items-center gap-3 min-h-16 rounded-the bg-trang border border-vien shadow-the px-3 py-2.5 active:bg-xanh-nhat">
      <span className={gop("size-11 rounded-xl grid place-items-center shrink-0 font-extrabold text-[18px]", mau)}>
        {so === null ? "?" : xong ? <CheckCircle2 size={22} /> : so}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold text-chu leading-snug">{tieuDe}</span>
        <span className="block text-[13px] text-chu-phu leading-snug">{phu}</span>
      </span>
      <Icon size={18} className="text-chu-phu shrink-0 hidden" />
      <ChevronRight size={18} className="text-chu-phu shrink-0" />
    </Link>
  );
}

export default function TongQuanDashboard() {
  const { laQtv, toi } = usePhien();
  const tenDs = useTai(() => layDanhSachTenTruong());
  const bg = useTai(() => layHetBanGhi());
  const dangTai = (bg.dangTai && !bg.du) || (tenDs.dangTai && !tenDs.du);
  const loi = bg.loi ?? tenDs.loi;
  const taiLai = () => { bg.taiLai(); tenDs.taiLai(); };

  const ds = useMemo(() => {
    if (!bg.du || !tenDs.du) return [];
    const nhom = nhomTheoTruong(bg.du.ds);
    const giao = new Set(toi.truongDuocGiao);
    return tenDs.du.filter((t) => laQtv || giao.has(t.maTruong)).map((t) => tienDoTuBanGhi(t.maTruong, nhom.get(t.maTruong) ?? []));
  }, [bg.du, tenDs.du, laQtv, toi.truongDuocGiao]);
  const tongDu = ds.filter((t) => t.du).length;
  const dem = (tt: string[], cuaToi = false) => (bg.du?.ds ?? []).filter((b) => tt.includes(b.status) && (!cuaToi || b.createdBy === toi.email)).length;
  const soChoDuyet = bg.du ? dem(["SUBMITTED", "IN_REVIEW"]) : null;
  const soChoXuatBan = bg.du ? dem(["APPROVED"]) : null;
  const soCanSua = bg.du ? dem(["DRAFT", "REJECTED"], true) : null;
  const demThieu = (m: string) => ds.filter((t) => (t.thieu as string[]).includes(m)).length;
  const caiNen = !laQtv && toi.truongDuocGiao.length === 0;
  const canDienTruoc = [...ds].filter((t) => !t.du).sort((a, b) => b.thieu.length - a.thieu.length || a.maTruong.localeCompare(b.maTruong)).slice(0, 5);
  const phamViDen = (loc: "thieu-hoc-phi" | "thieu-noi-luu-tru" | "chua-co-kenh") => (laQtv ? DUONG_DAN.truong(loc) : DUONG_DAN.truong("giao-cho-toi"));
  const pham = laQtv ? "trong tất cả trường" : "trong trường được giao cho bạn";

  return (
    <div className="space-y-3">
      <DauTrangChinh
        tieuDe="Tổng quan"
        moTa={laQtv ? "Việc cần làm ngay: duyệt bản gửi lên, điền chỗ còn thiếu, xuất bản." : "Việc cần làm ngay: điền các mục còn thiếu của trường được giao cho bạn."}
      />
      <NoiDung>
        {caiNen && (
          <div role="status" className="rounded-the bg-cam-nhat p-3.5 text-[14px] text-cam-chu font-semibold">
            Bạn chưa được giao trường nào. Nhờ quản trị viên giao trường cho bạn ở mục Hệ thống, rồi quay lại đây.
          </div>
        )}

        <section aria-label="Việc cần làm" className="space-y-2">
          <h2 className="text-[16px] font-extrabold text-muc">Việc cần làm</h2>
          {laQtv && (
            <Viec bieuTuong={ClipboardCheck} tone="cam" so={soChoDuyet}
              tieuDe="Bản ghi chờ bạn duyệt" phu={bg.loi ?? (soChoDuyet === 0 ? "Không còn bản nào chờ duyệt." : "Bấm để xem, duyệt hoặc trả lại.")}
              den={DUONG_DAN.duyet("cho")} />
          )}
          {!laQtv && (
            <Viec bieuTuong={FileEdit} tone="cam" so={soCanSua}
              tieuDe="Bản nháp hoặc bị trả lại" phu={bg.loi ?? (soCanSua === 0 ? "Không có bản nháp nào." : "Mở ra, sửa lại rồi gửi duyệt.")}
              den={DUONG_DAN.duyet("nhap")} />
          )}
          {laQtv && (
            <Viec bieuTuong={UploadCloud} tone="xanh" so={soChoXuatBan}
              tieuDe="Bản đã duyệt chờ xuất bản" phu={bg.loi ?? (soChoXuatBan === 0 ? "Chưa có gì mới để xuất bản." : "Xuất bản để học sinh thấy thông tin mới.")}
              den={DUONG_DAN.xuatBan()} />
          )}
          <Viec bieuTuong={School} tone="xanh" so={bg.du && tenDs.du ? demThieu("hoc_phi") : null}
            tieuDe="Trường thiếu học phí" phu={loi ?? `Còn thiếu ${pham}.`} den={phamViDen("thieu-hoc-phi")} />
          <Viec bieuTuong={School} tone="xanh" so={bg.du && tenDs.du ? demThieu("noi_luu_tru") : null}
            tieuDe="Trường thiếu nơi ở" phu={loi ?? `Ký túc xá, khu trọ ${pham}.`} den={phamViDen("thieu-noi-luu-tru")} />
          <Viec bieuTuong={School} tone="xanh" so={bg.du && tenDs.du ? demThieu("kenh") : null}
            tieuDe="Trường chưa có kênh chính thức" phu={loi ?? `Website, fanpage ${pham}.`} den={phamViDen("chua-co-kenh")} />
        </section>

        <section aria-label="Mức đủ dữ liệu" className="space-y-2">
          <h2 className="text-[16px] font-extrabold text-muc">Mức đủ dữ liệu</h2>
          {dangTai ? <KhungDangTai cao="h-32" /> : loi ? (
            <KhungLoi moTa={loi} thuLai={taiLai} />
          ) : ds.length === 0 ? (
            <The><p className="text-[14px] text-chu-phu">Chưa có trường nào {laQtv ? "trong hệ thống" : "được giao cho bạn"}.</p></The>
          ) : (
            <The className="space-y-3">
              <p className="text-[15px] text-chu"><b className="text-[22px] text-muc">{tongDu}</b>/{ds.length} trường đã đủ {MUC_CAN_DU.length} mục</p>
              <div className="h-2 rounded-full bg-vien overflow-hidden" role="progressbar" aria-label="Trường đã đủ"
                aria-valuenow={Math.round((tongDu / ds.length) * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-luc rounded-full" style={{ width: `${(tongDu / ds.length) * 100}%` }} />
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                {MUC_CAN_DU.map((m) => (
                  <li key={m} className="flex justify-between gap-1.5">
                    <span className="text-chu-phu min-w-0 leading-tight">{nhanMuc(m)}</span>
                    <b className="text-chu shrink-0">{ds.length - demThieu(m)}/{ds.length}</b>
                  </li>
                ))}
              </ul>
            </The>
          )}
        </section>

        {canDienTruoc.length > 0 && (
          <section aria-label="Trường cần điền trước" className="space-y-2">
            <h2 className="text-[16px] font-extrabold text-muc">Trường nên điền trước</h2>
            {canDienTruoc.map((t) => (
              <Link key={t.maTruong} to={DUONG_DAN.chiTietTruong(t.maTruong)} className="block">
                <The className="py-3 active:bg-xanh-nhat">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[15px] text-muc">{t.maTruong}</b>
                    <span className="text-[12px] font-bold text-cam-chu">{tiLeDu(t)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.thieu.map((m) => <Nhan key={m} tone="cam">{nhanMuc(m)}</Nhan>)}
                  </div>
                </The>
              </Link>
            ))}
            <Link to={DUONG_DAN.truong()} className="flex min-h-12 items-center justify-center rounded-xl border border-xanh/40 text-xanh font-bold">Xem tất cả trường</Link>
          </section>
        )}
      </NoiDung>
    </div>
  );
}
