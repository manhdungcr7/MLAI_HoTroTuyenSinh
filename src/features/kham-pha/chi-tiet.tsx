import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle, BarChart3, Briefcase, Check, CheckCircle2, CircleDot, FileText, GitCompareArrows, ListChecks, MapPin, PencilLine, Plus, SearchX, Sparkles, ThumbsUp, Users, Wallet,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { AnhBia, BieuTuongTron, HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import type { LuaChon, ToneTen } from "@/state/types";
import { TONE_CHAC_CHAN, TONE_MUC, boiCanhTu, danhGia } from "./phu-hop";
import { HopChonLuaChon, NhanPhuHop, NutTim, khoangDiem, khoangHocPhi, kyHieu } from "./thanh-phan";
import { NutTuVan } from "@/features/tu-van/tu-van";

const MO_TA_VIEC_LAM: Record<LuaChon["coHoiViecLam"], string> = {
  "Rất cao": "Theo dữ liệu mẫu, ngành có nhiều chỗ tuyển.",
  Cao: "Theo dữ liệu mẫu, ngành có khá nhiều chỗ tuyển.",
  Khá: "Theo dữ liệu mẫu, cơ hội ở mức khá, nên chủ động thực tập sớm.",
};

function DongThongTin({ icon, tone, nhan, giaTri, phu }: { icon: LucideIcon; tone: ToneTen; nhan: ReactNode; giaTri: ReactNode; phu?: ReactNode }) {
  const Icon = icon;
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className={gop("size-10 rounded-xl grid place-items-center shrink-0", TONE_NEN[tone], TONE_CHU[tone])}><Icon size={20} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-chu-phu">{nhan}</span>
        <b className="block text-[16px] text-muc leading-snug">{giaTri}</b>
        {phu && <span className="block text-[13px] text-chu-phu leading-snug mt-0.5">{phu}</span>}
      </span>
    </li>
  );
}

