// Chế độ "Việc cần làm": mục tiêu hôm nay, tiến độ trong ngày, việc chia theo Nên làm trước / Tiếp theo / Trong tuần.
import { useNavigate } from "react-router-dom";
import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, Clock, Flame, ListPlus, Target, type LucideIcon } from "lucide-react";
import { ThanhTienDo, TrangThaiTrong } from "@/components/ui/hien-thi";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { Nhan, Nut, TONE_CHU, TONE_NEN, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { homNay, khoangCachCuaToi, mucTieuDayDu, tuanHienTai, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import type { ToneTen, ViecCanHoc } from "@/state/types";
import { tenNgay, tenThu, ngayThang, soPhut, thoiLuong } from "./dinh-dang";
import { NhanUuTien, OTichTron } from "./thanh-phan";
import { buoiNenHien, daKetThuc, khoiCuaViec, nhomViec, tienDoNgay, type IdNhom } from "./tinh-toan";
import { viecChoTuan } from "./tao-viec-tuan";
import { dinhDang } from "@/engine/dinh-dang";

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
  const taoVaXep = () => {
    const tuNgay = ngays.includes(hom) ? hom : undefined;
    const kq = viecChoTuan(s, tuan, tuNgay);
    if (!kq.ok) return hienThongBao(kq.lyDo);
    const r = xepLai(tuan, tuNgay, kq.viec);
    hienThongBao(r.chuaXep ? `Đã tạo ${kq.moi} việc, còn ${r.chuaXep} việc chưa có chỗ trong tuần` : `Đã tạo ${kq.moi} việc và xếp vào lịch tuần này`);
  };

  if (viecTuan.length === 0) {
    return s.mucTieu ? (
      s.coDinh.length === 0 ? (
        <TrangThaiTrong bieuTuong={<ListPlus size={26} />} tieuDe="Em nhập lịch học trước nhé"
          moTa="Để mình xếp việc vào giờ tự học mà không rơi vào lúc em đang học ở trường.">
          <div className="space-y-2">
            <Nut muiTen onClick={() => nav(DUONG_DAN.caiDatLichHoc())}>Nhập lịch học</Nut>
            <Nut kieu="vien" onClick={taoVaXep}>Vẫn tạo và xếp</Nut>
          </div>
        </TrangThaiTrong>
      ) : (
        <TrangThaiTrong bieuTuong={<ListPlus size={26} />} tieuDe="Tuần này chưa có việc cần học"
          moTa={`Mình sẽ tạo việc ôn cho tổ hợp ${s.mucTieu.maToHop} theo môn em còn thiếu điểm và thời gian tự học còn trống, rồi xếp vào lịch giúp em.`}>
          <div className="space-y-2">
            <div>
              <Nut bieuTuong={ListPlus} onClick={taoVaXep}>Tạo việc và xếp lịch cho tuần này</Nut>
              <p className="mt-1.5 text-[12px] text-chu-phu">Tạo việc mới từ điểm hiện tại, xếp vào khung giờ trống.</p>
            </div>
            <Nut kieu="vien" onClick={() => nav(DUONG_DAN.monKeoDiem())}>Xem môn nên ưu tiên</Nut>
          </div>
        </TrangThaiTrong>
      )
    ) : (
      <TrangThaiTrong bieuTuong={<Target size={26} />} tieuDe="Em chưa có mục tiêu"
        moTa="Chọn một mục tiêu trước, mình sẽ tạo việc cần học mỗi tuần theo môn còn thiếu điểm.">
        <div className="space-y-2">
          <Nut muiTen onClick={() => nav(DUONG_DAN.khamPha())}>Chọn mục tiêu ở Khám phá</Nut>
        </div>
      </TrangThaiTrong>
    );
  }

  // Tuần đã qua: chỉ xem lại các việc từng có giờ trong tuần đó.
  const viecHienThi = quaKhu ? viecTuan.filter((v) => khoiCuaViec(s.khoiHoc, v.id, ngays).length > 0) : viecTuan;
  const nhom = nhomViec(viecHienThi, s.trangThaiViec);
  const td = tienDoNgay(viecTuan, s.khoiHoc, s.trangThaiViec, ngayChon);

  return (
    <>
      {ngays.includes(hom) && <MucTieuHomNay />}

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
          <Nut kieu="vien" bieuTuong={ListPlus} onClick={taoVaXep}>Cập nhật việc theo điểm mới</Nut>
          <p className="text-[12px] text-chu-phu">Giữ lại việc đã xong, tạo lại phần còn lại theo điểm hiện tại và giờ tự học còn trống.</p>
        </div>
      )}
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
        <span className="block text-[13px] text-chu-phu leading-snug mt-0.5">
          {viecMon ? `Việc giúp em nhất: ${viecMon.tieuDe}.` : `${mon.ten} là môn còn thiếu nhiều điểm nhất so với mục tiêu ${m.lc.truong}.`}
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
            <b className={gop("text-[15px] text-muc leading-snug", xong && "line-through")}>{v.tieuDe}</b>
            {tt === "boQua" ? <Nhan tone="muc">Đã bỏ qua</Nhan> : xong ? <Nhan tone="luc">Xong</Nhan> : <NhanUuTien muc={v.mucUuTien} />}
          </span>
          <span className="block text-[13px] text-chu-phu leading-snug mt-0.5">{v.chiTiet}</span>
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
