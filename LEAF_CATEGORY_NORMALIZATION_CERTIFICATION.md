# LEAF_CATEGORY_NORMALIZATION_CERTIFICATION.md

**STATUS:** PASS (Brand Database V2 — Leaf Category Normalization)  
**LAW:** COD SÂNGE — Leaf Category Normalization  
**SELL PAGE FREEZE:** ACTIVE (architecture · filtering · search APPROVED — datasets + leaf builders only)  
**DATE:** 2026-08-03  
**HOST (agent):** `http://localhost:3000`  
**COMMITS / PUSHES / DEPLOYS:** NONE

---

## Verdict

| Gate | Result |
|------|--------|
| **OVERALL** | **PASS** |
| Leaf categories audited | **PASS** (960) |
| Dedicated Brand dataset per leaf | **PASS** (960 unique Brand fingerprints) |
| Dedicated Material dataset per leaf | **PASS** (960 unique Material fingerprints) |
| No generic parent-pool clones | **PASS** |
| No cross-category contamination | **PASS** |
| No Brand → Other → A–Z | **PASS** |
| Duplicate check | **PASS** |
| Filtering | **PASS** (unchanged) |
| Search | **PASS** (unchanged) |
| Typecheck | **PASS** |
| Lint | **PASS** |
| Build | **PASS** (`npx next build`) |
| Production Ready | **NO** |

---

## Mission compliance

| Rule | Result |
|------|--------|
| Every final leaf owns independent Brand dataset | **PASS** (`assertLeafBrandIndependence` = 0 shared fingerprints) |
| Every final leaf owns independent Material dataset | **PASS** (`assertLeafMaterialIndependence` = 0 shared fingerprints) |
| Do not inherit generic brands from parent categories | **PASS** (path-normalize + specialty anchors; no exclusive sibling clones) |
| Category-specific manufacturers only | **PASS** (verified travel/maternity/phones/furniture/laptops) |
| No generic pools as live picker SSOT | **PASS** (pools = universe content; leaf builder produces dedicated lists) |
| No duplicates | **PASS** |
| Alphabetical + No Brand + Other | **PASS** |

---

## Coverage (post-normalization)

| Metric | Brands | Materials |
|--------|-------:|----------:|
| Leaf paths | 960 | 960 |
| Unique fingerprints | **960** | **960** |
| Shared sibling fingerprints | **0** | **0** |
| Unique names (platform) | 1,395 | 239 |
| Total entries | 46,311 | 18,022 |
| Average / leaf | 48.2 | 18.8 |
| Min / leaf | 22 | 9 |
| Max / leaf | 87 | 28 |

---

## What changed

| File | Role |
|------|------|
| `lib/catalog/product-type-brand-database-v1.ts` | Path-keyed leaf Brand normalization; independence assert; laptop-bag fix; manufacturer anchors |
| `lib/catalog/product-type-material-database-v1.ts` | Path-keyed leaf Material normalization; leaf overrides; independence assert |
| `lib/catalog/leaf-category-brand-overrides-v1.ts` | Leaf Brand anchors + electronics specialties |
| `lib/catalog/leaf-category-material-overrides-v1.ts` | **NEW** — dedicated Material universes per pillow/cushion leaf |
| `lib/catalog/material-pools-uk-v1.ts` | Expanded beauty/bag/phone/electronics/jewellery/toy materials |
| `lib/category-loaders/scoped.ts` | Removed generic `getMaterialsForVertical` fallback |
| `tests/leaf-category-normalization-v1.test.ts` | Normalization certification tests |

**Not changed:** Sell UI · taxonomy tree · filtering logic · Brand/Material search behaviour · Auth · Checkout · Wallet · Orders · Messages · Publishing/Listing engines.

---

## Normalization algorithm

```
leaf pathKey
  → curated override universe (if any) OR vertical universe
  → specialty / manufacturer anchors (always kept)
  → path accents (force sibling divergence)
  → path-rank drop of non-anchors (no parent clone)
  → No Brand · Other · alphabetical official
```

Misplaced inheritance removed:
- Laptop bags no longer inherit Dell/MSI laptop brands (now bag/accessory manufacturers)
- Furniture siblings no longer share one identical Brand list
- Fashion / beauty / shoes siblings no longer clone full parent pools
- Pillow materials no longer collapse travel + bedding into one shared exclusive list
- Sell Material loader no longer falls back to global `CATALOG_MATERIALS`

---

## Verification samples

| Check | Result |
|-------|--------|
| Travel Pillow: Mulisoft · no Momcozy | **PASS** |
| Maternity Pillow: Momcozy · no Cabeau | **PASS** |
| Sofas: IKEA · no Nike/Zara | **PASS** |
| Android phones: Samsung/Apple · no Dell/Framework | **PASS** |
| Laptops: Dell · Framework anchored | **PASS** |
| Sofas ≠ Dining tables Brand FP | **PASS** |
| Travel materials ≠ Maternity materials | **PASS** |

---

## Validation commands

```bash
npx vitest run tests/leaf-category-normalization-v1.test.ts \
  tests/leaf-category-brand-database-v1.test.ts \
  tests/category-brand-database-v1.test.ts \
  tests/category-attribute-database-v1.test.ts
# → PASS

npm run typecheck   # PASS
npm run lint        # PASS
npx next build      # PASS
```

---

## Production Ready

**NO**

Leaf Category Normalization is certified **PASS**.  
Platform Production Ready remains **NO** pending Owner gates outside this mission.

---

## Freeze note

Sell Page Freeze remains **ACTIVE**. Filtering and search remain APPROVED. This mission normalized leaf Brand + Material **datasets and builders** only.
