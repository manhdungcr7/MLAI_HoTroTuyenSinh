// Màn 20 · Tiến độ & điều chỉnh (ref bo-A/10 phải + bo-C/10 phải).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Bell, CalendarClock, CalendarDays, CalendarPlus, CalendarX2, CircleAlert, CircleCheck, Clock,
  Flame, Lightbulb, ListChecks, RotateCcw, ShieldCheck, SkipForward, Sparkles, TrendingDown, TrendingUp, type LucideIcon,
} from "lucide-react";
import { FeatureMockScore, FeatureProgress } from "@/components/ui/bieu-tuong-nguyen-vong";
import { DauTrangChinh, NoiDung } from "@/components/layout/khung";
import { ThanhTabKeHoach } from "@/features/ke-hoach/thanh-tab";
import { HopTruot, TieuDeMuc, TrangThaiTrong } from "@/components/ui/hien-thi";
import { HangBam, Nut, The, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { DongThongBao } from "@/components/ui/thong-bao";
import { TheNen, VongDiem } from "@/components/ui/thiet-ke";
import { DuongXuHuong } from "@/components/ui/xu-huong";
import { DUONG_DAN } from "@/duong-dan";
import { bayNgayCuaTuan, congNgay, isoNgay } from "@/engine/xep-lich";
import { tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import type { LichSuHoanThanh, ToneTen, TrangThaiViec } from "@/state/types";
import { loaiCuaCanhBao, taoCanhBao, type LoaiCanhBao } from "./canh-bao";
import { chuoiNgayHoc, demTienDo, loiGhiNhan, ngayThang, NHAN_THU, nhanThoiDiem, soViet, soVoiTuanTruoc, xuHuongCacMon, type XuHuongMon } from "./tinh-tien-do";
import { dinhDang } from "@/engine/dinh-dang";

const ICON_CANH_BAO: Record<LoaiCanhBao, LucideIcon> = {
  boLo: CircleAlert, trung: CalendarX2, dieuChinh: Lightbulb, boQua: SkipForward, chuaLich: CalendarPlus, tangDiem: TrendingUp,
};

const HOAT_DONG: Record<TrangThaiViec, { icon: LucideIcon; mau: string; nhan: string }> = {
  xong: { icon: CircleCheck, mau: "text-luc", nhan: "Đã xong" },
  doi: { icon: Clock, mau: "text-cam", nhan: "Đã dời" },
  boQua: { icon: SkipForward, mau: "text-chu-phu", nhan: "Đã bỏ qua" },
  chua: { icon: RotateCcw, mau: "text-xanh", nhan: "Làm lại" },
};

export default function TienDo() {
  const { s } = useApp();
  const nav = useNavigate();
  const [moLichSu, setMoLichSu] = useState(false);
  const bayGio = new Date();
  const thuHai = tuanHienTai();
  const td = demTienDo(s, bayGio);
  const ss = soVoiTuanTruoc(s.lichSu, bayGio, td.xong);
  const ghiNhan = loiGhiNhan(s, bayGio);
  const xuHuong = xuHuongCacMon(s);
  const chuoi = chuoiNgayHoc(s.lichSu, bayGio);
  const canhBao = taoCanhBao(s, bayGio);
  const trongHet = !viecCuaTuan(s.viec, tuanHienTai()).length && !s.lichSu.length && !s.diemThi.length;

  return (
    <>
      <DauTrangChinh tieuDe="Tiến độ & điều chỉnh" moTa={`Tuần này · ${ngayThang(thuHai)} – ${ngayThang(congNgay(thuHai, 6))}`} />
      <ThanhTabKeHoach />
      <NoiDung>
        {trongHet ? (
          <TrangThaiTrong bieuTuong={<FeatureProgress size={28} />} tieuDe="Chưa có gì để theo dõi"
            moTa="Khi bạn có kế hoạch tuần và bắt đầu làm việc, tiến độ và lời nhắc điều chỉnh sẽ hiện ở đây.">
            <div className="space-y-2">
              <Nut muiTen onClick={() => nav(DUONG_DAN.tuan())}>Lập kế hoạch tuần</Nut>
              <Nut kieu="vien" bieuTuong={FeatureMockScore} onClick={() => nav(DUONG_DAN.diemThiThu())}>Nhập điểm thi thử</Nut>
            </div>
          </TrangThaiTrong>
        ) : (
          <>
            <TheTienDoTuan td={td} ss={ss} moTuan={() => nav(DUONG_DAN.tuan())} />
            {td.tong > 0 && <TienDoTheoNgay s={s} thuHai={thuHai} bayGio={bayGio} />}
            {chuoi >= 2 && (
              <div className="the-nen-nhe-cam rounded-the p-3.5 flex items-center gap-3">
                <span className="size-11 rounded-full bg-trang grid place-items-center shrink-0"><Flame size={24} className="text-cam" aria-hidden /></span>
                <div><p className="text-[13px] text-chu-phu">Chuỗi học liên tiếp</p><p className="so-lon text-[20px] font-bold text-muc leading-tight">{chuoi} ngày</p></div>
              </div>
            )}
            {ghiNhan && <DongThongBao tone="luc" icon={Sparkles} tieuDe="Ghi nhận cho bạn" moTa={ghiNhan} />}

            <section aria-labelledby="kq-hoc-tap">
              <TieuDeMuc phai={<button type="button" onClick={() => nav(DUONG_DAN.diemThiThu())} className="min-h-11 -my-2 px-1">Nhập điểm</button>}>
                <span id="kq-hoc-tap">Kết quả học tập gần nhất</span>
              </TieuDeMuc>
              <KetQuaHocTap xuHuong={xuHuong} nhapDiem={() => nav(DUONG_DAN.diemThiThu())} />
              {s.diemThi.length > 0 && (
                <div className="mt-2.5"><HangBam bieuTuong={FeatureMockScore} tone="xanh" tieuDe="Nhập điểm thi thử" phu="Cập nhật kết quả để theo dõi tiến độ" onClick={() => nav(DUONG_DAN.diemThiThu())} /></div>
              )}
            </section>

            <section aria-labelledby="hoat-dong">
              <TieuDeMuc phai={s.lichSu.length > 4 ? <button type="button" onClick={() => setMoLichSu(true)} className="min-h-11 -my-2 px-1">Xem tất cả</button> : undefined}>
                <span id="hoat-dong">Hoạt động gần đây</span>
              </TieuDeMuc>
              <The className="!py-1.5">
                {s.lichSu.length ? (
                  <DanhSachHoatDong ds={s.lichSu.slice(0, 4)} bayGio={bayGio} />
                ) : (
                  <p className="py-3 text-[14px] text-chu-phu">Chưa có hoạt động nào. Lịch sử hoàn thành và điều chỉnh việc học sẽ hiển thị tại đây.</p>
                )}
              </The>
            </section>

            <section aria-labelledby="luu-y" className="space-y-2">
              <TieuDeMuc><span id="luu-y" className="flex items-center gap-1.5"><Lightbulb size={18} className="text-cam" />Điều cần lưu ý</span></TieuDeMuc>
              {canhBao.length ? canhBao.map((c) => (
                <DongThongBao key={c.id} tone={c.tone} icon={ICON_CANH_BAO[loaiCuaCanhBao(c)]} tieuDe={c.tieuDe} moTa={c.moTa}
                  hanhDong={c.hanhDong ? `${c.hanhDong.nhan} ›` : undefined}
                  onClick={c.hanhDong ? () => nav(c.hanhDong!.den) : undefined} />
              )) : (
                <DongThongBao tone="luc" icon={ShieldCheck} tieuDe="Mọi thứ đang ổn"
                  moTa="Không có lịch trùng hay buổi bị bỏ lỡ. Bạn hãy duy trì nhịp học đều đặn nhé." />
              )}
            </section>

            {viecCuaTuan(s.viec, tuanHienTai()).length > 0 && (
              <Nut muiTen bieuTuong={CalendarClock} onClick={() => nav(DUONG_DAN.tuan("lich"))}>Xem đề xuất điều chỉnh</Nut>
            )}
          </>
        )}

        <section aria-labelledby="cai-dat" className="space-y-2 pt-1">
          <TieuDeMuc><span id="cai-dat">Điều chỉnh theo bạn</span></TieuDeMuc>
          <HangBam bieuTuong={CalendarDays} tone="xanh" tieuDe="Lịch học của bạn"
            phu={s.coDinh.length ? `${s.coDinh.length} tiết cố định mỗi tuần` : "Chưa nhập lịch ở trường, học thêm"} onClick={() => nav(DUONG_DAN.caiDatLichHoc())} />
          <HangBam bieuTuong={Clock} tone="luc" tieuDe="Cài đặt tự học"
            phu={`${s.cauHinh.gioBatDau} – ${s.cauHinh.gioKetThuc} · tối đa ${soViet(s.cauHinh.gioHocToiDaMoiNgay)} giờ/ngày`} onClick={() => nav(DUONG_DAN.caiDatTuHoc())} />
          <HangBam bieuTuong={Bell} tone="cam" tieuDe="Cài đặt nhắc nhở"
            phu={s.nhacNho.bat ? `Đang bật · nhắc trước ${s.nhacNho.truocPhut} phút` : "Đang tắt"} onClick={() => nav(DUONG_DAN.nhacNho())} />
        </section>
      </NoiDung>

      <HopTruot mo={moLichSu} dong={() => setMoLichSu(false)} tieuDe="Tất cả hoạt động">
        <p className="text-[13px] text-chu-phu mb-1">{s.lichSu.length} hoạt động gần nhất, mới nhất ở trên.</p>
        <DanhSachHoatDong ds={s.lichSu} bayGio={bayGio} />
      </HopTruot>
    </>
  );
}

function TheTienDoTuan({ td, ss, moTuan }: {
  td: ReturnType<typeof demTienDo>; ss: ReturnType<typeof soVoiTuanTruoc>; moTuan: () => void;
}) {
  if (!td.tong) {
    return (
      <The className="text-center space-y-3">
        <p className="font-extrabold text-muc text-[16px]">Tuần này chưa có việc nào</p>
        <p className="text-[14px] text-chu-phu">Lập kế hoạch tuần để theo dõi tiến độ học tập.</p>
        <Nut muiTen onClick={moTuan}>Lập kế hoạch tuần</Nut>
      </The>
    );
  }
  const o: { so: number; nhan: string; icon: LucideIcon; tone: ToneTen }[] = [
    { so: td.xong, nhan: "Đã xong", icon: CircleCheck, tone: "luc" },
    { so: td.conLai, nhan: "Còn lại", icon: ListChecks, tone: "xanh" },
    { so: td.quaHan, nhan: "Quá hạn", icon: CircleAlert, tone: td.quaHan ? "do" : "muc" },
    { so: td.daDoi, nhan: "Đã dời", icon: Clock, tone: "cam" },
  ];
  return (
    <TheNen className={gop("space-y-4 relative overflow-hidden", td.phanTram === 100 && "the-nen-nhe-luc")}>
      {td.phanTram === 100 && <Mung />}
      <div className="flex items-center gap-4">
        <VongDiem value={td.phanTram} max={100} size={96} tong={td.phanTram === 100 ? "luc" : "xanh"} dinhDang={(n) => `${Math.round(n)}%`} aria={`Tiến độ tuần ${td.phanTram} phần trăm`} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-muc">Tiến độ tuần</p>
          <p className="leading-tight mt-0.5"><b className="text-[26px] font-extrabold text-muc">{td.xong}/{td.tong}</b> <span className="text-[14px] font-bold text-chu-phu">việc đã xong</span></p>
          {ss && (
            <p className={gop("mt-1 text-[13px] font-bold flex items-center gap-1", ss.chenh > 0 ? "text-luc-chu" : "text-chu-phu")}>
              {ss.chenh > 0 ? <TrendingUp size={16} /> : ss.chenh < 0 ? <TrendingDown size={16} /> : <ArrowRight size={16} />}
              {ss.chenh > 0 ? `+${ss.chenh} việc so với tuần trước` : ss.chenh < 0 ? `Tuần trước bạn xong ${ss.tuanTruoc} việc` : "Bằng tuần trước"}
            </p>
          )}
        </div>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {o.map((x) => (
          <li key={x.nhan} className={gop("rounded-xl py-2.5 px-1 text-center", x.tone === "muc" ? "bg-nen" : TONE_NEN[x.tone])}>
            <x.icon size={18} className={gop("mx-auto", x.tone === "muc" ? "text-chu-phu" : TONE_CHU[x.tone])} aria-hidden />
            <b className={gop("block text-[20px] leading-tight font-extrabold mt-0.5", x.tone === "do" ? "text-do-chu" : "text-muc")}>{x.so}</b>
            <span className={gop("block text-[12px] font-semibold whitespace-nowrap", x.tone === "do" ? "text-do-chu" : "text-chu-phu")}>{x.nhan}</span>
          </li>
        ))}
      </ul>
    </TheNen>
  );
}

/** Hiệu ứng ăn mừng ngắn khi xong 100% tuần (một lần, tắt khi giảm chuyển động). */
function Mung() {
  const [hien, setHien] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHien(false), 1800); return () => clearTimeout(t); }, []);
  if (!hien) return null;
  return (
    <span aria-hidden className="absolute inset-0 pointer-events-none motion-reduce:hidden">
      {[8, 22, 38, 54, 70, 86].map((x, i) => (
        <Sparkles key={x} size={16} className="absolute text-cam animate-ping" style={{ left: `${x}%`, top: `${10 + (i % 3) * 8}%`, animationDelay: `${i * 120}ms`, animationIterationCount: 2 }} />
      ))}
    </span>
  );
}

