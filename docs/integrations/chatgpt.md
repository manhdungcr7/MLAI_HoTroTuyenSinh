# Kết nối ChatGPT

**Trạng thái:** tích hợp trong source và bài kiểm tra local; chưa có bằng chứng kết nối tài khoản ChatGPT hoặc production ở checkout này (`PARTIAL`). Không dùng hướng dẫn này để khẳng định đã chạy ngoài tài khoản.

## GPT Actions

Source cung cấp OpenAPI dưới `/api/gpt/{ma}/openapi.json` và các endpoint dùng mã kết nối. Mã trong URL là thông tin xác thực: người có mã có thể đọc snapshot cho tới khi kết nối bị thu hồi. Chỉ dùng trên tài khoản riêng và không chia sẻ URL. Thao tác thay đổi tạo đề xuất chờ xác nhận trong app.

Để thử trên tài khoản thật cần URL production đã được xác nhận, kết nối thử dành riêng, và người có quyền tạo GPT. Tài khoản/UI ChatGPT chưa được kiểm tra trong lượt này.

## MCP

- Endpoint source: `/mcp`.
- OAuth: PKCE S256, quyền ghi cần scope ghi được yêu cầu rõ; scope rỗng mặc định chỉ có quyền đọc.
- Thao tác ghi qua tool tạo proposal chờ học sinh xác nhận trong app.

Giao thức và hợp đồng local có thể kiểm tra bằng `npm run test:mcp`. Điều đó không xác nhận ChatGPT chấp nhận đăng ký OAuth động hay hoàn tất kết nối tài khoản.

## Giới hạn dữ liệu

Catalog đi kèm là snapshot local; có URL hoặc PDF không đồng nghĩa dữ liệu đã được xác minh độc lập. Khi chưa có nguồn hoặc năm, giữ giá trị `null` và nêu giới hạn.
