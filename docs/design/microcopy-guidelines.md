# Hướng dẫn microcopy tiếng Việt

Phạm vi: giao diện dành cho học sinh THPT. Đây là quy tắc biên tập, không thay thế quy chế tuyển sinh hay định nghĩa của engine.

## Quy tắc viết

1. Gọi người học là **em** trong nội dung hướng trực tiếp đến học sinh. Tránh trộn “em” và “bạn” trong cùng một luồng; giữ nguyên “bạn” trong trích dẫn hoặc nội dung trung tính khi cần.
2. Mỗi màn hình ưu tiên một hành động chính. Nút mô tả kết quả bấm bằng động từ ngắn: “Thêm nguyện vọng”, “Lưu thay đổi”, “Xem nguồn”. Không dùng nhãn kỹ thuật như “CTA”.
3. Nói kết quả trước, giải thích ngắn sau. Đưa điều kiện, nguồn, năm và chi tiết phương thức vào phần xem thêm khi không cần để ra quyết định ngay.
4. Dùng tên trường đã được xác minh. Không thay mã trường bằng tên đoán; nếu chưa đối chiếu, giữ mã kèm trạng thái chưa xác minh hoặc không trình bày như tên chính thức.
5. Hiển thị tên ngành cốt lõi trước biến thể chương trình. Chỉ rút gọn phần biến thể khi dữ liệu đã xác nhận tên đó; không sửa dữ liệu lưu để làm đẹp nhãn.
6. Nói rõ năm áp dụng của điểm chuẩn, học phí hoặc đề án khi có dữ liệu năm. Phân biệt “Chính thức” và “Ước tính” theo metadata thật; thiếu thì nói “Chưa có dữ liệu”.
7. Không hứa kết quả tuyển sinh. Điểm phù hợp và nhãn nguyện vọng là tham khảo theo dữ liệu/định nghĩa đang dùng, không phải xác suất hay cam kết trúng tuyển.
8. Trạng thái lỗi phải nói điều gì chưa làm được và bước tiếp theo. Trạng thái trống nói vì sao thiếu thông tin và cách bổ sung; không thay null bằng 0.
9. AI cần phân biệt thông tin có nguồn, suy luận/ước tính và dữ liệu chưa có. Không để câu văn tạo cảm giác mọi câu trả lời đều đã được kiểm chứng.

## Từ điển thuật ngữ

| Dùng thống nhất | Nghĩa hiển thị / cách dùng | Tránh |
|---|---|---|
| Nguyện vọng | Lựa chọn ngành/chương trình được xếp thứ tự ưu tiên trong ứng dụng | “NV” ở nội dung dành cho học sinh nếu chưa giải thích |
| Điểm chuẩn tham khảo | Mốc điểm của năm được nêu cụ thể, dùng để đối chiếu | “Điểm đỗ” như thể bảo đảm năm hiện tại |
| Thử sức | Nhãn khi điểm hiện tại thấp hơn điểm chuẩn tham khảo theo ngưỡng engine | “Rủi ro cao” nếu chưa có mô hình xác suất được kiểm định |
| Vừa sức | Nhãn khoảng cách điểm theo ngưỡng engine | “Chắc chắn” |
| An toàn | Nhãn khoảng cách điểm theo ngưỡng engine | Cách nói đảm bảo an toàn/trúng tuyển |
| Dự phòng | Lựa chọn có khoảng cách điểm tham khảo rộng hơn theo ngưỡng engine | “Chốt đỗ” |
| Điểm phù hợp | Điểm so sánh theo tiêu chí ứng dụng; phải kèm giải thích thang đo khi cần | “Xác suất đậu/trúng tuyển” |
| Học phí chính thức | Học phí có nguồn được phân loại chính thức trong dữ liệu | Gọi là chính thức nếu chỉ là ước tính |
| Học phí ước tính | Mức tham khảo chưa xác nhận là học phí chính thức | Lược mất nhãn ước tính |
| Chưa có dữ liệu | Không có giá trị đủ điều kiện để hiển thị | Hiển thị 0 hoặc suy đoán |
| Trợ lý AI | Thành phần tư vấn; câu trả lời có thể phụ thuộc dữ liệu và ngữ cảnh | “Chuyên gia”, “chính xác tuyệt đối” |
| Nguồn tuyển sinh | Liên kết/tài liệu chính thức hoặc nguồn được ghi nhận, kèm năm nếu có | “Nguồn chính thức” khi URL chưa xác minh nội dung |

## Mẫu chuỗi

| Tình huống | Mẫu đề xuất |
|---|---|
| Thiếu điểm tổ hợp | “Em chưa nhập đủ điểm của tổ hợp này nên chưa thể so với điểm chuẩn tham khảo.” |
| Thiếu nguồn/năm | “Chưa có dữ liệu để đối chiếu.” |
| Nhãn nguyện vọng | “Nhãn dựa trên khoảng cách với điểm chuẩn năm {năm}, không phải xác suất trúng tuyển.” |
| Dữ liệu ước tính | “Mức học phí ước tính; em kiểm tra đề án của trường để biết mức chính thức.” |
| Lỗi lưu | “Chưa lưu được thay đổi. Em thử lại khi kết nối ổn định.” Chỉ dùng nếu lỗi thực tế là kết nối; nguyên nhân khác cần thông báo đúng nguyên nhân. |
| Khôi phục bản sao lưu | Nêu rõ dữ liệu nào sẽ bị thay thế trước nút xác nhận. |

Mẫu chỉ áp dụng khi phù hợp với trạng thái thật. Không hiển thị thông báo thành công trước khi thao tác hoàn tất.
