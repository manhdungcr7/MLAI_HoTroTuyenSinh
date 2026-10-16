# MCP tool catalog

Server `nguyen-vong-ai` version `2.0.0` dùng `@modelcontextprotocol/sdk` đã cài trong repo. JSON Schema đầu vào và capability business logic dùng chung với HTTP adapter tại `src/capabilities/`; không sao chép thuật toán tuyển sinh vào MCP.

## Endpoint và xác thực

- `/mcp`: OAuth Bearer token. Token gắn với đúng một connection; scope lấy từ token, không lấy từ tool arguments. Xóa/hết hạn connection làm token mất hiệu lực.
- `/mcp/{ma}`: giữ tương thích connection code cũ; mã là quyền truy cập đầy đủ cho chính connection đó. Không log mã, token, snapshot hoặc arguments. Nên dùng OAuth với scope tối thiểu cho tích hợp mới.
- `tools/list` chỉ trả công cụ đủ scope. Gọi trực tiếp công cụ thiếu quyền vẫn bị từ chối với `INSUFFICIENT_SCOPE`. Công cụ chưa khai báo scope mặc định bị từ chối.
- Scope mới `study:write` chỉ cho phép gửi đề xuất tiến độ; học sinh xác nhận trong ứng dụng mới thay đổi dữ liệu.

## Công cụ chính

Tất cả arguments là object strict: field lạ, sai kiểu, vượt giới hạn đều bị từ chối; không ép chuỗi thành số hoặc cắt input. `limit`/`offset` được giới hạn trước khi nạp danh mục.

| Tool | Input chính | Scope bắt buộc | Kết quả |
|---|---|---|---|
| `search_universities` | `q?`, `tinh?`, `limit?` 1–100, `offset?` 0–10000 | `admissions:read` | `tong`, `limit`, `offset`, `data` |
| `get_university` | `maTruong` | `admissions:read` | Tên, tỉnh, số chương trình, phương thức, năm dữ liệu, tài liệu và provenance |
| `search_majors` | `q?`, `tinh?`, `maTruong?`, `maToHop?`, `limit?`, `offset?` | `admissions:read` | Danh sách chương trình có phân trang; điểm thiếu giữ `null` |
| `get_admission_rules` | `maTruong` | `admissions:read` | Phương thức, tổ hợp, tài liệu và phần điều kiện chưa có dữ liệu |
| `calculate_admission_score` | `maToHop`, `diemMon`, `khuVuc?`, `doiTuong?` | `admissions:read` | Tổng THPT thang 30, ưu tiên theo engine và các môn còn thiếu |
| `analyze_student_profile` | `{}` | `profile:read` | Hồ sơ, mục tiêu, điểm gần nhất và trường còn thiếu trong snapshot đã cấp quyền |
| `recommend_preferences` | `q?`, `tinh?`, `maTruong?`, `limit?` 1–20 | `profile:read`, `preferences:read`, `admissions:read` | Gợi ý có thể so cùng tổ hợp THPT và cách xếp hạng; không xác suất đỗ |
| `validate_preference_order` | `ids?` tối đa 30; mặc định thứ tự snapshot | `profile:read`, `preferences:read`, `admissions:read` | Kiểm mã, trùng, thiếu/thêm mã so với snapshot và giới hạn so điểm |
| `get_study_plan` | `{}` | `study:read` | `snapshotUpdatedAt`, `capNhat`, `suKien`; mỗi task đã đồng bộ có `taskId` và `progressStatus` |
| `update_study_progress` | `taskId`, `status: xong\|chua`, `snapshotUpdatedAt` | `study:write` | `trangThai: cho`, `deXuatId`; chỉ tạo pending proposal |

`diemMon` chỉ nhận `toan`, `nguVan`, `tiengAnh`, `vatLy`, `hoaHoc`, `sinh`, `lichSu`, `diaLy`, `gdktpl`, `tinHoc`, `congNghe`; mỗi giá trị là số 0–10 hoặc `null`. Thiếu môn không được thay bằng 0. `khuVuc`: `KV1`, `KV2-NT`, `KV2`, `KV3`; `doiTuong`: `khong`, `UT1`, `UT2`. Công thức trong engine chưa chứng minh đáp ứng quy chế mọi trường/năm.

## Tương thích

Giữ 9 tên đã công bố: `lay_ho_so`, `lay_nguyen_vong`, `goi_y_nganh`, `diem_chuan`, `ke_hoach_tuan`, `de_xuat_them_nguyen_vong`, `search_universities`, `get_university_profile`, `get_app_capabilities`. Tổng discovery đầy đủ là 18 tool vì `search_universities` cũng là tool chính.

`get_student_profile` vẫn gọi được như alias của `lay_ho_so`. `get_university_profile` dùng implementation và output có provenance của `get_university`. `search_universities` tiếp tục nhận `truyVan` thay `q` cho client cũ, nhưng không nhận đồng thời hai field. Danh sách phân trang dùng `data`; client cũ đọc `ketQua` cần cập nhật. Không còn suy luận `aggregator_verified` hoặc `official_pdf` chỉ từ việc tồn tại một URL.

