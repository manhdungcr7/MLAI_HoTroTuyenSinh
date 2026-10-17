# Chương trình lớp 12 và chatbot hỏi tiến độ học

Cập nhật 17/10/2026. Phụ trách: Tuấn (kế hoạch học). Mục đích: kế hoạch học không còn "máy móc theo môn" mà theo **chủ đề học sinh đã vững hay chưa**, và chatbot không bịa nội dung chương trình.

## 1. Dữ liệu

| Tệp | Nội dung |
|---|---|
| `src/data/chuong-trinh-lop12.ts` | 45 chủ đề lớp 12 của 6 môn, **bộ Kết nối tri thức**: id, tên (khóa lưu tiến độ), danh sách bài, 1–4 ý "cần nắm", từ khóa, chủ đề tiên quyết |
| `src/engine/tien-do-chu-de.ts` | Xếp thứ tự học, hiểu câu gõ tự do (quy tắc, không AI) |
| `src/features/tu-van/tien-do-chat.ts` | Hội thoại hỏi tiến độ trong chatbot |
| `src/features/tu-van/thanh-phan/the-tien-do.tsx` | Thẻ chọn mức Vững / Cần ôn / Chưa học trong khung chat |
| `scripts/cao-muc-luc-sgk-*.py` | Script cào mục lục (chạy lại để so sánh) |

Số chủ đề: Toán 6 chương, Vật lí 4, Hóa học 8, Sinh học 8, Ngữ văn 9 bài, Tiếng Anh 10 unit.

### Nguồn và độ tin cậy (đọc kỹ)
- Tên chương và tên bài lấy từ **mục lục SGK trên loigiaihay.com**, cào 17/10/2026. Đây là nguồn thứ cấp, **chưa đối chiếu với sách in**.
- Phần "cần nắm" do nhóm viết **dựa trên tên bài**, không trích từ sách. Mọi chủ đề đang để `daDuyet: false`. Người học môn đó cần duyệt rồi mới đổi thành `true`.
- Tiếng Anh: chỉ có tên unit, chưa liệt kê ngữ pháp từng unit (chưa có nguồn đối chiếu), nên phần "cần nắm" chỉ nói về từ vựng theo chủ đề, đọc hiểu, nghe, viết.
- Bộ sách khác (Chân trời sáng tạo, Cánh diều...) đã cào mục lục nhưng **chưa nạp vào app**. Muốn thêm: thêm chủ đề với `id` khác và thêm trường chọn bộ sách.

## 2. Chatbot không được bịa chương trình học

Ba lớp bảo vệ:
1. **Luồng tiến độ chạy trước AI** (`traLoiTienDoChat`, gọi trong `cau-tra-loi.ts` ngay sau khi chọn trạng thái hồ sơ). Câu "hỏi tiến độ", "chương trình lý 12 gồm gì", "lập kế hoạch học theo tiến độ", hoặc câu em nêu mức học đã được trả lời bằng dữ liệu, không gọi mô hình. Chạy cả khi ở chế độ Tiết kiệm.
2. **Báo thẳng khi không có dữ liệu:**
   - chủ đề lớp 10–11 (ví dụ "dao động sóng", "logarit"): "chưa có dữ liệu, thuộc lớp 11" (`NGOAI_PHAM_VI_LOP12`);
   - câu có mức học nhưng không khớp chủ đề nào (ví dụ "đại số"): "chưa tìm thấy chủ đề phù hợp trong chương trình lớp 12".
3. **Quy tắc 5 trong lời nhắc AI** (`NHAC_HE_THONG`): không tự nêu tên chương, bài, kiến thức từng môn từ trí nhớ; gợi ý học sinh hỏi "lập kế hoạch học theo tiến độ". Đây là lớp phụ: AI vẫn có thể sai, nên lớp 1 là lớp chính.

