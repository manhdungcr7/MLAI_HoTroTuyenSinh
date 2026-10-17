// Câu chữ dùng chung cho phần dự báo và trạng thái dữ liệu. Một nơi duy nhất để mọi màn nói cùng một giọng.
// Giọng: "bạn/em" theo ngữ cảnh, câu ngắn, không hứa hẹn kết quả, giải thích thuật ngữ bằng tiếng Việt thông dụng.
import type { LoaiDuLieu } from "@/engine/trang-thai-du-lieu";

export const NHAN_DU_BAO = (nam: number) => `Dự báo tham khảo ${nam}, không phải điểm chuẩn chính thức.`;

export const TIEU_DE_TRANG_THAI: Record<LoaiDuLieu, string> = {
  nhieuNam: "Có điểm chuẩn nhiều năm",
  motNam: "Mới có điểm chuẩn một năm",
  chiDiemSan: "Chỉ có điểm sàn",
  khongDu: "Chưa đủ dữ liệu để dự báo",
  phuongThucKhac: "Điểm của phương thức khác",
};

export const GIAI_THICH_TRANG_THAI: Record<LoaiDuLieu, string> = {
  nhieuNam: "Có điểm chuẩn của từ hai năm, nên xem được xu hướng và khoảng dự báo.",
  motNam: "Mới có một năm nên chỉ để tham khảo, chưa đủ để thấy xu hướng.",
  chiDiemSan: "Mới có điểm sàn của trường, chưa có điểm chuẩn riêng của ngành. Điểm sàn chỉ là mức thấp nhất được nhận hồ sơ, không phải mức để trúng tuyển.",
  khongDu: "Ngành này chưa có điểm chuẩn hợp lệ nên chưa dự báo được. Em xem thử ngành tương tự, hoặc xem thông báo tuyển sinh của trường.",
  phuongThucKhac: "Điểm này thuộc phương thức khác (học bạ, đánh giá năng lực...), nên không so trực tiếp với điểm thi tốt nghiệp THPT.",
};

export const NHAN_LOI_THOI = "Điểm đã cũ, chỉ để tham khảo.";
export const NHAN_THAM_CHIEU = "Điểm tham chiếu từ trang tổng hợp, chưa đối chiếu đề án của trường.";
export const NHAN_CHUONG_TRINH_MOI = "Chương trình mới, chưa có lịch sử điểm chuẩn.";

/** Thuật ngữ cần giải thích ngắn gọn cho học sinh. */
export const THUAT_NGU: Record<string, { ten: string; nghia: string }> = {
  diemChuan: { ten: "Điểm chuẩn", nghia: "Điểm của thí sinh cuối cùng được nhận vào ngành năm đó. Mỗi năm một khác." },
  diemSan: { ten: "Điểm sàn", nghia: "Mức điểm thấp nhất để được nộp hồ sơ xét tuyển. Đạt điểm sàn chưa có nghĩa là trúng tuyển." },
  khoangDuBao: { ten: "Khoảng dự báo", nghia: "Vùng điểm mà điểm chuẩn năm tới có thể rơi vào, nếu biến động giống các năm trước. Không phải kết quả chính thức." },
  diemThiThu: { ten: "Điểm thi thử", nghia: "Điểm em làm trong bài thi thử. Dùng để biết em đang ở đâu." },
  diemMucTieu: { ten: "Điểm mục tiêu", nghia: "Mức điểm em muốn đạt. Đây là mong muốn, chưa phải điểm em đã có." },
  diemThiThat: { ten: "Điểm thi thật", nghia: "Điểm trong kết quả thi tốt nghiệp THPT chính thức." },
  diemHocBa: { ten: "Điểm học bạ", nghia: "Điểm trung bình các môn ở trường. Chỉ dùng cho phương thức xét học bạ." },
  toHop: { ten: "Tổ hợp", nghia: "Nhóm ba môn dùng để tính điểm xét tuyển, ví dụ A00 gồm Toán, Lý, Hóa." },
  dgnl: { ten: "ĐGNL", nghia: "Đánh giá năng lực, kỳ thi riêng do một số trường tổ chức. Điểm này không so trực tiếp với điểm thi tốt nghiệp THPT." },
  mucPhuHop: { ten: "Mức phù hợp", nghia: "So sánh điểm của em với điểm các năm trước. Không phải xác suất đậu." },
};

// ---- Thêm cho khối dự báo tương tác (Agent 2). Không sửa các câu phía trên. ----
export const NHAN_KET_LUAN: Record<"caoHonCa" | "tren" | "trongKhoang" | "duoi" | "thapHonCa", string> = {
  caoHonCa: "Đang ở phía trên khoảng dự báo",
  tren: "Có cơ hội, nhưng còn biến động",
  trongKhoang: "Sát ngưỡng, cần cân nhắc",
  duoi: "Hơi thấp hơn khoảng dự báo",
  thapHonCa: "Còn cách xa khoảng dự báo",
};

export const CAU_LUU_Y_DU_BAO = "Tuy nhiên điểm chuẩn thực tế vẫn có thể thay đổi.";
export const NHAN_XEM_THU = "Đang xem thử, chưa lưu vào hồ sơ của em.";
export const NHAN_THAM_CHIEU_HAN_CHE = "Tham chiếu hạn chế: mới có điểm chuẩn một năm.";
export const NHAN_KHONG_SO_PHUONG_THUC = "Không so với điểm thi THPT của em.";
export const NHAN_CHI_DIEM_SAN = "Chỉ có điểm sàn";
export const NHAN_NGOAI_TUYEN = "Đang không có mạng. Dữ liệu đã tải vẫn xem được, dữ liệu mới sẽ cập nhật khi có mạng.";

