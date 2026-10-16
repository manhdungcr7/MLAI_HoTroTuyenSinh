// Chế độ "Lịch": dòng thời gian của ngày đã chọn gồm lớp học cố định, giờ tự học, hoạt động khác và giờ ăn nghỉ.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BookOpen, CalendarPlus, ChevronRight, Coffee, Lock, NotebookPen, Plus, Sparkles, Users, Utensils, type LucideIcon } from "lucide-react";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nhan, Nut, gop } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { gioTuPhut, phutTuGio, thuCuaNgay } from "@/engine/xep-lich";
import { LICH_PHO_THONG_MAU } from "@/data/lich-mau";
import { homNay, tuanHienTai } from "@/state/chon";
import { useApp } from "@/state/store";
import { ngayThang, tenNgay, tenThu, thoiLuong } from "./dinh-dang";
import { HopNhapLichNhanh } from "./nhap-lich-nhanh";
import { HopMucLich, HopThemKhoi, HopTrungGio } from "./hop-lich";
import { mucLichTrongNgay, timTrung, type LoaiMuc, type MucLich } from "./tinh-toan";

export const DANG_LOAI: Record<LoaiMuc, { nhan: string; icon: LucideIcon; the: string; bieuTuong: string; cham: string }> = {
  lop: { nhan: "Lớp học", icon: BookOpen, the: "bg-xanh-nhat border-l-xanh", bieuTuong: "text-xanh", cham: "bg-xanh" },
  tuHoc: { nhan: "Tự học", icon: NotebookPen, the: "bg-luc-nhat border-l-luc", bieuTuong: "text-luc-chu", cham: "bg-luc" },
  khac: { nhan: "Hoạt động khác", icon: Users, the: "bg-cam-nhat border-l-cam", bieuTuong: "text-cam-chu", cham: "bg-cam" },
  nghi: { nhan: "Ăn uống, nghỉ ngơi", icon: Utensils, the: "bg-trang border-l-vien", bieuTuong: "text-chu-phu", cham: "bg-vien" },
};
/** Khoảng trống từ chừng này phút trở lên thì hiện một dòng "Trống" cho dễ nhìn. */
const HIEN_KHOANG_TRONG = 45;

