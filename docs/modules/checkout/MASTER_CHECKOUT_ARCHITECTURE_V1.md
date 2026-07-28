# ROVEXO v1.0 — MASTER_CHECKOUT_ARCHITECTURE

**DOCUMENT TYPE:** Master Engineering Specification  
**STATUS:** CANONICAL  
**VERSION:** v1.0  
**OWNER:** ROVEXO  

**PURPOSE:** Define the ONLY valid Checkout Architecture for ROVEXO.  
This document replaces every previous Checkout architecture that creates Orders or Transactions before Payment Success. No alternative implementations are allowed.

---

## CORE PRINCIPLE

THE SELLER MUST NEVER RECEIVE AN ORDER UNTIL THE PAYMENT HAS BEEN SUCCESSFULLY COMPLETED.

THEREFORE: NO ORDER · NO TRANSACTION · NO ESCROW · NO SHIPPING · NO SELLER NOTIFICATION may exist BEFORE PAYMENT SUCCESS.

---

## CANONICAL OBJECT LIFECYCLE

```
Published Listing
→ BUY NOW
→ Checkout Validation
→ Inventory Reserved
→ Checkout Session Created
→ Stripe Payment
→ Payment Success
→ Create Order
→ Create Transaction
→ Open Escrow
→ Mark Listing Sold
→ Notify Seller
→ Shipping → Delivery → Completed
```

### Before Payment Success — ALLOWED

- Listing · Reserved Listing · Checkout Session · Payment Intent · Stripe Checkout Session

### Before Payment Success — FORBIDDEN

- Order · Transaction · Escrow · Shipping · Seller Notification · Financial Ledger  
- `awaiting_payment` order · `awaiting_payment` transaction · seller-visible unpaid order

### Payment Failed / Cancelled / Timeout / Browser Close / Stripe / Network / Unknown

```
release_product_inventory()
→ status=published · reserved=false
→ Destroy Checkout Session
→ NO Order · NO Transaction · NO Escrow · NO Seller Notification
→ END
```

### Payment Success (only after webhook + verification)

```
Verify webhook · payment status · PI · amount · currency · buyer · listing · reserved · session · idempotency
→ CREATE ORDER
→ CREATE TRANSACTION
→ OPEN ESCROW
→ mark_product_sold()
→ status=sold · reserved=false
→ LOCK FINANCIAL RECORDS
→ NOTIFY SELLER
→ OPEN TRANSACTION HUB
→ CREATE SHIPPING JOB
→ SUCCESS
```

### Required layers (single responsibility)

Inventory Engine → Checkout Session Engine → Payment Engine → Order Engine → Transaction Engine → Escrow Engine → Shipping Engine

---

## MIGRATION PLAN (NO CODE IN THIS PHASE)

### CURRENT ARCHITECTURE (legacy Blood XXIV)

```
BUY NOW
→ validate
→ reserve (status=reserved)
→ CREATE ORDER (awaiting_payment)          ← FORBIDDEN under Master Architecture
→ CREATE TRANSACTION shell                 ← FORBIDDEN
→ mint checkout/session shells bound to orderId
→ redirect /checkout?orderId=…
→ Confirm & Pay → Stripe session on existing order
→ webhook / fulfill → mark paid → escrow → mark_product_sold
```

Reservation SSOT today: `orders.awaiting_payment` + `orders.reserved_until`  
(`lib/inventory/inventory-engine-v1.ts`)

### CANONICAL ARCHITECTURE (target)

```
BUY NOW
→ Checkout Guard (listing/buyer/seller/inventory/price/fee/shipping)
→ reserve_product_inventory() → reserved
→ CREATE CHECKOUT SESSION (only temporary object)
→ CREATE STRIPE PI + Stripe Checkout Session (metadata: sessionId, listingId, buyerId, totals)
→ redirect /checkout?cs=… (NO orderId)
→ Payment fail/timeout → release + destroy session
→ Payment success webhook → verify → CREATE ORDER + TRANSACTION + ESCROW + mark_product_sold → notify → hub → shipping
```

---

## 1. AFFECTED MODULES

