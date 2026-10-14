import type { TietCoDinh, ViecCanHoc } from "@/state/types";

// Lịch mẫu để dựng giao diện (thu: 1 = Thứ 2 ... 7 = Chủ nhật; id "t2" = Thứ 2). Khi dùng thật, học sinh tự nhập lịch của mình.
export const LICH_CO_DINH_MAU: TietCoDinh[] = [
  ...[1, 2, 3, 4, 5].map((thu, i): TietCoDinh => ({ id: `sang-${thu}`, ten: ["Toán", "Vật lý", "Ngữ văn", "Tiếng Anh", "Hóa học"][i] + " (lớp học)", loai: "chinhKhoa", mon: (["toan", "vatLy", "nguVan", "tiengAnh", "hoaHoc"] as const)[i], thu, batDau: "07:00", ketThuc: "08:30" })),
  ...[1, 3, 5].map((thu): TietCoDinh => ({ id: `chieu-${thu}`, ten: "Hóa học (lớp học)", loai: "chinhKhoa", mon: "hoaHoc", thu, batDau: "13:30", ketThuc: "15:00" })),
  { id: "them-toan-t2", ten: "Học thêm Toán", loai: "hocThem", mon: "toan", thu: 1, batDau: "19:15", ketThuc: "21:00" },
  { id: "them-ly-t6", ten: "Học thêm Vật lý", loai: "hocThem", mon: "vatLy", thu: 5, batDau: "19:15", ketThuc: "21:00" },
  { id: "clb-t4", ten: "Câu lạc bộ trường", loai: "khac", thu: 3, batDau: "16:00", ketThuc: "17:30" },
];

// Lịch phổ thông cho nút "Lịch mẫu": học ở trường sáng thứ 2 đến thứ 6, chiều thứ 2, 4, 6, một buổi học thêm tối.
// Không gắn môn nào, không phải lịch của một em cụ thể. LICH_CO_DINH_MAU ở trên giữ cho hồ sơ mẫu và các bài test.
export const LICH_PHO_THONG_MAU: TietCoDinh[] = [
  ...[1, 2, 3, 4, 5].map((thu): TietCoDinh => ({ id: `pt-sang-${thu}`, ten: "Học ở trường", loai: "chinhKhoa", thu, batDau: "07:00", ketThuc: "11:30" })),
  ...[1, 3, 5].map((thu): TietCoDinh => ({ id: `pt-chieu-${thu}`, ten: "Học ở trường", loai: "chinhKhoa", thu, batDau: "13:00", ketThuc: "17:00" })),
  { id: "pt-them-toi-t3", ten: "Học thêm tối", loai: "hocThem", thu: 2, batDau: "19:15", ketThuc: "21:00" },
];

