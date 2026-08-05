# ROVEXO P9.3.3 — Post-Publish Success Page Root Cause Analysis

**STATUS:** ROOT CAUSE IDENTIFIED · EVIDENCE FROM CODE · NO PRODUCT CHANGES THIS PHASE  
**Scope:** Client path **after** `POST /api/listings` SUCCESS only  
**Host:** `http://localhost:3000/sell`  
**Laws:** Zero UI/CSS/API/Publish Engine/Draft Engine/Upload/business-logic changes in this phase · Zero commit/push/deploy

---

## Certified facts (out of scope — not re-investigated)

| Fact | Status |
|------|--------|
| `POST /api/listings` = 200 OK | CERTIFIED |
| Listing row created in DB | CERTIFIED |
| Listing visible on Homepage | CERTIFIED |
| Listing visible in Browse | CERTIFIED |
| Publish Engine create path | CERTIFIED PASS |

**Publish Engine is NOT the cause.** FailClosed occurs on the **client after** create returns.

---

## Architecture note (no separate Success Page route)

Create-success does **not** navigate to a dedicated Success Page URL.

| Surface | Reality |
|---------|---------|
| Success Dialog | `PublishSuccessDialog` — modal on `/sell` |
| Success Overlay | `PublishingOverlay` — hides when phase leaves uploading/creating |
| Success Page | **Does not exist** as a route |
| View Listing / Sell Another / Home | Buttons inside `PublishSuccessDialog` only |

Create success stays on `/sell` until the user clicks Close / View / Sell Another.

---

## 1. Complete call graph (CREATE success — from code)

```
SellPublishBar
  onClick → publishListing()
    │
    ├─ setShowValidation(true)                    // arms validators
    ├─ setFormError(null)
    ├─ flushPendingText()
    ├─ resolveEffectiveSellDraft(...)
    ├─ isSellListingPublishable(...)              // pre-flight only
    ├─ assertSellCategoryPublishGate(...)
    ├─ setIsPublishing(true) / setPublishPhase("validating")
    ├─ GET /api/account/profile-gate
    │
    ├─ runPublishPipeline(...)                    // CERTIFIED · OUT OF SCOPE
    │     └─ POST /api/listings → 200 + payload
    │
    ├─ setDraft({ ...current, photos: result.photos })
    ├─ clearSellDraft()                           // storage wipe
    ├─ createNewListingSession(draftRef)          // empty draft: title:""
    ├─ pendingTitleRef = ""
    ├─ pendingDescriptionRef = ""
    ├─ resetSellPhotoSession(...)
    ├─ draftRef = session.draft
    ├─ setShowValidation(false)                   // P9.3.1 ordering (present in tree)
    ├─ setFormError(null)
    ├─ setDraft(session.draft)                    // photos: [] · title: ""
    ├─ setRemovedImageIds([])
    ├─ bumpPendingTextVersion()                   // wakes SellPublishBar store
    ├─ setPublishSuccess(successPayload)          // opens success UI path
    ├─ window.scrollTo(0,0)
    ├─ router.refresh()                           // RSC cache bust · NO router.push on create
    └─ trackListingPublished(...)
    │
    finally:
      setIsPublishing(false)
      setPublishPhase(idle|published)

React commit / re-render (still on /sell):
  │
  ├─ SellPageInner
  │     useEffect([publishSuccess]) → setTimeout(0) → setSuccessOpen(true)
  │     render: PublishSuccessDialog(open, publish=successPayload)
  │
  ├─ PublishSuccessDialog                         // NO throw on mount
  │     props: listingId, listingSlug, title, imageUrl, …
  │
  ├─ SellPhotoRail                                // STILL MOUNTED under form
  │     useMemo([photos, showValidation])
  │       └─ getListingValidationErrors(draftLike)
  │             └─ draft.title.trim()             // ★ THROW SITE (pre-fix)
  │
  ├─ SellPricingBlock / SellParcelBlock
  │     getListingValidationErrors(full draft)    // safe if draft from createEmptyDraft
  │
  ├─ SellTitleBlock
  │     validateListingTitle(title string)        // "" OK
  │
  └─ SellPublishBar
        useSyncExternalStore(pending-text)
        isSellListingPublishable(effective)       // false · no throw

IF SellPhotoRail throws during render:
  React Error Boundary
    → app/error.tsx
    → FailClosedPanel
    → Owner sees: "Something went wrong."
```

**Not on create-success path (until user clicks):**

- `router.push(...)` — only edit-success, View Listing, or dismiss-to-home
- `router.replace(...)` — not used in this success chain
- Dedicated Success Page component — none

---

## 2. First component that throws

| Field | Value |
|-------|--------|
| **Component** | `SellPhotoRail` |
| **File** | `features/sell/ui/SellPhotoRail.tsx` |
| **Hook** | `useMemo` → `photoError` |
| **Callee** | `getListingValidationErrors` |
| **File (throw)** | `features/sell/types.ts` |
| **Line (throw)** | `if (draft.title.trim().length < 5)` (~L222) |
| **Reason** | `draft.title` is `undefined` |
| **Object** | Fake draft `{ photos }` cast as `SellListingDraft` |
| **Property** | `title` |
| **Exception** | `TypeError: Cannot read properties of undefined (reading 'trim')` |

### Corrupted assignment (pre-P9.3.1)

```ts
// features/sell/ui/SellPhotoRail.tsx (DEFECT)
getListingValidationErrors({ photos } as SellListingDraft, {
  mode: "quick",
  showErrors: true,
}).photos;
```

Runtime object:

```js
{ photos: [] }  // title === undefined
```

Validator (correctly assumes a real `SellListingDraft`):

```ts
draft.title.trim()  // undefined.trim() → TypeError
```

### Error Boundary map

