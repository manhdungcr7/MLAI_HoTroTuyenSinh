// Màn 11 · Danh sách nguyện vọng: NV1..NVn, nhãn tính từ điểm của bạn, kéo thả + nút lên/xuống, xóa có hoàn tác.
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, ChevronUp, ClipboardPen, GraduationCap, GripVertical, Heart, ListPlus, Plus, Search, ShieldCheck, Sparkles, Trash2, TrendingUp,
} from "lucide-react";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { NhanNguyenVongTag } from "@/components/ui/co-cau";
import { BieuTuongTron, HuyHieuTruong, NenHero } from "@/components/ui/hinh-nen";
import { HangBam, Nut, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import type { NhanNguyenVong } from "@/state/types";
import { GoiYSheet, NutGoiYDanhSach } from "./goi-y-sheet";
import { useKeoTha } from "./dung-keo-tha";
import { CanhBaoThuTuThe, ThanhHoanTac, useHoanTac } from "./thanh-phan";
import { SO_NV_GOI_Y, canhBaoThuTu, demNhan, dungDanhSach, ketLuan, toHopTotNhat, xetCoCau, type DongNV } from "./tinh-toan";
import { dinhDang } from "@/engine/dinh-dang";
import { HopTruot } from "@/components/ui/hien-thi";
import { HopChonLuaChon, kyHieu, khoangDiem } from "@/features/kham-pha/thanh-phan";
import { ChanDoanDanhMucCard } from "./chan-doan-danh-muc";
import { FitIndicator, MajorLabel, PreferenceSummary, ProgramVariant, UniversityLabel } from "@/components/ui/academic-display";
import { phanGiaiTenTruong, toAcademicDisplay } from "@/engine/trinh-bay-hoc-thuat";

const CAC_LOAI_NHAN: { nhan: NhanNguyenVong; moTa: string }[] = [
  { nhan: "Thử sức", moTa: "Điểm chuẩn lịch sử cao hơn điểm của bạn" },
  { nhan: "Vừa sức", moTa: "Điểm của bạn thấp hơn điểm chuẩn lịch sử tối đa 1,5 điểm" },
  { nhan: "An toàn", moTa: "Điểm của bạn cao hơn điểm chuẩn lịch sử từ 1,5 đến dưới 4 điểm" },
  { nhan: "Dự phòng", moTa: "Điểm của bạn cao hơn điểm chuẩn lịch sử từ 4 điểm" },
];

/** Danh sách chưa có ngành nào: một thẻ hành động chính, rồi cách xếp danh sách để bạn biết mình sẽ nhận được gì. */
function TrangNguyenVongTrong({ coDiem, onGoiY, onNhapDiem, onKhamPha }: { coDiem: boolean; onGoiY: () => void; onNhapDiem: () => void; onKhamPha: () => void }) {
  return (
    <>
      <NenHero tone="xanh" className="p-5">
        <span className="flex items-start gap-3">
          <BieuTuongTron icon={Heart} tone="xanh" kichThuoc={48} />
          <span className="min-w-0">
            <b className="block text-[18px] leading-snug text-muc">Bắt đầu lập danh sách</b>
            <span className="block text-[14px] text-chu mt-1">
              {coDiem ? "Mình xếp sẵn 6 ngành hợp điểm và sở thích của bạn, bạn bớt hoặc đổi sau." : "Nhập điểm các môn để mình gợi ý ngành vừa sức với bạn."}
            </span>
          </span>
        </span>
        <div className="mt-4 space-y-2">
          <Nut muiTen bieuTuong={Sparkles} onClick={coDiem ? onGoiY : onNhapDiem}>{coDiem ? "Gợi ý danh sách" : "Nhập điểm"}</Nut>
          <Nut kieu="vien" bieuTuong={Plus} onClick={onKhamPha}>Tự chọn trong Khám phá</Nut>
        </div>
      </NenHero>
      <div className="rounded-the bg-trang border border-vien p-4">
        <b className="block text-[15px] text-muc">Danh sách cân bằng có 4 loại</b>
        <ul className="mt-3 space-y-2.5">
          {CAC_LOAI_NHAN.map((x) => (
            <li key={x.nhan} className="flex items-start gap-3">
              <span className="w-[72px] shrink-0 pt-0.5"><NhanNguyenVongTag nhan={x.nhan} /></span>
              <span className="text-[14px] text-chu leading-snug">{x.moTa}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-chu-phu">Nên giữ 5–6 nguyện vọng, xếp từ mong muốn nhất xuống an toàn nhất.</p>
      </div>
    </>
  );
}

const tenNgan = (d: DongNV) => (d.lc ? `${d.lc.truong} · ${d.lc.nganh}` : "lựa chọn này");

export default function DanhSachNguyenVong() {
  const nav = useNavigate();
  const { s, datNguyenVong, themNguyenVong, xoaNguyenVong, doiViTri } = useApp();
  const diemMon = diemDayDu(s);
  const tongTot = toHopTotNhat(diemMon);
  const tong = tongTot.tong;
  const ds = dungDanhSach(s.nguyenVong, diemMon, tim);
  const dsYeuThich = useMemo(() => s.yeuThich.map(tim).filter((l): l is NonNullable<typeof l> => !!l), [s.yeuThich]);
  const coCau = xetCoCau(demNhan(ds), ds.length);
  const kl = ketLuan(coCau);
  const canhBao = useMemo(() => canhBaoThuTu(ds), [ds]);
  const { tin, bao, an } = useHoanTac();
  const [moTim, setMoTim] = useState(false);
  const [moGoiY, setMoGoiY] = useState(false);
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);

  /** Chuyển một nguyện vọng tới vị trí mới, báo kèm nút hoàn tác. */
  const chuyen = useCallback((tu: number, den: number) => {
    if (den < 0 || den >= s.nguyenVong.length || tu === den) return;
    const d = ds[tu];
    doiViTri(tu, den);
    bao(`Đã chuyển ${d?.lc?.truong ?? "nguyện vọng"} sang Nguyện Vọng ${den + 1}`, () => doiViTri(den, tu));
  }, [ds, doiViTri, bao, s.nguyenVong.length]);

  const { keo, tayNam, kieuHang, ganHang } = useKeoTha(ds.length, chuyen);

  const xoa = (id: string) => {
    const viTri = s.nguyenVong.indexOf(id);
    const d = ds[viTri];
    const snapshotCu = [...s.nguyenVong];
    xoaNguyenVong(id);
    // Hoàn tác: khôi phục chính xác danh sách cũ bằng snapshot
    bao(`Đã xóa Nguyện Vọng ${viTri + 1} · ${d?.lc?.truong ?? "nguyện vọng"}`, () => datNguyenVong(snapshotCu));
  };

  const themTatCaYeuThich = useCallback(() => {
    const chuaThem = dsYeuThich.filter((l) => !s.nguyenVong.includes(l.id));
    if (chuaThem.length === 0) return;
    datNguyenVong([...s.nguyenVong, ...chuaThem.map((l) => l.id)]);
    bao(`Đã thêm ${chuaThem.length} ngành yêu thích vào danh sách`);
  }, [dsYeuThich, s.nguyenVong, datNguyenVong, bao]);

  const themNganhYeuThich = useCallback((id: string, nganh: string, truong: string) => {
    themNguyenVong(id);
    bao(`Đã thêm ${nganh} – ${truong} vào nguyện vọng`);
  }, [themNguyenVong, bao]);

  return (
    <>
      <DauTrangChinh tieuDe="Danh sách nguyện vọng" />
      <NoiDung>
        {ds.length === 0 ? (
          <>
            {dsYeuThich.length > 0 ? (
              <TheDanhSachYeuThich
                dsYeuThich={dsYeuThich}
                nguyenVong={s.nguyenVong}
                onThemTatCa={themTatCaYeuThich}
                onThemMot={themNganhYeuThich}
                onDieuHuong={(id) => nav(DUONG_DAN.chiTiet(id))}
                onKhamPhaThem={() => nav(DUONG_DAN.khamPha())}
                onMoGoiY={() => setMoGoiY(true)}
              />
            ) : (
              <TrangNguyenVongTrong coDiem={tong !== null} onGoiY={() => setMoGoiY(true)} onNhapDiem={() => nav(DUONG_DAN.batDau(2))} onKhamPha={() => nav(DUONG_DAN.khamPha())} />
            )}
          </>
        ) : (
          <>
            {tong !== null && (
              <ChanDoanDanhMucCard
                danhSachIds={s.nguyenVong}
                diemMon={diemMon}
                hoSo={{ nganSach: s.hoSo.nganSach, khuVuc: s.hoSo.khuVuc, nganhQuanTam: s.hoSo.nganhQuanTam, uuTienTuyenSinh: s.hoSo.uuTienTuyenSinh }}
                onApDungThuTuMoi={(idsMoi, thongBao) => {
                  const cu = [...s.nguyenVong];
                  datNguyenVong(idsMoi);
                  bao(thongBao, () => datNguyenVong(cu));
                }}
                onThayDoiDanhSach={(idsMoi, thongBao) => {
                  const cu = [...s.nguyenVong];
                  datNguyenVong(idsMoi);
                  bao(thongBao, () => datNguyenVong(cu));
                }}
                onXemChiTietAnToan={() => nav(DUONG_DAN.nguyenVongAnToan())}
              />
            )}
            <ThanhChiSo tong={ds.length} dem={coCau.dem} />
            <button
              type="button"
              onClick={() => nav(DUONG_DAN.nguyenVongAnToan())}
              className={gop(
                "w-full rounded-2xl border p-3.5 text-left transition-colors flex items-center gap-3 shadow-xs",
                kl.tone === "do" ? "bg-do-nhat/40 border-do/30 active:bg-do-nhat/70" :
                kl.tone === "cam" ? "bg-cam-nhat/40 border-cam/30 active:bg-cam-nhat/70" :
                "bg-trang border-vien active:bg-xanh-nhat"
              )}
            >
              <div
                className={gop(
                  "size-9 rounded-xl grid place-items-center shrink-0",
                  kl.tone === "do" ? "bg-do/15 text-do" :
                  kl.tone === "cam" ? "bg-cam/15 text-cam-chu" :
                  "bg-xanh-nhat text-xanh"
                )}
              >
                <ShieldCheck size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-muc leading-snug">
                  {tong === null
                    ? "Nhập đủ điểm 3 môn để xếp nhãn"
                    : kl.tieuDe === "Chưa có nguyện vọng điểm chuẩn thấp hơn điểm của bạn"
                    ? "Chưa có nguyện vọng an toàn"
                    : kl.tieuDe}
                </p>
                <p className="text-[12px] text-chu-phu leading-normal mt-0.5">
                  {tong === null
                    ? "Hệ thống cần điểm tổ hợp để phân tích 3 tầng"
                    : kl.tieuDe === "Chưa có nguyện vọng điểm chuẩn thấp hơn điểm của bạn"
                    ? "Cần thêm trường điểm chuẩn thấp hơn để dự phòng"
                    : kl.nenLam ?? "Bấm để xem chi tiết cơ cấu danh sách"}
                </p>
              </div>
              <ChevronRight size={18} className="text-chu-phu shrink-0" />
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => setMoTim(true)} aria-label="Tìm ngành để thêm vào danh sách"
                className="flex-1 min-w-0 min-h-11 flex items-center gap-2 rounded-xl bg-trang border border-vien px-3 text-left text-[14px] text-chu-phu active:bg-xanh-nhat">
                <Search size={18} className="shrink-0" /><span className="truncate">Tìm ngành để thêm</span>
              </button>
              <button type="button" onClick={() => setMoGoiY(true)} aria-label="Gợi ý danh sách phù hợp"
                className="min-h-11 px-3.5 rounded-xl bg-xanh-nhat text-xanh font-bold text-[14px] inline-flex items-center gap-1.5 shrink-0 active:brightness-95">
                <Sparkles size={18} />Gợi ý
              </button>
            </div>

            {dsYeuThich.some((l) => !s.nguyenVong.includes(l.id)) && (
              <TheDanhSachYeuThich
                dsYeuThich={dsYeuThich}
                nguyenVong={s.nguyenVong}
                onThemTatCa={themTatCaYeuThich}
                onThemMot={themNganhYeuThich}
                onDieuHuong={(id) => nav(DUONG_DAN.chiTiet(id))}
                choPhepThuGon={true}
              />
            )}

            {tong === null && (
              <DongThongBao tone="cam" icon={GraduationCap} tieuDe="Chưa đủ điểm để xếp nhãn"
                moTa="Nhập điểm các môn theo tổ hợp xét tuyển để biết mỗi nguyện vọng là Thử sức, Vừa sức, An toàn hay Dự phòng."
                hanhDong="Nhập điểm ngay" onClick={() => nav(s.diemThi.length ? DUONG_DAN.diemThiThu() : DUONG_DAN.batDau(2))} />
            )}

            {ds.length > SO_NV_GOI_Y && (
              <DongThongBao tone="xanh" icon={ListPlus} tieuDe={`Bạn đang có ${ds.length} nguyện vọng`}
                moTa={`Khoảng 5–${SO_NV_GOI_Y} nguyện vọng là dễ cân nhắc nhất.`} />
            )}

            <CanhBaoThuTuThe ds={canhBao} onDua={(c) => chuyen(c.sau.viTri, c.truoc.viTri)} />

            <ol className={gop("space-y-2", keo && "select-none")} aria-label="Danh sách nguyện vọng theo thứ tự ưu tiên">
              {ds.map((d, i) => (
                <li key={d.id} ref={ganHang(i)} style={kieuHang(i)} className={gop("rounded-2xl bg-trang border border-vien shadow-xs overflow-hidden", keo?.tu === i && "ring-2 ring-xanh")}>
                  <HangNguyenVong d={d} soHang={ds.length} chuaDuDiem={tong === null} dangKeo={keo?.tu === i}
                    tayNam={tayNam(i)} onLen={() => chuyen(i, i - 1)} onXuong={() => chuyen(i, i + 1)}
                    onMo={() => d.lc && nav(DUONG_DAN.chiTiet(d.id))} onXoa={() => setHoiXoa(d.id)} />
                </li>
              ))}
            </ol>

            <Nut bieuTuong={Plus} onClick={() => nav(DUONG_DAN.khamPha())}>Thêm trong Khám phá</Nut>

            <div className="grid grid-cols-2 gap-2">
              <HangBam bieuTuong={TrendingUp} tone="tim" tieuDe="Thử tăng điểm" onClick={() => nav(DUONG_DAN.thuTinhHuong())} />
              <HangBam bieuTuong={ClipboardPen} tone="cam" tieuDe="Nhập thi thử" onClick={() => nav(DUONG_DAN.diemThiThu())} />
            </div>
          </>
        )}
      </NoiDung>

      <HopChonLuaChon mo={moTim} dong={() => setMoTim(false)} tieuDe="Thêm vào nguyện vọng" boQua={s.nguyenVong}
        onChon={(l) => { setMoTim(false); themNganhYeuThich(l.id, l.nganh, l.truong); }} />
      <GoiYSheet mo={moGoiY} dong={() => setMoGoiY(false)} />
      <ThanhHoanTac tin={tin} an={an} />
      <HopTruot mo={hoiXoa !== null} dong={() => setHoiXoa(null)} tieuDe="Xóa nguyện vọng này?">
        <p className="text-[14px] text-chu mb-4">Em có thể thêm lại ngành trong Khám phá hoặc hoàn tác sau khi xóa.</p>
        <div className="grid grid-cols-2 gap-2">
          <Nut kieu="vien" onClick={() => setHoiXoa(null)}>Giữ lại</Nut>
          <Nut kieu="nguyHiem" onClick={() => { if (hoiXoa) xoa(hoiXoa); setHoiXoa(null); }}>Xóa</Nut>
        </div>
      </HopTruot>
    </>
  );
}

/** Tóm tắt dạng dòng, giữ Dự phòng thành nhóm riêng và tính cả lựa chọn chưa xếp nhãn. */
function ThanhChiSo({ tong, dem }: { tong: number; dem: Record<NhanNguyenVong, number> }) {
  return <PreferenceSummary tong={tong} dem={dem} />;
}

const NUT_NHO = "size-11 grid place-items-center rounded-xl text-chu-phu active:bg-xanh-nhat disabled:opacity-35 disabled:pointer-events-none";

function HangNguyenVong({ d, soHang, chuaDuDiem, dangKeo, tayNam, onLen, onXuong, onMo, onXoa }: {
  d: DongNV; soHang: number; chuaDuDiem: boolean; dangKeo: boolean;
  tayNam: ReturnType<ReturnType<typeof useKeoTha>["tayNam"]>;
  onLen: () => void; onXuong: () => void; onMo: () => void; onXoa: () => void;
}) {
  const nv = `Nguyện Vọng ${d.viTri + 1}`;
  const lc = d.lc;
  const coChuan = !!lc && lc.diemMin > 0;
  const link = lc && (lc.linkNguon || (/^https?:/.test(lc.nguon) ? lc.nguon : ""));
  const model = toAcademicDisplay(lc, d.nhan);
  const truong = lc ? phanGiaiTenTruong(lc.maTruong || lc.truong, lc.tenTruong) : null;
  return (
    <div className="p-3.5">
      <div className="flex items-center gap-2">
        <button type="button" {...tayNam} aria-label={`Kéo để đổi thứ tự ${nv}`} aria-roledescription="tay nắm kéo thả"
          onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); onLen(); } if (e.key === "ArrowDown") { e.preventDefault(); onXuong(); } }}
          className={gop("size-11 -ml-1 rounded-lg grid place-items-center text-chu-phu touch-none shrink-0", dangKeo ? "cursor-grabbing text-xanh" : "cursor-grab")}>
          <GripVertical size={18} />
        </button>
        <span className="text-[13px] font-extrabold text-muc">NV {String(d.viTri + 1).padStart(2, "0")}</span>
        <span className="ml-auto"><FitIndicator fitCategory={d.nhan} chuaDuDiem={chuaDuDiem} /></span>
      </div>

      {lc && model ? (
        <button type="button" onClick={onMo} className="w-full text-left mt-1.5 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh" aria-label={`Mở chi tiết ${model.majorNameDisplay} tại ${model.universityNameDisplay}`}>
          <MajorLabel ten={model.majorNameDisplay} className="text-[16px]" />
          <UniversityLabel tenHienThi={model.universityNameDisplay} daXacMinh={!!truong?.daXacMinh} className="mt-1 block text-[14px]" />
          {model.programVariant && <ProgramVariant variant={model.programVariant} className="mt-1.5" />}
          {!truong?.daXacMinh && <span className="block mt-1 text-[12px] text-cam-chu">Chưa xác minh tên trường</span>}
        </button>
      ) : (
        <p className="mt-1 text-[14px] text-chu"><b>Chưa có dữ liệu</b><span className="block text-[13px] text-chu-phu">Lựa chọn này không còn trong danh mục. Em có thể xóa đi.</span></p>
      )}

      {lc && (
        <details className="mt-2 border-t border-vien/70 pt-2 text-[13px]">
          <summary className="min-h-11 inline-flex cursor-pointer list-none items-center gap-1.5 font-semibold text-xanh focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh rounded">
            Xem điểm và thông tin <ChevronDown size={16} aria-hidden />
          </summary>
          <div className="space-y-1.5 pb-1 text-chu">
            <p>{coChuan ? <>Điểm chuẩn năm {lc.namDiem}: <b>{dinhDang(lc.diemMin, 1)}</b></> : "Chưa có điểm chuẩn tham khảo"}</p>
            <p>{d.chenh !== null && coChuan ? <>Điểm của em: <b>{dinhDang(lc.diemMin + d.chenh, 1)}</b> <span className={d.chenh < 0 ? "text-cam-chu" : "text-luc-chu"}>({d.chenh < 0 ? "−" : "+"}{dinhDang(Math.abs(d.chenh), 1)} so với điểm chuẩn)</span></> : <span className="text-chu-phu">{d.lyDoKhongNhan ?? "Chưa có điểm để đối chiếu"}</span>}</p>
            {d.toHop && <p>Tổ hợp: <b>{d.toHop}</b>{d.suyRa ? " (tổ hợp có điểm cao nhất của em)" : ""}</p>}
            <p>Tên ngành trong danh mục: {model?.majorNameOfficial ?? lc.nganh}</p>
            <p>Tên trường đầy đủ: {model?.universityNameOfficial ?? lc.tenTruong}</p>
            <p>Nguồn: {model?.sourceStatus === "de_an_chinh_thuc" ? "đề án tuyển sinh của trường" : model?.sourceStatus === "da_kiem_chung" ? "đã kiểm chứng" : "nguồn tổng hợp"}</p>
            {link && <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-xanh">Xem nguồn điểm chuẩn</a>}
          </div>
        </details>
      )}

      <div className="mt-1 flex items-center border-t border-vien/70 pt-1">
        <button type="button" onClick={onLen} disabled={d.viTri === 0} aria-label={`Đưa ${tenNgan(d)} lên trên`} className={NUT_NHO}><ArrowUp size={20} /></button>
        <button type="button" onClick={onXuong} disabled={d.viTri === soHang - 1} aria-label={`Đưa ${tenNgan(d)} xuống dưới`} className={NUT_NHO}><ArrowDown size={20} /></button>
        <span className="flex-1" />
        <button type="button" onClick={onXoa} aria-label={`Xóa ${nv}`} className={gop(NUT_NHO, "text-do-chu active:bg-do-nhat")}><Trash2 size={19} /></button>
      </div>
    </div>
  );
}

