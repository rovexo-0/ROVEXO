# ROVEXO Phase 2 — Listing Card Revision Engineering Report

**Date:** 10 July 2026  
**Scope:** Homepage Listing Card design correction only  
**Version:** `phase-2-module-01-rev1` / `homepage-rev-2`  
**Production:** Untouched (`https://www.rovexo.co.uk`)

---

## Objective

Rebuild **only** the Listing Card on the Homepage to match the approved ROVEXO Vinted-inspired reference: image-first, compact info section, purple price, purple Platform Fee, gold seller rating, no badges, no Buyer Protection copy.

**Unchanged:** Header, Search, Category chips, Bottom Navigation, Routing, Backend, APIs, Database, 2-column grid.

---

## Preview Deployment

| Item | Value |
|------|-------|
| **Preview URL** | https://rovexo-c6op87zlr-rovexo.vercel.app |
| **Direct Homepage URL** | https://rovexo-c6op87zlr-rovexo.vercel.app/ |
| **Deployment ID** | `dpl_13M6jZKXKt3jsLDW3GVA6sbwsXih` |
| **Inspector** | https://vercel.com/rovexo/rovexo/13M6jZKXKt3jsLDW3GVA6sbwsXih |
| **Target** | Preview only (not production) |

**QR Code:** `reports/phase-2/module-01/homepage-preview-qr.png`  
**Screenshot:** `reports/phase-2/module-01/homepage-revision-screenshot.png`

---

## Files Modified

| File | Change |
|------|--------|
| `components/ui/ListingCard.tsx` | Homepage-specific compact body: Title → Condition → Price → Platform Fee + Rating row |
| `components/ui/ListingCard.module.css` | `rootHomepage`, `bodyHomepage`, `metaRowHomepage`, `platformFee`, gold star rating styles |
| `lib/listing-card/format.ts` | Added `formatPlatformFeeLine()` — `£X.XX Platform Fee` |
| `lib/listing-card/defaults.ts` | `showCondition: true`, `showPlatformFee: true`, `showBuyerProtection: false`, `showStatusBadge: false` |
| `styles/homepage-canonical.css` | Image-first overrides, shorter intrinsic height (268px), skeleton proportions |
| `components/homepage/canonical/CanonicalHomepage.tsx` | Version bump `phase-2-module-01-rev1` |
| `components/homepage/canonical/CanonicalFeedSkeleton.tsx` | Homepage skeleton proportions |
| `tests/home-listing-grid-lock.test.ts` | Assertions for compact homepage card contract |

---

## Card Layout (Homepage)

```
┌─────────────────────────┐
│                         │
│      Product Image        │  ~78% card height (grid 7.8fr)
│      (rounded corners)    │
│                    ♡    │
├─────────────────────────┤
│ Title (1–2 lines)         │
│ Condition (gray)          │  ~22% compact info
│ £Price (bold purple)      │
│ £0.55 Platform Fee  ⭐ 5.0│
└─────────────────────────┘
```

**Info order:** Title → Condition → Price → Platform Fee + Seller Rating (same row, rating bottom-right).

---

## Validation Checklist

| Requirement | Status |
|-------------|--------|
| Equal card heights | ✔ CSS grid + `aspect-ratio: 173/268` |
| Image-first layout (~75–80%) | ✔ `grid-template-rows: 7.8fr auto` |
| Compact information section | ✔ Reduced padding (8px), 2px gaps, no divider/footer |
| No Buyer Protection wording | ✔ Homepage uses `formatPlatformFeeLine` only |
| Purple price | ✔ `.priceHomepage` → `var(--ds-color-primary)` |
| Purple Platform Fee | ✔ `.platformFee` → `var(--ds-color-primary)` |
| Gold seller rating | ✔ Star fill `#f59e0b`, bottom-right in meta row |
| No badges | ✔ `showStatusBadge: false` on homepage props |
| 2-column grid unchanged | ✔ No grid CSS changes |
| SafeImage for product imagery | ✔ Unchanged |

---

## Verification Pipeline

| Step | Result |
|------|--------|
| `npm run lint` | Pass (1 pre-existing warning in `canonical-responsive.ts`) |
| `npm run typecheck` | Pass |
| `npm run test:ci` | **2454 tests passed** |
| `npm run build` | Pass |
| `npx vercel --yes` | Preview deployed successfully |

---

## Status

**Listing Card revision:** Deployed to Preview — awaiting owner approval.  
**Module 02 (My Account):** **STOPPED** — do not proceed until Homepage is approved.
