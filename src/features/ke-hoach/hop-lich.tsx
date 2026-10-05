// Các hộp trượt của chế độ Lịch: thêm khối, gợi ý khi trùng giờ, xem một mục trong lịch.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCog, Clock, Trash2 } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { ChonNhanh, OChon, OInput, Truong } from "@/components/ui/nhap-lieu";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";
import { phatHienTrung } from "@/engine/xep-lich";
import { homNay } from "@/state/chon";
import { useApp } from "@/state/store";
import { CAC_MON, TEN_MON, type KhoiHoc, type MonId } from "@/state/types";
import { phutBayGio, soPhut, tenNgay, thoiLuong } from "./dinh-dang";
import { useDoiKhoi } from "./thanh-phan";
import { goiYDoiKhoi, kiemTraGio, mucLichTrongNgay, type CapTrung, type MucLich } from "./tinh-toan";

type LoaiThem = "tuHoc" | "khac" | "nghi";
const CAC_LOAI: { gia: LoaiThem; nhan: string }[] = [
  { gia: "tuHoc", nhan: "Tự học" }, { gia: "khac", nhan: "Hoạt động khác" }, { gia: "nghi", nhan: "Nghỉ ngơi" },
];

/** "Thêm giờ học/hoạt động" cho ngày đang chọn. Khối tự thêm được khóa giờ và xóa được. */
export function HopThemKhoi({ mo, dong, ngay, hienThongBao }: { mo: boolean; dong: () => void; ngay: string; hienThongBao: (c: string) => void }) {
  const { s, themKhoi } = useApp();
  const [ten, setTen] = useState("");
  const [loai, setLoai] = useState<LoaiThem>("tuHoc");
  const [mon, setMon] = useState<MonId | "">("");
  const [batDau, setBatDau] = useState("16:00");
  const [ketThuc, setKetThuc] = useState("17:00");
  const [loi, setLoi] = useState<string | null>(null);

  const luu = () => {
    const tenSach = ten.trim() || (loai === "tuHoc" && mon ? `Tự học ${TEN_MON[mon]}` : "");
    if (!tenSach) return setLoi("Em đặt tên cho khối này nhé, ví dụ “Tự học Toán” hay “Đá bóng”.");
    const loiGio = kiemTraGio(batDau, ketThuc);
    if (loiGio) return setLoi(loiGio);
    const moi: Omit<KhoiHoc, "id"> = { viecId: null, ten: tenSach, loai, mon: loai === "tuHoc" && mon ? mon : undefined, ngay, batDau, ketThuc, khoa: true };
    const cungNgay = mucLichTrongNgay(s.coDinh, s.khoiHoc, ngay).map(({ id, ten: t, batDau: a, ketThuc: b }) => ({ id, ten: t, batDau: a, ketThuc: b }));
    const biTrung = phatHienTrung([...cungNgay, { id: "moi", ten: tenSach, batDau, ketThuc }]).some(([a, b]) => a.id === "moi" || b.id === "moi");
    themKhoi(moi);
    hienThongBao(biTrung ? "Đã thêm. Khối này trùng giờ, em xem gợi ý nhé" : "Đã thêm vào lịch");
    setTen(""); setMon(""); setLoi(null);
    dong();
  };

  return (
    <HopTruot mo={mo} dong={dong} tieuDe="Thêm giờ học/hoạt động">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); luu(); }} noValidate>
        <p className="text-[14px] text-chu-phu">Thêm vào <b className="text-chu">{tenNgay(ngay, homNay())}</b>. Xếp lịch giúp em sẽ không động vào khối này.</p>
        <div role="group" aria-labelledby="loai-khoi">
          <span id="loai-khoi" className="block text-[14px] font-bold text-chu mb-1.5">Loại</span>
          <ChonNhanh cacLua={CAC_LOAI} giaTri={loai} onChange={(v: LoaiThem) => { setLoai(v); setLoi(null); }} />
        </div>
        {loai === "tuHoc" && (
          <Truong nhan="Môn (không bắt buộc)">
            <OChon value={mon} onChange={(e) => setMon(e.target.value as MonId | "")}>
              <option value="">Không chọn môn</option>
              {CAC_MON.map((m) => <option key={m} value={m}>{TEN_MON[m]}</option>)}
            </OChon>
          </Truong>
        )}
        <Truong nhan="Tên" batBuoc={!(loai === "tuHoc" && mon)}>
          <OInput value={ten} maxLength={60} onChange={(e) => { setTen(e.target.value); setLoi(null); }}
            placeholder={loai === "tuHoc" ? "Ví dụ: Tự học Toán" : loai === "khac" ? "Ví dụ: Câu lạc bộ, đá bóng" : "Ví dụ: Nghỉ trưa"} />
        </Truong>
        <div className="grid grid-cols-2 gap-2">
          <Truong nhan="Bắt đầu"><OInput type="time" step={300} value={batDau} onChange={(e) => { setBatDau(e.target.value); setLoi(null); }} /></Truong>
          <Truong nhan="Kết thúc"><OInput type="time" step={300} value={ketThuc} onChange={(e) => { setKetThuc(e.target.value); setLoi(null); }} /></Truong>
        </div>
        {loi && <p role="alert" className="text-[13px] font-semibold text-do-chu">{loi}</p>}
        <Nut type="submit">Thêm vào lịch</Nut>
      </form>
    </HopTruot>
  );
}

