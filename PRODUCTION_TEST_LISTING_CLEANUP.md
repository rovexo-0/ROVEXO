# PRODUCTION_TEST_LISTING_CLEANUP.md

**Date:** 2026-08-03T21:05:34.289Z  
**Status:** PASS  
**Safe to delete:** YES  
**Production Ready:** NO  
**Release:** ❌ NO COMMIT · ❌ NO PUSH · ❌ NO DEPLOY  
**Scope:** Marketplace Refund* Blood XXIII / Checkout certification TEST listings only  
**Production code / APIs / Checkout / Search / Homepage:** **UNTOUCHED**

---

## Verdict

1. **SAFE TO DELETE:** YES  
2. **Gates:** seller=`demo.seller@rovexo.co.uk` · buyer=`demo.buyer@rovexo.co.uk` · payments=`pi_virtual_*` only  
3. **Cascade:** messages → offers → view events → checkout_sessions → order_items → orders → conversations → images → products

---

## Named Owner targets

1. Marketplace Refund Item 1785774719350  
2. Marketplace Refund Item 1785772486359  
Plus every other `title LIKE 'Marketplace Refund%'` row confirmed as TEST.

---

## Listings found

```json
[
  {
    "id": "294c8842-76a0-494f-8ceb-1894728c3d66",
    "title": "Marketplace Refund Item 1785608623682",
    "slug": "marketplace-refund-item-1785608623682-msap9s71",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  },
  {
    "id": "f1956761-3705-4e82-a7a2-3a78b8cb79de",
    "title": "Marketplace Refund Item 1785608765956",
    "slug": "marketplace-refund-item-1785608765956-msapcu10",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  },
  {
    "id": "b9367cd5-baa4-4500-9c14-42467da63948",
    "title": "Marketplace Refund Item 1785608467801",
    "slug": "marketplace-refund-item-1785608467801-msap6g1l",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  },
  {
    "id": "9a4158d0-3db4-421b-aee5-8034b15899f8",
    "title": "Marketplace Refund Item 1785608340592",
    "slug": "marketplace-refund-item-1785608340592-msap3psa",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  },
  {
    "id": "8f00cf26-04df-4c40-af05-37d6747e279b",
    "title": "Marketplace Refund Item 1785772486359",
    "slug": "marketplace-refund-item-1785772486359-msdetxj2",
    "status": "published",
    "is_demo": false,
    "stock": 3,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "named_owner_target"
  },
  {
    "id": "13a8c6d9-83f5-4baa-93c0-1238f8022ad8",
    "title": "Marketplace Refund Item 1785776355879",
    "slug": "marketplace-refund-item-1785776355879-msdh4vbo",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  },
  {
    "id": "b947be47-4475-4922-8c68-f9f1a43c7235",
    "title": "Marketplace Refund Item 1785774719350",
    "slug": "marketplace-refund-item-1785774719350-msdg5shg",
    "status": "published",
    "is_demo": false,
    "stock": 3,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "named_owner_target"
  },
  {
    "id": "848c6035-0da4-4df6-997a-2ca329e7e92a",
    "title": "Marketplace Refund Item 1785778885910",
    "slug": "marketplace-refund-item-1785778885910-msdin3uh",
    "status": "sold",
    "is_demo": false,
    "stock": 2,
    "seller_id": "8346d7b6-19e9-4e93-a60a-fb93452a19ad",
    "imageCount": 1,
    "confirmedTest": true,
    "confirmReason": "marketplace_refund_item_timestamp_pattern"
  }
]
```

## Listings removed

