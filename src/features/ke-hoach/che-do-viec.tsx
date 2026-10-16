// Chế độ "Việc cần làm": mục tiêu hôm nay, tiến độ trong ngày, việc chia theo Nên làm trước / Tiếp theo / Trong tuần.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, CalendarPlus, CheckCircle2, ChevronRight, Clock, Flame, Lightbulb, ListChecks, ListPlus, Sparkles, Target, type LucideIcon } from "lucide-react";
import { HopTruot, ThanhTienDo, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { homNay, khoangCachCuaToi, mucTieuDayDu, tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import { TEN_MON_NGAN, type ToneTen, type ViecCanHoc } from "@/state/types";
import { phutBayGio, tenNgay, tenThu, ngayThang, soPhut, thoiLuong } from "./dinh-dang";
import { OTichTron } from "./thanh-phan";
import { buoiNenHien, daKetThuc, khoiCuaViec, nhomViec, tienDoNgay, type IdNhom } from "./tinh-toan";
import { viecChoTuan } from "./tao-viec-tuan";
import { dinhDang } from "@/engine/dinh-dang";
import { ngayBatDauXep } from "./lich-tuan";
import { HopNhapLichNhanh } from "./nhap-lich-nhanh";
import { HopLapLichAI } from "./hop-lap-lich-ai";


const DANG_NHOM: Record<IdNhom, { icon: LucideIcon; tone: ToneTen }> = {
  cao: { icon: Flame, tone: "do" },
  vua: { icon: BarChart3, tone: "cam" },
  thap: { icon: CalendarDays, tone: "xanh" },
  daXong: { icon: CheckCircle2, tone: "luc" },
};

export function CheDoViec({ ngays, ngayChon, quaKhu, hienThongBao }: { ngays: string[]; ngayChon: string; quaKhu: boolean; hienThongBao: (c: string) => void }) {
  const { s, xepLai } = useApp();
  const nav = useNavigate();
  const hom = homNay();
  const tuan = ngays[0];
  const viecTuan = viecCuaTuan(s.viec, tuan);

  /** Tạo việc cho tuần đang xem từ mục tiêu và điểm hiện tại, rồi xếp ngay vào các khung giờ trống (chỉ từ hôm nay trở đi). */
  const [hoiLich, setHoiLich] = useState(false); // hộp xác nhận khi chưa có lịch học trên lớp
  const [moNhanh, setMoNhanh] = useState(false);
  const taoVaXep = (daXacNhan = false, nhe = !s.mucTieu) => {
    if (s.coDinh.length === 0 && !daXacNhan) { setHoiLich(true); return; }
    setHoiLich(false);
    const bd = ngayBatDauXep(tuan, hom, phutBayGio(), s.cauHinh.ngayNghi);
    if (bd.hetTuan) return hienThongBao(bd.ghiChu ?? "Tuần này đã gần hết. Bạn chuyển sang tuần sau rồi tạo việc nhé.");
    const kq = viecChoTuan(s, tuan, bd.tuNgay, new Date(), nhe);
    if (!kq.ok) return hienThongBao(kq.lyDo);
    const r = xepLai(tuan, bd.tuNgay, kq.viec);
    hienThongBao(bd.ghiChu ? `${bd.ghiChu} Đã tạo ${kq.moi} việc.` : r.chuaXep ? `Đã tạo ${kq.moi} việc, còn ${r.chuaXep} việc chưa có chỗ trong tuần` : `Đã tạo ${kq.moi} việc và xếp vào lịch tuần này`);
  };

  /** Hỏi rõ trước khi tạo việc khi chưa có lịch học trên lớp, và cho nhập lịch ngay tại đây. */
  const hopCanLich = (
    <>
      <HopTruot mo={hoiLich} dong={() => setHoiLich(false)} tieuDe="Chưa có lịch học trên lớp">
        <div className="space-y-4">
          <p className="text-[14px] text-chu">Chưa có lịch học trên lớp, việc có thể rơi vào giờ bạn đang học. Nhập lịch học trước nhé.</p>
          <div className="space-y-2">
            <Nut bieuTuong={CalendarPlus} onClick={() => { setHoiLich(false); setMoNhanh(true); }}>Nhập lịch học</Nut>
            <Nut kieu="nhe" onClick={() => taoVaXep(true)}>Vẫn tạo</Nut>
          </div>
        </div>
      </HopTruot>
      {moNhanh && <HopNhapLichNhanh xong={(n) => { setMoNhanh(false); if (n > 0) hienThongBao(`Đã thêm ${n} tiết vào lịch học. Bấm tạo việc để mình xếp vào giờ trống.`); }} />}
    </>
  );

  if (viecTuan.length === 0) {
    return s.mucTieu ? (
      <>
        <TrangThaiTrong bieuTuong={<ListPlus size={26} />} tieuDe="Tuần này chưa có việc cần học"
          moTa={`Tự động xếp việc ôn theo môn cần cải thiện vào khung giờ trống của bạn.`}>
          <div className="space-y-2">
            <Nut bieuTuong={ListPlus} onClick={() => taoVaXep()}>Tạo việc và xếp lịch</Nut>
            <Nut kieu="vien" onClick={() => nav(DUONG_DAN.monKeoDiem())}>Xem môn nên ưu tiên</Nut>
          </div>
        </TrangThaiTrong>
        {hopCanLich}
      </>
    ) : (
      <>
        <TrangThaiTrong bieuTuong={<Target size={26} />} tieuDe="Bạn chưa có mục tiêu"
          moTa="Chọn một mục tiêu để lập kế hoạch sát ngành mơ ước, hoặc tạo lịch ôn nền tảng 3 môn chung ngay bây giờ.">
          <div className="space-y-2">
            <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Chọn mục tiêu ở Khám phá</Nut>
            <Nut kieu="vien" bieuTuong={ListPlus} onClick={() => taoVaXep(false, true)}>Tạo lịch ôn nền tảng</Nut>
          </div>
        </TrangThaiTrong>
        {hopCanLich}
      </>
    );
  }

  // Tuần đã qua: chỉ xem lại các việc từng có giờ trong tuần đó.
  const viecHienThi = quaKhu ? viecTuan.filter((v) => khoiCuaViec(s.khoiHoc, v.id, ngays).length > 0) : viecTuan;
  const nhom = nhomViec(viecHienThi, s.trangThaiViec);
  const td = tienDoNgay(viecTuan, s.khoiHoc, s.trangThaiViec, ngayChon);

  return (
    <>
      {ngays.includes(hom) && (
        <div className="space-y-3">
          <MucTieuHomNay />
          <TheCaNhanHoaAI tuan={tuan} hienThongBao={hienThongBao} />
        </div>
      )}

      <div className="pt-1">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-[18px] font-extrabold text-muc leading-tight">
            {tenNgay(ngayChon, hom)}{(ngayChon === hom || tenNgay(ngayChon, hom) === "Ngày mai") && <span className="text-[14px] font-semibold text-chu-phu"> · {tenThu(ngayChon)}, {ngayThang(ngayChon)}</span>}
          </h2>
          <span className="text-[13px] font-bold text-chu-phu whitespace-nowrap">{td.tong ? `${td.xong}/${td.tong} hoàn thành` : "Chưa có buổi học"}</span>
        </div>
        <div className="mt-2"><ThanhTienDo phanTram={td.tong ? (td.xong / td.tong) * 100 : 0} tone="luc" /></div>
      </div>

      {nhom.length === 0 ? (
        <TrangThaiTrong bieuTuong={<CalendarDays size={26} />} tieuDe="Tuần này không có giờ tự học" moTa="Tuần đã qua này chưa từng được xếp việc nào. Em quay về tuần hiện tại để xem việc cần làm." />
      ) : nhom.map((n) => {
        const d = DANG_NHOM[n.id];
        return (
          <section key={n.id} aria-label={n.ten} className={gop("rounded-the p-2", TONE_NEN[d.tone])}>
            <h3 className="flex items-center gap-2 px-2 pt-1 pb-2">
              <d.icon size={18} className={TONE_CHU[d.tone]} />
              <span className="text-[16px] font-extrabold text-muc">{n.ten}</span>
              <span className="text-[13px] text-chu-phu">({n.viec.length} việc)</span>
            </h3>
            <ul className="space-y-2">
              {n.viec.map((v) => <li key={v.id}><DongViec v={v} ngays={ngays} ngayChon={ngayChon} quaKhu={quaKhu} /></li>)}
            </ul>
          </section>
        );
      })}

      {!quaKhu && s.mucTieu && (
        <div className="pt-1 space-y-2">
          <Nut kieu="vien" bieuTuong={ListPlus} onClick={() => taoVaXep()}>Cập nhật việc theo điểm mới</Nut>
        </div>
      )}
      {hopCanLich}
    </>
  );
}

/** Thẻ lộ trình học cá nhân: mục tiêu, môn trọng tâm, nút mở gợi ý lịch học chi tiết. */
function TheCaNhanHoaAI({ tuan, hienThongBao }: { tuan: string; hienThongBao: (c: string) => void }) {
  const { s } = useApp();
  const nav = useNavigate();
  const m = mucTieuDayDu(s);
  const ten = s.hoSo.hoTen?.trim();
  const kc = khoangCachCuaToi(s);
  const monThieu = kc.filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu);
  const ielts = s.hoSo.chungChiNgoaiNgu?.diem ? `${s.hoSo.chungChiNgoaiNgu.loai} ${s.hoSo.chungChiNgoaiNgu.diem}` : null;
  const dgnl = s.hoSo.diemDgnl?.hcm ? `ĐGNL ${s.hoSo.diemDgnl.hcm}/1200` : s.hoSo.diemDgnl?.hn ? `HSA ${s.hoSo.diemDgnl.hn}/150` : null;
  const [moLapLich, setMoLapLich] = useState(false);

  if (!m) return null;

  const tenGoi = ten ? (ten.split(/\s+/).length > 2 ? ten.split(/\s+/).slice(-2).join(" ") : ten) : null;
  const loiKhuyen = monThieu.length > 0
    ? `Trọng tâm tuần này là kéo điểm môn ${monThieu[0].ten} (còn thiếu ${dinhDang(monThieu[0].thieu, 1)}đ).`
    : "Điểm của bạn đã chạm mốc mục tiêu, hãy tập trung làm đề bấm giờ để duy trì phong độ.";

  const maToHop = s.mucTieu?.maToHop ?? "A00";
  const loiThe = ielts
    ? `Có ${ielts}: Bạn có thể giảm tải môn Ngoại ngữ để dồn 80% thời gian tự học cho ${m.toHop.slice(0, 2).map((x) => TEN_MON_NGAN[x] ?? x).join(", ")}.`
    : dgnl
    ? `Có ${dgnl}: Cơ hội xét tuyển sớm rất cao, giảm bớt áp lực thi THPT.`
    : null;

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-xanh-nhat/80 via-trang to-xanh-nhat/40 border border-xanh/30 p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-7 rounded-lg bg-xanh text-white grid place-items-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </span>
            <span className="text-[13.5px] font-bold text-muc truncate">
              {tenGoi ? `Lộ trình riêng cho ${tenGoi}` : "Lộ trình học tập cá nhân"}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-xanh bg-white px-2 py-0.5 rounded-full border border-xanh/20 shrink-0">
            Cá nhân hóa
          </span>
        </div>

        <div className="text-[13px] text-chu leading-snug space-y-1">
          <p className="font-medium">
            Mục tiêu: <b className="text-muc">{m.lc.nganh} · {m.lc.truong}</b> (tổ hợp <b>{maToHop}</b>, cần <b>{dinhDang(m.mucTieuTho, 1)}đ</b>).
          </p>
          <p className="text-chu-phu flex items-start gap-1.5"><Lightbulb size={14} className="shrink-0 mt-0.5 text-cam" /><span>{loiKhuyen} {loiThe}</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setMoLapLich(true)}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-xanh text-white font-bold text-[13px] inline-flex items-center justify-center gap-1.5 shadow-xs active:brightness-95 hover:bg-xanh/90 cursor-pointer transition-all"
          >
            <ListChecks size={16} className="shrink-0" />
            <span>Gợi ý lịch học chi tiết</span>
          </button>
          <button
            type="button"
            onClick={() => nav(DUONG_DAN.monKeoDiem())}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-vien bg-white text-chu font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 hover:border-xanh/40 active:bg-gray-50 cursor-pointer transition-all"
          >
            <span>Môn kéo điểm</span>
          </button>
        </div>
      </div>

      <HopLapLichAI
        mo={moLapLich}
        dong={() => setMoLapLich(false)}
        tuan={tuan}
        onThanhCong={hienThongBao}
      />
    </>
  );
}

