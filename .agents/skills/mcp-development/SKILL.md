---
name: mcp-development
description: Add or debug Nguyện Vọng AI MCP tools, Streamable HTTP transport and OAuth scope contracts.
---

Đọc `functions/mcp/`, `functions/_thu-vien/ket-noi-cong-cu.ts`, `src/capabilities/` và `docs/mcp/tool-catalog.md`.
Tool phải có input/output schema, validation chạy thật, annotations và scope rõ. Danh tính lấy từ token/kết nối; không nhận student ID để chọn bản chụp.
Mọi thao tác đổi dữ liệu tạo đề xuất chờ xác nhận; không cập nhật local state trực tiếp từ tool. Kiểm tra idempotency và task đã thay đổi.
Dùng SDK đã cài; giữ tương thích công cụ cũ. Chạy `npm run test:mcp` với SDK Client, không chỉ mock JSON.