| Module | Role in migration |
|--------|-------------------|
| Inventory Engine | Keep reserve/release/mark_sold; change reservation SSOT off orders |
| Buy Now / Checkout Guard | Stop requiring order/transaction before checkout |
| Checkout Session Engine | Become durable SSOT temporary object (replace order-as-reservation) |
| Payment Engine / Stripe | Bind sessions to checkoutSessionId, not orderId |
| Order Engine | Create **only** after payment success |
| Transaction Engine | Create **only** after payment success (durable) |
| Post-payment / Escrow / Wallet | Trigger after order create on paid path |
| Shipping | Unchanged timing (after paid) — verify no early jobs |
| Auto-cancel / Cron | Expire checkout sessions + unlock inventory (**120s Absolute Law**) |
| Webhooks | Create order on payment success; cancel session on fail/expire |
| Checkout UI / Success / DONE gate | Load by sessionId; success by paid orderId only |
| Conversation Hub / Inbox | Open only after paid order exists |
| Orders UI / Seller surfaces | Never see unpaid / awaiting_payment from Buy Now |
| Demo / Virtual payments | Same lifecycle without Stripe |
| Tests / Certification | Rewrite Blood XXIV order-before-checkout contracts |

---

## 2. FILES TO MODIFY (primary)

### Engines / SSOT

- `lib/checkout/engines/buy-now-engine-v1.ts`
- `lib/checkout/engines/order-engine-v1.ts`
- `lib/checkout/engines/transaction-engine-v1.ts`
- `lib/checkout/engines/checkout-session-engine-v1.ts` *(upgrade from in-memory shell → durable)*
- `lib/checkout/engines/auto-cancel-engine-v1.ts`
- `lib/checkout/engines/listing-lock-engine-v1.ts` *(keep; wire session expiry)*
- `lib/checkout/engines/status-map-v1.ts`
- `lib/checkout/engines/index.ts`
- `lib/checkout/buy-now-guard-v1.ts`
- `lib/checkout/buy-now-absolute-law-v1.ts`
- `lib/checkout/checkout-absolute-law-v1.ts`
- `lib/checkout/done-readiness-gate-v1.ts`
- `lib/inventory/inventory-engine-v1.ts` *(reservation SSOT)*
- `lib/supreme-blood-code-xxiv-v1.ts` *(align Absolute Financial Law text)*

### Orders / Payment / Stripe

- `lib/orders/checkout.ts` *(finalizePendingOrderCheckoutSession → session-based)*
- `lib/orders/post-payment.server.ts` *(create order+tx+escrow+sold on confirmed payment)*
- `lib/stripe/webhook-handler.ts`
- `app/api/webhooks/stripe/route.ts` / `app/api/stripe/webhook/route.ts`
- `app/api/checkout/buy-now/route.ts`
- `app/api/orders/checkout/route.ts`
- `app/api/checkout/done-ready/route.ts`

### UI / Routes

- `features/checkout/hooks/use-buy-now-navigation.ts`
- `features/checkout/hooks/use-checkout-form.ts`
- `features/checkout/lib/load-checkout-page.ts`
- `features/checkout/components/CheckoutPage.tsx`
- `features/checkout/components/CheckoutWizardV1.tsx` *(query: session, not order)*
- `features/checkout/components/CheckoutSuccessView.tsx`
- `app/checkout/[slug]/page.tsx` / success pages
- Inbox / Conversation Hub entry after paid only (verify callers)

### Database

- **New migration (future implementation phase):** `checkout_sessions` table (or equivalent) with TTL  
- Types: `lib/supabase/types/database.ts`  
- Cron: `vercel.json` cleanup schedule (120s Absolute Law enforced via lazy expire on Buy Now / load; Hobby daily cron alone is insufficient)

### Tests (non-exhaustive)

- `tests/buy-now-*.ts`, `tests/checkout-*.ts`, `tests/inventory-engine-v1.test.ts`
- Blood XXIV / Absolute Law tests that assert order-before-checkout

---

## 3. FUNCTIONS TO MODIFY / REPLACE

