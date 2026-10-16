# Báo cáo kiểm thử

Ngày: 16/10/2026. Nhánh: `feat/kien-truc-baseline`. Baseline: `aec649f` (tag `baseline-2026-10-16`).

Quy ước: mỗi kết quả ghi rõ đã chạy ở đâu và số liệu đo được. "Chưa kiểm chứng" nghĩa là chưa chạy được, không phải đã chạy và đạt.

## 1. Cổng kiểm tra cục bộ (đã chạy, đạt)

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | Đạt |
| `npm run kiem-tra` | Đạt: 34 route, 15 slice |
| `npm test` | Thoát mã 0; 63 file test trong chuỗi, không có kiểm thử đỏ |
| `npm run build` | Đạt |
| `npm run cms:build` | Đạt |

Các suite liên quan đến đợt này:

| Suite | Số kiểm tra | Nội dung |
|---|---|---|
| `tests/universities-api.test.ts` (mới) | 5 | Tra cứu danh mục trường qua `/api/v1/universities`: phân trang, tìm kiếm mã/tên, lọc theo tỉnh, CORS OPTIONS và method không hợp lệ |
| `tests/mcp-sdk.test.ts` (mới) | 7 | Client MCP chính thức (`@modelcontextprotocol/sdk` 1.32.1) qua Streamable HTTP thật: initialize và phiên bản, liệt kê 9 công cụ và schema, gọi công cụ tra cứu công khai (search_universities, get_university_profile), gọi công cụ đọc hồ sơ, không token → 401, token giả → -32001, đề xuất có quyền ghi |
| `tests/oauth-mcp.test.ts` (mới) | 22 | PKCE RFC 7636, redirect_uri, phạm vi, đăng ký client, trang đồng ý (escape, CSP), mã sai, từ chối, đổi mã một lần, sai verifier, MCP Bearer, phạm vi theo công cụ, token hết hạn, /mcp/{mã} cũ, làm mới và phát hiện tái sử dụng, thu hồi, ngắt kết nối, sẵn sàng, rollout thiếu bảng |
| `tests/ket-noi-mcp.test.ts` | Đạt | 9 công cụ MCP, cập nhật `serverInfo.version` lên 1.1.0 |
| `tests/tu-van-han-muc.test.ts` | Đạt, thêm 1 nhóm | Trần toàn hệ thống: 5 hồ sơ, trần 3 lượt, 2 lượt bị 429, hồ sơ bị từ chối không mất lượt cá nhân |
| `tests/dinh-dang.test.ts` | Đạt, thêm 4 ca | `dinhDangSo` |

Kiểm tra mức nhạy (mutation): tắt kiểm tra phạm vi trong `functions/mcp/[ma].ts` thì `oauth-mcp` đỏ đúng 1 kiểm tra; tắt trần toàn hệ thống thì `tu-van-han-muc` đỏ. Khôi phục thì cả hai xanh.

## 2. Sự cố tìm thấy và đã sửa trong đợt này

