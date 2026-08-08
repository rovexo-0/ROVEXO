# ROVEXO — ORGANIC GROWTH ENGINE v1.0  
## PHASE 0 — SEO FORENSIC AUDIT

| Field | Value |
|-------|-------|
| Status | **COMPLETE** · READ-ONLY |
| Version | 1.0 |
| Date | 2026-08-08 |
| Host evidence | `https://www.rovexo.co.uk` + source tree `/home/mihai/ROVEXO` |
| Performance baseline (Owner) | Mobile PageSpeed: Performance **96** · Accessibility **100** · Best Practices **100** · SEO **61** |
| Constraint | Must not regress Performance Program · No code changes in this phase |

**Classification legend:** `VERIFIED` · `PARTIALLY VERIFIED` · `NOT VERIFIED` · `MISSING` · `CONFLICT` · `RISK` · `BLOCKED`

Evidence is never upgraded. If unproven → `NOT VERIFIED`.

---

## 1. EXECUTIVE SUMMARY

ROVEXO already ships a substantial SEO platform under `lib/seo/` (Organic Growth Platform **v4.0** config), App Router metadata, multi-shard sitemaps, `app/robots.ts`, product/category/brand/location/store/seller landings, faceted browse, and JSON-LD on key surfaces.

Despite that stack, **production Mobile SEO score is 61** (Owner lab). Source + live evidence point to structural indexation gaps—not a missing SEO library:

1. **Guest `/` → `/login` (307)** — crawlers never see Homepage HTML at the root URL (`lib/supabase/middleware.ts`; live `https://www.rovexo.co.uk/` → `location: /login`). Aligns with Auth Master Spec (guest → Login) but is a **hard SEO conflict** for homepage indexation.
2. **Root `metadata.alternates.canonical: "/"`** on `app/layout.tsx` — global default; risk of canonical inheritance if a child omits `alternates` (`RISK`).
3. **robots.txt incomplete vs auth surfaces** — live robots allow crawl of paths that middleware redirects to login (`/wallet`, `/inbox`, `/sell`, etc.) while disallowing some but not all private prefixes (`VERIFIED` gap).
4. **hreflang scaffolded, not emitted** — `buildHreflangAlternates` exists; Metadata `alternates.languages` not wired (`MISSING` live).
5. **Sold listings remain indexable** with normal product metadata; Offer availability maps OutOfStock in JSON-LD only (`PARTIALLY VERIFIED` / `RISK`).
6. **JSON-LD via `afterInteractive`** — may reduce reliability for non-JS crawlers (`RISK`).
7. **No GSC verification meta / no Merchant Center feed / no GTM** (`MISSING`).

Strengths to preserve: inventory-gated indexation (`MIN_INVENTORY_TO_INDEX = 3`), search `?q` / visual / category **noindex**, browse→category canonicalisation, sitemap index (live XML verified), Product+Offer+Breadcrumb JSON-LD on listings, image sitemap shard, Performance Program (96) must remain frozen.

**This audit does not authorise implementation.** Phase 1 requires Owner prioritisation of Auth-vs-SEO homepage policy before any Organic Growth Engine build.

---

## 2. CURRENT SEO SCORE / EVIDENCE

| Metric | Value | Classification |
|--------|-------|----------------|
| Mobile Performance | 96 | `VERIFIED` (Owner PageSpeed — Production baseline) |
| Mobile Accessibility | 100 | `VERIFIED` (Owner) |
| Mobile Best Practices | 100 | `VERIFIED` (Owner) |
| Mobile SEO | **61** | `VERIFIED` (Owner) |
| Exact Lighthouse SEO audit items causing 61 | — | `NOT VERIFIED` (Owner score only; itemised PSI JSON not provided this phase) |
| Live `/` HTTP | **307** → `/login` | `VERIFIED` (curl 2026-08-08) |
| Live `/robots.txt` | **200** · Allow `/` + Disallow list + 13 Sitemap lines | `VERIFIED` |
| Live `/sitemap.xml` | **200** · sitemapindex → 12 child sitemaps | `VERIFIED` |
| Live `/login` `/search` `/browse` | **200** | `VERIFIED` (prior deploy verification) |

