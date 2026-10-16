# PHỤ LỤC KIỂM CHỨNG KỸ THUẬT (ENGINEERING EVIDENCE)
**Tài liệu Truy xuất Nguồn gốc Kỹ thuật & Bằng chứng Codebase Dự án Nguyện Vọng AI**

- **Dự án**: Nguyện Vọng AI
- **Phiên bản mã nguồn**: `feat/agent-native-mcp` (Cam kết cơ sở: `dae3c8c`)
- **Tài liệu tham chiếu**: [NGUYEN-VONG-AI-PROPOSAL.md](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/submission/NGUYEN-VONG-AI-PROPOSAL.md)
- **Mục đích**: Cung cấp bằng chứng kỹ thuật trực tiếp từ mã nguồn, tệp cấu hình, nhật ký kiểm thử và kết quả đo lường thực tế để Ban giám khảo kỹ thuật đối chiếu và kiểm tra độc lập.

---

## 1. Thông tin Cam kết & Ranh giới Mã nguồn (Repository Traceability)

| Hạng mục | Giá trị kiểm chứng | Ghi chú kỹ thuật |
|---|---|---|
| **Git Branch** | `feat/agent-native-mcp` | Nhánh phát triển chuẩn bị nộp bài |
| **Commit Hash** | `dae3c8c` | `feat(khoi-dau): add bottleneck subject analysis, slide screenshots, and register acceptance tests` |
| **Durable Checkpoint** | `checkpoint-antigravity-takeover-2026-10-16` | Git stash checkpoint bảo toàn 100% tệp gốc trước khi audit |
| **Landing Baseline Tag** | `landing-approved-2026-10-07` | Tag bảo vệ giao diện landing page đã duyệt (0 modified lines) |
| **Recovery Baseline Tag**| `recovery-agent-native-2026-10-16` | Snapshot phục hồi kiến trúc Agent-Native |

---

## 2. Ngăn xếp Công nghệ Thực tế & Phiên bản Phụ thuộc

Dữ liệu trích xuất trực tiếp từ [package.json](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/package.json) và [package-lock.json](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/package-lock.json):

```json
{
  "production_dependencies": {
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "react-router-dom": "^7.18.4",
    "lucide-react": "^1.52.0"
  },
  "development_dependencies": {
    "@modelcontextprotocol/sdk": "^1.32.1",
    "@cloudflare/vite-plugin": "^1.62.5",
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^7.0.2",
    "vite": "^8.3.2",
    "wrangler": "^4.147.0",
    "tsx": "^4.23.15",
    "puppeteer-core": "^25.14.0"
  }
}
```

---

## 3. Bản đồ Kiến trúc Biên & Các Ràng buộc Hạ tầng

Cấu hình tài nguyên Cloudflare từ [wrangler.jsonc](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/wrangler.jsonc):

- **Tên dự án**: `nguyenvongai`
- **Output Directory**: `./dist`
- **Compatibility Date**: `2026-10-01`
- **D1 Databases (SQLite Edge)**:
  - Binding: `DB`
  - Database ID: `3c9c7d34-ac41-4a52-89d6-d7566bc8aa31`
  - Thư mục migrations: `migrations/` (12 files)
- **Workers KV Namespaces**:
  - `KV_CONG_DONG` (id: `b6281182b7ff42bc8a23deb93ffdef94`): Lưu trữ đóng góp cộng đồng
  - `RATE_KV` / `CACHE_KV` (id: `dd9e8bea584d4b7c8af1dbe98a617535`): Giới hạn tần suất và cache AI
- **Vectorize Semantic Index**:
  - Binding: `VECTORIZE`
  - Index Name: `nvai-kb`
- **Workers AI**:
  - Binding: `AI`
  - Mô hình cấu hình: `deepseek/deepseek-v4.1-flash` (hoặc `@cf/meta/llama-3.3-70b-instruct`)

---

## 4. Danh mục Năng lực Lõi (Capabilities Inventory)

Triển khai tại [src/capabilities/index.ts](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/src/capabilities/index.ts) và [src/capabilities/catalog.ts](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/src/capabilities/catalog.ts):

