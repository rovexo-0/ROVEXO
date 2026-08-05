# ROVEXO P10.2 — STORAGE OBJECT NOT FOUND ROOT CAUSE

**STATUS:** ROOT CAUSE DEMONSTRATED · NO FIX APPLIED · WAITING OWNER APPROVAL  
**DATE:** 2026-08-04  
**SCOPE:** Storage lifecycle after / during Publish only  
**EVIDENCE STANDARD:** Code path proof aligned with Owner runtime symptoms  

**FORBIDDEN (honoured):** UI · CSS · components · Success Dialog · Publish pipeline changes · Validation · API contracts · DB schema · Autosave behaviour changes · Business rules · Commit · Push · Deploy  

**STOP after this document.**

---

## Owner symptom (accepted as facts)

| Observation | Status |
|-------------|--------|
| `moveImageToProductFolder` → Object not found | Logged |
| `createSellerListing` → Unable to save listing images | Logged |
| `POST /api/sell/draft` → 500 | Logged |
| Listing created | Yes |
| Success Dialog | Yes |
| View Listing | Works |
| Homepage | Shows product |
| Listing page | Works |
| FailClosed after publish | Already certified fixed (out of scope) |

**Conclusion from symptoms:** Publish of the marketplace listing **succeeded**. The failing Storage path is a **second** `createSellerListing` consumer — not the successful publish that the Owner sees.

---

## Certification verdict

### **F — Demonstrated other cause**

**Dual `createSellerListing` consumers share one temp object. The first successful move deletes the temp source. The second `copy()` fails with Object not found → all images skipped → `Unable to save listing images` → `POST /api/sell/draft` 500.**

Closest secondary label: **A** (temp delete is “too early” *for the losing consumer*), but the delete is intentional and correct for the *winning* move — the bug is **two movers**, not a rogue early cleanup helper.

| Option | Certified? | Why |
|--------|------------|-----|
| A — cleanup deletes too early | Partial only | No `cleanupUploadedPhotos()` exists. The delete is inside `moveImageToProductFolder` after a successful copy by the **first** caller. Premature only relative to the **second** caller. |
| B — move uses wrong path | **NO** | Temp path = `buildTempImagePath(sellerId, sessionId, file)`; final = `buildProductImagePath(sellerId, productId, file)`. Prefix ownership check `${sellerId}/`. Paths are consistent. |
| C — copy OK, delete fails | **NO** | Failure log is on **copy** (`copyError.message` = Object not found). Delete is best-effort `.catch()` after copy success and is not what throws. |
| D — delete OK, insert fails | **NO** | `insertProductImages` throws **before** DB insert when `normalized.length === 0` (every `moveImageToProductFolder` returned `null`). |
| E — rollback deletes valid image | **NO** | Rollback only soft-deletes the **losing** product row (`status: "deleted"`). It does not purge the winner’s `sellerId/{publishedId}/` objects. Matches “listing still visible”. |
| **F — other demonstrated** | **YES** | Shared temp + two `createSellerListing` entries (Publish `POST /api/listings` **and** Draft create `POST /api/sell/draft`). |

---

## Exact responsible function

### Primary (throws / logs Object not found)

`moveImageToProductFolder()` in `lib/listings/repository.ts`

```390:404:lib/listings/repository.ts
  const { error: copyError } = await supabase.storage.from("products").copy(image.storagePath, newPath);

  if (copyError) {
    const alreadyThere = await storageObjectExists(supabase, newPath);
    if (!alreadyThere) {
      console.error("[moveImageToProductFolder] skipping image with missing source", {
        storagePath: image.storagePath,
        code: copyError.message,
      });
      return null;
    }
  }
```

Then:

```410:411:lib/listings/repository.ts
  // Only remove the temp sources now that the destination is confirmed present.
  await supabase.storage.from("products").remove([image.storagePath, oldThumbPath]).catch(() => undefined);
```

### Escalation (user-visible / API 500 message)

`insertProductImages()` → when every move returns `null`:

```439:440:lib/listings/repository.ts
  if (normalized.length === 0) {
    throw new Error("Unable to save listing images. Please re-upload your photos and try again.");
  }
```

### Caller that produces Owner’s draft 500 (while publish already OK)

`POST /api/sell/draft` **create** branch → `createSellerListing({ status: "draft", images })`  
(`app/api/sell/draft/route.ts` ≈ lines 200–219)

Publish success path: `POST /api/listings` → same `createSellerListing` with `status: "published"`.

Both call the **same** move + temp `remove`.

---

## Complete timeline (per image)

Bucket throughout: **`products`**.

