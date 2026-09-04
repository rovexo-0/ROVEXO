# AVIF Image Pipeline — Master Database Specification

| Field | Value |
|---|---|
| **Status** | REVIEW |

No new tables. `product_images.url` / `thumbnail_url` / `storage_path` unchanged.

`storage_path` remains the original JPEG. AVIF objects live beside it as `{stem}-a400.avif`, `{stem}-a800.avif`, `{stem}-a1600.avif` in the `products` bucket.

Migration `20260902120000_products_bucket_avif_mime_v1.sql` adds `image/avif` to the products bucket allowlist.
