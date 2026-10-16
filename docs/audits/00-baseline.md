# Baseline đợt audit hackathon

Ngày: 2026-10-16 (Asia/Saigon)

## Checkout và công việc có sẵn

- Branch: `feat/agent-native-mcp`; HEAD trước sprint: `0be216c` (`refactor(ui): simplify admissions content and mobile lists`).
- Worktree đã có nhiều thay đổi staged/unstaged và file mới trước khi bắt đầu audit. Giữ nguyên và coi là công việc có sẵn; không quy hết cho sprint này.
- Landing đã khóa tại `landing-approved-2026-10-07`; chỉ kiểm tra, không sửa protected paths.
- Không thấy thay đổi trong các protected paths của landing ở `git status` đầu sprint.

## Kiến trúc và dữ liệu

- Frontend: React 19, TypeScript, Vite, hash routes; feature slices trong `src/features/`.
- Nghiệp vụ: engine TypeScript thuần trong `src/engine/`; capability dùng chung trong `src/capabilities/`.
- Backend: Cloudflare Pages Functions, D1/KV; MCP Streamable HTTP/OAuth trong `functions/mcp/` và `functions/_thu-vien/`.
- Dữ liệu tuyển sinh: snapshot kèm source/CMS; trạng thái và giới hạn provenance được mô tả trong `docs/audits/data-quality.md`; baseline chưa có bằng chứng xác minh từng nguồn.
- State hồ sơ trên trình duyệt là local-first; write từ MCP phải tạo đề xuất để học sinh xác nhận.

## Lệnh, URL và bằng chứng baseline

- `npm run dev`: `http://localhost:3030`; `npm run app:local`: Pages local trên `8790`.
- Browser harness: `npm run test:browser` (`scripts/agent-native-browser.mjs`, Puppeteer Chrome; cần app local).
- Máy có `agent-browser`, `ffmpeg` và `ffprobe`.
- Proposal hiện có: `docs/submission/NGUYEN-VONG-AI-PROPOSAL.md`; engineering appendix: `docs/submission/ENGINEERING-EVIDENCE.md`.
- Có screenshot browser cũ trong `artifacts/browser/`; đây là bằng chứng cũ, không thay lần chạy mới.
- Chưa thấy demo/video artifact trong `demo/` lúc bắt đầu. Yêu cầu cuộc thi cụ thể cần đối chiếu tài liệu ngoài repo trước khi tuyên bố đã đáp ứng.

## Kiểm tra trước sprint

- `npm run typecheck`: PASS.
- `npm run kiem-tra`: PASS (34 route, 15 slice).
- `npm test`: PASS trước sửa scope; log có capability/MCP và hành trình local. Sẽ chạy lại sau sửa.
- `npm run build`: PASS; Vite cảnh báo chunk `du-lieu-that` khoảng 1.36 MB minified.
- `npm run build:functions`: PASS.
- `npm run cms:build`: PASS.
- `git diff --check`: PASS.
- Browser E2E chưa chạy lại trong baseline này; cấu hình production, migrations/bindings và AI provider bên ngoài chưa được xác minh.

## Điểm cần kiểm tra ngay

- Mã kết nối MCP cũ có cách xử lý khác OAuth scope; cần bảo đảm thao tác ghi mới vẫn đòi consent scope tương ứng.
- Chạy lại browser matrix trên checkout hiện tại; đánh giá overflow/hit-target warning bằng giao diện thật.
- Kiểm tra đề xuất, provenance, AI response và tính khả thi của demo bằng bằng chứng có thể tái lập.