---

## 3. ROUTE INDEXATION MATRIX

Source SSOT: `lib/auth/protected-routes.ts`, `app/robots.ts`, page `generateMetadata` / `buildPageMetadata`, middleware guest `/` redirect. Live HTTP sampled for key public paths.

| URL / pattern | Route type | HTTP (guest) | Indexability | Canonical | robots.txt | Sitemap eligible | Reason | Class |
|---------------|------------|--------------|--------------|-----------|------------|------------------|--------|-------|
| `/` | Homepage | **307** → `/login` | Effectively **not crawlable as homepage** | Root meta canonical `/` | Allow | Typically yes (static shard) | Auth cold-start redirect | `CONFLICT` / `RISK` |
| `/login` `/register` `/forgot-password` `/reset-password` `/verify-email` | Auth | 200 | **noindex** (auth layouts + robots Disallow) | Auth | Disallow | No | Auth public | `PUBLIC_NOINDEX` `VERIFIED` |
| `/search` (empty) | Search landing | 200 | **Indexable** (empty landing) | `/search` | Allow | Static | Landing only | `PUBLIC_INDEXABLE` `VERIFIED` |
| `/search?q=` | Search results | 200 | **noIndex: true** | Query path | Allow | No | Facet protection | `PUBLIC_NOINDEX` `VERIFIED` |
| `/search?visual=1` / `?category=` | Search | 200 | **noIndex** | — | Allow | No | Camera / category search | `PUBLIC_NOINDEX` `VERIFIED` |
| `/listing/[slug]` | Listing PDP | 200 (if exists) | Indexable (sold included) | `/listing/{slug}` | Allow | products / images | `productPageMetadata` | `PUBLIC_INDEXABLE` `PARTIALLY VERIFIED` |
| `/category/[...slug]` | Category | 200 / 404 | Index if inventory ≥ 3 | `/category/...` | Allow | categories | `MIN_INVENTORY_TO_INDEX` | `PUBLIC_INDEXABLE` / thin `PUBLIC_NOINDEX` `VERIFIED` |
| `/categories` | Category index | 200 | Indexable | — | Allow | Yes | Hub | `PUBLIC_INDEXABLE` `VERIFIED` |
| `/brand/[slug]` | Brand | 200 / 404 | Inventory-gated | `/brand/{slug}` | Allow | brands | Brand engine | `PUBLIC_INDEXABLE` `VERIFIED` |
| `/browse/[...segments]` | Programmatic facets | 200 | Facet rules; pure category → canonical `/category` | Policy in `browsePageCanonicalPath` | Allow | browse combos | Programmatic SEO | `PUBLIC_INDEXABLE` / `PUBLIC_NOINDEX` `VERIFIED` |
| `/discover/[slug]` `/collections/[slug]` `/trends/[slug]` | Organic landings | 200 / 404 | Inventory / quality gates | Path | Allow | discover/collections/trends | Platform engine | `PARTIALLY VERIFIED` |
| `/l/[location]` `/l/[location]/[...category]` | Location | 200 | Inventory / quality | Path | Allow | locations | UK locations | `PUBLIC_INDEXABLE` `VERIFIED` |
| `/store/[slug]` | Store | 200 | noIndex if 0 listings | `/store/{slug}` | Allow | business | Store metadata | `PUBLIC_INDEXABLE` / empty `PUBLIC_NOINDEX` `VERIFIED` |
| `/user/[username]` | Seller profile | 200 | noIndex if 0 listings | Path | Allow | sellers | Seller metadata | `PUBLIC_INDEXABLE` / empty `PUBLIC_NOINDEX` `VERIFIED` |
| `/help/*` `/legal/*` `/about` `/contact` / policies | Content / legal | 200 | Mostly indexable | Path-specific | Allow | static | Public content | `PUBLIC_INDEXABLE` `PARTIALLY VERIFIED` |
| `/account/*` `/orders` `/checkout` `/seller/*` `/business/*` `/admin/*` `/super-admin/*` `/messages` `/inbox` `/saved` `/notifications` `/wallet` `/balance` `/sell` `/cart` `/settings` | App | **307** → login | Private | private-metadata noindex where set | Mixed Disallow | No | `AUTH_PROTECTED_PREFIXES` | `AUTH_REQUIRED` / `PRIVATE` / `ADMIN` / `SUPER_ADMIN` / `BUSINESS` `VERIFIED` |
| `/api/*` | API | — | Disallow | — | Disallow `/api/` | No | System | `SYSTEM/API` `VERIFIED` |
| `/robots.txt` `/sitemap.xml` `/sitemap/*.xml` | System | 200 | N/A | — | Self | Self | Crawl infra | `SYSTEM/API` `VERIFIED` |
| Soft missing listing/store | Soft unavailable UI | May be **200** + noindex | noindex | — | Allow | No | Prefer hard 404 — soft 200 risk | `RISK` `PARTIALLY VERIFIED` |
| HTTP **410** retired URLs | — | — | — | — | — | — | Not used for pages | `MISSING` |

