# Kiến trúc hệ thống

Bản mô tả theo mã nguồn ngày 16/10/2026. Slide tương ứng: `slides/thuyet-trinh.html` (slide 6). Vận hành chi tiết: `docs/QUAN-TRI.md`; kết nối AI: `docs/KET-NOI-AI.md`; đóng góp qua CMS: `docs/DONG-GOP-MCP.md`.

## 1. Bức tranh tổng

```
KÊNH               App học sinh (PWA)     ChatGPT / Claude        CMS tình nguyện viên     Phụ huynh, thầy cô
                   local-first            MCP, GPT Actions        + MCP đóng góp           liên kết đồng hành
                         │                      │                        │                       │
                         ▼                      ▼                        ▼                       ▼
DỊCH VỤ            Pages Functions (project nguyenvongai)           Pages Functions (nguyenvongai-cms)
(biên Cloudflare)  /api/tu-van  /mcp/{mã}  /api/gpt/{mã}            /api/ban-ghi  /api/xuat-ban-snapshot
                   /api/ket-noi /api/manifest /snapshots/*          /api/mcp-dong-gop /api/khoa-ket-noi
                   /api/bao-sai /api/tinh-nguyen                    /api/hop-thu  /api/nhat-ky
                         │                                                  │
                         ▼                                                  ▼
DỮ LIỆU            D1 nguyenvongai_db (dùng chung)     KV_CONG_DONG (snapshot)     RATE_KV / CACHE_KV
                   Vectorize nvai-kb + Workers AI      OpenRouter (LLM, ngoài Cloudflare)
```

Hai project Pages dùng chung **một** D1 và các KV. App deploy tự động từ `main` (`.github/workflows/deploy.yml`, project `nguyenvongai`); CMS deploy tay (`cd cms && wrangler pages deploy dist --project-name=nguyenvongai-cms`) cho đến khi đặt biến `DEPLOY_CMS = true`.

## 2. Bốn luồng dữ liệu chính

1. **Học sinh tra cứu và quyết định (không cần mạng cho phần lõi).** Trình duyệt nạp lười bộ 3.648 chương trình; động cơ TypeScript thuần (`src/engine`) tính điểm theo tổ hợp, điểm ưu tiên, nhãn, xác suất ước lượng, tối ưu danh mục, kế hoạch tuần. Hồ sơ nằm ở `localStorage` (khóa `nvai:*`), không gửi lên máy chủ.
2. **Hỏi đáp AI có căn cứ.** Client trả lời bằng quy tắc và dữ liệu trước (`traLoiTuDong`, `y-dinh.ts`); chỉ câu cần diễn giải mới gọi `/api/tu-van`. Máy chủ: giới hạn tần suất (KV) → hạn mức 50 lượt/hồ sơ/ngày (D1, nguyên tử, chỉ trừ khi AI thành công) → bậc thang cache KV, Clef, RAG (Vectorize), mô hình (OpenRouter) → hậu kiểm (số lệch dữ liệu bị chặn, mã và nguồn bịa bị lọc). Đầu vào mỗi lượt khoảng 800 đến 1.100 token, đầu ra tối đa 450 token.
3. **Kết nối ChatGPT/Claude.** App tính sẵn "bản chụp" (`src/engine/ket-noi-kieu.ts`: hồ sơ gọn, nguyện vọng có nhãn, gợi ý có id, kế hoạch tuần có giờ) và đẩy lên D1 khi học sinh bật kết nối. `/mcp/{mã}` và `/api/gpt/{mã}` chỉ đọc bản chụp và tạo **đề xuất chờ**; app poll `/api/ket-noi/de-xuat`, em bấm Xác nhận thì app mới đổi dữ liệu. Máy chủ không nạp bộ chương trình lớn nên nằm gọn trong giới hạn Pages Functions.
4. **Dữ liệu trường do cộng đồng giữ.** Học sinh báo sai (`/api/bao-sai`) hoặc tình nguyện viên nhập (CMS, hoặc nhờ AI qua `/api/mcp-dong-gop`) → bản ghi vào hàng chờ duyệt, gắn nhãn "Nhập qua AI", nguồn và trích dẫn → quản trị viên duyệt, xuất bản → snapshot có mã băm vào KV → app tải qua `/api/manifest` và `/snapshots/*`, tự kiểm băm, hợp nhất lên dữ liệu gốc.

