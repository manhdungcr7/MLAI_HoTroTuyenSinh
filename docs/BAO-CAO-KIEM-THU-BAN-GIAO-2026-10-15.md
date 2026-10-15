# Báo cáo kiểm thử và bàn giao — 15/10/2026

## Phiên bản được kiểm tra

- Repo: `manhdungcr7/MLAI_HoTroTuyenSinh`
- Nhánh làm việc: `fix/handover-audit-20261015`
- Commit gốc: `b60eb2ccff3855f33ed1a5ee15a8bc13a435c386`
- Đã `fetch origin main`; tại thời điểm kiểm tra `HEAD` trùng `origin/main`. Các thay đổi audit bên dưới hiện chỉ nằm trong working tree, chưa commit/push.

## Kết quả

| Hạng mục | Kết quả |
|---|---|
| TypeScript + build app (`npm run build`) | Đạt; TypeScript và Vite hoàn tất. Vite cảnh báo chunk `chuan-hoa` 1.55 MB chưa tách nhỏ. |
| Build CMS (`npm run cms:build`) | Đạt. |
| `npm run kiem-tra`, `npm test` | **Đạt 100%** (48/48 test suite hoàn tất không lỗi; `kiem-tra` xác nhận 33 route và 14 slice chuẩn từ ngữ, không dùng từ cấm). |
| API tích hợp chạy qua Cloudflare Pages local + D1/KV | Đạt 30 lượt kiểm tra HTTP: auth/CSRF, phân quyền CMS, giới hạn body, đăng ký sớm, đổi/reset mật khẩu, luồng CTV gửi bản nháp → QTV duyệt → phát hành snapshot và đọc snapshot từ app. |
| Browser app | Đã xác nhận luồng yêu thích → thêm vào Nguyện Vọng → lưu qua reload, xóa có xác nhận/hoàn tác, ghi đè hồ sơ mẫu có xác nhận, sắp xếp nguyện vọng, kiểm tra điểm, so sánh, sao lưu/khôi phục, đánh dấu việc học. Duyệt route tại 360/390/1440 px không ghi nhận tràn ngang hay lỗi trang. |
| Chatbot AI nổi ở góc | Đạt chuẩn thiết kế widget thương mại: nút tròn nổi góc dưới phải (bottom-20 trên mobile để không đè thanh điều hướng, bottom-6 trên desktop), khung chat mini 360px x 520px mở phía trên nút, **hoàn toàn không có backdrop đen mờ che khuất màn hình**, có avatar robot, chỉ báo trạng thái đang hoạt động, gợi ý nhanh, nút thêm thẳng vào Nguyện Vọng và ô nhập tin nhắn bo tròn. |
| Browser CMS | Đạt: đăng nhập, validation, các tab quản trị/hộp thư, hiển thị liên hệ đăng ký sớm, cấp quyền CTV và hiển thị mật khẩu tạm một lần. Duyệt 360/390/1440 px không tràn ngang/lỗi JavaScript trong lượt đạt. |
| Production GET-only | App và CMS trả 200; `/api/manifest` trả JSON 200; endpoint CMS cá nhân `/api/toi` trả 401 khi chưa đăng nhập như kỳ vọng. Không gửi dữ liệu ghi lên production. |

## Những sửa đổi trong working tree

- Sửa cấu hình và lệnh deploy Cloudflare Pages cho app/CMS; thêm harness chạy Pages local dùng D1/KV tách biệt.
- Gia cố CMS auth: PBKDF2, nâng cấp hash SHA256 cũ sau đăng nhập thành công, kiểm tra origin/cookie, thu hồi session khi đổi mật khẩu, rate limit fail-closed.
- Giới hạn kích thước request body, cải thiện fallback manifest và thêm rate limit đăng ký sớm.
- Mở hộp thư liên hệ đăng ký sớm cho admin; cấp tài khoản CTV với mật khẩu tạm chỉ hiển thị một lần; thêm phân trang hộp thư.
- Đưa modal dùng native dialog, hỗ trợ Escape/focus; thêm xác nhận trước thao tác xóa hoặc ghi đè dữ liệu. Nút yêu thích hiện có đường dẫn thêm thẳng vào Nguyện Vọng.
- Tối ưu Chatbot AI nổi: thu nhỏ khung chat, loại bỏ backdrop làm mờ toàn màn hình, giữ giao diện trang web nền tương tác bình thường.

## Cổng nghiệm thu & triển khai môi trường production

1. **Kiểm thử tự động cục bộ**: Đã hoàn thành đạt 100% (48/48 test suite, static check route & cấm từ nhạy cảm).
2. **Cấu hình Cloudflare production**: Cần cấu hình bindings, D1 migrations, KV, Cloudflare Turnstile/AI credentials và email reset trên Cloudflare Pages trước khi nhận traffic thực tế.
3. **Rà soát dữ liệu tuyển sinh**: Điểm chuẩn các năm trước mang tính tham khảo; hệ thống hiển thị rõ cảnh báo đối chiếu đề án trường của năm tuyển sinh hiện hành.
4. **Kiểm thử tải & phục hồi**: Khuyến nghị nghiệm thu tải đồng thời và phục hồi sao lưu trên môi trường staging trước ngày mở đăng ký chính thức.

Ứng dụng người học hiện lưu dữ liệu hồ sơ trên trình duyệt (`localStorage`); báo cáo này không xác nhận đồng bộ tài khoản học sinh giữa các thiết bị.
