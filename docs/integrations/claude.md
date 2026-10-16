# Kết nối Claude (MCP connector)

**Trạng thái kiểm chứng (16/10/2026):** giao thức và luồng OAuth đã được kiểm bằng HTTP thật trên máy chủ cục bộ và trên production (xem [../evidence/test-report.md](../evidence/test-report.md)). **Chưa kết nối được với tài khoản Claude thật**, nên mọi bước giao diện Claude bên dưới chưa được xác nhận. Ghi rõ là chưa kiểm chứng.

## Thông tin kết nối

- URL máy chủ MCP: `https://nguyenvongai.pages.dev/mcp`
- Xác thực: OAuth 2.1, PKCE S256, đăng ký client động.
- Metadata khám phá: `/.well-known/oauth-protected-resource/mcp` và `/.well-known/oauth-authorization-server`.
- Phạm vi: `profile:read`, `admissions:read`, `preferences:read`, `preferences:write`, `study:read`.

## Các bước cho học sinh (dự kiến)

1. Trong Nguyện Vọng AI: **Hồ sơ > Cài đặt > Kết nối Claude và ChatGPT**. Bật công tắc và bấm **Đồng ý và tạo**. Sao chép **mã kết nối** (32 ký tự, chỉ hiện một lần).
2. Trong Claude: **Settings > Connectors > Add custom connector**. Dán URL `https://nguyenvongai.pages.dev/mcp`.
3. Claude mở trang **Cho phép ... xem hồ sơ của bạn?**. Dán mã kết nối vào ô, chọn **Đồng ý**.
4. Quay lại Claude, bật connector trong cuộc trò chuyện.

Nếu không có mã: vào app, bấm **Tạo lại** (mã cũ không còn dùng).

## Thử nghiệm (câu hỏi mẫu)

- "Hồ sơ của tôi có những gì?" → gọi `lay_ho_so`.
- "Nguyện vọng hiện tại của tôi là gì, có chương trình nào an toàn không?" → gọi `lay_nguyen_vong`.
- "Ngành Kinh tế ở trường nào có điểm chuẩn năm 2025?" → gọi `diem_chuan`, phải trả lời kèm năm và nguồn.
- "Thêm ngành Kinh tế vào nguyện vọng cho tôi" → gọi `goi_y_nganh`, rồi `de_xuat_them_nguyen_vong`. Phải báo rằng đề xuất chờ xác nhận trong app, **không** tự thêm.

## Giới hạn đã biết

- Phạm vi thiếu: công cụ trả lỗi "Thiếu quyền ..." thay vì dữ liệu. Muốn dùng đầy đủ, kết nối lại và cho phép tất cả quyền.
- Token truy cập sống 1 giờ; Claude sẽ làm mới bằng refresh token. Nếu refresh thất bại thì phải kết nối lại.
- Ngắt kết nối trong app làm mất hiệu lực mọi token ngay.
- Công cụ tra cứu trường công khai (không cần đăng nhập) chưa có.

## Xử lý sự cố

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
|---|---|---|
| Claude báo 401 và không hiện trang đồng ý | Metadata không đọc được | Kiểm tra `/.well-known/oauth-protected-resource/mcp` trả JSON |
| Trang đồng ý báo "Mã không đúng" | Mã sai, hoặc đã tạo lại | Lấy mã mới trong app |
| Trang đồng ý báo lỗi "không đăng ký đúng" | `redirect_uri` của Claude không khớp với client đã đăng ký | Xóa connector, thêm lại (đăng ký mới) |
| Công cụ trả "Token không còn hiệu lực" | Kết nối đã ngắt hoặc hết hạn 30 ngày | Tạo kết nối mới trong app |
| Lỗi 503 | D1 hoặc KV chưa sẵn sàng | Xem `/api/v1/ready` |

Ghi chú: migration 0011 phải được áp dụng trên D1 production trước khi OAuth hoạt động. Xem [../operations/rollback.md](../operations/rollback.md).
