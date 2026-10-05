# Nguyện Vọng AI

Đọc `.agents/AGENTS.md` trước khi làm bất cứ việc gì: cấu trúc thư mục, ai sở hữu slice nào, quy tắc sắt (route, theme, chữ Việt, dữ liệu thật, mobile), bẫy đã gặp, git.

Ngắn gọn:
- Chỉ sửa trong `src/features/<slice>/` của mình. File dùng chung đổi bằng PR riêng.
- Đường dẫn chỉ qua `DUONG_DAN`/`MAU` (`src/duong-dan.ts`). Màu/gradient chỉ qua token theme. Mọi nút phải đi tới đâu đó.
- Thuần Việt, gọi học sinh là "em", không thuật ngữ. Không bịa số liệu.
- Xong việc: `npx tsc --noEmit`, `npm run kiem-tra`, `npm test` đều xanh; đo 390px và 360px bằng `agent-browser`, tối đa 1 ảnh chụp cuối.
- Thêm màn mới: skill `them-man-hinh`. Rà UI trước khi báo xong: skill `kiem-tra-ui`.