```
SellPhotoRail (render / useMemo)
  → TypeError
  → nearest Next.js route error UI
  → app/error.tsx
  → FailClosedPanel (FAIL_CLOSED_COPY)
  → "Something went wrong."
```

No stack from Publish Engine. No API 500. No listing-page error.tsx for create (user remains on `/sell`).

---

## 3. Why listing is created but UI enters FailClosed

```
Server create           Client post-success render
─────────────────       ──────────────────────────
POST 200                setShowValidation(true) already armed
DB insert OK            createNewListingSession → empty form
Homepage can show it    SellPhotoRail still mounted
                        photos → []
                        validator called with INVALID draft shape
                        THROW → Error Boundary → FailClosed
```

Money/listing truth = PASS.  
Client presentation after success = FAIL (unhandled render throw).

That is why Owner sees a real listing **and** FailClosed: they are different layers.

---

## 4. Why only after Publish

| Condition | Before Publish | After Publish SUCCESS |
|-----------|----------------|------------------------|
| `showValidation` | often `false` → PhotoRail early-returns | `true` (armed at click) until cleared |
| `photos` | non-empty while editing | reset to `[]` |
| Draft shape in PhotoRail | cast still broken, but early-return skips `.title.trim()` when `showValidation` false | early-return skipped → `.title.trim()` runs |
| Success Dialog | not mounted | mounts **after** / alongside form re-render |

Normal typing rarely hits the throw because `showValidation === false` short-circuits PhotoRail before `getListingValidationErrors`.

---

## 5. Per-component audit (post-success mounts)

| Component | Mount after SUCCESS | Deps / props | Throws? |
|-----------|---------------------|--------------|---------|
| `SellProvider` | already mounted | `publishSuccess`, draft reset | **NO** |
| `SellPageInner` | already mounted | `useEffect([publishSuccess])` opens dialog | **NO** |
| `PublishSuccessDialog` | when `publishSuccess` + `successOpen` | `publish: PublishSuccessPayload` | **NO** (guards `listingSlug?.trim()`, `imageUrl?.trim()`) |
| `PublishingOverlay` | phase → idle | phase/progress | **NO** |
| `SellPhotoRail` | stays mounted | `photos`, `showValidation` | **YES** (pre-fix cast) |
| `SellPricingBlock` | stays mounted | full `draft` from context | **NO** if draft from `createEmptyDraft` |
| `SellParcelBlock` | stays mounted | full `draft` | **NO** (same) |
| `SellTitleBlock` | stays mounted | `validateListingTitle(string)` | **NO** |
| `SellPublishBar` | stays mounted | `isSellListingPublishable` | **NO** |
| `ShareListingSheet` | only on Share click | — | **NO** |
| `app/error.tsx` | only after throw | FailClosed | displays error · does not cause it |
| Listing `[slug]/error.tsx` | not in create-success path | — | N/A |
| `router.refresh()` | called | RSC refresh | **NO** throw by itself |
| `router.push` | not on create success | — | N/A until View/Home |

---

## 6. Searched patterns — relevance

| Pattern | Finding |
|---------|---------|
| `trim()` on `draft.title` | Throw line in `getListingValidationErrors` |
| `map` / `filter` / `length` on photos | Safe on `[]` |
| `listingSlug` / `publishSuccess` | Dialog receives full payload from API parse — not the throw source |
| `pathname` / `searchParams` | Not involved in create-success FailClosed |
| Draft empty after reset | **Valid** empty (`title: ""`) from `createEmptyDraft` / session |
| Invalid draft | **Only** PhotoRail photos-only cast |

Hypothesis “router.refresh wiped listing context” — **rejected** for this FailClosed. Create success stores `PublishSuccessPayload` in React state; refresh does not clear that before dialog open. Throw is validation on a **fake draft**, not missing listing payload.

Hypothesis “draft empty but component still validates” — **partially true**: validation runs while `showValidation` was true; empty draft is fine; **invalid shape** is not.

---

## 7. Minimal fix required (do not apply in this phase)

1. **Primary (model call-site):** In `SellPhotoRail`, never pass `{ photos } as SellListingDraft`. Pass a structurally valid draft, e.g. `{ ...createEmptyDraft(), photos }`.
2. **Ordering (belt):** On create success, `setShowValidation(false)` **before** `setDraft(empty)` / `bumpPendingTextVersion()`.

**Do not** patch the validator with `?.` / `?? ""`.  
**Do not** change Publish Engine / API / UI chrome.

### Working-tree note (evidence only)

As of this RCA, the working tree already contains the P9.3.1 call-site + ordering changes in:

- `features/sell/ui/SellPhotoRail.tsx`
- `features/sell/context/SellProvider.tsx`

This P9.3.3 document does **not** modify them. It certifies the **cause**. Owner live re-test remains required for product PASS.

---

## 8. Impact on the rest of the application

| Area | Impact of root fix |
|------|--------------------|
| Publish Engine / API / DB | None |
| Homepage / Browse listing visibility | None (already worked) |
| Success Dialog copy/layout | None |
| Other modules (Inbox, Wallet, Checkout, …) | None |
| Sell form while typing | None (same validation rules; valid draft shape only) |

---

## 9. Confirmation

```
Publish Engine  = NOT THE CAUSE
API 200         = NOT THE CAUSE
DB create       = NOT THE CAUSE
Success Dialog  = NOT THE THROWER
router.refresh  = NOT THE THROWER

ROOT CAUSE      = SellPhotoRail post-success validation with
                  structurally invalid draft
                  → getListingValidationErrors
                  → draft.title.trim()
                  → TypeError
                  → app/error.tsx FailClosed
```

---

## STOP

No commit · no push · no deploy · no further code changes in this phase.  
Waiting for Owner approval.
