// Hồ sơ từng môn: cách ôn hiệu quả khác nhau theo bản chất môn. TypeScript thuần, không React.
//
// QUAN TRỌNG: mọi con số ở đây là GIẢ ĐỊNH SƯ PHẠM do nhóm đặt từ cách ôn thi thông thường, CHƯA đo trên học sinh thật.
// Chúng quyết định kế hoạch gợi ý, nên app phải nói rõ "dựa trên quy tắc ôn tập thông thường, chưa hiệu chỉnh bằng dữ liệu".
// Khi có điểm thi thử của nhiều học sinh, hiệu chỉnh `tranBonTuan` và `tauGio` ở đây (bước tiếp theo, xem tuan_docs/21).
import type { MonId } from "@/state/types";

/** Kiểu buổi chính của môn: quyết định khung buổi học. */
export type KieuBuoiMon = "giaiBai" | "onNho" | "vietBai" | "tuVungDoc";

export interface HoSoMon {
  kieu: KieuBuoiMon;
  /** Độ dài một buổi hợp lý (phút). Môn "ôn nhớ" chia thành nhiều buổi ngắn hơn môn "giải bài". */
  buoiToiUuPhut: number;
  /** Trần điểm tăng thực tế trong 4 tuần học đều (trước khi hiệu chỉnh theo mức điểm hiện tại). */
  tranBonTuan: number;
  /** Số giờ học cần (tổng, trong cả giai đoạn) để lấy khoảng 63% phần tăng tối đa ở mức điểm trung bình. */
  tauGio: number;
}

export const HO_SO_MON: Record<MonId, HoSoMon> = {
  toan: { kieu: "giaiBai", buoiToiUuPhut: 75, tranBonTuan: 1.2, tauGio: 45 },
  vatLy: { kieu: "giaiBai", buoiToiUuPhut: 75, tranBonTuan: 1.2, tauGio: 40 },
  hoaHoc: { kieu: "onNho", buoiToiUuPhut: 50, tranBonTuan: 1.8, tauGio: 30 },
  sinh: { kieu: "onNho", buoiToiUuPhut: 50, tranBonTuan: 1.8, tauGio: 30 },
  nguVan: { kieu: "vietBai", buoiToiUuPhut: 90, tranBonTuan: 0.6, tauGio: 60 },
  tiengAnh: { kieu: "tuVungDoc", buoiToiUuPhut: 40, tranBonTuan: 1.2, tauGio: 35 },
};

export interface KhungBuoi {
  /** Phần tiêu đề sau tên môn, ví dụ "giải bài tính giờ". */
  tieuDe: string;
  chiTiet: string;
  cacBuoc: { phut: number; ten: string }[];
  mucTieuBuoi: string;
  tieuChi: string[];
}

const lam5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const chia = (phut: number, ti: number[]): number[] => {
  const ra = ti.map((t) => lam5(phut * t));
  ra[ra.length - 1] = Math.max(5, phut - ra.slice(0, -1).reduce((s, x) => s + x, 0));
  return ra;
};

/**
 * Khung một buổi theo kiểu môn. `chuDe` là chuyên đề được chọn cho buổi (nếu có).
 * `suaLoi`: điểm thi thử môn này đang giảm, nên dành nhiều thời gian hơn để tìm nguyên nhân lỗi.
 * `dauTuan`: buổi đầu của môn trong tuần, dùng để lấy điểm đầu vào thật.
 */