## 3. Quyết định thiết kế và lý do

| Quyết định | Lý do |
|---|---|
| Local-first, không tài khoản | Quyền riêng tư, chi phí thấp, dùng ngay; đổi lại không đồng bộ nhiều thiết bị |
| Động cơ thuần TypeScript, có test | Giải thích được, kiểm chứng được; chạy giống nhau ở trình duyệt và máy chủ |
| Quy tắc trước, AI sau | Phần cần đúng không tốn AI, không bịa; giữ chi phí và độ trễ thấp |
| Trình duyệt tính sẵn, máy chủ chỉ lưu | Bộ dữ liệu lớn không vào Functions; máy chủ đơn giản, ít bề mặt tấn công |
| Công cụ ghi chỉ tạo đề xuất | AI không bao giờ tự đổi dữ liệu học sinh hay dữ liệu công bố |
| Snapshot có mã băm, duyệt rồi mới xuất bản | Dữ liệu có phiên bản, quay lui được, người dùng không đọc phải bản hỏng |
| Fail-closed ở mọi cổng công khai | Thiếu KV/D1 hoặc lỗi → từ chối, không phát sinh chi phí hay lộ dữ liệu |

## 4. Bảo mật

- Mã ghép nối 128 bit ngẫu nhiên, chỉ lưu SHA-256, hết hạn 30 ngày, thu hồi được; mỗi mã chỉ chạm hồ sơ của chính nó; lỗi xác thực dùng chung một thông điệp.
- Khóa cộng tác viên `nvk_` + 160 bit, chỉ lưu băm, hiện một lần, tối đa 3 khóa/người; **quyền tra lại từ `quan_tri` và `phan_cong` mỗi lần gọi** nên hạ vai có hiệu lực ngay.
- Giới hạn tần suất: theo IP cho tư vấn AI (8/phút) và tạo kết nối (5/giờ), theo mã cho MCP (60/phút), theo khóa cho đóng góp.
- Không có công cụ SQL tự do, xóa hay xuất bản qua MCP; dữ liệu từ AI coi là không tin cậy (kiểm hình dạng, cắt độ dài, chỉ hiển thị dạng chữ).
- Nhật ký kiểm toán ghi ai, công cụ nào, lúc nào (không ghi mã thô).

## 5. Khi một phần hỏng

| Sự cố | Hành vi |
|---|---|
| Nhà cung cấp AI lỗi hoặc hết lượt | Tự trả lời từ dữ liệu có sẵn, báo gọn, không trừ lượt; chào hỏi và tra cứu không bị ảnh hưởng |
| Thiếu D1 hoặc KV | Cổng công khai trả 503, không gọi AI |
| Snapshot sai băm | App bỏ qua, dùng dữ liệu gốc đã đóng gói |
| Mất mạng | Hồ sơ, nhãn, kế hoạch vẫn chạy (động cơ ở trình duyệt) |
| Mã kết nối lộ | Em bấm "Ngắt kết nối và xóa", bản chụp bị xóa ngay |

## 6. Giới hạn đã biết

- Mã trong URL không phải xác thực mạnh; liên kết nằm trong log request của Cloudflare. Cần tài khoản và OAuth 2.1 cho bản thật.
- Giới hạn tần suất bằng KV không nguyên tử, có thể lệch vài yêu cầu khi chạy song song (hạn mức AI và hạn mức đề xuất dùng D1 nên nguyên tử).
- Hạn mức AI tính theo mã hồ sơ ẩn danh trên thiết bị: xóa dữ liệu trình duyệt thì có lại 50 lượt.
- Chưa thử qua giao diện Claude/ChatGPT thật; gói ChatGPT nào hỗ trợ MCP tùy chỉnh còn tùy nguồn, cần kiểm trên tài khoản demo.
- Project Pages cũ `nguyen-vong-ai` đã xóa ngày 16/10/2026; production là `nguyenvongai` (app) và `nguyenvongai-cms` (CMS). Mọi lệnh deploy phải dùng đúng hai tên này.
