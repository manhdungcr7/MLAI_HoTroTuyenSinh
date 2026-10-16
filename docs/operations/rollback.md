# Quay lại phiên bản trước (rollback)

## Thứ tự an toàn

Đợt này gồm: code mới (Pages Functions và trang), migration 0011 (chỉ thêm bảng, không đổi bảng cũ), và thay đổi hành vi nhỏ (tên server MCP 1.1.0, trần AI toàn hệ thống).

### 1. Quay lại code (không cần sửa D1)

Cách nhanh nhất, không cần git:
1. Cloudflare Dashboard > Workers & Pages > `nguyenvongai` > **Deployments**.
2. Chọn deployment trước đợt này (commit `aec649f` hoặc tag `baseline-2026-10-16`) và bấm **Rollback to this deployment**.

Cách bằng git (đã kiểm tra lệnh, chưa chạy trên production):
```
git checkout -b hoan-tac-2026-10-16 baseline-2026-10-16   # tạo nhánh từ baseline
git push origin hoan-tac-2026-10-16:main                   # chỉ khi quyết định đẩy lên main; CI sẽ deploy
```
Hoặc revert commit gộp: `git revert -m 1 <hash-merge>` rồi push `main`.

Sau khi quay lại code, các bảng OAuth vẫn còn trong D1 nhưng không được dùng. Không cần xóa.

### 2. Quay lại dữ liệu

- Migration 0011 chỉ tạo bảng mới (`oauth_client`, `oauth_ma_xac_nhận`, `oauth_token`). Không có dữ liệu cũ nào bị ảnh hưởng.
- **Không xóa bảng** trên production nếu chưa có quyết định của chủ dự án. Nếu bắt buộc phải gỡ, chạy thủ công: `DROP TABLE IF EXISTS oauth_token; DROP TABLE IF EXISTS oauth_ma_xac_nhan; DROP TABLE IF EXISTS oauth_client;`. Việc này xóa mọi token còn hiệu lực, và khách đã kết nối Claude sẽ phải kết nối lại.
- Migration 0011 không có phần đảo ngược tự động (forward-only). Điều này được chấp nhận vì bảng mới không chứa dữ liệu học sinh gốc.

### 3. Kiểm tra sau khi quay lại

```
node scripts/verify-runtime/smoke.mjs
```
Các kiểm tra OAuth và health có thể đỏ sau rollback vì code cũ không có chúng. Đó là đúng hành vi; chỉ các kiểm tra của phiên bản cũ phải xanh.

### Khi nào cần quay lại

- Trang chủ, Khám phá, hoặc Nguyện vọng không tải (lỗi JS hoặc 5xx hàng loạt).
- `/api/ket-noi/tao` hoặc `/api/tu-van` trả 5xx sau khi deploy.
- Ngắt kết nối không xóa được bản chụp.

Lưu ý: đợt này được thiết kế để không phụ thuộc migration khi tạo hoặc ngắt kết nối (xem `functions/_thu-vien/ket-noi.ts`, mục dọn dẹp bỏ qua lỗi), nên deploy trước khi áp migration vẫn an toàn cho luồng cũ.
