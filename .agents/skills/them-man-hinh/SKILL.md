---
name: them-man-hinh
description: Thêm một màn hình mới vào Nguyện Vọng AI đúng chuẩn đồng nhất (route, khung, theme, chữ Việt, trạng thái). Dùng khi được yêu cầu thêm/viết một trang.
---

1. Đọc `.agents/AGENTS.md` và một trang mẫu cùng loại (`features/hanh-trinh/hom-nay.tsx` cho trang gốc tab, `features/nguyen-vong/an-toan.tsx` cho trang con). Mở `/#/thiet-ke` để xem thành phần.
2. Route: thêm mẫu vào `MAU` và hàm dựng vào `DUONG_DAN` trong `src/duong-dan.ts` (báo nhóm, file dùng chung). Đăng ký trong `features/<slice>/routes.tsx` bằng `MAU.xxx` + `trang(() => import("./ten-trang"))`; trang `export default`.
3. Chọn khung: trang gốc tab → `DauTrangChinh`; trang con → `DauTrangCoQuayLai`; thuộc tab Kế hoạch → thêm `ThanhPhuKeHoach`. Nội dung trong `NoiDung`.
4. Viết logic thuần trong `tinh-toan.ts` của slice (không React), giao diện chỉ ghép. Dữ liệu từ `useApp()`/`@/state/chon`.
5. Dùng thành phần có sẵn trước, theme token và `gd-*`/`nen-*`. Không mã màu, không gradient tay.
6. Đủ 4 trạng thái: có dữ liệu, trống (có hành động tiếp), đang tải, lỗi/nhập sai. Chạy được với hồ sơ mẫu và hồ sơ trống (`localStorage.clear()`).
7. Nối mọi nút bằng `DUONG_DAN`; đối chiếu ma trận liên kết ở `docs/HUONG-DAN-SLICE.md`.
8. Chạy `npx tsc --noEmit`, `npm run kiem-tra`, `npm test`; rồi skill `kiem-tra-ui`.
