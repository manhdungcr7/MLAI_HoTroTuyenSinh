# 13 — EVIDENCE INDEX (MASTER VERIFICATION MANIFEST)

Tài liệu này là mục lục tổng hợp toàn bộ **bằng chứng thực tế** đã được tạo và kiểm chứng trong đợt **Final Product Acceptance — Nguyện Vọng AI (17/10/2026)**. Mọi đường dẫn dưới đây đều trỏ tới các tệp có thật trong repository, không có bất kỳ đường dẫn giả định hay dữ liệu mô phỏng nào.

---

## 1. Bộ 14 Báo cáo Nghiệm thu Chính thức (`docs/final-acceptance-2026-10-17/`)

| STT | Tệp báo cáo | Nội dung kiểm chứng |
|---|---|---|
| 01 | [`01-executive-verdict.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/01-executive-verdict.md) | Kết luận tổng thể (`RELEASE READY`), trả lời 7 câu hỏi cốt lõi và bảng tóm tắt các thành phần. |
| 02 | [`02-feature-inventory.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/02-feature-inventory.md) | Kiểm kê toàn bộ **34 routes**, **15 feature slices**, **9 công cụ MCP** và trạng thái hoạt động thực tế (Local vs Edge/D1). |
| 03 | [`03-user-journeys.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/03-user-journeys.md) | Báo cáo kiểm thử E2E trên trình duyệt thật cho **5 Chân dung người dùng (Personas A, B, C, D, E)**. |
| 04 | [`04-admissions-accuracy.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/04-admissions-accuracy.md) | Kiểm toán **3.648 chương trình**, **118 trường**, **33 mẫu phân tầng**, **8 Golden Tests** và ranh giới Tất định vs Quy tắc vs AI. |
| 05 | [`05-ai-evaluation.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/05-ai-evaluation.md) | Đánh giá **42 câu hỏi AI Chatbot** qua 11 nhóm nghiệp vụ, tiếng Việt không dấu, viết tắt và chống Prompt Injection (**42/42 PASS**). |
| 06 | [`06-production-security.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/06-production-security.md) | Kiểm toán REST API, D1 migrations (`0001..0011`), KV bindings, Rate Limiting, **OAuth 2.1 PKCE (17/17 E2E)** và **MCP (`2025-03-26`)**. |
| 07 | [`07-mobile-ux.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/07-mobile-ux.md) | Kiểm toán giao diện trên **6 viewports** (`320px` đến `1366px`), `0` lỗi tràn ngang trên **155 ảnh chụp**. |
| 08 | [`08-defects-and-fixes.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/08-defects-and-fixes.md) | Nhật ký phát hiện và sửa phẫu thuật **11 lỗi** (`P0-01`, `P1-01..04`, `P2-01..06`) kèm dòng code và bài test hồi quy. |
| 09 | [`09-release-readiness.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/09-release-readiness.md) | Kết quả 4 cổng chất lượng (`tsc`, `kiem-tra`, `vitest`, `build`), kiểm tra khóa bảo vệ Landing Page và đánh giá sẵn sàng phát hành. |
| 10 | [`10-presentation-script.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/10-presentation-script.md) | Kịch bản thuyết trình **10 phút** chia theo 7 khối thời gian và 14 slides. |
| 11 | [`11-judge-questions.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/11-judge-questions.md) | Bộ **20 câu hỏi phản biện Ban Giám khảo** (12 câu bắt buộc + 8 câu chuyên sâu) kèm bằng chứng và giới hạn trung thực. |
| 12 | [`12-demo-storyboard.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/12-demo-storyboard.md) | Storyboard chi tiết theo từng giây cho Video Demo Offline `115s` và bộ 10 ảnh dự phòng. |
| 13 | [`13-evidence-index.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/13-evidence-index.md) | Mục lục tổng hợp toàn bộ bằng chứng trong `evidence/`, `slides/` và `tests/`. |
| 14 | [`14-post-presentation-roadmap.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/docs/final-acceptance-2026-10-17/14-post-presentation-roadmap.md) | Lộ trình phát triển thực tế sau ngày 17/10/2026 hướng tới mùa tuyển sinh 2026–2027. |

---

## 2. Gói Thuyết trình & Demo Offline (`evidence/presentation/` & `slides/`)

| Hạng mục | Đường dẫn tệp thực tế | Thông số / Bằng chứng |
|---|---|---|
| **Video Demo Offline (MP4)** | [`evidence/presentation/nguyenvongai-demo-offline.mp4`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/nguyenvongai-demo-offline.mp4) | `115.0s`, `1280×720` HD H.264, `25 fps`, `0.70 MB` (`738,243 bytes`), bao phủ đủ 7 phân đoạn hành trình người dùng thật. |
| **Slide Thuyết trình Offline (PDF)** | [`evidence/presentation/NguyenvongAI-Slides-Offline.pdf`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/presentation/NguyenvongAI-Slides-Offline.pdf) | `14 trang` khổ ngang `16:9`, xuất từ `slides/thuyet-trinh.html` sau khi đồng bộ toàn bộ số liệu kiểm toán (`1.80 MB`). |
| **Slide Thuyết trình Web (`/thuyetrinh`)** | [`slides/thuyet-trinh.html`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/slides/thuyet-trinh.html) | 14 slides HTML tương tác, đã qua kiểm tra tự động `node slides/qa.mjs` (**0 lỗi tràn khung, 0 lỗi chồng chữ**). |
| **Ảnh chụp từng Slide (14 PNGs + Contact Sheet)** | [`slides/screenshots/contact-sheet.png`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/slides/screenshots/contact-sheet.png) | Bao gồm `slide-01.png` đến `slide-14.png` tại `slides/screenshots/`. |
| **Bộ 10 Ảnh Hành trình Dự phòng** | `evidence/presentation/10-step-journey/step-01..10-*.png` | 10 ảnh chụp độ phân giải cao cho từng bước từ `/chao` → `/bat-dau` → `/kham-pha` → `/nguyen-vong` → `/ke-hoach` → `/tu-van` → `/ho-so/cai-dat`. |