| Step | Operation | Path / action | exists? |
|------|-----------|---------------|---------|
| 1. Photo Upload | `POST /api/listings/upload` | Upload full + thumb | Creates objects |
| | TEMP PATH | `{sellerId}/temp/{sessionId}/{ts}-{uuid}.jpg` | **YES** after upload |
| | TEMP THUMB | same with `-thumb.jpg` | **YES** |
| | DB | none yet | — |
| 2. Temporary object | Client holds `storagePath` = TEMP PATH | — | YES |
| 3. Autosave draft create *(may race)* | `POST /api/sell/draft` without `draftId` | `createSellerListing(status=draft)` | — |
| | `copy(TEMP → FINAL_DRAFT)` | FINAL_DRAFT = `{sellerId}/{draftProductId}/{filename}` | copy OK if TEMP still present |
| | `remove([TEMP, TEMP_THUMB])` | — | TEMP **gone** |
| | `insert product_images` | rows for draft product | YES |
| 4. Publish | `POST /api/listings` **or** PATCH draft id | `createSellerListing` / `insertProductImages` | — |
| | `copy(TEMP → FINAL_PUB)` | FINAL_PUB = `{sellerId}/{publishedProductId}/{filename}` | |
| | If TEMP still present | copy OK → remove TEMP → DB insert | Winner |
| | If TEMP already removed by step 3 or by a prior publish create | **copy → Object not found** | `alreadyThere(FINAL_PUB)` usually **false** (different productId) → return `null` |
| 5. Loser `insertProductImages` | — | `normalized.length === 0` | throw Unable to save listing images |
| 6. Loser rollback | `products.status = deleted` | only loser productId | Winner listing untouched |
| 7. cleanupUploadedPhotos | **Function does not exist** | — | — |
| 8. cleanupDraft / `clearSellDraft` | localStorage + IndexedDB photos | **does not** delete Storage temp | — |
| 9. Draft update (with `draftId`) | `updateSellerListing` | **does not** re-send / re-move images (by design comment) | safe vs temp |

### Per-image certification matrix (losing call)

| Check | Result |
|-------|--------|
| TEMP PATH | `{sellerId}/temp/{sessionId}/{file}.jpg` (client payload still points here) |
| TEMP exists at loser `copy` time? | **NO** (already removed by winner’s `moveImageToProductFolder`) |
| COPY RESULT | **FAIL** — Supabase Storage “Object not found” |
| Destination exists? | **NO** for loser productId (copy never created it) |
| DB INSERT (loser) | **NO** — aborted before insert |
| TEMP DELETE (loser) | N/A / not reached meaningfully |
| FINAL EXISTS (winner) | **YES** — explains Homepage / View Listing / Success |
| ROLLBACK | Soft-delete **loser** draft product only |

### Per-image matrix (winning publish)

| Check | Result |
|-------|--------|
| TEMP exists at winner `copy`? | **YES** |
| COPY RESULT | **OK** |
| FINAL PATH | `{sellerId}/{publishedProductId}/{file}.jpg` |
| Destination exists? | **YES** |
| DB INSERT | **YES** (`product_images`) |
| TEMP DELETE | **YES** (intentional after copy) |
| FINAL EXISTS | **YES** |

---

## Why Owner sees Success + Object not found together

Demonstrated sequence consistent with all symptoms:

```
Upload → TEMP exists
    ↓
Publish createSellerListing (POST /api/listings)     ← WINNER
    copy TEMP → {sellerId}/{publishedId}/…
    remove TEMP
    insert product_images
    return 200 → Success Dialog / Homepage / View Listing
    ↓
Concurrent or in-flight Draft createSellerListing
  (POST /api/sell/draft, no draftId — first create or cleared id)
    copy TEMP → {sellerId}/{newDraftId}/…
    → Object not found
    → all images null
    → Unable to save listing images
    → soft-delete newDraftId
    → HTTP 500
```

In-flight mechanism (code):

1. Autosave timer calls `persistSellDraftSnapshot` (async) while form still has uploaded photos + price.
2. User hits Publish; publish moves/deletes TEMP.
3. Snapshot’s `POST /api/sell/draft` still carries the old TEMP `storagePath`s.
4. Draft create loses → 500 + logs, publish UI already succeeded.

`publishSuccessRef` only blocks **new** snapshot starts; it does not cancel an already-running `persistSellDraftSnapshot`.

---

## Function audit

| Function | Exists? | Role in this bug |
|----------|---------|------------------|
| `moveImageToProductFolder` | YES | **Copies then deletes TEMP.** Second caller gets Object not found. |
| `insertProductImages` | YES | Maps moves; throws if zero survivors. |
| `createSellerListing` | YES | Shared by Publish + Draft create; rollback soft-deletes **this** product only. |
| `cleanupUploadedPhotos` | **NO** | Not in codebase. |
| `cleanupDraft` / `clearSellDraft` / `clearDraftPhotos` | YES | Local/IDB only — not the Storage Object not found source. |
| Rollback in `createSellerListing` | YES | Does not delete winner’s final Storage objects. |
| Draft autosave | YES | `persistDatabaseDraftFromSellDraft` → `/api/sell/draft`; **create** path re-enters full move pipeline. |
| Draft **update** path | YES | Skips image move (“Images stay on the draft row from create”). |

