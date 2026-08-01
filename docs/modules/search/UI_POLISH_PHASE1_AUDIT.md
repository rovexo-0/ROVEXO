# ROVEXO Search — UI Polish Phase 1 · Audit

| Field | Value |
|-------|--------|
| **Status** | AUDIT COMPLETE · AWAITING OWNER APPROVAL |
| **Route** | `/search` |
| **Scope** | Search module only |
| **Date** | 2026-08-01 |
| **Foundation** | `lib/design-system/ui-polish-foundation-lock-v1.ts` |
| **Prior freeze** | `SEARCH_UI_v1.0` (`lib/search/search-ui-v1-freeze.ts`) — Owner Phase 1 unlocks **refine only** |
| **Listing Card** | READ ONLY · permanently locked |

---

## 1. Canonical surfaces (current)

| Surface | File | Role |
|---------|------|------|
| Route | `app/search/page.tsx` | Idle → landing; `?q` / `?category` → results |
| Landing | `features/search/components/SearchLandingView.tsx` | Search field · Recent · Trending · typeahead |
| Landing CSS | `styles/rovexo/search-landing-v1.css` | Private `--srch-land-*` tokens |
| Results | `features/search/components/SearchResultsView.tsx` | Heading · count · grid · empty · error |
| Results CSS | `styles/rovexo/search-results-v1.css` | Results chrome |
| Typeahead | `SearchTypeaheadPanel.tsx` · `SearchSuggestionList.tsx` | Inline suggestions |
| Recent / Trending | Inside `SearchLandingView` | Chips / rows |
| Category cards | `SearchCategoryBrowseCard.tsx` | Browse surface only (`surface="browse"`) |
| Filters (legacy) | `SearchFilters.tsx` | **Not mounted** on current `/search` results chrome |
| Listing grid | `ListingCard` via `HP_CANONICAL_LISTING_PROPS` | **LOCKED — do not modify card** |

Idle `/search` uses `surface="search"` → **no Browse Categories grid** (global search only).

---

## 2. Measured tokens vs Design System

| Item | Search (current) | Official CDS / Full Width | Audit |
|------|------------------|---------------------------|--------|
| Page L/R inset | Landing breakout `6px` + cancel `16px` parent | Internal `--cds-space-page-x: 16px` | Private scale; results use `16px` |
| Section gap | `--srch-land-section-gap: 12px` | `--cds-space-section-gap: 24px` / inner `12px` | Mixed hierarchy |
| Bar height | `44px` | Input/button master often `56px` | Compact (touch ≥44 OK) |
| Bar radius | `999px` (pill) | `--cds-radius-input: 16px` | Search-specific (keep identity) |
| Purple | `#9333ea` local | ROVEXO purple family | Aligned enough |
| Section title | `0.9375rem` / 700 | CDS label `16px` | Near-consistent |
| Results title | `1rem` / 700 | — | OK |
| Results count | `0.8125rem` | — | OK |
| Close control | Landing `44×44`; Results `40×40` | Touch ≥44 | Results close **below** 44 |
| Camera chrome | Visual `34×34` + hit `44` | — | OK |
| Grid (categories) | 3-col · gap `6px` | — | Landing browse only |
| Results grid pad | `0 16px 16px` | 16px | OK |
| Results vertical gap | `8px` | — | Tight vs section scale |

---

## 3. Component consistency issues

| Issue | Evidence | Severity |
|-------|----------|----------|
| Private Search token family | `--srch-land-*` parallel to CDS | Medium — polish target |
| Dual search-bar CSS | Landing bar vs `srch-results__empty-bar` | Medium — duplicate chrome |
| Results close &lt; 44px | `40×40` in `search-results-v1.css` | High (a11y / touch) |
| Inline SVG icons | Clock / Trend / Close local to Search | Low — reuse official icons where possible |
| Filter / Sort chrome absent on results | `SearchFilters` unused on `SearchResultsView` | Info — **no new Filter UX** in Phase 1 |
| Error state ad-hoc | Plain text + text button, not FailClosed / CDS | Medium |
| Loading | `ProductGridSkeleton` (OK) | Pass |
| Empty | `MarketplaceNoProductsEmpty` (locked empty law) | Pass — preserve |
| Listing Card | Used as-is | **Do not touch** |

---

## 4. Owner checklist mapping

| Owner polish item | Present on `/search` | Notes |
|-------------------|----------------------|--------|
| Header | Partial | Close / back chrome; no marketplace header |
| Search Field | Yes | Landing + empty chrome duplicate |
| Suggestions | Yes | Typeahead panel |
| Recent Searches | Yes | Landing |
| Popular / Trending | Yes | Landing (`trending`) |
| Category Chips | Limited | Scope chips / browse cards elsewhere; idle search has no category grid |
| Filter Button | **No on results** | Component exists unused |
| Sort Button | **No on results** | — |
| Filter Bottom Sheet | **No** | Do not invent in Phase 1 |
| Empty / Loading / Error | Yes | Error needs DS alignment |
| Results Header | Yes | Title + count |
| Spacing / Alignment / Type / Icons / Touch / Motion | Mixed | See tables above |

---

## 5. Explicit non-goals (audit)

- Homepage · Listing Card appearance · Product · Sell · Inbox · Orders · Wallet · Checkout · Account  
- New search features · new filters · new sort UX · category grid redesign on idle search  
- Marketplace copy / visual identity change  

---

## 6. Audit verdict

Search is **functionally solid** and already Owner-certified as `SEARCH_UI_v1.0`.

Polish opportunity is **token alignment + chrome consistency + touch/a11y**, not a redesign.

**READY FOR IMPROVEMENT PLAN · NOT APPROVED FOR IMPLEMENTATION**
