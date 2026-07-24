# ROVEXO VIEW ENGINE — Master Engineering Specification v1.0

| Field | Value |
|---|---|
| **Module** | View Engine |
| **Version** | 1.0 |
| **Status** | **FROZEN** — Spring 1 Owner Approved · Absolute Functional Law PASS |
| **Law** | Absolute Functional Law v1.0 |
| **Host** | `http://localhost:3000` only |
| **SSOT** | `lib/views/record-product-view.ts` · `POST /api/views` · `lib/views/view-engine-spring-1-freeze-v1.ts` |

## Absolute

**If it does not work, it does not exist.**  
**If I cannot see it, it does not exist.**

No freeze without: **localhost:3000 + Owner click + visual proof.**

Forbidden as proof alone: HTTP 200 · API · Database · Tests · Reports · Certifications.

## Accepted visual chain

```
Homepage = 0 Views
→ CLICK PRODUCT
→ ≤ 2 seconds
→ Product Page = 1 View
→ BACK
→ Homepage = 1 View
→ CLICK AGAIN → still 1 View
→ OTHER USER → 2 Views
→ BOT → BLOCKED → still 2
→ SELLER → BLOCKED → still 2
→ FREEZE
```

## Performance law

| Time to 1 View after click | Result |
|---|---|
| ≤ 0.1s / 0.5s / 1s | PERFECT |
| ≤ 2s | ACCEPTED |
| > 2s | FAIL |
| > 5s / 30s | FAIL / NOT ACCEPTED |

Dwell target: **1000ms** visible on Product Page before POST (total click→1 View ≤ 2s).

## Count rules (canonical)

| Actor | Result |
|---|---|
| Unique viewer (Owner QA as User A, buyer, guest) | +1 once / 24h |
| Same viewer again / refresh | +0 (still N) |
| Other unique viewer | +1 → N+1 |
| Bot | BLOCKED |
| Listing seller (own product) | BLOCKED |
| Unpublished | BLOCKED |

Admin / Super Admin **may count** when they are **not** the listing seller (Owner must click → see 1 View).

## Fail conditions (Spring FAIL)

- Homepage stays 0 after counted view  
- Product Page stays 0 after Owner click  
- Homepage jumps to 2 on first unique viewer  
- Same user becomes 2  
- Seller increments  
- Bot increments  
- More than 2 seconds to show 1 View  
- No visual proof on localhost:3000  

## Sprint gate

```
IMPLEMENTATION → LOCALHOST:3000 → OWNER CLICK → VISUAL RESULT → REGRESSION → FREEZE
```

Owner only accepts: CLICK → WORKS (×3) → FREEZE.

## Files

- Beacon: `features/product-detail/RecordProductViewBeacon.tsx`
- API: `app/api/views/route.ts`
- Engine: `lib/views/record-product-view.ts`
- Live UI: `features/product-detail/ProductViewsLive.tsx` · `lib/views/view-live-sync.ts`
- RPC: `record_unique_product_view` (migrations under `supabase/migrations/`)
- Lock: `lib/views/view-system-v1-lock.ts`
- Functional law: `lib/absolute-functional-law-v1.ts`

## Homepage

Homepage is **locked** for redesign. It **must read** `products.views` and show the same count after back navigation / feed refresh. No Homepage structural changes in this sprint.
