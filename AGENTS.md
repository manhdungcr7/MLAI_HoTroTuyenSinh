# Repository instructions

Read `.agents/AGENTS.md` for the general project rules.

## Agent-native implementation

- Product: Vietnamese-first, local-first admissions advice for grade 11/12; useful with incomplete scores. AI explains deterministic results, never replaces calculations or invents admissions rules.
- Canonical implementation: `src/capabilities/` for reusable validated operations; `src/engine/` for pure algorithms; `functions/mcp/` for SDK transport; `functions/_thu-vien/ket-noi-cong-cu.ts` for authenticated tool contracts; `src/state/ket-noi.ts` for app confirmation.
- Dataset provenance: bundled data and CMS live snapshots differ. A source URL or dataset tier is not independent verification. Missing scores/dates stay null; historical cutoffs are not future guarantees.
- Server identity comes from OAuth token/connection, never a client student ID. Use least scopes. Writes create pending proposals and require student confirmation in the app; old tokens need fresh consent for `study:write`.
- Commands: `npm run typecheck`, `npm run kiem-tra`, `npm test`, `npm run build`, `npm run build:functions`, `npm run cms:build`; focused `test:capabilities`, `test:mcp`, `test:browser`, `data:audit`.
- Local runtime: `npm run app:local` (8790), `npm run dev` (3030). Remote AI disabled unless `NV_AI_REMOTE=1`; use isolated `NV_TRANG_THAI` for QA.
- Repo workflows: `.agents/skills/`; portable plugin: `plugins/nguyen-vong-ai/`; marketplace: `.agents/plugins/marketplace.json`. No secrets in tracked config.
- Do not push/merge `main`, deploy production, apply remote migrations, or mutate production data without explicit release authorization. CI deploys pushes to `main`.
- Current acceptance evidence and limitations: `docs/reports/final-acceptance.md`. Deployment and rollback: `docs/operations/agent-native-release.md`. Old reports describe older commits, not the current checkout.

## Protected landing page — user-approved on 2026-10-07

The landing page was recovered from the original implementation and explicitly approved by the user. Its baseline is the annotated Git tag `landing-approved-2026-10-07`.

Protected paths:
- `src/features/landing-page/` (including the entrypoint and routes)
- `src/styles/landing.css`
- `public/landing/`

Do not edit, delete, rename, replace, reformat, or regenerate these files unless the user explicitly requests a change to this approved landing page. A general refactor, cleanup, redesign, test fix, or work on another feature is not authorization.

Do not redirect `/gioi-thieu` to a different component or change shared CSS/layout in a way that alters this landing page. Preserve the desktop/mobile composition and assets.

Before an explicitly authorized change, preserve the approved tag and review the diff against it. Never move or delete the tag. See `docs/LANDING-LOCK.md` for recovery instructions.

## 9. Làm việc song song và commit liên tục (rút từ lần làm bẩn cây, 17/10/2026)
Nguyên nhân gốc của "pending changes" lẫn lộn và lỗi `tsc`/test không rõ của ai: nhiều người và agent cùng sửa MỘT thư mục, cổng kiểm tra chạy trên cả cây, và `git add -A` gom luôn việc dở của người khác.

**Quy tắc**
1. **Một việc, một thư mục làm việc riêng.** `npm run viec-moi -- ten-viec` tạo `../nv-ten-viec` (git worktree từ `origin/main`, nhánh `feat/ten-viec`). Không sửa trực tiếp trong thư mục chính khi người khác cũng đang dùng. Agent phụ cũng vậy: mỗi agent một worktree, một phạm vi file.
2. **Commit nhỏ, ngay khi một bước xanh.** Một vấn đề một commit, thông điệp nói rõ vì sao. Đừng để việc dở nằm treo quá một buổi.
3. **Chỉ `git add` đường dẫn cụ thể.** Cấm `git add -A` / `git add .` khi cây có file của người khác. Việc dở cần cất: nhánh `wip/<tên>` (cổng bỏ qua, nhưng KHÔNG bao giờ merge vào main).
4. **Cổng tự động chạy trên bản chụp của thứ sắp vào lịch sử**, không phải cả cây (`scripts/cong-kiem-tra.mjs`, cài tự động bởi `npm install` qua `prepare`, hoặc `git config core.hooksPath .githooks`):
   - `pre-commit`: `tsc` + `kiem-tra` + test của phần vừa đổi (nhanh, vài chục giây). File dở chưa stage không làm đỏ cổng; lỗi trong thứ đã stage thì chặn.
   - `pre-push`: bản chụp HEAD, `tsc` + `kiem-tra` + `vite build` (nhẹ, khớp đường deploy của CI, khoảng 40 giây). Test đầy đủ: `npm run cong:push -- --day-du`.
   - Chạy tay bất cứ lúc nào: `npm run cong:commit`, `npm run cong:push`.
5. **Test đỏ sẵn phải có chủ.** Test đang đỏ mà chưa sửa được ghi vào `tests/baseline-do.json` kèm nguyên nhân và người chịu trách nhiệm; cổng không chặn vì nó, nhưng MỌI test đỏ khác đều chặn. Khi sửa xong, cổng nhắc xóa dòng khỏi baseline. Không thêm vào baseline để "qua cổng" cho test do mình làm hỏng.
6. **Merge vào main = fast-forward sau khi cổng push xanh.** Trước khi push: `git fetch` rồi `git merge origin/main` vào nhánh của mình, giải xung đột, cổng chạy lại. Đẩy thẳng `main` chỉ khi người phụ trách đồng ý rõ; mặc định đi qua PR.
7. **Không `--no-verify`.** Cần lưu tạm thì dùng nhánh `wip/*`.
8. **Phân quyền file khi giao việc cho agent**: ghi trong prompt phạm vi file được sửa, lệnh kiểm cần chạy, "không commit" (người điều phối commit từng phần bằng `git add <đường dẫn>`), cổng dev server riêng, và danh sách lỗi cụ thể cần sửa (không giao việc mơ hồ).
