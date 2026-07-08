# SHIPPO LIVE CERTIFICATION AUDIT

**Version:** 1.0  
**Generated:** 2026-07-06  
**Milestone:** Shippo Production Certification Pass  
**Status:** Certification complete — **awaiting explicit approval before commit, push, or deploy**

---

## Executive Summary

Live Shippo API authentication, shipment creation, and UK carrier rate retrieval were verified against the production GoShippo API using the server-side `SHIPPO_API_KEY` from `.env.local` (live key prefix confirmed; key value **not** recorded in this report).

The checkout **Delivery £0.00** issue was traced to a **checkout calculation / UI bug**: unresolved live shipping quotes were coerced to `£0.00` in the order summary. That bug is **fixed** in this certification pass.

The string **"Price at dispatch"** does **not** exist anywhere in the current TypeScript/TSX codebase. Listing pages show carrier name chips without prices (not live quotes). Seller-paid listings correctly use **"Shipping included"**.

| Area | Result |
|------|--------|
| Live API authentication | **PASS** |
| Live rate retrieval | **PASS** (Hermes UK £2.71, DPD UK — audit run) |
| Environment / security | **PASS** (webhook token recommended) |
| Checkout £0.00 bug | **FIXED** |
| End-to-end checkout live rates | **Conditional** — requires seller `shipping_addresses` row |
| Post-payment auto-label | **GAP** — seller-initiated today |
| Production readiness score | **86 / 100** |

---

## 1. Environment Validation

| Check | Result | Notes |
|-------|--------|-------|
| `SHIPPO_API_KEY` loaded | **PASS** | Present in `.env.local`; masked as `shippo_l…3769` in machine report |
| Server-side only | **PASS** | `lib/shipping/env.ts` uses `import "server-only"` |
| Never exposed to client | **PASS** | Checkout uses `/api/checkout/shipping-quotes`; no `SHIPPO_API_KEY` in client modules |
| No test-key fallback (runtime) | **PASS** | `getShippoApiKey()` throws when unset; no hardcoded live key in source |
| Playwright placeholder | **INFO** | `playwright.config.ts` uses `shippo_test_placeholder` only for E2E — not used in production |
| Vercel compatibility | **PASS** | `SHIPPO_API_KEY` + `SHIPPO_WEBHOOK_TOKEN` documented in `.env.example` |
| `SHIPPO_WEBHOOK_TOKEN` | **WARN** | Not set locally; required for production webhook auth |

**Vercel deployment variables**

```
SHIPPO_API_KEY=shippo_live_…        # Server only — Production + Preview as needed
SHIPPO_WEBHOOK_TOKEN=<random>       # Production required
```

Run locally: `npx tsx scripts/shippo-live-audit.ts` → `reports/shippo-live-audit.json`

---

## 2. Shippo Connection (Live API)

Authentication **stopped only if auth failed** — auth succeeded.

| Step | Request | Response (audit run) | Latency |
|------|---------|----------------------|---------|
| Authentication | `GET /shipments/?results=1&page=1` | HTTP 200 | 226 ms |
| Address validation | `POST /addresses/` ×2 | Standalone objects not returned; shipment inline addresses accepted | 217 ms |
| Shipment creation | `POST /shipments/` | `shipment_id=82ea3eed…` | 746 ms |
| Rate retrieval | Rates in shipment | Hermes UK ParcelShop Drop-Off **£2.71** | (in shipment) |
| Carrier availability | — | **DPD UK**, **Hermes UK** | — |
| Label generation | `POST /transactions/` | **Wiring verified**; live purchase skipped (avoids carrier charges) | — |
| Tracking | `POST /tracks/` | **Wiring verified**; needs purchased label | — |
| Webhook compatibility | `POST /api/webhooks/shippo` | Token header / Bearer / query param; dev bypass when unset | — |

**Machine-readable report:** `reports/shippo-live-audit.json` — `"pass": true`

---

## 3. Shipping Pipeline Audit

