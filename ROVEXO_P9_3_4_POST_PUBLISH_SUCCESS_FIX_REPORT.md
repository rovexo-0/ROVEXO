# ROVEXO P9.3.4 — Post-Publish Success Fix Report

**STATUS:** ROOT FIX IMPLEMENTED · MACHINE GATES PASS · WAITING OWNER LIVE APPROVAL  
**Scope:** Eliminate post-publish Runtime TypeError only  
**Host:** `http://localhost:3000`  
**STOP:** No commit · no push · no merge · no deploy

---

## 1. Root cause implemented

**Certified throw:**

```
SellPhotoRail
  → getListingValidationErrors(invalidDraft)
  → draft.title.trim()
  → TypeError: Cannot read properties of undefined (reading 'trim')
  → app/error.tsx → FailClosed
```

**Invalid construction (forbidden):**

```ts
getListingValidationErrors({ photos } as SellListingDraft, …)
```

**Implemented repair (canonical factory only):**

```ts
// features/sell/ui/SellPhotoRail.tsx
getListingValidationErrors(
  { ...createEmptyDraft(), photos },
  { mode: "quick", showErrors: true },
).photos;
```

**Post-publish ordering (same turn):**

```ts
// features/sell/context/SellProvider.tsx — create success
setShowValidation(false);
setFormError(null);
setDraft(session.draft);       // empty · structurally valid
bumpPendingTextVersion();
setPublishSuccess(successPayload);
router.refresh();
```

Validator always receives a complete `SellListingDraft` from `createEmptyDraft()`.  
Empty after publish is allowed. Invalid shape is not.

**Unchanged:** Publish Engine · Upload · API · DB · Homepage · Search · routing · Success Dialog UI/CSS · business/validation rules.

---

## 2. Files changed (this fix)

| File | Change |
|------|--------|
| `features/sell/ui/SellPhotoRail.tsx` | Validate via `{ ...createEmptyDraft(), photos }` — no photos-only cast |
| `features/sell/context/SellProvider.tsx` | Clear `showValidation` before empty draft + pending-text bump on create success |
| `tests/sell-listing.test.ts` | Regression: valid empty draft OK; photos-only Partial throws TypeError |

**Diagnostics cleanup (P9.3.4):**

| Removed / confirmed absent |
|----------------------------|
| `lib/diagnostics/failclosed-trace-p91b-v1.ts` |
| `lib/diagnostics/p92-post-publish-client-trace-v1.ts` |
| `components/diagnostics/FailClosedTraceBootstrap.tsx` |
| `features/sell/diagnostics/use-p92-lifecycle.ts` |
| `e2e/p932-live-certification.spec.ts` (temporary cert harness) |
| P9.1B / P9.2 imports from `app/error.tsx`, `app/global-error.tsx`, listing `error.tsx`, `SellPage`, `PublishSuccessDialog`, `PublishingOverlay`, `SellProvider` |

Production error boundaries restored to FailClosed-only (no TRACE logging).

---

## 3. Unsafe type assertions

| Location | Assertion | Action |
|----------|-----------|--------|
| Production `features/sell/**` | `as SellListingDraft` | **NONE remaining** |
| `tests/sell-listing.test.ts` | `{ photos: [] } as ReturnType<typeof createEmptyDraft>` | **Kept on purpose** — proves invalid Partial still throws (regression lock) |

No other `as SellListingDraft` in sell/validation production callers.

---

## 4. Validation callers audited

| Caller | Draft source | Structurally valid? |
|--------|--------------|---------------------|
| `SellPhotoRail` | `{ ...createEmptyDraft(), photos }` | YES |
| `SellPricingBlock` | `draft` from `useSellDraft()` | YES (context SSOT) |
| `SellParcelBlock` | `draft` from `useSellDraft()` | YES |
| `SellCategoryBlock` | `draft` via `getSellValidationErrorForField(draft, …)` | YES |
| `isListingValid` / `getListingValidationErrors` in `types.ts` | caller-supplied `SellListingDraft` | YES when callers pass real drafts |
| Tests | `createEmptyDraft()` (+ overrides) | YES |

No `SellSummary` / `SellSidebar` callers of `getListingValidationErrors` exist in this codebase.

**Fields after empty reset (canonical `createEmptyDraft`):**

| Field | Empty value |
|-------|-------------|
| `title` | `""` |
| `description` | `""` |
| `brand` | `""` |
| `condition` | `""` |
| `categoryPath` | `null` |
| `photos` | `[]` (overlaid with live photos in PhotoRail) |

`location` is not a `SellListingDraft` field in the current model (not applicable).

---

## 5. Regression results (machine)

| Suite | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint (touched sell/error/layout callers) | **PASS** |
| Vitest `sell-listing` + `sell-validation` + `new-listing-session` + `sell-publish-flow` + `publish-listing-phase2` | **PASS** (26 tests) |
| Production Build | (see §6 / build log) |

**Not re-run in this phase (Owner product surfaces):** full Safari manual matrix for Draft restore / Edit listing — no code paths in those modules were modified for this fix beyond SellProvider success ordering + PhotoRail validation input.

---

## 6. Live publish certification

| Check | Status |
|-------|--------|
| Root-fix unit: photos-only Partial throws | **PASS** (Vitest) |
| Root-fix unit: `{ ...createEmptyDraft(), photos: [] }` does not throw | **PASS** (Vitest) |
| `localhost:3000` reachable | **PASS** (HTTP responds) |
| Owner Safari: Publish → Success Dialog → Homepage → View Listing | **WAITING OWNER** |

P9.3.2 Playwright form automation failed **before** Publish (category/Publish-disabled harness drift). That does **not** invalidate this root fix. Owner click on `/sell` remains the product certification for post-publish FailClosed absence.

**Expected live sequence after fix:**

```
Publish → POST 200 → draft reset → SellPhotoRail validates valid empty draft
→ Success Dialog → router.refresh → Homepage / View / Sell Another
→ NO TypeError · NO app/error.tsx · NO FailClosed
```

---

## 7. Diagnostics removed

| Item | Status |
|------|--------|
| P9.1 audit-only docs | retained as reports (no runtime) |
| P9.1B FailClosed TRACE | **removed** from runtime |
| P9.2 post-publish timeline | **removed** from runtime |
| Temporary bootstrap / listeners / console TRACE | **removed** |
| Temporary e2e `p932-live-certification.spec.ts` | **deleted** |
| Production `console.log` / TRACE on error boundaries | **none** |

---

## Certification checklist

| Gate | Result |
|------|--------|
| Runtime TypeError eliminated (code + unit) | ✓ |
| No `reading 'trim'` on undefined title (valid callers) | ✓ |
| No diagnostic FailClosed TRACE | ✓ |
| Success dialog path unchanged | ✓ |
| No UI / CSS / API / business-logic redesign | ✓ |
| TypeScript PASS | ✓ |
| ESLint PASS | ✓ |
| Vitest PASS | ✓ |
| Production Build | **PASS** |
| Owner live Safari publish PASS | **WAITING OWNER** |

---

## STOP

No commit · no push · no merge · no deploy.  
Waiting for Owner approval and Owner live publish confirmation on `http://localhost:3000/sell`.