---

## Exact reason for “Object not found”

Supabase Storage `copy(source, dest)` is called with `source = image.storagePath` still equal to the **temp** upload path, but that object was **already removed** by a prior successful `moveImageToProductFolder` (the published listing’s move). Destination for the second product UUID does not already exist, so the idempotent `alreadyThere` escape does not apply → image skipped → empty set → thrown error string Owner sees.

Not a wrong path builder. Not a missing bucket. Not FailClosed UI.

---

## Technical proof (source)

1. Upload writes TEMP only: `buildTempImagePath` in `app/api/listings/upload/route.ts` + `lib/storage/server-images.ts`.
2. Move always deletes TEMP after successful materialization: `repository.ts` `remove([image.storagePath, oldThumbPath])`.
3. Draft **create** uses the same move via `createSellerListing`: `app/api/sell/draft/route.ts`.
4. Publish create uses the same move: `app/api/listings/route.ts`.
5. Client never rewrites `storagePath` after draft create (`persist-sell-draft` stores `draftId` only — no new paths returned to photos).
6. Error strings Owner quoted are unique to `moveImageToProductFolder` / `insertProductImages`.
7. Soft-delete rollback explains why a failed draft create does not remove the published listing from Homepage.

---

## Impact

| Area | Impact |
|------|--------|
| Published listing / Success / Homepage / View Listing | Can remain **healthy** (winner path) |
| Server logs / console | Noise: Object not found + Unable to save listing images |
| `POST /api/sell/draft` | 500 on losing create |
| Orphan soft-deleted draft rows | Possible (`status=deleted` after failed draft create) |
| Profile Drafts | May miss or show deleted draft; not the marketplace listing |
| Buyer-facing images on winner | Intact when publish won |
| Latent risk | If draft create **wins** the race first, Publish can fail the same way (Owner’s current success case is the opposite order) |

---

## Minimal fix recommended (DO NOT APPLY in P10.2)

Owner approval required before any implementation. Smallest safe directions:

1. **Draft create must not destroy publish temp**  
   - Stop calling full `moveImageToProductFolder` (copy+delete) for `status=draft`, **or**  
   - Copy to draft folder **without** deleting TEMP until publish, **or**  
   - Store draft image rows pointing at TEMP without moving until publish.

2. **Serialize / suppress draft create during publish**  
   - Cancel in-flight draft persist when publish starts; never create a new draft row from TEMP paths after TEMP was consumed.

3. **If draft already owns final paths**  
   - Publish should PATCH that draft id and pass **final** `storagePath`s (or skip re-move when objects already under `{sellerId}/{draftId}/`), and client must sync paths after draft create.

Prefer (1)+(2): one Storage owner for TEMP lifecycle = Publish only.

---

## Risk evaluation

| Item | Level | Note |
|------|-------|------|
| Changing draft create Storage behaviour | Medium | Touches Draft SSOT + `createSellerListing` image path; must not break Profile Drafts cards |
| Suppressing in-flight autosave during publish | Low–Medium | Lifecycle only; aligns with P10.1 empty-shell skip |
| Leaving as-is | High for ops/logs | Marketplace can look fine while draft 500 continues; reverse race can break Publish |
| UI/API/DB schema change | Avoid | Not required for root cause |

---

## Files inspected (evidence set)

- `lib/listings/repository.ts` — `storageObjectExists`, `moveImageToProductFolder`, `insertProductImages`, `createSellerListing`, rollback  
- `app/api/listings/upload/route.ts` — TEMP upload  
- `app/api/listings/route.ts` — publish create  
- `app/api/listings/[id]/route.ts` — publish/update via id  
- `app/api/sell/draft/route.ts` — draft create vs update  
- `lib/storage/server-images.ts` — path builders  
- `lib/sell/persist-sell-draft.ts` — draft POST payload (stale TEMP paths)  
- `lib/sell/draft-storage.ts` — `clearSellDraft` (no Storage delete)  
- `features/sell/context/SellProvider.tsx` — autosave + `publishTargetId` / `databaseDraftId`  
- `lib/sell/publish-engine.ts` — create/retry (does not invent a second Storage API)

---

## STOP

Root cause identified and demonstrated.

**No fix applied. No commit. No push. No deploy.**

Waiting for Owner approval before any remediation.
