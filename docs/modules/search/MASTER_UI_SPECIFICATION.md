# ROVEXO Search — Master UI Specification (UI Polish Phase 1)

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc` · UI Polish Foundation Lock v1.0  
**Rule:** No estimated redesign. Values measured from current Search CSS / CDS tokens. Refine only.

---

## Document control

| Field | Value |
|-------|--------|
| **Page / Module** | Search (UI Polish Phase 1) |
| **Route(s)** | `/search` · `/search?q=` · `/search?category=` |
| **Canonical component** | `SearchLandingView` · `SearchResultsView` |
| **Canonical styles** | `styles/rovexo/search-landing-v1.css` · `styles/rovexo/search-results-v1.css` |
| **Visual reference** | Current live Search (`SEARCH_UI_v1.0`) — refine in place |
| **Canvas reference** | iPhone 17 Pro Max · 430 × 932 (mobile first) |
| **Version** | 1.0-polish |
| **Status** | `Approved` · Implementation in progress |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | Product Owner |
| **Approved date** | 2026-08-01 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0-polish | 2026-08-01 | Cursor | Phase 1 polish spec from audit — awaiting Owner approval |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/search/page.tsx` |
| Landing | `features/search/components/SearchLandingView.tsx` |
| Results | `features/search/components/SearchResultsView.tsx` |
| Typeahead | `features/search/components/SearchTypeaheadPanel.tsx` |
| Styles | `styles/rovexo/search-landing-v1.css` · `search-results-v1.css` |
| Foundation | `lib/design-system/ui-polish-foundation-lock-v1.ts` |
| Audit / Plan | `docs/modules/search/UI_POLISH_PHASE1_*.md` |
| Tests | Existing Search freeze tests + polish regression after implement |

---

## 1. Master UI Specification

### 1.1 Page purpose

Discover products via query, recent/trending terms, and category browse targets. Idle Search is global search chrome; results show a locked Listing Card grid. Polish improves consistency with the ROVEXO Design System **without** changing marketplace identity or Listing Cards.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 17 Pro Max | Owner master |
| Reference width | 430 px | Mobile first |
| Reference height | 932 px | Approx |
| Safe area top | `env(safe-area-inset-top)` | Preserve |
| Safe area bottom | `env(safe-area-inset-bottom)` + bottom nav clearance | Landing uses `calc(88px + safe)` |
| Content max-width (mobile) | 100% | Full width |
| Content max-width (tablet) | 100% | Same design; layout only |
| Content max-width (desktop) | 100% | Same design; layout only |
| Page background | `#ffffff` | Locked identity |

### 1.3 Layout order (section tree)

**Idle `/search` (global search)**

1. Search bar row (field + camera + close)  
2. Typeahead panel (when typing) **OR**  
3. Recent Searches section  
4. Trending / Popular Searches section  
5. Bottom navigation (shell — out of polish redesign)

**Results `/search?q=` or `?category=`**

1. Top chrome (close + heading + result count)  
2. Results grid (`ListingCard` — **locked**)  
3. Loading skeleton / error / empty (empty uses dedicated chrome + `MarketplaceNoProductsEmpty`)  
4. Infinite-load sentinel  

**Deferred (not in Phase 1 layout):** Filter button · Sort button · Filter bottom sheet

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) results | Existing `rx-listing-grid` (2-col marketplace) |
| Columns (tablet / desktop) | Existing responsive grid only |
| Gutter (results) | Existing listing grid gap — **do not change card** |
| Page horizontal inset | **16px** target (`--cds-space-page-x`) |
| Section vertical gap | **12px** inner · **16px** between major blocks (CDS steps) |

### 1.5 Global spacing system (Phase 1 Search)

