# 01 — EXECUTIVE VERDICT (PHÁN QUYẾT NGHIỆM THU CUỐI CÙNG)

- **Dự án**: Nguyện Vọng AI (`https://nguyenvongai.pages.dev/`)
- **Đợt nghiệm thu**: Final Product Acceptance — 16–17/10/2026
- **Baseline Tag**: `pre-final-acceptance-2026-10-16` (`f1ad9d7`) · Protected Landing Tag: `landing-approved-2026-10-07` (nguyên vẹn 100%, `0 lines diff`)
- **Phán quyết tổng thể**: **`RELEASE READY`** *(Sẵn sàng cho buổi thuyết trình 17/10/2026 & phát hành công khai với phạm vi Local-First + OAuth 2.1/MCP + Grounded AI)*

---

## 1. Tóm tắt giá trị thực cho học sinh (Student Value Proposition)

Sau khi kiểm thử thực tế trên trình duyệt thật (Chrome) với 5 chân dung người dùng (Lớp 11, Lớp 12 chưa có điểm thi, Học sinh đã có điểm thi, Học sinh ngân sách hạn chế, và Người dùng quay lại sau nhiều ngày), **Nguyện Vọng AI** chứng minh giải quyết trọn vẹn 4 bài toán cốt lõi mà cổng tra cứu tĩnh và chatbot chung không làm được:

1. **"Mình đang ở đâu?"**: Tính đúng điểm xét tuyển cho từng tổ hợp trong **73 tổ hợp chính thức**, tự động cộng **điểm ưu tiên khu vực/đối tượng giảm tuyến tính từ mốc 22,5 điểm** theo đúng Quy chế tuyển sinh của Bộ GD&ĐT (`((30 - tổng3) / 7,5) × mứcƯuTiên`), hỗ trợ song song điểm học bạ, điểm thi thử và điểm ĐGNL/ĐGTD.
2. **"Muốn đi tới đâu?"**: Khám phá **3.648 chương trình đào tạo** tại **118 trường đại học** trên **34 tỉnh/thành (sau sáp nhập)**, lọc theo ngân sách gia đình (`≤ 15`, `20`, `30`, `40`, `60` triệu/năm), khu vực và nhóm ngành, kèm đường dẫn tới đề án tuyển sinh PDF chính thức (cho 52/118 trường có PDF nối trang và 66/118 trường từ bảng điểm đối chiếu).
3. **"Còn cách bao xa & Rủi ro ở đâu?"**: Gắn 4 nhãn cố định (**Thử sức · Vừa sức · An toàn · Dự phòng**), phát hiện **môn kéo điểm (điểm nghẽn)** trong tổ hợp, và đặc biệt là **phát hiện lỗi nghịch đảo thứ tự nguyện vọng** (đặt ngành dễ đỗ ở NV1 làm mất cơ hội xét ngành mơ ước ở NV2) kèm nút chỉnh thứ tự tự động 1 chạm.
4. **"Hôm nay làm gì?"**: Chuyển khoảng cách điểm thành **kế hoạch tự học từng tuần** (ưu tiên môn có lợi suất tăng điểm cao nhất), xếp vào giờ trống thực tế của học sinh, xuất file `.ics` / Google Calendar và lưu tiến độ bền vững trên thiết bị.

---

## 2. Kết quả vượt 10 Cổng chất lượng (Quality Gates G1–G10)

