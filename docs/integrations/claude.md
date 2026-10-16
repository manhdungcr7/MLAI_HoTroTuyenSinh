# Kết nối Claude qua MCP

**Trạng thái:** MCP/OAuth có kiểm thử local trong repo; chưa có bằng chứng kết nối tài khoản Claude hoặc production hiện tại (`PARTIAL`). Các tên menu Claude thay đổi theo gói và phiên bản, nên cần xác minh trong tài khoản trước khi hướng dẫn người dùng cuối.

## Hợp đồng hiện có

- MCP endpoint trong source: `/mcp`.
- OAuth 2.1 authorization code với PKCE S256; token gắn với kết nối học sinh đã đồng ý.
- Scope mặc định khi client không yêu cầu scope: `profile:read admissions:read preferences:read study:read`.
- Quyền `preferences:write` và `study:write` phải được yêu cầu rõ ràng; chúng chỉ tạo đề xuất chờ học sinh xác nhận trong app.
- Ngắt kết nối làm token gắn với kết nối hết hiệu lực.

## Kiểm tra local

Chạy `npm run test:mcp` để kiểm tra SDK, OAuth, phạm vi, xác thực tool, cô lập snapshot và proposal. Đây không phải bằng chứng Cloudflare production, giao diện Claude, hay tài khoản bên ngoài.

## Giới hạn dữ liệu

MCP đọc đúng snapshot đã kết nối và catalog snapshot có sẵn. Không nhận `studentId` từ client làm danh tính. Dữ liệu catalog có thể thiếu nguồn/năm và chưa được xác minh độc lập; không diễn giải điểm lịch sử thành xác suất trúng tuyển.
