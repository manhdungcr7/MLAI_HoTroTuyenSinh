# Luồng dữ liệu

## 1. Học sinh tạo kết nối

1. App tạo bản chụp hồ sơ đã làm sạch (`src/engine/ket-noi-kieu.ts`, `lamSachBanChup`).
2. `POST /api/ket-noi/tao` (giới hạn 5 lần/giờ mỗi IP, fail-closed khi KV lỗi) sinh mã 128 bit.
3. D1 chỉ lưu `SHA-256(mã)` và bản chụp. Mã thô chỉ trả về một lần.

## 2. Claude kết nối qua OAuth (luồng mới)

```
Claude              /mcp (không token)          /oauth/register        /oauth/authorize              /oauth/token
  │ POST /mcp ───────► 401 WWW-Authenticate
  │ GET /.well-known/oauth-protected-resource/mcp ─► metadata: authorization_servers
  │ GET /.well-known/oauth-authorization-server ───► metadata: các endpoint
  │ POST /oauth/register ──────────────────────────► client_id (công khai, không bí mật)
  │ mở trình duyệt: GET /oauth/authorize?...&code_challenge=S256 ──► trang đồng ý
  │                                                                  học sinh dán MÃ KẾT NỐI, bấm Đồng ý
  │ ◄──── 302 redirect_uri?code=...&state=...  (mã dùng một lần, hết hạn 5 phút, lưu dưới dạng hash)
  │ POST /oauth/token (code + code_verifier) ─────────────────────────────────────────► access (1 giờ) + refresh (30 ngày)
  │ POST /mcp  Authorization: Bearer <access> ──► xác thực token → kết nối → kiểm phạm vi từng công cụ
  │ POST /oauth/token (refresh) ─► cặp mới, token cũ bị đánh dấu đã dùng
  │ dùng lại refresh cũ ─► thu hồi cả họ
```

Điểm kiểm soát:
- Danh tính đến từ mã kết nối, không từ tham số do client gửi lên. `client_id` chỉ xác định ứng dụng.
- Token truy cập tra ra `ket_noi_bam`, rồi `xacThucMaBam` kiểm tra kết nối còn hạn. Xóa kết nối là mọi token mất hiệu lực.
- Phạm vi lấy từ token, không từ đối số công cụ. Công cụ đọc cần `profile:read`, `preferences:read`, `admissions:read` hoặc `study:read`. Công cụ đề xuất cần `preferences:write`.

## 3. Claude/ChatGPT đọc bản chụp (cách cũ, vẫn chạy)

`/mcp/{mã}` hoặc `/api/gpt/{mã}/*` xác thực mã trong đường dẫn, rồi chạy cùng bộ công cụ, không kiểm phạm vi (`phamVi = null`).

## 4. Đề xuất từ AI

Công cụ `de_xuat_them_nguyen_vong` chỉ ghi vào `ket_noi_de_xuat` với trạng thái `cho`. App của học sinh đọc danh sách chờ, và chỉ khi học sinh bấm **Xác nhận** thì dữ liệu thật mới thay đổi. Máy chủ không tự ghi vào hồ sơ.

## 5. Tư vấn AI trên web

`POST /api/tu-van` → kiểm tra yêu cầu → giới hạn tần suất IP (KV) → giữ chỗ lượt AI trong D1 (một câu lệnh, nguyên tử) → bậc thang trả lời → chốt lượt khi thành công, trả lại khi lỗi. Lượt trả từ cache không bị trừ.

## 6. Ngắt kết nối

`DELETE /api/ket-noi` xóa đề xuất và bản chụp trước, rồi dọn token và mã OAuth (làm riêng, bỏ qua lỗi nếu bảng chưa có). Token vẫn còn trong bảng nhưng không còn dùng được vì không còn kết nối.
