# Repository instructions

Read `.agents/AGENTS.md` for the general project rules.

## Protected landing page — user-approved on 2026-10-07

The landing page was recovered from the original implementation and explicitly approved by the user. Its baseline is the annotated Git tag `landing-approved-2026-10-07`.

Protected paths:
- `src/features/landing-page/` (including the entrypoint and routes)
- `src/styles/landing.css`
- `public/landing/`

Do not edit, delete, rename, replace, reformat, or regenerate these files unless the user explicitly requests a change to this approved landing page. A general refactor, cleanup, redesign, test fix, or work on another feature is not authorization.

Do not redirect `/gioi-thieu` to a different component or change shared CSS/layout in a way that alters this landing page. Preserve the desktop/mobile composition and assets.

Before an explicitly authorized change, preserve the approved tag and review the diff against it. Never move or delete the tag. See `docs/LANDING-LOCK.md` for recovery instructions.
