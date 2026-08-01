# ROVEXO Search — UI Polish Phase 1 · Improvement Plan

| Field | Value |
|-------|--------|
| **Status** | OWNER APPROVED · IMPLEMENTING |
| **Page** | Search only (`/search`) |
| **Foundation** | UI Polish Foundation Lock v1.0 |
| **Mockup** | **Not required** for refine-only (measured token map below). |
| **Implementation** | **Authorized** (Owner 2026-08-01) — Search CSS/chrome only |

---

## Principle

```
REFINE → ALIGN → REUSE → PRESERVE
Never: redesign · duplicate · invent Filter/Sort · touch Listing Card
```

---

## Workstreams (proposed)

### A — Token bridge (Search ↔ Design System)

Map Search CSS custom properties to official scales **without changing look dramatically**:

| Search token | Propose |
|--------------|---------|
| Horizontal content inset (results + landing content) | Prefer **16px** (`--cds-space-page-x` / `--fw-pad-x`) |
| Section gap | Prefer **12px** inner / **16–24px** between major blocks (use CDS steps only: 8 / 12 / 16 / 24) |
| Purple accent | Single token reference (existing ROVEXO purple) — keep `#9333ea` family |
| Keep pill search bar | **Preserve** (identity) — do not force 16px radius on the field |

Out of scope: forcing Search bar to 56px height (would feel like redesign). Keep **44px** bar; ensure all controls ≥ **44px** touch.

### B — Search Field polish (functionality unchanged)

- Align search icon / clear / camera hit targets to ≥44px  
- Unify focus ring with existing purple focus-within (already good)  
- Align clear button padding  
- Deduplicate empty-state bar styles toward the same landing bar classes (CSS reuse only)

### C — Results chrome

- Results close control: **40 → 44** touch target (visual chrome may stay compact)  
- Results header spacing: use 8/12/16 scale only  
- Grid outer padding: keep 16px; improve only gap between sections (not card internals)

### D — States

- Loading: keep `ProductGridSkeleton`  
- Empty: keep `MarketplaceNoProductsEmpty` (no copy rewrite unless Owner asks)  
- Error: align to FailClosed / CDS secondary + purple text button pattern — **same copy intent** (“Search unavailable” · Retry)

### E — Recent / Trending / Suggestions

- Section title weight/size: align to one hierarchy (e.g. 15–16px / 700)  
- Chip row gap: 8px scale  
- No new chip designs  

### F — Explicitly deferred (Owner listed; not on live results)

| Item | Plan |
|------|------|
| Filter Button | **Defer** — not on current results UI; no new functionality |
| Sort Button | **Defer** |
| Filter Bottom Sheet | **Defer** |

If Owner wants Filters later: separate Owner unlock + Master Spec (not Phase 1).

### G — Listing Card

**ZERO changes** to `ListingCard` / card CSS.  
Allowed only: outer grid padding / page section spacing around the grid.

---

## Removals / non-changes

| Do | Do not |
|----|--------|
| Reuse CDS spacing steps | New Search design system |
| Reuse existing Search components | Duplicate Search Field component |
| Smooth existing transitions only | New motion languages |
| Touch ≥44 | Redesign category heroes / grid art |

---

## Validation plan (after Owner approval + implement)

TypeScript · ESLint · Build · Responsive · iPhone Safari · Android Chrome · Desktop Chrome · Desktop Edge · No regressions on Homepage / Listing Card

---

## Gate

| Step | Status |
|------|--------|
| 1. UI Audit | Done → `UI_POLISH_PHASE1_AUDIT.md` |
| 2. Improvement Plan | This document |
| 3. Mockup | Not required (refine-only) |
| 4. Master UI Spec | **Approved** (Owner 2026-08-01) |
| 5. Implementation | Authorized — Search module only |
| 6. Owner Mobile Certification | Waiting |
| 7. Production | Blocked |