---

## 3. Bằng chứng Kiểm thử 5 Chân dung Người dùng (`evidence/personas/`)

| Hạng mục | Đường dẫn tệp thực tế | Kết quả xác minh |
|---|---|---|
| **Báo cáo JSON tổng hợp 5 Personas** | [`evidence/personas/personas-e2e-report.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/personas-e2e-report.json) | **5/5 Personas PASS** (`0` console errors, `0` network errors). |
| **Báo cáo chi tiết 5 Personas (Markdown)** | [`evidence/personas/REPORT.md`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/REPORT.md) | Ghi rõ Input, Thao tác, Expected vs Actual Output và danh sách ảnh chụp của từng Persona. |
| **Tệp Sao lưu JSON thực tế (Persona E)** | [`evidence/personas/persona-e-backup.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/personas/persona-e-backup.json) | Tệp JSON xuất từ chức năng *Tải bản sao lưu* và dùng để kiểm chứng khôi phục 100% trạng thái sau khi xóa. |
| **56 Ảnh chụp màn hình E2E theo từng bước** | `evidence/personas/persona-a-*.png` .. `persona-e-*.png` + `post-fix-*.png` | Lưu trữ đầy đủ bằng chứng hình ảnh trên cả Production và bản sau khi sửa lỗi. |

---

## 4. Bằng chứng Kiểm toán Dữ liệu & Thuật toán Tuyển sinh (`evidence/admissions/`)

| Hạng mục | Đường dẫn tệp thực tế | Kết quả xác minh |
|---|---|---|
| **Báo cáo Kiểm toán Tuyển sinh (JSON)** | [`evidence/admissions/admissions-audit.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/admissions/admissions-audit.json) | Kiểm toán toàn bộ **3.648 chương trình / 118 trường**, phân loại nguồn xác minh (`3.271` có URL, `377` chờ bổ sung), trạng thái học phí (`602` chính thức, `3.046` ước tính), **33 mẫu phân tầng** và **8 Golden Tests**. |
| **Bộ Kiểm thử Hồi quy Nghiệm thu Cuối** | [`tests/final-acceptance-fixes.test.ts`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/tests/final-acceptance-fixes.test.ts) | 6 bài test chuyên biệt khóa chặt các lỗi `P0-01` (không cộng trùng ưu tiên), `P1-01` (không sinh `undefined%`), `P1-02` (khớp số lượng 4 nhãn) và `P1-04` (nhận diện ngành CNTT & Bách khoa). |

---

## 5. Bằng chứng Kiểm toán AI Chatbot (`evidence/ai-evaluation/`)

| Hạng mục | Đường dẫn tệp thực tế | Kết quả xác minh |
|---|---|---|
| **Kết quả 42 Câu hỏi Kiểm thử Chatbot** | [`evidence/ai-evaluation/chatbot-42-results.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/ai-evaluation/chatbot-42-results.json) | **42/42 câu hỏi PASS (100%)** trải đều 11 nhóm: Tra cứu trường/ngành, Tư vấn theo điểm, Tư vấn theo ngân sách, Thiếu dữ liệu, Tên viết tắt, Tiếng Việt không dấu/sai chính tả, Câu hỏi nhiều ý, Ngoài phạm vi, Giả định sai, Prompt Injection, và Dữ liệu thời gian thực. |

---

## 6. Bằng chứng Kiểm toán Giao diện Mobile & Đa Màn hình (`evidence/mobile-ux/` & `evidence/before-after/`)

| Hạng mục | Đường dẫn tệp thực tế | Kết quả xác minh |
|---|---|---|
| **Báo cáo Quét 6 Viewports (JSON)** | [`evidence/mobile-ux/viewport-audit.json`](file:///D:/07-Competitions-Hackathons/mlai/nguyenvongai/evidence/mobile-ux/viewport-audit.json) | Kiểm tra 6 kích thước màn hình (`320×568`, `360×800`, `375×812`, `390×844`, `430×932`, `1366×768`) × 24 màn hình + trạng thái Empty/Modal/Validation: **0 lỗi tràn ngang (`horizontalOverflowCount: 0`)**. |
| **155 Ảnh chụp Đa Viewport** | `evidence/mobile-ux/vp-*.png` | Bằng chứng thị giác đầy đủ trên mọi kích thước thiết bị. |
| **7 Ảnh Đối chiếu Trước / Sau khi sửa lỗi** | `evidence/before-after/01..04-*.png` | Chứng minh trực quan việc khắc phục triệt để các lỗi `P0-01`, `P1-01`, `P1-03` và `P2-03`. |
