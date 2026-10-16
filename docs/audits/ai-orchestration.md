# Định tuyến tư vấn và ngân sách AI

Kiểm tra ngày 2026-10-16. Phạm vi: `src/features/tu-van`, `functions/_thu-vien/ai`.

## Luồng hiện tại

1. Chào hỏi, hướng dẫn, hạn mức, ngoài phạm vi → quy tắc tại máy.
2. Tra điểm chuẩn, học phí, tổ hợp, dự báo từ dữ liệu có nguồn, nguyện vọng, kế hoạch, ý định có cấu trúc và câu nối tiếp đang chờ → thuật toán/danh mục tại máy. Bật AI cũng không phát sinh yêu cầu mạng cho các câu này.
3. Tên trường mơ hồ (`Bách khoa`, `BK`, `UTC`) → hỏi chọn trường. Chip giữ nội dung câu và thay tên mơ hồ bằng canonical school code; không chọn ứng viên đầu tiên.
4. Tên trường chưa có / chương trình thiếu → nói chưa có dữ liệu, nguồn rỗng. Không dùng điểm trường khác để lấp chỗ trống.
5. Câu mở còn lại → chỉ khi bật AI và còn lượt mới gửi API. AI diễn giải ngữ cảnh; tính nhãn, khoảng cách điểm và lịch học vẫn thuộc thuật toán. Thao tác ghi được trình bày thành đề xuất để học sinh xác nhận.

## Sửa lỗi đã xác minh

- `timNganhKhop` trước đây tăng điểm cho một trường nhưng vẫn trả ngành của trường khác. Nay trường chỉ định là bộ lọc cứng; tên/mã do resolver chung xác định được dùng lại.
- Tên `TP.HCM` được chuẩn hóa thành `tp hcm`; regex cũ không nhận biến thể này. Đã sửa và bỏ mặc định `Bách khoa → BKA`.
- Danh mục hiện không có QSB/HCMUT. Câu hỏi Bách khoa TP.HCM phải trả thiếu dữ liệu, không tạo chương trình/điểm giả. Test cũ đòi QSB và chưa nạp danh mục lazy là acceptance sai; đã sửa setup và kiểm tra không lẫn trường.
- Tra số liệu trước đây có thể gọi LLM khi parser trả `khac`; nay các ý định tra cứu được định tuyến nội bộ trước AI.
- Workers AI trước đây không giới hạn chờ và tự thử thêm model khi lỗi. Nay chờ tối đa budget truyền vào (không quá 10 giây), một lần gọi; lỗi chuyển về fallback có sẵn.

## Ngân sách và giới hạn

- Provider HTTP có AbortSignal timeout; Workers AI binding hiện không nhận signal trong contract repo nên Promise timeout chỉ dừng chờ, không hủy inference đã chạy. Không tự retry để tránh tính phí thêm.
- Không thêm circuit breaker giữ state module vì state đó không đáng tin giữa Workers isolates. Hạn mức D1 nguyên tử và cache KV hiện có vẫn là hàng rào chia sẻ; circuit breaker dùng chung chưa được triển khai.
- Telemetry hiện ghi bậc cache/LLM, thời gian Clef/RAG/LLM, số sự kiện, token vào ước tính; không có actual token billing trong contract hiện tại. Không khẳng định mức tiết kiệm bằng tiền.
- Resolver chỉ biết trường trong danh mục. `BK` hiện cho các ứng viên BKA/DDK có trong kho; không đưa QSB thành thẻ trường khi chưa có hồ sơ canonical trong danh mục.
- Không gọi AI trả phí trong đợt kiểm tra; provider/network tests dùng stub.

## Kiểm tra

`tests/agent-routing.test.ts`: bật AI nhưng tra cứu/kế hoạch không gọi mạng; BK/Bách khoa/UTC có lựa chọn; chip chọn thoát mơ hồ; trường chính xác không lẫn trường; QSB/HCMUT và trường không tồn tại không được bịa; Workers AI treo/lỗi chỉ gọi một lần và budget hết thì dừng.

Regression đã chạy: `lay-du-lieu.test.ts` (gồm `tu-van-chat.test.ts`), `tu-van-phan-hoi.test.ts`, `tu-van-y-dinh.test.ts`, `chon-model.test.ts`. Main tích hợp `agent-routing.test.ts` vào test script và chạy cổng toàn repo.