**UNKNOWN:** Full enumeration of every Super Admin / staff path indexability beyond private-metadata pattern — `NOT VERIFIED` at scale (hundreds of `generateMetadata` exports).

---

## 4. TECHNICAL SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| `metadataBase` | `app/layout.tsx` → `new URL(getAppUrl())` | `VERIFIED` |
| Title template | `"%s \| ROVEXO"` + default title | `VERIFIED` |
| Root description | Marketplace copy in layout | `VERIFIED` |
| Homepage vs root title mismatch | Homepage page.tsx vs layout defaults differ | `CONFLICT` (minor) |
| Canonical helpers | `lib/seo/metadata.ts` `buildPageMetadata` absolute canonical | `VERIFIED` |
| Root canonical `/` | Layout `alternates.canonical: "/"` | `RISK` (inheritance) |
| Open Graph / Twitter | Root + `buildPageMetadata` + homepage | `VERIFIED` |
| `twitter:site` handle | Not found | `MISSING` |
| `opengraph-image.tsx` route | Not found; static `/brand/og-image.png` + `app/api/seo/og` | `PARTIALLY VERIFIED` |
| `app/robots.ts` | Live robots match source Disallow list | `VERIFIED` |
| `public/robots.txt` | Absent (Next serves `app/robots.ts`) | `VERIFIED` (OK pattern) |
| Sitemap index | Rewrite → `/api/seo/sitemap-index`; live XML index | `VERIFIED` |
| Segmented sitemaps | `app/sitemap.ts` + `lib/seo/sitemaps/generators.ts` | `VERIFIED` |
| hreflang | `lib/seo/engine/markets-v2.ts` helper; **not** in Metadata | `MISSING` (live) / scaffold `PARTIALLY VERIFIED` |
| `html lang` | `en-GB` on root html | `VERIFIED` |
| Client locale mutates `lang` | localStorage script | `RISK` (non-SEO i18n flash control) |
| Trailing slash | `trailingSlash` unset → Next default false | `PARTIALLY VERIFIED` |
| 404 | `app/not-found.tsx` | `VERIFIED` |
| 410 page retirement | Not for marketplace pages | `MISSING` |
| SSR metadata | App Router `metadata` / `generateMetadata` | `VERIFIED` |
| Auth-gated crawl | Middleware + protected prefixes | `VERIFIED` |
| Guest homepage block | Middleware L162–167 | `VERIFIED` · `CONFLICT` vs organic homepage SEO |

---

