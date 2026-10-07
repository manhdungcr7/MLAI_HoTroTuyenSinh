import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { TrangThaiTrong } from "@/components/ui/hien-thi";
import { Nut } from "@/components/ui/nut-the";
import { DUONG_DAN } from "@/duong-dan";

export function Trang404() {
  const nav = useNavigate();
  return (
    <div className="khung-ung-dung p-4 pt-10 space-y-3">
      <TrangThaiTrong bieuTuong={<Home size={26} />} tieuDe="Không tìm thấy trang này"
        moTa="Đường dẫn không tồn tại hoặc đã bị thay đổi. Em về trang Hôm nay nhé." />
      <Nut onClick={() => nav(DUONG_DAN.homNay())}>Về trang Hôm nay</Nut>
    </div>
  );
}
