import type { TrangThaiDuLieu } from "@/engine/tu-van";

const NHAN: Record<TrangThaiDuLieu, string> = {
  "da-xac-minh": "Số liệu theo đề án chính thức của trường",
  "lich-su": "Điểm chuẩn các năm trước, không phải điểm năm nay",
  "uoc-tinh": "Có số liệu ước tính, chưa có văn bản của trường",
  "du-bao": "Khoảng dự kiến, không phải điểm chính thức",
  "chua-co": "Chưa có dữ liệu cho phần này",
};

/** Dòng nhỏ cuối câu trả lời: số liệu thuộc loại nào và ai trả lời (AI hay tự động). */
export function DataSourceLabel({ trangThai, cheDo, tang, congDong }: { trangThai?: TrangThaiDuLieu; cheDo?: "ai" | "tuDong"; tang?: "cache" | "llm"; congDong?: boolean }) {
  const ai = cheDo === "ai" ? (tang === "cache" ? "Trả lời AI đã lưu, chỉ dùng số liệu trong app" : "Trả lời bởi AI, chỉ dùng số liệu trong app") : "Trả lời từ số liệu có sẵn trong app";
  return (
    <p className="mt-1.5 text-[12px] leading-snug text-chu-phu">
      {trangThai ? `${NHAN[trangThai]}. ` : ""}{congDong ? "Có dùng ghi chú của cộng đồng, chưa phải thông tin chính thức. " : ""}{ai}
    </p>
  );
}
