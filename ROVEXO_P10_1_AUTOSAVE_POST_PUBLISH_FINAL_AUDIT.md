# ROVEXO P10.1 — AUTOSAVE POST-PUBLISH FINAL AUDIT

**STATUS:** CODE COMPLETE · WAITING OWNER APPROVAL  
**DATE:** 2026-08-04  
**SCOPE:** Sell Draft Autosave lifecycle only  
**FORBIDDEN (unchanged):** Publish pipeline · Success dialog · Listing creation · Business logic · Validation rules · API contracts · Database · UI · CSS · Routing  

**STOP:** No commit · No push · No deploy — wait for Owner approval.

---

## Verdict

Post-publish `POST /api/sell/draft` → 500 (`Enter a price of at least £0.01`) was caused by autosave still scheduling/persisting after an intentional empty form reset. Autosave now detects empty / non-persistable drafts and **does not call** `POST /api/sell/draft`.

---

## Root cause

### Trace (before fix)

```
Publish Success (POST /api/listings = 200)
  → clearSellDraft() + setDraft(empty session)
  → Success dialog (publishSuccess = true → autosave paused)
  → Sell Another / dismiss / remount / pagehide
  → publishSuccess cleared · empty (or remnant-photo) draft in state
  → Autosave effect schedules (DRAFT_AUTOSAVE_MS = 5s)
  → persistSellDraftSnapshot()
  → canPersistDatabaseDraft = photos-only gate (true if remnant uploaded photos)
  → POST /api/sell/draft with price "" / 0
  → normalizeListingPrice → throw "Enter a price of at least £0.01"
  → API catch → HTTP 500
```

### Why autosave still executed

1. **Scheduler** (`SellProvider` autosave `useEffect`) ran whenever create-mode draft changed and `publishSuccess` was falsy — including after intentional reset to an empty shell.
2. **`isMeaningfulDraft` was not checked** before scheduling — empty shells still got a timer; remnant photos alone made the draft “meaningful” even with blank price.
3. **`persistSellDraftSnapshot` always POSTed** when `canPersistDatabaseDraft` (uploaded photo(s) only) — it did not require a price ≥ £0.01.
4. **Empty text sync** could rewrite localStorage after `clearSellDraft()`, re-seeding an empty shell for later remounts.
5. **Visibility / pagehide** handlers called persist even for empty drafts.

API validation and price rules were correct. The client should never have POSTed that shell.

---

## Files inspected

| File | Role |
|------|------|
| `features/sell/context/SellProvider.tsx` | Autosave schedule · publish success pause · hide/show persist |
| `lib/sell/persist-sell-draft.ts` | Snapshot · text sync · DB POST caller |
| `lib/sell/draft-database-ssot-v1.ts` | DB draft persist gates |
| `lib/sell/draft-engine.ts` | `isMeaningfulDraft` · `DRAFT_AUTOSAVE_MS` · publish-failure persist |
| `lib/sell/draft-storage.ts` | `clearSellDraft` / local cache |
| `lib/sell/listing-price.ts` | Source of 500 message (`normalizeListingPrice`) |
| `app/api/sell/draft/route.ts` | Unchanged — contract preserved |
| `tests/persist-sell-draft.test.ts` | Empty + remnant-photo skip assertions |
| `tests/sell-draft-database-ssot-v1.test.ts` | `canAutosaveDatabaseDraft` gate |

---

## Fix (autosave lifecycle only)

### 1. `canAutosaveDatabaseDraft` (`draft-database-ssot-v1.ts`)

Requires uploaded photo(s) **and** price ≥ `0.01`. Used only to skip autosave DB POSTs. Does not change API validation.

### 2. `persistSellDraftSnapshot` / `persistSellDraftTextSync`

- Empty post-publish shell → skip local rewrite + skip POST (no network).
- Snapshot DB path → POST only if `canAutosaveDatabaseDraft(draft)`.
- `persistDatabaseDraftFromSellDraft` keeps **photo-only** `canPersistDatabaseDraft` so **publish-failure recovery** still saves drafts with incomplete price.

### 3. `SellProvider` autosave

- Do not schedule if `!isMeaningfulDraft(draft, draft.photos.length)`.
- `persistOnHide` returns early for empty shells.

---

## Why it no longer executes

| After Publish state | Schedule? | Local write? | `POST /api/sell/draft`? |
|---------------------|-----------|--------------|-------------------------|
| Empty form (no photos, no title/desc/category/price) | No | No | No |
| Remnant uploaded photo + empty price | Possible (meaningful photos) | Local only | **No** (`canAutosaveDatabaseDraft` false) |
| Real in-progress draft (photos + price ≥ £0.01) | Yes | Yes | Yes (unchanged) |
| Publish failure with photos | N/A (failure path) | Yes | Yes via photo-only gate (unchanged) |

Expected Owner flow:

```
Publish → View Listing → Return to Sell → wait 30s
→ NO POST /api/sell/draft
→ NO 500
→ NO console error from draft autosave
```

---

## Regression analysis

| Surface | Impact |
|---------|--------|
| Publish pipeline / Success dialog / Listing create | Untouched |
| API `/api/sell/draft` contract & validation | Untouched |
| DB / migrations | Untouched |
| UI / CSS / routing | Untouched |
| Normal autosave (photos + valid price) | Still POSTs |
| Publish-failure draft save | Still uses photo-only gate |
| Empty post-publish shell | No POST · no empty local re-seed |

---

## Quality gates

| Gate | Result |
|------|--------|
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint`) | PASS (0 errors; pre-existing warnings elsewhere) |
| Build (`npm run build`) | PASS |
| Vitest (`persist-sell-draft` + `sell-draft-database-ssot-v1`) | PASS (10 tests) |
| Playwright | No dedicated P10.1 e2e added (lifecycle covered by Vitest). Full publish e2e not re-run in this pass — Owner live Network tab verification is the product proof for “no POST after publish”. |

---

## Owner verification (localhost:3000)

1. Publish a listing successfully.
2. Open Network → filter `sell/draft`.
3. View Listing → return to `/sell`.
4. Wait ≥ 30 seconds without editing the form.
5. Confirm: **zero** `POST /api/sell/draft` after publish success.
6. Confirm: no 500 / no price console error from draft autosave.

---

## STOP

Waiting for Owner approval.  
**No commit. No push. No deploy.**
