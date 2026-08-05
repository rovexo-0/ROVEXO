# ROVEXO PRODUCTION HOTFIX REPORT

**STATUS: ✔ IMPLEMENTATION + LOCAL GATES PASS · ⏸ PUSH/DEPLOY BLOCKED (approval UI)**  
**Date:** 2026-08-05  
**Authority:** Owner-approved COD SÂNGE — Production Hotfix (Serverless Startup)  
**Scope:** Hotfix only — startup / branding integrity / packaging compatibility

---

## Root Cause Analysis

**Symptom (production):** HTTP 500 on `/login` and most dynamic routes after deploy `dpl_BC62AbKmY65hDsCqizgysCtpya4m`.

**Exact error:**

```text
An error occurred while loading instrumentation hook:
ENOENT: no such file or directory,
open '/var/task/components/branding/RovexoBrandLogo.tsx'
```

**Why Serverless failed**

1. `instrumentation.ts` runs Blood Laws XXXVII–XLI at Node startup.
2. Those laws used `readFileSync()` on application **source** files (`.tsx` / `.css`) for integrity stamps.
3. Locally / in Vitest the monorepo source tree exists → checks pass.
4. On Vercel, Node File Trace (NFT) + `build:production` prune ship a serverless `/var/task` **without** unused source `.tsx` files.
5. `readFileSync` threw ENOENT → instrumentation hook failed → **HTTP 500**.

This is a **startup implementation bug**, not a Vercel platform bug.

---

## Fix (production-safe)

| Mechanism | Behaviour |
|-----------|-----------|
| `lib/startup/brand-integrity-runtime-v1.ts` | `readUtf8SourceOrEmpty()` never throws; `shouldSoftFailBrandIntegrityAtRuntime()` true when `VERCEL=1` |
| Blood XXXVII–XLI `assert*OrBlock` | On soft-fail runtime: **warn + continue** (never throw for brand integrity) |
| `runStartupCertificationGate` | Source-tree ENOENT (`.tsx`/`.css`/branding paths): **warn + continue** even in production |
| Vitest / `ROVEXO_CERTIFICATION_MODE` | Remain fail-closed when source tree is present |

**Absolute rule satisfied:** missing branding source file must never `throw` / `process.exit` / fatal-assert production boot.

---

## Files modified

| File | Change |
|------|--------|
| `lib/startup/brand-integrity-runtime-v1.ts` | **NEW** — soft-fail helpers |
| `lib/startup/startup-certification-policy-v1.ts` | ENOENT source-tree soft-continue (v1.2) |
| `instrumentation.ts` | Comment: P13.1 hotfix policy |
| `lib/supreme-blood-law-xxxvii-official-brand-emblem-v1.ts` | Safe source read + soft assert |
| `lib/supreme-blood-law-xxxviii-official-brand-application-v1.ts` | Safe source read + soft assert |
| `lib/supreme-blood-law-xxxix-authentication-brand-freeze-v1.ts` | Safe source read + soft assert |
| `lib/supreme-blood-law-xl-register-visual-polish-freeze-v1.ts` | Safe source read + soft assert |
| `lib/supreme-blood-law-xli-authentication-experience-final-freeze-v1.ts` | Safe source read + soft assert |
| `tests/brand-integrity-runtime-v1.test.ts` | **NEW** — soft-fail / ENOENT gate tests |
| `ROVEXO_PRODUCTION_HOTFIX_REPORT.md` | This report |
| `ROVEXO_FINAL_PRODUCTION_CERTIFICATION.md` | Companion cert |
| `ROVEXO_PRODUCTION_DEPLOY_REPORT.md` | Prior deploy FAIL record |

**Not modified:** UI · Auth session · Routing · Supabase · CSP · Middleware logic · Marketplace · Checkout · Wallet · Listings

---

## Why the fix is production-safe

- Brand **rendering** still uses normal module imports / public assets — unchanged.
- Source-file disk scans were **build/CI integrity** checks, not runtime dependencies.
- On Vercel they become no-ops with warnings; locally and in certification mode they still fail closed.
- Catalog / other non-brand startup gates still throw on real production failures.

---

## Validation evidence (pre-deploy)

| Gate | Result |
|------|--------|
| TypeScript | ✔ PASS |
| ESLint | ✔ PASS (0 errors) |
| Vitest | ✔ PASS (606 files / 4699 tests) |
| `next build` | ✔ PASS |
| Local smoke `/` `/login` `/search` `/categories` `/help` | ✔ all HTTP 200, no overlay / ENOENT |
| Simulated ENOENT gate under production env | ✔ soft-fail, `blocked=false` |

---

## Git / Deploy

| Step | Result |
|------|--------|
| Local commit | ✔ `488b04a96b393fc5bc57359bfe29319a152578d4` — `P13.1 hotfix: serverless brand integrity soft-fail` |
| Push `origin/develop` | ⏸ Blocked — Cursor Auto-review approval UI failed to present |
| Vercel `--prod` | ⏸ Blocked — same approval gate |

**Owner action required:** Approve push + `npx vercel deploy --prod --yes` (or Dashboard Redeploy of SHA `488b04a9`), then re-run live smoke on https://www.rovexo.co.uk.

---

## Final PASS / FAIL (hotfix implementation)

**✔ HOTFIX IMPLEMENTATION PASS**  
**⏸ LIVE PRODUCTION CERTIFICATION PENDING PUSH/DEPLOY APPROVAL**
