# 09 — RELEASE READINESS & QUALITY GATES (G1 – G10)

Báo cáo này đánh giá trạng thái sẵn sàng phát hành (Release Readiness) theo 10 cổng chất lượng bắt buộc **G1 – G10**.

---

## 1. Bảng chấm điểm 10 Cổng chất lượng (Quality Gates G1 – G10)

| Gate | Tên cổng kiểm định | Tiêu chí bắt buộc | Kết quả thực tế | Bằng chứng xác minh | Trạng thái |
| :--: | :--- | :--- | :--- | :--- | :--: |
| **G1** | **Build, Typecheck & Conformance Gate** | `npx tsc --noEmit`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run cms:build` đều xanh (`exit code 0`). | `0` lỗi TypeScript, `34` route & `15` slice hợp lệ, `64/64` bộ test tự động PASS, build production thành công. | `tests/final-acceptance-fixes.test.ts` | **PASS** |
| **G2** | **End-to-End 5 Personas Gate** | Chạy thật trên trình duyệt cho cả 5 chân dung (Lớp 11, Lớp 12 chưa thi, Đã có điểm thi, Ngân sách hạn chế, Quay lại sau nhiều ngày). | 5/5 Personas hoàn thành trọn vẹn luồng, lưu và khôi phục dữ liệu đúng 100%, `0` lỗi console/network. | `evidence/personas/REPORT.md` + 56 ảnh PNG | **PASS** |
| **G3** | **Admissions Domain Accuracy Gate** | 3.648 chương trình, 118 trường, 73 tổ hợp, điểm ưu tiên giảm dần từ 22,5, 8 nhóm Golden Test đều đúng. | Khớp 100% số lượng chương trình & trường; 8/8 nhóm Golden Test PASS; đã sửa lỗi cộng ưu tiên 2 lần (`P0-01`). | `evidence/admissions/admissions-audit.json` | **PASS** |
| **G4** | **Grounded AI Chatbot Gate** | Tối thiểu 40 câu hỏi tái lập qua 11 nhóm; kiểm chứng pipeline Rules -> Cache -> RAG -> LLM -> Post-verification. | **42/42 câu hỏi PASS** (đủ 11 nhóm); `0` bịa số; chặn Prompt Injection 100%; sửa dứt điểm lỗi nhầm tên ngành CNTT với trường QSC (`P1-04`). | `evidence/ai-evaluation/chatbot-42-results.json` | **PASS** |
| **G5** | **Backend, OAuth 2.1, MCP & Security Gate** | Kiểm tra thực tế REST API, D1 migrations, KV, Rate limit, OAuth 2.1 PKCE S256, MCP tools, Scope/Tenant isolation. | `smoke.mjs` **13/13 PASS**, `oauth-e2e.mjs` **17/17 PASS** trên production; cô lập `ma_bam`, xoay vòng refresh token, chặn reuse. | `docs/final-acceptance-2026-10-17/06-production-security.md` | **PASS** |
| **G6** | **Mobile UX & Multi-Viewport Gate** | Kiểm tra 6 viewports (`320×568` đến `1366×768`) × ≥20 màn hình; không tràn ngang, không che nút CTA, không glassmorphism. | **150/150 tổ hợp `0px` tràn ngang**; đã ẩn nút Chatbot nổi trên `/bat-dau/*` (`P1-03`) và xóa sạch `backdrop-blur`. | `evidence/mobile-ux/viewport-audit.json` + 155 ảnh PNG | **PASS** |
| **G7** | **Truthfulness & No-Fake-Data Gate** | Không mock data giả trong production, không bịa số người dùng, không trình bày `%` chưa hiệu chuẩn như cam kết đậu. | Mọi số thiếu đều ghi `"Chưa có dữ liệu"`, học phí suy diễn ghi `"ước tính"`, xác suất ghi rõ *"Ước lượng tham khảo từ biến động điểm chuẩn lịch sử"*. | `src/features/kham-pha/chi-tiet.tsx`, `chan-doan-danh-muc.tsx` | **PASS** |
| **G8** | **Protected Landing Page Gate** | Không chạm vào `src/features/landing-page/`, `src/styles/landing.css`, `public/landing/` và tag `landing-approved-2026-10-07`. | `git diff landing-approved-2026-10-07 -- src/features/landing-page src/styles/landing.css public/landing` = **0 dòng thay đổi**. | Git tag `landing-approved-2026-10-07` | **PASS** |
| **G9** | **Presentation Deck & Narrative Gate** | 14 slide tại `/thuyetrinh` đúng số liệu, rõ thông điệp Decision Intelligence, không tràn chữ, có PDF offline. | 14/14 slide render sạch ở `1920×1080` và `1366×768`, xuất thành công `NguyenvongAI-Slides-Offline.pdf`. | `slides/screenshots/` & `evidence/presentation/NguyenvongAI-Slides-Offline.pdf` | **PASS** |
| **G10** | **Zero-WiFi Offline Backup Pack Gate** | Có video MP4 100–120s quay từ giao diện thật, 10 ảnh hành trình, ảnh trước/sau, 20 câu hỏi phản biện BGK. | Đã đóng gói `nguyenvongai-demo-offline.mp4` (`115s`, `1280×720`), 10 ảnh journey, 7 ảnh before/after và 20 câu hỏi BGK. | `evidence/presentation/` & `evidence/before-after/` | **PASS** |

---

## 2. Quy trình Triển khai An toàn (Safe Deployment & Rollback Plan)

1. **Nguyên tắc kỷ luật**:
   - Toàn bộ bản vá lỗi P0/P1/P2 và gói bằng chứng đã được kiểm tra xanh 100% ở local và lưu commit sạch.
   - **Không tự động đẩy (`deploy`) lên Cloudflare Pages production khi chưa có lệnh phê duyệt trực tiếp từ người có thẩm quyền**.
2. **Khi được phê duyệt triển khai lên Production**:
   - Bước 1: Chạy `npm run build` (tự động copy `slides/` sang `dist/thuyetrinh/`).
   - Bước 2: Triển khai gói `dist/` và `functions/` lên Cloudflare Pages (`nguyenvongai`). Không cần chạy migration D1 mới vì `0011_oauth_mcp.sql` đã có mặt và hoạt động trên production.
   - Bước 3: Chạy ngay `node scripts/verify-runtime/smoke.mjs` và `node scripts/verify-runtime/oauth-e2e.mjs` để xác nhận `13/13` và `17/17` PASS sau deploy.
3. **Phương án Khôi phục (Rollback)**:
   - Tag khôi phục trước nghiệm thu: `pre-final-acceptance-2026-10-16` (`f1ad9d7`).
   - Tag khôi phục Landing Page: `landing-approved-2026-10-07`.
   - Trên Cloudflare Pages Dashboard: Có thể rollback tức thì về bản deployment liền trước chỉ với 1 cú nhấp chuột (0 downtime, không ảnh hưởng dữ liệu D1).
