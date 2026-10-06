// Màn 12 · Danh sách có an toàn không? Khung cảnh báo sinh từ danh sách thật, cơ cấu 4 nhãn,
// 3 điểm đánh giá, gợi ý hành động có tên trường cụ thể, tác vụ nhanh.
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowDownUp, CheckCircle2, ChevronRight, GraduationCap, Info, ListChecks, MapPin, Plus, Scale, School, ShieldCheck, ShieldPlus, SlidersHorizontal, TrendingDown, Wallet,
  type LucideIcon,
} from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { CAC_NHAN, NhanNguyenVongTag, TONE_NHAN, ThanhCoCau } from "@/components/ui/co-cau";
import { HopTruot, ThanhTienDo, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron, HuyHieuTruong } from "@/components/ui/hinh-nen";
import { HangBam, Nut, TONE_CHU, TONE_NEN, The, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { LUA_CHON_MAU, tim } from "@/data/lua-chon-mau";
import { DUONG_DAN } from "@/duong-dan";
import { diemHienTaiCuaTungMon } from "@/state/store";
import { useApp } from "@/state/store";
import type { ToneTen } from "@/state/types";
import { coHocPhi } from "@/data/lua-chon-phu";
import { GhiChuDuLieu, ThanhHoanTac, useHoanTac } from "./thanh-phan";
import {
  cacBuocDoiCho, chamDiem, toHopTotNhat, demNhan, dungDanhSach, giongNhau, goiYHanhDong, ketLuan, sapTheoVuaSuc, xetCoCau, type DiemDanhGia, type GoiY,
} from "./tinh-toan";

const ICON_DIEM: Record<DiemDanhGia["khoa"], LucideIcon> = { canBang: Scale, taiChinh: Wallet, khuVuc: MapPin };
const VIEN_KHUNG: Record<ToneTen, string> = { do: "border-do/30", cam: "border-cam/40", luc: "border-luc/30", xanh: "border-xanh/30", tim: "border-tim/30", muc: "border-vien" };

export default function DanhSachAnToan() {
  const nav = useNavigate();
  const { s, doiViTri } = useApp();
  const diemMon = diemHienTaiCuaTungMon(s);
  const tong = toHopTotNhat(diemMon).tong;
  const ds = useMemo(() => dungDanhSach(s.nguyenVong, diemMon, tim), [s.nguyenVong, s.diemThi, s.hoSo.diem]); // eslint-disable-line react-hooks/exhaustive-deps
  const dem = demNhan(ds);
  const coCau = xetCoCau(dem);
  const kl = ketLuan(coCau);
  const diem = chamDiem(ds, s.hoSo, tong !== null);
  const goiY = tong === null ? [] : goiYHanhDong(ds, { diem: diemMon, hoSo: s.hoSo, tatCa: LUA_CHON_MAU, daCo: s.nguyenVong });
  const { tin, bao, an } = useHoanTac(6000);
  const [giaiThich, setGiaiThich] = useState<DiemDanhGia | "nhan" | null>(null);

  /** Áp một thứ tự mới bằng chuỗi doiViTri (store chưa có hàm đặt cả danh sách). */
  const datThuTu = (hienTai: string[], dich: string[]) => cacBuocDoiCho(hienTai, dich).forEach(([tu, den]) => doiViTri(tu, den));

  const sapXepLai = () => {
    const cu = [...s.nguyenVong];
    const moi = sapTheoVuaSuc(ds);
    if (giongNhau(cu, moi)) return bao("Danh sách đã đúng thứ tự này rồi.");
    datThuTu(cu, moi);
    bao("Đã xếp: Vừa sức → Thử sức → An toàn → Dự phòng", () => datThuTu(moi, cu));
  };

  const dau = <DauTrangCoQuayLai tieuDe="Danh sách có an toàn không?" quayLai={DUONG_DAN.nguyenVong()}
    phai={<button type="button" onClick={() => setGiaiThich("nhan")} aria-label="Cách xếp nhãn" className="size-11 grid place-items-center rounded-full text-chu-phu active:bg-xanh-nhat"><Info size={21} /></button>} />;

  if (ds.length === 0) {
    return (
      <>
        {dau}
        <NoiDung>
          <TrangThaiTrong bieuTuong={<ListChecks size={26} />} tieuDe="Chưa có gì để xem" moTa="Em cần thêm ít nhất 1 nguyện vọng thì mình mới xem được danh sách có an toàn không.">
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

        {tong !== null && (
          <The>
            <TieuDeMuc phai={<span className="text-chu-phu font-semibold">{ds.length} nguyện vọng</span>}>Cơ cấu mức chắc chắn</TieuDeMuc>
            <ThanhCoCau dem={dem} />
            <ul className="mt-3 space-y-1 text-[13px] text-chu-phu border-t border-vien pt-2.5">
              {CAC_NHAN.map((n) => (
                <li key={n} className="flex items-center gap-2">
                  <span className={gop("w-[70px] shrink-0 font-bold", TONE_CHU[TONE_NHAN[n]])}>{n}</span>
                  <span>{MO_TA_NHAN[n]}</span>
                </li>
              ))}
            </ul>
          </The>
        )}

        <TieuDeMuc>Đánh giá tổng quan</TieuDeMuc>
        {diem.map((d) => <TheDiem key={d.khoa} d={d} moGiaiThich={() => setGiaiThich(d)} boSung={() => nav(DUONG_DAN.batDau(d.khoa === "canBang" ? 2 : 3))} />)}

        {tong !== null && (
          <>
            <TieuDeMuc>Gợi ý điều chỉnh cho em</TieuDeMuc>
            {goiY.length === 0 ? (
              <DongThongBao tone="luc" icon={CheckCircle2} tieuDe="Chưa cần điều chỉnh thêm"
                moTa="Có trường để thử sức lẫn chỗ chắc chân. Khi có điểm thi thử mới, em quay lại đây xem nhãn có đổi không nhé." />
            ) : goiY.map((g, i) => <TheGoiY key={g.loai} g={g} so={i + 1} nav={nav} />)}
          </>
        )}

        <TieuDeMuc>Tác vụ nhanh</TieuDeMuc>
        <HangBam bieuTuong={ShieldPlus} tone="luc" tieuDe="Thêm trường an toàn" phu="Tìm trường có điểm tham khảo thấp hơn điểm em" onClick={() => nav(DUONG_DAN.khamPha())} />
        {tong !== null && ds.length > 1 && (
          <HangBam bieuTuong={ArrowDownUp} tone="cam" tieuDe="Sắp xếp lại theo mức vừa sức" phu="Vừa sức lên trước, rồi Thử sức, An toàn, Dự phòng" onClick={sapXepLai} />
        )}

        <Nut bieuTuong={SlidersHorizontal} muiTen className="!mt-4" onClick={() => nav(DUONG_DAN.nguyenVong())}>Điều chỉnh danh sách</Nut>
        <GhiChuDuLieu />
      </NoiDung>

      <HopGiaiThich giaiThich={giaiThich} dong={() => setGiaiThich(null)} />
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
          <p className="mt-1.5 text-[13px] text-chu-phu leading-snug">{d.chiTiet}</p>
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
  themAnToan: { icon: ShieldPlus, tone: "luc", nut: "Tìm thêm trường an toàn" },
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
                phu={`${lc.truong} · ${lc.diemMin.toFixed(1)} điểm (${lc.namDiem}) · ${coHocPhi(lc) ? `${lc.hocPhiMin}–${lc.hocPhiMax} tr/năm` : "chưa có học phí"} · ${lc.khuVuc}`}
                nhan={<NhanNguyenVongTag nhan={nhan} />} />
            </li>
          ))}
          {g.thuSuc.map((d) => d.lc && (
            <li key={d.id}>
              <DongTruong onClick={() => nav(DUONG_DAN.chiTiet(d.id))} truong={d.lc.truong} tone={d.lc.tone} ten={`NV${d.viTri + 1} · ${d.lc.nganh}`}
                phu={`${d.lc.truong} · ${d.lc.diemMin.toFixed(1)} điểm (${d.lc.namDiem})`} nhan={<NhanNguyenVongTag nhan="Thử sức" />} />
            </li>
          ))}
        </ul>
      )}
      {g.loai !== "giamThuSuc" && g.truong.length === 0 && (
        <p className="mt-2 text-[13px] text-chu-phu">Chưa có ngành nào vừa điểm và vừa ngân sách của em. Em vào Khám phá để xem thêm nhé.</p>
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

function HopGiaiThich({ giaiThich, dong }: { giaiThich: DiemDanhGia | "nhan" | null; dong: () => void }) {
  const laNhan = giaiThich === "nhan";
  return (
    <HopTruot mo={giaiThich !== null} dong={dong} tieuDe={laNhan ? "Cách xếp nhãn" : giaiThich ? `Cách tính: ${giaiThich.ten}` : ""}>
      {laNhan ? (
        <div className="space-y-3 text-[14px] text-chu">
          <p>Mình so tổng điểm hiện tại của em, tính theo đúng tổ hợp xét tuyển của từng ngành, với điểm chuẩn năm trước:</p>
          <ul className="space-y-2">
            {CAC_NHAN.map((n) => <li key={n} className="flex items-center gap-2"><NhanNguyenVongTag nhan={n} /><span>{MO_TA_NHAN[n]}</span></li>)}
          </ul>
          <p className="text-chu-phu text-[13px]">Nhãn là gợi ý, không phải cam kết trúng tuyển. Điểm chuẩn mỗi năm có thể đổi. Điểm của trường là điểm chuẩn các năm trước.</p>
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
