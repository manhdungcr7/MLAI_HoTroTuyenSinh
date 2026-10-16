# Hiện trạng checkout

Được rà soát ngày 16/10/2026 trên `feat/agent-native-mcp`, baseline `dae3c8c`. Worktree có nhiều thay đổi trước khi lượt triển khai bắt đầu; chúng được giữ nguyên và không được xem là toàn bộ phần việc của lượt này.

## Kiến trúc đang có

| Phần | Hiện trạng trong source |
|---|---|
| Web | React, Vite, TypeScript; route và slice hiện có |
| Hồ sơ | Local-first; dữ liệu local không tự được MCP đọc |
| Backend | Cloudflare Pages Functions, CMS, D1/KV; chưa xác minh cấu hình production trong lượt này |
| Tư vấn | Engine xác định và tầng giải thích AI; mặc định tắt AI từ xa cục bộ |
| Capability/API | `src/capabilities/` được API v1 và MCP dùng chung cho các thao tác đã triển khai |
| MCP | SDK Streamable HTTP tại `/mcp`; OAuth Bearer cùng đường dẫn tương thích `/mcp/{ma}` |
| Quyền ghi | Tool tạo đề xuất chờ học sinh xác nhận trong app; không sửa snapshot trực tiếp |
| Plugin | Marketplace và plugin local nằm trong repo; Codex CLI trên máy đã báo plugin đã cài/bật, nhưng điều đó không chứng minh endpoint tài khoản/production hoạt động |
| Dữ liệu | Catalog snapshot; provenance và độ mới cần kiểm tra riêng. Audit hiện có tại `../audits/data-quality.md` |

## Bằng chứng lúc bắt đầu lượt này

`git status` có 21 tracked files đã sửa cùng nhiều file mới; do đó không thể gán các thay đổi đó cho lượt hiện tại. `npm run typecheck` và `npm run test:capabilities` đã xanh theo kiểm tra trước đó. `npm run test:mcp` thất bại ở test `initialize` thiếu tham số bắt buộc và kiểm tra scope cũ chấp nhận cấp tất cả quyền khi scope trống.

## Giới hạn

Checkout và test local không chứng minh migration đã áp dụng trên production, binding/secrets hợp lệ, giao diện ChatGPT/Claude kết nối thành công, hoặc catalog đã xác minh độc lập. Xem `../reports/final-acceptance.md` để biết trạng thái sau kiểm tra lượt này.
