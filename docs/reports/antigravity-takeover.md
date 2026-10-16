# Antigravity Takeover & Recovery Report — 2026-10-16

> Ảnh chụp lịch sử tại thời điểm takeover. Branch, worktree, test và trạng thái production trong báo cáo không đại diện hiện trạng sau đó; xem `docs/reports/final-acceptance.md` để biết lần kiểm tra mới nhất.

## 1. Repository State at Takeover

- **Current Branch**: `feat/agent-native-mcp` (branched from `main` at `dae3c8c`)
- **HEAD Commit**: `dae3c8c` (`feat(khoi-dau): add bottleneck subject analysis, slide screenshots, and register acceptance tests`)
- **Recovery Tags**:
  - `recovery-agent-native-2026-10-16` (Codex baseline tag at `dae3c8c`)
  - `landing-approved-2026-10-07` (Protected landing page tag)
  - `checkpoint-antigravity-takeover-2026-10-16` (`e30dfbcb7bf0bc4caa4e852d91adbb9251cb5166` — durable Git stash object tag created by Antigravity preserving all modified and untracked files before any edits)
- **Worktrees**: Single active worktree at `D:/07-Competitions-Hackathons/mlai/nguyenvongai` (`[feat/agent-native-mcp]`). No abandoned worktrees or incomplete merge operations (`MERGE_HEAD` / `REBASE_HEAD` absent).
- **Protected Landing Page**: `git diff HEAD -- src/features/landing-page src/styles/landing.css public/landing` is completely clean (0 modified lines).

## 2. Recent Commits

1. `dae3c8c` — `feat(khoi-dau): add bottleneck subject analysis, slide screenshots, and register acceptance tests`
2. `c948fa1` — `fix(acceptance): complete final product acceptance fixes, tests, and evidence pack`
3. `f1ad9d7` — `docs(evidence): cap nhat bao cao kiem thu: 13/13 smoke pass, 9 cong cu mcp, universities api`
4. `26b028a` — `ci: giu nguyen pipeline deploy pages doc lap voi quyen d1 migration`
5. `6fff5bf` — `feat(api): bo sung tra cuu truong cong khai, app capabilities, endpoint /api/v1/universities va chay d1 migrations tren ci`

## 3. Preserved Changes from Previous Codex Session

### Modified Tracked Files (18 files)
- `AGENTS.md` — Added agent-native implementation notes and commands.
- `functions/_thu-vien/ai/sinh-van-ban.ts` — Bounded Workers AI timeout, removed automatic model fallback retry on timeout/failure.
- `functions/_thu-vien/ket-noi-cong-cu.ts` — Integrated `src/capabilities/` into MCP tools, added `get_study_plan` and `update_study_progress` (pending proposal with `study:write` scope), strict schema validation.
- `functions/_thu-vien/oauth.ts` — Added `study:write` OAuth scope.
- `functions/api/v1/universities.ts` — Refactored to delegate to `executeCapability("search_universities", input)`.
- `functions/mcp/[ma].ts` — Upgraded MCP server to official `@modelcontextprotocol/sdk` (`WebStandardStreamableHTTPServerTransport`, `MCP_SERVER_VERSION = "2.0.0"`), Origin policy, structuredContent, outputSchema, resources, and prompts.
- `functions/mcp/index.ts` — Connected Bearer OAuth entrypoint to `guardMcpRequest` and `xuLyThanMcp`.
- `package.json` — Added scripts: `build:functions`, `test:capabilities`, `test:mcp`, `test:browser`, `data:audit`, `dev:tools:smoke`.
- `scripts/pages-local.mjs` — Local Pages runner improvements.
- `src/engine/ket-noi-kieu.ts` — Added `taskId`, `progressStatus`, and `cap-nhat-tien-do` proposal type to snapshot schema.
- `src/engine/lich-ics.ts` — Included `taskId` and `progressStatus` when exporting weekly study events.
- `src/features/ket-noi/the-de-xuat.tsx` — Added student confirmation handler for `cap-nhat-tien-do` proposals in the app UI.
- `src/features/tu-van/cau-tra-loi.ts` — Routed deterministic data/plan queries locally before calling AI.
- `src/features/tu-van/hieu-cau.ts` — Added `timTruongMoHo` to detect ambiguous university names (`BK`, `Bách khoa`, `UTC`, etc.) without confusing major names or missing campus locations.
- `src/features/tu-van/lay-du-lieu.ts` — Fixed `timNganhKhop` and `traLoiTuDong` to hard-filter by resolved university, ask for clarification on ambiguous names, and return `chua-co` when a requested university (`QSB` / `Bách khoa TP.HCM`) is absent from the catalog.
- `src/state/ket-noi.ts` — Added pure state transition `apDungDeXuat` for `cap-nhat-tien-do` with expectedStatus check and idempotency.
- `tests/final-acceptance-fixes.test.ts` — Updated test to load lazy catalog (`import "./nap-du-lieu"`) and verify no cross-university contamination for `QSB` and preserved `get_study_plan` + `ke_hoach_tuan`.
- `tests/mcp-sdk.test.ts` — Updated SDK client test for 18 tools and `MCP_SERVER_VERSION`.

