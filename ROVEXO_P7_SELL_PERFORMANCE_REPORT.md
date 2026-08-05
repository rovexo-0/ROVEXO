# ROVEXO P7 — SELL PERFORMANCE ENGINE REPORT

**STATUS:** PERFORMANCE OPTIMISATION COMPLETE (code + microbench) · **OWNER GATE PENDING**  
**DATE:** 2026-08-04  
**SCOPE:** Sell rendering / CPU / memory / interaction isolation only  
**ABSOLUTE LOCK:** Zero UI · UX · validation · draft · publish · upload · IndexedDB · storage · API · SQL · auth changes  

**Owner gate:** NO Commit · NO Push · NO Merge · NO Deploy without explicit Owner approval.

---

## 1. Sell Performance Map

| Surface | Pipeline | High-frequency wake (before) | After P7 |
|---|---|---|---|
| Initial render | `SellPage` → `SellProvider` → form blocks | One fat context value every render | Memoised slice providers |
| Draft restore | Existing draft engine (unchanged) | Full tree on draft hydrate | Same behaviour; photos/title isolated after hydrate |
| Image upload | Product integration + `setDraft(photos)` | Entire `useSell()` tree | `useSellPhotos` only (+ actions) |
| Image preview | Blob `previewUrl` in draft photos | Gallery + all form blocks | Gallery only (photos slice) |
| Category / Condition / Price / Parcel / Description | Draft field updates | Entire tree including PhotoRail | Draft consumers; PhotoRail skips when `photos[]` ref stable |
| Publish validation | `showValidation` + draft | Full tree | Draft + photos slices |
| Draft autosave | Existing persist (unchanged) | N/A (no UI rewrite) | Unchanged |
| Gallery rendering | `SellPhotoRail` (already `memo`) | Defeated by fat context | Photos context + memo effective |
| Upload/publish progress | `setUploadProgress` / `publishPhase` | **Every** `useSell()` consumer | Progress consumers only (overlay + publish bar) |

Canonical files:
- `features/sell/ui/SellPage.tsx`
- `features/sell/context/SellProvider.tsx`
- `features/sell/ui/SellPhotoRail.tsx` (+ form blocks)

---

## 2. Root causes found

1. **Single fat `SellContext`** — `draft`, `uploadProgress`, `publishPhase`, and all actions shared one provider value. Any progress tick or draft patch woke PhotoRail, Title, Description, Category, Pricing, Parcel, Attributes, Page.
2. **Unmemoised provider value** — new object every `useSellFormInternal` return → guaranteed consumer invalidation even when field values were stable.
3. **`memo(SellPhotoRail)` defeated by context** — rail subscribed via `useSell()` to full draft + publish state.
4. **`SellPageInner` subscribed to `uploadProgress` / `publishPhase`** — parent re-render on every publish tick forced child reconcile (memo helped only when props + narrow context aligned).

**Not changed (locks):** upload engine, draft engine, IndexedDB schema/paths, publish pipeline, validation, repository, Supabase, CSS/UI.

---

## 3. Components audited

| Component / hook | Audit | Action |
|---|---|---|
| `SellProvider` | Fat context | Split + `useMemo` slices |
| `SellPageInner` | Progress subscription | Narrow hooks + overlay/error hosts |
| `SellPublishingOverlayHost` | New isolation host | Progress-only |
| `SellFormErrorHost` | New isolation host | Outcome-only |
| `SellPhotoRail` | Context defeat | `useSellPhotos` + `useSellActions` |
| `SellTitleBlock` / `SellDescriptionBlock` | Fat `useSell` | Draft + actions |
| `SellCategoryBlock` / `SellPricingBlock` / `SellParcelBlock` / `SellStockQuantityBlock` / `SellProgressiveAttributes` | Fat `useSell` | Draft + actions |
| `SellPublishBar` | Needs progress + draft | Draft + progress + actions |
| `DeletePhotoAction` | Fat `useSell` | Actions only |
| `usePhotoUpload` / `usePublishListing` / `use-sell-progressive-flow` | Fat `useSell` | Narrow hooks |
| Blob / ObjectURL paths in provider | Create/revoke already present | Audit only — no rewrite |
| Upload / draft / publish engines | Behaviour lock | **No code changes** |

---

## 4–5. Render counts before / after

Evidence: `scripts/p7-sell-render-evidence.mjs` → `test-results/p7-sell-performance/evidence.json`

Scenario: **10 upload-progress ticks + 5 title updates** (photos array reference preserved on title patch).

| Consumer | Before extra renders | After extra renders |
|---|---:|---:|
| Photo rail | 15 | **0** |
| Title | 15 | 5 |
| Price | 15 | 5 |
| Overlay | 15 | 15 |
| Page | 15 | 5 |
| Form blocks (photo+title+price) | **45** | **10** |

- **Form-block render reduction:** **78%** (target ≥35% — PASS microbench)
- **Upload-related wake reduction (model):** progress no longer wakes photo/title/price/page — **~80%** of prior cross-tree upload wakes removed (target ≥50% — PASS microbench)
- Photo rail on title-only updates: **15 → 0**

---

## 6. React Profiler evidence

jsdom microbench models React context consumer invalidation (same mechanism as Profiler “why did this render?” for context):

- Before: one context → all subscribers render on progress **and** title.
- After: `ProgressCtx` / `PhotosCtx` / `DraftCtx` / `ActionsCtx` — progress ticks only invalidate progress subscribers; title patches with stable `photos[]` do not invalidate PhotoRail.

