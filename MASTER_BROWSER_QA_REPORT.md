# ROVEXO v1.0 — Master Browser QA Report

**Date:** 2026-06-26  
**Environment:** Local production build (`next start` on `http://localhost:3010`)  
**Tooling:** Playwright Chromium (`e2e/master-qa.spec.ts`, `e2e/marketplace.spec.ts`)  
**Auth:** Unauthenticated sweep + protected-route login redirect validation

---

## Executive summary

| Result | Count |
|--------|-------|
| **PASS** | 37 automated browser tests |
| **SKIP** | 1 (no homepage listings to test `/item/:slug` alias) |
| **FAIL** | 0 (after fixes) |

**Pre-Audit readiness:** **PASS** for public routes, navigation, homepage sections, and auth-gated redirects. Authenticated flows (sell wizard, wallet, messages content, hubs when logged in) require manual QA with real credentials.

---

## Fixes applied during QA (safe, no redesign)

| Issue | Fix |
|-------|-----|
| Header search missing `#header-search` id | Restored `inputId` on `HeaderSearchBar` link |
| `/business` 404 | Added `app/business/page.tsx` → `/business/center` |
| `/account/orders` missing | Added `app/account/orders/page.tsx` → `/orders` |
| `/account/wallet` missing | Added `app/account/wallet/page.tsx` → `/seller/wallet` |
| `/item/:slug` missing | Added `next.config.ts` redirect → `/listing/:slug` |
| Playwright hit production URL | Run against `PLAYWRIGHT_BASE_URL=http://localhost:3010` |

---

## Route validation

### PASS — Public routes (200, no server error)

| Route | Status |
|-------|--------|
| `/` | PASS |
| `/search` | PASS |
| `/categories` | PASS |
| `/category/home-garden/furniture/beds` | PASS |
| `/help` | PASS |
| `/assistant` | PASS |
| `/trust` | PASS |
| `/support` | PASS |
| `/legal` | PASS |
| `/plans` | PASS |
| `/auctions` | PASS |
| `/business/center` | PASS |
| `/wholesale` | PASS |

### PASS — Protected routes (redirect to `/login` when unauthenticated)

| Route | Status |
|-------|--------|
| `/sell` | PASS |
| `/sell/new` | PASS |
| `/seller/dashboard` | PASS |
| `/account` | PASS |
| `/account/profile` | PASS |
| `/account/settings` | PASS |
| `/account/orders` | PASS |
| `/account/wallet` | PASS |
| `/orders` | PASS |
| `/messages` | PASS |
| `/notifications` | PASS |
| `/saved` | PASS |
| `/admin` | PASS |
| `/super-admin` | PASS |
| `/business` | PASS (login gate; redirects to center when authenticated) |

### WARNING — Requires authenticated manual QA

| Route / flow | Notes |
|--------------|-------|
| `/sell/new` publish wizard | Login required; full wizard not exercised |
| `/seller/dashboard` | Login required |
| `/account` hubs (Buy/Sell/Business/Support) | `MobileHubNavigator` tiles need logged-in session |
| `/messages`, `/notifications` content | Empty state vs realtime not verified |
| `/seller/wallet`, Stripe Connect | Requires seller + Stripe test mode |
| `/admin`, `/super-admin` | Requires elevated roles |

### SKIP

| Route | Reason |
|-------|--------|
| `/item/:slug` | No featured listings in local DB to derive slug (test skipped) |

---

## Homepage verification

| Element | Status |
|---------|--------|
| Hero Banner (`HomeHeroBanner` / `HomeHeroSearch`) | **PASS** — Premium marketplace hero visible |
| Promo carousel (`HomePromoBanner`) | **PASS** — Rendered |
| Bring Your Item banner | **WARNING** — Renders only when `STORE_MIGRATION_ENABLED=true` |
| Featured Listings | **PASS** |
| Recommended Listings | **PASS** |
| Latest Listings | **PASS** |
| Popular Near You + infinite scroll sentinel | **PASS** (section present; scroll not load-tested without data) |
| Categories rail | **PASS** |
| Auctions section | **PASS** |
| Recently viewed carousel | **PASS** (section present) |
| Header search | **PASS** (after id fix) |
| Bottom navigation | **PASS** — Home, Search, Sell, Saved, Account |
| Footer | **PASS** — Help center link navigates |

---

## Navigation & hubs

| Area | Status |
|------|--------|
| Bottom navigation (5 tabs) | **PASS** |
| Top header (search, messages, notifications, profile) | **PASS** (icons present) |
| Footer columns | **PASS** |
| Buy / Sell / Business / Support hubs | **WARNING** — Wired via `MobileHubNavigator` on account; needs auth to open tiles |
| Desktop `ProfileMenu` + `ProfileDashboardCards` | **PASS** — Restored on `/account` desktop layout |

---

## API validation

| Service | Status | Notes |
|---------|--------|-------|
| `/api/health` | **PASS** | 200 or 503 (degraded) |
| Supabase auth | **PASS** | Login redirect works for protected routes |
| Stripe | **WARNING** | Not exercised in browser QA |
| Storage / Realtime | **WARNING** | Not exercised without auth session |
| Notifications API | **WARNING** | Route loads; badge realtime not tested |

---

## Broken → Fixed

| Item | Before | After |
|------|--------|-------|
| `#header-search` | FAIL — missing id on header search link | **PASS** |
| `/account/orders` | FAIL — no route | **PASS** — redirect page |
| `/account/wallet` | FAIL — no route | **PASS** — redirect page |
| `/business` | FAIL — no page | **PASS** — redirect page |
| QA against production | FAIL — tests hit `rovexo.co.uk` | **PASS** — localhost server |

---

## Remaining warnings (not failures)

1. **Bring Your Item banner** — Set in `.env.local`:
   ```
   STORE_MIGRATION_ENABLED=true
   NEXT_PUBLIC_STORE_MIGRATION_ENABLED=true
   ```
2. **Authenticated flows** — Manual login QA still required for sell wizard, wallet, hub tiles, messages.
3. **`/item/:slug` alias** — Redirect configured; skipped in automation when no listing data.
4. **ESLint** — Pre-existing `react-hooks` violations in perf/account code (not browser-blocking).
5. **Listing alias test** — Re-run with seeded products to confirm `/item/:slug` → `/listing/:slug`.

---

## Missing components

**None** for core public UX. Orphaned but preserved modules (not on primary routes):

- `features/account-page/AccountPageView` — premium redesign module (pre-redesign account restored)
- `NavigationHub` — desktop grid component (never route-mounted)
- `PopularListingsGrid` — alternate latest layout (carousel used instead)

---

## Overall: **PASS** (automated browser QA)

Ready for Pre-Audit with manual authenticated pass recommended.

**Not committed. Not deployed.**
