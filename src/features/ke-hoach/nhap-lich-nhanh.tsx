// Hộp "Nhập lịch nhanh": chọn buổi học ở trường và các thứ, rồi hỏi thêm học thêm tối. Thêm vào lịch đang có, không xóa tiết cũ.
import { useState } from "react";
import { CalendarPlus, Check, Moon } from "lucide-react";
import { HopTruot } from "@/components/ui/hien-thi";
import { Nut, gop } from "@/components/ui/nut-the";
import { useApp } from "@/state/store";
import { NhomChon } from "@/features/tu-hoc/thanh-phan";
import { NHAN_THU } from "@/features/tu-hoc/tinh-tien-do";
import { CAC_BUOI_HOC, GIO_HOC_THEM_TOI, THU_MAC_DINH_HOC, tietHocOTruong, tietHocThemToi, type BuoiHoc } from "./lich-tuan";

const CAC_THU = [1, 2, 3, 4, 5, 6, 7].map((t) => ({ gia: t, nhan: NHAN_THU[t] }));
const doiThu = (c: number[], t: number) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]);

/** `xong(soTiet)` được gọi khi đóng hộp sau khi đã thêm; soTiet = 0 nghĩa là em chưa thêm gì. */
export function HopNhapLichNhanh({ xong }: { xong: (soTiet: number) => void }) {
  const { s, themTiet } = useApp();
  const [buoc, setBuoc] = useState<1 | 2>(1);
  const [buoi, setBuoi] = useState<BuoiHoc | null>(null);
  const [thuTruong, setThuTruong] = useState<number[]>(THU_MAC_DINH_HOC);
  const [thuToi, setThuToi] = useState<number[]>([]);
  const [daThem, setDaThem] = useState(0);

  const themTruong = () => {
    if (!buoi) return;
    const moi = tietHocOTruong(buoi, thuTruong, s.coDinh);
    moi.forEach(themTiet);
    setDaThem(moi.length);
    setBuoc(2);
  };
  const themToi = () => {
    const moi = tietHocThemToi(thuToi, s.coDinh);
    moi.forEach(themTiet);
    xong(daThem + moi.length);
  };

  return (
    <HopTruot mo dong={() => xong(daThem)} tieuDe={buoc === 1 ? "Nhập lịch nhanh" : "Học thêm tối?"}>
      {buoc === 1 ? (
        <div className="space-y-4">
          <div>
            <p className="text-[14px] font-bold text-chu mb-1.5">Em học ở trường buổi nào?</p>
            <div role="radiogroup" aria-label="Buổi học ở trường" className="space-y-2">
              {CAC_BUOI_HOC.map((b) => {
                const chon = buoi === b.gia;
                return (
                  <button key={b.gia} type="button" role="radio" aria-checked={chon} onClick={() => setBuoi(b.gia)}
                    className={gop("w-full min-h-16 px-4 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors",
                      chon ? "bg-xanh-nhat border-xanh" : "bg-trang border-vien active:bg-xanh-nhat")}>
                    <span className="flex-1 min-w-0">
                      <b className={gop("block text-[16px] leading-tight", chon ? "text-xanh" : "text-chu")}>{b.nhan}</b>
                      <span className="block text-[13px] text-chu-phu leading-snug">{b.gio}</span>
                    </span>
                    {chon && <Check size={20} className="text-xanh shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[14px] font-bold text-chu mb-1.5">Những thứ nào? <span className="font-semibold text-chu-phu">(bật thêm Thứ 7 nếu có học)</span></p>
            <NhomChon nhan="Các thứ học ở trường" cot={7} giaTri={thuTruong} onChange={(t) => setThuTruong((c) => doiThu(c, t))} cacLua={CAC_THU} />
          </div>
          <p className="text-[13px] text-chu-phu">Mình thêm vào lịch đang có thành tiết “Học ở trường”, không xóa tiết cũ. Em sửa giờ từng tiết sau cũng được.</p>
          <Nut bieuTuong={CalendarPlus} disabled={!buoi || thuTruong.length === 0} onClick={themTruong}>Thêm vào lịch</Nut>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] text-chu">Đã thêm {daThem} tiết học ở trường. Em có học thêm buổi tối không? Mình đặt sẵn {GIO_HOC_THEM_TOI[0]}–{GIO_HOC_THEM_TOI[1]}.</p>
          <NhomChon nhan="Các thứ học thêm tối" cot={7} giaTri={thuToi} onChange={(t) => setThuToi((c) => doiThu(c, t))} cacLua={CAC_THU} />
          <div className="grid grid-cols-2 gap-2">
            <Nut kieu="vien" onClick={() => xong(daThem)}>Không có</Nut>
            <Nut bieuTuong={Moon} disabled={thuToi.length === 0} onClick={themToi}>Thêm</Nut>
          </div>
        </div>
      )}
    </HopTruot>
  );
}