| Tên Năng lực (Capability) | Kiểu dữ liệu đầu vào | Kết quả đầu ra | Thuật toán / Logic thực thi |
|---|---|---|---|
| `search_universities` | `query?: string, province?: string, limit?: int, offset?: int` | `{ tong, data: University[] }` | Tìm kiếm trường theo từ khóa không dấu, viết tắt (`BK`, `NEU`), lọc theo tỉnh thành |
| `get_university` | `maTruong: string` | `{ maTruong, tenTruong, tinh, provenance }` | Lấy chi tiết thông tin trường kèm metadata nguồn kiểm chứng |
| `search_majors` | `query?: string, maTruong?: string, phuongThuc?: string` | `{ tong, data: Program[] }` | Phân trang chương trình đào tạo, lọc tổ hợp và phương thức xét tuyển |
| `get_admission_rules` | `maTruong: string` | `{ phuongThuc, toHop, limitations }` | Danh sách quy tắc xét tuyển và các tổ hợp môn được chấp nhận |
| `calculate_admission_score` | `maToHop: string, diemMon: object, khuVuc?, doiTuong?` | `{ tongBaMon, uuTienCong, tongXetTuyen, quyTac }` | Tính tổng điểm 3 môn, điểm ưu tiên giảm dần từ 22,5 theo quy chế Bộ GD&ĐT |
| `analyze_student_profile` | Không tham số (yêu cầu Snapshot `BanChup`) | `{ hoSo, diemUuTien, monNghien, truongConThieu }` | Phân tích điểm mạnh/yếu, xác định môn nghẽn điểm để ưu tiên ôn tập |
| `recommend_preferences` | Không tham số (yêu cầu Snapshot `BanChup`) | `{ tong, data: Program[], methodology }` | Phân tầng danh sách nguyện vọng thành 4 nhóm: Thử sức, Vừa sức, An toàn, Dự phòng |
| `validate_preference_order` | `ids: string[]` | `{ valid, unknownIds, duplicateIds, data }` | Xác thực tính hợp lệ của thứ tự nguyện vọng và cảnh báo trùng lặp |
| `get_study_plan` | Không tham số (yêu cầu Snapshot `BanChup`) | `{ suKien: Event[], snapshotUpdatedAt }` | Trả về danh sách buổi tự học trong tuần được tối ưu theo thời khóa biểu |
| `update_study_progress` | `taskId: string, status: "xong"\|"chua", snapshotUpdatedAt` | `{ trangThai: "cho", deXuatId }` | Tạo đề xuất cập nhật tiến độ ở trạng thái chờ học sinh phê duyệt (Idempotent) |
| `get_app_capabilities` | Không tham số | `{ ten, phienBan, congCuHoTro, limitations }` | Trả về siêu dữ liệu công khai về năng lực và giới hạn của hệ thống |

---

## 5. Danh mục Công cụ MCP (Model Context Protocol Inventory)

