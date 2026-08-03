# OA-B1 Root Cause — Duplicate Confirm & Pay → RVX-2007

**Date:** 2026-08-03  
**Evidence:** `docs/releases/final-owner-acceptance/checkout/xxiii-run.log` (RC4/OA) + this RC5 fix

## Defect

Blood XXIII test 05: second `POST /api/orders/checkout` with same `checkoutSessionId` + same `Idempotency-Key` returned:

```json
{"success":false,"code":"RVX-2007","error":"RVX-2007\nSorry, this item is now out of stock."}
```

Expected: same `orderId` as first Confirm & Pay (Absolute Financial Law: 1 click = 1 payment = 1 order).

## Exact root cause (code path)

File: `lib/orders/checkout.ts` → `createOrderCheckoutSession`

When `checkoutSessionId` was present, the function ran **stock/status gates before** calling `finalizeCheckoutSessionPayment`:

1. First Confirm & Pay succeeds → listing stock → 0 / status leaves purchasable published path  
2. Session marked `paid` with `order_id`  
3. Duplicate Confirm & Pay hits `product.stock <= 0` → `"This item is out of stock."` → mapped **RVX-2007**  
4. Never reaches `finalizeCheckoutSessionPayment` short-circuit:

```ts
if (session.status === "paid" && session.order_id) {
  return { orderId: session.order_id, ... };
}
```

## Not the root cause (verified)

- Client double-submit lock already present (`submittingLockRef` in `use-checkout-form.ts`)  
- Missing Idempotency-Key on E2E request (key was sent)  
- Stripe webhook race (virtual Full Demo settlement, no Stripe wait on this path)

## Fix (smallest)

1. Remove pre-finalize stock gates from `createOrderCheckoutSession` cs path  
2. Re-apply stock/status gates **inside** `finalizeCheckoutSessionPayment` **after** the paid-session idempotent return  

## Verification target

Blood XXIII **6/6** including test 05 same `orderId`.
