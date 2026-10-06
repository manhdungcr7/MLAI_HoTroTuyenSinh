// Hộp tóm tắt sau khi bấm "Xếp lịch giúp em".
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Info, Settings2, Undo2 } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { BieuTuongTron } from "@/components/ui/hinh-nen";
import { DongThongBao } from "@/components/ui/thong-bao";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { homNay, viecCuaTuan } from "@/state/chon";
import { useApp } from "@/state/store";
import { tenNgay, thoiLuong } from "./dinh-dang";
import { soBuoiTuHoc, viecChuaCoCho } from "./tinh-toan";

export interface KetQuaXep { chuaXep: number; ghiChu: string[]; tuNgay?: string; hetTuan?: boolean }

export function HopXepLich({ ketQua, ngays, dong, xemLich, daXepCaBoQua }: {
  ketQua: KetQuaXep | null; ngays: string[]; dong: () => void; xemLich: () => void; daXepCaBoQua: () => void;
}) {
  const { s, datTrangThaiViec } = useApp();
  const nav = useNavigate();
  if (!ketQua) return null;
  const hom = homNay();
  // Đếm trực tiếp từ dữ liệu đã lưu sau khi xếp, nên luôn khớp với màn Lịch.
  const tongBuoi = soBuoiTuHoc(s.khoiHoc, ngays, ketQua.tuNgay);
  const soXemTruoc = s.khoiHoc.filter((k) => k.loai === "tuHoc" && !k.viecId && k.id.startsWith("auto-") && ngays.includes(k.ngay) && (!ketQua.tuNgay || k.ngay >= ketQua.tuNgay)).length;
  const soBuoi = tongBuoi - soXemTruoc;
  const viecTuan = viecCuaTuan(s.viec, ngays[0]);
  const chuaCoCho = viecChuaCoCho(viecTuan, s.trangThaiViec, s.khoiHoc, ngays);
  const boQua = viecTuan.filter((v) => s.trangThaiViec[v.id] === "boQua");
  const tuDau = ketQua.tuNgay && ketQua.tuNgay > ngays[0] ? ` từ ${tenNgay(ketQua.tuNgay, hom).toLowerCase()}` : "";

  return (
    <HopTruot mo dong={dong} tieuDe={ketQua.hetTuan ? "Tuần này sắp hết" : "Đã xếp lịch tuần này"}>
      <div className="space-y-3">
        {!ketQua.hetTuan && (
          <div className="flex items-center gap-3 rounded-the bg-luc-nhat p-3.5">
            <BieuTuongTron icon={CalendarClock} tone="luc" kichThuoc={48} />
            <p className="text-[14px] text-chu leading-snug">
              Mình đã xếp <b className="text-luc-chu text-[18px]">{soBuoi} buổi tự học</b>{soXemTruoc > 0 && <> và <b className="text-luc-chu">{soXemTruoc} buổi xem trước bài</b></>}{tuDau}, tránh giờ học trên lớp và giờ ăn nghỉ.
            </p>
          </div>
        )}

        {ketQua.ghiChu.map((g) => <DongThongBao key={g} tone="cam" icon={Info} tieuDe={g} />)}

        {!ketQua.hetTuan && (chuaCoCho.length > 0 ? (
          <div className="rounded-the border border-cam/40 p-3.5 space-y-2">
            <p className="font-extrabold text-muc text-[15px]">Việc chưa có chỗ ({chuaCoCho.length})</p>
            <ul className="space-y-1.5">
              {chuaCoCho.map((v) => (
                <li key={v.id} className="flex justify-between gap-2 text-[14px]">
                  <span className="text-chu min-w-0">{v.tieuDe}</span>
                  <span className="text-chu-phu whitespace-nowrap">{thoiLuong(v.phut)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-chu-phu">Em có thể nới giờ tự học mỗi ngày, bớt ngày nghỉ, hoặc làm việc này vào tuần sau.</p>
            <Nut kieu="nhe" bieuTuong={Settings2} onClick={() => nav(DUONG_DAN.caiDatTuHoc())}>Nới giờ tự học</Nut>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-[14px] font-semibold text-luc-chu"><CheckCircle2 size={18} />Mọi việc còn lại đều đã có giờ.</p>
        ))}

        {!ketQua.hetTuan && boQua.length > 0 && (
          <div className="rounded-the bg-nen p-3.5 space-y-2">
            <p className="text-[14px] text-chu"><b>{boQua.length} việc em đã bỏ qua</b> chưa được xếp: {boQua.map((v) => v.tieuDe).join("; ")}.</p>
            <Nut kieu="vien" bieuTuong={Undo2} onClick={() => { boQua.forEach((v) => datTrangThaiViec(v, "chua")); daXepCaBoQua(); }}>Xếp cả việc đã bỏ qua</Nut>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Nut kieu="vien" onClick={dong}>Đóng</Nut>
          <Nut onClick={xemLich}>Xem lịch</Nut>
        </div>
      </div>
    </HopTruot>
  );
}
