// Câu động lực của slice S8. Câu ngắn, giọng thân thiện, gọi "em".
// Cố ý KHÔNG trích dẫn danh nhân để tránh sai nguồn.

export type NhomCauNoi = "batDau" | "kienTri" | "nghiNgoi" | "sauKhiSai" | "ganKyThi";

export const TEN_NHOM_CAU_NOI: Record<NhomCauNoi, string> = {
  batDau: "Để bắt đầu",
  kienTri: "Giữ nhịp",
  nghiNgoi: "Nghỉ ngơi",
  sauKhiSai: "Không sao cả",
  ganKyThi: "Gần kỳ thi",
};

export const CAU_NOI: { nhom: NhomCauNoi; cau: string }[] = [
  { nhom: "batDau", cau: "Không cần hoàn hảo, chỉ cần bắt đầu." },
  { nhom: "batDau", cau: "Làm xong việc nhỏ trước, việc lớn sẽ bớt đáng sợ." },
  { nhom: "batDau", cau: "Mười lăm phút tập trung là đủ để bắt đầu." },
  { nhom: "batDau", cau: "Mở sách ra là em đã đi được nửa bước rồi." },
  { nhom: "batDau", cau: "Hôm nay chỉ cần làm tốt một việc thôi." },

  { nhom: "kienTri", cau: "Mỗi buổi học nhỏ là một bước gần hơn tới mục tiêu." },
  { nhom: "kienTri", cau: "Chậm mà đều vẫn hơn nhanh rồi bỏ." },
  { nhom: "kienTri", cau: "Hôm nay hơn hôm qua một chút là đủ." },
  { nhom: "kienTri", cau: "Em đã đi được một đoạn rồi, nhìn lại xem nhé." },
  { nhom: "kienTri", cau: "Thói quen nhỏ mỗi ngày làm nên kết quả lớn." },
  { nhom: "kienTri", cau: "Học đều mỗi ngày nhẹ hơn học dồn một lúc." },

  { nhom: "nghiNgoi", cau: "Nghỉ ngơi đúng lúc cũng là một phần của việc học." },
  { nhom: "nghiNgoi", cau: "Ngủ đủ giấc giúp em nhớ bài lâu hơn." },
  { nhom: "nghiNgoi", cau: "Mệt thì nghỉ một chút, không phải bỏ cuộc." },
  { nhom: "nghiNgoi", cau: "Uống nước, vươn vai, rồi mình học tiếp." },
  { nhom: "nghiNgoi", cau: "Hôm nay em không cần cố quá sức." },

  { nhom: "sauKhiSai", cau: "Sai ở bài tập hôm nay là đỡ sai ở phòng thi." },
  { nhom: "sauKhiSai", cau: "Lỡ một buổi không sao, mình bắt đầu lại từ buổi sau." },
  { nhom: "sauKhiSai", cau: "Câu sai cho em biết cần ôn chỗ nào." },
  { nhom: "sauKhiSai", cau: "Ai học cũng có lúc chững lại. Em vẫn đang tiến lên." },
  { nhom: "sauKhiSai", cau: "Một ngày chưa tốt không nói lên cả chặng đường." },

  { nhom: "ganKyThi", cau: "Ôn chắc phần đã biết quan trọng hơn học thêm phần mới." },
  { nhom: "ganKyThi", cau: "Giữ nhịp quen thuộc, đừng thức khuya trước ngày thi." },
  { nhom: "ganKyThi", cau: "Em đã chuẩn bị nhiều hơn em nghĩ." },
  { nhom: "ganKyThi", cau: "Bình tĩnh đọc kỹ đề là đã làm được một nửa." },
];

/**
 * Chọn câu của hôm nay. Có nhóm ưu tiên (ví dụ em đang mệt → nghỉ ngơi) thì câu đầu tiên
 * trong vòng xoay lấy từ nhóm đó, các lần bấm "đổi câu" sau đi qua toàn bộ danh sách.
 */
export function chonCauNoi(ngayTrongNam: number, soLanDoi: number, uuTien?: NhomCauNoi | null) {
  const nhomUuTien = uuTien ? CAU_NOI.filter((c) => c.nhom === uuTien) : [];
  const vong = [...nhomUuTien, ...CAU_NOI.filter((c) => c.nhom !== uuTien)];
  const batDau = nhomUuTien.length ? ngayTrongNam % nhomUuTien.length : ngayTrongNam % vong.length;
  return vong[(batDau + soLanDoi) % vong.length];
}
