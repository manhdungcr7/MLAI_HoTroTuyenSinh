// Cổng chờ danh mục chương trình (nạp lười). Trang cần danh mục chỉ dựng khi dữ liệu đã có, để không bao giờ hiện danh mục rỗng như "không có kết quả".
import { type ComponentType } from "react";
import { KhungDangTai, KhungLoi } from "@/components/ui/hien-thi";
import { NoiDung } from "./khung";
import { useDuLieuSan } from "@/state/dung-kho-du-lieu";

export function ChoDuLieu() {
  const { loi, thuLai } = useDuLieuSan();
  return (
    <NoiDung className="pt-6" >
      {loi
        ? <KhungLoi tieuDe="Chưa tải được dữ liệu" moTa="Kiểm tra kết nối mạng rồi thử lại. Hồ sơ của bạn vẫn an toàn trên máy." thuLai={thuLai} />
        : <div role="status" aria-live="polite"><p className="text-[14px] text-chu-phu mb-3">Đang tải dữ liệu chương trình…</p><KhungDangTai cao="h-24" soKhung={3} /></div>}
    </NoiDung>
  );
}

/** Bọc trang: hiện khung đang tải đến khi danh mục sẵn sàng. */
export function boCongDuLieu(Trang: ComponentType): ComponentType {
  return function TrangCoDuLieu() {
    const { san } = useDuLieuSan();
    return san ? <Trang /> : <ChoDuLieu />;
  };
}