// Việc mẫu của một tuần ôn thi. Tài liệu chỉ có tên, KHÔNG gắn đường link khi chưa kiểm chứng được nguồn.
export const VIEC_MAU: ViecCanHoc[] = [
  {
    id: "v-toan-ham-so", mon: "toan", tieuDe: "Toán – làm 1 đề hàm số", chiTiet: "60' làm đề hàm số + 25' chữa câu sai.",
    phut: 90, mucUuTien: "cao",
    lyDo: "Hàm số là phần chiếm nhiều câu trong đề thi THPT. Làm đề có bấm giờ và chữa kỹ câu sai giúp bạn nắm chắc dạng bài và bù điểm Toán.",
    mucTieuBuoi: "Làm thành thạo dạng hàm số, giảm lỗi sai so với tuần trước để bù điểm Toán.",
    cacBuoc: [{ phut: 60, ten: "Làm đề" }, { phut: 25, ten: "Chữa câu sai" }, { phut: 5, ten: "Tóm tắt công thức" }],
    tieuChi: ["Làm xong 1 đề (tối thiểu 80% số câu).", "Chữa và ghi chú các câu sai vào vở.", "Tóm tắt 3 dạng bài hay gặp."],
    taiLieu: [{ ten: "Đề minh họa hàm số có lời giải" }, { ten: "Vở ghi công thức hàm số của bạn" }],
  },
  {
    id: "v-ly-dien", mon: "vatLy", tieuDe: "Vật lý – ôn điện xoay chiều", chiTiet: "Xem lý thuyết điện xoay chiều + làm 10 câu cơ bản.",
    phut: 90, mucUuTien: "cao",
    lyDo: "Điện xoay chiều có nhiều câu trong đề và các câu cơ bản dễ lấy điểm. Ôn đúng chương này giúp bạn tăng điểm Vật lý nhanh.",
    mucTieuBuoi: "Nhớ chắc 3 công thức chính và làm đúng các câu cơ bản về điện xoay chiều.",
    cacBuoc: [{ phut: 30, ten: "Xem lý thuyết" }, { phut: 45, ten: "Làm 10 câu" }, { phut: 15, ten: "Chữa câu sai" }],
    tieuChi: ["Viết lại được 3 công thức chính không cần nhìn sách.", "Làm đúng ít nhất 8/10 câu.", "Ghi lý do sai của từng câu làm sai."],
    taiLieu: [{ ten: "Tóm tắt công thức điện xoay chiều" }, { ten: "Sách giáo khoa Vật lý 12, chương Điện xoay chiều" }],
  },
  {
    id: "v-anh-reading", mon: "tiengAnh", tieuDe: "Tiếng Anh – đọc hiểu 2 bài", chiTiet: "Đọc hiểu 2 bài Reading, ghi lại từ mới.",
    phut: 60, mucUuTien: "vua",
    lyDo: "Đọc hiểu chiếm nhiều điểm trong đề Tiếng Anh. Đọc đều mỗi tuần giữ cho điểm không tụt và vốn từ tăng dần.",
    mucTieuBuoi: "Đọc xong 2 bài trong thời gian giới hạn và hiểu ý chính từng đoạn.",
    cacBuoc: [{ phut: 40, ten: "Đọc 2 bài" }, { phut: 15, ten: "Chữa câu sai" }, { phut: 5, ten: "Ghi từ mới" }],
    tieuChi: ["Làm xong 2 bài, mỗi bài không quá 20 phút.", "Ghi lại 10 từ mới kèm nghĩa.", "Hiểu vì sao chọn sai ở từng câu sai."],
    taiLieu: [{ ten: "Bộ bài đọc hiểu ôn thi THPT" }],
  },
  {
    id: "v-hoa-este", mon: "hoaHoc", tieuDe: "Hóa học – ôn este, làm bài tập", chiTiet: "Ôn lý thuyết este + làm 15 câu bài tập cơ bản.",
    phut: 60, mucUuTien: "vua",
    lyDo: "Este là phần kiến thức hay có trong đề. Ôn lại giúp bạn không mất điểm ở các câu lý thuyết quen thuộc.",
    mucTieuBuoi: "Nắm lại tính chất của este và làm đúng các dạng bài tập cơ bản.",
    cacBuoc: [{ phut: 20, ten: "Ôn lý thuyết" }, { phut: 35, ten: "Làm 15 câu" }, { phut: 5, ten: "Tóm tắt" }],
    tieuChi: ["Làm xong 15 câu.", "Đúng ít nhất 12/15 câu.", "Viết tóm tắt tính chất este trong 5 dòng."],
    taiLieu: [{ ten: "Sách giáo khoa Hóa học 12, chương Este" }],
  },
  {
    id: "v-van-dan-y", mon: "nguVan", tieuDe: "Ngữ văn – lập dàn ý nghị luận", chiTiet: "Lập dàn ý cho 2 đề nghị luận xã hội.",
    phut: 60, mucUuTien: "thap",
    lyDo: "Lập dàn ý thường xuyên giúp bạn viết nhanh và đủ ý hơn khi vào phòng thi, giữ cho môn Văn đều tay.",
    mucTieuBuoi: "Lập được dàn ý đủ 3 phần cho 2 đề, mỗi đề trong khoảng 25 phút.",
    cacBuoc: [{ phut: 25, ten: "Dàn ý đề 1" }, { phut: 25, ten: "Dàn ý đề 2" }, { phut: 10, ten: "Tự soát lại" }],
    tieuChi: ["Có 2 dàn ý hoàn chỉnh.", "Mỗi dàn ý có ít nhất 3 luận điểm và dẫn chứng."],
    taiLieu: [{ ten: "Đề nghị luận xã hội trong sách ôn tập" }],
  },
  {
    id: "v-toan-trac-nghiem", mon: "toan", tieuDe: "Toán – 20 câu trắc nghiệm mũ, logarit", chiTiet: "Làm 20 câu trắc nghiệm mũ và logarit mức thông hiểu.",
    phut: 45, mucUuTien: "vua",
    lyDo: "Mũ và logarit là phần dễ lấy điểm nếu luyện đủ. Làm nhanh 20 câu giúp bạn quen tay và giảm sai vặt.",
    mucTieuBuoi: "Làm đúng ít nhất 16/20 câu trong 35 phút.",
    cacBuoc: [{ phut: 35, ten: "Làm 20 câu" }, { phut: 10, ten: "Chữa câu sai" }],
    tieuChi: ["Làm xong 20 câu trong 35 phút.", "Đúng ít nhất 16/20 câu."],
    taiLieu: [{ ten: "Bài tập mũ, logarit trong sách ôn tập" }],
  },
  {
    id: "v-anh-tu-vung", mon: "tiengAnh", tieuDe: "Tiếng Anh – ôn 30 từ vựng", chiTiet: "Ôn 30 từ vựng chủ đề Môi trường bằng thẻ từ.",
    phut: 30, mucUuTien: "thap",
    lyDo: "Ôn từ vựng ngắn và đều giúp bạn đọc hiểu nhanh hơn mà không mất nhiều thời gian.",
    mucTieuBuoi: "Nhớ nghĩa và cách dùng 30 từ chủ đề Môi trường.",
    cacBuoc: [{ phut: 20, ten: "Ôn thẻ từ" }, { phut: 10, ten: "Tự kiểm tra" }],
    tieuChi: ["Tự kiểm tra đúng ít nhất 25/30 từ."],
    taiLieu: [{ ten: "Thẻ từ vựng bạn tự làm" }],
  },
  {
    id: "v-sinh-di-truyen", mon: "sinh", tieuDe: "Sinh học – tóm tắt di truyền quần thể", chiTiet: "Tóm tắt lý thuyết di truyền quần thể thành sơ đồ.",
    phut: 45, mucUuTien: "thap",
    lyDo: "Giữ cho kiến thức Sinh không bị quên trong lúc bạn tập trung vào các môn của tổ hợp.",
    mucTieuBuoi: "Có một sơ đồ tóm tắt di truyền quần thể để xem lại trước kỳ thi.",
    cacBuoc: [{ phut: 30, ten: "Đọc và tóm tắt" }, { phut: 15, ten: "Vẽ sơ đồ" }],
    tieuChi: ["Có 1 sơ đồ tóm tắt trên một trang.", "Giải thích lại được bằng lời trong 2 phút."],
    taiLieu: [{ ten: "Sách giáo khoa Sinh học 12" }],
  },
];

export const CAU_NOI_DONG_LUC = [
  "Mỗi buổi học nhỏ hôm nay là một bước gần hơn tới ước mơ của bạn.",
  "Chưa giỏi không sao, chỉ cần hôm nay giỏi hơn hôm qua một chút.",
  "Nghỉ ngơi đúng lúc cũng là một phần của việc học.",
  "Làm xong việc nhỏ trước, việc lớn sẽ bớt đáng sợ.",
  "Không cần hoàn hảo. Cần bắt đầu.",
  "Bạn đã đi được một đoạn rồi, đừng quên nhìn lại.",
  "Sai ở bài tập hôm nay là đỡ sai ở phòng thi.",
  "Mười lăm phút tập trung còn hơn hai giờ ngồi mà lơ đãng.",
];
