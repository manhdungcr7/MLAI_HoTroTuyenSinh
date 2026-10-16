# Kết nối Codex

## Plugin trong repo

Plugin local nằm tại `plugins/nguyen-vong-ai/`; marketplace repo-local nằm tại `.agents/plugins/marketplace.json`. Cấu hình MCP khai báo `https://nguyenvongai.pages.dev/mcp`, OAuth và các scope đọc mặc định trong `plugins/nguyen-vong-ai/mcp.json`.

1. Mở Codex settings và cài/bật plugin `nguyen-vong-ai@nguyen-vong-ai-local` từ marketplace local.
2. Hoàn tất OAuth consent ở giao diện Codex. Kiểm tra quyền hiển thị trước khi chấp nhận.
3. Dùng một truy vấn đọc như tìm trường/ngành; xác nhận câu trả lời nêu nguồn và giới hạn dữ liệu.
4. Nếu dùng thao tác ghi, cấp scope ghi riêng; kết quả phải là proposal được xác nhận trong ứng dụng.

Không chép access token, refresh token, client secret hoặc hồ sơ học sinh vào `config.toml`, repo hay prompt. Plugin manifest trong repo chỉ mô tả cấu hình; chưa xác minh kết nối tài khoản hoặc endpoint production trong checkout này.
