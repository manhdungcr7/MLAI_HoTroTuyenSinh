# Nguyện Vọng AI — Cẩm nang phát triển (CLAUDE & Team)

Đọc kỹ `.agents/AGENTS.md` (SSOT) và `dean.md` trước khi code bất cứ trang nào.

## 🎯 Tư duy phát triển từng trang (Page Engineering Mindset)
1. **Đối chiếu đề án (`dean.md`)**: Trang này trả lời câu hỏi nào (*Mình đang ở đâu? Muốn đi tới đâu? Còn cách bao xa? Hôm nay làm gì?*).
2. **Audit hiện trạng**: Trang đã đáp ứng đủ chưa? Có thiếu tính năng quan trọng hay bị rườm rà thừa thãi không?
3. **Quy trình 3 bước chuẩn**:
   - **Bước 1 — UI Hoàn thiện**: Mobile 390/360px, Light mode solid (không glassmorphism), nút 2-3 từ chia cột gọn, chữ không rớt dòng. Đủ 4 trạng thái (*Có dữ liệu / Trống / Đang tải / Báo lỗi*).
   - **Bước 2 — Frontend & Flow**: State qua `useApp()`, tách bạch dứt điểm Form trắng và Hồ sơ mẫu (không nạp đè dữ liệu demo vào form thật).
   - **Bước 3 — Data Engine & Backend**: Thuật toán TS thuần trong `tinh-toan.ts` / `engine/` (không lẫn React hooks vào core logic), dữ liệu có link kiểm chứng minh bạch, không bịa số.
4. **Code Clean & Lean**: Code tối thiểu giải quyết triệt để vấn đề, không over-engineer, dọn sạch biến mồ côi.

## ⚡ Cổng kiểm tra bắt buộc trước khi báo xong:
`npx tsc --noEmit` && `npm run kiem-tra` && `npm test` && `npm run build`