/** "Mục tiêu hôm nay": một câu sinh từ môn còn thiếu điểm nhiều nhất. Chưa có mục tiêu thì ẩn. */
function MucTieuHomNay() {
  const { s } = useApp();
  const nav = useNavigate();
  const m = mucTieuDayDu(s);
  const mon = khoangCachCuaToi(s).filter((x) => x.thieu > 0).sort((a, b) => b.thieu - a.thieu)[0];
  if (!m || !mon) return null;
  const viecMon = viecCuaTuan(s.viec, tuanHienTai()).find((v) => v.mon === mon.mon && !daKetThuc(s.trangThaiViec[v.id]));
  return (
    <button type="button" onClick={() => nav(DUONG_DAN.monKeoDiem())} className="w-full text-left rounded-the bg-trang border border-vien shadow-the p-3.5 flex items-center gap-3 active:bg-xanh-nhat">
      <BieuTuongTron icon={Target} tone="do" kichThuoc={46} />
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-chu-phu">Mục tiêu hôm nay</span>
          <span className="text-[13px] font-bold text-xanh whitespace-nowrap">Xem chi tiết</span>
        </span>
        <b className="block text-[18px] text-muc leading-tight mt-0.5">Bù +{dinhDang(mon.thieu, 1)} điểm cho {mon.ten}</b>
        <span className="block text-[13px] text-chu-phu leading-snug mt-0.5 line-clamp-2">
          {viecMon ? `Ưu tiên: ${viecMon.tieuDe}` : `Môn thiếu nhiều nhất so với ${m.lc.truong}`}
        </span>
      </span>
    </button>
  );
}

