// Trắc nghiệm sở thích nghề nghiệp theo mô hình Holland (RIASEC): 6 nhóm × 3 câu, 4 mức trả lời.
// TypeScript thuần, không React. Kết quả chỉ gợi ý nhóm ngành để em tìm hiểu, không phải chẩn đoán hay kết luận về con người em.
import type { KetQuaSoThich, LoaiSoThich } from "@/state/types";

export const CAC_LOAI: LoaiSoThich[] = ["R", "I", "A", "S", "E", "C"];

export const THONG_TIN_LOAI: Record<LoaiSoThich, { ten: string; moTa: string }> = {
  R: { ten: "Thực hành", moTa: "Thích làm việc với đồ vật, máy móc, công cụ, ngoài trời; thích thấy kết quả cụ thể." },
  I: { ten: "Tìm tòi", moTa: "Thích quan sát, phân tích, giải bài toán khó và hiểu vì sao sự việc xảy ra." },
  A: { ten: "Sáng tạo", moTa: "Thích tự do thể hiện ý tưởng qua hình ảnh, chữ viết, âm nhạc, thiết kế." },
  S: { ten: "Giúp đỡ", moTa: "Thích làm việc với người khác: dạy, chăm sóc, lắng nghe, giúp người khác tiến bộ." },
  E: { ten: "Dẫn dắt", moTa: "Thích thuyết phục, tổ chức, kinh doanh, đứng ra quyết định và chịu trách nhiệm." },
  C: { ten: "Cẩn thận, ngăn nắp", moTa: "Thích làm việc có quy trình rõ, số liệu chính xác, sắp xếp mọi thứ gọn gàng." },
};

export const MUC_TRA_LOI = [
  { gia: 0, nhan: "Không thích" },
  { gia: 1, nhan: "Hơi thích" },
  { gia: 2, nhan: "Thích" },
  { gia: 3, nhan: "Rất thích" },
] as const;

export interface CauHoi { loai: LoaiSoThich; chu: string }

// Xen kẽ các nhóm để em không đoán được "đang đo gì" và đỡ trả lời theo quán tính.
export const CAC_CAU_HOI: CauHoi[] = [
  { loai: "R", chu: "Sửa một món đồ bị hỏng hoặc lắp ráp mô hình bằng tay." },
  { loai: "I", chu: "Tìm hiểu xem một hiện tượng khoa học hay một lỗi phần mềm xảy ra vì sao." },
  { loai: "A", chu: "Vẽ, thiết kế, viết, quay dựng hoặc sáng tác điều gì đó của riêng mình." },
  { loai: "S", chu: "Giảng lại bài cho bạn hiểu hoặc giúp ai đó giải quyết chuyện khó khăn." },
  { loai: "E", chu: "Đứng ra tổ chức một hoạt động và thuyết phục mọi người cùng tham gia." },
  { loai: "C", chu: "Lập bảng, sắp xếp tài liệu hoặc quản lý chi tiêu cho gọn gàng, chính xác." },
  { loai: "R", chu: "Làm việc ngoài trời hoặc ở xưởng thay vì ngồi cả ngày trong phòng." },
  { loai: "I", chu: "Giải một bài toán hoặc câu đố hóc búa dù mất nhiều thời gian." },
  { loai: "A", chu: "Nghĩ ra cách làm mới lạ thay vì làm theo mẫu có sẵn." },
  { loai: "S", chu: "Lắng nghe và động viên người đang buồn hoặc căng thẳng." },
  { loai: "E", chu: "Bán hoặc giới thiệu một sản phẩm, một ý tưởng cho người khác." },
  { loai: "C", chu: "Làm việc theo các bước rõ ràng và kiểm tra kỹ để không sai sót." },
  { loai: "R", chu: "Tìm hiểu cách máy móc, thiết bị điện hoặc công trình hoạt động." },
  { loai: "I", chu: "Đọc, thí nghiệm hoặc thu thập số liệu để kiểm chứng một ý tưởng." },
  { loai: "A", chu: "Biểu diễn, thuyết trình hoặc kể chuyện trước nhiều người bằng cách của mình." },
  { loai: "S", chu: "Làm tình nguyện hoặc tham gia hoạt động giúp cộng đồng." },
  { loai: "E", chu: "Lên kế hoạch kiếm tiền hoặc khởi nghiệp một việc nhỏ." },
  { loai: "C", chu: "Làm việc với con số, biểu mẫu, hồ sơ và đảm bảo mọi thứ khớp nhau." },
];