| Gate | Hạng mục kiểm định | Tiêu chí | Kết quả thực tế | Bằng chứng | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **G1** | TypeScript, Lint & Build | `tsc --noEmit`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run cms:build` | `0` lỗi TS, `34` routes / `15` slices đồng nhất, `64/64` bộ test PASS, build `dist/` thành công | `tests/final-acceptance-fixes.test.ts` | **PASS** |
| **G2** | 5 Chân dung người dùng (E2E) | Chạy trình duyệt thật qua 5 Personas A, B, C, D, E | 5/5 Personas hoàn thành luồng, `0` lỗi console/network, đã triệt tiêu lỗi `"undefined%"` và nút đè ở `/bat-dau/1` | `evidence/personas/REPORT.md` + 56 ảnh PNG | **PASS** |
| **G3** | Độ chính xác Tuyển sinh | Kiểm toán 3.648 chương trình, 118 trường, 33 mẫu phân tầng, 8 Golden Tests | 3.648 chương trình, 118 trường khớp 100%; 8/8 nhóm Golden Test PASS; đã sửa lỗi cộng ưu tiên 2 lần (`P0-01`) | `evidence/admissions/admissions-audit.json` | **PASS** |
| **G4** | AI Chatbot (42 câu hỏi) | Kiểm tra ≥ 40 câu hỏi tái lập qua 11 nhóm & pipeline Rules -> Cache -> RAG -> LLM | **42/42 câu PASS** (11 nhóm), `0` bịa số, chặn Prompt Injection 100%, đã sửa lỗi nhầm tên ngành CNTT với trường QSC (`P1-04`) | `evidence/ai-evaluation/chatbot-42-results.json` | **PASS** |
| **G5** | Backend, OAuth 2.1, MCP | Smoke test & OAuth 2.1 PKCE E2E trên production | `smoke.mjs` **13/13 PASS**, `oauth-e2e.mjs` **17/17 PASS**, D1 migration `0011` hoạt động, đã sửa alias MCP (`P2-01`) | `docs/final-acceptance-2026-10-17/06-production-security.md` | **PASS** |
| **G6** | Mobile UX & Accessibility | Quét 6 viewports (`320` -> `1366px`) × 25 màn hình = 150 tổ hợp + Empty/Modal/Input | **150/150 tổ hợp `0px` tràn ngang**, đã ẩn nút Chatbot nổi ở `/bat-dau/*` và xóa toàn bộ `backdrop-blur` | `evidence/mobile-ux/viewport-audit.json` + 155 ảnh PNG | **PASS** |
| **G7** | Không dữ liệu giả / Không cam kết ảo | Không bịa số người dùng, không gọi điểm phù hợp là xác suất cam kết đậu | Mọi ước lượng `%` đều ghi rõ *"Ước lượng tham khảo từ biến động điểm chuẩn lịch sử (không phải cam kết đậu)"* | `src/features/kham-pha/chi-tiet.tsx`, `chan-doan-danh-muc.tsx` | **PASS** |
| **G8** | Bảo toàn Landing Page đã khóa | Không chạm vào `src/features/landing-page/`, `src/styles/landing.css`, `public/landing/` | `git diff landing-approved-2026-10-07` trên các đường dẫn bảo vệ = **0 thay đổi** | Git tag `landing-approved-2026-10-07` | **PASS** |
| **G9** | Tài liệu thuyết trình & Slide | 14 slide chuẩn bố cục, số liệu khớp 100% với code, có bản PDF offline | 14 slide render `0` lỗi tràn khung, xuất thành công `NguyenvongAI-Slides-Offline.pdf` | `slides/screenshots/` & `evidence/presentation/NguyenvongAI-Slides-Offline.pdf` | **PASS** |
| **G10** | Gói dự phòng Offline (Zero-WiFi) | Video MP4 100–120s, 10 ảnh hành trình, ảnh trước/sau, 20 câu hỏi BGK | Video `nguyenvongai-demo-offline.mp4` (110s, HD 1280×720), 10 ảnh journey, 7 ảnh before/after, 20 Q&A | `evidence/presentation/` & `evidence/before-after/` | **PASS** |

---

## 3. Các lỗi nghiêm trọng đã phát hiện và khắc phục triệt để trong đợt nghiệm thu

1. **`[P0-01 · ĐÃ SỬA]` Cộng điểm ưu tiên 2 lần trong thẻ Xác suất (`/kham-pha/:id`) và Chẩn đoán danh mục (`/nguyen-vong`)**:
   - **Nguyên nhân**: `tongChoLuaChon(lc, diem)` đã cộng điểm ưu tiên giảm dần vào `tong`, nhưng `chi-tiet.tsx` và `toi-uu-nguyen-vong.ts` lại truyền tiếp `uuTienTuyenSinh` vào `tinhXacSuatTrungTuyen`, làm điểm ưu tiên bị cộng lần thứ hai.
   - **Khắc phục**: Chuẩn hóa điểm ưu tiên một lần duy nhất qua `tongChoLuaChon` và truyền `diemXet` đã cộng vào `tinhXacSuatTrungTuyen(diemXet, lc)`. Kiểm chứng bằng regression test tại `tests/final-acceptance-fixes.test.ts`.
2. **`[P1-01 · ĐÃ SỬA]` Hiển thị `"xác suất undefined%"` khi danh sách có nguyện vọng thiếu môn tổ hợp**:
   - **Nguyên nhân**: Trong `danhGiaDanhMucToanDien` (`src/engine/toi-uu-nguyen-vong.ts`), khi một nguyện vọng có `thongSo === null` (ví dụ ngành xét B00 nhưng học sinh chưa nhập môn Sinh), phép gán `nvSau.thongSo?.xacSuat ?? 0.5` kích hoạt cảnh báo nghịch đảo và nội suy `${nvSau.thongSo?.phanTram}%` thành `"undefined%"`.
   - **Khắc phục**: Bỏ qua các nguyện vọng chưa đủ điểm tổ hợp (`!thongSo`) khi kiểm tra nghịch đảo và gán `pDocLap = 0` thay vì `0.5`.
3. **`[P1-02 · ĐÃ SỬA]` Đồng nhất bộ đếm cơ cấu 3 tầng và nhãn ước lượng tham khảo**:
   - **Khắc phục**: Đồng bộ `coCau` trong `toi-uu-nguyen-vong.ts` với hàm `nhanChoLuaChon`, Việt hóa toàn bộ thuật ngữ tiếng Anh (`Decision Intelligence`, `Knapsack & Portfolio Theory`) trong `chan-doan-danh-muc.tsx` và ghi rõ chú thích tham khảo lịch sử.
4. **`[P1-03 · ĐÃ SỬA]` Nút tròn Trợ lý AI nổi (`NutTroLyAI`) đè lên nút `"Tiếp tục"` ở màn `/bat-dau/1..3`**:
   - **Khắc phục**: Ẩn `NutTroLyAI` trên các đường dẫn `/bat-dau*` trong `src/features/tu-van/tro-ly-noi-bot.tsx` và cập nhật `MOCK_STATE` trong `scripts/chay-preview-server.mjs` sang mã chương trình thật.
5. **`[P1-04 · ĐÃ SỬA]` Chatbot hiểu nhầm tên ngành `"Công nghệ thông tin"` thành trường ĐH CNTT (`QSC`)**:
   - **Khắc phục**: Tinh chỉnh `timTruongTrongCau` (`src/features/tu-van/hieu-cau.ts`) và `CUM_TU_TRUONG` (`src/features/tu-van/lay-du-lieu.ts`) để chỉ nhận diện `"công nghệ thông tin"` là trường `QSC` khi có từ chỉ trường (`trường`, `đh`, `đại học`) đứng trước, đồng thời không cộng nhầm điểm ưu tiên cho `BKA` khi câu hỏi nêu rõ `Bách khoa TP.HCM` (`QSB`) hoặc `Bách khoa Đà Nẵng` (`DDK`).
6. **`[P2-01..06 · ĐÃ SỬA]` Các tinh chỉnh hoàn thiện**:
   - Hỗ trợ gọi alias MCP `get_student_profile` & `get_study_plan` trong `functions/mcp/[ma].ts`.
   - Mở nút `"Tạo lịch ôn nền tảng"` tại `/ke-hoach/tuan` cho học sinh lớp 11 chưa chọn trường mục tiêu (`src/features/ke-hoach/che-do-viec.tsx`).
   - Xóa `backdrop-blur` còn sót tại `src/features/tu-van/tu-van.tsx` và `src/components/ui/hien-thi.tsx`.

---

## 4. Những giới hạn trung thực cần nêu rõ với Ban Giám Khảo

1. **Dữ liệu điểm chuẩn năm 2026**: Kỳ thi THPT 2026 diễn ra vào tháng 6/2026 nên chưa có điểm chuẩn chính thức năm 2026. Toàn bộ 3.648 chương trình đang sử dụng điểm chuẩn chính thức đến năm **2025** và chuỗi lịch sử **2022–2025** để tính khoảng dự báo tham khảo (Backtest leave-one-year-out đạt độ phủ 89% năm 2023, 95% năm 2024, và 64% năm 2025 do biến động quy chế).
2. **Độ phủ văn bản học phí chính thức**: Hiện có **602 / 3.648 chương trình (16,5%)** có link văn bản học phí chính thức của trường; **3.005 chương trình (82,4%)** sử dụng mức ước tính theo khối ngành/nhóm trường và luôn gắn nhãn rõ `"ước tính"`; **41 chương trình (1,1%)** miễn học phí hoặc chưa công bố được ghi rõ `"Chưa có dữ liệu"`.
3. **Trạng thái kết nối MCP & OAuth 2.1**: Đã triển khai đầy đủ trên Cloudflare Pages Functions + D1 (`migrations/0011_oauth_mcp.sql`) và vượt qua **17/17 bài kiểm thử E2E trên production** (`Protocol-level & Production Endpoint Verified`), nhưng chưa kết nối trực tiếp vào giao diện thương mại của Claude Desktop/Web hay ChatGPT Connectors do cần đăng ký ứng dụng đối tác.
4. **Kiến trúc Local-First**: Hồ sơ học sinh được lưu mặc định trên thiết bị (`localStorage`) kèm xuất/nhập tệp sao lưu `.json` và liên kết chia sẻ đồng hành; hệ thống chưa bắt buộc tạo tài khoản đám mây đồng bộ đa thiết bị.
