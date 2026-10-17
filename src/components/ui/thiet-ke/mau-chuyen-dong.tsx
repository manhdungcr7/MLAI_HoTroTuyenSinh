// Mục "Chuyển động" của trang xem thử (chỉ dev). Số là minh hoạ, không phải dữ liệu thật.
import { useState } from "react";
import { SkeletonDanhSach } from "@/components/ui/du-bao";
import { TheNen } from "./thanh-phan";
import { VongDiem } from "./vong-diem";

const DIEM_MAU = [12, 20, 26, 9];

export function MauChuyenDong() {
  const [i, setI] = useState(1);
  return (
    <section className="space-y-3" aria-label="Chuyển động">
      <h3 className="text-[16px] font-bold text-muc">Chuyển động</h3>
      <TheNen phatSang tong="luc" className="flex items-center gap-4">
        <VongDiem value={DIEM_MAU[i]} nhanGiua="/30 điểm" tong="luc" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[13px] leading-snug text-chu-phu">Rê chuột lên thẻ (máy tính) hoặc đổi điểm để xem vòng chạy tới giá trị mới.</p>
          <button type="button" onClick={() => setI((i + 1) % DIEM_MAU.length)} className="gd-nut-chinh nay-nhe min-h-11 px-4 rounded-xl text-[14px] font-bold cursor-pointer">Đổi điểm minh hoạ</button>
        </div>
      </TheNen>
      <SkeletonDanhSach so={2} />
    </section>
  );
}
