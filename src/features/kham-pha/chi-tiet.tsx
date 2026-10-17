import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle, BarChart3, Briefcase, CheckCircle2, CircleDot, FileText, GitCompareArrows, GraduationCap, ListChecks, MapPin, PencilLine, Plus, SearchX, Sparkles, Target, ThumbsUp, Users, Wallet,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { AnhBia, BieuTuongTron, HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HopTruot, TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { tim as timGoc } from "@/data/lua-chon-mau";
import { taiNguon, type NguonTaiSau } from "@/data/lua-chon-that";
import { coTheDatMucTieu, mucTieuTuLuaChon } from "@/state/chon";
import { coHocPhi } from "@/data/lua-chon-phu";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { changCuaEm } from "@/state/chang";
import type { LuaChon, ToneTen } from "@/state/types";
import { CHU_SO_VOI_DIEM_CHUAN, TONE_CHAC_CHAN, TONE_MUC, boiCanhTu, danhGia } from "./phu-hop";
import { HopChonLuaChon, NhanPhuHop, NutTim, khoangHocPhi, kyHieu } from "./thanh-phan";
import { dinhDangDiem } from "@/engine/dinh-dang";
import { useKhoDuLieu } from "@/state/dung-kho-du-lieu";
import { NutBaoSai } from "./bao-sai-sheet";
import { KhoiDuBao } from "./khoi-du-bao";
import { phanLoaiDuLieu, type TrangThaiDuLieu } from "@/engine/trang-thai-du-lieu";
import { NhanTrangThaiDuLieu } from "@/components/ui/du-bao";
import { tongChoLuaChon } from "./to-hop";
import { ThongTinTruong } from "./thong-tin-truong";
import { giaiQuyetLink } from "@/engine/link-chinh-thuc";

const MO_TA_VIEC_LAM: Record<NonNullable<LuaChon["coHoiViecLam"]>, string> = {
  "Rất cao": "Khảo sát trong đề án.",
  Cao: "Khảo sát trong đề án.",
  Khá: "Khảo sát trong đề án. Nên thực tập sớm.",
};

/** Liên kết nguồn thông minh: chống 404, tự động fallback sang cổng tuyển sinh chính thức của trường */
function LinkNguon({ url, trang, nhan = "Nguồn", maTruong }: { url: string; trang?: number; nhan?: string; maTruong?: string }) {
  const gq = giaiQuyetLink(maTruong, url, trang);
  return (
    <a href={gq.url} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-11 font-bold text-xanh hover:underline">
      {gq.laCongChinhThuc ? gq.nhanHienThi : `${nhan}${trang && trang > 0 ? ` · tr. ${trang}` : ""}`}
    </a>
  );
}

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
          <p className="mb-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-xanh"><Sparkles size={13} />Theo hồ sơ của bạn</p>
          {ds(cuaEm)}
        </div>
      )}
      {chung.length > 0 && <div className="mt-2.5">{ds(chung)}</div>}
      {cuaEm.length + chung.length === 0 && <p className="mt-2 text-[14px] text-chu-phu">Chưa có dữ liệu cho mục này.</p>}
    </section>
  );
}

const TEN_PHUONG_THUC: Record<string, string> = {
  THPT: "Điểm thi tốt nghiệp THPT", HOC_BA: "Học bạ THPT", DGNL_HCM: "ĐGNL ĐHQG TP.HCM", DGNL_HN: "ĐGNL ĐHQG Hà Nội",
  DGNL_KHAC: "Đánh giá năng lực (khác)", DGTD: "Đánh giá tư duy", KET_HOP: "Kết hợp nhiều tiêu chí", NANG_KHIEU: "Có thi năng khiếu",
};