| Current | Target |
|---------|--------|
| `BUY_NOW_ENGINE` | Validate → reserve → **createCheckoutSession** → Stripe shells → `/checkout?cs=` — **no** `ORDER_ENGINE_createPendingPayment` |
| `ORDER_ENGINE_createPendingPayment` | **Remove from Buy Now path**; replace with post-payment `ORDER_ENGINE_createPaid` (new) |
| `ORDER_ENGINE_findOpenByIdempotency` | Find open **checkout session** by buyer+listing |
| `TRANSACTION_ENGINE_createPendingPayment` | Remove pre-payment; create durable tx only after paid |
| `CHECKOUT_SESSION_ENGINE_create` | Persist session row + expiresAt; not order-bound mint only |
| `PAYMENT_INTENT_ENGINE_createShell` | Bind to `checkoutSessionId`, not `orderId` |
| `failAfterLock` | Unlock + destroy checkout session (no order to cancel) |
| `AUTO_CANCEL_ENGINE_*` | Expire **sessions** + `release_product_inventory`; stop relying on `awaiting_payment` orders as reservation |
| `cancelPendingOrder` | Replace with `cancelCheckoutSession` (+ unlock); keep for legacy cleanup during cutover |
| `finalizePendingOrderCheckoutSession` | `finalizeCheckoutSessionPayment` |
| `fulfillOrderFromStripeSession` / `completePaidOrderFulfillment` | On first paid event: create order+transaction+escrow+mark_sold (idempotent) |
| `loadCheckoutPage` | Require `cs` / session — **forbid** requiring `orderId` for unpaid checkout |
| `toBuyNowPublicMessage` / DONE gate | Session-based readiness until order exists post-pay |
| `isPurchasable` usage in Confirm & Pay | Allow reserved **for owning checkout session** (fix refresh FAIL) |

---

## 4. DEPENDENCY GRAPH

```
Inventory (reserve/release/sold)
    ↑
Checkout Session (TTL, amounts, stripe ids)  ← ONLY pre-pay durable object
    ↑
Payment / Stripe (PI + Checkout Session)
    ↑
Webhook verify (idempotent)
    ↑
Order Engine (create once paid)
    ↑
Transaction Engine (create once paid)
    ↑
Escrow / Wallet lock
    ↑
mark_product_sold
    ↑
Notify + Transaction Hub + Shipping
```

**Break these edges:**

- Buy Now → Order insert  
- Buy Now → Transaction shell as guard requirement  
- Checkout load → `orders.status = awaiting_payment`  
- Guard 16 → `orderID` / `transactionID` **before** payment  
- Inventory reservation SSOT → `orders.reserved_until`  

---

## 5. IMPLEMENTATION ORDER

1. **Owner approve** Master Architecture (this doc) — freeze as SSOT  
2. **DB design** — `checkout_sessions` schema + RLS + indexes + TTL  
3. **Checkout Session Engine** — create / get / expire / destroy (no UI yet)  
4. **Auto-cancel** — session expiry **120s Absolute Law** + unlock (cron + lazy on Buy Now / load)  
5. **Buy Now Engine rewrite** — session-only success payload (`cs`, not `orderId`)  
6. **Checkout Guard rewrite** — remove pre-pay order/transaction requirements  
7. **load-checkout-page + Confirm & Pay** — session-based; reserved OK for session owner  
8. **Stripe metadata** — `checkoutSessionId` primary; webhook maps session → create order  
9. **Post-payment create path** — order + transaction + escrow + sold + notify (idempotent)  
10. **Success / DONE / Conversation Hub** — only after paid order exists  
11. **Legacy cutover** — stop writing `awaiting_payment` from Buy Now; cleanup job for stranded legacy rows  
12. **Remove / deprecate** `ORDER_ENGINE_createPendingPayment` from live Buy Now  
13. **Tests + certification** — see below  
14. **Go / No-Go** gate  

---

## 6. PRODUCTION RISKS

| Risk | Level | Mitigation |
|------|-------|------------|
| Dual-write period (session + old awaiting_payment) | **HIGH** | Feature flag; single writer path; migrate in place per Evolution Law |
| Webhook creates duplicate orders | **HIGH** | Idempotency key = payment_intent / session id; unique constraint |
| Seller sees unpaid orders during cutover | **HIGH** | Filter `awaiting_payment` from seller Inbox/Orders until drained |
| Stranded reserved listings | **HIGH** | Session TTL + release; fix daily-only cron |
| Refresh / Confirm fails on reserved | **HIGH** | Session-owner exception in purchasable check |
| Blood XXIV / Absolute Law SSOT conflict | **HIGH** | Owner re-authorize; update Blood XXIV docs to Master Architecture |
| In-flight Buy Now mid-deploy | **MED** | Drain window; reject new awaiting_payment writes after flag |
| Virtual / demo payments | **MED** | Same session→paid create path without Stripe |
| Conversation Hub expects orderId early | **MED** | Open hub only post-pay |
| Rollback complexity | **HIGH** | See rollback |

