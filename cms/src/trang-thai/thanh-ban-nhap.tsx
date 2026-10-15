// Dòng hỏi khi mở lại form mà còn bản nháp chưa gửi. Khôi phục hoặc Bỏ, không tự đổ dữ liệu.
import { Nut } from "@cms/thanh-phan/ui/nut-the";
import { gioPhut } from "./ban-nhap";

export function ThanhBanNhap({ luuLuc, khoiPhuc, bo }: { luuLuc: number; khoiPhuc: () => void; bo: () => void }) {
  return (
    <div role="status" className="rounded-xl bg-xanh-nhat p-3 space-y-2.5">
      <p className="text-[13px] font-semibold text-xanh">Có bản nháp chưa gửi lúc {gioPhut(luuLuc)}.</p>
      <div className="grid grid-cols-2 gap-2">
        <Nut kieu="chinh" onClick={khoiPhuc}>Khôi phục</Nut>
        <Nut kieu="vien" onClick={bo}>Bỏ</Nut>
      </div>
    </div>
  );
}
