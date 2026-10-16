# Kiểm tra runtime

Tài liệu này chỉ mô tả kiểm tra có trong checkout. Không dùng lệnh production bên dưới nếu chưa có ủy quyền phát hành.

## Kiểm tra cục bộ

- `npm run dev:tools:smoke`: kiểm tra các công cụ phát triển/plugin hiện có; không gọi dịch vụ AI.
- `npm run test:capabilities`: hợp đồng capability, tính điểm, dữ liệu thiếu và API.
- `npm run test:mcp`: giao thức MCP SDK, scope OAuth, cô lập snapshot, proposal và kết nối tương thích.
- `npm run test:browser`: hành trình local và ma trận route/responsive đã cài trong repo. Build trước; dùng `scripts/xuat-ban-ban-dau.ts --local --state=<thư mục QA riêng> --khong-vector` để tạo snapshot local, rồi chạy `app:local` với `NV_TRANG_THAI` cùng đường dẫn và `NV_QA_SNAPSHOT=1`. Script kiểm tra tháng chạy này đạt 4 hành trình + 144 route/viewport checks, không lỗi/tràn/ảnh hỏng; ghi nhận 48 cảnh báo hit target nhỏ. Chat không được gửi câu hỏi; kết quả không xác nhận tài khoản MCP bên ngoài hay production.
- `npx tsx scripts/xuat-ban-ban-dau.ts --local --state=<thư mục QA riêng> --khong-vector`: nạp snapshot fixture vào D1/KV local để browser QA; chỉ dùng state riêng, tuyệt đối không thay `--local` bằng `--remote` cho kiểm thử này.
- `npm run data:audit`: kiểm kê nguồn, trường thiếu và bản ghi không được xác minh trong catalog đi kèm.
- `npm run typecheck`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run build:functions`: cổng mã nguồn tương ứng.

## Production

Chỉ chạy smoke test đọc khi có URL được xác định và runtime hiện hành. API `/api/v1/ready` chỉ xác nhận binding D1/KV tại thời điểm gọi; không chứng minh migration, OAuth client bên ngoài, AI, dữ liệu tuyển sinh hay luồng học sinh hoạt động.

Không tạo kết nối, OAuth client, token, proposal, yêu cầu AI có tính phí, dữ liệu học sinh hoặc migration từ xa để kiểm tra nếu chưa có ủy quyền phát hành rõ ràng. Các script trong `scripts/verify-runtime/` có thể kiểm tra kết nối bên ngoài hoặc production; chỉ chạy sau khi đọc nội dung và xác nhận đúng môi trường, dữ liệu và quyền ghi.

## Khi kiểm tra lỗi

1. Ghi lại lệnh, kết quả và môi trường (local/preview/production) mà không ghi token, mã kết nối hay dữ liệu cá nhân.
2. Kiểm tra source và log đã được khử thông tin nhạy cảm trước khi sửa.
3. Chỉ tuyên bố đúng phạm vi đã kiểm tra. Build pass không xác nhận hành trình hoặc production.
