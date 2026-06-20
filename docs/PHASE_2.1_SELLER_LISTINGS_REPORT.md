# ROVEXO Phase 2.1 — Seller Listings Implementation Report

**Date:** 2025-06-19  
**Scope:** Production Seller Listings module  
**Status:** Complete

---

## Summary

Phase 2.1 replaces all seller listing placeholders and mock flows with a production Supabase-backed module. Sellers can upload images, create and edit listings, manage inventory states from My Listings, and buyers get persisted search, saves, and product views — without changing the existing UI layout.

---

## Part 1 — Supabase Storage

| Capability | Implementation |
|---|---|
| Multiple upload (up to 8) | `features/sell/hooks/use-sell-wizard.ts`, `SellPhotoSection.tsx` |
| Drag & drop / gallery / camera | Existing `SellPhotoSection` UI + file inputs |
| Validation | `lib/storage/client-images.ts`, `lib/storage/upload.ts` |
| Compression | `browser-image-compression` (client), `sharp` (server) |
| Thumbnails | `lib/storage/server-images.ts` → `-thumb.jpg` sibling paths |
| Progress indicator | `uploadProgress` in sell wizard + bar in `SellPhotoSection` |
| Retry failed uploads | `lib/listings/upload-client.ts` (3 retries), Retry button in UI |
| Delete / replace | Async `removePhoto`, `replacePhoto` + `DELETE /api/listings/upload` |
| Temp → product paths | `moveImageToProductFolder()` in `lib/listings/repository.ts` |
| Storage cleanup | `deleteStoragePaths`, `deleteStorageFolder`, delete listing flow |

**API:** `POST/DELETE /api/listings/upload`

---

## Part 2 — Database

**Migration:** `supabase/migrations/20250619000001_seller_listings.sql`

- `product_images.thumbnail_url`
- `find_or_create_brand()` RPC (security definer — fixes brand RLS for sellers)
- `increment_product_views()` RPC
- `saved_items_sync_likes` trigger → syncs `products.likes`
- `products_sync_seller_listing_count` trigger → syncs `seller_profiles.listing_count`
- Updated `products_select_published` policy (owners see own non-published listings)

**Tables used:** `products`, `product_images`, `seller_profiles`, `brands`, `categories`, `saved_items`

---

## Part 3 — Create Listing

- Sell flow publishes via `POST /api/listings`
- Validates title, description, category, brand, condition, price, stock, SKU (business), images
- Generates slug + UUID product id
- Persists all fields including status, seller_id, created_at
- Images moved from `temp/{sessionId}/` to `{sellerId}/{productId}/`

---

## Part 4 — Edit Listing

- Route: `/seller/listings/[id]/edit`
- Loads listing → `sellerListingToDraft()` → existing Sell UI
- Updates via `PATCH /api/listings/[id]`
- Tracks `removeImageIds` for deleted existing images

---

## Part 5 — Delete Listing

- `DELETE /api/listings/[id]`
- Soft-deletes product (`status: deleted`)
- Removes `product_images` rows + storage objects
- Seller dashboard / listings refresh via `router.refresh()`

---

## Part 6 — Seller Dashboard / My Listings

- **Page:** `/seller/listings` (replaces `BetaModulePlaceholder`)
- **Filters:** All, Draft, Paused, Sold, Out of Stock, Low Stock
- **Actions:** Edit, Duplicate, Pause, Reactivate, Delete
- **APIs:** `GET /api/listings`, status/duplicate routes

---

## Part 7 — Product Details

- View counter: `incrementProductViews()` on `/listing/[slug]`
- Saved count: `products.likes` synced from `saved_items`
- Stock / availability on `ProductDetail` type (DB-backed)
- Related products: existing `getSimilarProducts()` (category-aware)

---

## Part 8 — Search

- `searchListings()` in `lib/listings/repository.ts`
- Matches: title, description, condition, brand name, seller name/username
- Sort: newest (default), price asc/desc
- Wired through `features/search/utils/search-server.ts`

---

## Part 9 — Saved Items

- `POST /api/saved` — save by slug
- `GET /api/saved?slug=` — check saved state
- `DELETE /api/saved` — remove (existing)
- Product detail heart toggles persist to `saved_items`

---

## Part 10 — Low Stock

- Detection: `stock > 0 && stock <= low_stock_alert`
- Seller dashboard warning card
- Business dashboard: existing `InventoryOverviewSection` (unchanged UI)
- Listing rows show Low Stock / Out of Stock badges

---

## Part 11 — Security (RLS)

- Existing RLS policies enforced via Supabase server client
- Listing APIs require seller/business/admin role
- Upload/delete restricted to `{userId}/` storage prefix
- Brand creation via security-definer RPC only
- Sellers can only CRUD own listings (`seller_id = auth.uid()`)

---

## Part 12 — Quality

| Check | Result |
|---|---|
| `pnpm lint` | Pass (0 errors) |
| `pnpm build` | Pass |
| `pnpm test` | Pass (10 passed, 2 skipped) |
| Mock data in listings flow | Removed |
| TypeScript | Strict types updated in `database.ts` |

---

## Key Files Added / Modified

### New
- `lib/listings/repository.ts`, `types.ts`, `upload-client.ts`, `category-path.ts`, `draft-mapper.ts`
- `lib/storage/server-images.ts`, `client-images.ts`
- `lib/seller/listings-queries.ts`, `lib/saved/check.ts`
- `features/seller/listings/components/SellerListingsPage.tsx`
- `app/api/listings/**`, `app/seller/listings/**`

### Modified
- Sell wizard, photo section, product detail, search server
- Products repository (search delegation, detail fields)
- Saved API, seller/business dashboards

---

## Deployment Steps

1. Apply migration: `supabase db push` or run `20250619000001_seller_listings.sql`
2. Ensure `.env.local` has Supabase URL + keys
3. Verify `products` storage bucket policies (from Phase 1 migration)
4. Smoke test: create listing → view on homepage → save → edit → pause → delete

---

## Notes

- Duplicate listing reuses existing storage paths (same image files; new product row)
- Live E2E requires user `.env.local` (not committed)
- UI components preserved; only data wiring and My Listings page content changed
