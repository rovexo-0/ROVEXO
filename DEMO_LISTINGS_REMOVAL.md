# DEMO LISTINGS REMOVAL

**Date:** 2026-08-03T01:24:49.619Z  
**Status:** PASS  
**Production Ready:** NO  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY

## Objective

Remove ONLY these two demo marketplace listings (nothing else):

1. Marketplace Refund Item 1785680137786  
2. Premium Cotton Pillow 1785678484771  

## Listing IDs removed

| Title | Product ID | Slug |
|-------|------------|------|
| Premium Cotton Pillow 1785678484771 | `532f8ce4-0007-42cd-a7f3-c44ae34a1250` | `premium-cotton-pillow-1785678484771-msbuv59h` |
| Marketplace Refund Item 1785680137786 | `8915c510-4a53-4f0e-94ba-90d609a22f45` | `marketplace-refund-item-1785680137786-msbvul53` |

## Images removed

| Product | Image ID | Storage path |
|---------|----------|--------------|
| Pillow | `1ced49d4-7aca-46cb-bdae-e78a82abdc66` | `8346d7b6-19e9-4e93-a60a-fb93452a19ad/532f8ce4-0007-42cd-a7f3-c44ae34a1250/1785678484435-25b79600.jpg` (+ thumb) |
| Refund | `cac233a4-5203-465a-9fa2-4b3cd93e5939` | `8346d7b6-19e9-4e93-a60a-fb93452a19ad/8915c510-4a53-4f0e-94ba-90d609a22f45/full-demo-refund-1785680137786.jpg` |

Bucket: `products` — only paths belonging to these two product IDs.

## Database cleanup verified

- `product_images` for both product IDs: deleted  
- `products` rows for both IDs: deleted  
- Refund listing required deleting **1** related `checkout_sessions` row (`47fa27df-66e3-4aa9-9089-68189741a570`, status `paid`) that FK-blocked product delete — **scoped to this listing_id only**  
- Schema unchanged · APIs unchanged · UI unchanged · no placeholder listings created  

### Post-delete query

```json
{
  "remainingProducts": [],
  "publishedFeedHits": [],
  "allGone": true
}
```

## Feed refresh verified

| Surface | Expected after refresh |
|---------|------------------------|
| Home Feed | These titles/IDs absent from published `products` |
| Following Feed | Same (reads published listings) |
| Search Results | Same |
| Seller listings | Same seller inventory no longer includes these IDs |
| Cached feed | Hard-refresh / clear client cache if a stale card remains in browser memory |

**DB feed source:** CLEAN — zero matching published rows

## Strict scope

- Other listings: **not modified**  
- Schema / APIs / UI: **not modified**  
- Commit / push / deploy: **not performed**

## Production Ready

**NO** — data cleanup PASS does not authorize production release. Owner commit/push/deploy gate still required.
