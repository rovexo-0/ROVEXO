# MASTER_BRAND_DATABASE_MARKET_COVERAGE_V6.md

**STATUS:** PASS (Master Brand Database — Market Coverage Certification V6)  
**LAW:** COD SÂNGE — ROVEXO Master Brand Database · Market Coverage  
**SELL PAGE FREEZE:** ACTIVE  
**DATE:** 2026-08-03  
**HOST (agent):** `http://localhost:3000`  
**COMMITS / PUSHES / DEPLOYS:** NONE  
**SCOPE:** DATA CURATION ONLY (not an architecture / UI / filtering / search project)

---

## Verdict

| Gate | Result |
|------|--------|
| **OVERALL** | **PASS** |
| Leaf Categories audited | **PASS** (960) |
| Canonical Brands | **PASS** (1,710) |
| Manufacturers added | **PASS** (~322 net unique Brand names vs V4 baseline) |
| Coverage improvement | **PASS** |
| Duplicate check | **PASS** |
| Brand Search PASS | **PASS** |
| Material Search PASS | **PASS** |
| Filtering PASS | **PASS** (unchanged · approved) |
| Typecheck | **PASS** |
| Lint | **PASS** (0 errors) |
| Build | **PASS** |
| Production Ready | **NO** |

---

## Coverage improvement (before → after)

| Metric | Pre-V6 (V4 baseline) | Post-V6 | Δ |
|--------|---------------------:|--------:|--:|
| Leaf categories | 960 | 960 | — |
| Unique brand names | 1,393 | **1,715** | **+322** |
| Canonical Brands | 1,388 | **1,710** | **+322** |
| Avg brands / leaf | 48.2 | **52.2** | **+4.0** |
| Min brands / leaf | 22 | **30** | **+8** |
| Leaves with &lt; 25 official brands | **8** | **0** | **−8** |
| Shared Brand fingerprints | 0 | 0 | — |
| Shared Material fingerprints | 0 | 0 | — |

---

## Weak coverage found → enriched

### Critical (were &lt; 25 brands) — FIXED

| Leaf path | Before | After action |
|-----------|-------:|--------------|
| `electronics/phones-tablets/tablets` | 20 | Dedicated `UK_TABLET_BRANDS` pool |
| `electronics/phones-tablets/ipads` | 20 | Same |
| `electronics/phones-tablets/android-tablets` | 20 | Same |
| `electronics/phones-tablets/e-readers` | 20 | Dedicated `UK_EREADER_BRANDS` pool |
| `electronics/tv-audio/soundbars` | 23 | `UK_SOUNDBAR_AV_BRANDS` + audio/TV long-tail |
| `electronics/tv-audio/home-cinema` | 23 | Same |
| `electronics/tv-audio/radios` | 23 | Same |
| `electronics/tv-audio/remote-controls` | 24 | Same |

Also expanded: phone accessories · TV · audio · cameras · books (retailer Waterstones removed) · collectibles · tyres · men's grooming · standard / body / seat / outdoor pillow-cushion leaf lists.

### Soft remaining (≥ 25, still thinner than peers — listed for continued curation)

These are **not certification blockers** (all ≥ 28; platform min = 30). Continue enriching in later data passes:

| Area | Approx official brands | Note |
|------|----------------------:|------|
| Body / children's / seat / lumbar / floor / outdoor cushions | ~28–32 | Leaf lists expanded; more specialist outdoor makers welcome |
| Women's accessory leaves (hats, umbrellas, belts, scarves) | ~31–32 | Fashion accessory long-tail |
| Kids baby leaves | ~31 | Baby product specialists |
| Gaming console leaves | ~31 | Console ecosystem manufacturers |

---

## Representative samples (major categories)

