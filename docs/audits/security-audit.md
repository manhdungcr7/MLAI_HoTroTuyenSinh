# Rà soát bảo mật theo source

Ngày rà soát: 2026-10-16. Đây là rà soát source và test cục bộ; không phải penetration test hay xác nhận cấu hình production.

## Đã kiểm tra

- MCP dùng OAuth Bearer và lấy danh tính từ kết nối phía server; không dựa vào `studentId` do client gửi.
- Scope mặc định khi client không yêu cầu scope là quyền đọc: `admissions:read`, `profile:read`, `preferences:read`, `study:read`. Quyền ghi cần scope riêng.
- Tool ghi tạo đề xuất chờ học sinh xác nhận trong app; kiểm tra stale state và lặp yêu cầu được bao phủ trong test.
- Schema MCP từ chối field lạ và dữ liệu sai kiểu; metadata/resource không phát tán snapshot hồ sơ.
- `npm run test:mcp` PASS trên môi trường test cục bộ.

## Chưa xác minh

Không có xác nhận production về secrets, OAuth client bên ngoài, TLS/proxy, rate limits, migration, D1/KV bindings, log retention hoặc quyền tài khoản. Không dùng report lịch sử như bằng chứng trạng thái hiện tại. Trước phát hành cần review cấu hình đích và chạy smoke có ủy quyền theo `docs/operations/agent-native-release.md`.