## 5. LISTING SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Route | `app/(platform)/listing/[slug]/page.tsx` | `VERIFIED` |
| Metadata | `productPageMetadata` (`lib/seo/engine/metadata.ts`) | `VERIFIED` |
| Title | `` `${title} · ROVEXO` `` pattern | `VERIFIED` |
| Description | Trimmed (~160) from product copy | `VERIFIED` |
| JSON-LD Product + Offer + BreadcrumbList | `lib/seo/json-ld.ts` + `JsonLdScript` on page | `VERIFIED` |
| Price / currency / availability | Offer in JSON-LD; sold → OutOfStock | `PARTIALLY VERIFIED` |
| Brand / GTIN / MPN on Product | Gaps reported in structured-data inventory | `MISSING` / `PARTIALLY VERIFIED` |
| Images | Gallery + listing image in OG/JSON-LD | `VERIFIED` |
| Alt helpers | `productImageAlt` / `image-seo.ts` | `VERIFIED` |
| Sold handling | Public PDP; **metadata not sold-specific**; still indexable | `RISK` |
| Auction | Redirect `/search` | `VERIFIED` |
| Missing listing | Soft unavailable + noindex (not always `notFound()`) | `RISK` |
| SEO-ready verdict | **Partially ready** — strong base; sold/soft-404/brand fields incomplete | `PARTIALLY VERIFIED` |

---

## 6. CATEGORY SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Routes | `/categories`, `/category/[...slug]` | `VERIFIED` |
| Taxonomy | Catalog Master → category tree helpers (not `getCategoryTree` inside `lib/seo/`) | `VERIFIED` |
| Title / description | `seo_title` / `seo_description` or defaults (`… for Sale UK`) | `VERIFIED` |
| H1 | `CategoryPageView` → `node.name` | `VERIFIED` |
| UI breadcrumbs | Absent (JSON-LD breadcrumbs only) | `PARTIALLY VERIFIED` / freeze |
| Inventory noindex | `< MIN_INVENTORY_TO_INDEX` (3) | `VERIFIED` |
| Editorial FAQ | `category-hub-editorial-v1.ts` when eligible | `VERIFIED` |
| Empty / thin | Soft empty UI + noindex gates | `VERIFIED` |
| Duplicate categories | Catalog Master singularity laws | `VERIFIED` (architecture) · runtime dupes `NOT VERIFIED` |

---

## 7. BRAND SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Brand pages | `/brand/[slug]` + `lib/seo/engine/brands.ts` | `VERIFIED` |
| Brand metadata | `brandPageMetadata` | `VERIFIED` |
| Brand inventory | Eligible listings by brand name | `VERIFIED` |
| Brand JSON-LD / links | Present on brand page | `VERIFIED` |
| Brand sitemap | `buildBrandSitemapEntries` | `VERIFIED` |
| Brand internal linking | Engine internal-linking groups | `PARTIALLY VERIFIED` |

---

## 8. PRODUCT-TYPE SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Dedicated `/product-type/*` route | Not found | `MISSING` |
| Leaf categories as product types | `/category/{root}/{sub}/{leaf}` | `VERIFIED` |
| Browse facet aliases | `lib/seo/programmatic/resolver.ts` | `VERIFIED` |
| Canonical landing uniqueness | Category leaves + inventory gates | `PARTIALLY VERIFIED` |

**Verdict:** Product-type SEO exists as **taxonomy leaves**, not a separate page family.

---

## 9. ATTRIBUTE / FACET SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Facet evaluator | `lib/seo/engine/faceted-seo.ts` | `VERIFIED` |
| Search query noindex | `search/page.tsx` + `index-control.ts` | `VERIFIED` |
| Filter explosion control | >2 filters → noindex; quality/demand gates | `VERIFIED` |
| Browse canonical to category | Pure category browse → `/category/...` | `VERIFIED` |
| Price tiers | `PRICE_COLLECTION_TIERS` in config | `VERIFIED` |
| Crawl traps | Mitigated by design; residual risk on long-tail/location combos | `RISK` `PARTIALLY VERIFIED` |
| Live facet URL explosion volume | — | `NOT VERIFIED` (needs Search Console / crawl logs) |

---

## 10. SELLER / SHOP SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Store | `/store/[slug]` · `storePageMetadata` · 0 listings → noindex | `VERIFIED` |
| User seller | `/user/[username]` · `sellerPageMetadata` | `VERIFIED` |
| Store href SSOT | `lib/store/store-href.ts` | `VERIFIED` |
| Structured data | Store / Person / ItemList | `PARTIALLY VERIFIED` |
| Thin/empty | noIndex when empty | `VERIFIED` |
| Sitemap | sellers + business shards | `VERIFIED` |

