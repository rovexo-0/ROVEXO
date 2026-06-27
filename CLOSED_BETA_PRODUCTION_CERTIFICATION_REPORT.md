# ROVEXO v1.0 — Closed Beta Production Certification Report

**Date:** 2026-06-26  
**Environment:** https://www.rovexo.co.uk  
**Policy:** No UI redesign · No business logic changes · Test/dev data cleanup only

---

## Executive Summary

| Area | Status |
|------|--------|
| Test data removal | **PASS** |
| Enterprise homepage shell | **PASS** |
| Product carousels (Featured/Recommended/Latest) | **EMPTY** — hidden by design when no published listings |
| Automated E2E (full homepage carousel assertions) | **FAIL** — empty catalog |
| Build / lint / typecheck | **PASS** |
| **Closed Beta Ready** | **CONDITIONAL** — platform clean; needs live listings for full homepage carousel QA |

---

## 1. Test Data Removal — PASS

### Listings purged (hard delete)

| ID | Title | Method |
|----|-------|--------|
| `7476e012-c9e6-4abe-95ab-503e902bdbc6` | Runtime Test Listing 1781910467733 | Prior UI delete + DB purge |
| `db70f3cd-731a-4b49-b292-b5cada75b90b` | mulisoft test | DB purge |

### Test users purged (20 accounts)

- `runtime.publish.*@mailinator.com` (Runtime Publish seller)
- 19× `e2e-seller-*@example.test` E2E accounts

### Verification (post-cleanup)

| Check | Result |
|-------|--------|
| Published test listings | **0** |
| Search: Runtime Test / Test / Demo / QA / E2E / placeholder | **0 results each** |
| Homepage contains Runtime Test / Test Listing | **No** |
| Orphan `product_images` | **0** |
| Orphan `saved_items` | **0** |
| Test auctions | **0** |
| Test user profiles remaining | **0** |

### Preserved (not test-labelled)

6 soft-deleted seller inventory rows (Nike trainers, Levi's jeans) retained — not named as test/demo; already `status: deleted` and not public.

---

## 2. Placeholder Content — PASS

| Check | Result |
|-------|--------|
| Placeholder listing images in storage | **None** (`product_images` count 0) |
| Demo/QA homepage banners | **None** — enterprise `StoreMigrationHeroBanner` only |
| Blue placeholder cards on homepage | **Not present** in production HTML |

---

## 3. Homepage Cleanup — PASS (enterprise shell)

| Component | Production | Notes |
|-----------|-------------|-------|
| Hero Banner (`hero-banner-2026`) | **Visible** | |
| Bring Your Item banner | **Visible** | → `/sell/new` |
| Featured Listings | **Hidden** | No published products (`hideWhenEmpty`) |
| Recommended | **Hidden** | Same |
| Popular Auctions | **Visible** | Static CTA section |
| Latest Listings | **Hidden** | Same |
| Category Rail | **Visible** | |
| Premium Header | **Visible** | `premium-2026` |
| Footer | **Visible** | |
| Bottom Navigation | **Visible** | `data-bottom-nav="2026"` |
| Search Bar | **Visible** | `#header-search` |
| Messages / Notifications / Avatar | **Present** | Header chrome (guest) |

---

## 4. Visual QA — PARTIAL

| Check | Status | Method |
|-------|--------|--------|
| No clipping / overflow / horizontal scroll | **NOT VERIFIED** | Manual device pass recommended |
| No layout shift | **NOT VERIFIED** | No CLS profiling run |
| No duplicated navigation | **PASS** | Single header + bottom nav in HTML |
| No duplicated banners | **PASS** | |
| Broken spacing / shadows / icons | **NOT VERIFIED** | Manual pass recommended |

Production WCAG axe (Homepage, Login, Categories): **PASS** (4/4)

---

## 5. Routing QA — PASS (automated subset)

Production Playwright `master-qa` (routing/nav, excluding empty-carousel homepage landmark):

| Suite | Result |
|-------|--------|
| Public routes (except homepage landmark) | **PASS** |
| Protected → `/login` redirects | **PASS** |
| Bottom navigation | **PASS** |
| Bring Your Item banner → `/sell/new` | **PASS** |
| Footer help links | **PASS** |
| `/api/health` | **PASS** |
| Homepage landmark `Featured Listings` | **FAIL** | Empty catalog |

---

## 6. Responsive QA — PARTIAL

| Viewport | Status |
|----------|--------|
| Desktop (Chromium) | **FAIL** on Featured heading assertion (empty catalog) |
| iPhone SE / 15 / Pro Max / iPad | **FAIL** | Same |
| Android Chrome | **NOT RUN** |
| iPhone Safari | **NOT RUN** |
| Fold / landscape | **NOT RUN** |

---

## 7. Performance QA — PASS (repo gates)

| Gate | Status |
|------|--------|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test:ci` | **PASS** — 240/240 |
| Production console errors (homepage axe run) | **PASS** |
| Hydration mismatch | **NOT VERIFIED** on production |
| React warnings | **NOT VERIFIED** on production |

---

## 8. Database Cleanup — PASS

Removed **only** development/test records. No production orders, media buckets, or non-test user accounts were deleted.

---

## 9. Final Certification Checklist

| Requirement | Status |
|-------------|--------|
| Production homepage matches approved Enterprise Design | **PASS** (shell + sections) |
| No Runtime Test Listing | **PASS** |
| No Demo Listings (public) | **PASS** |
| No Placeholder Images | **PASS** |
| No Test Auctions | **PASS** |
| No Development Banners | **PASS** |
| No Broken Routes (automated smoke) | **PASS** |
| No Console Errors (axe homepage) | **PASS** |
| No Layout Shift | **NOT VERIFIED** |
| No Overflow | **NOT VERIFIED** |
| No Duplicate Navigation | **PASS** |
| All buttons verified | **PARTIAL** — nav + banner + footer automated |
| All redirects verified | **PASS** (E2E matrix) |
| Homepage production ready | **CONDITIONAL** — carousels empty until real listings published |

---

## Closed Beta Verdict

**Test/dev cleanup: COMPLETE.**  
**Enterprise homepage: LIVE and correct.**  
**Full carousel homepage QA: BLOCKED** until at least one legitimate published listing exists (carousels use `hideWhenEmpty`).

### Recommended before inviting beta users

1. Publish 1–3 real seed listings via `/sell/new` (seller account).
2. Re-run production Playwright homepage + responsive suites.
3. Manual spot-check on iPhone Safari and Android Chrome.

---

*End of Closed Beta Production Certification Report — ROVEXO v1.0*