/** Khối "Vì sao nên cân nhắc" / "Điều cần lưu ý": phần sinh từ hồ sơ của em đứng trước, nhận xét chung của ngành đứng sau. */
function DanhSachY({ tone, icon: Icon, tieuDe, cuaEm, chung }: { tone: ToneTen; icon: LucideIcon; tieuDe: string; cuaEm: string[]; chung: string[] }) {
  const DauDong = tone === "luc" ? CheckCircle2 : CircleDot;
  const ds = (cac: string[]) => (
    <ul className="space-y-2">
      {cac.map((y, i) => (
        <li key={i} className="flex items-start gap-2 text-[14px] text-chu leading-snug">
          <DauDong size={16} className={gop("shrink-0 mt-0.5", TONE_CHU[tone])} /><span>{y}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className={gop("rounded-the p-4", TONE_NEN[tone])} aria-label={tieuDe}>
      <h2 className={gop("flex items-center gap-2 text-[16px] font-extrabold", TONE_CHU[tone])}><Icon size={20} />{tieuDe}</h2>
      {cuaEm.length > 0 && (
        <div className="mt-2 rounded-xl bg-trang/70 p-3">
          <p className="mb-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-xanh"><Sparkles size={13} />Theo hồ sơ của em</p>
          {ds(cuaEm)}
        </div>
      )}
      {chung.length > 0 && <div className="mt-2.5">{ds(chung)}</div>}
      {cuaEm.length + chung.length === 0 && <p className="mt-2 text-[14px] text-chu-phu">Chưa có dữ liệu cho mục này.</p>}
    </section>
  );
}

export default function ChiTiet() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { s, themNguyenVong } = useApp();
  const lc = tim(id);
  const bc = useMemo(() => boiCanhTu(s), [s]);
  const [hoiTiep, setHoiTiep] = useState<null | "vuaThem" | "daCo">(null);
  const [chonThem, setChonThem] = useState(false);

  if (!lc) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Chi tiết lựa chọn" quayLai={DUONG_DAN.khamPha()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Không tìm thấy lựa chọn này" moTa="Có thể đường dẫn đã cũ hoặc lựa chọn đã bị bỏ khỏi danh sách. Em xem các gợi ý khác nhé.">
            <Nut onClick={() => nav(DUONG_DAN.khamPha())}>Về Khám phá</Nut>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const kq = danhGia(lc, bc);
  const trongDs = s.nguyenVong.includes(lc.id);
  const tone = kq.muc ? TONE_MUC[kq.muc] : "xanh";

  const themVao = () => {
    if (trongDs) return setHoiTiep("daCo");
    themNguyenVong(lc.id);
    setHoiTiep("vuaThem");
  };
  const soSanh = () => {
    const khac = s.soSanh.find((x) => x !== lc.id && tim(x));
    if (khac) nav(DUONG_DAN.soSanh(lc.id, khac));
    else setChonThem(true);
  };

  return (
    <>
      <DauTrangCoQuayLai tieuDe="Chi tiết lựa chọn" phai={<NutTim id={lc.id} ten={`${lc.nganh} – ${lc.truong}`} className="ml-auto -mr-2" />} />
      <NoiDung>
        {/* Đầu thẻ: ảnh bìa gradient theo màu trường (không dùng ảnh thật) */}
        <section className="rounded-lon bg-trang border border-vien shadow-the overflow-hidden">
          <AnhBia tone={lc.tone} cao={96}>
            <span aria-hidden className="absolute right-4 bottom-1 text-[52px] font-extrabold leading-none text-white/25 tracking-tight select-none">{lc.truong}</span>
          </AnhBia>
          <div className="px-4 pb-4">
            <div className="relative z-10 -mt-9 flex items-end gap-3">
              <span className="rounded-2xl bg-trang p-1 shadow-the"><HuyHieuTruong ten={kyHieu(lc.truong)} tone={lc.tone} kichThuoc={64} /></span>
              <span className="pb-1 flex flex-wrap gap-1.5">
                <Nhan tone="xanh">{lc.bac}</Nhan>
                <Nhan tone="tim">{lc.nhomNganh}</Nhan>
              </span>
            </div>
            <h2 className="mt-2 text-[22px] font-extrabold text-muc leading-tight">{lc.nganh}</h2>
            <p className="text-[14px] text-chu mt-0.5"><b>{lc.truong}</b> · {lc.tenTruong}</p>
            <p className="text-[13px] text-chu-phu mt-1">{lc.moTa}</p>
          </div>
        </section>

        {/* Mức độ phù hợp với em */}
        <section className={gop("rounded-the p-4", TONE_NEN[tone])} aria-label="Mức độ phù hợp với em">
          <div className="flex items-start gap-3">
            <BieuTuongTron icon={kq.muc ? CheckCircle2 : PencilLine} tone={tone} kichThuoc={48} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-chu-phu">Mức độ phù hợp với em</p>
              {kq.muc ? <p className={gop("text-[20px] font-extrabold leading-tight", TONE_CHU[tone])}>{kq.muc}</p> : <div className="mt-0.5"><NhanPhuHop kq={kq} /></div>}
              <p className="text-[14px] text-chu mt-1 leading-snug">{kq.giaiThich}</p>
            </div>
          </div>
          {kq.muc ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-trang/80 p-2.5">
                <p className="text-[12px] text-chu-phu">Mức chắc chắn</p>
                <p className={gop("text-[16px] font-extrabold", TONE_CHU[TONE_CHAC_CHAN[kq.chacChan!]])}>{kq.chacChan}</p>
              </div>
              <div className="rounded-xl bg-trang/80 p-2.5">
                <p className="text-[12px] text-chu-phu">Điểm gợi ý</p>
                <p className="text-[16px] font-extrabold text-muc">{kq.diemGoiY}<span className="text-[13px] font-semibold text-chu-phu">/100</span></p>
              </div>
              <p className="col-span-2 text-[12px] text-chu-phu leading-snug">Điểm gợi ý tính từ điểm, học phí, khu vực và cơ hội việc làm để em dễ so sánh. Đây không phải xác suất đậu.</p>
            </div>
          ) : (
            <Nut className="mt-3" kieu="vien" bieuTuong={PencilLine} onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm của em</Nut>
          )}
        </section>

        {/* Thông tin chính */}
        <section className="rounded-the bg-trang border border-vien shadow-the p-4" aria-label="Thông tin chính">
          <ul className="divide-y divide-vien">
            <DongThongTin icon={BarChart3} tone="tim" nhan={`Điểm tham khảo (năm ${lc.namDiem})`} giaTri={`${khoangDiem(lc)} điểm`} phu="Thang 30. Điểm năm nay có thể khác." />
            <DongThongTin icon={Wallet} tone="cam" nhan="Học phí / năm (dự kiến)" giaTri={`${khoangHocPhi(lc)} triệu đồng`} phu={bc.nganSach !== null ? `Ngân sách của em: tối đa khoảng ${bc.nganSach} triệu/năm.` : undefined} />
            <DongThongTin icon={MapPin} tone="do" nhan="Khu vực" giaTri={lc.khuVuc} phu={lc.diaChi} />
            <DongThongTin icon={Briefcase} tone="luc" nhan="Cơ hội việc làm" giaTri={lc.coHoiViecLam} phu={<>Hướng công việc: {lc.moTa.charAt(0).toLowerCase() + lc.moTa.slice(1)}. {MO_TA_VIEC_LAM[lc.coHoiViecLam]}</>} />
            <DongThongTin icon={Users} tone="xanh" nhan="Môi trường học" giaTri={lc.moiTruongHoc} />
          </ul>
        </section>

        <DanhSachY tone="luc" icon={ThumbsUp} tieuDe="Vì sao nên cân nhắc" cuaEm={kq.tot} chung={lc.lyDoPhuHop} />
        <DanhSachY tone="cam" icon={AlertTriangle} tieuDe="Điều cần lưu ý" cuaEm={kq.luuY} chung={lc.canLuuY} />

        {/* Nguồn dữ liệu: không bịa đường link */}
        <section className="rounded-the bg-trang border border-vien p-3.5 flex items-start gap-3" aria-label="Nguồn dữ liệu">
          <span className="size-10 rounded-xl grid place-items-center shrink-0 bg-xanh-nhat text-xanh"><FileText size={20} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[14px] text-muc">Nguồn dữ liệu</b>
              {lc.daKiemChung ? <Nhan tone="luc">Đã kiểm chứng</Nhan> : <Nhan tone="cam">Chưa kiểm chứng</Nhan>}
            </div>
            <p className="text-[13px] text-chu-phu leading-snug mt-0.5">
              {lc.nguon}.{!lc.daKiemChung && " Số liệu chưa được đối chiếu với trường, em hãy xem lại trên trang tuyển sinh chính thức trước khi quyết định."}
            </p>
            {lc.ngayCapNhat ? (
              <p className="mt-1 text-[12px] text-chu-phu">
                Ngày công bố đề án: <b className="text-chu">{lc.ngayCapNhat}</b>{lc.donViXacThuc && ` · ${lc.donViXacThuc}`}
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-chu-phu">Ngày cập nhật từ nguồn: chưa có thông tin.</p>
            )}
            {lc.linkNguon && (
              <a href={lc.linkNguon} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1 text-[12px] font-bold text-xanh hover:underline">
                Xem trang tuyển sinh chính thức
              </a>
            )}
          </div>
        </section>

        <div className="space-y-2 pt-1">
          <NutTuVan nguCanh={`Chi tiết ngành ${lc.nganh}`} />
          <Nut bieuTuong={trongDs ? Check : Plus} onClick={themVao}>{trongDs ? "Đã trong danh sách" : "Thêm nguyện vọng"}</Nut>
          <Nut kieu="vien" bieuTuong={GitCompareArrows} onClick={soSanh}>So sánh ngành này</Nut>
        </div>
      </NoiDung>

      <HopTruot mo={hoiTiep !== null} dong={() => setHoiTiep(null)} tieuDe={hoiTiep === "daCo" ? "Đã có trong danh sách" : "Đã thêm nguyện vọng"}>
        <div className="flex items-center gap-3 rounded-the bg-luc-nhat p-3">
          <HuyHieuTruong ten={kyHieu(lc.truong)} tone={lc.tone} kichThuoc={44} />
          <div className="min-w-0">
            <b className="block text-[15px] text-muc">{lc.nganh} – {lc.truong}</b>
            <span className="text-[13px] text-chu">
              {hoiTiep === "daCo" ? "Lựa chọn này đã nằm trong danh sách nguyện vọng của em." : `Đang ở vị trí ${s.nguyenVong.indexOf(lc.id) + 1} trong danh sách nguyện vọng.`}
            </span>
          </div>
        </div>
        <p className="text-[14px] text-chu my-3">Em muốn xem danh sách nguyện vọng và kiểm tra đã cân đối chưa?</p>
        <div className="space-y-2">
          <Nut bieuTuong={ListChecks} muiTen onClick={() => nav(DUONG_DAN.nguyenVong())}>Xem nguyện vọng</Nut>
          <Nut kieu="nhe" onClick={() => setHoiTiep(null)}>Ở lại xem</Nut>
        </div>
      </HopTruot>

      <HopChonLuaChon mo={chonThem} dong={() => setChonThem(false)} tieuDe="So sánh với trường nào?" boQua={[lc.id]}
        onChon={(l) => { setChonThem(false); nav(DUONG_DAN.soSanh(lc.id, l.id)); }} />
    </>
  );
}