---

## 11. LOCATION SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Location SEO exists | **YES** | `VERIFIED` |
| Routes | `/l/[location]`, `/l/[location]/[...category]` | `VERIFIED` |
| UK taxonomy | `lib/seo/locations/uk.ts` | `VERIFIED` |
| Rewrites | `lib/seo/engine/routing.ts` / middleware SEO handler | `VERIFIED` |
| Sitemap | locations shard | `VERIFIED` |
| Hub listing specificity | Location hub may show weakly filtered “recent” | `RISK` `PARTIALLY VERIFIED` |

---

## 12. STRUCTURED DATA INVENTORY

| Type | Source files | Properties (summary) | Validity notes | Class |
|------|--------------|----------------------|----------------|-------|
| Organization | `lib/seo/metadata.ts` → root layout | name, url, logo; `sameAs: []` | Partial | `PARTIALLY VERIFIED` |
| WebSite + SearchAction | metadata + `home-jsonld.ts` | Search target `/search?q=` | Present; duplicated across surfaces | `VERIFIED` / `CONFLICT` (dup) |
| Product | `lib/seo/json-ld.ts` | name, description, image, sku≈slug, Offer, optional AggregateRating | Missing brand/gtin/reviews[] | `PARTIALLY VERIFIED` |
| Offer | same | price, currency, availability, condition | Missing seller / shipping / priceValidUntil | `PARTIALLY VERIFIED` |
| BreadcrumbList | json-ld + category/listing | Item list | Wired | `VERIFIED` |
| ItemList | home, store, brand, discover | Capped lists | Wired | `VERIFIED` |
| CollectionPage | category/brand/browse/local | Present | — | `VERIFIED` |
| FAQPage | help, category editorial, browse thin FAQ | Browse always 2 Qs | Thin FAQ risk on browse | `PARTIALLY VERIFIED` / `RISK` |
| AggregateRating | Product/Store/Person when counts > 0 | Aggregates only | No Review entities live | `PARTIALLY VERIFIED` |
| Review | `lib/seo/engine/ugc-seo.ts` | Helpers only | **Not mounted on pages** | `MISSING` (live) |
| Place / Store / Person | location / store / seller | Present | — | `PARTIALLY VERIFIED` |
| Injection | `JsonLdScript` `strategy="afterInteractive"` | — | Non-JS crawler risk | `RISK` |
| Google rich-result eligibility | — | — | **Not claimed** without Rich Results test | `NOT VERIFIED` |

---

## 13. IMAGE SEO AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| ListingCard alt | `alt={product.title}` | `VERIFIED` |
| Gallery alt helpers | `image-seo.ts` / `productImageAlt` | `VERIFIED` |
| next/image via SafeImage | Performance Program · AVIF/WebP · priority/fetchPriority | `VERIFIED` |
| Image sitemap | `/sitemap/images.xml` declared + generators | `VERIFIED` (declaration) · URL completeness `NOT VERIFIED` at scale |
| Lazy / priority | Listing/search patterns | `VERIFIED` |
| Width/height / CLS | SafeImage fill + sizes | `PARTIALLY VERIFIED` |

---

## 14. INTERNAL LINKING AUDIT

| Edge | Evidence | Class |
|------|----------|-------|
| Homepage → Category (10 roots) | `ROVEXO_HOME_CATEGORY_RAIL` → `/category/{slug}` | `VERIFIED` (source) · **live crawler never sees Homepage** | `CONFLICT` |
| Search landing → Category | `SearchLandingView` same rail | `VERIFIED` |
| Category → Listings | Category page listing grid | `VERIFIED` |
| Listing → Store/Seller | `ProductStoreSection` / store-href | `VERIFIED` |
| Brand / discover / collections link groups | `internal-linking.ts` / `internal-links.ts` | `PARTIALLY VERIFIED` |
| UI breadcrumbs on category | Missing | `MISSING` (UI) |
| Orphan pages | Programmatic long-tail / trends may be weakly linked | `RISK` `NOT VERIFIED` (crawl graph) |
| Broken links | — | `NOT VERIFIED` |

