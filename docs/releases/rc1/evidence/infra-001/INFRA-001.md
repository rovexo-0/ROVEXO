# INFRA-001 — Development Runtime Recovery

**ID:** INFRA-001  
**Category:** Development Runtime  
**Subsystem:** Next.js Turbopack Persistence  
**Status:** **RESOLVED** (runtime)  
**Date:** 2026-07-31

## Classification

| Question | Answer |
|----------|--------|
| Application code defect? | **No** |
| HMRC certification invalidated? | **No** |
| Blocks Checkout certification? | **Was blocking** via corrupted `.next` / Turbopack SST; runtime recovered |
| Emitter of `Compaction failed` | `@next/swc-linux-x64-gnu` → Turbopack `turbo-persistence` |

## Root cause (confirmed)

`npm run dev` (Turbopack) held `.next/dev` persistence open while `.next` was wiped/rebuilt (Playwright production build / manual clean). SST writes failed (`Unable to write SST file … ENOENT`) → `Compaction failed: Another write batch or compaction is already active`.

## Recovery actions performed

1. Stopped live `next dev` / `next-server` (pids terminated cleanly).  
2. Wiped `.next` (`WIPE_OK`).  
3. Clean production `npm run build` → **PASS**  
   - `BUILD_ID` present  
   - `.next/dev` **absent** (single production output)  
   - `routes-manifest.json` present  
   - `required-server-files.json` non-zero  
4. Confirmed ports free before Playwright; no competing Owner `next dev` during E2E.

## Playwright re-run (post-recovery)

| Item | Result |
|------|--------|
| Suite | `e2e/checkout-blood-xxiii-certification.spec.ts` `--project=chromium` |
| Runtime | Clean production webServer (managed `:13025`) |
| Compaction / SST ENOENT | **Not observed** |
| Exit code | `0` |
| Tests | **6 skipped** (not executed) |
| Live journey PASS | **No** — skip ≠ PASS |

Skip reason was not printed by the list reporter. Live Supabase admin probe to distinguish “no active seller listing” vs worker env was **declined** (Owner/smart-mode skip). Treat journey evidence as **incomplete**.

Evidence paths:
- `docs/releases/rc1/evidence/infra-001/recovery.log`
- `docs/releases/rc1/evidence/infra-001/clean-build.log`
- `docs/releases/rc1/evidence/infra-001/playwright-xxiii.log`
- `docs/releases/rc1/evidence/infra-001/playwright-list2.log`

## Operating rule (mandatory)

Never run Owner `npm run dev` and Playwright/production `.next` wipe/rebuild against the same tree concurrently. One runtime · one `.next` mode (dev **or** production).

## Checkout certification posture after INFRA-001

- Infrastructure blocker for Turbopack compaction: **cleared**  
- Checkout Blood XXIII final: still **NOT READY** until a non-skipped Playwright journey + Owner gates complete  
- No Owner flag flips (`ownerCertified` / `permanentlyFrozen` / `complete100` remain false)  
- No application source changes applied for this incident
