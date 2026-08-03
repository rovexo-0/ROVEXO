# CATEGORY_ATTRIBUTE_DATABASE_CERTIFICATION.md

**STATUS:** PASS  
**LAW:** COD SÂNGE — Category Attribute Database V1.0  
**SELL PAGE FREEZE:** ACTIVE (no redesign · no taxonomy rewrite · no publish/listing engine change)  
**DATE:** 2026-08-03  
**COMMITS / PUSHES / DEPLOYS:** NONE

---

## Verdict

| Gate | Result |
|------|--------|
| **OVERALL** | **PASS** |
| Brand Database expanded | **PASS** |
| Material Database expanded | **PASS** |
| Brand filtering PASS | **PASS** |
| Material filtering PASS | **PASS** |
| Manual selection verified | **PASS** |
| Search Brand PASS | **PASS** |
| Search Material PASS | **PASS** |
| No automatic selections | **PASS** |
| Typecheck PASS | **PASS** |
| Lint PASS | **PASS** (0 errors) |
| Build PASS | **PASS** |
| Production Ready | **NO** |

---

## Stats

### Brand

| Metric | Value |
|--------|------:|
| Product-type paths | **960** |
| Unique brand names | **549** |
| Avg brands / category | **31.9** |

### Material

| Metric | Value |
|--------|------:|
| Product-type paths | **960** |
| Unique material names | **120** |
| Avg materials / category | **19.6** |
| Min / Max | **8 / 31** |

---

## Rules certified

| Rule | Status |
|------|--------|
| Brand always manual · never auto | **PASS** |
| Material always manual · never auto | **PASS** |
| Colour / Condition / Size manual · no defaults | **PASS** |
| Brand order: No Brand → Other → A–Z | **PASS** |
| Category-owned Brand DB (no generic shared list) | **PASS** |
| Category-owned Material DB (no generic shared list) | **PASS** |
| Search ONLY Brand + Material | **PASS** |
| Search: local · instant · case-insensitive · accent-insensitive · ≥2 chars | **PASS** |
| No search for Colour / Condition / Size / Pattern / Style / Parcel | **PASS** |
| NO AI · NO guessing · NO auto-fill · NO auto-select | **PASS** |

---

## Cross-category samples

| Category | Brand check | Material check |
|----------|-------------|----------------|
| Travel Pillows | Cabeau · not Apple | Memory Foam · Microfibre · Velour |
| Women's Clothing | Zara family · not Apple | Fashion fabrics incl. Lace |
| Men's Clothing | Dedicated ≠ Women's | No Lace · Chambray / Flannel |
| Shoes | Nike · Clarks · not Apple/Dell | Leather · Suede · Mesh |
| Phones | Apple · Samsung · not IKEA/Zara | Glass · Aluminium · not Oak/MDF |
| Laptops | Dell · MSI · not Zara | Electronics materials |
| Car Parts | Bosch · Brembo · not Zara/Nike | Steel · Alloy · Ceramic |
| Furniture | not Zara/Nike | Wood · Oak · not Lace |

---

## Implementation (SSOT)

| File | Role |
|------|------|
| `lib/catalog/brand-pools-uk-v1.ts` | UK Brand pools |
| `lib/catalog/product-type-brand-database-v1.ts` | Path-scoped Brand DB |
| `lib/catalog/material-pools-uk-v1.ts` | UK Material pools |
| `lib/catalog/product-type-material-database-v1.ts` | Path-scoped Material DB |
| `lib/category-loaders/scoped.ts` | Sell loads Brand + Material by category path |
| `features/sell/ui/SellOptionPicker.tsx` | Brand/Material local search (≥2 chars) |
| `lib/sell/deterministic-prefill.ts` | Prefill returns `{}` (no auto-write) |
| `tests/category-attribute-database-v1.test.ts` | Certification tests |

**Not modified:** Auth · Checkout · Wallet · Messages · Orders · Search Engine · Taxonomy tree · Publishing Engine · Listing Engine · Homepage.

---

## Validation

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors) |
| `npm run build` / `npx next build` | **PASS** |

---

## Production Ready

**NO** — Attribute database expansion certified for Sell category loading only.  
No Owner production deploy authorization. Sell freeze remains active.
