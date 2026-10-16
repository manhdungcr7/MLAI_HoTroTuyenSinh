# AI chatbot & MCP red-team audit

Ngày: 2026-10-16
Phạm vi: `functions/mcp/**`, OAuth, tool contracts và test MCP/OAuth. Không sửa code trong phạm vi này; các kiểm tra hiện có bao phủ những lỗi P1 gần đây, trong đó `SEC-001` đã được tích hợp và xác minh ở baseline `a03b257`.

## Kết luận

- **MCP/OAuth local: đạt các kiểm tra giao thức và quyền hiện có.** `npm run test:mcp` chạy thành công với SDK MCP chính thức, Pages handler thật và SQLite migration trong harness; bao gồm discovery, execute, thiếu/hết hạn/thu hồi token, scope filtering, cách ly hồ sơ, schema nghiêm, OAuth PKCE, Origin/protocol/body bounds và pending write proposals.
- **Chatbot model: chưa thể đánh giá câu trả lời thật.** Runtime local không có cấu hình provider khả dụng (`OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` và binding `AI` đều không hiện diện). Không gửi truy vấn tới production vì không có cấu hình/provider local để thực hiện đánh giá lặp lại có kiểm soát. Không có câu trả lời, latency hay chi phí model nào được giả lập.
- Tạo bộ 50 tình huống A–E tại [`evidence/ai-eval.jsonl`](evidence/ai-eval.jsonl). Tất cả có `actualAnswer: null`, `passFail: null`, `status: not_run_provider_unavailable`. Các kết quả test MCP xác định dưới đây là bằng chứng riêng, không được tính thành kết quả chatbot.

## Phạm vi xác minh và kết quả

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Tool discovery và SDK protocol | Đạt | `tests/mcp-sdk.test.ts`: initialize/negotiation, list tools/schema, public calls, auth rejection, proposal write |
| OAuth / PKCE | Đạt | `tests/oauth-mcp.test.ts`: redirect validation, consent, invalid verifier, single-use code, expiry, refresh rotation/reuse, revoke, disconnect |
| Scope và danh tính | Đạt | `tests/mcp-contracts.test.ts`: discovery filter, direct-call denial, request liên tiếp không rò snapshot giữa connection; `study:write` yêu cầu OAuth consent mới |
| Input/output contract | Đạt | Schema từ chối field lạ, sai kiểu, cấu trúc lồng sai; output được kiểm trước khi trả |
| Write confirmation | Đạt | `de_xuat_them_nguyen_vong` và `update_study_progress` chỉ ghi pending proposal; không đổi snapshot; dedup, stale timestamp và task không tồn tại bị chặn |
| Transport/security boundary | Đạt | Origin lạ, protocol lạ, JSON-RPC batch, body sai/quá lớn và content negotiation bị kiểm tra |
| Chatbot factuality, grounding, tiếng Việt, latency/cost | Chưa đánh giá | Thiếu provider local; bộ 50 case là kế hoạch chạy có cấu trúc, chưa có response thật |
| External Claude/ChatGPT integration | Chưa xác minh | Local tests không chứng minh kết nối bên thứ ba đã hoạt động; không tuyên bố đã triển khai/xác nhận |

`npm run test:mcp`: exit code 0. Các nhóm trong output: `mcp-sdk` 7 checks, `mcp-contracts` 7 checks, `oauth-mcp` 22 checks, `ket-noi-mcp` toàn bộ checks trong suite đều qua. Test dùng client SDK chính thức đến handler HTTP thực; đây vẫn là bằng chứng local, không thay thế xác minh binding/migration trên deployment.

## Findings theo severity

### P1 — Legacy connection code không được cấp quyền `study:write`

- **Tái hiện trước sửa:** gọi `update_study_progress` qua `/mcp/{mã}` cũ, vốn không có OAuth scope consent.
- **Nguyên nhân:** đường legacy dùng `phamVi: null` để duy trì quyền tương thích nhưng có thể bị hiểu thành toàn quyền.
- **Trạng thái trên checkout:** đã sửa tại commit `a03b257`. Legacy vẫn tương thích với tool cũ; `update_study_progress` bị từ chối `INSUFFICIENT_SCOPE` và yêu cầu OAuth consent mới.
- **Xác minh:** `npm run test:mcp` và `tests/mcp-contracts.test.ts` đều qua; audit này không thay đổi fix hoặc commit.

Không ghi nhận thêm defect P0/P1 có thể tái hiện trong scope hẹp này. Điều đó không phải kết luận rằng model chatbot đã an toàn/chính xác, vì model chưa được gọi thật.

## Rà soát triển khai

- Bearer token được hash trong DB, token gắn một connection và được kiểm tra hiệu lực trước khi chạy MCP. Scope đến từ token, không từ arguments.
- Tool không nhận student ID để chọn snapshot; snapshot lấy theo danh tính kết nối đã xác thực.
- Các object arguments strict; schema tool có output schema và annotations. Thiếu scope chặn cả discovery lẫn gọi trực tiếp.
- Write tools chỉ tạo pending proposal. Progress proposal kiểm tra task và snapshot timestamp, tự lấy expected status, deduplicate yêu cầu trùng và không sửa snapshot.
- Transport stateless theo từng request; có giới hạn body, kiểm tra Origin và protocol; response không chứa token/snapshot trong headers/logs. Log MCP chỉ gồm tên tool, thời lượng và mã kết quả.
- OAuth default scope chỉ đọc; quyền ghi phải yêu cầu rõ. `study:write` không được cấp ngầm cho connection cũ.
- Catalog bundled được code mô tả là chưa được xác minh độc lập và freshness chưa biết; chatbot cần giữ nguyên cảnh báo nguồn/năm.

## Giới hạn và việc còn lại

1. Cần chạy đủ 50 câu hỏi qua chatbot runtime có provider hợp lệ; lưu answer thật, tool invocation, pass/fail, latency và cost nếu provider cung cấp. Dataset hiện ghi rõ chưa chạy, không dùng câu trả lời giả.
2. Cần một test connection được người dùng cấp quyền trên Claude/ChatGPT để xác minh external connector end-to-end trước khi tuyên bố tương thích đã hoạt động.
3. Local MCP tests không xác nhận production D1 migrations/bindings, consent UI thật hay việc người học xác nhận proposal trên browser.

Không có thay đổi source/test nào trong scope này vì các kiểm tra MCP/OAuth hiện có đã qua và không tìm thấy lỗi tái hiện cần sửa. Không commit hoặc deploy.
