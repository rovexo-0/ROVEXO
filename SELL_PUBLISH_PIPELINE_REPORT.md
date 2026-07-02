# SELL PUBLISH PIPELINE — P0 FIX REPORT

**Date:** 2026-06-26

---

## Pipeline trace

| Step | Component | Issue found | Fix |
|------|-----------|-------------|-----|
| **Button** | `SellPublishFooter` | Publish stayed **disabled** after typing — `useSellPublishState` read `pendingTitleRef` without re-render | `bumpPendingTextVersion` on title/description change |
| **Validation** | `publishListing` | No pre-flight validation after flush | `isListingValid()` before upload |
| **Photo upload** | `uploadPhoto` → `/api/listings/upload` | Missing URL guard before POST | Throw if upload incomplete |
| **DB insert** | `POST /api/listings` → `createSellerListing` | Working when auth + category valid | — |
| **Slug** | `slugify(title)` in repository | Returned in `{ listing }` | Fail loudly if slug missing |
| **Status** | `status: "published"`, `sections: ["new","trending","recommended"]` | Correct on insert | — |
| **Moderation** | `scanListingBeforePublish` | Can set `paused` if blocked — still in My Listings | — |
| **Homepage query** | `fetchProducts` / ISR `revalidate = 60` | **No cache bust after publish** | `revalidatePublishedListing()` |
| **My Listings** | `getSellerListings` server page | Stale RSC cache possible | `revalidatePath("/seller/listings")` |
| **Cache invalidation** | — | **Missing entirely** | `lib/listings/revalidate-published-listing.ts` |
| **Success UI** | `SellPublishedStep` | Wrong copy / missing buttons | Updated per spec |
| **Toast** | — | **Not implemented** | `useToast` success on publish |
| **Redirect** | — | Stays on sell page (by design) | `router.refresh()` after publish |

---

## Root causes

1. **Publish button never enabled** while title lived only in `pendingTitleRef` (blur-only commit) — user could not complete flow reliably.
2. **Homepage ISR (`revalidate = 60`)** never invalidated — new listings invisible up to 60s+.
3. **Success screen existed** but was easy to miss (no toast, wrong heading, publish gate blocked).

---

## Files modified

- `lib/listings/revalidate-published-listing.ts` (new)
- `app/api/listings/route.ts`
- `app/api/listings/[id]/route.ts`
- `features/sell/hooks/use-sell-wizard.ts`
- `features/sell/components/steps/SellPublishedStep.tsx`
- `features/sell/components/ListingTitleField.tsx`
- `features/sell/components/ListingDescriptionField.tsx`
- `features/sell/components/SellListingForm.tsx`
- `features/sell/components/SellQuickListingForm.tsx`
- `e2e/sell-android.spec.ts`
- `tests/listings-revalidate.test.ts` (new)

---

## Success UI (after publish)

- 🎉 **Congratulations!**
- Your listing has been published successfully.
- **View Listing** · **My Listings** · **Sell Another Item** · **Back Home**
- Celebration animation + success toast

---

## Validation checklist

| Check | Status |
|-------|--------|
| DB insert | API + E2E verify |
| `revalidatePath` homepage + seller listings | **FIXED** |
| Success screen | **FIXED** |
| Success toast | **FIXED** |
| Publish button with typed title | **FIXED** |
| TypeScript | PASS |
| Vitest CI | PASS |
| Playwright sell-android | Updated assertions — run with Supabase E2E env |

---

## Regression

No layout/CSS redesign. Publish flow only.
