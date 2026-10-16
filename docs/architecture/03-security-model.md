# Mô hình bảo mật

Mỗi mục ghi: rủi ro, biện pháp đã làm, và test chứng minh (tên test nằm trong `tests/oauth-mcp.test.ts`, `tests/ket-noi-mcp.test.ts`, hoặc `scripts/verify-runtime/`).

## Tài sản cần bảo vệ

- Hồ sơ học tập của học sinh (điểm thi thử, mục tiêu, khu vực, ngân sách). Dữ liệu cá nhân, không công khai.
- Mã kết nối 128 bit và token OAuth: nếu lộ, người khác đọc được hồ sơ.
- Quota AI: nếu bị lạm dụng thì phát sinh chi phí.

## Xác thực và phân quyền

| Rủi ro | Biện pháp | Kiểm chứng |
|---|---|---|
| Đoán mã kết nối | 128 bit ngẫu nhiên; 60 yêu cầu/phút mỗi kết nối; KV lỗi thì từ chối | test "Giới hạn tần suất", `ket-noi-mcp` |
| Lộ mã trong D1 | Chỉ lưu SHA-256 | test `ket-noi-app` ("không lưu mã thô") |
| Mã xác nhận bị đánh cắp và dùng lại | Một lần, UPDATE có điều kiện `da_dung = 0`, hết hạn 5 phút | test "mã chỉ dùng một lần" |
| Đánh cắp mã xác nhận rồi đổi token | PKCE S256 bắt buộc; verifier sai thì mã không bị tiêu | test "sai verifier", RFC 7636 |
| Chuyển hướng mở (open redirect) | `redirect_uri` phải khớp đúng client đã đăng ký; client hoặc URI sai thì không chuyển hướng | test "không đăng ký: trang lỗi" |
| Client giả mạo tên ứng dụng để lừa học sinh | Chỉ cho đăng ký https hoặc loopback; trang đồng ý escape mọi giá trị | test "escape tên ứng dụng", "redirect_uri http tùy ý bị từ chối" |
| Lừa học sinh đồng ý (clickjacking) | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, CSP `default-src 'none'` | test kiểm tra header CSP |
| Token bị đánh cắp rồi làm mới | Refresh xoay vòng; dùng lại token đã xoay thì thu hồi cả họ | test "làm mới: dùng lại refresh cũ thì thu hồi cả họ" |
| Token truy cập dùng sau khi ngắt kết nối | Xác thực token luôn đi qua kết nối còn hạn | test "ngắt kết nối: xóa kết nối là mọi token mất hiệu lực" |
| Công cụ vượt quyền (ví dụ đề xuất khi chỉ được đọc) | Phạm vi lấy từ token; công cụ kiểm phạm vi trước khi chạy | test "phạm vi thiếu thì công cụ báo lỗi" (đã thử tắt kiểm tra: test đỏ) |
| Client tự chọn phạm vi cao hơn | Phạm vi yêu cầu phải thuộc danh sách đã biết; trống thì cấp đủ danh sách đã biết | test "phạm vi lạ bị từ chối" |
| CSRF trên trang đồng ý | Không cần token CSRF: kẻ tấn công không có mã kết nối của nạn nhân, nên form tự gửi không có tác dụng | Phân tích, không có test tự động |
| Thu hồi token lạ để dò | RFC 7009: luôn trả 200 | test "token lạ vẫn trả 200" |
| Dò kết nối qua endpoint đăng ký client | 20 lần/giờ mỗi IP | Mã trong `oauth/register.ts` |

## Quyền riêng tư

- Trang đồng ý không tải tài nguyên ngoài, không có script, không có analytics.
- Log chỉ ghi tên công cụ và kiểu xác thực (`kieu: oauth` hoặc `ma-duong-dan`), không ghi mã, token, hay nội dung hồ sơ.
- Lỗi trả về không chứa tên binding, SQL, hay cấu hình. Test: `sẵn sàng: ... không lộ tên binding`.
- Bản chụp không gồm tên, liên hệ hay lịch sử trò chuyện với AI (đã có trong hộp đồng ý của app).

## Những điều còn rủi ro

1. **Mã kết nối vẫn nằm trong đường dẫn `/mcp/{mã}` và `/api/gpt/{mã}/`.** URL có thể nằm trong lịch sử trình duyệt, log proxy, hoặc cấu hình GPT. Biện pháp: khuyến nghị chuyển sang OAuth (đã có), và coi cách cũ là tương thích ngược. Chưa làm: ngắt cách cũ (sẽ làm hỏng người dùng đã kết nối).
2. **Mã kết nối có thời hạn 30 ngày và không thu hồi được nếu học sinh không nhớ mã.** Xử lý bằng nút "Tạo lại" trong app.
3. **Chưa có kiểm thử xâm nhập bên ngoài.** Các test trên là tự kiểm; chưa thuê bên thứ ba kiểm.
4. **Trang đồng ý yêu cầu dán mã.** Học sinh phải sao chép mã từ app; đây là đánh đổi chống phishing so với đăng nhập bằng tài khoản. Hiện chưa có tài khoản học sinh.
5. **Mã xác nhận không ràng buộc IP hay thiết bị.** Mã sống 5 phút và dùng một lần; chấp nhận được với mức rủi ro hiện tại.
