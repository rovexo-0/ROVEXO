# ROVEXO P9.3.1 — Runtime TypeError Root Fix

**STATUS:** ROOT FIX APPLIED · WAITING OWNER APPROVAL  
**Host:** `http://localhost:3000`  
**Scope:** Sell draft model integrity after Publish (no UI / CSS / API / business-rule changes)  
**Forbidden applied:** no try/catch · no optional chaining · no `?? ""` / `|| ""` · no validator silencing

---

## 1. Exact corrupted assignment

```ts
// features/sell/ui/SellPhotoRail.tsx (BEFORE)
getListingValidationErrors({ photos } as SellListingDraft, {
  mode: "quick",
  showErrors: true,
}).photos;
```

**Assignment:** TypeScript cast of a **photos-only Partial** to `SellListingDraft`.

**Runtime object shape:**

```js
{ photos: [] }   // title === undefined · description === undefined · …
```

**Not** `resetDraft()` / `createEmptyDraft()` / `createNewListingSession()` — those correctly set `title: ""`.

**Throw site (unchanged validator — correctly assumes a real Draft):**

```ts
// features/sell/types.ts — getListingValidationErrors
if (draft.title.trim().length < 5) { … }
```

```
undefined.trim() → TypeError → React Error Boundary → app/error.tsx → FailClosed
```

---

## 2. Why the validator runs after Publish

1. `publishListing()` sets `setShowValidation(true)` before create (line ~902).
2. On create success, draft is reset via `createNewListingSession()` → empty `photos: []`.
3. `SellPhotoRail` `useMemo` depends on `[photos, showValidation]`.
4. When `showValidation === true`, it always calls `getListingValidationErrors(...)` (not photos-only helper).
5. `bumpPendingTextVersion()` also re-runs publish-bar / pending-text consumers in the same success turn.

Publish API success does **not** skip client validation surfaces; validation UI remains armed until `setShowValidation(false)`.

---

## 3. Why the draft became invalid

`createEmptyDraft()` / post-publish `session.draft` are **structurally valid** (`title: ""`).

Invalidity came from the **call site** constructing a fake draft:

| Path | `title` |
|------|---------|
| `createEmptyDraft()` | `""` |
| `createNewListingSession()` → `session.draft` | `""` |
| `{ photos } as SellListingDraft` | `undefined` |

The cast lied to the type system. Runtime never filled string fields.

---

## 4. Why only after Publish

Only the success path combines:

1. `showValidation === true` (armed at Publish click)
2. `photos` abruptly cleared to `[]` (session reset)
3. Photo rail re-validates with the photos-only cast
4. Previously, `setDraft(empty)` + `bumpPendingTextVersion()` ran **before** `setShowValidation(false)`, widening the window where (1)+(2) overlap

During normal typing, either `showValidation` is false (early return — no validator call) or the full draft still has a real `title` string when other paths validate. The corrupted object was unique to `SellPhotoRail`.

---

## 5. Root fix

### A. Model / call-site integrity (primary)

```ts
// features/sell/ui/SellPhotoRail.tsx (AFTER)
getListingValidationErrors(
  { ...createEmptyDraft(), photos },
  { mode: "quick", showErrors: true },
).photos;
```

Validator always receives a **structurally valid** `SellListingDraft`. Empty after publish is allowed; invalid shape is not.

### B. Success-turn ordering (state transition)

In `SellProvider.publishListing` create-success path:

1. `setShowValidation(false)` + `setFormError(null)`
2. then `setDraft(session.draft)` / `setRemovedImageIds([])` / `bumpPendingTextVersion()`
3. then `setPublishSuccess(...)`

Closes the armed-validation + empty-photos overlap.

**Not changed:** validators · API · publish payload · UI · CSS · business rules.

---

## 6. Files changed

| File | Change |
|------|--------|
| `features/sell/ui/SellPhotoRail.tsx` | Pass `{ ...createEmptyDraft(), photos }` instead of photos-only cast |
| `features/sell/context/SellProvider.tsx` | Clear validation before empty draft + pending-text bump on create success |
| `tests/sell-listing.test.ts` | Regression: valid empty draft OK; photos-only fake draft throws TypeError |
| `ROVEXO_P9_3_1_RUNTIME_TYPEERROR_ROOT_FIX.md` | This deliverable |

---

## 7. Why this cannot happen again

1. **Only** `as SellListingDraft` cast in the codebase was in `SellPhotoRail` — removed.
2. Photo validation now builds from `createEmptyDraft()` SSOT — same factory as post-publish reset.
3. Success path clears validation before reset consumers re-run.
4. Vitest locks the contract: photos-only Partial throws; `{ ...createEmptyDraft(), photos: [] }` does not.

---

## Lifecycle (certified)

```
INITIAL → createEmptyDraft()          title: ""
SellProvider state                    SellListingDraft
User edits                            title: string
Publish click                         showValidation = true
POST /api/listings                    200 OK
createNewListingSession()             title: ""  (valid empty)
setShowValidation(false)              armed off
setDraft(session.draft)               photos: []
SellPhotoRail validator               { ...createEmptyDraft(), photos }
                                      title: "" → .trim() OK
Success dialog                        no Error Boundary
router.refresh()                      Homepage can show listing
```

---

## Validation audit (string methods on draft fields)

Validators that call `.trim()` / length on draft strings assume **model guarantees**, not defenses:

| Function | Field | Guaranteed by |
|----------|-------|---------------|
| `getListingValidationErrors` | `title`, `description`, `auctionEndsAt` | `SellListingDraft` + `createEmptyDraft()` |
| `validateListingTitle` | `title: string` | callers pass pending string or `draft.title` |
| `isSellListingPublishable` / progressive | title/description strings | `resolveEffectiveSellDraft` + refs reset to `""` |
| `build-listing-publish-payload` / publish-engine | draft strings | publish only after publishable gate |

Photo rail was the only path that violated the model by casting a Partial.

---

## Certification gates (machine)

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| ESLint (changed files) | PASS (0 errors; pre-existing unused-disable warning in SellProvider) |
| Vitest `tests/sell-listing.test.ts` + related sell suites | PASS |
| Build | PASS |
| UI / CSS / business logic / API contract | unchanged by design |

**Owner visual / live evidence still required for product PASS:**

- ✓ POST `/api/listings` = 200  
- ✓ Listing exists  
- ✓ Homepage displays listing  
- ✓ No Runtime TypeError  
- ✓ No `app/error.tsx` / FailClosed  

---

## STOP

No commit · no push · no deploy.  
Waiting for Owner approval.
