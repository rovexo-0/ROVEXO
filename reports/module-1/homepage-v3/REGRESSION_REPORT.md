# Homepage V3.0 — Regression Report

**Date:** 2026-07-06

## Build & typecheck

| Check | Result |
|-------|--------|
| `npm run build` | PASS (Next.js 16.2.9, TypeScript clean) |
| ESLint (V3 files) | PASS (0 errors) |

## Homepage-specific tests (12 files, 69 tests)

| Suite | Result |
|-------|--------|
| `home-enterprise-migration.test.ts` | PASS |
| `home-listing-grid-lock.test.ts` | PASS |
| `single-source-of-truth.test.ts` | PASS |
| `home-hydration.test.ts` | PASS |
| `header.test.ts` | PASS |
| `homepage-feed-ranking.test.ts` | PASS |
| `homepage-launch-recovery.test.ts` | PASS |
| `homepage-engineering-director.test.ts` | PASS (100% scan) |
| `homepage-icon-system.test.ts` | PASS |
| `enterprise-ui-system.test.ts` | PASS |
| `buyer-dashboard.test.ts` | PASS |
| `hero-banner-premium.test.ts` | PASS |

## Full vitest suite

| Metric | Value |
|--------|-------|
| Total | 2268 tests |
| Passed | 2260 |
| Failed | 6 (pre-existing, unrelated to homepage) |
| Skipped | 2 |

### Pre-existing failures (not introduced by V3)

| Test | Cause |
|------|-------|
| `account-hydration.test.ts` | Import tile removed from account nav |
| `command-os-v4.test.ts` | Command OS route not in super-admin nav |
| `enterprise-performance.test.ts` | Performance surface audit threshold |
| `sell-title-input-freeze.test.ts` | Category suggest policy flag |
| `super-admin-premium.test.ts` | Mission control readiness |
| `transaction-mode-certification.test.ts` | `capabilities.buyerProtection` reference |

## Backend / API regression

| Area | Status |
|------|--------|
| Routes (`/`, `/search`, `/categories`, etc.) | Unchanged |
| `fetchProducts()` sort modes | Unchanged — wired to V3 sections |
| `fetchHomepageFeed()` + `/api/homepage/feed` | Unchanged — used by `HomepageV3Feed` |
| `fetchShowcaseSellerSections()` | Unchanged — used by `HomepageV3Showcase` |
| Supabase / auth / Stripe / Shippo | Unchanged |
| SEO (`homePageJsonLd`, metadata) | Unchanged — feed items still passed to JSON-LD |
| `BetaAppShell` + bottom nav | Unchanged |

## Visual regression

- 28 screenshots captured across mobile, tablet, desktop, Android, iPhone, light/dark
- No layout overflow or clipping detected in automated capture
- Sticky header scroll shadow activates on scroll

## Account architecture

- No separate buyer/seller accounts introduced
- BYI CTA links to unified import flow (`BRING_YOUR_ITEM_PATH`)

**No commit, push, or deploy performed. Awaiting user approval.**
