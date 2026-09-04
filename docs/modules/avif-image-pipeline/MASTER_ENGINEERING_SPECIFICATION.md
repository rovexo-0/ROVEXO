# AVIF Image Pipeline — Master Engineering Specification

| Field | Value |
|---|---|
| **Module** | AVIF image conversion / serving |
| **Version** | 1.0 |
| **Status** | REVIEW |
| **SSOT** | `lib/media/avif-image-pipeline-v1.ts` · `lib/media/avif-image-conversion.server.ts` · `lib/media/product-image.ts` |
| **Canonical upload** | `app/api/listings/upload/route.ts` |
| **Canonical render** | `components/ui/SafeImage.tsx` |

## What changed

- Server-side Sharp converts validated listing JPEGs into three stored AVIF derivatives (thumb 400 / medium 800 / large 1600).
- Upload still stores the original JPEG + JPEG thumb. AVIF is additive.
- Cards/search/shop/saved prefer `thumbnail_url` (AVIF thumb when present). Listing detail uses `url` (AVIF large when present). Gallery strip rewrites `-a1600.avif` → `-a400.avif`.
- Existing JPEG listings are not backfilled. They keep working via the existing Next/Image AVIF optimizer.
- Read-time GATE 3 collapse of sibling `-thumb.jpg` → original JPEG is removed. `resolveCardImageSources` in `lib/media/product-image.ts` is the SSOT: keep a safe stored thumb; never invent `.avif` from JPEG; unsafe/external/malformed thumbs fall back to the original JPEG.

## What did not change

Sell UI/flow, Stripe, Checkout, Orders state machine, Shipping, Auth, Business Switch/onboarding, ConversationHub, Listing Card visual design.

## Performance / responsive / security / database

- Performance: stored AVIF + 1-year cache; no convert-on-every-request.
- Responsive: existing `sizes` / lazy / LCP priority unchanged; stored AVIF skips a second optimizer pass.
- Security: client still cannot upload `image/avif`; JPEG SOI + MIME + ownership checks remain.
- Database: no `product_images` schema change. Storage bucket MIME allowlist adds `image/avif` for server writes only.
