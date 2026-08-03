# LEAF_ATTRIBUTE_DATABASE_V3_CERTIFICATION.md

**STATUS:** PASS (Leaf Attribute Database V3 — Brand & Attribute Normalization)  
**LAW:** COD SÂNGE — ROVEXO Sell Page Certification · Leaf Attribute Database V3  
**SELL PAGE FREEZE:** ACTIVE (no Sell redesign · no AI · no auto-suggestions · no publish-flow change)  
**DATE:** 2026-08-03  
**HOST (agent):** `http://localhost:3000`  
**COMMITS / PUSHES / DEPLOYS:** NONE

---

## Verdict

| Gate | Result |
|------|--------|
| **OVERALL** | **PASS** |
| Leaf categories audited | **PASS** (960 product-type paths) |
| Leaf datasets enriched | **PASS** |
| Brands added / normalized | **PASS** |
| Materials added / normalized | **PASS** |
| Attributes added (applicable leaves) | **PASS** |
| Duplicate check | **PASS** |
| Alphabetical order verified | **PASS** |
| No Brand / Other fixed (positions 1–2) | **PASS** |
| Filtering PASS | **PASS** (unchanged architecture · approved) |
| Search PASS | **PASS** (≥2 chars · accent-insensitive · local · dataset hits selectable) |
| Typecheck | **PASS** (`npm run typecheck` exit 0) |
| Lint | **PASS** (0 errors; repo warnings only) |
| Build | **PASS** (`npm run build` exit 0) |
| Production Ready | **NO** |

---

## Objective (Owner)

Every leaf owns its own complete, relevant Brand and Attribute datasets.  
Architecture / filtering / search / manual selection remain APPROVED.  
Data quality only — no AI, no automatic selection, no architecture redesign.

---

## Stats (post-V3)

| Metric | Value |
|--------|------:|
| Leaf categories audited | **960** |
| Unique brand names | **1,396** |
| Average brands per leaf | **48.3** |
| Unique material names | **244** |
| Average materials per leaf | **18.8** |
| Shared Brand fingerprints | **0** |
| Shared Material fingerprints | **0** |
| Leaf Attribute override leaves | **19** |

---

## Leaf datasets enriched

### Brand (examples — independent)

| Leaf | Sample manufacturers (selectable in dataset) |
|------|-----------------------------------------------|
| **Pillow** (`pillows`) | Mulisoft · Elviros · Jinxia · Tempur · Emma · Silentnight · Simba · Panda London · Utopia Bedding · Coop Home Goods · … |
| **Travel Pillow** | Cabeau · BCOZZY · Trtl · Huzi · Dot & Dot · Napfun · Lewis N. Clark · Mulisoft · Elviros · … |
| **Maternity Pillow** | PharMeDoc · Queen Rose · Niimo · Dreamgenii · bbhugme · Momcozy · Boppy · … |

Independence checks:

- Travel does **not** include PharMeDoc / Dreamgenii  
- Maternity does **not** include Cabeau / Trtl  
- Standard Pillow includes Owner-example bed-pillow manufacturers as selectable rows (not `Use "…"` only)

### Material

Enriched leaf-specific materials for travel, maternity, memory foam, orthopedic, cooling, feather, down, decorative/seat/outdoor cushions, standard / body / children’s pillows, pillowcases.

### Attributes (applicable only)

New SSOT: `lib/catalog/leaf-category-attribute-overrides-v1.ts`  
Wired via existing category-scoped loader for Pattern · Style · Size · Features when a leaf override exists.

| Leaf family | Attributes enriched |
|-------------|---------------------|
| Travel / Neck pillows | Pattern · Style · Size · Features (travel-compact, inflatable, …) |
| Maternity / Pregnancy | Pattern · Style · Size · Features (pregnancy / nursing support, …) |
| Standard / Memory / Ortho / Cooling / Feather / Down / Body / Kids | Applicable Pattern · Style · Size · Features |
| Decorative / Seat / Lumbar / Floor / Outdoor cushions · Pillowcases | Applicable Pattern · Style · Size · Features |

Vertical fallbacks also enriched for `pillows` / `bedding` Pattern · Style · Features · Sizes (non-override leaves).

**Not invented as Sell pickers:** Finish · Volume (no existing Sell attribute surface — left untouched to avoid UI/architecture expansion).  
**Colour:** remains approved global AA colour list (scope-aware).  
**Capacity / Dimensions:** remain existing free-text / vertical systems where already present.

---

## Quality gates

| Check | Result |
|-------|--------|
| Duplicate brands within sample leaves | **PASS** |
| Official brands A–Z after No Brand / Other | **PASS** |
| `No Brand` position 1 · `Other` position 2 | **PASS** |
| `assertLeafBrandIndependence()` | **PASS** |
| `assertLeafMaterialIndependence()` | **PASS** |
| Dataset brand searchable + exact match selectable | **PASS** (`SellOptionPicker`: `Use "X"` only when no exact normalized match) |

---

## Files touched (data / resolution only)

| File | Role |
|------|------|
| `lib/catalog/leaf-category-brand-overrides-v1.ts` | Pillow / Travel / Maternity brand enrichment · anchors · PharMeDoc |
| `lib/catalog/leaf-category-material-overrides-v1.ts` | Leaf material enrichment · body/kids split |
| `lib/catalog/leaf-category-attribute-overrides-v1.ts` | **NEW** — leaf Pattern/Style/Size/Features datasets |
| `lib/category-loaders/scoped.ts` | Resolve leaf attribute overrides; cushions → pillows vertical |
| `lib/categories/enterprise/databases/{patterns,styles,features,dimensions}.ts` | Vertical enrichment for pillows/home |
| `lib/categories/enterprise/databases/index.ts` | Export `PILLOW_PATTERNS` / `PILLOW_STYLES` |
| `tests/leaf-category-brand-database-v1.test.ts` | PharMeDoc expectation |
| `tests/leaf-attribute-database-v3-audit.test.ts` | **NEW** — V3 audit suite |

**Not changed:** Auth · Homepage · Wallet · Messages · Search Engine · Categories tree · Listing Cards · APIs · Database schema · Filtering logic · Search logic · Sell UI redesign.

---

## Validation commands

```text
npm run typecheck  → PASS
npm run lint       → PASS (0 errors)
npm run build      → PASS
```

Vitest (supporting):

- `tests/leaf-attribute-database-v3-audit.test.ts` → PASS  
- `tests/leaf-category-normalization-v1.test.ts` → PASS  
- `tests/leaf-category-brand-database-v1.test.ts` → PASS  

---

## Production Ready

**NO**

Reason: Owner visual certification on Sell leaf Brand/Material/Attribute pickers still required under Absolute Functional Law. Data + machine gates PASS; product PASS waits Owner click on localhost:3000.

---

## Final

```text
LEAF ATTRIBUTE DATABASE V3 = PASS
SELL FREEZE = ACTIVE
NO AI · NO AUTO-SELECT · NO COMMIT · NO PUSH · NO DEPLOY
PRODUCTION READY = NO
```
