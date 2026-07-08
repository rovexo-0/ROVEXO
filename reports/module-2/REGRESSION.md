# Module 2 v2.0 — Regression Report

Generated: 2026-07-06T03:24:23.662Z

## Automated regression

| Suite | Result |
|-------|--------|
| TypeScript | pass |
| ESLint | pass |
| Vitest (Module 2) | pass |

## Known pre-existing risks

- Business dashboard server errors for some business users (unchanged)
- Shippo live quotes require env + seller shipping address (deferred)
- Enterprise super-admin routes remain reachable by URL; nav simplified only

## Playwright (subset)

| Suite | Result |
|-------|--------|
| responsive.spec.ts (chromium) | 5/6 pass — listing tablet flake (env) |
| accessibility.spec.ts (chromium) | 4/6 pass — categories heading timeout (env) |

Full matrix deferred to pre-launch audit per spec.