```
Buyer
  → Checkout (`app/checkout/[slug]/page.tsx`)
  → Address complete (`use-checkout-form.ts`)
  → POST `/api/checkout/shipping-quotes` (auth required)
  → `fetchCheckoutCarrierQuotes()` (`lib/checkout/shipping-quotes.server.ts`)
  → Seller collection address from `shipping_addresses` (address_type = shipping)
  → `fetchShippingQuotesServer()` → Shippo `POST /shipments/`
  → Carrier rates → `CheckoutCarrierQuote[]`
  → Buyer selects rate (`CheckoutDeliverySection.tsx`)
  → POST `/api/orders/checkout` with `shippingQuoteId`
  → `resolveLiveDeliveryPrice()` re-validates quote server-side
  → Stripe session (item + protection + delivery line items)
  → Payment → `fulfillOrderFromStripeSession()` → status `awaiting_shipment`
  → Label: seller flow via `/api/shipping/quotes` + `generateOrderShippingLabel()` (not auto on payment)
  → Tracking: Shippo webhooks `track_updated` / `transaction_*` → `lib/shipping/shippo/webhooks.ts`
  → Timelines: `lib/orders-engine/timeline.ts`, `lib/shipping-engine/timeline.ts`
```

### Stage verification

| Stage | File(s) | Verified |
|-------|---------|----------|
| Checkout gate | `app/checkout/[slug]/page.tsx` | `liveShippingEnabled={isShippoConfigured()}` |
| Client quotes | `lib/checkout/delivery.ts` | Fetches server route only |
| Quote API | `app/api/checkout/shipping-quotes/route.ts` | Auth + Zod validation |
| Shippo client | `lib/shipping/pricing/shippo-client.ts` | `ShippoToken` auth, no-store |
| Order creation | `lib/orders/checkout.ts` | Blocks if `deliveryPrice == null` (non-free listings) |
| Webhooks | `app/api/webhooks/shippo/route.ts` | 401 on bad token in production |
| Health | `app/api/shipping/shippo/health/route.ts` | Auth-gated health check |

---

## 4. Delivery £0.00 — Root Cause (Verified)

### Symptom

Order summary showed **Delivery £0.00** while the delivery section was still loading live quotes or showed **"Unable to retrieve shipping price."**

### Root cause: **Checkout calculation / UI bug**

1. `getDeliveryPrice()` correctly returns `null` when no quote is selected (`lib/checkout/delivery.ts`).
2. `calculateOrderTotals(itemPrice, null)` used `delivery ?? 0`, treating unresolved quotes as **£0.00** (`lib/orders/pricing.ts`).
3. `OrderSummary` always rendered `totals.delivery` as a price (`features/checkout/components/OrderSummary.tsx`).

This was **not** a missing Shippo request, marketplace rule, or Shippo misconfiguration — it was **misleading zero-default UI math**.

### Secondary causes (empty live rates)

When rates do not appear:

| Cause | Mechanism |
|-------|-----------|
| Missing seller dispatch address | `resolveSellerCollectionAddress()` returns `null` → `{ live: true, options: [] }` |
| Incomplete buyer address | `shouldFetchLiveQuotes` false until address fields filled |
| Invalid addresses | `ShippingService.validateAddress` fails → empty options |
| Shippo not configured | `{ live: false, options: [] }` |

### "Price at dispatch"

**Not present** in current codebase (grep across TS/TSX). Closest UI:

- Listing **Available Delivery**: carrier chips **without prices** (`ProductDelivery.tsx`)
- Seller label card: *"Add the tracking number after dispatch"* (`LabelCard.tsx`)
- Status labels: *"Awaiting dispatch"* (shipping engine registry)

If production still shows "Price at dispatch", it is likely a **stale deployment**, not current source.

---

## 5. Fixes Applied (This Certification)

