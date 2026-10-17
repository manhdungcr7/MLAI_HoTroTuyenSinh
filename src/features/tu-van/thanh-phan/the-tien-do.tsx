// Thẻ trong khung chat để cho biết tiến độ học từng chủ đề lớp 12. Bấm là ghi vào hồ sơ trên máy (hoSo.tienDoKienThuc), không gửi đi đâu.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, WandSparkles } from "lucide-react";
import { chuDeCuaMon, timChuDeTheoTen } from "@/data/chuong-trinh-lop12";
import { NHAN_MUC_DO, apDungTienDo, type MucDoChuDe } from "@/engine/tien-do-chu-de";
import { DUONG_DAN } from "@/duong-dan";
import { gop } from "@/components/ui/nut-the";
import { useApp } from "@/state/store";
import { homNay, tuanHienTai } from "@/state/chon";
import { viecChoTuan } from "@/features/ke-hoach/tao-viec-tuan";
import { ngayBatDauXep } from "@/features/ke-hoach/lich-tuan";
import { phutBayGio } from "@/features/ke-hoach/dinh-dang";
import type { ViecCanHoc } from "@/state/types";
import type { TienDoTin } from "../tien-do-chat";

const NUT = "min-h-12 rounded-lg px-2.5 text-[12.5px] font-bold border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xanh";
const MUC_CHON: { ma: MucDoChuDe; nhan: string; chon: string }[] = [
  { ma: "namVung", nhan: "Vững", chon: "bg-luc-nhat text-luc-chu border-luc/40" },
  { ma: "canOnTap", nhan: "Cần ôn", chon: "bg-cam-nhat text-cam-chu border-cam/40" },
  { ma: "chuaHoc", nhan: "Chưa học", chon: "bg-xanh-nhat text-xanh border-xanh/40" },
];

export function TheTienDo({ tienDo, onDi }: { tienDo: TienDoTin; onDi?: () => void }) {
  const { s, capNhatHoSo, xepLai } = useApp();
  const [daLuu, setDaLuu] = useState(false);
  const [tin, setTin] = useState("");
  const [cho, setCho] = useState<{ tuan: string; tuNgay: string | undefined; viec: ViecCanHoc[]; moi: number } | null>(null);
  const td = s.hoSo.tienDoKienThuc ?? {};

  const datMuc = (ten: string, ma: MucDoChuDe) => {
    const c = timChuDeTheoTen(ten);
    if (c) capNhatHoSo({ tienDoKienThuc: apDungTienDo(td, [{ chuDe: c, mucDo: ma }]) });
  };
  const luuDeXuat = () => {
    const ds = (tienDo.deXuat ?? []).flatMap((d) => { const c = timChuDeTheoTen(d.ten); return c ? [{ chuDe: c, mucDo: d.mucDo }] : []; });
    capNhatHoSo({ tienDoKienThuc: apDungTienDo(td, ds) });
    setDaLuu(true);
  };

  /** Bước 1: chỉ tính bản xem trước (không ghi gì). Bước 2 (xacNhan) mới tạo việc và xếp vào giờ trống. */
  const xemTruoc = () => {
    const tuan = tuanHienTai();
    const bd = ngayBatDauXep(tuan, homNay(), phutBayGio(), s.cauHinh.ngayNghi);
    if (bd.hetTuan) return setTin(bd.ghiChu ?? "Tuần này đã gần hết, bạn sang tuần sau rồi tạo việc nhé.");
    const kq = viecChoTuan(s, tuan, bd.tuNgay, new Date(), !s.mucTieu);
    if (!kq.ok) return setTin(kq.lyDo);
    setCho({ tuan, tuNgay: bd.tuNgay, viec: kq.viec, moi: kq.moi });
    setTin("");
  };
  const xacNhan = () => {
    if (!cho) return;
    const r = xepLai(cho.tuan, cho.tuNgay, cho.viec);
    setTin(r.chuaXep ? `Đã tạo ${cho.moi} việc theo tiến độ, còn ${r.chuaXep} việc chưa có chỗ trong tuần.` : `Đã tạo ${cho.moi} việc theo tiến độ và xếp vào giờ trống.`);
    setCho(null);
  };

  return (
    <div className="mt-2.5 space-y-2.5">
      {tienDo.the && (
        <ul className="space-y-2" aria-label="Chủ đề lớp 12">
          {chuDeCuaMon(tienDo.the).map((c) => (
            <li key={c.id} className="rounded-xl border border-vien bg-trang p-2.5 space-y-1.5">
              <p className="text-[13px] font-bold text-muc leading-snug">{c.ten}</p>
              <p className="text-[12px] text-chu-phu leading-snug">Cần nắm: {c.canNam.join("; ")}</p>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`Mức học: ${c.ten}`}>
                {MUC_CHON.map((m) => {
                  const dang = td[c.ten] === m.ma;
                  return <button key={m.ma} type="button" aria-pressed={dang} onClick={() => datMuc(c.ten, m.ma)} className={gop(NUT, dang ? m.chon : "bg-trang text-chu border-vien active:bg-xanh-nhat")}>{m.nhan}</button>;
                })}
              </div>
              {td[c.ten] === "dangHoc" && <p className="text-[12px] text-chu-phu">Hiện: {NHAN_MUC_DO.dangHoc}</p>}
            </li>
          ))}
        </ul>
      )}
      {tienDo.deXuat && tienDo.deXuat.length > 0 && (
        <button type="button" disabled={daLuu} onClick={luuDeXuat}
          className={gop(NUT, "w-full inline-flex items-center justify-center gap-1.5", daLuu ? "bg-luc-nhat text-luc-chu border-luc/40" : "bg-xanh text-white border-xanh")}>
          {daLuu ? <><Check size={15} />Đã lưu</> : "Lưu tiến độ này"}
        </button>
      )}
      {tienDo.moLich && !cho && (
        <button type="button" onClick={xemTruoc} className={gop(NUT, "w-full inline-flex items-center justify-center gap-1.5 bg-xanh text-white border-xanh")}><WandSparkles size={15} />Xem việc đề xuất cho tuần này</button>
      )}
      {cho && (
        <div role="group" aria-label="Xác nhận tạo việc" className="rounded-xl border border-xanh/40 bg-trang p-2.5 space-y-2">
          <p className="text-[12.5px] text-chu leading-snug">Mình đề xuất tạo {cho.moi} việc theo tiến độ và xếp vào giờ trống của tuần này. Chưa có gì được ghi cho tới khi bạn đồng ý.</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => setCho(null)} className={gop(NUT, "bg-trang text-chu border-vien")}>Không tạo</button>
            <button type="button" onClick={xacNhan} className={gop(NUT, "bg-xanh text-white border-xanh")}>Đồng ý, tạo</button>
          </div>
        </div>
      )}
      {tin && <p role="status" className="text-[12.5px] text-chu leading-snug">{tin}</p>}
      {tienDo.moLich && (
        <Link to={DUONG_DAN.keHoach()} onClick={onDi} className={gop(NUT, "w-full inline-flex items-center justify-center bg-trang text-xanh border-xanh/40")}>Mở kế hoạch tuần</Link>
      )}
    </div>
  );
}