/** Điểm chuẩn từng năm có thật, kèm điểm của bạn để so ngay. Không nội suy năm thiếu. */
function BangDiemChuan({ lc, tt, diemEm, uuTienCong }: { lc: LuaChon; tt: TrangThaiDuLieu; diemEm: number | null; uuTienCong?: number }) {
  const nam = Object.entries(lc.diemTheoNam ?? {}).sort((a, b) => b[0].localeCompare(a[0]));
  if (nam.length === 0) return null;
  return (
    <section className="rounded-the bg-trang border border-vien shadow-the p-4" aria-label="Điểm chuẩn các năm">
      <h2 className="text-[16px] font-extrabold text-muc">{tt.loai === "chiDiemSan" ? "Điểm sàn các năm" : tt.loai === "phuongThucKhac" ? "Điểm các năm (phương thức khác)" : "Điểm chuẩn các năm"}</h2>
      <ul className="mt-2 divide-y divide-vien">
        {nam.map(([n, d]) => {
          const link = lc.nguonTheoNam?.find((x) => x.nam === n);
          return (
            <li key={n} className="flex items-center justify-between gap-3 py-2">
              <span className="text-[14px] text-chu">Năm {n}</span>
              <span className="flex items-center gap-3">
                {link && <span className="text-[13px]"><LinkNguon url={link.url} trang={link.trang} maTruong={lc.maTruong} /></span>}
                <b className="text-[16px] text-muc tabular-nums">{dinhDangDiem(d)}</b>
              </span>
            </li>
          );
        })}
      </ul>
      {diemEm !== null && tt.diemCuoi !== null && <p className="mt-2 text-[13px] text-chu-phu">Điểm của bạn: <b className="text-chu">{dinhDangDiem(diemEm)}</b>{uuTienCong ? ` (gồm +${dinhDangDiem(uuTienCong)} ưu tiên)` : ""}</p>}
    </section>
  );
}