| Token | Value (px) | Source |
|-------|------------|--------|
| `--space-xs` | 4 | CDS step |
| `--space-sm` | 8 | CDS step |
| `--space-md` | 12 | Align section-inner |
| `--space-lg` | 16 | Page inset |
| `--space-xl` | 24 | Major section only if needed |
| Section gap | 12–16 | No random 6/10 mixes for new polish |
| Search bar height | **44** | Preserve compact Search identity |
| Touch min | **44** | All controls |
| Card internal | N/A | Listing Card locked |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|--------|
| Search field radius | **999px** (pill) — preserve |
| Close / chrome radius | **999px** |
| Camera chrome radius | **10px** — preserve |
| Category card radius | **16px** — preserve (browse surface) |
| Focus ring | Purple `0 0 0 3px rgb(147 51 234 / 0.12)` — preserve |
| Surface | `#ffffff` |
| Field fill | `#f9fafb` → `#fff` on focus |
| Text primary | `#111111` |
| Text muted | `#6b7280` |
| Accent | `#9333ea` (ROVEXO purple) |
| Border | `#e5e7eb` |

---

## 2. Component Dimension Table

### Component: Search Field (landing)

| Field | Value |
|-------|--------|
| Purpose | Primary query entry |
| Width | `flex: 1` within row (~95% historical — polish to flex full remaining) |
| Height | **44px** |
| Padding | `0 6px 0 12px` |
| Gap (icon–input) | 8px |
| Border radius | 999px |
| Shadow | None default; focus ring on `:focus-within` |
| Background | `#f9fafb` / `#fff` focus |
| Border | `1px solid #e5e7eb` → purple mix on focus |
| Icon | Search · muted |
| Icon size | Existing SearchBarSearchIcon |
| Font size | **16px** (iOS zoom safe) |
| Font weight | 400 |
| Line height | 1.2 |
| Alignment | Vertical center |
| Focus | Border + 3px purple ring |
| Pressed | N/A (field) |
| Clear / camera | ≥44px hit; camera visual 34×34 |
| Animation | Existing transitionFast only |
| Navigation | Submit → `/search?q=` |
| Responsive | Full width row |

### Component: Close control (landing)

| Field | Value |
|-------|--------|
| Purpose | Clear query or return home |
| Width / Height | **44×44** |
| Border radius | 999px |
| Background | `#fff` |
| Border | `1px solid #e5e7eb` |

### Component: Close control (results)

| Field | Value |
|-------|--------|
| Purpose | Return home |
| Width / Height | **44×44** (polish from current 40) |
| Icon | 18px |
| Background | Transparent · muted hover |

### Component: Section header (Recent / Trending)

| Field | Value |
|-------|--------|
| Title size | **15px** (0.9375rem) |
| Title weight | **700** |
| Action size | **13px** (0.8125rem) |
| Action weight | **600** |
| Action colour | `#9333ea` |
| Margin below head | **8px** (polish from 6 → 8 scale) |

### Component: Results header

| Field | Value |
|-------|--------|
| Title | 16px / 700 / 1.2 |
| Count | 13px / muted |
| Padding | `0 16px` |
| Gap to grid | **8–12px** |

### Component: Results grid wrapper

| Field | Value |
|-------|--------|
| Padding | `0 16px 16px` |
| Listing Card | **LOCKED — no dimension changes** |
| Gap | Existing `rx-listing-grid` only |

### Component: Error state

| Field | Value |
|-------|--------|
| Purpose | Fail closed search fetch |
| Padding | 24px 16px |
| Copy | “Search unavailable” |
| Action | Retry — purple text button 14px / 600 |
| Pattern | Align FailClosed / CDS text action (no new component family) |

### Component: Empty state

| Field | Value |
|-------|--------|
| Body | `MarketplaceNoProductsEmpty` — **preserve** |
| Chrome | Back 44×44 + search bar aligned to landing field tokens |

### Component: Filter / Sort / Bottom Sheet

| Field | Value |
|-------|--------|
| Phase 1 | **Out of scope** (not on live results chrome) |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Landing page | 10 | 16* | safe+88 | 16* | — | *Target CDS 16; retire random 6 breakout where safe |
| Bar row | 0 | 0 | 8–10 | 0 | 8–10 | Align to 8/10 → prefer 8 |
| Section | 0 | 0 | 12–16 | 0 | — | |
| Section head | 0 | 0 | 8 | 0 | 12 | |
| Chip / history row | — | — | — | — | 8 | |
| Results top | 0 | 16 | 8 | 16 | 8 | |
| Results grid | 0 | 16 | 16 | 16 | grid SSOT | No card padding edits |

