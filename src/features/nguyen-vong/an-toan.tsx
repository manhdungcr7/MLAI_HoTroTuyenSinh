// Màn 12 · Cơ cấu danh sách của em. Khung cảnh báo sinh từ danh sách thật, cơ cấu 4 nhãn,
// 3 điểm đánh giá, gợi ý hành động có tên trường cụ thể, tác vụ nhanh.
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowDownUp, CheckCircle2, ChevronRight, GraduationCap, Info, ListChecks, MapPin, Plus, Scale, School, ShieldCheck, ShieldPlus, SlidersHorizontal, TrendingDown, TrendingUp, Wallet,
  type LucideIcon,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { CAC_NHAN, NhanNguyenVongTag, ThanhCoCau } from "@/components/ui/co-cau";
import { HopTruot, ThanhTienDo, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron, HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HangBam, Nut, TONE_CHU, TONE_NEN, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU, tim } from "@/data/lua-chon-mau";
import { useBoLoc } from "@/features/kham-pha/dung-bo-loc";
import { DUONG_DAN } from "@/duong-dan";
import { diemDayDu } from "@/features/kham-pha/to-hop";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";
import { coHocPhi, hocPhiChu } from "@/data/lua-chon-phu";
import { CanhBaoThuTuThe, GhiChuDuLieu, ThanhHoanTac, useHoanTac } from "./thanh-phan";
import {
  canhBaoThuTu, chamDiem, toHopTotNhat, deXuatThuTu, demNhan, dungDanhSach, duaLenTruoc, giongNhau, goiYHanhDong, ketLuan, xetCoCau, type DiemDanhGia, type GoiY,
} from "./tinh-toan";
import { dinhDang } from "@/engine/dinh-dang";

const ICON_DIEM: Record<DiemDanhGia["khoa"], LucideIcon> = { canBang: Scale, taiChinh: Wallet, khuVuc: MapPin };
const VIEN_KHUNG: Record<ToneTen, string> = { do: "border-do/30", cam: "border-cam/40", luc: "border-luc/30", xanh: "border-xanh/30", tim: "border-tim/30", muc: "border-vien" };