function TienDoTheoNgay({ s, thuHai, bayGio }: { s: ReturnType<typeof useApp>["s"]; thuHai: string; bayGio: Date }) {
  const [chon, setChon] = useState<string | null>(null);
  const idTuan = new Set(viecCuaTuan(s.viec, thuHai).map((v) => v.id));
  const hom = isoNgay(bayGio);
  const cot = bayNgayCuaTuan(thuHai).map((ngay, i) => {
    const viec = [...new Set(s.khoiHoc.filter((k) => k.ngay === ngay && k.viecId && idTuan.has(k.viecId)).map((k) => k.viecId!))];
    const xong = viec.filter((id) => s.trangThaiViec[id] === "xong").length;
    return { ngay, nhan: NHAN_THU[i + 1], viec, xong };
  });
  const dangXem = cot.find((c) => c.ngay === chon);
  const ten = (id: string) => s.viec.find((v) => v.id === id)?.tieuDe ?? "Việc";
  return (
    <TheNen>
      <b className="text-[15px] text-muc">Tiến độ theo ngày</b>
      <ul className="mt-3 grid grid-cols-7 gap-1.5">
        {cot.map((c) => {
          const ti = c.viec.length ? c.xong / c.viec.length : 0;
          const tong = c.viec.length > 0 && c.xong === c.viec.length;
          return (
            <li key={c.ngay}>
              <button type="button" disabled={!c.viec.length} aria-pressed={chon === c.ngay} onClick={() => setChon(chon === c.ngay ? null : c.ngay)}
                aria-label={`${c.nhan} ${ngayThang(c.ngay)}: ${c.viec.length ? `${c.xong}/${c.viec.length} việc đã xong` : "không có việc"}`}
                className="w-full min-h-11 flex flex-col items-center gap-1 cursor-pointer disabled:cursor-default">
                <span className="h-4 grid place-items-center">{tong && <CircleCheck size={16} className="text-luc" aria-hidden />}</span>
                <span className={gop("relative w-full max-w-7 h-16 rounded-lg bg-vien/50 overflow-hidden", chon === c.ngay && "ring-2 ring-xanh")}>
                  <span className="absolute inset-x-0 bottom-0 gd-thanh-luc rounded-lg transition-[height] duration-700" style={{ height: `${Math.round(ti * 100)}%` }} />
                </span>
                <span className={gop("text-[13px] font-bold", c.ngay === hom ? "text-xanh" : "text-chu")}>{c.nhan}</span>
                <span className="text-[12px] text-chu-phu">{ngayThang(c.ngay)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {cot.every((c) => !c.viec.length) && <p className="mt-2 text-[13px] text-chu-phu">Chưa xếp việc nào vào ngày cụ thể. Bạn xếp lịch ở Kế hoạch tuần để theo dõi từng ngày.</p>}
      {dangXem && (
        <ul className="mt-3 pt-2 border-t border-vien space-y-1.5">
          {dangXem.viec.map((id) => {
            const xong = s.trangThaiViec[id] === "xong";
            return <li key={id} className="flex items-center gap-2 text-[14px]"><CircleCheck size={16} className={xong ? "text-luc" : "text-chu-phu"} aria-hidden /><span className="min-w-0">{ten(id)}</span><span className="ml-auto text-[13px] text-chu-phu">{xong ? "Đã xong" : "Chưa xong"}</span></li>;
          })}
        </ul>
      )}
    </TheNen>
  );
}

function KetQuaHocTap({ xuHuong, nhapDiem }: { xuHuong: XuHuongMon[]; nhapDiem: () => void }) {
  if (!xuHuong.length || xuHuong.every((x) => !x.gia.length)) {
    return (
      <The className="space-y-3">
        <p className="text-[14px] text-chu">Chưa có điểm thi thử nào. Nhập điểm sau mỗi lần thi để theo dõi tiến độ ôn tập.</p>
        <Nut kieu="nhe" bieuTuong={FeatureMockScore} onClick={nhapDiem}>Nhập điểm thi thử</Nut>
      </The>
    );
  }
  const thieu = xuHuong.some((x) => x.gia.length < 2);
  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {xuHuong.map((x) => {
          const tone: ToneTen = x.chenh === null ? "xanh" : x.chenh > 0 ? "luc" : x.chenh < 0 ? "cam" : "xanh";
          return (
            <li key={x.mon} className="rounded-the bg-trang border border-vien shadow-the p-3 min-w-0">
              <p className="text-[14px] font-extrabold text-muc truncate">{x.ten}</p>
              <div className="h-9 mt-1 flex items-center">
                {x.gia.length >= 2
                  ? <DuongXuHuong gia={x.gia} tone={tone} rong={76} cao={34} />
                  : <span aria-hidden className="block w-full border-t-2 border-dashed border-vien" />}
              </div>
              <p className="text-[20px] font-extrabold text-muc leading-tight">{x.moiNhat !== null ? dinhDang(x.moiNhat, 1) : "–"}</p>
              <p className={gop("text-[12px] font-bold flex items-center gap-0.5 whitespace-nowrap", x.chenh === null ? "text-chu-phu" : TONE_CHU[tone])}>
                {x.chenh === null ? "Chưa đủ dữ liệu"
                  : x.chenh > 0 ? <><TrendingUp size={14} />+{dinhDang(x.chenh, 1)}</>
                  : x.chenh < 0 ? <><TrendingDown size={14} />{dinhDang(x.chenh, 1)}</>
                  : <><ArrowRight size={14} />Ổn định</>}
              </p>
            </li>
          );
        })}
      </ul>
      {thieu && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-chu-phu">
          <span>Cần ít nhất 2 lần thi để phân tích xu hướng.</span>
          <button type="button" onClick={nhapDiem} className="font-bold text-xanh hover:underline shrink-0 min-h-8 inline-flex items-center">Nhập điểm thi thử →</button>
        </div>
      )}
    </>
  );
}

function DanhSachHoatDong({ ds, bayGio }: { ds: LichSuHoanThanh[]; bayGio: Date }) {
  const { s } = useApp();
  const nav = useNavigate();
  return (
    <ul className="divide-y divide-vien">
      {ds.map((l, i) => {
        const h = HOAT_DONG[l.trangThai];
        const coViec = s.viec.some((v) => v.id === l.viecId);
        const noiDung = (
          <>
            <h.icon size={20} className={gop("shrink-0", h.mau)} aria-hidden />
            <span className="flex-1 min-w-0 text-[14px] text-chu leading-snug"><span className="sr-only">{h.nhan}: </span>{l.ten}</span>
            <span className="text-[12px] text-chu-phu whitespace-nowrap">{nhanThoiDiem(l.luc, bayGio)}</span>
          </>
        );
        return (
          <li key={`${l.viecId}-${l.luc}-${i}`}>
            {coViec ? (
              <button type="button" onClick={() => nav(DUONG_DAN.viec(l.viecId))} className="w-full min-h-12 py-2 flex items-center gap-2.5 text-left active:bg-xanh-nhat rounded-lg">{noiDung}</button>
            ) : (
              <div className="min-h-12 py-2 flex items-center gap-2.5">{noiDung}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
