# ROVEXO Bundle Engine v1.0 — Master Engineering Specification

| Field | Value |
|-------|-------|
| **Module** | Bundle Engine |
| **Version** | 1.0 |
| **Status** | OWNER LOCKED IMPLEMENTATION |
| **SSOT** | `lib/bundle/bundle-engine-v1.ts` |
| **Parents** | Sell v1.0 freeze · View Item v1.0 freeze · Checkout UI v1.0 freeze |
| **Official route** | `/bundle/review` (plus Store Shop bundles create surface) |
| **Commit / Push / Deploy** | **FORBIDDEN** until Owner authorizes |

---

## 1. Absolute equation

```
STORE → BUNDLE → CHECKOUT
```

Bundle is **not** a cart. Bundle is **not** a second checkout.  
**Store** (`StoreShopBundles`) is the canonical create surface.  
PDP exposes **Buy Now** + **Make Offer** only — no Add to Bundle CTA.

## 2. Singularity

| Rule | Law |
|------|-----|
| Engines | Exactly ONE Bundle Engine |
| Active bundles | Exactly ONE active bundle per buyer |
| Seller | Exactly ONE seller per active bundle |
| Order | Exactly ONE order when paid |
| Conversation | ONE hub thread for Bundle Offer |
| Payment | ONE buyer payment · atomic all-or-nothing |
| Payout | ONE seller payout for the bundle |

## 3. Architecture

```
Bundle Engine
├── Store (Shop bundles · Create bundle — canonical create)
├── Review Bundle
├── Messages (reuse Conversation Hub)
├── Offers (reuse offer / counter engines)
├── Checkout (reuse Checkout UI — items list only)
├── Orders (one order · N items)
├── Wallet (one payout)
└── Notifications (reuse Inbox Event Engine)
```

## 4. Database (SSOT)

| Table | Purpose |
|-------|---------|
| `bundles` | One row per buyer active/closed bundle |
| `bundle_items` | Line items (qty, unit price snapshot, product refs) |
| `bundle_offers` | Offer / counter state for the bundle |
| `bundle_events` | Audit trail |

Derived: totals, counts, stock availability — never duplicated owners.

## 5. Owner conflict rule

Buyer opens Seller B while active bundle is Seller A:

> You already have an active bundle. Finish or discard it first.  
> **Continue** · **Cancel**

## 6. View Item / PDP (frozen surface — no create CTA)

Unchanged: Gallery · Seller Card · Description · Product Information · Price · Buy Now · Make Offer.

| Stock | Under-price status | Quantity | Add to Bundle (PDP) |
|-------|--------------------|----------|---------------------|
| `> 1` | In Stock · N available (green · 13px · 500) | Visible | **REMOVED** |
| `= 1` | **Hidden** | **Hidden** | **REMOVED** |

**Create surface:** Store → Shop bundles → Create bundle → select listings → Review Bundle (`/bundle/review`).

## 7. Review Bundle

Header · Edit · Seller card (reuse) · Items (80×80 · qty · live stock) · Totals · Delivery at checkout · Make Offer · Buy Now.

## 8. Make Offer / Buy Now / Checkout / Order / Messages / Wallet

Reuse existing engines. Fail closed. Atomic payment. One order timeline. One conversation. One payout.

## 9. Stock / concurrency

Reserve on checkout · release on fail/cancel/expire. Two buyers · last unit → first payment wins · second fail closed.

## 10. Freeze conditions

Cannot freeze until: 100% journey · zero duplicates · TS/ESLint/build · all QA gates · Sell + View Item freezes preserved.

---

## 11. Phase 1 — Checkout Integrity + Stock Reservation (2026-08-01)

**Status:** OWNER LOCKED IMPLEMENTATION · awaiting Owner review · **no commit / push / deploy**

| Capability | Implementation |
|------------|----------------|
| Integrity | `lib/bundle/bundle-checkout-integrity-v1.ts` — server revalidation only |
| Snapshot | `lib/bundle/bundle-snapshot-v1.ts` — immutable at checkout start |
| Reservation | `lib/bundle/bundle-reservation-engine-v1.ts` — all-or-nothing + LIFO rollback |
| Buy Now | `lib/bundle/bundle-buy-now-engine-v1.ts` + `/api/checkout/buy-now` `bundleId` |
| Session | `checkout_sessions.bundle_lines` stores snapshot |
| Order | Multi `order_items` from snapshot · one order |
| Stock after pay | `markProductSold` per line with quantity |
| Cancel/expire | Release all reserved lines · restore bundle `active` |
| Notifications | `bundle-notification-matrix-ssot-v1.ts` + emitters |

---