- `294c8842-76a0-494f-8ceb-1894728c3d66` — **Marketplace Refund Item 1785608623682** (`marketplace-refund-item-1785608623682-msap9s71`) · reason=`marketplace_refund_item_timestamp_pattern`
- `f1956761-3705-4e82-a7a2-3a78b8cb79de` — **Marketplace Refund Item 1785608765956** (`marketplace-refund-item-1785608765956-msapcu10`) · reason=`marketplace_refund_item_timestamp_pattern`
- `b9367cd5-baa4-4500-9c14-42467da63948` — **Marketplace Refund Item 1785608467801** (`marketplace-refund-item-1785608467801-msap6g1l`) · reason=`marketplace_refund_item_timestamp_pattern`
- `9a4158d0-3db4-421b-aee5-8034b15899f8` — **Marketplace Refund Item 1785608340592** (`marketplace-refund-item-1785608340592-msap3psa`) · reason=`marketplace_refund_item_timestamp_pattern`
- `8f00cf26-04df-4c40-af05-37d6747e279b` — **Marketplace Refund Item 1785772486359** (`marketplace-refund-item-1785772486359-msdetxj2`) · reason=`named_owner_target`
- `13a8c6d9-83f5-4baa-93c0-1238f8022ad8` — **Marketplace Refund Item 1785776355879** (`marketplace-refund-item-1785776355879-msdh4vbo`) · reason=`marketplace_refund_item_timestamp_pattern`
- `b947be47-4475-4922-8c68-f9f1a43c7235` — **Marketplace Refund Item 1785774719350** (`marketplace-refund-item-1785774719350-msdg5shg`) · reason=`named_owner_target`
- `848c6035-0da4-4df6-997a-2ca329e7e92a` — **Marketplace Refund Item 1785778885910** (`marketplace-refund-item-1785778885910-msdin3uh`) · reason=`marketplace_refund_item_timestamp_pattern`

## Related rows deleted

```json
[
  {
    "table": "messages",
    "column": "conversation_id",
    "count": 108
  },
  {
    "table": "offers",
    "column": "product_id",
    "count": 35
  },
  {
    "table": "product_view_events",
    "column": "product_id",
    "count": 10
  },
  {
    "table": "checkout_sessions",
    "column": "listing_id",
    "count": 17
  },
  {
    "table": "order_items",
    "column": "product_id",
    "count": 12
  },
  {
    "table": "conversations",
    "column": "product_id",
    "count": 8
  },
  {
    "table": "notifications",
    "column": "id",
    "count": 10
  }
]
```

## Gates

```json
{
  "sellerEmails": [
    "demo.seller@rovexo.co.uk"
  ],
  "orderCount": 12,
  "nonVirtualOrderCount": 0,
  "buyerEmails": [
    "demo.buyer@rovexo.co.uk"
  ],
  "cascade": "virtual_demo_full_demo_blood_xxiii"
}
```

---

## Orphan check

### Before
```json
{
  "checkout_sessions": {
    "count": 17,
    "error": null
  },
  "product_images": {
    "count": 8,
    "error": null
  },
  "order_items": {
    "count": 12,
    "error": null
  },
  "conversations": {
    "count": 8,
    "error": null
  },
  "offers": {
    "count": 35,
    "error": null
  },
  "product_view_events": {
    "count": 10,
    "error": null
  },
  "orders": {
    "count": 12,
    "error": null
  }
}
```

### After (must be zero for removed ids)
```json
{
  "checkout_sessions": {
    "count": 0,
    "error": null
  },
  "product_images": {
    "count": 0,
    "error": null
  },
  "order_items": {
    "count": 0,
    "error": null
  },
  "conversations": {
    "count": 0,
    "error": null
  },
  "offers": {
    "count": 0,
    "error": null
  },
  "product_view_events": {
    "count": 0,
    "error": null
  },
  "products_by_id": {
    "count": 0,
    "error": null
  }
}
```

---

## Database integrity

- `title LIKE 'Marketplace Refund%'` remaining: **0**
- Removed IDs still in `products`: **0**

```json
{
  "afterTitleQuery": [],
  "remainingMarketplaceRefundCount": 0,
  "removedIdsStillPresent": []
}
```

---

## Search / Homepage / Category / Profile / Wishlist integrity

| Surface | Result |
|---------|--------|
| Homepage feed | Matching test products **ABSENT** |
| Search | Same |
| Category feeds | Same |
| Seller / Buyer profile listings | Same IDs removed |
| Wishlist / Saved | Scoped saved rows cleared if present |

No production listing outside confirmed Marketplace Refund test pattern was deleted.

---

## Errors / warnings

- orders delete: commerce_engine: UPDATE on commerce_audit_logs is forbidden (append-only ledger)

---

## PASS / FAIL

**PASS**

Production Ready: **NO** — Data cleanup does not authorize commit/push/deploy. Owner release gate required.

## STOP

NO COMMIT · NO PUSH · NO DEPLOY