| File | Change |
|------|--------|
| `lib/orders/pricing.ts` | `null` delivery = pending; excluded from total until resolved |
| `lib/orders/types.ts` | Optional `deliveryPending` on `OrderTotals` |
| `features/checkout/components/OrderSummary.tsx` | Shows **"Calculated at checkout"** when pending; **"Shipping included"** when seller-paid |
| `features/checkout/components/CheckoutPage.tsx` | Passes `listingOffersFreeDelivery` to summary |
| `tests/commerce.test.ts` | Asserts pending delivery excludes delivery from total |
| `scripts/shippo-live-audit.ts` | Live API certification runner |
| `scripts/shippo-certification-screenshots.mjs` | Checkout screenshot capture |

**Prior fix (already in tree):** Client no longer gates quotes on `process.env.SHIPPO_API_KEY`; server passes `liveShippingEnabled` from `isShippoConfigured()`.

---

## 6. Live Rates at Checkout

When Shippo is configured **and** the seller has a shipping address **and** the buyer completes a valid UK address:

- Checkout POSTs to `/api/checkout/shipping-quotes`
- UI shows carrier, service, ETA, and **live price** per option
- Default cheapest quote auto-selected
- Total updates when selection changes
- Pay button disabled until `deliveryResolved` (`use-checkout-form.ts`)

**Marketplace rule:** `products.shipping_price === 0` → `freeDelivery: true` → **"Shipping included"** (no live quote fetch).

---

## 7. Labels

| Requirement | Status |
|-------------|--------|
| Shippo label API wired | **PASS** — `purchaseShippoLabel()` → `POST /transactions/` |
| Stored in database | **PASS** — `saveShippingLabel()` in `lib/shipping/store.ts` |
| Automatic after payment | **GAP** — `fulfillOrderFromStripeSession()` does not call `generateOrderShippingLabel()` |
| Seller workflow | Seller uses shipping engine / order shipping quotes API post-sale |

**Recommendation:** Hook label purchase to `fulfillOrderFromStripeSession` when `shippingQuoteId` is stored on the order (future pass; no schema change required if metadata already available).

---

## 8. Tracking & Webhooks

| Component | Status |
|-----------|--------|
| `registerShippoTrack` / `getShippoTrack` | Wired |
| Webhook route | `app/api/webhooks/shippo/route.ts` |
| Events handled | `track_updated`, `transaction_created`, `transaction_updated` |
| Order timeline sync | `updateShippingRecordStatus()` → buyer/seller/admin views via shipping engine reader |
| Webhook token in production | **Set `SHIPPO_WEBHOOK_TOKEN` on Vercel** |

---

## 9. Error Handling (Code Review + Tests)

| Scenario | Behaviour |
|----------|-----------|
| Invalid address | Empty quote list; checkout blocked at pay |
| Carrier unavailable | `UNAVAILABLE_SHIPPING_PRICE_LABEL` shown |
| API error | `resolveLiveDeliveryQuotes` → `{ live: false, options: [] }` |
| Rate unavailable at pay | Server returns *"Unable to retrieve shipping price."*; inventory released |
| Webhook failure | 4xx/5xx JSON; no crash |
| Duplicate shipment | New shipment per quote request (Shippo object IDs) |
| Cancelled order | `cancelPendingOrder()` releases inventory |
| Refund | Stripe/session layer; order status `cancelled` path exists |

**Tests:** `tests/shipping-shippo.test.ts`, `tests/shippo-production-certification.test.ts`, `tests/commerce.test.ts` — **33/33 pass** (certification run).

---

## 10. Performance (Live Audit)

| Operation | Latency |
|-----------|---------|
| Auth (`GET /shipments`) | 226 ms |
| Address validation | 217 ms |
| Shipment + rates | 746 ms |
| **Typical checkout quote round-trip** | **~1–1.5 s** (server-side, UK domestic) |

No optimization required for certification; monitor P95 on Vercel after deploy.

---

## 11. Security Audit

| Check | Result |
|-------|--------|
| API key server-only | **PASS** |
| No client secrets | **PASS** |
| No key in logs / audit output | **PASS** (masked) |
| Webhook verification | **PASS** (when token set) |
| Auth on quote + checkout routes | **PASS** |

---

## 12. Production Validation Checklist

### Local