export default function DanhSachAnToan() {
  const nav = useNavigate();
  const { s, datNguyenVong } = useApp();
  const [, suaBoLoc] = useBoLoc();
  const diemMon = diemDayDu(s);
  const tong = toHopTotNhat(diemMon).tong;
  const ds = useMemo(() => dungDanhSach(s.nguyenVong, diemMon, tim), [s.nguyenVong, s.diemThi, s.hoSo.diem]); // eslint-disable-line react-hooks/exhaustive-deps
  const dem = demNhan(ds);
  const coCau = xetCoCau(dem, ds.length);
  const kl = ketLuan(coCau);
  const diem = chamDiem(ds, s.hoSo, tong !== null);
  const goiY = tong === null ? [] : goiYHanhDong(ds, { diem: diemMon, hoSo: s.hoSo, tatCa: LUA_CHON_MAU, daCo: s.nguyenVong });
  const { tin, bao, an } = useHoanTac(6000);
  const [giaiThich, setGiaiThich] = useState<DiemDanhGia | "nhan" | null>(null);

  const canhBao = useMemo(() => canhBaoThuTu(ds), [ds]);
  const [xemTruoc, setXemTruoc] = useState<string[] | null>(null);

  /** Đặt cả danh sách theo thứ tự mới, báo kèm hoàn tác về thứ tự cũ. */
  const datThuTu = (moi: string[], chu: string) => {
    const cu = [...s.nguyenVong];
    datNguyenVong(moi);
    bao(chu, () => datNguyenVong(cu));
  };

  const duaLen = (c: ReturnType<typeof canhBaoThuTu>[number]) =>
    datThuTu(duaLenTruoc(s.nguyenVong, c.sau.id, c.truoc.id), `Đã đưa NV${c.sau.viTri + 1} lên trước NV${c.truoc.viTri + 1}`);

  const goiYThuTu = () => {
    const moi = deXuatThuTu(ds);
    if (giongNhau(s.nguyenVong, moi)) return bao("Thứ tự của bạn đã hợp lý, mình không cần đổi gì.");
    setXemTruoc(moi);
  };

  /** Mở Khám phá, đặt sẵn khoảng điểm chuẩn thấp hơn điểm bạn từ 1,5 điểm (ngưỡng An toàn). */
  const themAnToan = () => {
    if (tong !== null) suaBoLoc({ diemTu: Math.max(15, Math.floor(tong - 6)), diemDen: Math.min(30, Math.floor((tong - 1.5) * 10) / 10) });
    nav(DUONG_DAN.khamPha());
  };

  const dau = <DauTrangCoQuayLai tieuDe="Cơ cấu danh sách của bạn" quayLai={DUONG_DAN.nguyenVong()}
    phai={<button type="button" onClick={() => setGiaiThich("nhan")} aria-label="Cách xếp nhãn" className="size-11 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><Info size={21} /></button>} />;

  if (ds.length === 0) {
    return (
      <>
        {dau}
        <NoiDung>
          <TrangThaiTrong bieuTuong={<ListChecks size={26} />} tieuDe="Chưa có gì để xem" moTa="Bạn cần thêm ít nhất 1 nguyện vọng thì mình mới xem được cơ cấu danh sách.">
            <Nut bieuTuong={Plus} onClick={() => nav(DUONG_DAN.khamPha())}>Thêm nguyện vọng</Nut>
          </TrangThaiTrong>
        </NoiDung>
        <HopGiaiThich giaiThich={giaiThich} dong={() => setGiaiThich(null)} />
      </>
    );
  }

  return (
    <>
      {dau}
      <NoiDung>
        {tong === null ? (
          <DongThongBao tone="cam" icon={GraduationCap} tieuDe="Chưa đủ điểm để xếp nhãn"
            moTa="Nhập điểm Toán, Vật lý, Tiếng Anh để biết mỗi nguyện vọng là Thử sức, Vừa sức, An toàn hay Dự phòng."
            hanhDong="Nhập điểm ngay" onClick={() => nav(DUONG_DAN.batDau(2))} />
        ) : (
          <KhungCanhBao kl={kl} />
        )}

        <CanhBaoThuTuThe ds={canhBao} onDua={duaLen} />

        {tong !== null && ds.some((d) => d.lyDoKhongNhan) && (
          <The>
            <TieuDeMuc>Nguyện vọng chưa xếp được nhãn</TieuDeMuc>
            <ul className="space-y-2 text-[13px] text-chu-phu">
              {ds.filter((d) => d.lyDoKhongNhan).map((d) => (
                <li key={d.id}><b className="text-chu">NV{d.viTri + 1}{d.lc ? ` · ${d.lc.truong} – ${d.lc.nganh}` : ""}</b>: {d.lyDoKhongNhan}</li>
              ))}
            </ul>
          </The>
        )}

        {tong !== null && (
          <The>
            <TieuDeMuc phai={<span className="text-chu-phu font-semibold">{ds.length} nguyện vọng</span>}>So với điểm chuẩn</TieuDeMuc>
            <ThanhCoCau dem={dem} />
          </The>
        )}

        {tong !== null && (
          <>
            <TieuDeMuc>Gợi ý điều chỉnh</TieuDeMuc>
            {goiY.length === 0 ? (
              <DongThongBao tone="luc" icon={CheckCircle2} tieuDe="Chưa cần điều chỉnh"
                moTa="Có điểm thi thử mới thì quay lại xem nhãn có đổi không." />
            ) : goiY.map((g, i) => <TheGoiY key={g.loai} g={g} so={i + 1} nav={nav} />)}
          </>
        )}

        <TieuDeMuc>Đánh giá tổng quan</TieuDeMuc>
        {diem.map((d) => <TheDiem key={d.khoa} d={d} moGiaiThich={() => setGiaiThich(d)} boSung={() => nav(DUONG_DAN.batDau(d.khoa === "canBang" ? 2 : 3))} />)}

        <TieuDeMuc>Tác vụ nhanh</TieuDeMuc>
        <HangBam bieuTuong={ShieldPlus} tone="luc" tieuDe="Thêm nguyện vọng An toàn" onClick={themAnToan} />
        {tong !== null && ds.length > 1 && (
          <HangBam bieuTuong={ArrowDownUp} tone="cam" tieuDe="Gợi ý thứ tự" phu="Xem trước rồi mới đổi" onClick={goiYThuTu} />
        )}
        <HangBam bieuTuong={TrendingUp} tone="tim" tieuDe="Thử nếu tăng điểm" onClick={() => nav(DUONG_DAN.thuTinhHuong())} />

        <Nut bieuTuong={SlidersHorizontal} muiTen className="!mt-4" onClick={() => nav(DUONG_DAN.nguyenVong())}>Điều chỉnh danh sách</Nut>
        <GhiChuDuLieu />
      </NoiDung>

      <HopGiaiThich giaiThich={giaiThich} dong={() => setGiaiThich(null)} ds={ds} />
      <HopXemTruoc moi={xemTruoc} ds={ds} dong={() => setXemTruoc(null)}
        apDung={() => { if (xemTruoc) datThuTu(xemTruoc, "Đã áp dụng thứ tự gợi ý"); setXemTruoc(null); }} />
      <ThanhHoanTac tin={tin} an={an} />
    </>
  );
}

const MO_TA_NHAN: Record<(typeof CAC_NHAN)[number], string> = {
  "Thử sức": "điểm em thấp hơn điểm tham khảo",
  "Vừa sức": "điểm em cao hơn chưa tới 1,5 điểm",
  "An toàn": "điểm em cao hơn 1,5 đến dưới 4 điểm",
  "Dự phòng": "điểm em cao hơn từ 4 điểm trở lên",
};

/** Khung cảnh báo lớn, chữ sinh từ danh sách thật. */
function KhungCanhBao({ kl }: { kl: ReturnType<typeof ketLuan> }) {
  const Icon = kl.onDinh ? ShieldCheck : AlertTriangle;
  return (
    <div role={kl.onDinh ? undefined : "alert"} className={gop("rounded-lon border p-4 flex gap-3", TONE_NEN[kl.tone], VIEN_KHUNG[kl.tone])}>
      <BieuTuongTron icon={Icon} tone={kl.tone} kichThuoc={44} />
      <div className="flex-1 min-w-0">
        <p className={gop("font-extrabold text-[17px] leading-snug", TONE_CHU[kl.tone])}>{kl.tieuDe}</p>
        <p className="mt-1 text-[15px] text-chu leading-snug">{kl.hienTrang}</p>
        {kl.nenLam && <p className="mt-1.5 text-[15px] text-chu leading-snug"><b className={TONE_CHU[kl.tone]}>{kl.nenLam}</b> {kl.lyDo}</p>}
        {!kl.nenLam && kl.lyDo && <p className="mt-1 text-[14px] text-chu-phu leading-snug">{kl.lyDo}</p>}
      </div>
    </div>
  );
}

function TheDiem({ d, moGiaiThich, boSung }: { d: DiemDanhGia; moGiaiThich: () => void; boSung: () => void }) {
  const Icon = ICON_DIEM[d.khoa];
  return (
    <The className="!p-3.5">
      <div className="flex items-start gap-3">
        <BieuTuongTron icon={Icon} tone={d.diem === null ? "xanh" : d.tone} kichThuoc={42} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center min-w-0 -my-2">
              <b className="text-[15px] text-muc">{d.ten}</b>
              <button type="button" onClick={moGiaiThich} aria-label={`Cách tính ${d.ten.toLowerCase()}`} className="size-11 -mr-2 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat shrink-0">
                <Info size={17} />
              </button>
            </span>
            {d.diem !== null && <span className="whitespace-nowrap"><b className={gop("text-[22px] font-extrabold", TONE_CHU[d.tone])}>{d.diem}</b><span className="text-[13px] text-chu-phu">/100</span></span>}
          </div>
          <p className={gop("text-[14px] font-bold", d.diem === null ? "text-chu-phu" : TONE_CHU[d.tone])}>{d.nhanXet}</p>
          {d.diem !== null && <div className="mt-1.5"><ThanhTienDo phanTram={d.diem} tone={d.tone} /></div>}
          {d.diem === null && <p className="mt-1.5 text-[13px] text-chu-phu leading-snug">{d.chiTiet}</p>}
          {d.diem === null && (
            <button type="button" onClick={boSung} className="mt-1 min-h-11 inline-flex items-center gap-1 text-[14px] font-bold text-xanh">
              {d.khoa === "canBang" ? "Nhập điểm" : "Bổ sung ngay"}<ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </The>
  );
}

const DANG_GOI_Y: Record<GoiY["loai"], { icon: LucideIcon; tone: ToneTen; nut: string }> = {
  themAnToan: { icon: ShieldPlus, tone: "luc", nut: "Tìm thêm nguyện vọng An toàn" },
  giamThuSuc: { icon: TrendingDown, tone: "xanh", nut: "Sửa danh sách" },
  themPhuHop: { icon: School, tone: "cam", nut: "Xem thêm trường phù hợp" },
};

function TheGoiY({ g, so, nav }: { g: GoiY; so: number; nav: ReturnType<typeof useNavigate> }) {
  const k = DANG_GOI_Y[g.loai];
  const den = g.loai === "giamThuSuc" ? DUONG_DAN.nguyenVong() : DUONG_DAN.khamPha();
  return (
    <div className={gop("rounded-the p-3.5", TONE_NEN[k.tone])}>
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          <BieuTuongTron icon={k.icon} tone={k.tone} kichThuoc={40} />
          <span className="absolute -top-1 -left-1 size-5 rounded-full bg-trang text-[11px] font-extrabold text-muc grid place-items-center shadow-the">{so}</span>
        </span>
        <div className="flex-1 min-w-0">
          <p className={gop("font-extrabold text-[15px] leading-snug", TONE_CHU[k.tone])}>{g.tieuDe}</p>
          <p className="mt-0.5 text-[13px] text-chu leading-snug">{g.moTa}</p>
        </div>
      </div>

      {(g.truong.length > 0 || g.thuSuc.length > 0) && (
        <ul className="mt-3 space-y-2">
          {g.truong.map(({ lc, nhan }) => (
            <li key={lc.id}>
              <DongTruong onClick={() => nav(DUONG_DAN.chiTiet(lc.id))} truong={lc.truong} tone={lc.tone} ten={lc.nganh}
                phu={`${lc.truong} · ${dinhDang(lc.diemMin, 1)} điểm (${lc.namDiem}) · ${coHocPhi(lc) ? `${hocPhiChu(lc)} tr/năm` : "chưa có học phí"} · ${lc.khuVuc}`}
                nhan={<NhanNguyenVongTag nhan={nhan} />} />
            </li>
          ))}
          {g.thuSuc.map((d) => d.lc && (
            <li key={d.id}>
              <DongTruong onClick={() => nav(DUONG_DAN.chiTiet(d.id))} truong={d.lc.truong} tone={d.lc.tone} ten={`NV${d.viTri + 1} · ${d.lc.nganh}`}
                phu={`${d.lc.truong} · ${dinhDang(d.lc.diemMin, 1)} điểm (${d.lc.namDiem})`} nhan={<NhanNguyenVongTag nhan="Thử sức" />} />
            </li>
          ))}
        </ul>
      )}
      {g.loai !== "giamThuSuc" && g.truong.length === 0 && (
        <p className="mt-2 text-[13px] text-chu-phu">Chưa có ngành vừa điểm và vừa ngân sách.</p>
      )}

      <Nut kieu="vien" muiTen className="mt-3" onClick={() => nav(den)}>{k.nut}</Nut>
    </div>
  );
}

function DongTruong({ truong, tone, ten, phu, nhan, onClick }: { truong: string; tone: ToneTen; ten: string; phu: string; nhan: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full min-h-14 flex items-center gap-2.5 rounded-xl bg-trang/90 border border-vien px-2.5 py-2 text-left active:bg-xanh-nhat">
      <HuyHieuTruong ten={truong} tone={tone} kichThuoc={34} />
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <b className="text-[14px] text-muc leading-snug">{ten}</b>
          {nhan}
        </span>
        <span className="block text-[12.5px] text-chu-phu leading-snug">{phu}</span>
      </span>
      <ChevronRight size={16} className="text-chu-phu shrink-0" />
    </button>
  );
}

/** Xem trước thứ tự đề xuất: chưa đổi gì cho tới khi em bấm áp dụng. */
function HopXemTruoc({ moi, ds, dong, apDung }: { moi: string[] | null; ds: ReturnType<typeof dungDanhSach>; dong: () => void; apDung: () => void }) {
  return (
    <HopTruot mo={moi !== null} dong={dong} tieuDe="Gợi ý thứ tự">
      {moi && (
        <div className="space-y-3 text-[14px] text-chu">
          <p>Đưa các lựa chọn An toàn và Dự phòng xuống cuối, giữ nguyên thứ tự ưu tiên các ngành còn lại của bạn.</p>
          <ol className="space-y-1.5">
            {moi.map((id, i) => {
              const d = ds.find((x) => x.id === id);
              return (
                <li key={id} className="flex items-center gap-2 text-[13px]">
                  <b className="w-9 shrink-0 text-muc">NV{i + 1}</b>
                  <span className="flex-1 min-w-0 truncate">{d?.lc ? `${d.lc.truong} · ${d.lc.nganh}` : "Lựa chọn không còn trong dữ liệu"}</span>
                  {d?.nhan && <NhanNguyenVongTag nhan={d.nhan} />}
                  {d && d.viTri !== i && <span className="shrink-0 text-chu-phu">(trước là NV{d.viTri + 1})</span>}
                </li>
              );
            })}
          </ol>
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={dong}>Giữ nguyên</Nut>
            <Nut onClick={apDung}>Áp dụng</Nut>
          </div>
        </div>
      )}
    </HopTruot>
  );
}

function HopGiaiThich({ giaiThich, dong, ds = [] }: { giaiThich: DiemDanhGia | "nhan" | null; dong: () => void; ds?: ReturnType<typeof dungDanhSach> }) {
  const coToHop = ds.filter((d) => d.toHop && d.lc);
  const laNhan = giaiThich === "nhan";
  return (
    <HopTruot mo={giaiThich !== null} dong={dong} tieuDe={laNhan ? "Cách xếp nhãn" : giaiThich ? `Cách tính: ${giaiThich.ten}` : ""}>
      {laNhan ? (
        <div className="space-y-3 text-[14px] text-chu">
          <p>So điểm hiện tại của bạn (theo tổ hợp của từng ngành) với điểm chuẩn năm trước:</p>
          <ul className="space-y-2">
            {CAC_NHAN.map((n) => <li key={n} className="flex items-center gap-2"><NhanNguyenVongTag nhan={n} /><span>{MO_TA_NHAN[n]}</span></li>)}
          </ul>
          {coToHop.length > 0 && (
            <div>
              <p className="font-bold text-muc">Tổ hợp dùng để tính</p>
              <ul className="mt-1 space-y-0.5 text-[13px] text-chu-phu">
                {coToHop.map((d) => <li key={d.id}>NV{d.viTri + 1} · {d.lc!.truong}: {d.toHop}{d.suyRa ? " (suy ra, đề án chưa ghi)" : ""}</li>)}
              </ul>
            </div>
          )}
          <p className="text-chu-phu text-[13px]">Nhãn là gợi ý để cân bằng danh sách, điểm chuẩn mỗi năm có thể dao động.</p>
        </div>
      ) : giaiThich ? (
        <div className="space-y-2 text-[14px] text-chu">
          {giaiThich.cachTinh.map((c) => <p key={c}>{c}</p>)}
          <p className="text-chu-phu text-[13px] pt-1">Đây là điểm gợi ý trên 100, không phải khả năng đậu.</p>
        </div>
      ) : null}
      <Nut kieu="nhe" className="mt-4" onClick={dong}>Đã hiểu</Nut>
    </HopTruot>
  );
}
