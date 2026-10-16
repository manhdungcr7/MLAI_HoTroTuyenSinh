# Kiểm tra runtime

Chạy sau mỗi lần deploy và trước khi tuyên bố một tính năng hoạt động.

## 1. Kiểm tra chỉ đọc (không ghi dữ liệu, không tốn lượt AI)

```
node scripts/verify-runtime/smoke.mjs                  # production
node scripts/verify-runtime/smoke.mjs https://<preview> # URL khác
```

Bao gồm: manifest, tư vấn chỉ nhận POST, mã sai trả JSON, MCP mã sai trả lỗi JSON-RPC, trang chủ là HTML, health, ready, metadata OAuth, và MCP không token trả 401 kèm `WWW-Authenticate`.

Quy tắc: một phản hồi 200 HTML không được tính là API đúng. Script kiểm tra kiểu nội dung và cấu trúc JSON.

## 2. Kiểm tra OAuth và MCP end-to-end (ghi dữ liệu thử nghiệm)

```
node scripts/verify-runtime/oauth-e2e.mjs
```

Script tạo một kết nối thử (hồ sơ mẫu), đăng ký một client, đi hết luồng đồng ý, đổi token, gọi MCP bằng Bearer, làm mới, phát hiện tái sử dụng, thu hồi, rồi ngắt kết nối thử. Client đăng ký vẫn còn trong `oauth_client` (một dòng, không chứa dữ liệu học sinh).

**Điều kiện**: migration 0011 đã áp dụng trên D1 production. Nếu chưa, các bước OAuth sẽ lỗi và script báo rõ bước nào đỏ.

Áp migration (cần đăng nhập Cloudflare với quyền D1):
```
npx wrangler d1 migrations apply nguyenvongai_db --remote
```

## 3. Kiểm tra sức khỏe

```
curl https://nguyenvongai.pages.dev/api/v1/health   # 200 {"ok":true,...}
curl https://nguyenvongai.pages.dev/api/v1/ready    # 200 khi D1 và KV đều ok, 503 khi có thành phần lỗi
```

`ready` chỉ trả trạng thái từng thành phần (`ok`, `loi`, `chua-cau-hinh`), không trả tên binding hay lỗi SQL.

## 4. Kiểm tra khóa AI

Không có lệnh cố định vì mỗi lần gọi tốn một lượt AI. Cách làm đã dùng ngày 16/10/2026:
- `POST /api/tu-van` với `hoSoId` và `requestId` là UUID ngẫu nhiên, một câu hỏi, `duLieu: []`.
- Kết quả đúng: HTTP 200, `tang: "llm"`, `luot.con` giảm một. Nếu thiếu khóa: HTTP 503 `chua-cau-hinh`.

## 5. Trình duyệt thật

Hành trình và ảnh chụp nằm trong `artifacts/browser/`:
- `artifacts/browser/mobile/`, `artifacts/browser/desktop/`: 22 màn ở 390×844 và 1440×900 (tràn ngang, lỗi JS, lỗi API).
- `artifacts/browser/hanh-trinh/`: 10 bước người dùng (đăng ký, tìm kiếm, hỏi AI, AI lỗi, lưu yêu thích, cài đặt kết nối, chatbot không che tab).

Chạy lại (Playwright với Chrome đã cài):
```
node scripts/verify-runtime/trinh-duyet/quet-man.mjs artifacts/browser
node scripts/verify-runtime/trinh-duyet/hanh-trinh.mjs artifacts/browser/hanh-trinh
```
Script nằm trong `scripts/verify-runtime/trinh-duyet/`. Cần Playwright (không nằm trong dependencies của repo): `npm i -D playwright` rồi `npx playwright install chromium`.

## 6. Quy trình khi kiểm tra thất bại

1. Xem log Pages (Dashboard > Deployments > Functions logs), tìm dòng JSON có `tang`.
2. Nếu `ready` trả 503: kiểm tra binding D1 và KV trong Settings của Pages project.
3. Nếu 401 hàng loạt trên `/mcp` có token: kiểm tra token hết hạn (1 giờ) và làm mới.
4. Nếu một kiểm tra đỏ nhưng ứng dụng vẫn dùng được: ghi rõ trong báo cáo, không đổi kỳ vọng để kiểm tra xanh.
