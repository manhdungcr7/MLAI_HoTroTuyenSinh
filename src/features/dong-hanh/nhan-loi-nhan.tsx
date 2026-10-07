// Em mở liên kết lời nhắn của phụ huynh/thầy cô: xem rồi tự quyết định có lưu vào hồ sơ không.
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircleHeart } from "lucide-react";
import { DauTrangCoQuayLai, NoiDung } from "@/components/layout/khung";
import { Nhan, Nut, The } from "@/components/ui/nut-the";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { DUONG_DAN } from "@/duong-dan";
import { useApp } from "@/state/store";
import { TEN_VAI, docLoiNhan } from "./goi-tin";

export default function NhanLoiNhan() {
  const [q] = useSearchParams();
  const nav = useNavigate();
  const { s, themLoiNhan } = useApp();
  const ln = docLoiNhan(q.get("d"));
  const daLuu = !!ln && s.loiNhan.some((k) => k.id === ln.id);

  if (!ln) {
    return (
      <>
        <DauTrangCoQuayLai tieuDe="Lời nhắn" quayLai={DUONG_DAN.homNay()} />
        <NoiDung>
          <TrangThaiTrong bieuTuong={<MessageCircleHeart size={26} />} tieuDe="Liên kết này không đọc được"
            moTa="Liên kết có thể bị cắt ngắn khi gửi. Em nhờ người gửi chép lại cả đường dẫn." />
        </NoiDung>
      </>
    );
  }
  return (
    <>
      <DauTrangCoQuayLai tieuDe="Lời nhắn cho em" quayLai={DUONG_DAN.homNay()} />
      <NoiDung className="space-y-4">
        <The className="space-y-2">
          <div className="flex items-center gap-2"><p className="text-[16px] font-extrabold text-muc">{ln.tu}</p><Nhan tone="xanh">{TEN_VAI[ln.vai]}</Nhan></div>
          <p className="text-[15px] text-chu leading-relaxed whitespace-pre-line">{ln.noiDung}</p>
          <p className="text-[12px] text-chu-phu leading-snug">Người gửi tự xưng, em chưa thể xác minh.</p>
        </The>
        <p className="text-[13px] text-chu-phu leading-snug">Lời nhắn chỉ được lưu khi em bấm lưu, và chỉ nằm trên máy này. Em có thể xóa bất cứ lúc nào ở Hồ sơ.</p>
        <p className="text-[13px] text-chu-phu leading-snug">Nếu em mở liên kết này trong Zalo, em hãy mở bằng Chrome hoặc Safari chính của máy để lời nhắn lưu vào hồ sơ thật.</p>
        {daLuu
          ? <Nut muiTen onClick={() => nav(DUONG_DAN.hoSo())}>Đã lưu, xem ở Hồ sơ</Nut>
          : <Nut onClick={() => { themLoiNhan(ln); nav(DUONG_DAN.hoSo()); }}>Lưu vào hồ sơ của em</Nut>}
        {!daLuu && <Nut kieu="vien" onClick={() => nav(DUONG_DAN.homNay())}>Không lưu</Nut>}
      </NoiDung>
    </>
  );
}