/** Gợi ý gỡ chỗ trùng giờ: dời khối sang khung trống gần giờ cũ nhất, hoặc xóa khối tự thêm. */
export function HopTrungGio({ mo, dong, trung, hienThongBao }: { mo: boolean; dong: () => void; trung: CapTrung[]; hienThongBao: (c: string) => void }) {
  const { s, xoaKhoi } = useApp();
  const nav = useNavigate();
  const doiKhoi = useDoiKhoi();
  const hom = homNay();
  return (
    <HopTruot mo={mo && trung.length > 0} dong={dong} tieuDe="Gợi ý gỡ trùng giờ">
      <ul className="space-y-3">
        {trung.map((c) => {
          const k = c.doi?.khoi;
          const g = k ? goiYDoiKhoi(k, { coDinh: s.coDinh, khoiHoc: s.khoiHoc, cfg: s.cauHinh, homNay: hom, phutBayGio: phutBayGio() }) : null;
          return (
            <li key={`${c.a.id}|${c.b.id}`} className="rounded-the border border-do/30 p-3.5 space-y-2.5">
              <p className="text-[14px] text-chu leading-snug">
                <b>{c.a.ten}</b> <span className="text-chu-phu">({c.a.batDau} – {c.a.ketThuc})</span> trùng với <b>{c.b.ten}</b> <span className="text-chu-phu">({c.b.batDau} – {c.b.ketThuc})</span>.
              </p>
              {!k ? (
                <>
                  <p className="text-[13px] text-chu-phu">{c.a.nguon === "baoVe" || c.b.nguon === "baoVe" ? "Lớp học cố định đang đè lên giờ ăn nghỉ." : "Hai lớp học cố định trùng nhau."} Em kiểm tra lại lịch học nhé.</p>
                  <Nut kieu="vien" bieuTuong={CalendarCog} onClick={() => nav(DUONG_DAN.caiDatLichHoc())}>Sửa lịch học</Nut>
                </>
              ) : (
                <>
                  {g ? (
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-luc-chu">
                      <Clock size={16} className="shrink-0" />Dời “{k.ten}” sang {tenNgay(g.ngay, hom).toLowerCase()} {g.batDau} – {g.ketThuc}
                    </p>
                  ) : <p className="text-[13px] text-chu-phu">Chưa tìm được khung trống đủ {thoiLuong(soPhut(k.batDau, k.ketThuc))} trong 3 ngày tới.</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => { xoaKhoi(k.id); hienThongBao("Đã xóa khỏi lịch"); }}>Xóa khối</Nut>
                    {g ? <Nut bieuTuong={ArrowRight} onClick={() => { doiKhoi(k, g); hienThongBao(`Đã dời sang ${g.batDau}`); }}>Chấp nhận</Nut>
                      : <Nut kieu="vien" onClick={() => nav(DUONG_DAN.caiDatTuHoc())}>Nới giờ</Nut>}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <Nut kieu="vien" className="mt-3" onClick={dong}>Để sau</Nut>
    </HopTruot>
  );
}

/** Xem một mục trong lịch không gắn việc: lớp học cố định, buổi xem trước bài, khối em tự thêm. */
export function HopMucLich({ muc, dong, quaKhu, hienThongBao }: { muc: MucLich | null; dong: () => void; quaKhu: boolean; hienThongBao: (c: string) => void }) {
  const { xoaKhoi } = useApp();
  const nav = useNavigate();
  if (!muc) return null;
  const k = muc.khoi;
  const moTa = muc.nguon === "coDinh"
    ? "Đây là giờ học cố định em đã nhập. Mình luôn chừa 10 phút trước và sau để em di chuyển, chuẩn bị."
    : k && !k.id.startsWith("auto-") ? "Khối em tự thêm. Xếp lịch giúp em sẽ giữ nguyên giờ này."
      : "Khối do mình xếp. Bấm Xếp lịch giúp em để sắp xếp lại khi lịch của em thay đổi.";
  return (
    <HopTruot mo dong={dong} tieuDe={muc.ten}>
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-[15px] font-bold text-chu"><Clock size={18} className="text-xanh" />{muc.batDau} – {muc.ketThuc} · {thoiLuong(soPhut(muc.batDau, muc.ketThuc))}</p>
        {muc.ghiChu && <p className="text-[14px] text-chu rounded-xl bg-luc-nhat p-3">{muc.ghiChu}</p>}
        <p className="text-[13px] text-chu-phu">{moTa}</p>
        {muc.nguon === "coDinh" ? (
          <Nut kieu="vien" bieuTuong={CalendarCog} onClick={() => nav(DUONG_DAN.caiDatLichHoc())}>Sửa lịch học</Nut>
        ) : k && !quaKhu ? (
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="nguyHiem" bieuTuong={Trash2} onClick={() => { xoaKhoi(k.id); hienThongBao("Đã xóa khỏi lịch"); dong(); }}>Xóa khối</Nut>
            <Nut onClick={dong}>Đóng</Nut>
          </div>
        ) : <Nut onClick={dong}>Đóng</Nut>}
      </div>
    </HopTruot>
  );
}