Triển khai tại [functions/mcp/[ma].ts](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/mcp/[ma].ts) và [functions/_thu-vien/ket-noi-cong-cu.ts](file:///d:/07-Competitions-Hackathons/mlai/nguyenvongai/functions/_thu-vien/ket-noi-cong-cu.ts):

- **Phiên bản Server MCP**: `2.0.0`
- **Transport**: `WebStandardStreamableHTTPServerTransport`
- **Giới hạn kích thước Body**: `32.768 bytes (32 KB)`
- **Nguồn Origin tin cậy**: `https://claude.ai`, `https://chatgpt.com`, `https://chat.openai.com`
- **Tài nguyên công khai**: `nguyenvongai://metadata/capabilities` (Chỉ chứa siêu dữ liệu, không chứa thông tin học sinh)
- **Prompt mẫu**: `admission_review` (Checklist tra cứu đề án có dẫn nguồn, không argument)

### Bảng 18 công cụ MCP chi tiết:

| Tên công cụ | Quyền hạn cần thiết (OAuth Scope) | Tính chất ghi (Mutation) | Ràng buộc Schema / Xác thực |
|---|---|---|---|
| `search_universities` | `admissions:read` | Read-only | Query chuỗi, phân trang limit/offset |
| `get_university` | `admissions:read` | Read-only | Mã trường hợp lệ (ví dụ: `BKA`, `QSB`) |
| `search_majors` | `admissions:read` | Read-only | Lọc theo trường, nhóm ngành, phương thức |
| `get_admission_rules` | `admissions:read` | Read-only | Trả về danh sách tổ hợp hợp lệ |
| `calculate_admission_score` | `admissions:read` | Read-only | Bắt buộc 3 môn điểm số hợp lệ `0 <= x <= 10` |
| `analyze_student_profile` | `profile:read` | Read-only | Yêu cầu snapshot học sinh hợp lệ |
| `recommend_preferences` | `profile:read` | Read-only | Phân loại tất định 4 tầng |
| `validate_preference_order` | `profile:read` | Read-only | Mảng danh sách mã chương trình |
| `get_study_plan` | `study:read` | Read-only | Trả về danh sách lịch học kèm taskId |
| `update_study_progress` | `study:write` | **Pending Proposal** | Kiểm tra taskId và timestamp snapshot; tạo đề xuất chờ duyệt |
| `get_app_capabilities` | `admissions:read` | Read-only | Siêu dữ liệu hệ thống |
| `lay_ho_so` (Legacy) | `profile:read` | Read-only | Tương thích ngược phiên bản 1.0 |
| `lay_nguyen_vong` (Legacy) | `profile:read` | Read-only | Danh sách nguyện vọng kèm điểm chuẩn tham chiếu |
| `goi_y_nganh` (Legacy) | `profile:read` | Read-only | Gợi ý chương trình dựa trên hồ sơ |
| `diem_chuan` (Legacy) | `admissions:read` | Read-only | Tra cứu điểm chuẩn lịch sử 2021–2025 |
| `ke_hoach_tuan` (Legacy) | `study:read` | Read-only | Danh sách sự kiện tự học |
| `tao_link_lich` (Legacy) | `study:read` | Read-only | Sinh liên kết thêm nhanh vào Google Calendar |
| `de_xuat_them_nguyen_vong` | `profile:write` | **Pending Proposal** | Tạo đề xuất thêm ngành vào danh sách (tối đa 5 đề xuất chờ) |

---

## 6. Kết quả Kiểm toán Dữ liệu Tuyển sinh Thực tế (Data Audit Evidence)

Thực thi lệnh `npm run data:audit` trực tiếp trên kho lưu trữ:

```json
{
  "scope": "bundled snapshot only; no live CMS/network/link verification",
  "universityCount": 118,
  "programCount": 3648,
  "methodCounts": {
    "THPT": 3320,
    "HOC_BA": 220,
    "DGNL_KHAC": 65,
    "KET_HOP": 21,
    "NANG_KHIEU": 9,
    "DGTD": 8,
    "DGNL_HCM": 5
  },
  "sourceTierCounts": {
    "aggregator_verified": 2156,
    "official_pdf": 1492
  },
  "scoreYearCounts": {
    "2021": 22,
    "2022": 487,
    "2023": 1017,
    "2024": 1181,
    "2025": 1029,
    "2026": 1679
  },
  "duplicateIds": [],
  "malformedScores": [],
  "programsWithoutSourceUrl": 56,
  "programsWithoutYearlySource": 2162,
  "programsWithoutCombination": 1,
  "programsWithNoComputableCombination": 93,
  "programsWithoutScore": 0,
  "thptScoresOutside30": [],
  "tuitionKnown": 3648,
  "tuitionEstimated": 3047
}
```

### Đánh giá chất lượng dữ liệu:
- **0 bản ghi trùng ID**: Toàn bộ 3.648 mã định danh chương trình đào tạo là duy nhất.
- **0 điểm chuẩn dị thường**: Không có điểm tốt nghiệp THPT nào vượt quá thang điểm 30.
- **Tính minh bạch về học phí**: Trong số 3.648 chương trình có trường học phí, chỉ có **601 chương trình** có số liệu xác nhận từ văn bản của trường; **3.047 chương trình (83,5%)** sử dụng đơn giá ước tính theo khối ngành kèm nhãn hiển thị `≈ ước tính` trên UI.

---

## 7. Kiến trúc Điều phối AI & Các Rào chắn An toàn (AI Orchestration)

Triển khai tại [functions/api/tu-van.ts](file:///d:/07-Competitions-Hackathons\mlai\nguyenvongai\functions\api\tu-van.ts) và [functions/_thu-vien/ai/sinh-van-ban.ts](file:///d:/07-Competitions-Hackathons\mlai\nguyenvongai\functions\_thu-vien\ai\sinh-van-ban.ts):

### Bảng tham số điều phối:
- **Giới hạn độ dài sinh (Max Output Tokens)**: `450 tokens` (Đảm bảo phản hồi cô đọng, dưới 120 từ tiếng Việt).
- **Nhiệt độ (Temperature)**: `0.2` (Ưu tiên tính chính xác, triệt tiêu sự sáng tạo lan man).
- **Cơ chế suy luận (Reasoning parameter)**: `{ reasoning: { enabled: false } }` (Tắt suy luận ngầm trên OpenRouter để tránh nghẽn timeout và cạn token).
- **Sắp xếp nhà cung cấp (Provider Sorting)**: `{ provider: { sort: "latency" } }`.
- **Giới hạn thời gian (Timeout Budgets)**:
  - Tổng ngân sách thời gian một lượt: `12.000 ms (12 giây)`
  - Rào chắn Clef: `3.000 ms`
  - Tìm kiếm Vectorize RAG: `2.000 ms`
  - Gọi LLM tối đa: `10.000 ms`
- **Hạn mức sử dụng (Quotas)**:
  - Hạn mức mỗi hồ sơ: Mặc định `50 lượt/ngày` (giờ Việt Nam, đếm bằng Cloudflare D1)
  - Trần bảo vệ toàn hệ thống: `500 lượt/ngày` (chống vượt ngân sách API)
  - Giữ chỗ nguyên tử (`giuLuot`): Chỉ chốt trừ lượt khi phản hồi thành công; trả lại lượt khi xảy ra lỗi.

### Rào chắn chống ảo giác:
- Hàm `soLieuLech(phanHoi, duLieuGoc)` trích xuất toàn bộ con số sinh ra trong câu trả lời của LLM; nếu xuất hiện số liệu điểm hoặc học phí không tồn tại trong danh mục dữ liệu gửi kèm, phản hồi bị hủy ngay lập tức và trả mã lỗi `so-lieu-khong-khop`.

---

## 8. Bằng chứng Thực thi Kiểm thử Tự động (Test Execution Logs)

Toàn bộ các lệnh sau đã được thực thi và kiểm chứng thành công trên hệ thống:

### 1. Kiểm tra Typecheck và Kiểm tra Quy tắc Đồng nhất:
```powershell
> npm run typecheck
tsc --noEmit
# Result: Exit Code 0 (No type errors)

> npm run kiem-tra
tsx tests/bo-dong-bo-rong.test.ts && tsx tests/kiem-tra-route.ts
bo-dong-bo-rong: ok
Kiểm tra đồng nhất: tất cả đều qua (34 route, 15 slice).
```

### 2. Bộ kiểm thử Tích hợp Năng lực & Hợp đồng MCP:
```powershell
> npm run test:capabilities
capabilities: strict inputs, null scores, priority calculation, provenance, scoped snapshot and deterministic recommendations passed
study-progress: snapshot, explicit confirmation, stale-state rejection and idempotency pass
capabilities-api: HTTP/capability/MCP parity, score bounds, nulls, JSON privacy, byte limit and majors pagination passed

> npm run test:mcp
✓ scopes filter discovery and block direct calls
✓ student isolation survives consecutive requests and connection codes
✓ strict schemas reject unknown fields, string numbers and malformed nested data
✓ public resources and prompts are bounded metadata without snapshots
✓ progress is a deduplicated pending proposal and never changes the snapshot
✓ transport rejects untrusted origins, unsupported protocol, batch, malformed and oversized bodies
✓ revoked connections invalidate existing OAuth credentials
mcp-contracts: 7 checks passed
```

### 3. Bộ kiểm thử Toàn diện Core Test Suite:
```powershell
> npm test
# Đã thực thi qua 60+ test suites:
# - tests/final-acceptance-fixes.test.ts
# - tests/diem-nghen.test.ts
# - tests/universities-api.test.ts
# - tests/xep-lich.test.ts & xep-lai.test.ts
# - tests/thu-tinh-huong.test.ts
# - tests/du-bao-diem-chuan.test.ts (backtesting 2023, 2024, 2025)
# - tests/toan-bo-chuong-trinh.test.ts (3.648 chương trình x 7 kiểu học sinh = 25.536 lượt không lỗi)
# - tests/e2e-journeys.test.ts (4 hành trình trọn vẹn đạt 100%)
# Result: Exit Code 0 (ALL PASS)
```

---

## 9. Các Tuyên bố Kỹ thuật Bị Loại bỏ khỏi Báo cáo do Chưa đủ Bằng chứng

Để bảo vệ uy tín kỹ thuật của đội ngũ trước Ban giám khảo, các tuyên bố sau đây **tuyệt đối không được đưa vào Proposal chính thức**:

1. **"Hệ thống đã kết nối hoàn chỉnh với ChatGPT Store hoặc Claude Artifacts trên Production"**:
   - *Thực tế*: Mã nguồn máy chủ MCP Streamable HTTP và OAuth 2.0 đã hoàn chỉnh và vượt qua 100% bài kiểm tra cục bộ, nhưng nhóm chưa thực hiện xác thực tài khoản bên ngoài trên môi trường Cloudflare production có gắn kết tên miền công khai của bên thứ ba.
2. **"Mô hình Trí tuệ nhân tạo dự đoán chính xác 100% xác suất đỗ đại học"**:
   - *Thực tế*: Việc phân loại chỉ là Heuristic dựa trên khoảng cách điểm chuẩn các năm trước kèm khoảng bất định thống kê. Điểm chuẩn tương lai phụ thuộc vào độ khó đề thi và phổ điểm thực tế của Bộ GD&ĐT.
3. **"Dữ liệu học phí chính xác tuyệt đối cho tất cả các ngành"**:
   - *Thực tế*: 3.047 chương trình đang dùng đơn giá định mức khối ngành ước tính theo Nghị định 81/2021/NĐ-CP.
