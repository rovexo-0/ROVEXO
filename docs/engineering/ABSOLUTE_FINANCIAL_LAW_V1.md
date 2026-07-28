# ROVEXO Absolute Financial Law v1.0 (Freeze)

| Field | Value |
|-------|-------|
| STATUS | **PERMANENT LAW · FREEZE · SUPREME BLOOD XXIV** |
| Approved | 2026-07-23 |
| SSOT | `lib/supreme-blood-code-xxiv-v1.ts` |
| Buy Now Guard | `lib/checkout/buy-now-guard-v1.ts` |
| Rule | `.cursor/rules/absolute-financial-law-v1.mdc` |
| Sprint VI | **IN DEVELOPMENT** |

## Absolute

**No pass without payment flow pass.**  
**100% verified or 100% fail.**

```
1 CLICK = 1 PAYMENT = 1 ORDER = 1 TRANSACTION = 1 ESCROW = 1 COMPLETION
```

## Root Cause Detection Mode (BLOOD FIX v1.0)

```
BUY NOW
↓
MUST NEVER router.push("/checkout") WITHOUT PASSES
↓
IF FAIL → STOP
↓
NO PAYMENT · NO ORDER · NO CHECKOUT · NO REDIRECT · NO PRODUCTION PASS
```

Root cause previously masked:

Buy Now (not 100%) → `/checkout` loads → error handler → “Something went wrong.” → cause hidden

### Confirmed engineering root causes (2026-07-23 scan)

1. Blind `router.push(/checkout)` without server PASSes (Product / Hub / Cart) — fixed via `/api/checkout/buy-now` + `executeBuyNow`.
2. `/checkout/[slug]` loaded without re-running Buy Now preflight — fixed via `loadCheckoutPageProps` + `enforceBuyNowGuard`.
3. `notFound()` / FailClosed masked listing failures — replaced with `CheckoutGuardBlocked` + RVX codes.
4. `POST /api/orders/checkout` catch returned `Unable to start checkout.` — mapped to RVX.
5. Financial audit identity no-op in preflight — corrected to fee/total equality checks.
6. Double Confirm & Pay could insert a second `awaiting_payment` order — reuse open Stripe session / cancel stale.
7. Inbox `CheckoutHubSheet` embedded parallel checkout wizard — redirected through Buy Now guard to full-page checkout.

### Open Absolute Financial gap (not claimed PASS)

Master flow requires `CREATE_ORDER` before `LOAD_CHECKOUT`.

**P0 implementation (2026-07-23):** `BUY_NOW_ENGINE` creates DB `awaiting_payment` (= Owner `PENDING_PAYMENT`) order + transaction/session shells **before** redirect to `/checkout?orderId=…`. Confirm & Pay finalizes the same order (`finalizePendingOrderCheckoutSession`) — no second order. Auto-cancel = **15 minutes**.

Sprint VI remains **IN DEVELOPMENT** until Owner Certification.

## Master payment flow

Buy Now → Checkout Guard (16) → Lock listing → Verify listing · buyer · price · platform fee · shipping → Create order · transaction · checkout session → Financial Auditor PASS → Load `/checkout` → Payment method · Price summary → Confirm & Pay → Stripe payment → Payment success → Create escrow · order record → Seller/Buyer notifications → Transaction Hub → Completed

## Forbidden

- Buy Now → Error page with “Something went wrong.”
- Buy Now → Payment → Create order  
- Buy Now → Multiple transactions / payments / duplicate orders  
- Buy Now fail → `/checkout` → payment → success  
- Refresh / double-click / back → new payment  

## Checkout Guard (16 — all required)

listingID · buyerID · sellerID · orderID · transactionID · price · platform fee · shipping · currency · checkout session · payment session · listingLock · financialAudit · idempotency · buyerAuthenticated · sellerAcceptingOrders

One fail → STOP · no payment · no order · no transaction · no redirect

## Chain integrity

| If | Then |
|----|------|
| PRICE ≠ PAYMENT | STOP |
| PAYMENT ≠ ORDER | STOP |
| ORDER ≠ TRANSACTION | STOP |
| TRANSACTION ≠ ESCROW | STOP |
| ESCROW ≠ COMPLETION | STOP |

## Error codes (allowed)

| Code | Message |
|------|---------|
| RVX-2001 | Listing unavailable. |
| RVX-2002 | Buyer validation failed. |
| RVX-2003 | Seller validation failed. |
| RVX-2004 | Price validation failed. |
| RVX-2005 | Shipping unavailable. |
| RVX-2006 | Currency validation failed. |
| RVX-2007 | Listing lock failed. |
| RVX-2008 | Order creation failed. |
| RVX-2009 | Transaction failed. |
| RVX-2010 | Payment session failed. |
| RVX-2011 | Financial audit failed. |
| RVX-2012 | Idempotency failed. |

Forbidden: generic “Something went wrong.”

## Production law

No Checkout freeze until Buy Now → Checkout → Payment → Success → Escrow → Completed PASS = **100%**

## Supreme Blood Law

No fake pass · no partial pass · no financial bypass · no duplicate payments/orders/transactions · no payment without audit · no production without financial certification · **100% verified or 100% fail**
