# ROVEXO v1.0 — Homepage Enterprise Deployment Report

**Date:** 2026-06-26  
**Release commit:** `6df59973b82890911d4c801d9f4941ec457397e5`  
**Message:** `release(v1.0): enterprise homepage migration certified`  
**Branch:** `main` (pushed to `origin/main`)

---

## Release Status

| Step | Status | Detail |
|------|--------|--------|
| Commit approved changes | **PASS** | `6df5997` on `main` |
| Push to `origin/main` | **PASS** | Remote SHA matches |
| Production built from latest commit | **FAIL** | Live site still serves pre-migration build |
| Vercel production deploy (CLI) | **BLOCKED** | Hobby plan cron limit (`*/5 * * * *` in `vercel.json`) |

### Deploy blocker (action required)

```
Hobby accounts are limited to daily cron jobs.
Cron expression (*/5 * * * *) would run more than once per day.
```

Until Vercel accepts a deployment from `6df5997`, production will continue showing legacy homepage sections. Options:

1. Upgrade Vercel to Pro, or  
2. Change migration crons in `vercel.json` to daily schedules, or  
3. Trigger a successful deploy from the Vercel dashboard after resolving cron validation.

**No UI or business-logic changes were made for this release.**

---

## Production Verification (https://www.rovexo.co.uk)

**Deployed commit SHA:** **Unknown** — Vercel does not expose git SHA in response headers.  
**Inferred build:** Pre-`e1a94f9` (legacy homepage sections present).

| Check | Production | Expected (Enterprise) |
|-------|------------|----------------------|
| 1. HomeContent enterprise stack | **FAIL** | Hero + banner + Popular Auctions |
| 2. HomeHeroBanner (`hero-banner-2026`) | **FAIL** — not in HTML | Visible |
| 3. Bring Your Item banner | **FAIL** — not in HTML | `store-migration-banner-heading` |
| 4. Premium header | **PASS** | `data-header-version="premium-2026"` |
| 5. Premium category rail | **PASS** | `home-category-premium-rail` |
| 6. Premium bottom navigation | **PASS** | `data-bottom-nav="2026"` |
| 7. Scroll-hide animation | **NOT VERIFIED** | Requires mobile scroll on new build |
| 8. Sell button → sell flow | **PARTIAL** | Bottom nav present; guest → `/login?next=/sell` (not re-tested on prod) |
| 9. No legacy components | **FAIL** | `Popular Near You` + legacy auctions copy present |
| 10. Playwright prod smoke | **FAIL** | 2/3 homepage tests failed against live URL |

### Legacy markers still on production

- `Popular Near You` section
- Auctions heading: **"Auctions"** (not **"Popular Auctions"**)
- `Live bidding is coming soon` copy

### Production Playwright results

```
PASS  bottom navigation targets resolve
FAIL  homepage sections (auctions heading + Bring Your Item banner)
FAIL  bring your item banner opens sell wizard (banner missing)
```

---

## Release Build Verification (local `next start` @ commit `6df5997`)

Verified on `http://127.0.0.1:3020` (production build from current `main`).

| Check | Status | Evidence |
|-------|--------|----------|
| 1. Enterprise HomeContent | **PASS** | `e2e/master-qa.spec.ts` homepage sections |
| 2. HomeHeroBanner | **PASS** | `.hero-banner-2026` count = 1 |
| 3. Bring Your Item banner | **PASS** | `store-migration-banner-heading`, href `/sell/new` |
| 4. Premium header | **PASS** | `data-header-version="premium-2026"` |
| 5. Premium category rail | **PASS** | `.home-category-premium-rail` |
| 6. Premium bottom navigation | **PASS** | `data-bottom-nav="2026"` |
| 7. Scroll-hide animation | **NOT VERIFIED** | Provider wired; page too short with empty carousels to trigger hide in automated scroll test |
| 8. Sell button → sell flow | **PASS** | Guest tap → `http://127.0.0.1:3020/login?next=%2Fsell` |
| 9. No legacy components | **PASS** | `legacyPopularNearYou` = 0 |
| 10. Unit contract tests | **PASS** | `tests/home-enterprise-migration.test.ts` |

### Components rendered in release build (`HomeContent`)

```
HomeHeroBanner
HomeCategoryRail
StoreMigrationHeroBanner
ProductCarouselSection — Featured Listings
ProductCarouselSection — Recommended For You
AuctionsSection — Popular Auctions
ProductCarouselSection — Latest Listings
```

**Shell:** `BetaAppShell` → `MobileHeaderScrollProvider` + `BottomNavigation` + `Header`

---

## Files in Release Commit `6df5997`

| File | Change |
|------|--------|
| `components/home/HomeContent.tsx` | Direct `HomeHeroBanner` import |
| `components/home/HomeHeroSearch.tsx` | `@deprecated` alias |
| `tests/home-hydration.test.ts` | Enterprise assertions |
| `tests/home-enterprise-migration.test.ts` | Migration contract tests |
| `HOMEPAGE_ENTERPRISE_MIGRATION_AUDIT.md` | Audit documentation |

---

## Summary

| Environment | Enterprise homepage | Commit |
|-------------|--------------------|--------|
| **Git `main`** | **READY** | `6df5997` |
| **Local production build** | **VERIFIED** | `6df5997` |
| **https://www.rovexo.co.uk** | **NOT DEPLOYED** | Legacy build (pre-migration) |

**Next step:** Resolve Vercel deploy blocker and redeploy `main`. Re-run production Playwright homepage suite after deploy succeeds.

---

*End of Homepage Enterprise Deployment Report — ROVEXO v1.0*