\* Landing currently breaks out to 6px — Improvement Plan proposes aligning content to 16px without redesigning category art.

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Results title | platform | 700 | 16px | 1.2 | normal | `#111` | left |
| Section title | platform | 700 | 15px | 1.2 | normal | `#111` | left |
| Search input | platform | 400 | 16px | 1.2 | normal | `#111` | left |
| Meta / count | platform | 400 | 13px | 1.2 | normal | `#6b7280` | left |
| Section action | platform | 600 | 13px | 1.2 | normal | `#9333ea` | right |
| Error / retry | platform | 600 | 14px | 1.2 | normal | purple | center |
| Listing Card type | — | — | — | — | — | — | **LOCKED** |

---

## 5. Colour Table

| Token | Hex / gradient | Usage |
|-------|----------------|-------|
| Surface | `#ffffff` | Page |
| Field | `#f9fafb` | Search field idle |
| Field focus | `#ffffff` | Search field focus |
| Text | `#111111` | Primary |
| Muted | `#6b7280` | Meta · icons |
| Border | `#e5e7eb` | Field · close |
| Accent | `#9333ea` | Actions · camera · focus |
| Chip bg | `#f3e8ff` | Recent chips (preserve) |

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| Search field | Gray fill | — | — | Purple ring | — | — | Keep |
| Close | Border circle | Muted fill | Scale none | focusRing | — | — | 44 touch |
| Camera | Purple tint | — | — | — | — | — | 44 hit |
| Section action | Purple text | Opacity | — | focusRing | — | — | |
| Retry | Purple text | — | — | focusRing | — | Fetching | |
| Listing Card | — | — | — | — | — | — | **LOCKED** |

Transitions: existing `transitionFast` only · no new motion language · `prefers-reduced-motion` respected where already applied.

---

## 7. Responsive Specification

| Breakpoint | Behaviour |
|------------|-----------|
| Mobile | One design · 100% width · 16px inset target |
| Tablet | Same components · grid columns via existing listing grid only |
| Desktop | Same · no desktop-only Search redesign |
| PWA | Safe areas preserved |

Desktop / tablet may change **only** max-width / grid columns / horizontal spacing — Master UI Mode.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Touch targets | ≥ **44×44** (fix results close) |
| Input font | ≥ **16px** (no iOS zoom) |
| Labels | `aria-label` on search / close / camera preserved |
| Error | `role="alert"` preserved |
| Focus | Visible purple / `focusRing` |
| Motion | No new continuous animation |

---

## 9. Developer Notes

1. Implement **only** after Owner sets Status → **Approved**.  
2. Touch `features/search/**` + `styles/rovexo/search-*-v1.css` only.  
3. Do **not** edit `ListingCard.tsx` / Listing Card CSS.  
4. Do **not** mount new Filter/Sort/Sheet in Phase 1.  
5. Prefer mapping `--srch-land-*` to CDS steps over inventing `--srch-land-v2`.  
6. No Commit / Push / Preview / Production until Owner stage approvals.  
7. Parent freezes: Homepage CEO lock · Listing Card lock · UI Polish Foundation · Design Decision #001/#002.

---

## 10. QA Checklist

- [ ] Idle Search: bar · recent · trending · typeahead  
- [ ] Results: heading · count · grid · infinite load  
- [ ] Empty + Loading + Error  
- [ ] Touch ≥44 all chrome controls  
- [ ] No Listing Card visual delta  
- [ ] No Homepage delta  
- [ ] iPhone Safari · Android Chrome · Desktop Chrome · Edge  
- [ ] TypeScript · ESLint · Build  
- [ ] No new Filter/Sort functionality  

---

## Owner approval block

| Gate | Status |
|------|--------|
| UI Audit | Complete |
| Improvement Plan | Complete |
| Mockup | Not required (refine-only) |
| Master UI Spec | **Approved** (Owner 2026-08-01) |
| Implementation | Authorized — Search module only |
| Owner Mobile Certification | **Waiting** |
| Production | **Blocked** until Owner mobile cert |
