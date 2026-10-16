# Hiện trạng hệ thống (baseline)

- Ngày kiểm: 16/10/2026
- Commit: `aec649f` (main). Tag: `baseline-2026-10-16` (local, chưa push).
- Production: https://nguyenvongai.pages.dev
- Trạng thái git trước khi bắt đầu: sạch, không có thay đổi chưa commit.

Tài liệu này ghi hành vi đã kiểm chứng, không ghi giả định. Mục nào chưa kiểm chứng được thì ghi rõ "chưa kiểm chứng".

## 1. Ngăn xếp và triển khai

| Thành phần | Thực tế trong repo |
|---|---|
| Frontend | Vite 8, React 19, react-router-dom 7 (hash router), Tailwind 4, TypeScript |
| Hạ tầng | Cloudflare Pages (`wrangler.jsonc`, `pages_build_output_dir: ./dist`), Pages Functions trong `functions/` |
| Dữ liệu | D1 `nguyenvongai_db` (binding `DB`), KV: `KV_CONG_DONG`, `RATE_KV`, `CACHE_KV` |
| AI (cấu hình) | Binding `ai` và `vectorize` (`nvai-kb`) trong `wrangler.jsonc`; biến `AI_MODEL=deepseek/deepseek-v4.1-flash`; mã nhà cung cấp đọc `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` |
| CMS | Thư mục `cms/` là ứng dụng Vite riêng, Pages project `nguyenvongai-cms` |
| Kiểm thử | `npx tsc --noEmit`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run cms:build` |
| CI | Deploy `main` lên Cloudflare Pages (GitHub Actions) |

Không có framework Hono, Zod hay Durable Object nào trong code hiện tại. Không có Workers riêng; mọi API là Pages Functions.

## 2. Kết quả chạy thật (16/10/2026)

Cổng kiểm tra trên bản local, đúng commit `aec649f`:

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | Đạt |
| `npm run kiem-tra` | Đạt: 34 route, 15 slice |
| `npm test` | Thoát mã 0, không có kiểm thử hỏng |
| `npm run build` | Đạt |
| `npm run cms:build` | Đạt |

Probe production (không ghi dữ liệu):

| Yêu cầu | Phản hồi | Ý nghĩa |
|---|---|---|
| `GET /` | 200 `text/html` | Trang chủ live |
| `GET /api/manifest` | 200 JSON, `dataVersion 2026.10.13.01` | Manifest dữ liệu live, cũ hơn bản repo hiện tại |
| `GET /api/tu-van` | 405 `{"loi":"Chỉ nhận POST"}` | Endpoint tư vấn tồn tại |
| `GET /api/ket-noi/trang-thai` | 404 JSON tiếng Việt | Cần mã kết nối, trả lỗi thân thiện |
| `GET /api/gpt/xyz/openapi.json` | 404 JSON tiếng Việt | Không lộ mã có tồn tại hay không |
| `GET /mcp/xyz` | 405 | Chỉ nhận POST |
| `POST /mcp/xyz` (`initialize`) | JSON-RPC lỗi `-32001` | Mã sai bị từ chối, không lộ thông tin |

Chưa kiểm chứng:
- Production có khóa AI hay không. Không có quyền xem biến bí mật. Gọi `/api/tu-van` hợp lệ sẽ tốn lượt AI nên chưa gọi.
- Kết nối thật với Claude và ChatGPT. Cần tài khoản và thao tác trên giao diện của hai bên.
- Nội dung D1 production.

## 3. Các thành phần đã có

### 3.1 Máy chủ MCP: `functions/mcp/[ma].ts`
- JSON-RPC 2.0, không trạng thái, nhận POST. Hỗ trợ `initialize`, `ping`, `tools/list`, `tools/call`.
- Phiên bản giao thức: `2025-06-18`, `2025-03-26`, `2024-11-05`.
- Xác thực bằng mã bí mật nằm trong đường dẫn (`/mcp/{ma}`), không phải OAuth 2.1. Mã sai, hết hạn hay đã thu hồi trả cùng một thông điệp.
- Giới hạn thân yêu cầu 32 KB.
- 6 công cụ (`functions/_thu-vien/ket-noi-cong-cu.ts`):
  - `lay_ho_so`, `lay_nguyen_vong`, `goi_y_nganh`, `diem_chuan`, `ke_hoach_tuan` (đọc bản chụp)
  - `de_xuat_them_nguyen_vong` (chỉ tạo đề xuất chờ học sinh xác nhận trong app)

### 3.2 GPT Actions: `functions/api/gpt/[ma]/`
- `openapi.json`, `ho-so`, `nguyen-vong`, `goi-y`, `diem-chuan`, `ke-hoach-tuan`, `lich.ics`, `de-xuat/them-nguyen-vong`.
- Cùng một mô hình bí mật theo mã kết nối như MCP.

### 3.3 Kết nối và đồng bộ: `functions/api/ket-noi/`
- `tao`, `dong-bo`, `trang-thai`, `de-xuat/`.
- Học sinh chủ động bật kết nối. Bản chụp hồ sơ được đẩy sau khoảng 5 giây khi có thay đổi.
- Đề xuất từ AI không được áp tự động; học sinh bấm Xác nhận hoặc Bỏ qua.
- Migration `0009_ket_noi_claude.sql`.

### 3.4 Tư vấn AI: `functions/api/tu-van.ts`
- Bậc thang: cache KV → Clef (luật/rule) → RAG → LLM (`functions/_thu-vien/ai/bac-thang.ts`).
- Hạn mức theo ngày theo hồ sơ ẩn danh (`AI_QUOTA_DAILY`, mặc định 50), đếm bằng D1 với giữ chỗ trước khi gọi, chốt khi thành công, trả lại khi lỗi. Có `requestId` để chống trừ hai lần.
- Giới hạn tần suất KV theo IP; KV lỗi thì từ chối (fail-closed).
- Không có khóa LLM thì trả 503 `chua-cau-hinh`; app tự chuyển sang chế độ trả lời từ số liệu có sẵn.
- Migration `0008_ai_han_muc.sql`.

### 3.5 Dữ liệu và snapshot
- `src/data/du-lieu-that.json`: 3.652 chương trình, 118 trường.
- Tier: `official_pdf` (có đề án) và `aggregator_verified` (trang tổng hợp, app ghi "chưa đối chiếu với đề án").
- `functions/snapshots/[tep].ts` và `/api/manifest`: phát hành snapshot từ CMS.
- `functions/_thu-vien/tap-truong.json`: danh mục trường đã sinh.

### 3.6 Đóng góp cộng đồng
- `functions/api/bao-sai.ts`, `tinh-nguyen.ts`, `dang-ky-som.ts`, `cau-hinh-cong-khai.ts`.
- CMS duyệt, xuất bản snapshot có hash.

## 4. Phân loại module

| Module | Phân loại | Lý do (bằng chứng) |
|---|---|---|
| Máy chủ MCP `functions/mcp/[ma].ts` | REFACTOR | Chạy đúng giao thức và từ chối mã sai. Xác thực bằng mã đường dẫn, chưa có OAuth 2.1 / PKCE / scope. Logic công cụ nằm trong `_thu-vien/` nên đã tách khỏi transport; đây là nền tốt. |
| Công cụ MCP `ket-noi-cong-cu.ts` | KEEP | Tách logic khỏi giao thức, đề xuất cần xác nhận. |
| GPT Actions `functions/api/gpt/` | KEEP | Cùng cơ chế với MCP. |
| Kết nối và đồng bộ `ket-noi/` | KEEP | Có migration, có kiểm thử (`ket-noi-app`, `ket-noi-mcp`). |
| Tư vấn AI `tu-van.ts` và `_thu-vien/ai/` | KEEP (hạ tầng); INVESTIGATE (chất lượng) | Hạn mức nguyên tử và fail-closed đúng. Chưa kiểm chứng được khóa LLM và câu trả lời thật trên production. |
| Logic điểm / gợi ý trong `src/engine/` và `src/features/` | REFACTOR | Chạy phía trình duyệt. Prompt yêu cầu dịch vụ chia sẻ cho web, MCP và GPT; hiện chỉ MCP/GPT gọi qua `_thu-vien/`, web tính riêng. Cần đối chiếu để tránh hai nguồn logic. |
| Dữ liệu `du-lieu-that.json` | REFACTOR | Có nguồn và tier, nhưng còn nhiều phương thức, một năm điểm cho phần lớn chương trình, và dữ liệu học phí/việc làm ở mức ước tính. Đã có lịch sử làm sạch (`scripts/phan_nhom_nganh.py`). |
| Snapshot và manifest | KEEP | Live trả 200, đúng schema. Phiên bản live (`2026.10.13.01`) cũ hơn repo; cần deploy lại để đồng bộ. |
| CMS `cms/` | KEEP | Build đạt, có kiểm thử. |
| Trang `/ve-du-lieu`, landing | KEEP | Có trong kiểm tra route. |
| Thư mục `legacy/`, `scratch/`, `dist/` | INVESTIGATE | Chưa rõ có còn được dùng không. Không xóa khi chưa có bằng chứng. |
| Thư mục `docs/audit/` (tài liệu cũ, có đường dẫn máy khác) | INVESTIGATE | Một số khẳng định đã lỗi thời, ví dụ cảnh báo RISK-01 về số liệu sinh tự động. |

Không có module nào được phân loại REMOVE vì chưa có bằng chứng dư thừa.

## 5. Khoảng cách so với yêu cầu của prompt

| Yêu cầu | Hiện trạng | Ghi chú |
|---|---|---|
| Hono, Zod | Không có | Có thể thêm dần; không bắt buộc để đạt mục tiêu |
| REST `/api/v1/...` | Có các route khác tên (`/api/tu-van`, `/api/gpt/...`) | Chưa có versioning |
| OAuth 2.1, PKCE, scope | Không có; dùng mã bí mật theo đường dẫn | Đây là khoảng cách lớn nhất về bảo mật |
| Streamable HTTP | Có ở mức tối thiểu (POST JSON, không SSE) | Cần kiểm tra với MCP Inspector |
| Nhiều công cụ theo spec (`search_universities`, `estimate_admission_chance`, `rank_preferences`…) | Có 6 công cụ khác tên | Thiếu tìm trường, hồ sơ ghi, xác suất |
| Metering và budget | Có hạn mức theo ngày, chưa có cảnh báo 70%/90% | Cần bổ sung |
| Health / ready | Chưa thấy endpoint `/api/v1/health` | Cần bổ sung |
| Kiểm thử runtime thật | Có kiểm thử đơn vị và tích hợp trong `tests/` | Chưa có kiểm thử live tự động trong CI |
| Agent-browser | Chưa chạy | Cần cài và đọc lệnh trước |
| Staging | Không thấy môi trường staging | Chưa chứng minh được |

## 6. Rủi ro đã thấy

1. Mã kết nối nằm trong đường dẫn URL. Đường dẫn có thể lưu trong lịch sử trình duyệt và log truy cập. Cần kiểm tra log và cân nhắc chuyển sang header hoặc OAuth.
2. Không xác minh được khóa LLM trên production; nếu chưa có khóa, tính năng "AI trả lời" đang chết và học sinh chỉ thấy chế độ số liệu.
3. Manifest live cũ hơn repo; dữ liệu học sinh đang thấy có thể không khớp bản kiểm thử.
4. Dữ liệu tuyển sinh còn nhiều phần chưa kiểm chứng (xem `docs/audit/technical-risks.md`, mục RISK-01 đã được xử lý một phần).

## 7. Việc tiếp theo đề xuất

Theo thứ tự rủi ro và chi phí:

1. Xác minh khóa AI trên production bằng một yêu cầu hợp lệ có kiểm soát (cần chủ tài khoản đồng ý vì tốn lượt).
2. Quyết định về xác thực: giữ mã đường dẫn có thời hạn, hay làm OAuth 2.1. Đây là quyết định sản phẩm và bảo mật, cần người phụ trách chốt.
3. Thêm `/api/v1/health` và `/api/v1/ready` không lộ cấu hình.
4. Chạy agent-browser trên hai nhóm viewport đã nêu, lưu bằng chứng vào `artifacts/browser/`.
5. Thêm kiểm thử live (`scripts/verify-runtime/`) vào CI, chỉ đọc.