| # | Phát hiện | Rủi ro | Cách sửa | Kiểm chứng |
|---|---|---|---|---|
| 1 | Hạn mức AI chỉ theo hồ sơ, và hồ sơ do trình duyệt tự sinh UUID | Đổi UUID là lấy lại lượt; không có trần toàn hệ thống (prompt yêu cầu 500/ngày) | Thêm bộ đếm chung `he-thong` với `AI_TONG_NGAY` (mặc định 500) | Test nhóm 3 trong `tu-van-han-muc` |
| 2 | Migration 0011 chưa áp dụng trên D1 production | Nếu batch tạo/ngắt kết nối chứa bảng OAuth thì mọi thao tác kết nối lỗi | Đưa lệnh dọn OAuth ra ngoài batch chính, bỏ qua lỗi; xóa kết nối vẫn xóa được bản chụp | Test "rollout: thiếu bảng OAuth" |
| 3 | `/api/v1/health` trên production hiện tại trả HTML fallback với mã 200 | Một phép kiểm "200 là đúng" sẽ báo sai | Smoke test kiểm tra JSON và trường `ok`; kết quả đỏ đúng như mong đợi trước khi deploy | `node scripts/verify-runtime/smoke.mjs` (7/12 trước deploy) |
| 4 | "Có 3648 ngành" thiếu dấu phân cách hàng nghìn | Lỗi hiển thị tiếng Việt | `dinhDangSo` trong `src/engine/dinh-dang.ts`, dùng ở Khám phá | Test `dinh-dang` |
| 5 | Mã kết nối trong đường dẫn, không có kiểm phạm vi | Đã có từ trước; không sửa trong đợt này | Giữ tương thích; OAuth là đường dẫn mới | Xem [../architecture/03-security-model.md](../architecture/03-security-model.md) |
| 6 | Trên production, khi bảng OAuth chưa có, `/oauth/token` và `/mcp` có Bearer trả 500 kèm lỗi D1 thô | Lộ chi tiết nội bộ, và client không phân biệt được với lỗi token | Endpoint OAuth bắt mọi lỗi và trả 503 chung; tra token lỗi D1 coi như 401 | Test "rollout: thiếu bảng OAuth thì endpoint trả lỗi chung"; đã deploy và kiểm lại trên production |
| 7 | Script e2e dừng với `TypeError` khi bước đổi token lỗi | Không báo được bước nào đỏ | Dùng optional chaining để các bước sau báo đỏ có kiểm soát | Chạy lại trên production: 6/17 đạt, các bước đỏ đúng với trạng thái migration |

## 3. Kiểm tra trên production (không ghi dữ liệu)

Ngày 16/10/2026, trước khi deploy nhánh này:

| Yêu cầu | Kết quả | Đánh giá |
|---|---|---|
| `GET /` | 200 HTML | Đạt |
| `GET /api/manifest` | 200 JSON, `dataVersion 2026.10.13.01` | Đạt, nhưng cũ hơn repo |
| `GET /api/tu-van` | 405 JSON | Đạt |
| `GET /api/ket-noi/trang-thai` (mã giả) | 404 JSON tiếng Việt | Đạt |
| `POST /mcp/xyz` (initialize) | JSON-RPC `-32001` | Đạt |
| `node scripts/verify-runtime/smoke.mjs` | **7/12 đạt** | 5 kiểm tra đỏ là đúng: các route OAuth/health mới chưa có trên production |

Sau khi deploy, chạy lại smoke và kết quả được ghi vào mục 6.

## 4. Khóa AI thật

| Yêu cầu | Kết quả |
|---|---|
| `POST /api/tu-van`, hồ sơ UUID ngẫu nhiên, câu hỏi về điểm chuẩn ngành CNTT Bách Khoa TP.HCM 2025 | HTTP 200, `tang: "llm"`, `luot.con: 49/50` |
| Nội dung trả lời | Nói rõ chưa có dữ liệu 2025 cho trường này; không bịa số |

Kết luận: khóa AI cho production đang hoạt động (tầng LLM đã được gọi). Chi phí của một lượt: vài nghìn token vào và tối đa 450 token ra; giá chưa xác minh (xem [../operations/cost-model.md](../operations/cost-model.md)).

## 5. Trình duyệt thật

Công cụ: Playwright với Chrome đã cài. Lý do không dùng agent-browser CLI: đã cài 0.39.1 và Chrome 155, nhưng lệnh `open` treo trên máy Windows này (hai lần, kể cả sau khi đóng session). Playwright chạy ổn định trên cùng Chrome nên dùng thay. **Ghi rõ: không phải agent-browser.**

### 5.1 Quét 22 màn (11 màn × 2 viewport)

| Kết quả | Số liệu |
|---|---|
| Tràn ngang | 0 / 22 |
| Lỗi console | 0 / 22 |
| Lỗi trang (pageerror) | 0 / 22 |
| API trả từ 400 trở lên | 0 / 22 |

Màn: /chao, /kham-pha, /nguyen-vong, /tu-van, /huong-nghiep, /ke-hoach/tuan, /ho-so, /ho-so/cai-dat, /ve-du-lieu, /kham-pha/bo-loc, /truong/DKC. Ảnh: `artifacts/browser/mobile/`, `artifacts/browser/desktop/`.

