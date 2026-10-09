# Kịch bản demo 5 phút

Chuẩn bị: mở https://nguyenvongai.pages.dev trên điện thoại hoặc Chrome thu nhỏ 390px. Bấm "Xem hồ sơ mẫu" (Minh Anh, lớp 12, mục tiêu Khoa học máy tính). Nếu mạng yếu, chạy sẵn `npm run cms:api` và `npm run app:local` (xem `docs/QUAN-TRI.md`) để demo cả vòng dữ liệu ngay ở máy.

## Mạch kể: một học sinh, một quyết định, một tuần

| Phút | Màn | Nói gì | Điểm chấm |
|---|---|---|---|
| 0:00 | Hôm nay | "Minh Anh còn 266 ngày đến kỳ thi, thiếu 1,5 điểm so với mục tiêu. Việc hôm nay là Vật lý, vì đây là môn kéo điểm nhiều nhất." Mỗi việc có lý do tính từ điểm của em. | 1, 3 |
| 0:45 | Khám phá, mở một ngành | "Điểm của em theo đúng tổ hợp của ngành này, so với điểm chuẩn từng năm, mỗi con số có link tới trang PDF của đề án." Chỉ khối **Điểm chuẩn năm 2027 có thể ở đâu**: khoảng dự kiến và vị trí điểm của em. "Không phải xác suất đậu; khoảng này đã kiểm lại với dữ liệu thật." | 4 |
| 1:45 | Hồ sơ > Điểm ưu tiên (Bước 2) | Chọn KV1: tổng điểm đổi ngay, nhãn các ngành đổi. "Học sinh vùng khó khăn không bị thiệt vì app quên điểm ưu tiên." | 2 |
| 2:15 | Nguyện vọng | Danh sách có nhãn Thử sức/Vừa sức/An toàn/Dự phòng, nhận xét độ cân bằng, gợi ý thêm một ngành an toàn. | 1, 3 |
| 3:00 | Hồ sơ > Trắc nghiệm hướng nghiệp (làm nhanh vài câu) rồi Chia sẻ với phụ huynh, thầy cô | Tạo liên kết, mở ở tab ẩn danh: phụ huynh xem bản tóm tắt, viết lời nhắn, gửi liên kết lại, học sinh lưu vào hồ sơ. Không cần tài khoản. | 1, 2 |
| 3:45 | CMS (điện thoại thứ hai hoặc tab khác): "Dữ liệu đổi mỗi năm, ai cập nhật?" | Tình nguyện viên vào trường mình, **nhập điểm chuẩn cả trường một lượt** kèm nguồn, quản trị viên duyệt, xuất bản. Quay lại app: điểm và nhãn các ngành đó đã đổi, ghi rõ năm và nguồn. Hộp thư: báo sai từ học sinh, đăng ký tình nguyện mới, cấp quyền một chạm. | 4, 5 |
| 4:45 | Số liệu từ đâu ra | "Chỗ nào chưa có dữ liệu, app nói thẳng." Kết: mở `docs/DOI-CHIEU-TIEU-CHI.md` nếu có câu hỏi. | 6 |

## Câu chuyển ý ngắn gọn
- Với phụ huynh: "Em đưa bản tóm tắt này cho bố mẹ, không ai cần tài khoản."
- Với thầy cô và trường: "Mỗi mùa tuyển sinh, thầy cô và sinh viên của chính trường nhập số liệu mới, có nguồn, có duyệt."
- Với ban giám khảo: "Dự báo này sai ở năm 2025 nhiều hơn các năm khác, và app nói rõ điều đó."

## Nếu hỏng
- Mất mạng: dùng bản chạy cục bộ; hồ sơ mẫu không cần mạng.
- CMS chưa dựng thật: chạy `npm run cms:api` với `GIA_DANH_DEV=1` (xem `docs/QUAN-TRI.md`).
- Câu hỏi khó về dữ liệu hoặc AI: `docs/HOI-DAP-BAN-GIAM-KHAO.md`.