### Untracked Files Created by Codex
- **Capabilities Layer**: `src/capabilities/index.ts`, `src/capabilities/catalog.ts`, `src/capabilities/schema.ts`
- **API v1 Endpoints**: `functions/api/v1/admission-score.ts`, `functions/api/v1/majors.ts`
- **Tests**: `tests/agent-routing.test.ts`, `tests/capabilities.test.ts`, `tests/capabilities-api.test.ts`, `tests/mcp-contracts.test.ts`, `tests/study-progress.test.ts`
- **Scripts**: `scripts/audit-admissions-data.ts`, `scripts/agent-native-browser.mjs`, `scripts/agent-native-browser-fixture.ts`, `scripts/smoke-development-tools.mjs`
- **Skills & Plugins**: `.agents/plugins/marketplace.json`, `.agents/skills/{admissions-data-verification,admissions-domain,cloudflare-operations,mcp-development,mobile-ux-audit}/SKILL.md`, `plugins/nguyen-vong-ai/{plugin.json,mcp.json,skills/admissions-advisory/SKILL.md}`, `.codex/config.toml`
- **Documentation & Audits**: `docs/architecture/{current-state.md,target-state.md}`, `docs/audits/{initial-gap-analysis.md,data-quality.md,ai-orchestration.md}`, `docs/mcp/tool-catalog.md`, `prompt.md`

## 4. Actual Baseline Verification Results at Takeover

| Check | Reported by Codex | Actual Result at Takeover | Details |
|---|---|---|---|
| `npm run typecheck` | PASS | **PASS** | `tsc --noEmit` exits 0 |
| `npm run kiem-tra` | PASS | **PASS** | 34 routes, 15 slices pass uniformity checks |
| `tests/final-acceptance-fixes.test.ts` | Failed before Codex fix | **PASS** | Passed with Codex's `QSB` / `nap-du-lieu` fix |
| `npm run test:capabilities` | PASS | **PASS** | `capabilities.test.ts` and `study-progress.test.ts` pass |
| `tests/mcp-sdk.test.ts` & `tests/mcp-contracts.test.ts` | PASS | **PASS** | Official SDK Streamable HTTP client tests pass |
| `tests/oauth-mcp.test.ts` | Not updated for SDK transport | **FAIL (3/22)** | Raw `Request` helper lacked `Accept: application/json, text/event-stream` required by SDK `WebStandardStreamableHTTPServerTransport` (HTTP 406) |
| `tests/ket-noi-mcp.test.ts` | Not updated for SDK transport | **FAIL** | Raw `Request` helper lacked `Accept` header (HTTP 406) and expected old 9-tool list / `1.1.0` version / wildcard CORS |
| Standalone `tests/tu-van-chat.test.ts` | Passed via `lay-du-lieu.test.ts` | **FAIL standalone** | Missing `import "./nap-du-lieu"` at top when run directly outside `lay-du-lieu.test.ts` |

## 5. Incomplete Tasks & Risks of Resuming

1. **Legacy MCP & OAuth Test Alignment**: `functions/mcp/[ma].ts` was upgraded to `@modelcontextprotocol/sdk` v2.0.0 (`WebStandardStreamableHTTPServerTransport`), which enforces `Accept: application/json, text/event-stream` per MCP Streamable HTTP specification, exposes 18 tools (9 legacy + 9 canonical capability tools), exposes bounded resources/prompts, and restricts CORS to trusted origins. However, Codex stopped before updating `tests/oauth-mcp.test.ts` and `tests/ket-noi-mcp.test.ts` (and wiring the new test files into `npm test`).
2. **Standalone Test Import**: `tests/tu-van-chat.test.ts` needs `import "./nap-du-lieu";` so it can run standalone as well as via `tests/lay-du-lieu.test.ts`.
3. **Missing Operations & Acceptance Reports**: `AGENTS.md` and `docs/architecture/target-state.md` reference `docs/reports/final-acceptance.md` and `docs/operations/agent-native-release.md`, which were not yet written when Codex hit its limit, plus `docs/reports/antigravity-final-report.md`.
4. **End-to-End Verification**: Need to run `npm run data:audit`, `npm run build`, `npm run build:functions`, `npm run cms:build`, and `npm run test:browser` against the local runtime to verify all journeys and responsive viewports without touching the locked landing page.
