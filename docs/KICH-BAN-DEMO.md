# Kịch bản demo 3 phút

Số liệu nói ra lấy từ `docs/SO-LIEU-CHOT-NOP-BAI.md`. Mọi số điểm, số ngành hiện trên màn hình do app tính tại chỗ từ hồ sơ mẫu: đọc đúng số đang hiện, không nhớ thuộc lòng (ngày đếm ngược và số việc đổi theo ngày chạy).

## Chuẩn bị (trước giờ, 5 phút)
1. Mở https://nguyenvongai.pages.dev trên điện thoại hoặc Chrome thu nhỏ 390px. Chờ app tải xong danh mục (lần đầu mất vài giây).
2. Ở màn Chào bấm **Xem hồ sơ mẫu** (Nguyễn Minh Anh, lớp 12, TP.HCM, tổ hợp A01, mục tiêu Công nghệ thông tin). Không dùng hồ sơ thật.
3. Mở sẵn tab thứ hai ở trang ngành **ĐH Cần Thơ, Khoa học máy tính** (Khám phá, tìm "Khoa học máy tính", chọn dòng ĐH Cần Thơ): có điểm 2025 và 2026, chỉ tiêu, học phí, dự đoán 2027.
4. Dự phòng chạy sẵn ở máy: `npm run app:local` (cổng 8790, xem `docs/QUAN-TRI.md`). Tắt thông báo hệ thống.

## Mạch kể: một học sinh, một quyết định, một tuần

| Giây | Màn và thao tác | Câu nói | Tiêu chí |
|---|---|---|---|
| 0:00 đến 0:30 | **Hôm nay**. Chỉ vào **Thẻ hành trình** (bốn dòng: Em đang ở đâu, Vì sao quan trọng, Đổi gì thì khác, Hôm nay làm gì) và việc của hôm nay. | "Minh Anh đang ở đâu so với mục tiêu, thiếu bao nhiêu điểm, và hôm nay làm gì. Mỗi dòng được tính từ điểm của em, không phải lời khuyên chung." | 1, 3 |
| 0:30 đến 1:00 | Bấm **Thử điểm** ở thẻ, hoặc vào Khám phá rồi **Bản đồ cơ hội của em** (`/co-hoi`). | "Với điểm hiện tại, có bao nhiêu ngành ở từng nhãn: Thử sức, Vừa sức, An toàn, Dự phòng. Chạm một nhóm để xem các ngành. Đây là so với điểm chuẩn năm gần nhất, không phải xác suất đậu." | 1, 4 |
| 1:00 đến 1:25 | **Phòng thử điểm** (`/co-hoi/thu-diem`): kéo cộng 0,5 điểm môn thấp nhất, xem số ngành đổi nhãn. | "Nếu em tăng một môn thêm nửa điểm thì bao nhiêu ngành đổi nhãn. Đây là xem thử, không ghi vào hồ sơ." | 3 |
| 1:25 đến 2:10 | **Chi tiết ngành** (tab thứ hai): (a) điểm của em theo đúng tổ hợp của ngành; (b) điểm chuẩn từng năm, bấm link nguồn; (c) khối **Dự đoán điểm chuẩn năm 2027** và thanh so với điểm em; (d) dòng **Chỉ tiêu** ("theo đề án của trường, cho cả ngành, mọi phương thức"); (e) dòng học phí "Theo VnExpress". | "Mỗi số có nguồn. Điểm 2026 là từ trang tổng hợp nên app ghi rõ 'chưa đối chiếu đề án'. Dự đoán 2027 ở đây giữ điểm năm gần nhất kèm khoảng; độ tin cậy ghi là thấp vì điểm mới nhất chưa có đề án đối chiếu. Học phí đang theo VnExpress, chưa phải văn bản của trường, và app nói như vậy." | 4, 6 |
| 2:10 đến 2:30 | **Nguyện vọng**: danh sách có nhãn, nhận xét độ cân bằng, dòng "Dự kiến". | "Danh sách cân bằng: có ngành thử sức, có ngành an toàn. App chỉ ra khi danh sách thiếu chỗ an toàn." | 1, 3 |
| 2:30 đến 2:50 | **Khám phá > Về dữ liệu**: khối **Độ tin cậy dữ liệu**. | "Dữ liệu 3.648 chương trình của 118 trường. Đây là chỗ app đếm thật: bao nhiêu chương trình có điểm từ hai năm, bao nhiêu chỉ một năm, bao nhiêu dự báo ở mức thấp. Thiếu thì nói thiếu." | 4, 6 |
| 2:50 đến 3:00 | Kết (một trong hai). Hồ sơ > **Chia sẻ**: tạo liên kết cho phụ huynh. Hoặc nhắc CMS: người trong trường nhập, duyệt, xuất bản, học sinh nhận bản mới. | "Dữ liệu của em nằm trên máy em. Muốn cho bố mẹ xem thì gửi một liên kết, không cần tài khoản." | 2, 5 |

## Câu chuyển ý ngắn
- Với phụ huynh: "Em đưa bản tóm tắt này cho bố mẹ, không ai cần tài khoản."
- Với ban giám khảo, khi hỏi độ chính xác: "Điểm có phần lẻ khớp PDF nguồn ở 201/201 dòng đã kiểm; điểm số nguyên thì chúng em chưa kiểm hết và đã nói trong báo cáo." Chi tiết: `docs/HOI-DAP-BAN-GIAM-KHAO.md`.
- Không nói: xác suất đậu, "chính xác 100%", "AI dự báo điểm chuẩn" (ML đang tắt). Danh sách đầy đủ: `docs/SO-LIEU-CHOT-NOP-BAI.md` mục 6.

## Phương án dự phòng
| Sự cố | Làm ngay |
|---|---|
| Mất mạng hoặc mạng yếu | Dùng bản chạy cục bộ `npm run app:local` (http://127.0.0.1:8790). Hồ sơ mẫu và toàn bộ danh mục không cần mạng; app đã tải danh mục vẫn xem được khi ngắt mạng và báo "Đang không có mạng". |
| Trang ngành tải chậm | Chuyển sang tab thứ hai đã mở sẵn; hoặc nói tiếp phần Bản đồ cơ hội rồi quay lại. |
| AI tư vấn lỗi, quá hạn mức, hoặc chưa có khóa | Không cần dùng AI trong 3 phút. Nếu giám khảo yêu cầu: mở Tư vấn; khi máy chủ AI lỗi hoặc không đạt kiểm tra (503, 422, 429) app tự trả lời từ dữ liệu có nguồn. Nói đúng: "đây là chế độ trả lời từ dữ liệu, không qua mô hình ngôn ngữ". |
| Hồ sơ mẫu bị ghi đè | Cài đặt > **Dùng hồ sơ mẫu** (app hỏi xác nhận). |
| CMS chưa dựng thật | Nói đúng hiện trạng và chạy `npm run cms:api` rồi `npm run app:local` (xem `docs/QUAN-TRI.md`) nếu giám khảo muốn xem vòng nhập, duyệt, xuất bản ở máy. |
| Câu hỏi khó về dữ liệu hoặc AI | `docs/HOI-DAP-BAN-GIAM-KHAO.md`. |