/** Liên kết tới tài liệu gốc của từng năm (đề án PDF, đúng trang có ngành). */
function NguonTungNam({ lc, docs }: { lc: LuaChon; docs?: { nam: string; url: string }[] }) {
  const ds = lc.nguonTheoNam ?? [];
  // Đề án của trường chưa dẫn được tới đúng dòng điểm của ngành: vẫn cho em mở cả file để tự tìm.
  const conLai = (docs ?? []).filter((d) => !ds.some((x) => x.url === d.url));
  if (ds.length === 0 && conLai.length === 0) return null;
  return (
    <ul className="mt-1.5 space-y-0.5">
      {ds.map((x) => (
        <li key={`${x.nam}-${x.url}`}>
          <a href={x.trang ? `${x.url}#page=${x.trang}` : x.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
            {x.loai === "deAn" ? `Điểm chuẩn ${x.nam} trong đề án ${x.tai ?? x.nam}` : `Bảng điểm chuẩn ${x.nam}`}{x.trang ? `, trang ${x.trang}` : ""}
          </a>
        </li>
      ))}
      {conLai.map((d) => (
        <li key={d.url}>
          <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
            Đề án tuyển sinh {d.nam} của trường (toàn văn)
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Trang của ngành trên website chính thức của trường (nếu tìm được và đã kiểm tra mở được). Không có thì nói thẳng. */
function ChuongTrinhHoc({ lc, trang, chungTruong }: { lc: LuaChon; trang?: { url: string; tieuDe: string }; chungTruong?: { url: string; tieuDe: string } }) {
  const truyVan = `khung chương trình đào tạo ngành ${lc.nganh} ${lc.tenTruong}`;
  return (
    <section className="rounded-the bg-trang border border-vien p-3.5 flex items-start gap-3" aria-label="Chương trình học">
      <span className="size-10 rounded-xl grid place-items-center shrink-0 bg-tim-nhat text-tim"><GraduationCap size={20} /></span>
      <div className="flex-1 min-w-0">
        <b className="text-[14px] text-muc">Chương trình học của ngành</b>
        {trang ? (
          <>
            <p className="text-[13px] text-chu-phu leading-snug mt-0.5">Trang ngành trên website trường: xem môn học từng kỳ.</p>
            <a href={trang.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
              {trang.tieuDe || "Xem trang ngành của trường"}
            </a>
          </>
        ) : (
          <>
            <p className="text-[13px] text-chu-phu leading-snug mt-0.5">
              Chưa có trang riêng của ngành. Xem môn học trước khi chọn.
            </p>
            {chungTruong && (
              <a href={chungTruong.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
                Trang chung của trường: {chungTruong.tieuDe}
              </a>
            )}
            <a href={`https://www.google.com/search?q=${encodeURIComponent(truyVan)}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 min-h-11 text-[13px] font-bold text-xanh hover:underline">
              Tìm khung chương trình
            </a>
          </>
        )}
      </div>
    </section>
  );
}

export default function ChiTiet() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { s, themNguyenVong, datMucTieu } = useApp(); // import { vung-an-toan-duoi } nếu cần
  const [nguon, setNguon] = useState<NguonTaiSau | null>(null);
  useEffect(() => { let con = true; taiNguon().then((m) => con && setNguon(m)).catch(() => {}); return () => { con = false; }; }, []);
  const kho = useKhoDuLieu();
  const lcGoc = kho.layLuaChonTheoId(id) ?? timGoc(id); // đã hợp nhất với bản CMS đã xuất bản
  const lc = useMemo(() => {
    if (!lcGoc) return undefined;
    const theoNam = nguon?.nam[lcGoc.id];
    return { ...lcGoc, nguonTheoNam: [...(lcGoc.nguonTheoNam ?? []), ...(theoNam ?? []).filter((s) => !lcGoc.nguonTheoNam?.some((cms) => cms.nam === s.nam))] };
  }, [lcGoc, nguon]);
  const thongTinTruong = lcGoc ? kho.layChiTietTruong(lcGoc.maTruong ?? lcGoc.truong) : null;
  const bc = useMemo(() => boiCanhTu(s), [s]);
  const [hoiTiep, setHoiTiep] = useState<null | "vuaThem" | "daCo">(null);
  const [chonThem, setChonThem] = useState(false);

  if (!lc) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Chi tiết lựa chọn" quayLai={DUONG_DAN.khamPha()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<SearchX size={28} />} tieuDe="Không tìm thấy lựa chọn này" moTa="Có thể đường dẫn đã cũ hoặc lựa chọn đã bị bỏ khỏi danh sách. Bạn xem các gợi ý khác nhé.">
            <Nut onClick={() => nav(DUONG_DAN.khamPha())}>Về Khám phá</Nut>
          </TrangThaiTrong>
        </NoiDung>
      </>
    );
  }

  const kq = danhGia(lc, bc);
  const tt = phanLoaiDuLieu(lc);
  const hpTruong = nguon?.truong[lc.maTruong ?? ""]?.hocPhi;
  const trongDs = s.nguyenVong.includes(lc.id);
  const tone = kq.muc ? TONE_MUC[kq.muc] : "xanh";

  const themVao = () => {
    if (trongDs) return setHoiTiep("daCo");
    themNguyenVong(lc.id);
    setHoiTiep("vuaThem");
  };
  const laMucTieu = s.mucTieu?.luaChonId === lc.id;
  const dat = coTheDatMucTieu(lc);
  const datLamMucTieu = () => { datMucTieu(mucTieuTuLuaChon(lc, bc.diem, changCuaEm(s))); nav(DUONG_DAN.mucTieu()); };
  const soSanh = () => {
    const khac = s.soSanh.find((x) => x !== lc.id && timGoc(x));
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
            <p className="text-[14px] text-chu mt-0.5">
              {lc.maTruong ? <Link to={DUONG_DAN.truong(lc.maTruong)} className="inline-block py-3 -my-3 font-bold text-xanh underline">{lc.truong} · {lc.tenTruong}</Link> : <><b>{lc.truong}</b> · {lc.tenTruong}</>}
            </p>
            <p className="text-[13px] text-chu-phu mt-1 line-clamp-2">{lc.moTa}</p>
          </div>
        </section>

        {/* Mức độ phù hợp với bạn */}
        <section className={gop("rounded-the p-4", TONE_NEN[tone])} aria-label="Mức độ phù hợp với bạn">
          <div className="flex items-start gap-3">
            <BieuTuongTron icon={kq.muc ? CheckCircle2 : PencilLine} tone={tone} kichThuoc={48} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-chu-phu">Mức độ phù hợp với bạn</p>
              {kq.muc ? <p className={gop("text-[20px] font-extrabold leading-tight", TONE_CHU[tone])}>{kq.muc}</p> : <div className="mt-0.5"><NhanPhuHop kq={kq} /></div>}
              <p className="text-[14px] text-chu mt-1 leading-snug">{kq.giaiThich}</p>
            </div>
          </div>
          {kq.muc ? (
            <div className="mt-3">
              <div className="rounded-xl bg-trang/80 p-2.5 inline-block">
                <span className="text-[13px] text-chu-phu mr-2">So với điểm chuẩn:</span>
                <span className={gop("text-[15px] font-extrabold", TONE_CHU[TONE_CHAC_CHAN[kq.chacChan!]])}>{CHU_SO_VOI_DIEM_CHUAN[kq.chacChan!]}</span>
              </div>
            </div>
          ) : kq.lyDoKhongSo ? null : (
            <Nut className="mt-3" kieu="vien" bieuTuong={PencilLine} onClick={() => nav(DUONG_DAN.batDau(2))}>Nhập điểm của bạn</Nut>
          )}
        </section>

        {/* Thông tin chính */}
        <section className="rounded-the bg-trang border border-vien shadow-the p-4" aria-label="Thông tin chính">
          <ul className="divide-y divide-vien">
            {tt.diemCuoi !== null
              ? <DongThongTin icon={BarChart3} tone="tim" nhan={`Điểm chuẩn ${tt.namCuoi} (thang 30)`} giaTri={`${dinhDangDiem(tt.diemCuoi)} điểm`} phu={tt.nguonThuCap ? "Từ trang tổng hợp, chưa đối chiếu đề án." : undefined} />
              : <DongThongTin icon={BarChart3} tone="tim" nhan="Điểm chuẩn" giaTri={<NhanTrangThaiDuLieu tt={tt} />} phu={tt.loai === "chiDiemSan" ? "Mức điểm sàn không phải điểm chuẩn của ngành." : tt.loai === "phuongThucKhac" ? "Không so với điểm thi THPT." : undefined} />}
            {lc.toHopXet !== undefined && (
              <DongThongTin icon={GraduationCap} tone="xanh" nhan="Tổ hợp xét tuyển" giaTri={lc.toHopXet.length > 0 ? lc.toHopXet.join(", ") : "Đề án chưa ghi rõ"} phu={lc.phuongThuc ? `Phương thức: ${TEN_PHUONG_THUC[lc.phuongThuc] ?? lc.phuongThuc}` : undefined} />
            )}
            <DongThongTin icon={Wallet} tone="cam" nhan={lc.hocPhiUocTinh ? "Học phí / năm (ước tính)" : "Học phí / năm (dự kiến)"} giaTri={coHocPhi(lc) ? `${khoangHocPhi(lc)} triệu đồng` : "Chưa có dữ liệu"}
              phu={coHocPhi(lc) ? <>{lc.hocPhiUocTinh && <span className="block">Ước tính theo trường và khối ngành, chưa có văn bản của trường để đối chiếu. Xem đề án trước khi quyết định.</span>}{lc.nhomNganh === "Sư phạm" && <span className="text-luc font-medium">Sư phạm được hỗ trợ học phí theo NĐ 116 nếu cam kết làm trong ngành · </span>}{bc.nganSach !== null && `Ngân sách bạn ≤ ${bc.nganSach} tr${lc.nguonHocPhi ? " · " : ""}`}{lc.nguonHocPhi && <LinkNguon url={lc.nguonHocPhi.url} trang={lc.nguonHocPhi.trang} nhan={`Đề án ${lc.nguonHocPhi.nam}`} />}</> : <>Chưa có học phí riêng ngành.{hpTruong && <> <LinkNguon url={hpTruong.url} trang={hpTruong.trang} nhan="Mức chung của trường" /></>}</>} />
            <DongThongTin icon={MapPin} tone="do" nhan="Khu vực" giaTri={lc.khuVuc || "Chưa có dữ liệu"} phu={lc.diaChi} />
            {lc.coHoiViecLam ? (
              <DongThongTin icon={Briefcase} tone="luc" nhan="Có việc làm sau tốt nghiệp" giaTri={lc.tiLeViecLam !== undefined ? `${String(lc.tiLeViecLam).replace(".", ",")}% có việc làm` : lc.coHoiViecLam} phu={<>{MO_TA_VIEC_LAM[lc.coHoiViecLam]}{lc.nguonViecLam && <> <LinkNguon url={lc.nguonViecLam.url} trang={lc.nguonViecLam.trang} /></>}</>} />
            ) : (
              <DongThongTin icon={Briefcase} tone="luc" nhan="Có việc làm sau tốt nghiệp" giaTri="Chưa có dữ liệu" />
            )}
            {lc.moiTruongHoc && <DongThongTin icon={Users} tone="xanh" nhan="Môi trường học" giaTri={lc.moiTruongHoc} />}
          </ul>
        </section>

        <BangDiemChuan lc={lc} tt={tt} diemEm={kq.tong} uuTienCong={tongChoLuaChon(lc, bc.diem).uuTienCong} />


        <KhoiDuBao lc={lc} diemEm={kq.tong} />

        <DanhSachY tone="luc" icon={ThumbsUp} tieuDe="Vì sao nên cân nhắc" cuaEm={kq.tot} chung={lc.lyDoPhuHop} />
        <DanhSachY tone="cam" icon={AlertTriangle} tieuDe="Điều cần lưu ý" cuaEm={kq.luuY} chung={lc.canLuuY} />

        <ChuongTrinhHoc lc={lc} trang={nguon?.nganh[lc.id]} chungTruong={nguon?.truongNganh[lc.maTruong ?? ""]} />

        <ThongTinTruong tt={thongTinTruong} />

        {/* Nguồn dữ liệu: không bịa đường link */}
        <section className="rounded-the bg-trang border border-vien p-3.5 flex items-start gap-3" aria-label="Nguồn dữ liệu">
          <span className="size-10 rounded-xl grid place-items-center shrink-0 bg-xanh-nhat text-xanh"><FileText size={20} /></span>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <b className="text-[14px] text-muc">Nguồn dữ liệu</b>
              <Nhan tone={lc.nguonCap === "official_pdf" ? "luc" : "cam"}>
                {lc.nguonCap === "official_pdf" ? "Có nguồn chính thức" : "Nguồn thứ cấp"}
              </Nhan>
            </div>
            <details className="group">
              <summary className="flex items-center text-[13px] font-bold text-xanh cursor-pointer list-none hover:underline py-0.5">Xem chi tiết nguồn</summary>
              <div className="pt-2 pb-1 space-y-1 text-[12px] text-chu-phu border-t border-vien/50 mt-1.5">
                <p className="leading-snug">{lc.nguon}.</p>
                <p>
                  {lc.ngayCapNhat ? <>Ngày công bố đề án: <b className="text-chu">{lc.ngayCapNhat}</b>{lc.donViXacThuc && ` · ${lc.donViXacThuc}`}</> : "Ngày cập nhật từ nguồn: chưa có."}
                </p>
                {lc.linkNguon && (
                  <a href={lc.linkNguon} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-xanh hover:underline pt-0.5">
                    {lc.nguonCap === "aggregator_verified" ? "Bảng điểm chuẩn (trang tổng hợp)" : "Trang tuyển sinh chính thức"}
                  </a>
                )}
                <NguonTungNam lc={lc} docs={nguon?.truong[lc.maTruong ?? ""]?.docs} />
              </div>
            </details>
            <div className="pt-0.5">
              <NutBaoSai maChuongTrinh={lc.id} tenNganh={`${lc.nganh} · ${lc.truong}`} />
            </div>
          </div>
        </section>

        <div className="pt-1">
          <Nut kieu="vien" bieuTuong={GitCompareArrows} onClick={soSanh}>So sánh ngành này</Nut>
        </div>
      </NoiDung>

      {/* Thanh dính dưới với 2 nút chính */}
      <div className="sticky bottom-0 z-20 border-t border-vien bg-nen px-4 pt-2.5 pb-1.5">
        <div className="grid grid-cols-[1fr_1.5fr] gap-2.5">
          <Nut kieu="vien" bieuTuong={Plus} onClick={themVao}>{trongDs ? "Đã trong Nguyện Vọng" : "+ Thêm Nguyện Vọng"}</Nut>
          {!laMucTieu && dat.ok && <Nut bieuTuong={Target} onClick={datLamMucTieu}>{s.mucTieu ? "Đổi mục tiêu" : "Đặt mục tiêu"}</Nut>}
        </div>
      </div>

      <HopTruot mo={hoiTiep !== null} dong={() => setHoiTiep(null)} tieuDe={hoiTiep === "daCo" ? "Đã có trong danh sách" : "Đã thêm nguyện vọng"}>
        <div className="flex items-center gap-3 rounded-the bg-luc-nhat p-3">
          <HuyHieuTruong ten={kyHieu(lc.truong)} tone={lc.tone} kichThuoc={44} />
          <div className="min-w-0">
            <b className="block text-[15px] text-muc">{lc.nganh} – {lc.truong}</b>
            <span className="text-[13px] text-chu">
              {hoiTiep === "daCo" ? "Đã có trong danh sách nguyện vọng." : `Đang là Nguyện Vọng ${s.nguyenVong.indexOf(lc.id) + 1}.`}
            </span>
          </div>
        </div>
        {/* Chưa có mục tiêu: mời đặt luôn ngành vừa thêm, để Hôm nay và Kế hoạch có việc ngay (không phải tự tìm nút). */}
        <p className="text-[14px] text-chu my-3">{!s.mucTieu && dat.ok ? "Bạn chưa có mục tiêu. Đặt ngành này làm mục tiêu để biết còn thiếu bao nhiêu điểm?" : "Xem danh sách đã cân đối chưa?"}</p>
        <div className="space-y-2">
          {!s.mucTieu && dat.ok && <Nut bieuTuong={Target} onClick={() => { setHoiTiep(null); datLamMucTieu(); }}>Đặt làm mục tiêu</Nut>}
          <Nut kieu={!s.mucTieu && dat.ok ? "vien" : "chinh"} bieuTuong={ListChecks} muiTen onClick={() => nav(DUONG_DAN.nguyenVong())}>Xem nguyện vọng</Nut>
          <Nut kieu="nhe" onClick={() => setHoiTiep(null)}>Ở lại xem</Nut>
        </div>
      </HopTruot>

      <HopChonLuaChon mo={chonThem} dong={() => setChonThem(false)} tieuDe="So sánh với trường nào?" boQua={[lc.id]}
        onChon={(l) => { setChonThem(false); nav(DUONG_DAN.soSanh(lc.id, l.id)); }} />
    </>
  );
}