---

## 15. PROGRAMMATIC SEO AUDIT

| Family | URL pattern | Data source | Indexability | Thin risk | Class |
|--------|-------------|-------------|--------------|-----------|-------|
| Browse facets | `/browse/[...segments]` | Programmatic resolver + inventory | Facet rules | Medium–High if over-generated | `VERIFIED` |
| Discover | `/discover/[slug]` | discovery engine | Gated | Medium | `VERIFIED` |
| Collections | `/collections/[slug]` | collections engine | Gated | Medium | `VERIFIED` |
| Trends | `/trends/[slug]` | trends + TTL | Gated | High (TTL 14d) | `VERIFIED` |
| Brands | `/brand/[slug]` | brands engine | Inventory ≥ 3 | Medium | `VERIFIED` |
| Locations | `/l/...` | UK locations × categories | Gated | High at town×category scale | `VERIFIED` / `RISK` |
| Long-tail expansion | engine modules | demand/quality gates | Stricter mins | High if abused | `PARTIALLY VERIFIED` |

**Hard constraint (architecture):** Do **not** mass-generate pages because it is technically possible. Google Search Essentials / scaled content abuse — treat as **BLOCKED** for “generate everything” strategies. Prefer inventory-backed, unique, people-first hubs already gated by `MIN_INVENTORY_*` and quality scores.

---

## 16. SEO PROTECTION / ANTI-BLOAT AUDIT

| Control | Status | Class |
|---------|--------|-------|
| Inventory thresholds | Present (3 / 5 / soft 1) | `VERIFIED` |
| Search results noindex | Present | `VERIFIED` |
| Facet noindex / ignore | Present | `VERIFIED` |
| Private route middleware | Present | `VERIFIED` |
| robots Disallow private | Partial (gaps: wallet/inbox/sell/…) | `RISK` |
| Soft 200 unavailable pages | Present | `RISK` |
| Duplicate canonical risk (root `/`) | Present | `RISK` |
| Parameter explosions | Mitigated; scale `NOT VERIFIED` | `PARTIALLY VERIFIED` |
| API indexation | Disallow `/api/` | `VERIFIED` |
| Accidental auth URL indexing | Login redirects may still burn crawl budget | `RISK` |
| Blog sitemap shard | Declared; content dependency | `PARTIALLY VERIFIED` |

---

## 17. GOOGLE INTEGRATIONS AUDIT

| Integration | Evidence | Class |
|-------------|----------|-------|
| Google Search Console verification meta/file | Not found in app | `MISSING` |
| Sitemap ping helper | `lib/seo/engine/search-console.ts` (env-gated) | `PARTIALLY VERIFIED` (code) · live submission `NOT VERIFIED` |
| GA4 | `GoogleAnalytics.tsx` · consent-gated · `@next/third-parties` | `VERIFIED` |
| GTM container | Not found | `MISSING` |
| Merchant Center / Shopping feed | Not found | `MISSING` |
| Bing ping | Referenced in search-console helper | `PARTIALLY VERIFIED` |

**Do not configure in Phase 0.**

---

## 18. SEO PERFORMANCE AUDIT

| Item | Evidence | Class |
|------|----------|-------|
| Performance Program baseline | 96 / 100 / 100 | `VERIFIED` (Owner) — **DO NOT TOUCH** |
| Server metadata | App Router | `VERIFIED` |
| Client-only SEO content | Not primary pattern | `VERIFIED` |
| JSON-LD `afterInteractive` | `JsonLdScript.tsx` | `RISK` (crawl) · low Perf impact |
| htmlLimitedBots | `next.config.ts` forces metadata into HTML | `VERIFIED` (prior audits) |
| SEO must not regress Perf | Constraint | `BLOCKED` for heavy client SEO / megabundle reintroduction |

---

## 19. EXISTING SEO FEATURES