export function CheDoLich({ ngayChon, quaKhu, hienThongBao }: { ngayChon: string; quaKhu: boolean; hienThongBao: (c: string) => void }) {
  const { s, datCoDinh, xepLai } = useApp();
  const nav = useNavigate();
  const hom = homNay();
  const [moThem, setMoThem] = useState(false);
  const [moNhanh, setMoNhanh] = useState(false);
  const [moTrung, setMoTrung] = useState(false);
  const [mucDangXem, setMucDangXem] = useState<MucLich | null>(null);
  const mucs = useMemo(() => mucLichTrongNgay(s.coDinh, s.khoiHoc, ngayChon), [s.coDinh, s.khoiHoc, ngayChon]);
  const trung = useMemo(() => timTrung(mucs), [mucs]);
  const idTrung = new Set(trung.flatMap((c) => [c.a.id, c.b.id]));

  const apDungLichMau = () => {
    datCoDinh(LICH_PHO_THONG_MAU);
    if (s.viec.length > 0) {
      xepLai(tuanHienTai(), homNay());
    }
    hienThongBao("Đã áp dụng lịch học mẫu phổ thông (Thứ 2 – Thứ 6)");
  };

  const ngayNghi = s.cauHinh.ngayNghi.includes(thuCuaNgay(ngayChon));
  const chiCoGioAn = mucs.every((m) => m.nguon === "baoVe");

  // Chèn dòng "Trống" từ đầu ngày đến cuối ngày
  const gioBatDau = phutTuGio(s.cauHinh.gioBatDau || "07:00");
  const gioKetThuc = phutTuGio(s.cauHinh.gioKetThuc || "21:30");
  const dong: ({ kieu: "muc"; muc: MucLich } | { kieu: "trong"; tu: string; phut: number })[] = [];
  let ketThucMuonNhat = gioBatDau;

  for (const m of mucs) {
    const bd = phutTuGio(m.batDau);
    if (bd - ketThucMuonNhat >= HIEN_KHOANG_TRONG) {
      dong.push({ kieu: "trong", tu: gioTuPhut(ketThucMuonNhat), phut: bd - ketThucMuonNhat });
    }
    dong.push({ kieu: "muc", muc: m });
    ketThucMuonNhat = Math.max(ketThucMuonNhat, phutTuGio(m.ketThuc));
  }
  if (gioKetThuc - ketThucMuonNhat >= HIEN_KHOANG_TRONG) {
    dong.push({ kieu: "trong", tu: gioTuPhut(ketThucMuonNhat), phut: gioKetThuc - ketThucMuonNhat });
  }

  const bamMuc = (m: MucLich) => {
    if (m.khoi?.viecId && s.viec.some((v) => v.id === m.khoi!.viecId)) nav(DUONG_DAN.viec(m.khoi.viecId));
    else setMucDangXem(m);
  };

  return (
    <>
      {s.coDinh.length === 0 && (
        <div className="rounded-xl border border-xanh/30 bg-xanh-nhat p-3.5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CalendarPlus size={20} className="text-xanh shrink-0 mt-0.5" />
            <div className="text-[13px] leading-snug">
              <b className="text-muc block text-[14px]">Bạn chưa nhập lịch học cố định</b>
              <span className="text-chu-phu">Bạn có thể nạp nhanh lịch mẫu phổ thông hoặc tự nhập từng tiết để hệ thống xếp giờ tự học.</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={apDungLichMau}
              className="min-h-11 py-2 px-3 rounded-xl bg-xanh text-white font-bold text-[13px] inline-flex items-center justify-center gap-1.5 shadow-xs active:brightness-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Dùng lịch mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => setMoNhanh(true)}
              className="min-h-11 py-2 px-3 rounded-xl border border-vien bg-white text-chu font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 hover:border-xanh/40 active:bg-gray-50 cursor-pointer"
            >
              <CalendarPlus size={15} />
              <span>Nhập nhanh</span>
            </button>
          </div>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-chu-phu" aria-label="Chú giải màu">
        {(["lop", "tuHoc", "khac"] as const).map((l) => (
          <li key={l} className="inline-flex items-center gap-1.5"><span className={gop("size-2.5 rounded-full", DANG_LOAI[l].cham)} />{DANG_LOAI[l].nhan}</li>
        ))}
      </ul>

      {trung.length > 0 && (
        <DongThongBao tone="do" icon={AlertTriangle} tieuDe="Lịch bị trùng giờ"
          moTa={`${trung[0].a.ten} trùng với ${trung[0].b.ten}${trung.length > 1 ? ` và ${trung.length - 1} chỗ khác` : ""}.`}
          hanhDong="Xem gợi ý" onClick={() => setMoTrung(true)} />
      )}

      <div className="flex items-center justify-between pt-1">
        <h2 className="text-[16px] font-extrabold text-muc">{tenThu(ngayChon)}, {ngayThang(ngayChon)}{ngayChon === hom && <span className="text-chu-phu font-semibold"> · Hôm nay</span>}</h2>
        {ngayNghi && <Nhan tone="tim">Ngày nghỉ của bạn</Nhan>}
      </div>

      <ol className="space-y-2" aria-label={`Lịch ${tenNgay(ngayChon, hom)}`}>
        {dong.map((d) => d.kieu === "trong" ? (
          <li key={`trong-${d.tu}`} className="flex gap-2 items-center" aria-label={`Trống ${thoiLuong(d.phut)}`}>
            <span className="w-11 shrink-0 text-[12px] font-semibold text-chu-phu tabular-nums">{d.tu}</span>
            <span className="flex-1 border-t border-dashed border-vien" />
            <span className="text-[12px] text-chu-phu">Trống {thoiLuong(d.phut)}</span>
            <span className="w-6 border-t border-dashed border-vien" />
          </li>
        ) : (
          <li key={d.muc.id} className="flex gap-2">
            <span className="w-11 shrink-0 pt-3 text-[12px] font-semibold text-chu-phu tabular-nums">{d.muc.batDau}</span>
            <TheMuc m={d.muc} trung={idTrung.has(d.muc.id)} onClick={d.muc.nguon === "baoVe" ? undefined : () => bamMuc(d.muc)} />
          </li>
        ))}
      </ol>

      {chiCoGioAn && (
        <p className="text-[13px] text-chu-phu text-center">{ngayNghi ? "Hôm nay em nghỉ, mình không xếp giờ tự học." : "Ngày này chưa có lớp học hay giờ tự học nào."}</p>
      )}

      {!quaKhu && <Nut kieu="nhe" bieuTuong={Plus} onClick={() => setMoThem(true)}>Thêm giờ học/hoạt động</Nut>}

      {moNhanh && <HopNhapLichNhanh xong={(n) => { setMoNhanh(false); if (n > 0) hienThongBao(`Đã thêm ${n} tiết vào lịch học`); }} />}
      <HopThemKhoi mo={moThem} dong={() => setMoThem(false)} ngay={ngayChon} hienThongBao={hienThongBao} />
      <HopTrungGio mo={moTrung} dong={() => setMoTrung(false)} trung={trung} hienThongBao={hienThongBao} />
      <HopMucLich muc={mucDangXem} dong={() => setMucDangXem(null)} quaKhu={quaKhu} hienThongBao={hienThongBao} />
    </>
  );
}

function TheMuc({ m, trung, onClick }: { m: MucLich; trung: boolean; onClick?: () => void }) {
  const { s } = useApp();
  const d = DANG_LOAI[m.loai];
  const Icon = m.nguon === "khoi" && m.loai === "nghi" ? Coffee : d.icon;
  const xong = !!m.khoi?.viecId && s.trangThaiViec[m.khoi.viecId] === "xong";
  const Goc = onClick ? "button" : "div";
  return (
    <Goc {...(onClick ? { type: "button" as const, onClick } : {})}
      className={gop("flex-1 min-w-0 min-h-12 rounded-xl border-l-4 px-3 py-2.5 flex items-center gap-2.5 text-left", d.the,
        m.loai === "nghi" && "border border-dashed border-vien border-l-4",
        trung && "ring-2 ring-do", onClick && "active:brightness-95", xong && "opacity-60")}>
      <Icon size={18} className={gop("shrink-0", d.bieuTuong)} />
      <span className="flex-1 min-w-0">
        <span className="flex items-start justify-between gap-2">
          <b className={gop("text-[14px] leading-snug", m.loai === "nghi" ? "text-chu-phu font-semibold" : "text-chu", xong && "line-through")}>{m.ten}</b>
          <span className="text-[12px] text-chu-phu whitespace-nowrap tabular-nums pt-0.5">{m.batDau} – {m.ketThuc}</span>
        </span>
        {(m.ghiChu || trung || m.khoi?.khoa || xong) && (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[12px] text-chu-phu">
            {trung && <Nhan tone="do">Trùng giờ</Nhan>}
            {xong && <Nhan tone="luc">Đã xong</Nhan>}
            {m.khoi?.khoa && <span className="inline-flex items-center gap-1"><Lock size={12} />Em tự chọn giờ</span>}
            {m.ghiChu && <span className="leading-snug">{m.ghiChu}</span>}
          </span>
        )}
      </span>
      {onClick && <ChevronRight size={16} className="text-chu-phu shrink-0" />}
    </Goc>
  );
}
