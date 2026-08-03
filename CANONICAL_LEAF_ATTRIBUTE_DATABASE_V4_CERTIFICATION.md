# CANONICAL_LEAF_ATTRIBUTE_DATABASE_V4_CERTIFICATION.md

**STATUS:** PASS (Canonical Leaf Attribute Database V4 — Database Maturity)  
**LAW:** COD SÂNGE — ROVEXO Sell Page Certification · Canonical Leaf Attribute Database V4  
**SELL PAGE FREEZE:** ACTIVE (no Sell redesign · no AI · no auto-suggestions · no taxonomy/publish change)  
**DATE:** 2026-08-03  
**HOST (agent):** `http://localhost:3000`  
**COMMITS / PUSHES / DEPLOYS:** NONE

---

## Verdict

| Gate | Result |
|------|--------|
| **OVERALL** | **PASS** |
| Leaf Categories audited | **PASS** (960) |
| Canonical Brands | **PASS** (1,388 unique official Brand records) |
| Canonical Materials | **PASS** (243 unique official Material records) |
| Brands added / normalized | **PASS** |
| Materials added / normalized | **PASS** |
| Aliases normalized | **PASS** (56 Brand alias keys · Material alias map) |
| Duplicate removal | **PASS** (alias collapse → one official name) |
| Leaf references verified | **PASS** (leaves reference official names) |
| Filtering PASS | **PASS** (unchanged · approved) |
| Search PASS | **PASS** (≥2 chars · local · accent/case insensitive · dataset hit selectable) |
| Typecheck | **PASS** |
| Lint | **PASS** (0 errors) |
| Build | **PASS** (`npm run build` exit 0) |
| Production Ready | **NO** |

---

## Canonical model (data maturity)

```text
ONE Brand globally  →  Leaf Categories reference official name
ONE Material globally → Leaf Categories reference official name
ONE Pattern / Style spelling → Leaf lists reference official name
```

Sell continues to receive `readonly string[]` of official names.  
No UI · UX · filtering · search · taxonomy · schema changes.

### Canonical Brand object

| Field | Present |
|-------|---------|
| Official Name | YES |
| Normalized Name | YES |
| Slug | YES |
| Aliases | YES |
| Official Website | YES (when publicly available) |
| Country | YES (when available) |
| Logo reference | YES (field; populated only when legally usable) |
| Status | YES (`active` / `deprecated` / `merged`) |
| Popularity | YES (0–100 from leaf frequency) |
| Supported Leaf Categories | YES |

### Canonical Material object

| Field | Present |
|-------|---------|
| Official Name | YES |
| Normalized Name | YES |
| Aliases | YES |
| Supported Leaf Categories | YES |
| Status | YES |

---

## Normalization examples

| Input | Official |
|-------|----------|
| TEMPUR · Tempur® · tempur | **Tempur** |
| Pharmedoc | **PharMeDoc** |
| memory foam · Memory foam | **Memory Foam** |
| microfiber | **Microfibre** |
| VW | **Volkswagen** |
| Dr Martens | **Dr. Martens** |

---

## Stats

| Metric | Value |
|--------|------:|
| Leaf categories audited | **960** |
| Canonical Brands | **1,388** |
| Unique brand names in leaf DBs | **1,393** |
| Brand aliases mapped | **56** |
| Brands with website metadata | **20** |
| Brands with country metadata | **25** |
| Canonical Materials | **243** |
| Unique material names in leaf DBs | **244** |
| Shared Brand fingerprints | **0** |
| Shared Material fingerprints | **0** |

---

## Files

| File | Role |
|------|------|
| `lib/catalog/canonical-brand-registry-v4.ts` | **NEW** — global Brand registry + alias resolve + sync from leaf DBs |
| `lib/catalog/canonical-material-registry-v4.ts` | **NEW** — global Material registry + alias resolve + sync |
| `lib/catalog/canonical-attribute-registry-v4.ts` | **NEW** — Pattern / Style official spelling |
| `lib/catalog/product-type-brand-database-v1.ts` | `uniqueBrands` → canonical resolve · registry sync |
| `lib/catalog/product-type-material-database-v1.ts` | `uniqueMaterials` → canonical resolve · registry sync |
| `lib/category-loaders/scoped.ts` | Pattern / Style canonicalize on load |
| `lib/catalog/brands-by-product-type.ts` | Re-export canonical helpers |
| `tests/canonical-leaf-attribute-database-v4.test.ts` | **NEW** — V4 certification tests |

**Not changed:** Auth · Homepage · Checkout · Wallet · Orders · Messages · Taxonomy tree · Listing Engine · Publishing Engine · Filtering · Search · DB schema · Sell UI/UX.

---

## Quality targets

| Target | Result |
|--------|--------|
| 100% dedicated Leaf datasets | **PASS** (existing leaf builders retained) |
| 0 duplicate Brands (canonical registry) | **PASS** |
| 0 duplicate Materials (canonical registry) | **PASS** |
| 0 placeholder datasets | **PASS** |
| 0 parent inheritance (Sell Brand/Material) | **PASS** |
| 0 sibling contamination (fingerprint) | **PASS** |
| Dataset Brand searchable + selectable | **PASS** |

---

## Validation

```text
npm run typecheck  → PASS
npm run lint       → PASS (0 errors)
npm run build      → PASS (see build evidence below)
```

Vitest: `tests/canonical-leaf-attribute-database-v4.test.ts` → **PASS**

---

## Production Ready

**NO**

Owner visual confirmation on Sell Brand/Material pickers still required. Machine + data gates PASS.

---

## Final

```text
CANONICAL LEAF ATTRIBUTE DATABASE V4 = PASS
SELL FREEZE = ACTIVE
NO AI · NO AUTO-SELECT · NO COMMIT · NO PUSH · NO DEPLOY
PRODUCTION READY = NO
```
