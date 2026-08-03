# ROVEXO Bundle Engine v1.0 — Phase 3 Functional Certification

| Field | Value |
|-------|-------|
| **Date** | 2026-08-01 |
| **Infra** | Owner CERTIFIED (accepted) |
| **Method** | Code-path audit + Vitest (40/40 PASS) · no schema/SQL/migrations · no DB mutations · no code changes |
| **Overall** | **FAIL — NOT 100%** |
| **Commit / Push / Deploy** | **FORBIDDEN** |

Vitest: `tests/bundle-*.test.ts` → **40 passed** (contracts only — not full functional PASS).

---

## Scoreboard

| Area | Result |
|------|--------|
| BUYER | **FAIL** |
| OFFERS | **FAIL** |
| CHECKOUT | **FAIL** |
| ORDERS | **FAIL** |
| RLS | **PASS** (Owner infra + SQL design + API buyer bind) |
| EVENTS | **FAIL** |
| PERFORMANCE | **FAIL** |

**Phase 3 ends only at 100% PASS → currently OPEN / FAIL.**

---

## BUYER

| Gate | Result |
|------|--------|
| Create Bundle | **PASS** |
| Add item | **FAIL** |
| Remove item | **FAIL** |
| Quantity validation | **PASS** |
| Stock validation | **PASS** |
| Duplicate prevention | **PASS** |
| Seller isolation | **PASS** |
| One active bundle rule | **PASS** |
| Bundle persistence | **FAIL** |

### Failed scenarios

#### B1 — Add item (optimistic mirror before authority)
- **Root cause:** Mirror write + sheet open before `/api/bundle` confirms; on `!ok` / catch, mirror is not rolled back (guest 401 leaves mirror-only success).
- **Files:** `features/product-detail/ProductDetailPage.tsx` · `persistAddToBundle`
- **Also:** `lib/bundle/bundle-mirror-v1.ts` · `addLineToBundleMirror`
- **Risk:** P0
- **Fix:** Write mirror only after `payload.ok`; on failure restore prior GET snapshot; guests must login before success UI.

#### B2 — Remove item (optimistic remove without rehydrate on `!ok`)
- **Root cause:** `removeBundleLineMirror` first; if `!res.ok` only catch toasts — non-OK HTTP leaves emptied mirror.
- **Files:** `features/bundle/BundleReviewPage.tsx` · `syncRemove`
- **Risk:** P0
- **Fix:** On any failure, `GET /api/bundle` + `writeBundleMirror`; toast always.

#### B3 — Bundle persistence (localStorage as de-facto UI authority on failure)
- **Root cause:** Same optimistic paths; SSOT forbids localStorage-as-authority.
- **Files:** `ProductDetailPage.tsx` · `BundleReviewPage.tsx` · `bundle-mirror-v1.ts`
- **Risk:** P0
- **Fix:** Server snapshot is sole UI truth after every mutation.

---

## OFFERS

| Gate | Result |
|------|--------|
| Create offer | **PASS** (via `offers` + message meta; see O3) |
| Counter offer | **FAIL** |
| Accept | **FAIL** |
| Decline | **PASS** |
| Expire | **FAIL** |
| Cancel | **FAIL** |
| Offer history | **FAIL** |
| Offer ordering | **PASS** |
| Offer state transitions | **FAIL** |
| Offer permissions | **PASS** (create/accept/decline ACL) |

### Failed scenarios

#### O1 — Counter drops bundle meta; amount vs primary listing price
- **Root cause:** `executeCounterOffer` does not call `mergeBundleIntoOfferMessage`; validates amount against listing `products.price`, not bundle `listSubtotal`.
- **Files:** `lib/offers/counter-offer-engine-v1.ts` · `executeCounterOffer`  
  Dead helper: `lib/bundle/bundle-payload-v1.ts` · `mergeBundleIntoOfferMessage`
- **Risk:** P0
- **Fix:** Preserve bundle meta on counter; validate vs bundle subtotal when meta present.

