# Landing page đã duyệt — không tự ý sửa

Bản được người dùng duyệt ngày 2026-10-07: `landing-approved-2026-10-07`.

Trang chạy tại `/#/gioi-thieu`. Source gốc đã được khôi phục từ lịch sử phiên làm việc: `reference-landing.tsx`, `landing-fixtures.ts`, `landing.css` và ảnh trong `public/landing/`.

Chỉ sửa khi người dùng yêu cầu rõ ràng đối với landing page này. Không tự thay bố cục, nội dung, CSS, ảnh hoặc route khi làm tính năng khác. Quy tắc đầy đủ nằm trong `AGENTS.md` ở root.

## Xem lại bản đã ghim

```powershell
git show landing-approved-2026-10-07
git diff landing-approved-2026-10-07 -- src/features/landing-page src/styles/landing.css public/landing
```

## Khôi phục khi được yêu cầu

Sao lưu thay đổi hiện tại trước khi chạy:

```powershell
git restore --source=landing-approved-2026-10-07 -- src/features/landing-page src/styles/landing.css public/landing
```

Các file landing được đặt thuộc tính ReadOnly trên máy hiện tại để tránh sửa nhầm. Thuộc tính này không được Git đồng bộ. Khi người dùng đã cho phép sửa, gỡ ReadOnly đúng file cần sửa rồi bật lại sau khi hoàn tất. `AGENTS.md` và tag là mốc bảo vệ được chia sẻ qua Git; đây không phải cơ chế phân quyền máy chủ.