- [x] `SHIPPO_API_KEY` in `.env.local`
- [x] `npx tsx scripts/shippo-live-audit.ts` → PASS
- [x] Checkout summary no longer shows false £0.00
- [ ] Seller test account has `shipping_addresses` row (`address_type = shipping`)
- [ ] `SHIPPO_WEBHOOK_TOKEN` set

### Vercel Preview

- [ ] Add `SHIPPO_API_KEY` to Preview env
- [ ] Add `SHIPPO_WEBHOOK_TOKEN`
- [ ] Register webhook URL: `https://<preview>/api/webhooks/shippo`
- [ ] Test checkout with live listing + seller address

### Vercel Production

- [ ] `SHIPPO_API_KEY` (live) in Production only
- [ ] `SHIPPO_WEBHOOK_TOKEN` in Production
- [ ] Webhook URL: `https://www.rovexo.co.uk/api/webhooks/shippo`
- [ ] Confirm no `NEXT_PUBLIC_*` Shippo variables
- [ ] Smoke: health `GET /api/shipping/shippo/health` (authenticated)

---

## 13. Screenshots

Captured at `reports/shippo-certification/screenshots/` (dev server `http://127.0.0.1:3025`):

| File | Description |
|------|-------------|
| `01-checkout-before-rates.png` | Checkout before address / quotes |
| `02-checkout-address-entered.png` | Address fields populated |
| `03-checkout-after-live-rates.png` | After quote fetch window |
| `05-order-summary.png` | Order summary panel |

**Note:** Demo listing checkout may not show live carrier rows without authenticated session + seller shipping address in database. Re-capture after seeding seller dispatch address for full carrier-selection screenshot.

Label and tracking screenshots require a completed paid order with Shippo label purchase — deferred to avoid live label charges in this audit.

---

## 14. Known Issues

1. **Seller dispatch address required** — No rates if seller lacks `shipping_addresses` (`address_type = shipping`).
2. **Hardcoded `parcelTier: "small_parcel"`** in checkout quotes — ignores product `parcel_size`.
3. **`resolveLiveDeliveryPrice` re-fetches all quotes** at payment — rate expiry risk under slow checkout.
4. **Post-payment label not automatic** — seller must generate via shipping engine.
5. **`SHIPPO_WEBHOOK_TOKEN` unset** locally — mandatory for production webhooks.
6. **Standalone `/addresses/` validation** returned no objects in audit while inline shipment succeeded — monitor for UK address edge cases.

---

## 15. Recommendations

1. **Deploy checkout £0.00 fix** (files listed in §5) after approval.
2. Set **`SHIPPO_WEBHOOK_TOKEN`** on Vercel Production and register Shippo webhook.
3. Ensure every selling account completes **seller shipping address** onboarding before listing goes live.
4. Store **`shippingQuoteId` / Shippo rate ID on order** and auto-purchase label in `fulfillOrderFromStripeSession`.
5. Map **`products.parcel_size`** → `parcelTier` in `shipping-quotes.server.ts`.
6. Re-run `node scripts/shippo-certification-screenshots.mjs` with `AUDIT_BASE_URL` + authenticated session for carrier-selection and label screenshots.

---

## 16. Production Readiness Score

| Category | Weight | Score |
|----------|--------|-------|
| Authentication & live API | 20% | 20/20 |
| Environment & security | 15% | 13/15 (webhook token) |
| Checkout rates & UX | 25% | 22/25 (£0.00 fixed; seller address dependency) |
| Labels & tracking | 20% | 14/20 (no auto-label) |
| Webhooks & ops | 10% | 7/10 |
| Tests & documentation | 10% | 10/10 |

### **Total: 86 / 100**

**Certification verdict:** Live Shippo integration is **production-viable** for rate retrieval and authenticated checkout pricing. Remaining gaps (webhook token, seller address prerequisite, post-payment label automation) should be closed before declaring **100%** shipping automation.

---

## STOP RULE ACKNOWLEDGMENT

- **No git commit** performed  
- **No git push** performed  
- **No Vercel production deploy** performed  

Awaiting your explicit approval before commit, push, or deploy.
