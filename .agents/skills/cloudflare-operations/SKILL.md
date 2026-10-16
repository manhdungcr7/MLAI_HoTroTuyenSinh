---
name: cloudflare-operations
description: Run safe local Cloudflare Pages, inspect bindings and prepare staging deployment or rollback for this app.
---

App dùng Pages Functions, không phải một Worker riêng. Đọc `wrangler.jsonc`, `scripts/pages-local.mjs` và `docs/operations/agent-native-release.md`.
Dùng Wrangler đã cài trong node_modules. Local mặc định không gọi remote AI; local D1 chỉ áp migrations additive.
Không in `.dev.vars`, `.env` hoặc giá trị secret. Production chỉ đọc metadata nếu được phép; không chạy migration/write/deploy production trong tác vụ dev.
Build web không kiểm tra Functions bundle: cần build Functions và local HTTP smoke trước bàn giao.
Rollback bằng revert commit/Pages deployment cũ theo quyền phát hành; giữ migration additive, không DROP bảng.