---

## 7. ROLLBACK STRATEGY

1. Feature flag `CHECKOUT_SESSION_V1` OFF → restore Buy Now → awaiting_payment path (temporary emergency only).  
2. Do **not** delete `orders.awaiting_payment` column/status until drained.  
3. Keep `cancelPendingOrder` for legacy rows.  
4. If new path live: stop creating sessions; release all open sessions; re-enable legacy writer **only** with Owner approval.  
5. No data migration of unpaid awaiting_payment into “fake paid” orders.  
6. Rollback is **architecture revert**, not partial mix — never session + awaiting_payment both authoritative.

---

## 8. TEST STRATEGY

- Unit: session create/expire/destroy; reserve+fail → published; paid webhook → one order/one tx/one sold  
- Concurrency: two buyers → one reserve wins  
- Double-click Buy Now → one session  
- Refresh Confirm & Pay → same session, no second charge  
- Stripe webhook replay → ignored  
- Payment fail / cancel / expire → unlock + no order  
- Seller APIs → zero unpaid Buy Now orders  
- E2E: Seller A listing → Buyer B Buy Now → Pay → Order → Hub → Shipping (virtual then real)  
- Regression: Inventory lifecycle; Self-purchase RVX-2003; Wallet withdraw untouched  

---

## 9. CERTIFICATION STRATEGY

1. Automatic: TypeScript · ESLint · Build · unit/E2E gates  
2. Localhost money path (virtual): Buy Now → Pay → Order appears **only** after success  
3. Localhost fail path: cancel → published · no order  
4. Webhook idempotency proof  
5. Seller Inbox empty until paid  
6. Owner visual: Checkout · Success · DONE · Conversation Hub  
7. Real money E2E (Owner-approved env)  
8. Score **100/100** only — then Freeze  

---

## 10. GO / NO-GO ASSESSMENT

| Criterion | Status |
|-----------|--------|
| Master Architecture Owner-approved | **REQUIRED (this doc)** |
| Current code compliant | **NO-GO** (creates order before payment) |
| Implementation without redesign of frozen modules outside checkout/payment | Scope-controlled — **GO only after Owner authorizes implementation phase** |
| Inventory SQL (reserved) | **PASS** (prerequisite met) |
| Safe cutover plan | Documented — **conditional GO** |

### VERDICT

**NO-GO FOR IMPLEMENTATION** until Owner explicitly authorizes **Implementation Phase** of Master Checkout Architecture v1.0.

**GO FOR PLANNING / SPEC FREEZE** — this document is the SSOT for that authorization.

---

## EXPECTED OUTPUT SUMMARY

```
CURRENT ARCHITECTURE     = Blood XXIV order-before-payment (NON-COMPLIANT)
CANONICAL ARCHITECTURE   = Checkout Session only pre-pay; Order/Tx post-pay
FILES TO MODIFY          = Engines · orders/checkout · webhooks · checkout UI · inventory SSOT · tests
FUNCTIONS TO MODIFY      = BUY_NOW_ENGINE · Order/Tx create · Session · Auto-cancel · Fulfill · loadCheckout
DEPENDENCIES             = Inventory → Session → Payment → Order → Tx → Escrow → Sold → Hub/Ship
RISK LEVEL               = HIGH (money path + seller visibility + webhook)
IMPLEMENTATION ORDER     = Spec freeze → DB session → Engines → Buy Now → UI → Webhook create-on-pay → Cutover
TEST PLAN               = Unit · concurrency · fail unlock · E2E paid/fail · seller empty unpaid
CERTIFICATION PLAN       = Auto → localhost → Owner visual → real money → 100/100
GO / NO GO               = NO-GO implement · GO plan/SSOT freeze pending Owner implementation authorization
```

---

*End of MASTER_CHECKOUT_ARCHITECTURE v1.0 + Migration Plan*  
*No code written in this phase.*
