# ROVEXO PRODUCTION DEPLOY REPORT

**STATUS: FAIL CLOSED**  
**Date:** 2026-08-05  
**Authority:** Owner-approved COD SÂNGE Production Deploy  
**Official URL:** https://www.rovexo.co.uk

---

## Phase results

| Phase | Result |
|-------|--------|
| 1 — Final Gate (tsc → eslint → vitest → next build) | ✔ PASS |
| 2 — Pre-commit hygiene | ✔ PASS |
| 3 — Commit | ✔ PASS |
| 4 — Push `origin/develop` | ✔ PASS |
| 5 — Vercel Production Deploy | ✔ READY (build completed) |
| 6 — Live Smoke | ✖ FAIL |
| 7 — Security (post-smoke) | ⏸ STOPPED (blocked by Phase 6) |
| 8 — Final Live Certification | ✖ FAIL |

---

## Deploy identity

| Field | Value |
|-------|--------|
| Commit SHA | `c51b49f0e6ab8c2bea6ec213e63b83ebbb080f61` |
| Push SHA | `c51b49f0e6ab8c2bea6ec213e63b83ebbb080f61` |
| Branch | `develop` → `origin/develop` |
| Commit message | `P13.1 Final Production Certification` |
| Deploy ID | `dpl_BC62AbKmY65hDsCqizgysCtpya4m` |
| Deployment URL | https://rovexo-r8rhoe80q-rovexo.vercel.app |
| Inspector | https://vercel.com/rovexo/rovexo/BC62AbKmY65hDsCqizgysCtpya4m |
| Production alias | https://www.rovexo.co.uk |
| readyState | READY |
| Build window | ~2026-08-05 03:13:06 → 03:25:00 BST (~12 min wall; Vercel build ~8–11 min typical) |
| Production Build (Vercel) | ✔ PASS (aliased) |

---

## Phase 1 evidence (local)

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| ESLint | PASS (0 errors) |
| Vitest | PASS (608 files / 4721 tests) |
| `next build` | PASS |

---

## Phase 6 — Live Smoke (https://www.rovexo.co.uk)

| Path | HTTP | Notes |
|------|------|-------|
| `/` | 307 → `/login` → **500** | Guest redirect then instrumentation crash |
| `/login` | **500** | Next error overlay |
| `/register` | **500** | |
| `/search` | **500** | |
| `/categories` | **200** | Prerender / cache hit — does not prove healthy boot |
| `/profile` | **404** | No route (canonical is `/account`) |
| `/account` | 307 → `/login` → **500** | |
| `/sell` | 307 → `/login` → **500** | |
| `/messages` | 307 → `/login` → **500** | Canonical `/inbox` same |
| `/inbox` | 307 → `/login` → **500** | |
| `/orders` | 307 → `/login` → **500** | |
| `/wallet` | 307 → `/login` → **500** | |
| `/business` | 307 → `/login` → **500** | |
| `/admin` | 307 → `/login` → **500** | |
| Google OAuth | ✖ NOT TESTED | Blocked by `/login` 500 |
| Logout | ✖ NOT TESTED | Blocked by auth surfaces 500 |

**Live Smoke: FAIL**

---

## Exact root cause (FAIL CLOSED)

**Error (Vercel production runtime logs):**

```text
An error occurred while loading instrumentation hook:
ENOENT: no such file or directory,
open '/var/task/components/branding/RovexoBrandLogo.tsx'
```

**Call chain:**

1. `instrumentation.ts` → startup certification register  
2. `assertOfficialBrandEmblemOrBlock()` — `lib/supreme-blood-law-xxxvii-official-brand-emblem-v1.ts`  
3. and/or `assertOfficialBrandApplicationOrBlock()` — `lib/supreme-blood-law-xxxviii-official-brand-application-v1.ts`  
4. Disk assertion opens `components/branding/RovexoBrandLogo.tsx` via `projectRoot(...)`  
5. File exists in git/repo locally, but is **not present in the Vercel serverless `/var/task` bundle** after `npm run build:production` (`scripts/next-build-and-prune.mjs` → NFT prune)  
6. Instrumentation throws → dynamic routes return **HTTP 500**

**Missing path at runtime:** `/var/task/components/branding/RovexoBrandLogo.tsx`  
**Source file (repo):** `components/branding/RovexoBrandLogo.tsx` (present on disk / in commit)  
**Policy surface:** `lib/startup/startup-certification-policy-v1.ts` (production fail-closes on cert throw)

This is a **production packaging / startup certification vs serverless NFT** mismatch — not a TypeScript/ESLint/Vitest/local-build failure.

---

## Phase 7 — Security (partial observation only)

Headers observed on `/` (307) before smoke abort:

| Check | Observation |
|-------|-------------|
| CSP | Present (`default-src 'self'` + Stripe/GA allowlists; `object-src 'none'`) |
| HSTS | Present (`max-age=63072000; includeSubDomains; preload`) |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| Cookies / CSRF / OAuth / RLS | ✖ NOT CERTIFIED — Phase 6 FAIL |

**Security live certification: FAIL (incomplete / blocked)**

---

## Accessibility / OAuth

| Gate | Result |
|------|--------|
| Accessibility (live) | ✖ NOT RUN — blocked by HTTP 500 |
| OAuth (live) | ✖ NOT RUN — `/login` 500 |

---

## Actions taken / not taken

| Action | Status |
|--------|--------|
| Auto-rollback | **NOT PERFORMED** (Owner fail-closed) |
| Additional code changes | **NOT PERFORMED** |
| Redeploy / hotfix | **NOT PERFORMED** |

**Previous Ready production (superseded by this deploy):**  
`dpl_AvWsMPMRCGeA63XyPkD7xVF8fXM7` (https://rovexo-qb2hiui2x-rovexo.vercel.app) — Owner may promote manually if recovery is required.

---

## Verdict final

```text
✖ ROVEXO PRODUCTION DEPLOY FAILED — LIVE SMOKE
```

**Commit/Push/Vercel Build:** PASS  
**Live product on https://www.rovexo.co.uk:** FAIL (instrumentation ENOENT on `RovexoBrandLogo.tsx`)

**Next Owner decision required (ops only — no agent auto-fix):**  
1. Approve smallest packaging/include fix for brand source (or adjust production startup assert to not `readFileSync` pruned NFT sources), then redeploy; **or**  
2. Manually promote previous Ready deployment for recovery.
