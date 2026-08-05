# ROVEXO Delete Listing — Root Cause (Phase R1.1)

**Status:** REPAIRED  
**Scope:** Delete Listing only  

## Symptom

Owner: confirm Delete → toast **“Unable to delete listing.”**

## Call chain

`ProductListingActionsMenu.confirmDelete` / `SellerListingsV1.confirmDelete`  
→ `DELETE /api/listings/[id]`  
→ `getSellerListingById` (session + ownership)  
→ `deleteSellerListing` → `purgeListingRecord` (service role hard delete)

## Root cause (verified)

Hard delete of `products` fails when **ON DELETE RESTRICT** FKs still reference the row:

| Table | Column | Policy |
|-------|--------|--------|
| `bundle_items` | `product_id` | `ON DELETE RESTRICT` |
| `checkout_sessions` | `listing_id` | `ON DELETE RESTRICT` |

Any listing that sat in a buyer bundle **or** had a checkout session could not be hard-deleted.  
API previously mapped failure → **404 “Listing not found.”** even when the row existed → UI collapsed all failures to “Unable to delete listing.”

Secondary: `createAdminClient()` throw (missing/misconfigured service role) aborted the route as an uncaught 500 — same toast.

## Repair (smallest · delete path only)

In `purgeListingRecord` (`lib/listings/repository.ts`):

1. Use `tryCreateAdminClient()` (fail closed, no throw).
2. Attempt hard delete (existing cascade path).
3. If blocked by RESTRICT FKs → **soft-delete** `status = 'deleted'` so the listing leaves the marketplace without breaking order/checkout history (no schema change; no untyped table access).
4. Wrap unexpected errors; API returns 500 with “Unable to delete listing.” when purge fails after ownership verified (not a fake 404).

## Not changed

Seller publish · Edit · Pause · Buy Now · Checkout creation · schema migrations.

## Owner verify

1. Delete a listing with no commerce history → hard delete succeeds.  
2. Delete a listing previously in checkout / bundle → succeeds (hard or soft).  
3. Listing gone from seller list + public discovery.