Compatibility scopes: `lay_ho_so` → `profile:read`; `lay_nguyen_vong` → `preferences:read`; `goi_y_nganh`, `diem_chuan`, `get_university_profile`, `get_app_capabilities` → `admissions:read`; `ke_hoach_tuan` → `study:read`; `de_xuat_them_nguyen_vong` → `preferences:write`.

## Kết quả và lỗi

Mỗi tool công bố `inputSchema`, `outputSchema` và annotations. Tool đọc có `readOnlyHint: true`; hai tool tạo pending proposal có `readOnlyHint: false`. Mọi tool khai báo `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false` vì dùng snapshot/bundled data và deduplicate proposal đang chờ.

Client nên đọc `structuredContent`:

```json
{"ok":true,"data":{"...":"tool-specific data"},"meta":{"version":1,"dataScope":"bundled-admissions-snapshot","warnings":[]}}
```

`meta` chỉ xuất khi capability cung cấp. Nội dung text thành công tiếp tục chứa JSON của `data` cho client cũ. Lỗi tool có `isError: true` và `structuredContent: {"ok":false,"error":{"code":"INVALID_ARGUMENT","message":"...","details":[]}}`. Input sai schema, thiếu quyền, không có dữ liệu là lỗi typed; lỗi giao thức JSON-RPC dùng SDK error. Không trả stack, SQL, token hoặc dữ liệu connection khác.

Progress proposal kiểm task thuộc snapshot đã xác thực và timestamp khớp; trả `TASK_NOT_FOUND` hoặc `STALE_SNAPSHOT` nếu không hợp lệ. Server tự thêm `expectedStatus` từ snapshot, không nhận field này từ client. Cùng task/status/snapshot có cùng pending proposal id. Tổng pending proposal bị giới hạn chung với đề xuất nguyện vọng. Snapshot cũ chưa có task ids phải được đồng bộ lại. Server không tự cập nhật snapshot hay tiến độ; ứng dụng kiểm tra state hiện tại trước khi áp dụng xác nhận.

## Transport và public metadata

- Streamable HTTP dùng `WebStandardStreamableHTTPServerTransport`, instance mới cho từng request. Không lưu token/snapshot/session trong module state.
- Chế độ stateless, JSON response; GET SSE subscription và DELETE session trả 405. Notifications hợp lệ trả 202 rỗng. Không cung cấp resumability hoặc SSE subscription.
- POST phải có `Content-Type: application/json` và `Accept: application/json, text/event-stream`. Body tối đa 32.768 byte, kể cả khi thiếu `Content-Length`. Mỗi POST một message, JSON-RPC batch bị từ chối.
- Phiên bản giao thức lấy trực tiếp từ SDK. Unsupported `MCP-Protocol-Version` trả 400; `initialize` đàm phán phiên bản theo SDK.
- `Origin` được kiểm trước xác thực cho mọi method. Cho phép same-origin của endpoint và exact origins `https://claude.ai`, `https://chatgpt.com`, `https://chat.openai.com`. Server-to-server không có Origin được phép; Origin `null` và origin khác trả 403. CORS chỉ phản chiếu Origin đã duyệt, không dùng wildcard.
- Resource `nguyenvongai://metadata/capabilities` chỉ có tên tool/scope/confirmation/limitations công khai, giới hạn bởi danh mục tĩnh; không chứa snapshot hay URL có mã kết nối. Yêu cầu `admissions:read`.
- Prompt `admission_review` không nhận arguments; checklist ngắn cho tra nguồn và xác nhận proposal. Yêu cầu `admissions:read`, không đọc hồ sơ.

Danh mục tuyển sinh là dữ liệu đi kèm bản phát hành, chưa xác minh độc lập độ đúng/độ mới và chưa đồng bộ CMS đang chạy. Đọc `meta.warnings` và provenance trước khi trích dẫn. Nhãn phù hợp và khoảng cách điểm lịch sử không phải xác suất trúng tuyển.

## Kiểm tra local

```powershell
node_modules/.bin/tsx tests/mcp-sdk.test.ts
node_modules/.bin/tsx tests/mcp-contracts.test.ts
node_modules/.bin/tsc --noEmit
```

`mcp-sdk` chạy official SDK Client qua HTTP server thật đến Pages handler và SQLite migrations thật. `mcp-contracts` chạy SDK Streamable HTTP với fetch vào handler thật và SQLite, kiểm scope, isolation, strict nested schemas, resource/prompt privacy, proposal progress dedup/không tự ghi snapshot, Origin/protocol/body/content negotiation và thu hồi connection. Đây là bằng chứng local; không thay thế deployment bindings, migration và browser confirmation checks.

Tài liệu giao thức đã đối chiếu: [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [Cloudflare Request](https://developers.cloudflare.com/workers/runtime-apis/request/), và code/types của SDK đã cài tại repo.