- Root + page metadata, title template, OG/Twitter  
- `buildPageMetadata` / engine metadata builders  
- `app/robots.ts` + multi-sitemap declarations  
- Sitemap index API + 12 shards (static, categories, locations, products, sellers, business, brands, discover, collections, trends, blog, images)  
- Listing / category / brand / store / seller / location / browse / discover / collections / trends landings  
- Inventory + quality + facet index control  
- JSON-LD: Organization, WebSite, Product, Offer, BreadcrumbList, ItemList, FAQ (partial), Store/Person/Place  
- Image sitemap + image SEO helpers  
- SEO middleware redirects/rewrites (`middleware-handler`, `seo_redirects`)  
- Admin SEO surfaces (`admin/seo`, API admin SEO) — depth `NOT VERIFIED`  
- GA4 consent-gated analytics  

---

## 20. MISSING SEO FEATURES

- Crawlable public Homepage at `/` for guests/bots (Auth conflict)  
- Live hreflang in Metadata  
- GSC HTML/DNS verification in repo  
- Merchant Center / product feed  
- GTM  
- Review JSON-LD on live pages  
- HTTP 410 for retired URLs  
- Complete robots Disallow parity with `AUTH_PROTECTED_PREFIXES`  
- Dedicated product-type URL family (optional — leaves exist)  
- UI breadcrumbs on category (JSON-LD only)  
- Sold-specific metadata / deindex policy  
- Hard 404 for missing listing/store (soft UI)  
- Itemised explanation of PageSpeed SEO 61 audits  

---

## 21. DUPLICATES / CONFLICTS

| Conflict | Class |
|----------|-------|
| Auth guest `/` → Login vs Homepage organic SEO | `CONFLICT` · `P0` |
| Root canonical `/` vs per-page canonicals | `RISK` |
| Root vs Homepage title/description copy | `CONFLICT` (minor) |
| Duplicate WebSite JSON-LD (root + homepage) | `CONFLICT` (minor) |
| robots incomplete vs middleware-protected paths | `RISK` |
| Soft 200 unavailable vs SEO 404 best practice | `RISK` |
| Programmatic scale capability vs scaled-content abuse policy | `BLOCKED` (mass gen) |

---

## 22. P0 / P1 / P2 FINDINGS

### P0
1. Guest/crawler Homepage unavailable at `/` (307 → login) — primary organic landing blocked.  
2. Confirm & remediate PageSpeed SEO 61 root causes with itemised PSI export (`NOT VERIFIED` item list).  
3. Root layout canonical `/` inheritance risk on pages missing `alternates`.  
4. Soft-200 missing listing/store pages.

### P1
1. Expand robots.txt Disallow to match auth-protected prefixes (`/wallet`, `/inbox`, `/sell`, `/cart`, `/settings`, …) without changing Auth behaviour.  
2. Sold listing indexation policy (noindex / title / availability messaging).  
3. Prefer SSR-inline JSON-LD (or document crawler acceptance of `afterInteractive`) without Perf regression.  
4. GSC verification + sitemap submission confirmation.  
5. Organization `sameAs` / richer Product fields (brand) when data exists.  
6. Location×category thin-page monitoring.

### P2
1. Emit hreflang only when multi-market is truly active (`markets.ts` mostly inactive).  
2. UI breadcrumbs if Owner unfreezes category UI.  
3. Wire Review schema only with real review content.  
4. Merchant feed only if Shopping strategy approved.  
5. Twitter site handle / dynamic OG improvements.  
6. HTTP 410 policy for permanently removed URLs.

---

## 23. RISK MATRIX

| Risk | Impact | Perf impact if fixed poorly | Class |
|------|--------|----------------------------|-------|
| Homepage not indexable | High organic | Medium if Auth changed carelessly | `RISK` |
| Soft 200 soft-404s | Index bloat / trust | Low | `RISK` |
| Facet/location over-generation | Scaled content abuse | Low–Medium (more HTML) | `RISK` / `BLOCKED` mass gen |
| robots gaps | Crawl waste on login redirects | None for Disallow-only fix | `RISK` |
| JSON-LD afterInteractive | Rich results miss | None if moved carefully to SSR | `RISK` |
| Sold pages indexed | Poor SERP UX | None | `RISK` |
| SEO work regressing Perf 96 | Business / Owner baseline | **High** | `BLOCKED` |

