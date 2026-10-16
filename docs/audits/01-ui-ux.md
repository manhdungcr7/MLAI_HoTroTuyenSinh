# 01 — Audit UI/UX và responsive

Ngày: 2026-10-16
Người thực hiện: Agent 1 — UI/UX Forensic Auditor

## Phạm vi và cách kiểm tra

Kiểm tra giao diện trình duyệt thật ở `http://127.0.0.1:8790` với hồ sơ mẫu đã được tạo bởi `scripts/agent-native-browser-fixture.ts`. Chạy `docs/audits/evidence/ui/audit-ui.mjs` qua Puppeteer trên sáu kích thước: 320×720, 375×812, 390×844, 430×932, 768×1024 và 1440×900.

Ma trận gồm 10 route, 60 lượt render: `/chao`, `/bat-dau/1`, `/bat-dau/2`, `/bat-dau/3`, `/nguyen-vong`, `/tu-van`, `/ho-so/chia-se`, `/kham-pha`, `/kham-pha/bo-loc`, `/kham-pha/qsc-24737475`. Route chi tiết được mở từ thẻ chương trình đầu tiên của catalog; danh sách rỗng được kiểm tra riêng. Landing `/gioi-thieu` không được chỉnh sửa.

## Kết quả

- 0/60 lượt có cuộn ngang; không có ảnh lỗi, lỗi console, lỗi trang hay request thất bại trên Pages local trong lượt baseline.
- Các thẻ Khám phá và chi tiết vẫn đọc được ở 320px; tên trường đầy đủ xuất hiện trong nội dung, không chỉ có mã trường. Mã trường ở huy hiệu là phần nhận diện phụ.
- Chia sẻ hồ sơ và tư vấn không tạo tràn ngang ở sáu kích thước. Chatbot không gửi câu hỏi trong audit này; chất lượng API/AI thuộc kiểm tra của Agent 3/5.
- Trên Vite dev (`3030`), các lần tải manifest và snapshot trả HTTP 502; có 20 mục lỗi console/network trong báo cáo dev riêng. Không dùng các lỗi này làm kết luận về giao diện Pages local. Bằng chứng: [metrics Vite dev](evidence/ui/vite-dev-3030/metrics.json).

## Findings và sửa lỗi

| ID | Severity | Route / viewport | Tái hiện, nguyên nhân | Sửa và bằng chứng | Trạng thái |
|---|---|---|---|---|---|
| UI-01 | P2 | `/bat-dau/2`, 320–1440px | Sáu ô điểm môn chính cao 33px, thấp hơn vùng chạm 44px; CSS input chỉ đặt chiều rộng và cỡ chữ. | Thêm `min-h-11` vào input ở `src/features/khoi-dau/buoc-2.tsx`. Sau sửa, đo trình duyệt thật tại 320px: cả sáu input cao 44px. Ảnh trước: [320](evidence/ui/pages-local-8790/320-bat-dau_2.png); ảnh sau: [320](evidence/ui/vite-dev-3030-after/320-bat-dau_2.png). | Đã sửa; typecheck và đo DOM sau sửa đạt. Ảnh sau dùng Vite dev, chưa chạy lại trên bundle Pages do Agent 5 đang dùng cổng 8790. |
| UI-02 | P2 | `/nguyen-vong`, 320–1440px | Hai nút “Gợi ý danh mục thông minh” và “Chi tiết” cao 40px. | Tăng `min-h-10` lên `min-h-11` trong `src/features/nguyen-vong/chan-doan-danh-muc.tsx`. Ảnh trước: [320](evidence/ui/pages-local-8790/320-nguyen-vong.png). | Đã sửa; `typecheck` đạt. Chưa chụp lại trên bundle Pages vì Agent 5 đang capture. |
| UI-03 | P2 | `/kham-pha/:id`, 320px | Nút “Báo số liệu sai” cao 18px khi phần nguồn được mở cuộn tới. | Thêm `min-h-11` và nâng chữ 12px lên 13px trong `src/features/kham-pha/bao-sai-sheet.tsx`. Sau sửa, đo nút cao 44px. Ảnh sau: [chi tiết 320](evidence/ui/vite-dev-3030-after/320-detail.png). | Đã sửa; typecheck và đo DOM sau sửa đạt. |
| UI-04 | P2 | Các route có thanh điều hướng, 320px | Nhãn tab “Nguyện vọng” rộng nội dung 67px nhưng vùng nhãn 64px (đo DOM); có thể mất vài pixel cuối. | Nguồn là thanh điều hướng dùng chung tại `src/components/layout/khung.tsx` và `src/duong-dan.ts`. Agent 1 không sửa component dùng chung theo phân quyền. Ảnh: [nguyện vọng 320](evidence/ui/pages-local-8790/320-nguyen-vong.png). | Cần chuyển chủ sở hữu shared layout xử lý/đánh giá. |

## Giới hạn kiểm tra sau sửa

Pages local đang được Agent 5 dùng cho E2E; theo điều phối, không dừng hoặc build lại instance khi họ đang capture. Vì vậy UI-01 và UI-03 đã được đo trực tiếp trên Vite HMR sau sửa, còn UI-02 mới có kiểm tra TypeScript và diff CSS. Cần chạy lại ảnh sau sửa trên Pages local sau khi Agent 5 xác nhận hoàn tất. Không submit câu hỏi AI; endpoint/response do Agent 3/5 kiểm tra riêng.

## Lệnh và kết quả

- `node docs/audits/evidence/ui/audit-ui.mjs` với `NV_BROWSER_URL=http://127.0.0.1:8790`: PASS, 60 lượt, 0 lỗi runtime/network.
- `npm run typecheck`: PASS.
- `npm run kiem-tra`: PASS (34 route, 15 slice).
- `git diff --check -- src/features/khoi-dau/buoc-2.tsx src/features/nguyen-vong/chan-doan-danh-muc.tsx src/features/kham-pha/bao-sai-sheet.tsx`: PASS.
