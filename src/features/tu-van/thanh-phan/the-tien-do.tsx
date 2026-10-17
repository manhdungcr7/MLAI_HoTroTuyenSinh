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

  /** Tạo lại việc tuần này theo tiến độ vừa cho biết rồi xếp vào giờ trống (cùng cách nút Tạo việc ở màn Kế hoạch). */
  const taoLaiViec = () => {
    const tuan = tuanHienTai();
    const bd = ngayBatDauXep(tuan, homNay(), phutBayGio(), s.cauHinh.ngayNghi);
    if (bd.hetTuan) return setTin(bd.ghiChu ?? "Tuần này đã gần hết, bạn sang tuần sau rồi tạo việc nhé.");
    const kq = viecChoTuan(s, tuan, bd.tuNgay, new Date(), !s.mucTieu);
    if (!kq.ok) return setTin(kq.lyDo);
    const r = xepLai(tuan, bd.tuNgay, kq.viec);
    setTin(r.chuaXep ? `Đã tạo ${kq.moi} việc theo tiến độ, còn ${r.chuaXep} việc chưa có chỗ trong tuần.` : `Đã tạo ${kq.moi} việc theo tiến độ và xếp vào giờ trống.`);
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
      {tienDo.moLich && (
        <button type="button" onClick={taoLaiViec} className={gop(NUT, "w-full inline-flex items-center justify-center gap-1.5 bg-xanh text-white border-xanh")}><WandSparkles size={15} />Tạo lại việc tuần này theo tiến độ</button>
      )}
      {tin && <p role="status" className="text-[12.5px] text-chu leading-snug">{tin}</p>}
      {tienDo.moLich && (
        <Link to={DUONG_DAN.keHoach()} onClick={onDi} className={gop(NUT, "w-full inline-flex items-center justify-center bg-trang text-xanh border-xanh/40")}>Mở kế hoạch tuần</Link>
      )}
    </div>
  );
}
