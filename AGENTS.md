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