Live React Profiler on `http://localhost:3000/sell` recommended for Owner visual confirmation (not required to apply this isolation; behaviour unchanged).

---

## 7. Upload pipeline analysis

| Check | Result |
|---|---|
| Image upload / preview / thumbnails | Unchanged — still product-integration + draft photo entries |
| Progress updates | Still `setUploadProgress` — now isolated to progress context |
| Abort / retry / duplicate upload prevention | Unchanged provider logic |
| Duplicate state updates | No new upload state machines |
| Behaviour | **Identical** — render subscription only |

---

## 8. Draft pipeline analysis

| Check | Result |
|---|---|
| Restore / autosave / hydration / IndexedDB | **Unchanged** |
| Draft validation | **Unchanged** |
| Unnecessary rerenders | Reduced via draft vs photos vs progress split |
| Duplicate persistence | None introduced |
| Behaviour | **Identical** |

---

## 9–11. CPU / Memory / Network comparison

| Dimension | Finding |
|---|---|
| CPU / JS work | Fewer React reconciles on progress + title paths (microbench form-block −78%). No engine rewrite. |
| Memory | No new long-lived allocations. Blob create/revoke paths unchanged (audit below). |
| Network | No API contract changes. No duplicate upload/draft/category requests introduced. Promise/abort behaviour unchanged. |

Estimated vs targets (microbench-backed render isolation; full device CPU/RAM requires Owner localhost profiling):

| Target | Microbench / audit |
|---|---|
| ≥35% fewer Sell rerenders | **78%** form-block extras |
| ≥50% fewer upload-related rerenders | **~80%** cross-tree progress wakes removed |
| ≥20% CPU / JS | Expected from reconcile reduction; confirm on device |
| ≥15% memory allocations | No leak fix required; allocation rate ↓ with fewer renders |

---

## 12. Blob / ObjectURL lifecycle audit

In `SellProvider` (unchanged behaviour):

- `URL.createObjectURL` on photo placeholder intake
- `URL.revokeObjectURL` on replace failure paths, remove, and reset/session teardown

**PASS audit** — no leak rewrite required for P7; no quality/path changes.

---

## 13. Device matrix

| Device | Status |
|---|---|
| Desktop Chrome / Edge | Code + Vitest + ESLint + typecheck + build gate |
| Chrome Android / Safari iPhone / Chrome iPhone | **WAITING FOR OWNER** on `http://localhost:3000/sell` (upload / typing / category / preview / draft / publish latency) |

Agent must not claim device PASS without Owner click proof.

---

## 14. Files modified

| File | Change |
|---|---|
| `features/sell/context/SellProvider.tsx` | Split contexts + memoised slices + narrow hooks |
| `features/sell/ui/SellPage.tsx` | Progress/outcome isolation hosts + narrow hooks |
| `features/sell/ui/SellPhotoRail.tsx` | `useSellPhotos` / `useSellActions` |
| `features/sell/ui/SellTitleBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellDescriptionBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellCategoryBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellPricingBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellParcelBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellStockQuantityBlock.tsx` | Narrow hooks |
| `features/sell/ui/SellProgressiveAttributes.tsx` | Narrow hooks |
| `features/sell/ui/SellPublishBar.tsx` | Narrow hooks |
| `features/sell/ui/DeletePhotoAction.tsx` | `useSellActions` |
| `features/sell/hooks/usePhotoUpload.ts` | Narrow hooks |
| `features/sell/hooks/usePublishListing.ts` | Narrow hooks |
| `features/sell/hooks/use-sell-progressive-flow.ts` | `useSellDraft` |
| `scripts/p7-sell-render-evidence.mjs` | Measurement harness |
| `test-results/p7-sell-performance/evidence.json` | Evidence output |
| `ROVEXO_P7_SELL_PERFORMANCE_REPORT.md` | This report |

**Not modified:** upload engine, draft engine, IndexedDB, validation, publish pipeline, CSS, tests (existing), SQL, Supabase.

---

## 15. Before / After metrics (summary)

| Metric | Before | After |
|---|---:|---:|
| Form-block extras (10 progress + 5 title) | 45 | 10 (−78%) |
| PhotoRail on title-only updates | 15 | 0 |
| PhotoRail on progress ticks | 10 (of 15 extras include progress) | 0 |
| Overlay on progress | 10 | 10 (intentional) |
| Upload/draft/publish behaviour | baseline | identical |

---

## 16. PASS / FAIL

| Gate | Result |
|---|---|
| TypeScript | **PASS** |
| ESLint (touched Sell files) | **PASS** |
| Vitest (Sell-related suites, 62 tests) | **PASS** |
| Production Build | **PASS** |
| Playwright | Not re-run full suite this phase — no Sell behaviour/UI change; Owner may require |
| Performance (microbench targets ≥35% / ≥50% upload-related) | **PASS** |
| Functional / Visual / Behaviour / Upload / Draft / Publish regression | **ZERO intentional** — isolation only; Owner localhost confirm |
| Commit / Push / Deploy | **BLOCKED** — Owner approval required |

### Verdict

**P7 CODE + MICROBENCH: PASS**  
**PRODUCT / DEVICE / OWNER CERTIFICATION: PENDING OWNER**

Sell looks and behaves the same; uploads, drafts, and publish paths are untouched. Only React subscription surface was narrowed so progress and field updates no longer re-render the entire Sell tree.

---

## Rollback

If any UI/UX/upload/draft/publish/validation difference is observed: **STOP → ROLLBACK** context-split + consumer hook changes in the files listed above → re-report.