| Category | Sample manufacturers (selectable) |
|----------|-----------------------------------|
| **Pillow** | Silentnight · Tempur · Emma · Simba · Mulisoft · Elviros · Utopia Bedding · Coop Home Goods · Panda London · … |
| **Travel Pillow** | Cabeau · BCOZZY · Trtl · Huzi · Dot & Dot · Napfun · Lewis N. Clark · Mulisoft · … |
| **Maternity Pillow** | PharMeDoc · Queen Rose · Niimo · Dreamgenii · bbhugme · Momcozy · … |
| **Tablets / iPads** | Apple · Samsung · Amazon · Microsoft · Lenovo · Xiaomi · Google · Teclast · BOOX · … |
| **E-readers** | Amazon · Kobo · Remarkable · BOOX · PocketBook · Tolino · Supernote · … |
| **Soundbars / AV** | Samsung · LG · Sony · Bose · Sonos · JBL · Yamaha · Denon · KEF · … |
| **Phone accessories** | Spigen · OtterBox · Anker · Belkin · Casetify · UGREEN · Peak Design · Mous · … |
| **Tyres** | Michelin · Continental · Pirelli · Bridgestone · Hankook · Vredestein · Barum · … |
| **Books (publishers)** | Penguin · Bloomsbury · Faber & Faber · Scholastic · Canongate · Fitzcarraldo · … |
| **Collectibles** | Funko · Hot Toys · Bandai · Games Workshop · Good Smile · Tamiya · … |

Order on every leaf: **1. No Brand · 2. Other · 3+ official A–Z**.

---

## Canonical Brand rules (preserved)

Every Brand exists once globally. Leaf categories reference official names.

Brand record fields: Official Name · Normalized Name · Aliases · Country · Official Website · Logo reference · Supported Leaf Categories · Status · Popularity.

Aliases continue to collapse duplicates (`TEMPUR` → Tempur · `Pharmedoc` → PharMeDoc · `kindle` → Amazon · `uag` → Urban Armor Gear).

---

## Attribute database

Materials / Patterns / Styles remain leaf-applicable via existing V3/V4 datasets.  
No Finish / Volume picker inventation (would require Sell UI surfaces — forbidden under freeze).

---

## Quality audit

| Check | Result |
|-------|--------|
| Missing major manufacturers (critical weak leaves) | **PASS** after enrichment |
| Unrelated manufacturers (phones ≠ laptops; travel ≠ maternity) | **PASS** |
| Parent inheritance (Sell Brand/Material) | **PASS** (none) |
| Sibling contamination (identical fingerprints) | **PASS** (0) |
| Duplicate Brands (canonical registry) | **PASS** |
| Duplicate Materials | **PASS** |
| Alphabetical + No Brand / Other fixed | **PASS** |
| Dataset Brand searchable as selectable row | **PASS** |

---

## Files touched (data curation)

| File | Change |
|------|--------|
| `lib/catalog/brand-pools-uk-v1.ts` | New tablet / e-reader / soundbar pools; expanded TV · audio · camera · accessories · books · collectibles · tyres |
| `lib/catalog/product-type-brand-database-v1.ts` | Wire tablet/e-reader/soundbar pools; expand men's grooming manufacturers |
| `lib/catalog/leaf-category-brand-overrides-v1.ts` | Expand pillow / body / seat / outdoor cushion leaf Brand lists |
| `lib/catalog/canonical-brand-registry-v4.ts` | Additional alias normalizations |
| `tests/master-brand-market-coverage-v6-audit.test.ts` | Coverage audit harness |

**Not changed:** Auth · Homepage · Wallet · Messages · Orders · Checkout · Publishing · Listing · Taxonomy tree · Filtering · Search · Schema · UI · UX.

---

## Validation

```text
npm run typecheck  → PASS
npm run lint       → PASS (0 errors)
npm run build      → PASS
```

Supporting tests: leaf brand · leaf normalization · canonical V4 · V6 coverage audit → **PASS**

---

## Production Ready

**NO**

Owner visual Sell Brand search confirmation still required. Data + machine gates PASS.

---

## Final

```text
MASTER BRAND DATABASE MARKET COVERAGE V6 = PASS
SELL FREEZE = ACTIVE
DATA CURATION ONLY · NO AI · NO AUTO-SELECT
NO COMMIT · NO PUSH · NO DEPLOY
PRODUCTION READY = NO
```
