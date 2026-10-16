# Kết nối ChatGPT

**Trạng thái kiểm chứng (16/10/2026):** GPT Actions (OpenAPI) và MCP đều có endpoint chạy thật. **Chưa tạo được GPT hoặc kết nối MCP thật trong tài khoản ChatGPT**, nên các bước giao diện dưới đây chưa được xác nhận.

Có hai cách, tùy gói tài khoản:

## Cách 1: GPT của riêng bạn (GPT Actions, dùng mã trong đường dẫn)

Đây là cách đã có từ trước và được hỗ trợ rộng hơn.

1. Trong app: **Hồ sơ > Cài đặt > Kết nối**, bật và sao chép **đường dẫn GPT Actions** (dạng `https://nguyenvongai.pages.dev/api/gpt/{mã}/openapi.json`).
2. ChatGPT: **Explore GPTs > Create**. Ở **Instructions**, dán nội dung từ nút **Sao chép hướng dẫn** trong app.
3. Ở **Actions**, chọn **Import from URL**, dán đường dẫn `openapi.json`. Authentication: **None** (mã đã nằm trong đường dẫn).
4. Lưu, chọn **Only me**.

Hạn chế: mã nằm trong đường dẫn. Ai có đường dẫn có thể đọc hồ sơ cho đến khi ngắt kết nối. Đây là lý do cần cân nhắc OAuth (xem mục 2).

## Cách 2: kết nối MCP (Developer Mode, nếu gói có)

Tính năng và vị trí công tắc thay đổi theo bản ChatGPT. Nếu gói của bạn có:

1. Bật Developer Mode trong cài đặt ứng dụng (vị trí tùy phiên bản).
2. Thêm kết nối MCP với URL `https://nguyenvongai.pages.dev/mcp`.
3. Khi được hỏi cách xác thực, chọn OAuth. ChatGPT sẽ mở trang đồng ý; dán mã kết nối.

Chưa kiểm chứng: ChatGPT có đăng ký client động và đi hết luồng OAuth của máy chủ hay không. Cần một tài khoản thật để thử.

## Câu hỏi thử

- "Hồ sơ của tôi có những gì?" (đọc hồ sơ)
- "Điểm chuẩn ngành Kinh tế năm 2025 ở các trường TP.HCM?" (tra cứu, phải có năm và nguồn)
- "Lịch học tuần này của tôi?" (kế hoạch tuần, có liên kết .ics)
- "Thêm ngành Kinh tế vào nguyện vọng" (phải chỉ tạo đề xuất chờ xác nhận)

## Giới hạn đã biết

- Đề xuất không tự áp dụng: học sinh phải xác nhận trong app.
- Điểm chuẩn từ nguồn tổng hợp được gắn nhãn "chưa đối chiếu với đề án", và ChatGPT phải giữ nhãn đó khi trả lời.
- Đường dẫn GPT Actions gồm mã bí mật; không chia sẻ công khai.