Mọi câu trả lời của luồng này đều ghi nguồn và giới hạn ("chưa đối chiếu sách in, chưa có người học môn đó duyệt, chưa có lớp 10–11 và bộ sách khác").

## 3. Cách hoạt động với học sinh

1. Học sinh gõ "Hỏi tiến độ môn Hóa học" hoặc "Lập kế hoạch học theo tiến độ". Chatbot hiện thẻ các chủ đề, mỗi chủ đề có 3 nút Vững / Cần ôn / Chưa học (bấm là lưu vào máy).
2. Hoặc gõ tự do, ví dụ "lý em học xong từ trường, hạt nhân chưa học, toán giỏi xác suất". Chatbot nói lại ("Mình hiểu là…"), em bấm **Lưu tiến độ này** thì mới ghi. Không tự lưu khi chưa được xác nhận.
3. "Gợi ý kế hoạch học theo tiến độ" cho thứ tự học từng môn kèm lý do và ý cần nắm. Nút **Tạo lại việc tuần này theo tiến độ** tạo việc và xếp vào giờ trống.
4. Màn Kế hoạch (`taoViecTuan`): môn nào đã có tiến độ thì mỗi buổi ôn đúng chủ đề ưu tiên cao nhất; chưa có thì xoay theo tuần như trước (danh sách xoay giờ lấy từ dữ liệu lớp 12, không còn nội dung chương trình cũ như số phức hay mũ-logarit).

Tiến độ lưu ở `hoSo.tienDoKienThuc` (khóa là **tên chủ đề**). Không gửi lên máy chủ.

## 4. Thuật toán xếp thứ tự (giả định, chưa đo trên học sinh thật)

- Mức còn phải học: Chưa học 1, Cần ôn 0,8, chưa trả lời 0,6, Đã học chưa chắc 0,5, Vững 0,1.
- Chủ đề tiên quyết chưa vững được đưa lên trước chủ đề phụ thuộc (ví dụ Toán: vectơ trước phương pháp tọa độ; Sinh: di truyền phân tử trước di truyền nhiễm sắc thể).
- Chưa có số liệu mức quan trọng của từng chủ đề trong đề thi, nên mọi chủ đề ngang nhau. App nói rõ điều này.
- Số giờ mỗi môn do bộ chia giờ (`engine/phan-bo-gio-hoc.ts`) quyết định, tách biệt với bước này.

## 5. Giới hạn đã biết

- Chỉ lớp 12, chỉ bộ Kết nối tri thức. Học sinh dùng bộ khác sẽ thấy tên chương có thể khác sách của mình.
- Dữ liệu chưa được duyệt. Có thể có lệch nhỏ về tên bài so với sách in.
- Từ khóa hiểu câu gõ là bảng viết tay, nên câu quá lạ có thể không hiểu; khi đó chatbot báo "chưa tìm thấy", không đoán.
- Ví dụ "học chương dao động sóng" của Vật lí thuộc lớp 11, nên chatbot sẽ nói chưa có dữ liệu.

## 6. Kiểm thử

`tests/chuong-trinh-lop12.test.ts` (toàn vẹn dữ liệu, không còn chương trình cũ), `tests/tien-do-chu-de.test.ts` (hiểu câu, thứ tự học, tiên quyết), `tests/tien-do-chat.test.ts` (đường ống chat không gọi AI, báo "chưa có dữ liệu", kế hoạch tuần theo tiến độ). Đã chạy thêm trên trình duyệt thật 390px: không tràn ngang, không có request API ra ngoài.

## 7. Việc tiếp theo

1. Người học từng môn duyệt dữ liệu (đổi `daDuyet`), đối chiếu với sách in.
2. Thêm trọng số theo đề thi (đếm câu theo chủ đề trên đề minh họa của Bộ) khi có nguồn.
3. Thêm bộ sách khác và chọn bộ sách ở hồ sơ.
4. Kiến thức lớp 11 hay được hỏi lại (nếu nhóm muốn mở rộng).