/** Thẻ hiển thị các ngành học sinh đã thả tim/lưu yêu thích, cho phép xem chi tiết, thêm từng ngành hoặc thêm tất cả. */
function TheDanhSachYeuThich({
  dsYeuThich,
  nguyenVong,
  onThemTatCa,
  onThemMot,
  onDieuHuong,
  choPhepThuGon = false,
  onKhamPhaThem,
  onMoGoiY,
}: {
  dsYeuThich: NonNullable<ReturnType<typeof tim>>[];
  nguyenVong: string[];
  onThemTatCa: () => void;
  onThemMot: (id: string, nganh: string, truong: string) => void;
  onDieuHuong: (id: string) => void;
  choPhepThuGon?: boolean;
  onKhamPhaThem?: () => void;
  onMoGoiY?: () => void;
}) {
  const yeuThichChuaThem = useMemo(
    () => dsYeuThich.filter((l) => !nguyenVong.includes(l.id)),
    [dsYeuThich, nguyenVong]
  );
  const soDaThem = dsYeuThich.length - yeuThichChuaThem.length;
  const [thuGon, setThuGon] = useState(false);

  if (dsYeuThich.length === 0) return null;

  return (
    <div className="rounded-the bg-trang border border-vien p-4 shadow-the space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-9 rounded-xl bg-do/10 text-do grid place-items-center shrink-0">
            <Heart size={20} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-muc leading-tight">
              Ngành đã lưu ({dsYeuThich.length})
            </h2>
            <p className="text-[12px] text-chu-phu mt-0.5">
              {yeuThichChuaThem.length > 0
                ? (soDaThem > 0
                    ? `Đã thêm ${soDaThem}/${dsYeuThich.length} · Còn ${yeuThichChuaThem.length} ngành`
                    : "Chọn nhanh để đưa vào danh sách Nguyện Vọng")
                : `Đã đưa tất cả ${dsYeuThich.length} ngành vào Nguyện Vọng`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {yeuThichChuaThem.length > 0 && (
            <button
              type="button"
              onClick={onThemTatCa}
              className="min-h-8.5 px-2.5 rounded-lg bg-xanh text-white text-[12px] font-bold active:brightness-95 cursor-pointer shadow-sm shrink-0"
            >
              + Thêm tất cả {soDaThem > 0 ? `(${yeuThichChuaThem.length})` : ""}
            </button>
          )}
          {choPhepThuGon && (
            <button
              type="button"
              onClick={() => setThuGon((t) => !t)}
              aria-label={thuGon ? "Mở rộng danh sách đã lưu" : "Thu gọn danh sách đã lưu"}
              className="size-8.5 rounded-lg border border-vien bg-nen hover:bg-vien/40 grid place-items-center text-chu-phu shrink-0 transition-colors"
            >
              {thuGon ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
            </button>
          )}
        </div>
      </div>

      {!thuGon && (
        <>
          <ul className="divide-y divide-vien border-t border-vien pt-1">
            {dsYeuThich.map((l) => {
              const daThem = nguyenVong.includes(l.id);
              const viTriNV = nguyenVong.indexOf(l.id);
              const model = toAcademicDisplay(l);
              return (
                <li key={l.id} className="py-2.5 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onDieuHuong(l.id)}
                    className="flex items-center gap-2.5 text-left min-w-0 flex-1 active:opacity-75 cursor-pointer"
                  >
                    <HuyHieuTruong ten={kyHieu(model?.universityCode || l.truong)} tone={l.tone} kichThuoc={38} />
                    <div className="min-w-0 flex-1">
                      <b className="block text-[14px] text-muc leading-tight truncate">{model?.majorNameDisplay ?? l.nganh}</b>
                      <span className="block text-[12px] text-chu-phu truncate mt-0.5">
                        {model?.universityNameDisplay ?? l.truong} · {l.khuVuc} · {khoangDiem(l)} điểm
                      </span>
                      {model?.programVariant && (
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-xanh bg-xanh-nhat px-1.5 py-0.2 rounded">
                          {model.programVariant}
                        </span>
                      )}
                    </div>
                  </button>
                  {daThem ? (
                    <span
                      title={`Đã ở vị trí Nguyện Vọng ${viTriNV + 1} trong danh sách`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-luc-nhat text-luc-chu text-[12px] font-bold shrink-0 border border-luc/30"
                    >
                      <Check size={13} className="stroke-[2.5]" /> Nguyện Vọng {viTriNV + 1}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onThemMot(l.id, l.nganh, l.truong)}
                      className="min-h-9 px-2.5 rounded-lg bg-xanh-nhat text-xanh text-[12px] font-bold shrink-0 active:bg-xanh/20 cursor-pointer"
                    >
                      + Thêm vào Nguyện Vọng
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {(onKhamPhaThem || onMoGoiY) && (
            <div className="pt-2 border-t border-vien flex gap-2">
              {onKhamPhaThem && (
                <Nut kieu="vien" bieuTuong={Plus} onClick={onKhamPhaThem}>
                  Khám phá thêm
                </Nut>
              )}
              {onMoGoiY && <NutGoiYDanhSach onMo={onMoGoiY} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

