# Phụ lục bằng chứng kỹ thuật

Ngày chốt kiểm tra: 16/10/2026 · Checkout: `feat/agent-native-mcp`, `a03b257`.

Tài liệu này ánh xạ các tuyên bố trong proposal tới mã, cấu hình và bằng chứng thực thi. Cấu hình binding chỉ chứng minh binding được khai báo; không tự chứng minh dịch vụ production đang hoạt động.

| Tuyên bố | Vị trí mã/cấu hình | Bằng chứng kiểm tra | Giới hạn |
|---|---|---|---|
| Frontend React + TypeScript + Vite | `package.json`, `src/main.tsx`, `vite.config.ts`, `src/features/` | `npm run typecheck`, `npm run build` — đạt | Không đo tải production |
| Engine tính toán và tìm kiếm tách khỏi React | `src/engine/diem-uu-tien.ts`, `src/engine/du-bao-diem-chuan.ts`, `src/engine/toi-uu-nguyen-vong.ts`, `src/engine/xep-lich.ts`, `src/capabilities/` | `npm run test:capabilities`; `npm test`; focused edge/preference/forecast tests — đạt | Kết quả engine chỉ đúng trong phạm vi quy tắc và dữ liệu đầu vào được hỗ trợ |
| Pages Functions và binding Cloudflare | `functions/`, `wrangler.jsonc` (`DB`, KV, `AI`, `VECTORIZE`) | `npm run build:functions` — đạt | Build không xác minh secrets, remote bindings, migrations đã áp dụng hoặc runtime production |
| MCP Streamable HTTP, OAuth/PKCE và tool schemas | `functions/mcp/index.ts`, `functions/mcp/[ma].ts`, `functions/_thu-vien/oauth*.ts`, `functions/_thu-vien/ket-noi-cong-cu.ts` | `npm run test:mcp` — đạt; SDK gọi handler HTTP local | Chưa xác minh client Claude/ChatGPT ngoài hoặc deployment |
| Scope theo connection và quyền ghi cần consent | `functions/mcp/[ma].ts`, `tests/mcp-contracts.test.ts`, `tests/oauth-mcp.test.ts` | MCP tests xác nhận legacy code không được gọi `update_study_progress` khi thiếu `study:write`; write tạo proposal chờ xác nhận | Không phải pentest độc lập hay kiểm tra production |
| Snapshot catalog trong checkout | `src/data/`, script `scripts/audit-admissions-data.ts` | `npm run data:audit`: 118 trường, 3.648 chương trình; không có ID trùng, score malformed hoặc điểm THPT ngoài 30 | Snapshot-only; không xác minh nguồn gốc hoặc độ mới từng bản ghi |
| Chất lượng provenance và học phí | Trường nguồn/provenance trong dữ liệu catalog và `scripts/audit-admissions-data.ts` | Audit: 56 thiếu URL nguồn chính; 2.162 thiếu nguồn theo năm; 93 tổ hợp có môn engine chưa hỗ trợ; 3.047/3.648 học phí được gắn cờ ước tính | Các con số mô tả snapshot, không phải danh sách đã được đối chiếu tài liệu gốc |
| Typecheck và consistency gates | Scripts `typecheck`, `kiem-tra` trong `package.json` | `npm run typecheck`, `npm run kiem-tra` — đạt | Không thay thế browser E2E |
| Bộ test sản phẩm | Script `test` trong `package.json` | `npm test` — đạt trên checkout trước sprint | Số test không phải coverage percentage; không xác minh tất cả hành vi UI |
| Build ứng dụng và CMS | Scripts `build`, `cms:build` trong `package.json` | `npm run build`, `npm run cms:build` — đạt | Frontend build có cảnh báo chunk dữ liệu khoảng 1,36 MB |
| Model AI có thể được cấu hình qua binding/provider | `wrangler.jsonc`, `functions/_thu-vien/ai/` | Chỉ xác minh cấu hình khai báo trong repo | Audit runtime không có provider credentials/binding khả dụng; 50 câu hỏi chưa chạy, không có kết luận chất lượng/latency/chi phí |
| Browser E2E và demo | `scripts/agent-native-browser.mjs`, `npm run test:browser`, `demo/` | `NV_BROWSER_URL=http://127.0.0.1:8790 npm run test:browser`: PASS, 156 page/viewport, 5 journey checks, 0 error; MP4 đã kiểm bằng `ffprobe` và frame | Browser harness không submit câu hỏi AI; có 48 touch-target warning cần rà tiếp, trong đó landing là đường dẫn khóa |

## Lệnh đã xác nhận trên checkout nền

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run kiem-tra` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS, có cảnh báo chunk dữ liệu lớn |
| `npm run build:functions` | PASS |
| `npm run cms:build` | PASS |
| `npm run test:mcp` | PASS |
| `npm run test:capabilities` | PASS |
| `npm run data:audit` | PASS, các giới hạn provenance như bảng trên |

E2E/video là kết quả động. `docs/audits/05-e2e-demo.md` vẫn ghi một race riêng của demo script sau khi lưu sáu gợi ý; không trộn kết quả browser harness pass với kết luận rằng race đó đã được loại trừ.