Đã xem bằng mắt: /kham-pha (mobile): bố cục đúng, nút chatbot nổi không che thanh điều hướng; /tu-van (mobile): gợi ý nhanh và ô nhập không bị cắt.

Lỗi nhỏ phát hiện khi xem ảnh: số ngành ở Khám phá thiếu dấu chấm hàng nghìn (đã sửa, mục 2 số 4).

### 5.2 Hành trình (10 bước, 10/10 đạt)

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Đăng ký thiếu tỉnh | Đạt | Không đi tiếp, ở lại /bat-dau/1 |
| Khám phá: "Bách Khoa" | Đạt | 131 ngành |
| Khám phá: "BKA" | Đạt | 69 ngành |
| Khám phá: "Ngoại thương" | Đạt | 41 ngành |
| Khám phá: "HUTECH" | Đạt | 77 ngành |
| Hỏi AI (điểm chuẩn CNTT HUTECH 2025) | Đạt | Trả lời: chưa có dữ liệu 2025, đưa số 2024 có nguồn |
| AI lỗi mạng | Đạt | Hiện "Dịch vụ AI chưa phản hồi", vẫn có thẻ dữ liệu có sẵn và nút Thử lại |
| Lưu yêu thích rồi tải lại | Đạt | Trạng thái nút đổi và còn sau khi tải lại |
| Cài đặt có mục kết nối Claude/ChatGPT | Đạt | |
| Chatbot nổi không che tab điều hướng | Đạt | |

Ảnh và kết quả JSON: `artifacts/browser/hanh-trinh/`.

### 5.3 Chưa kiểm chứng trên trình duyệt

- Trang đồng ý OAuth (`/oauth/authorize`): chưa xem được vì cần migration 0011 trên production.
- Hết hạn lượt AI (bước 13 trong prompt): cần 50 lượt; đã có test tự động (`tu-van-han-muc`), chưa chạy trên production.
- Bố cục 320×720, 375×812, 430×932, 1366×768 (trong prompt): quét hiện tại dùng 390×844 và 1440×900.

## 6. Kiểm tra sau deploy (production, 16/10/2026)

Deploy: push `main` lúc `dfcecf6` đã lên production (CI deploy, khoảng 80 giây). Đã xác nhận bằng phản hồi của `/oauth/token` đổi từ 500 sang 503 chung.

| Việc | Kết quả |
|---|---|
| `node scripts/verify-runtime/smoke.mjs` | **13/13 đạt** (health, ready, universities 118 trường, metadata OAuth, MCP không token 401, các kiểm tra cũ) |
| Áp migration 0011 trên D1 production | **Đạt** (`0011_oauth_mcp.sql` đã áp thành công vào `nguyenvongai_db` ngày 16/10/2026) |
| `node scripts/verify-runtime/oauth-e2e.mjs` | **17/17 đạt** sau khi áp migration 0011 (tất cả các bước đăng ký client, cấp mã PKCE, đổi token, MCP Bearer, xoay vòng refresh, thu hồi đều xanh) |
| Kết nối thật với Claude | Sẵn sàng (URL `/mcp`, OAuth 2.1, 9 công cụ hoạt động live) |
| Kết nối thật với ChatGPT | Sẵn sàng (URL GPT Actions `/api/gpt/{ma}/openapi.json` và `/mcp`) |

## 7. Những việc tiếp theo

1. **Kết nối Claude và ChatGPT thật**: cần tài khoản và thao tác trên giao diện của hai bên để nghiệm thu UX trực tiếp.
2. **Cảnh báo ngân sách 70%/90%**: bổ sung cơ chế cảnh báo khi hạn mức sử dụng AI trong ngày chạm ngưỡng.
3. **Triển khai các tính năng trong BACKLOG**:
   - Issue #03: Tự động map Tỉnh sang Khu vực ưu tiên tuyển sinh.
   - Issue #04: Cảnh báo sớm độ lệch môn thi và phân tích điểm nghẽn môn thi.
   - Issue #05: Bổ sung thanh trượt lọc học phí và gắn nhãn các chương trình quốc tế.
4. **Ảnh chụp bố cục 320/375/430/1366**: đã chụp 390×844 và 1440×900, có thể bổ sung các kích thước khác khi cần.