#### O2 — Accept → single-listing checkout (no bundle checkout)
- **Root cause:** Accept returns `/checkout/{primarySlug}?offerId=…`. `BUNDLE_BUY_NOW_ENGINE` requires `bundleId` and does not lock offer amount. Review discards bundle after offer send.
- **Files:** `app/api/offers/[id]/route.ts` (accept → `checkoutHref`)  
  `lib/bundle/bundle-buy-now-engine-v1.ts` · `BUNDLE_BUY_NOW_ENGINE`  
  `features/bundle/BundleReviewPage.tsx` (discard after offer)  
  `app/api/checkout/buy-now/route.ts` (bundle branch)
- **Risk:** P0
- **Fix:** Accept → bundle buy-now with locked offer amount; keep `offer_pending` / `bundle_offers`; do not discard authority on send.

#### O3 — `bundle_offers` table never written
- **Root cause:** `createBundleOffer` inserts classic `offers` only; `bundle_offers` unused; `bundles.status` never set to `offer_pending`.
- **Files:** `lib/bundle/bundle-offer-engine-v1.ts` · `createBundleOffer`
- **Risk:** P0
- **Fix:** Persist `bundle_offers` + status transitions per MES, or Owner revises SSOT (architecture change).

#### O4 — Expire
- **Root cause:** No writer/job sets offer/`bundle_offers`/`bundles` to `expired`.
- **Files:** (missing) — enum exists in migration / domain only
- **Risk:** P1
- **Fix:** TTL job or shared offer-expiry path, bundle-aware.

#### O5 — Cancel
- **Root cause:** No explicit cancel action on bundle/offer PATCH for cancel lifecycle.
- **Files:** `app/api/offers/[id]/route.ts` (no cancel action)
- **Risk:** P1
- **Fix:** Cancel → `cancelled` + bundle restore/event.

#### O6 — Offer history / hub does not surface bundle payload
- **Root cause:** No production parse of `__RVX_BUNDLE_V1__` in Conversation Hub / offers mapping; counters strip meta (O1).
- **Files:** inbox / offers consumers; `bundle-payload-v1.ts` parsers unused in hub
- **Risk:** P1
- **Fix:** Parse meta on history rows; keep meta through counters.

---

## CHECKOUT

| Gate | Result |
|------|--------|
| Bundle checkout (Buy Now list path) | **PASS** |
| `checkout_sessions.bundle_lines` | **PASS** |
| Totals | **PASS** |
| Currency | **PASS** |
| Stripe payload | **FAIL** |
| Snapshot integrity | **PASS** |
| Reservation integrity | **PASS*** (atomic intent + LIFO; not one DB txn — see Perf) |
| Payment transition | **PASS** |

### Failed scenarios

#### C1 — Stripe line/metadata not bundle-aware
- **Root cause:** `finalizeCheckoutSessionPayment` builds Stripe `line_items` from primary product title + session totals; metadata lacks `bundleId` / per-line ids.
- **Files:** `lib/orders/checkout.ts` · `finalizeCheckoutSessionPayment`
- **Risk:** P1 (charge can match session total; audit reconstruction fails)
- **Fix:** Metadata `bundleId` + line productId/qty; display name `Bundle (N items)`.

#### C2 — Checkout UI does not render `bundle_lines`
- **Root cause:** Checkout page/wizard loads single listing props; snapshot lines not shown.
- **Files:** `features/checkout/lib/load-checkout-page.ts` · `CheckoutWizardV1.tsx`
- **Risk:** P1
- **Fix:** When `bundle_lines` present, render locked item list only (no Checkout UI redesign beyond required list).

---

## ORDERS

| Gate | Result |
|------|--------|
| Bundle → Order transition | **PASS** |
| Order creation (multi `order_items`) | **PASS** |
| Conversation linkage | **PASS** |
| Bundle closure (`paid` + `order_id`) | **PASS** |
| Status transitions (full lifecycle) | **FAIL** |

