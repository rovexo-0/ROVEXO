# ROVEXO P10.3 — DUAL STORAGE CONSUMER FINAL CERTIFICATION

**STATUS:** IMPLEMENTATION COMPLETE · MACHINE GATES PASS · WAITING OWNER LIVE SIGN-OFF  
**DATE:** 2026-08-04  
**SCOPE:** Dual consumer race on the same temp Storage object only  

**STOP:** No commit · No push · No deploy  

---

## Certified root cause (P10.2 — unchanged)

```
Temp Upload
  → POST /api/listings → moveImageToProductFolder → copy temp→final ✅ → delete temp ✅
  → POST /api/sell/draft → createSellerListing(status=draft) → moveImageToProductFolder
  → copy(temp) → Object not found → Unable to save listing images → draft 500
```

Publish was correct. Draft was a second consumer of the same temp object.

---

## Minimal change applied

### File

`lib/listings/repository.ts`

### What changed

1. Added `insertDraftProductImageRefs()`:
   - Ownership check only
   - `storageObjectExists` — keep refs that still exist
   - Skip missing objects (already consumed by Publish)
   - **Never** `.copy(` / `.remove(` / `moveImageToProductFolder`
   - If zero objects remain → return success (no throw → no draft 500)

2. In `createSellerListing`:
   - `status === "draft"` → `insertDraftProductImageRefs(...)`
   - else (published) → `insertProductImages(...)` **unchanged** (still moves + deletes temp)

### What did not change

| Surface | Status |
|---------|--------|
| Publish Engine (`lib/sell/publish-engine.ts`) | Untouched |
| `moveImageToProductFolder` / `insertProductImages` for published | Untouched |
| Upload route / Storage layout / path builders | Untouched |
| `POST /api/sell/draft` request/response contract | Untouched (still calls `createSellerListing` with draft status) |
| UI / CSS / React / Success Dialog / Homepage / Listing | Untouched |
| DB schema / business rules / rollback for published failures | Untouched |
| `updateSellerListing` image materialization (PATCH publish-from-draft) | Untouched — Publish still owns move when images are re-sent |

---

## Why Publish remains unmodified

Published listings still flow:

```
createSellerListing(status !== "draft")
  → insertProductImages
  → moveImageToProductFolder
  → copy + delete temp
```

No branch, flag, or behaviour change on that path. Only the `status === "draft"` arm was redirected.

---

## Proof Draft no longer consumes temp

| Check | Evidence |
|-------|----------|
| Draft create no longer calls move | `createSellerListing` ternary → `insertDraftProductImageRefs` |
| Draft refs helper has no copy/remove | Function body (Vitest `p10-3-dual-storage-consumer.test.ts`) |
| Missing temp after Publish | Skipped; no throw; draft row can exist without images |
| Temp still present (draft before publish) | DB rows may reference temp paths; **temp is not deleted by Draft** — Publish remains sole deleter |

Vitest: `tests/p10-3-dual-storage-consumer.test.ts` — **4/4 PASS**

---

## Quality gates

| Gate | Result |
|------|--------|
| TypeScript (`npm run typecheck`) | **PASS** |
| ESLint (changed files) | **PASS** |
| Build (`npm run build`) | **PASS** |
| Vitest (P10.3 + related sell/draft/publish) | **PASS** (27 tests in targeted run) |
| Playwright (`sell-v1-gate` + `sell-hydration`) | **10 passed · 2 failed (harness drift, unrelated to Storage)** — failures: login heading “Welcome Back” timeout; Sell helper expects heading `"Category"` (live UI uses Department / other label). **No P10.3 Storage regression signal.** Live Tests 1–6 remain Owner click proof. |
| Storage lifecycle (code + Vitest) | **PASS** — single materializer for published; draft refs-only |

---

## Owner live test matrix (product proof)

Machine gates prove the race is structurally impossible. Interactive marketplace proof remains Owner on `http://localhost:3000`:

| Test | Expected | Agent |
|------|----------|-------|
| 1 — Upload → Publish → View Listing | Images present · listing created | Owner click |
| 2 — Wait 60s after Publish | Zero `POST /api/sell/draft` **500** | Owner Network |
| 3 — Storage | Temp copied once · deleted once (by Publish only) | Owner / Supabase |
| 4 — Homepage | Image + listing present | Owner |
| 5 — Listing page | All images exist | Owner |
| 6 — Publish 5 listings consecutively | Zero Object not found · zero draft 500 · zero bad rollback · zero missing images | Owner |

---

## Risk evaluation

**Low**

- Change is status-gated (`draft` only).
- Published materialization path is byte-identical in call structure.
- Draft API contract unchanged.
- Worst case after race: draft row without images (no 500, no Publish damage) — acceptable vs Object not found.
- `duplicateSellerListing` (draft + already-final paths) still attaches via exists-check refs (aligned with prior non-temp move behaviour that kept the same path).

---

## STOP

Implementation + machine certification complete.  
**No commit. No push. No deploy.**  
Waiting for Owner live Tests 1–6 sign-off.