export function khungBuoi(kieu: KieuBuoiMon, phut: number, o: { chuDe?: string; suaLoi?: boolean; dauTuan?: boolean } = {}): KhungBuoi {
  const cd = o.chuDe ?? ""; // giữ nguyên chữ hoa trong chi tiết để khớp tên chuyên đề em đã đánh dấu
  const chuDe = cd ? `${cd[0].toLowerCase()}${cd.slice(1)}` : ""; // dùng cho tiêu đề
  switch (kieu) {
    case "giaiBai": {
      const [a, b, c] = o.suaLoi ? chia(phut, [0.2, 0.4, 0.4]) : chia(phut, [0.2, 0.55, 0.25]);
      return {
        tieuDe: o.dauTuan ? "giải bài tính giờ" : chuDe || "giải bài theo dạng",
        chiTiet: `${a}' xem lại sổ lỗi + ${b}' giải bài ${o.dauTuan ? "tính giờ" : "theo dạng"}${cd ? ` (${cd})` : ""} + ${c}' ghi lỗi.`,
        cacBuoc: [{ phut: a, ten: "Xem lại sổ lỗi sai" }, { phut: b, ten: o.dauTuan ? "Giải bài tính giờ" : "Giải bài theo dạng" }, { phut: c, ten: o.suaLoi ? "Phân tích nguyên nhân lỗi" : "Ghi lỗi vào sổ" }],
        mucTieuBuoi: o.suaLoi ? "Tìm ra lỗi là do chưa biết cách làm hay do tính nhầm, rồi sửa đúng chỗ." : "Giải được đúng và nhanh hơn các dạng bài hay gặp, ghi lại lỗi để lần sau không lặp lại.",
        tieuChi: ["Làm xong số bài đã đặt ra trong thời gian quy định.", "Mỗi câu sai ghi kèm nguyên nhân: chưa biết cách, đọc sai đề hay tính nhầm.", "Sổ lỗi có thêm ít nhất một dòng mới."],
      };
    }
    case "onNho": {
      const [a, b, c] = chia(phut, [0.2, 0.55, 0.25]);
      return {
        tieuDe: o.dauTuan ? "ôn lại và làm bài dạng đang yếu" : chuDe || "ôn nhớ theo chuyên đề",
        chiTiet: `${a}' nhắc lại phần đã học trước đó (không nhìn sách) + ${b}' làm bài dạng đang yếu${cd ? ` (${cd})` : ""} + ${c}' ghi lại điểm cần nhớ.`,
        cacBuoc: [{ phut: a, ten: "Nhắc lại phần đã học, không nhìn sách" }, { phut: b, ten: "Làm bài dạng đang yếu" }, { phut: c, ten: "Ghi điểm cần nhớ" }],
        mucTieuBuoi: "Nhớ chắc phần đã học và làm được dạng bài hay sai, để hai ba ngày sau nhắc lại vẫn còn nhớ.",
        tieuChi: ["Nhắc lại được ý chính hoặc công thức mà không nhìn sách.", "Làm đúng ít nhất 80% số câu cơ bản.", "Ghi lại những điểm còn quên để nhắc lại ở buổi sau."],
      };
    }
    case "vietBai": {
      const [a, b] = chia(phut, [0.65, 0.35]);
      return {
        tieuDe: o.dauTuan ? "viết một bài trọn vẹn" : chuDe || "viết bài và chữa theo tiêu chí",
        chiTiet: `${a}' viết một bài trọn vẹn${cd ? ` (${cd})` : ""} + ${b}' chữa theo tiêu chí chấm.`,
        cacBuoc: [{ phut: a, ten: "Viết bài trọn vẹn" }, { phut: b, ten: "Chữa theo tiêu chí chấm" }],
        mucTieuBuoi: "Viết xong một bài đủ ý, đủ bố cục và biết bài mình thiếu ở đâu so với tiêu chí chấm.",
        tieuChi: ["Viết đủ bố cục: mở bài, thân bài, kết bài.", "Đối chiếu với tiêu chí chấm và đánh dấu phần còn thiếu.", "Văn tăng điểm chậm, nên đều đặn mỗi tuần tốt hơn dồn một lần."],
      };
    }
    case "tuVungDoc": {
      const [a, b, c] = chia(phut, [0.25, 0.55, 0.2]);
      return {
        tieuDe: o.dauTuan ? "từ vựng và đọc hiểu" : chuDe || "từ vựng và ngữ pháp theo chủ đề",
        chiTiet: `${a}' từ vựng (nhắc lại từ cũ + từ mới) + ${b}' ${o.dauTuan ? "đọc hiểu một bài tính giờ" : "luyện ngữ pháp hoặc đọc hiểu"}${cd ? ` (${cd})` : ""} + ${c}' ghi từ sai.`,
        cacBuoc: [{ phut: a, ten: "Từ vựng cũ và mới" }, { phut: b, ten: o.dauTuan ? "Đọc hiểu tính giờ" : "Ngữ pháp hoặc đọc hiểu" }, { phut: c, ten: "Ghi từ và câu sai" }],
        mucTieuBuoi: "Nhớ thêm từ mới, giữ từ cũ, và đọc hiểu nhanh hơn. Học ngắn mà đều mỗi ngày hiệu quả hơn học dài một lần.",
        tieuChi: ["Nhớ lại được số từ đã học mà không nhìn.", "Làm đúng ít nhất 70% câu đọc hiểu.", "Ghi lại từ và cấu trúc còn sai."],
      };
    }
  }
}

/** Mô tả ngắn một kiểu môn, dùng làm "trọng tâm ôn tập" thay cho câu chung cho mọi môn. */
export function trongTamTheoKieu(kieu: KieuBuoiMon, diem: number): string {
  switch (kieu) {
    case "giaiBai":
      return diem < 7 ? "Làm chắc các dạng bài cơ bản và ghi sổ lỗi sai, chưa vội đề khó." : diem < 8.5 ? "Luyện dạng vận dụng, tập giải nhanh có bấm giờ, sửa lỗi tính nhầm." : "Câu phân loại 9–10 điểm và rà lỗi cẩu thả, vì điểm cuối thường mất vì sai sót nhỏ.";
    case "onNho":
      return diem < 7 ? "Học lại phần lý thuyết cốt lõi, nhắc lại sau 1 ngày, 3 ngày và 7 ngày để nhớ lâu." : diem < 8.5 ? "Làm bài dạng đang yếu, nhắc lại những phần hay quên." : "Bài vận dụng cao và tổng hợp, chỉ nhắc lại phần còn quên.";
    case "vietBai":
      return diem < 7 ? "Nắm bố cục và viết đủ ý từng đoạn, mỗi tuần một bài hoàn chỉnh." : "Viết bài theo tiêu chí chấm, làm rõ luận điểm. Văn tăng điểm chậm nên đều đặn quan trọng hơn dồn giờ.";
    case "tuVungDoc":
      return diem < 7 ? "Học từ vựng mỗi ngày một ít, nắm cấu trúc câu và ngữ pháp thường gặp." : "Đọc hiểu tính giờ, luyện dạng câu khó và giữ đều từ vựng.";
  }
}