function DongViec({ v, ngays, ngayChon, quaKhu }: { v: ViecCanHoc; ngays: string[]; ngayChon: string; quaKhu: boolean }) {
  const { s, datTrangThaiViec } = useApp();
  const nav = useNavigate();
  const hom = homNay();
  const tt = s.trangThaiViec[v.id];
  const xong = tt === "xong";
  const khois = khoiCuaViec(s.khoiHoc, v.id, ngays);
  const buoi = buoiNenHien(khois, ngayChon, hom);

  return (
    <div className={gop("flex items-center rounded-xl bg-trang border border-vien pr-1", daKetThuc(tt) && "opacity-60", buoi?.ngay === ngayChon && !daKetThuc(tt) && "border-xanh/40")}>
      <OTichTron xong={xong} tat={quaKhu || tt === "boQua"} nhan={xong ? `Bỏ đánh dấu xong: ${v.tieuDe}` : `Đánh dấu xong: ${v.tieuDe}`}
        onDoi={() => datTrangThaiViec(v, xong ? "chua" : "xong")} />
      <button type="button" onClick={() => nav(DUONG_DAN.viec(v.id))} className="flex-1 min-w-0 flex items-center gap-1 py-2.5 text-left">
        <span className="flex-1 min-w-0">
          <span className="flex items-start justify-between gap-2">
            <b className={gop("text-[14.5px] text-muc leading-snug line-clamp-2", xong && "line-through")}>{v.tieuDe}</b>
            {/* Mức ưu tiên đã là tên nhóm phía trên, không lặp nhãn ở từng dòng. */}
            {tt === "boQua" ? <Nhan tone="muc">Đã bỏ qua</Nhan> : xong ? <Nhan tone="luc">Xong</Nhan> : null}
          </span>
          <span className={gop("flex items-center gap-1 text-[13px] font-semibold mt-1", buoi ? "text-xanh" : "text-cam-chu")}>
            <Clock size={14} className="shrink-0" />
            <span className="min-w-0">
              {buoi
                ? <>{tenNgay(buoi.ngay, hom, true)} · {buoi.batDau} – {buoi.ketThuc} · {thoiLuong(soPhut(buoi.batDau, buoi.ketThuc))}{khois.length > 1 && <span className="text-chu-phu font-normal"> · {khois.length} buổi</span>}</>
                : <>Chưa xếp giờ · {thoiLuong(v.phut)}</>}
            </span>
          </span>
        </span>
        <ChevronRight size={18} className="text-chu-phu shrink-0" />
      </button>
    </div>
  );
}