/** Mỗi nhóm Holland gợi ý các nhóm ngành trong dữ liệu; nhóm đứng đầu danh sách phù hợp nhất. */
export const NHOM_NGANH_THEO_LOAI: Record<LoaiSoThich, string[]> = {
  R: ["Kỹ thuật", "Xây dựng", "Nông Lâm", "Logistics", "Thể thao"],
  I: ["CNTT", "Y Dược", "Kỹ thuật", "Điều dưỡng", "Nông Lâm"],
  A: ["Thiết kế", "Kiến trúc", "Báo chí", "Ngôn ngữ", "Marketing"],
  S: ["Sư phạm", "Điều dưỡng", "Xã hội", "Du lịch", "Y Dược"],
  E: ["Kinh tế", "Marketing", "Luật", "Du lịch", "Logistics"],
  C: ["Tài chính", "Kinh tế", "Logistics", "CNTT", "Luật"],
};

const TOI_DA_MOI_LOAI = 3 * 3; // 3 câu × mức cao nhất

/** Điểm từng nhóm (0–9). Trả lời thiếu hoặc sai kiểu thì trả null để không kết luận bừa. */
export function tinhKetQua(traLoi: number[], luc = new Date()): KetQuaSoThich | null {
  if (traLoi.length !== CAC_CAU_HOI.length || traLoi.some((x) => !Number.isInteger(x) || x < 0 || x > 3)) return null;
  const diem: Record<LoaiSoThich, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  CAC_CAU_HOI.forEach((c, i) => { diem[c.loai] += traLoi[i]; });
  // Cùng điểm thì giữ thứ tự RIASEC để kết quả ổn định giữa các lần chạy.
  const top = [...CAC_LOAI].sort((a, b) => diem[b] - diem[a] || CAC_LOAI.indexOf(a) - CAC_LOAI.indexOf(b)).slice(0, 3);
  return { diem, top, luc: luc.toISOString() };
}

/** Khi mọi nhóm gần bằng nhau, kết quả không phân biệt được: nói thật thay vì cố chọn. */
export const khongRoNet = (kq: KetQuaSoThich): boolean => {
  const v = CAC_LOAI.map((l) => kq.diem[l]);
  return Math.max(...v) - Math.min(...v) <= 2;
};

export interface NhomNganhGoiY { nhom: string; diem: number }

/** Xếp nhóm ngành theo kết quả: nhóm Holland càng cao điểm, ngành đứng đầu danh sách của nhóm đó càng được cộng nhiều. */
export function nhomNganhGoiY(kq: KetQuaSoThich, soLuong = 5): NhomNganhGoiY[] {
  const cong = new Map<string, number>();
  for (const l of CAC_LOAI) {
    NHOM_NGANH_THEO_LOAI[l].forEach((nhom, i) => {
      const trongSo = i === 0 ? 1 : 0.6;
      cong.set(nhom, (cong.get(nhom) ?? 0) + (kq.diem[l] / TOI_DA_MOI_LOAI) * trongSo);
    });
  }
  return [...cong.entries()].map(([nhom, diem]) => ({ nhom, diem: Math.round(diem * 100) / 100 }))
    .sort((a, b) => b.diem - a.diem || a.nhom.localeCompare(b.nhom, "vi")).slice(0, soLuong);
}

/** Dòng mô tả ngắn, ví dụ "Sáng tạo, Tìm tòi và Giúp đỡ". */
export function moTaTop(kq: KetQuaSoThich): string {
  const ten = kq.top.map((l) => THONG_TIN_LOAI[l].ten);
  return ten.length <= 1 ? ten.join("") : `${ten.slice(0, -1).join(", ")} và ${ten[ten.length - 1]}`;
}