---

## 24. RECOMMENDED IMPLEMENTATION ORDER

1. **Owner decision:** Homepage public for crawlers vs Auth guest→Login freeze (policy first).  
2. Capture **itemised PageSpeed SEO 61** audits.  
3. **Protection-only** fixes: robots parity, canonical inheritance audit, hard 404/410 policy (no Perf touch).  
4. Listing quality: sold/noindex policy, Product brand fields, soft-404 → 404.  
5. GSC verify + monitor coverage (no code-heavy features).  
6. Strengthen existing hubs (category/brand/store) uniqueness — **not** new URL mass generation.  
7. Only then evaluate Merchant / Review / hreflang if markets go live.  

All steps must preserve Performance Program baseline.

---

## 25. ROVEXO ORGANIC GROWTH ENGINE GAP ANALYSIS

| Engine capability (code) | Production organic value | Gap |
|--------------------------|--------------------------|-----|
| Full `lib/seo` v4 platform | High potential | Undermined by `/` → login |
| Multi-sitemap | Live & working | Coverage quality `NOT VERIFIED` in GSC |
| Programmatic browse/location/trends | Exists | Over-generation risk if expanded blindly |
| Inventory gates | Strong anti-thin control | Keep as SSOT |
| JSON-LD library | Broad | Completeness + injection strategy |
| Faceted noindex | Strong | Keep |
| Analytics | GA4 present | GSC / Merchant missing |
| Performance coexistence | Perf 96 | Any SEO Phase 1+ must be Perf-safe |

**Gap summary:** The Organic Growth **engine largely exists in source**; the **organic growth outcome is blocked** primarily by Auth homepage policy, incomplete crawl hygiene, and unverified Search Console reality—not by absence of an SEO folder.

---

## FINAL STOP CONDITION

### SEO FORENSIC PHASE 0 COMPLETE

| Item | Result |
|------|--------|
| **Files inspected** | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/(platform)/page.tsx`, `listing/[slug]/page.tsx`, `search/page.tsx`, `category/[...slug]`, brand/store/user/browse/l/* pages, `lib/seo/**` (engine, programmatic, sitemaps, json-ld, metadata, faceted-seo, config), `lib/auth/protected-routes.ts`, `lib/supabase/middleware.ts`, `components/seo/JsonLdScript.tsx`, `next.config.ts` (sitemap rewrite), analytics GA4 paths |
| **Routes inspected** | Live: `/`, `/login`, `/search`, `/browse`, `/robots.txt`, `/sitemap.xml`, `/categories`; Source matrix for public SEO + auth-protected families |
| **SEO systems found** | Metadata builders, robots, sitemap index+shards, JSON-LD, faceted SEO, programmatic landings, brands, locations, internal linking, SEO middleware, admin SEO stubs, GA4 |
| **Verified strengths** | Inventory-gated indexation; search noindex; sitemap index live; Product JSON-LD; category/brand/store/seller/location routes; Perf baseline 96 frozen |
| **P0 findings** | `/` → login for guests/crawlers; SEO score 61 unexplained at audit-item level; root canonical risk; soft-200 unavailable pages |
| **P1 findings** | robots parity; sold index policy; JSON-LD injection; GSC verify; Product brand fields; location thin monitoring |
| **P2 findings** | hreflang when markets live; UI breadcrumbs; Review schema; Merchant; 410 policy |
| **NOT VERIFIED** | Itemised PSI SEO audits; GSC coverage; full orphan graph; live rich-result eligibility; blog/trends content fill rates; every Super Admin meta path |
| **Recommended next phase** | **Phase 1 — Owner Policy + Protection Pack** (Homepage crawl policy decision → robots/canonical/404 hygiene → sold policy) · **No mass page generation** · **No Performance Program edits** |

---

**NO CODE CHANGES · NO COMMIT · NO PUSH · NO DEPLOY · STOP.**
