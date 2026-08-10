# View Item + Bundle + Multi Stock — Implementation Status

**STATUS:** VIEW ITEM v2.0 **FROZEN** · Owner architecture (2026-08-10): **PDP Add to Bundle REMOVED** · **Store = canonical bundle creation**

| Surface | Contract |
|--------|----------|
| PDP | Buy Now + Make Offer only · `actions.addToBundle: false` |
| Store | Shop bundles · Create bundle · `StoreShopBundles` · one Bundle Engine |

SSOT: `lib/product-detail/product-page-canonical-freeze-v1.ts` · `lib/bundle/bundle-engine-v1.ts` · `lib/product-detail/view-item-bundle-multi-stock-v1.ts`

## Owner UI/UX FREEZE (2026-08-01)

SSOT: `lib/product-detail/view-item-ui-ux-freeze-v1.ts`  
Status: **FROZEN** · Bug fixes only · No redesign · No structural changes without Owner lift  

## P0 Product Information Hotfix (2026-08-01)

**Root cause:** Material / Season / Storage / Network / Compatibility were folded into the listing description on Sell publish (` Material: X.` / ` Season Rating: X.`) and were never mapped into Product Information rows. Only `products.color` / brand / condition were shown.

**Fix:** Configurable field map `PRODUCT_INFORMATION_FIELD_MAP_V1` + description note parser. Rows render only when populated, locked order, no Stock duplication.

## P0 Scroll Hotfix (2026-08-01)

**Root cause:** `ScrollContainer` applied `.rx-scroll-page--no-nav`, whose `padding-bottom: ~16px` loads *after* product-detail CSS and clobbered sticky action clearance (~140px+). Content after Condition was trapped under the fixed Buy Now / Make Offer bar.

**Fix:** Document scroll only (`<main className="pd-v1__main">` — no ScrollContainer). Sticky clearance restored with safety margin + defensive override in `mobile-scroll-v1.css`.

## View Item FINAL UI LOCK (Owner APPROVED)

SSOT: `lib/product-detail/view-item-final-ui-lock-v1.ts`

- Exact layout order (Seller before Description; Quantity after info rows)
- Stock once under price · no Stock in specification table
- No Delivery · Similar Items not mounted on View Item body
- Scroll clearance for sticky Buy Now / Make Offer
- **Add to Bundle on PDP: REMOVED** (Owner final architecture — Store is create surface)

## Modules

| Module | Status |
|--------|--------|
| 1–9 View Item + Bundle UI | View Item FROZEN · PDP create CTA removed · Store create canonical |
| 10 Bundle Offer Engine | Implemented — `POST /api/offers` + `bundle` body · ONE conversation |
| 11 Bundle Checkout | Implemented — Buy Now + `bundleLines` · session `bundle_lines` · Checkout list |
| 12 Bundle Order | Implemented — N `order_items` · ONE order/timeline/ship/chat |
| 13 Bundle Messages | Implemented — Conversation Hub Bundle Offer cards · existing hub CTAs |
| 14 Seller workflow | Reuses Orders / Hub / Label / Tracking (bundle title on order) |
| 15 Gates | TypeScript · ESLint (touched) · Vitest related — PASS · Owner visual pending |

## Ops required before live money path

Apply migration:

`supabase/migrations/20260801160000_checkout_sessions_bundle_lines_v1.sql`

Without `checkout_sessions.bundle_lines`, multi-item Buy Now session create fails closed.

## Canonical paths

- Store create: `features/store/components/StoreShopBundles.tsx`
- Review: `/bundle/review`
- Offer API: `app/api/offers/route.ts` + `lib/bundle/bundle-offer-engine-v1.ts`
- Payload: `lib/bundle/bundle-payload-v1.ts`
- Buy Now: `lib/checkout/engines/buy-now-engine-v1.ts`
- Order: `lib/orders/create-order-from-checkout-session.server.ts`
