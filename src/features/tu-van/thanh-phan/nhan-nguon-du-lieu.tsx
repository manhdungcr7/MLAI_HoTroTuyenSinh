import type { TrangThaiDuLieu } from "@/engine/tu-van";

const NHAN: Record<TrangThaiDuLieu, string> = {
  "da-xac-minh": "Nguồn: đề án chính thức của trường",
  "chua-xac-minh": "Nguồn tham khảo chưa được kiểm chứng độc lập",
  "lich-su": "Điểm các năm trước, không phải điểm năm nay",
  "uoc-tinh": "Số liệu ước tính, cần đối chiếu đề án",
  "du-bao": "Khoảng dự kiến, chưa phải điểm chính thức",
  "chua-co": "Chưa có dữ liệu cho phần này",
};

/** Dòng nhỏ cuối câu trả lời: nói rõ độ tin cậy của dữ liệu, không phơi bày trạng thái kỹ thuật. */
export function DataSourceLabel({ trangThai, congDong }: { trangThai?: TrangThaiDuLieu; congDong?: boolean }) {
  if (!trangThai && !congDong) return null;
  return (
    <p className="mt-1.5 text-[12px] leading-snug text-chu-phu">
      {trangThai ? `${NHAN[trangThai]}. ` : ""}{congDong ? "Có dùng ghi chú cộng đồng, chưa phải thông tin chính thức." : ""}
    </p>
  );
}