// ---- Bổ sung của Agent 4 (nội dung). Chỉ thêm khoá mới. ----

/** Năm dự báo chuẩn cho nhãn. Dùng khi chưa có năm cụ thể. */
export const NHAN_DU_BAO_2027 = NHAN_DU_BAO(2027);

/** Trạng thái G, H: ngoài 5 loại dữ liệu của engine. */
export type LoaiTrangThaiPhu = "doiMa" | "chuaXuatBan" | "daCu";
export const TIEU_DE_TRANG_THAI_PHU: Record<LoaiTrangThaiPhu, string> = {
  doiMa: "Mã ngành đã đổi giữa các năm",
  chuaXuatBan: "Dự báo chưa được xuất bản",
  daCu: "Dự báo đã cũ",
};
export const GIAI_THICH_TRANG_THAI_PHU: Record<LoaiTrangThaiPhu, string> = {
  doiMa: "Mã ngành đã đổi giữa các năm, mỗi năm hiển thị đúng mã của năm đó. Điểm các năm vẫn được nối theo cùng một ngành của trường.",
  chuaXuatBan: "Dự báo cho ngành này chưa được xuất bản. Em xem điểm chuẩn các năm trước trong lúc chờ.",
  daCu: "Dự báo này được tính từ lâu và có thể chưa theo kịp thông tin mới. Em đối chiếu với thông báo tuyển sinh của trường.",
};

/** Câu mô tả vị trí điểm so với khoảng dự báo. Thay cho MO_TA_VI_TRI ở engine (nói rõ là dự báo, không hứa kết quả). */
export const CAU_VI_TRI: Record<"caoHonCa" | "tren" | "trongKhoang" | "duoi" | "thapHonCa", string> = {
  caoHonCa: "Điểm của bạn cao hơn cả mức cao nhất của khoảng dự báo.",
  tren: "Điểm của bạn nằm trong khoảng dự báo, trên mức giữa.",
  trongKhoang: "Điểm của bạn nằm trong khoảng dự báo, dưới mức giữa. Kết quả có thể đi cả hai hướng.",
  duoi: "Điểm của bạn hơi thấp hơn mức thấp nhất của khoảng dự báo.",
  thapHonCa: "Điểm của bạn thấp hơn khá xa mức thấp nhất của khoảng dự báo.",
};

/**
 * Kết luận đầy đủ: vị trí + chênh so với mức dự báo trung tâm + câu lưu ý.
 * `chenh` = điểm của bạn trừ mức trung tâm. `dinhDang` do nơi gọi truyền vào (thường là dinhDangDiem) để số có dấu phẩy.
 */
export function cauVeDiemSoVoiDuBao(
  viTri: keyof typeof CAU_VI_TRI,
  chenh: number,
  dinhDang: (n: number) => string,
  laDiemXemThu = false,
): string {
  const chu = laDiemXemThu ? "Với điểm này" : "Điểm của bạn";
  const dau = chenh === 0
    ? `${chu} đang bằng mức dự báo trung tâm.`
    : `${chu} đang ${chenh > 0 ? "cao" : "thấp"} hơn mức dự báo trung tâm ${dinhDang(Math.abs(chenh))} điểm.`;
  return `${CAU_VI_TRI[viTri]} ${dau} ${CAU_LUU_Y_DU_BAO}`;
}

/** Trạng thái mạng và tải dữ liệu: chuyện gì, vì sao, làm gì tiếp. */
export const CAU_TRANG_THAI_MANG = {
  ngoaiTuyen: { tieuDe: "Đang không có mạng", moTa: "Dữ liệu đã tải vẫn xem được. Bật lại mạng để lấy dữ liệu mới." },
  loiApi: { tieuDe: "Chưa lấy được dữ liệu", moTa: "Máy chủ chưa trả lời. Số liệu em đang xem là bản đã lưu. Thử lại sau ít phút." },
  hetGio: { tieuDe: "Chờ lâu quá", moTa: "Máy chủ trả lời chậm hơn bình thường. Em bấm Thử lại, câu hỏi của em vẫn còn." },
  mangCham: { tieuDe: "Mạng đang chậm", moTa: "Dữ liệu có thể mất thêm vài giây. Em cứ đợi hoặc xem phần đã tải." },
  dangTai: { tieuDe: "Đang tải", moTa: "Đợi một chút, mình đang lấy số liệu." },
  trong: { tieuDe: "Chưa có gì để hiển thị", moTa: "Em chọn một ngành hoặc nhập điểm để xem." },
} as const;

/** Tư vấn AI khi thiếu dữ liệu. Không nêu con số, chỉ hướng đi tiếp. */
export const CAU_AI_THIEU_DU_LIEU = {
  khongCoDiemChuan: "Mình chưa có điểm chuẩn hợp lệ của ngành này nên không nêu con số.",
  chiDiemSan: "Ngành này mới có điểm sàn, chưa có điểm chuẩn riêng nên mình không so với điểm của em.",
  phuongThucKhac: "Điểm này thuộc phương thức khác, mình không so với điểm thi THPT của em.",
  khongDuDeDuBao: "Chưa đủ dữ liệu nhiều năm để dự báo. Mình chỉ nêu điểm chuẩn năm trước nếu có.",
  huongTiep: "Em xem thông báo tuyển sinh chính thức của trường để có số mới nhất.",
} as const;

/** Mức cơ hội định tính, dùng khi chưa có xác suất đã hiệu chỉnh. Không hiện phần trăm. */
export const CAU_KHONG_PHAN_TRAM = "Chưa có xác suất đã kiểm chứng nên ứng dụng không hiện phần trăm cơ hội.";
