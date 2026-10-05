import type { TietCoDinh, ViecCanHoc } from "@/state/types";

// Lịch mẫu để dựng giao diện. Khi dùng thật, học sinh tự nhập lịch của mình.
export const LICH_CO_DINH_MAU: TietCoDinh[] = [
  ...[1, 2, 3, 4, 5].map((thu, i): TietCoDinh => ({ id: `sang-${thu}`, ten: ["Toán", "Vật lý", "Ngữ văn", "Tiếng Anh", "Hóa học"][i] + " (lớp học)", loai: "chinhKhoa", mon: (["toan", "vatLy", "nguVan", "tiengAnh", "hoaHoc"] as const)[i], thu, batDau: "07:00", ketThuc: "08:30" })),
  ...[1, 3, 5].map((thu): TietCoDinh => ({ id: `chieu-${thu}`, ten: "Hóa học (lớp học)", loai: "chinhKhoa", mon: "hoaHoc", thu, batDau: "13:30", ketThuc: "15:00" })),
  { id: "them-toan-t2", ten: "Học thêm Toán", loai: "hocThem", mon: "toan", thu: 2, batDau: "19:15", ketThuc: "21:00" },
  { id: "them-ly-t6", ten: "Học thêm Vật lý", loai: "hocThem", mon: "vatLy", thu: 6, batDau: "19:15", ketThuc: "21:00" },
  { id: "clb-t4", ten: "Câu lạc bộ trường", loai: "khac", thu: 4, batDau: "16:00", ketThuc: "17:30" },
];

export const VIEC_MAU: ViecCanHoc[] = [
  {
    id: "v-toan-ham-so", mon: "toan", tieuDe: "Toán – làm 1 đề hàm số", chiTiet: "Làm một đề hàm số trong 60 phút, rồi chữa lại các câu sai.",
    phut: 120, mucUuTien: "cao",
    lyDo: "Giúp củng cố kiến thức trọng tâm và cải thiện kỹ năng làm bài, hướng tới mục tiêu nâng điểm môn Toán.",
    mucTieuBuoi: "Làm thành thạo dạng hàm số, giảm lỗi sai so với tuần trước để bù điểm Toán.",
    cacBuoc: [{ phut: 60, ten: "Làm bài" }, { phut: 25, ten: "Chữa câu sai" }, { phut: 5, ten: "Tóm tắt công thức" }],
    tieuChi: ["Làm xong 1 đề (tối thiểu 80% số câu).", "Chữa và ghi chú các câu sai.", "Tóm tắt 3 dạng bài hay gặp."],
    taiLieu: [{ ten: "Đề minh họa hàm số có lời giải (PDF)" }, { ten: "Video chữa đề của thầy cô (YouTube)" }],
  },
  {
    id: "v-ly-dien", mon: "vatLy", tieuDe: "Vật lý – điện xoay chiều", chiTiet: "Xem lý thuyết điện xoay chiều và làm 10 câu cơ bản.",
    phut: 90, mucUuTien: "cao",
    lyDo: "Vật lý đang còn thiếu điểm nhiều thứ nhì, ôn đúng chương này tăng điểm nhanh.",
    tieuChi: ["Nắm 3 công thức chính.", "Làm đúng ít nhất 8/10 câu."], taiLieu: [{ ten: "Tóm tắt công thức điện xoay chiều" }],
  },
  {
    id: "v-anh-reading", mon: "tiengAnh", tieuDe: "Tiếng Anh – đọc hiểu 2 bài", chiTiet: "Đọc hiểu 2 bài Reading, ghi từ mới.",
    phut: 60, mucUuTien: "vua", lyDo: "Giữ nhịp để điểm Tiếng Anh không tụt.",
    tieuChi: ["Xong 2 bài.", "Ghi lại 10 từ mới."], taiLieu: [],
  },
  {
    id: "v-hoa-este", mon: "hoaHoc", tieuDe: "Hóa học – ôn este, làm bài tập", chiTiet: "Ôn lý thuyết este và làm bài tập cơ bản.",
    phut: 60, mucUuTien: "vua", lyDo: "Củng cố phần kiến thức hay có trong đề.", tieuChi: ["Làm xong 15 câu."], taiLieu: [],
  },
  {
    id: "v-van-dan-y", mon: "nguVan", tieuDe: "Ngữ văn – lập dàn ý nghị luận", chiTiet: "Lập dàn ý cho 2 đề nghị luận xã hội.",
    phut: 60, mucUuTien: "thap", lyDo: "Giữ cho môn Văn đều tay.", tieuChi: ["Có 2 dàn ý hoàn chỉnh."], taiLieu: [],
  },
];

export const CAU_NOI_DONG_LUC = [
  "Mỗi buổi học nhỏ hôm nay là một bước gần hơn tới ước mơ của em.",
  "Chưa giỏi không sao, chỉ cần hôm nay giỏi hơn hôm qua một chút.",
  "Nghỉ ngơi đúng lúc cũng là một phần của việc học.",
  "Làm xong việc nhỏ trước, việc lớn sẽ bớt đáng sợ.",
  "Không cần hoàn hảo. Cần bắt đầu.",
  "Em đã đi được một đoạn rồi, đừng quên nhìn lại.",
  "Sai ở bài tập hôm nay là đỡ sai ở phòng thi.",
  "Mười lăm phút tập trung còn hơn hai giờ ngồi mà lơ đãng.",
];
