# Báo cáo sẵn sàng nộp bài — Nguyện Vọng AI

Ngày: 16/10/2026 · Nhánh: `feat/agent-native-mcp` · Baseline: `a03b257`.

## Kết luận

**Chưa khuyến nghị coi đây là bản nộp production-ready.** Artefact proposal và video đã sẵn sàng để review hackathon, các cổng TypeScript/test/build đều đạt, nhưng còn một P1 chưa có nguyên nhân gốc: hành trình browser có thể dừng ở trạng thái tải sau khi lưu sáu nguyện vọng. Runtime local cũng không có AI provider, nên chatbot thật và connector MCP bên ngoài chưa được xác minh.

## Issue audit

- Ghi nhận: 12 issue trong `docs/audits/MASTER-ISSUES.md`.
- Đã sửa và có kiểm tra: `SEC-001` (scope MCP), `AI-001` (opt-out hồ sơ trong tư vấn), `COPY-006` đến `COPY-009` (proposal), `UI-001` đến `UI-004` (vùng chạm và nhãn tab; browser rerun cuối chưa hoàn tất).
- Còn mở: `E2E-001` P1 race/loading sau khi lưu danh sách; `DATA-001` P2 provenance/học phí; UI rerun Pages local sau build bị timeout ở harness nên không được tính là đạt.

## Kết quả kiểm tra thực tế

| Hạng mục | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run kiem-tra` | PASS — 34 route, 15 slice |
| `npm test` | PASS — có `tests/tu-van-privacy.test.ts` mới |
| `npm run build` | PASS — cảnh báo chunk `du-lieu-that` 1,36 MB |
| `npm run build:functions` | PASS |
| `npm run cms:build` | PASS |
| `npm run test:mcp` | PASS trong audit MCP local |
| `npm run test:capabilities` | PASS trong audit logic local |
| `npm run data:audit` | PASS; giới hạn provenance được ghi tại `02-logic-data.md` |
| UI baseline Pages local | 60 lượt, 6 viewport, 0 overflow/runtime/network error trước sửa UI |
| `NV_BROWSER_URL=http://127.0.0.1:8790 npm run test:browser` | PASS — 156 page/viewport, 5 journey checks, 0 error, 48 touch-target warning; không submit chat/API |

`AI-001` được regression bằng `tests/tu-van-privacy.test.ts`: bỏ chọn hồ sơ gửi `hoSo: null`, không gửi lịch sử chat cá nhân hay score/nhãn suy ra, và fallback không dùng state riêng.

## AI, MCP và dữ liệu

- MCP/OAuth local có bằng chứng discovery, schema, scope, pending write proposal và regression legacy scope ở `03-ai-mcp.md`.
- Bộ 50 case AI ở `docs/audits/evidence/ai-eval.jsonl` chưa chạy qua provider vì môi trường audit thiếu binding/credentials. Không có factuality, latency hay cost model để báo cáo.
- Snapshot có 118 trường, 3.648 chương trình; 56 thiếu URL nguồn chính, 2.162 thiếu nguồn theo năm, 93 tổ hợp chưa được engine hỗ trợ và 3.047 mức học phí được gắn cờ ước tính. Không tuyên bố xác minh độc lập hay độ phủ toàn quốc.

## Browser E2E và video

- Browser harness trên Pages local xác nhận năm journey checks trên 156 page/viewport, gồm luồng không có điểm lớp 11, tìm BKA/thêm/đổi thứ tự/tải lại, chat composer không gửi request, empty state trường không rõ và năm nguyện vọng ở 320px. Không có browser/network error; 48 touch-target warning cần rà tiếp. Bằng chứng từng scene demo nằm trong `demo/assets/`.
- Hai lượt E2E mới nhất tái hiện dừng sau “Lưu cả 6 ngành”, ở “Đang tải dữ liệu chương trình…” quá 10 giây, không có console error, HTTP error hay failed request. Do đó không khẳng định một run liên tục đã đạt toàn bộ 10 bước.
- Video `demo/final/nguyen-vong-ai-demo.mp4` được dựng từ màn hình app local/synthetic đã chụp thật, không có chatbot/AI, không có audio và không chứa URL chia sẻ/payload. `ffprobe`: H.264, 1920×1080, 30fps, 115 giây. Frame 2s, 56s và 109s đã được kiểm trong `demo/assets/video-check-*.png`.

## Artefact nộp bài

- [Proposal](NGUYEN-VONG-AI-PROPOSAL.md)
- [Engineering evidence](ENGINEERING-EVIDENCE.md)
- [Master issues](../audits/MASTER-ISSUES.md)
- [UI audit](../audits/01-ui-ux.md), [logic/data audit](../audits/02-logic-data.md), [AI/MCP audit](../audits/03-ai-mcp.md), [content audit](../audits/04-content-copy.md), [E2E/demo audit](../audits/05-e2e-demo.md)
- [Storyboard](../../demo/storyboard.md)
- [Video MP4](../../demo/final/nguyen-vong-ai-demo.mp4)

## Điều kiện để nâng khuyến nghị nộp

1. Tái hiện `E2E-001` có trace, sửa nguyên nhân trạng thái tải và chạy lại một browser journey liên tục trên bundle mới.
2. Chạy lại browser matrix sau các sửa UI, gồm 320px và trạng thái opt-out tư vấn.
3. Cấu hình provider an toàn rồi chạy 50 case AI; lưu answer/tool/latency/cost thật.
4. Đối chiếu nguồn theo trường, chương trình, năm và phương thức trước khi nâng claim dữ liệu.