### Failed scenarios

#### R1 — Incomplete bundle status transitions
- **Root cause:** Live path uses `active` → `checkout` → `paid`|restore `active` + `discarded`. `offer_pending` / `expired` / `cancelled` never set in code.
- **Files:** `lib/bundle/bundle-lifecycle-v1.ts` · `bundle-buy-now-engine-v1.ts` · `bundle-server-engine-v1.ts` · `bundle-domain-v1.ts`
- **Risk:** P1
- **Fix:** Wire offer/TTL/cancel transitions + events.

---

## RLS

| Gate | Result |
|------|--------|
| Buyer access | **PASS** |
| Seller access | **PASS** |
| Third-party denied | **PASS** |
| Anonymous denied | **PASS** |

Evidence: Owner Infrastructure CERTIFIED (RLS + policies + grants) + migration SELECT policies + `revoke public` / `grant authenticated` + `/api/bundle` binds `buyerId` from auth only. Writes via `service_role` by design.

---

## EVENTS

| Gate | Result |
|------|--------|
| `bundle_events` logging | **FAIL** |
| Payload integrity | **FAIL** |
| Actor integrity | **PASS** (where logged) |
| Chronological order | **PASS** (append-only + index design) |

### Failed scenarios

#### E1 — Checkout / payment / offer not audited in `bundle_events`
- **Root cause:** `appendEvent` only on create/add/qty/remove/discard. No events for checkout start, reserve, cancel, paid, offer lifecycle. Insert errors ignored.
- **Files:** `lib/bundle/bundle-server-engine-v1.ts` · `appendEvent`  
  Missing callers: `BUNDLE_BUY_NOW_ENGINE`, `restoreBundleAfterCheckoutCancel`, `markBundlePaidAfterOrder`, `createBundleOffer`
- **Risk:** P0
- **Fix:** Emit full event matrix with actor + payload; fail-closed or hard-log insert failures.

---

## PERFORMANCE

| Gate | Result |
|------|--------|
| No N+1 (integrity write-back) | **FAIL** |
| Indexes used (hot paths) | **PASS** (query shapes match Owner-certified indexes) |
| No unnecessary queries | **FAIL** |

### Failed scenarios

#### P1 — Per-line integrity UPDATE loop
- **Root cause:** `revalidateBundleForCheckout` updates each `bundle_items` row sequentially.
- **Files:** `lib/bundle/bundle-checkout-integrity-v1.ts` · `revalidateBundleForCheckout`
- **Risk:** P1
- **Fix:** Batched write-back / single RPC.

#### P2 — Sequential reservation/release I/O
- **Root cause:** Per-line reserve RPC + UPDATE; release same pattern.
- **Files:** `lib/bundle/bundle-reservation-engine-v1.ts` · `reserveBundleInventoryAtomic` / `releaseBundleInventoryAtomic`
- **Risk:** P1
- **Fix:** Keep fail-closed reserve order; batch reserved_quantity writes; prefer transactional RPC.

#### P3 — Duplicate hydrate / open-session scan
- **Root cause:** Review mounts GET + POST revalidate; Buy Now scans up to 20 open sessions in JS for bundle match.
- **Files:** `features/bundle/BundleReviewPage.tsx` · `lib/bundle/bundle-buy-now-engine-v1.ts` · `getOpenBundleSession`  
  `app/api/bundle/route.ts` revalidate branch
- **Risk:** P2
- **Fix:** Single revalidate response; indexed/session `bundle_id` column or JSON query.

---

## Aggregate

| Metric | Value |
|--------|-------|
| Functional gates FAIL | **17+** (see above) |
| Highest risk | **P0** — Add/Remove persistence · Counter/Accept offer · `bundle_offers` unused · Events gap |
| Phase 3 | **FAIL** |
| Next | Fix P0s → re-audit Phase 3 only · no freeze/commit/push/deploy until 100% PASS |
