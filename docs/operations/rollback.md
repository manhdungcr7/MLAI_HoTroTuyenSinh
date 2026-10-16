# Quay lui bản phát hành

Chỉ người vận hành được ủy quyền mới thực hiện rollback production. Trước khi bắt đầu, xác định deployment, migration đã áp dụng và nguồn backup theo runbook Cloudflare đang có hiệu lực.

## Quy tắc an toàn

- Rollback code không tự đảo ngược thay đổi D1. Không xóa bảng hoặc dữ liệu migration để “khôi phục” ứng dụng.
- Không chạy DDL phá hủy, lệnh ghi dữ liệu học sinh hoặc lệnh deploy trong quá trình đánh giá cục bộ.
- Nếu code cũ không tương thích schema mới, dừng và lập kế hoạch forward-fix có phê duyệt; không tự viết migration đảo ngược.
- Sau rollback, kiểm tra chỉ đọc endpoint health/readiness và luồng không ghi phù hợp. Ghi rõ môi trường và thời điểm.

## Checklist vận hành

1. Ghi nhận deployment hiện tại và deployment mục tiêu.
2. Đối chiếu migration đã áp dụng với code mục tiêu.
3. Xác nhận có người trực và phương án quay lại deployment hiện tại.
4. Thực hiện bằng Cloudflare Dashboard hoặc quy trình phát hành chính thức của dự án.
5. Chạy smoke test chỉ đọc, quan sát lỗi và thông báo kết quả.

Repository hiện không chứa script rollback runtime đã xác minh. Không dùng các commit/tag/lệnh cụ thể trong báo cáo cũ nếu chưa đối chiếu lại với lịch sử và deployment thật.
