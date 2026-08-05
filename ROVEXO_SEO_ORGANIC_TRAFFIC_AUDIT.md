# ROVEXO SEO & ORGANIC TRAFFIC AUDIT

**TYPE:** Evidence-only audit · **NO IMPLEMENTATION**  
**DATE:** 2026-08-04  
**SCOPE:** Current codebase as implemented (routes · metadata · sitemap · robots · schema · SEO engine · public surfaces)  
**FOCUS:** Traditional search engines (Google · Bing · etc.) and organic growth  
**EXCLUDED:** AI Search · LLM optimisation · AI recommendations-as-product · Code changes · Commits · Deploy  

---

## Executive Summary

ROVEXO already ships a **substantial traditional SEO stack**: Next.js Metadata API, segmented sitemaps, robots rules, PWA manifest, Open Graph / Twitter Cards, Organization / WebSite / Product / Breadcrumb / FAQ / Collection JSON-LD, UK location + discover + collection + browse programmatic landings, seller/store metadata, image optimisation (AVIF/WebP), and empty-inventory noindex controls.

**What exists today is stronger on technical / marketplace SEO architecture than on evergreen content depth and live index readiness.**

**Final overall SEO score: 6.8 / 10**

Primary organic limits before production are not “missing robots.txt” — they are:

1. **Launch private mode** can force sitewide `noindex` when enabled.  
2. **Thin inventory** → many programmatic URLs correctly noindex until ≥3 listings (long-tail ≥5).  
3. **Shallow Help / guide / evergreen content** vs category/product scale.  
4. **No hreflang** (UK-first is fine; multi-market inactive).  
5. **Listing “Similar items” internal links frozen off** (product page network comment).  
6. **Domain authority / backlinks / review volume** — not solvable in code alone; competitors lead here.

---

## Part 1 — Current SEO Inventory

### 1.1 Next.js Metadata API (present)

| Surface | Evidence |
|---------|----------|
| Root defaults | `app/layout.tsx` — `metadataBase`, title template `%s \| ROVEXO`, description, OG, Twitter, canonical `/`, icons, manifest, optional launch private robots |
| Shared builder | `lib/seo/metadata.ts` → `buildPageMetadata()` — title, description, canonical, robots, OG, Twitter |
| Private pages | `lib/seo/private-metadata.ts` — `robots: { index: false, follow: false }` |
| Engine builders | `lib/seo/engine/metadata.ts` — product, seller, store, discovery, brand, location-category, browse |

### 1.2 Title / description generation (present)

| Page type | How |
|-----------|-----|
| Homepage | Static title + description (`app/(platform)/page.tsx`) |
| Listing | Dynamic `productPageMetadata()` from title/description/image |
| Category | Dynamic `buildPageMetadata()` + category copy |
| Categories index | Static via `buildPageMetadata()` |
| Search landing | Indexable static copy; query/category/visual → **noindex** |
| Seller `/user/[username]` | `sellerPageMetadata()` |
| Store `/store/[slug]` | `storePageMetadata()` |
| Discover / collections / trends / brand / location | Engine metadata + inventory gates |
| Browse programmatic | `ProgrammaticPageView` + resolver metadata |
| Help articles | Title + summary (partial — see gaps) |
| Legal | Title + summary + canonical |
| About | Title + description |
| Auth / account / wallet / inbox / admin | Mostly noindex or private metadata |

### 1.3 Canonical URLs (present)

- `buildPageMetadata` sets `alternates.canonical` to absolute URL via `getAppUrl()`.  
- Root + Homepage set canonicals.  
- Legal documents set `alternates.canonical: /legal/{slug}`.  
- Browse policy: pure category browse canonicalises toward `/category/...` (`browsePageCanonicalPath`).  
- Faceted / long-tail engines include canonical / noindex / ignore decisions (`lib/seo/engine/long-tail-expansion.ts`, `faceted-seo.ts`).

### 1.4 Open Graph + Twitter Cards (present)

- Root + Homepage + `buildPageMetadata` surfaces: `openGraph` + `twitter.summary_large_image`.  
- Default image: `/brand/og-image.png` (1200×630).  
- Dynamic OG SVG endpoint: `app/api/seo/og/route.ts` (title/subtitle → SVG).  
- **Gap:** Help article routes set title/description only — **not** full OG/Twitter via `buildPageMetadata`.

### 1.5 robots.txt (present)

- `app/robots.ts`  
- Normal mode: allow `/`; disallow admin/api/checkout/account/seller/business/messages/orders/saved/notifications/resolution/auth/auctions/sell auction paths.  
- Declares sitemap index + 12 child sitemap URLs.  
- **Launch private mode:** `disallow: /` for all agents (`isLaunchPrivateMode()`).

### 1.6 Sitemap (present)

- `app/sitemap.ts` + `generateSitemaps()` — 12 segments: static, categories, locations, products, sellers, business, brands, discover, collections, trends, blog, images.  
- Generators: `lib/seo/sitemaps/generators.ts` (DB-backed products/sellers/business/brands/images; static help/categories/locations/collections/discover).  
- Index served via rewrite: `/sitemap.xml` → `app/api/seo/sitemap-index/route.ts` (comment: live metadata index 404 workaround).  
- Product sitemap: published, non-demo, limit 5000.  
- Seller/business limits 1000/500.  
- Image sitemap from `product_images` (limit 2000).  
- “Blog” sitemap currently maps **Help articles**, not a separate blog CMS.

### 1.7 Manifest / PWA (present)

- `app/manifest.ts` — name, description, icons, screenshots, shortcuts (Search / Sell / Messages), `lang: en-GB`, shopping category.

### 1.8 Structured data / Schema.org / JSON-LD (present)

| Schema | Where |
|--------|--------|
| Organization + WebSite + SearchAction | Root layout (`organizationJsonLd`) |
| WebSite + ItemList of Products | Homepage (`homePageJsonLd`) |
| Product + Offer + AggregateRating + BreadcrumbList | Listing (`productJsonLd`) |
| CollectionPage + BreadcrumbList | Category pages |
| Person + ItemList | Seller profiles |
| Store + ItemList | Business stores |
| CollectionPage / Place | Location pages |
| Brand / ItemList / Breadcrumbs | Brand pages |
| FAQPage | SEO landing FAQ (`faqJsonLd` / engine FAQ) |
| Discovery / collection landings | Engine JSON-LD on discover/collections/trends |

### 1.9 Breadcrumbs (present)

- Visible breadcrumb nav on SEO landings (`SeoLandingPageView`).  
- JSON-LD `BreadcrumbList` on listings, categories, location+category, brand.  
- Category UI + internal link sections.

### 1.10 Pagination SEO (limited)

- Faceted/search engines reason about `page` filters for noindex (`shouldNoIndexDuplicateFilters`).  
- **No evidence** of widespread `rel="next"` / `rel="prev"` link tags on public listing grids.  
- Search query result pages are **noindex** (correct for thin SERP clones).

### 1.11 Category SEO (present)

- `/categories` index + `/category/[...slug]` with metadata + JSON-LD + `InternalLinksSection`.  
- Sitemap from flattened category paths + browse aliases.  
- Catalog Master roots drive index cards.

### 1.12 Listing SEO (present)

- `/listing/[slug]` dynamic metadata + Product JSON-LD + gallery alt text.  
- Legacy redirects: `/item|product|products/:slug` → `/listing/:slug` (next.config).  
- Missing listing → noindex metadata or Store Unavailable (forbidden slugs redirect home).  
- Auctions redirect to `/search` (not indexed as auction PDP).

### 1.13 Seller / business profile SEO (present)

- `/user/[username]` — metadata, Person JSON-LD, ItemList, noindex if 0 listings.  
- `/store/[slug]` — Store JSON-LD + metadata.  
- Sitemaps for sellers + business profiles.  
- Note: robots disallows `/business/` (dashboards); public storefronts use `/store/`.

### 1.14 Image ALT / TITLE (present)

- `ListingCard`: `alt={product.title}`; seller avatar alts.  
- Product gallery: `alt={`${title} — photo N`}`.  
- `SafeImage` requires `alt` prop.  
- Image SEO helpers: `lib/seo/engine/image-seo.ts` (`productImageAlt` / `productImageTitle`, lazy/eager).  
- OG image `alt: "ROVEXO marketplace"` on homepage.

### 1.15 Meta robots / index control (present)

- Private path prefixes: `lib/seo/engine/index-control.ts`.  
- Inventory gates: `MIN_INVENTORY_TO_INDEX = 3`, long-tail `5`, quality score ≥55.  
- Empty landings: `robotsForInventory` → noindex,follow.  
- Search with query/category/visual: noindex.  
- Launch private mode: sitewide noindex.

### 1.16 Hreflang (absent as live alternate links)

- Market table exists (`lib/seo/markets.ts`) with UK active; IE/DE/FR/… inactive.  
- Health center flags `hreflangReady: true` as capability flag.  
- **No** `alternates.languages` / `hreflang` link tags found in app routes.  
- Locale script can set `lang` from localStorage; default document `lang="en-GB"`.

### 1.17 URL structure (present)

| Pattern | Purpose |
|---------|---------|
| `/` | Homepage |
| `/listing/{slug}` | Product |
| `/category/{...}` | Taxonomy |
| `/categories` | Category index |
| `/search` | Search landing (indexable) / results (noindex when queried) |
| `/user/{username}` | Seller |
| `/store/{slug}` | Business store |
| `/browse/{...}` | Programmatic / facet landings |
| `/discover/{slug}` | Long-tail discovery |
| `/collections/{slug}` | Curated collections (~43 incl. price tiers) |
| `/trends/{slug}` | Trend landings |
| `/brand/{slug}` | Brand landings |
| `/l/{location}` · `/l/{location}/{...category}` | UK local SEO |
| `/help/{slug}` · `/help/faq` | Help |
| `/legal/{slug}` | Legal |

Approx inventory (code counts):

- UK locations: **~100** entries (~30 cities).  
- Help articles: **~24**.  
- Legal documents: **~21**.  
- Collections: **~43**.  
- Category aliases: **~22**.  
- Discovery static slug generation: **hundreds** (buy/sell aliases + product patterns + city combos).  
- Browse city×alias combos in sitemap (30 cities × 12 aliases).

### 1.18 Internal linking (present, uneven)

- Category + SEO landings: `InternalLinksSection` (related categories, popular browse, collections).  
- Homepage: category rail + listing cards → listing/store.  
- Help / About link to Legal / Support.  
- **Listing similar-items fetch frozen off** (explicit product-page comment) → weaker PDP internal linking.

### 1.19 Search pages (present)

- Indexable empty `/search` landing with trending.  
- Queried SERPs noindex.  
- Image search results route noindex.  
- Camera search results metadata via `buildPageMetadata`.

### 1.20 404 (present)

- `app/not-found.tsx` — human copy + link home.  
- **No dedicated 404 metadata** (title/robots) beyond default.  
- Soft failures: Store Unavailable for missing listings (not always hard 404).

### 1.21 Redirects (present)

- `next.config.ts` permanent redirects: wallet/balance aliases, legal slug aliases, product URL aliases, browse shortcuts (`/cars`, `/phones`, …).  
- SEO DB redirects: `lib/seo/engine/redirects.ts` (`seo_redirects` table, middleware-safe cache).  
- Help→Legal / Help→Delivery redirects in help article route.  
- Auth middleware redirects (not SEO growth; crawl hygiene).

### 1.22 Dynamic vs static metadata (both present)

- Static: homepage, categories index, help index/FAQ, about, many legal-ish pages.  
- Dynamic: listing, category tree, user, store, search params, discover/collections/trends/brand/location/browse.

### 1.23 Lazy loading / image optimisation (present)

- Next Image: AVIF/WebP, quality allowlist, 30-day `minimumCacheTTL`, Supabase remote patterns (`next.config.ts`).  
- Gallery: first eager/priority; others lazy (`image-seo` helpers + gallery).  
- Homepage feed revalidate `60`; categories `3600`.  
- Listings: `dynamic = "force-dynamic"` (freshness over static HTML cache).

### 1.24 SEO ops / admin (present — not public organic)

- Super-admin / admin SEO health, audit, regression, analytics APIs.  
- `SeoHealthCenter` UI.  
- Search Console ping helpers (`lib/seo/engine/search-console.ts`).  
- Organic Growth Platform config branded **v4.0** in `lib/seo/engine/config.ts`.

---

## Part 2 — SEO Quality Scorecard

Scores are **0–10** against traditional organic readiness for a UK marketplace, based on **what the code implements today** (not live Search Console rankings).

| Area | Score | Why |
|------|------:|-----|
| Homepage | **7.5** | Strong metadata + OG/Twitter + dual JSON-LD; copy is generic; depends on live inventory in ItemList |
| Listings | **8.0** | Product metadata, Offer schema, breadcrumbs, image alts, canonical; force-dynamic; similar-items linking removed |
| Categories | **7.5** | Metadata, CollectionPage schema, internal links, sitemap; depth depends on Catalog Master + inventory |
| Search | **6.5** | Correct noindex on query SERPs; landing is thin vs category hubs |
| Seller profiles | **7.5** | Indexable when stocked; Person + ItemList; empty noindex |
| Business / stores | **7.5** | Store schema + sitemap; robots correctly keep `/business/` private |
| Help Centre | **5.5** | ~24 articles, FAQ route; incomplete OG/canonical vs commerce pages; some topics reference inactive verticals |
| Legal | **6.0** | Solid for compliance indexing; low organic demand; titles/canonicals OK |
| Images | **7.5** | SafeImage, modern formats, gallery alts, image sitemap, OG asset |
| Metadata system | **8.0** | Shared builder + engine + private gates; Help not fully on builder |
| Technical SEO | **8.0** | robots, 12-part sitemap index rewrite, redirects, private mode, crawl disallow list |
| Performance SEO | **7.0** | Image pipeline strong; PDP force-dynamic + large private app surface reduce crawl efficiency |
| Internal linking | **7.0** | Strong on landings/categories; weaker on PDP (similar frozen) |
| Rich results readiness | **7.5** | Product / Org / WebSite / FAQ / Breadcrumb present; review volume gating AggregateRating |
| **Overall** | **6.8** | Architecture ahead of content/authority/inventory maturity |

---

## Existing Strengths

1. **Marketplace SEO architecture is real** — not a stub: segmented sitemaps, inventory-aware noindex, programmatic browse/discover/collections/locations.  
2. **Listing Product JSON-LD** with Offer, currency, condition, availability.  
3. **Private surfaces systematically noindexed** (account, checkout, auth, admin).  
4. **Search query SERPs noindexed** — protects against thin duplicate index bloat.  
5. **Canonical product URL migration** (`/item`, `/product` → `/listing`).  
6. **Image delivery** optimised for Core Web Vitals-adjacent SEO (AVIF/WebP, caching).  
7. **UK local URL layer** (`/l/{city}`) + category combos.  
8. **FAQ schema** on organic landing templates.  
9. **Seller/store profiles** designed as indexable when they have listings.  
10. **Launch private mode** exists to prevent accidental pre-launch indexing (must be **off** for organic growth).

---

## Weaknesses

1. **Organic traffic is inventory-gated** — empty/low-stock programmatic pages noindex until thresholds (3 / 5). At soft launch, Google sees architecture more than content.  
2. **Help / buying / selling guides are thin** (~24 help articles; blog sitemap = help reuse).  
3. **Help metadata incomplete** vs `buildPageMetadata` (weaker social/search snippets).  
4. **No live hreflang** (acceptable for UK-only; markets table inactive).  
5. **404 SEO** minimal (no dedicated robots/title strategy).  
6. **Pagination link tags** not evidenced as first-class.  
7. **PDP internal linking** reduced (similar items frozen).  
8. **Categories copy mismatch risk** (index description text vs 10-root Catalog Master — content accuracy).  
9. **Private mode / env** can zero organic overnight if left on.  
10. **Domain authority, citations, backlinks, brand search** — outside codebase; currently behind mature marketplaces.  
11. **robots disallow `/business/`** — correct for dashboards; ensure public storefronts stay only on `/store/` (they do).  
12. **Force-dynamic listings** — fresher data, less edge/HTML cache for crawlers.

---

## Part 3 — Organic Traffic Opportunities (traditional search only · no implementation)

| Opportunity | Expected SEO impact | Notes from current state |
|-------------|---------------------|---------------------------|
| **Fill category + listing inventory** so hubs pass index thresholds | **Very high** | Architecture already indexes when ≥3 listings |
| **Category landing copy depth** (H1, unique intro, FAQs per root/sub) | **High** | Templates exist; content depth drives rankings |
| **Location × category pages with real stock** | **High** | `/l/...` + combos already routed/sitemapped |
| **Collections & seasonal hubs** with unique intros | **High** | ~43 collection slugs already |
| **Discover long-tail only when demand + stock** | **High** | Engine already noindexes thin pages |
| **Buying / selling guides** (evergreen, non-AI) | **High** | Help is thin vs Vinted/eBay content libraries |
| **FAQ expansion with FAQPage schema** | **Medium–High** | FAQ components/schema exist |
| **Related listings on PDP** (when Owner unfreezes) | **Medium–High** | Currently frozen off |
| **Brand pages for brands with inventory** | **Medium–High** | `/brand/{slug}` + sitemap exist |
| **Featured / verified seller hubs** | **Medium** | Collection slugs exist (`verified-sellers`, `featured-stores`) |
| **Popular / trending search → category redirects** | **Medium** | Avoid indexing raw `?q=` SERPs (already noindex) |
| **Image sitemap coverage + descriptive alts at scale** | **Medium** | Pipeline present; quality scales with listing titles |
| **Ensure private mode OFF + Search Console sitemap submit** | **Critical enabler** | Without this, zero organic |
| **Legal/Help canonical hygiene** (already partial) | **Low–Medium** | Compliance pages support trust signals |
| **Pagination / crawl rules for large category grids** | **Medium** | When inventory scales |
| **UK city coverage expansion beyond top cities** | **Medium** | ~100 locations coded; depth needs stock |
| **Seasonal evergreen pages** (back-to-school, winter, gifts) | **Medium** | Collection definitions already named |
| **Internal links from Homepage → deepest categories** | **Medium** | Rail exists; depth linking can grow |
| **Review schema volume** (completed orders only) | **Medium–High** | AggregateRating already wired when reviews exist |

---

## Part 4 — Competitor Gap (SEO perspective only)

Comparison is **capability / typical marketplace SEO posture**, not a live ranking scrape in this audit.

| Dimension | Vinted | eBay | Amazon Marketplace | Bidzzy | ROVEXO today |
|-----------|--------|------|--------------------|--------|--------------|
| Product schema | Strong | Strong | Strong | Likely strong | **Equal** (Product+Offer implemented) |
| Category hub depth | Strong | Very strong | Very strong | Strong | **Behind** (structure yes; content/inventory depth TBD) |
| Programmatic SEO | Strong | Very strong | Extreme | Strong | **Equal / Ahead for size** (discover/browse/collections coded early) |
| Local SEO | Limited–medium | Strong | Strong | Medium | **Equal intent** (`/l/` UK layer) |
| Seller profile SEO | Strong | Strong | Strong (storefronts) | Medium | **Equal architecture** |
| Guides / magazine / Help SEO | Strong | Very strong | Extreme | Medium | **Behind** (thin Help) |
| International / hreflang | Strong | Strong | Extreme | Varies | **Behind** (UK-only active) |
| Domain authority / backlinks | Extreme | Extreme | Extreme | Lower–medium | **Behind** (new domain) |
| Index hygiene (noindex thin) | Mature | Mature | Mature | Unknown | **Equal / Ahead in code intent** |
| Image SEO | Strong | Strong | Extreme | Medium | **Equal** (modern Next image stack) |
| Brand SERP / sitelinks maturity | Extreme | Extreme | Extreme | Growing | **Behind** |

### Where ROVEXO is Ahead

- Early investment in **Organic Growth Platform** (segmented sitemaps, inventory gates, programmatic landings) relative to product age.  
- Explicit **noindex for empty / query SERPs** — healthier than indexing every filter combination.

### Where ROVEXO is Equal

- Core **Metadata API + OG/Twitter + Product JSON-LD + robots/sitemap** baseline expected of a modern Next marketplace.  
- Seller/store public profile SEO patterns.

### Where ROVEXO is Behind

- **Evergreen content libraries** and editorial buying guides.  
- **Authority** (links, brand searches, historical crawl trust).  
- **Scale of indexable inventory** and review-rich PDPs.  
- **Multi-market hreflang** (competitors already operate multi-locale).  
- **Pagination / facet at mega-catalogue scale** (engines exist; not battle-tested at Amazon scale).

---

## Part 5 — Priority Roadmap (audit only · no implementation)

| Priority | Item | Difficulty | Impact | Traffic potential |
|----------|------|------------|--------|-------------------|
| **Critical** | Confirm launch private mode **OFF** in production; robots allow indexing; submit sitemap index in Google Search Console / Bing Webmaster | Low (ops) | Critical | Unlocks all organic |
| **Critical** | Publish real inventory so category/location/collection pages clear **≥3** (long-tail **≥5**) index thresholds | High (ops + sellers) | Critical | Very high |
| **Critical** | Keep private routes noindex; never index checkout/account/auth | Low (already largely done) | Critical | Protects quality |
| **High** | Deepen unique copy on top category + collection hubs + FAQs | Medium | High | High |
| **High** | Expand Help buying/selling guides (traditional editorial) | Medium | High | High |
| **High** | Bring Help/Legal onto full `buildPageMetadata` (canonical + OG) | Low | Medium–High | Medium |
| **High** | Restore PDP related/internal links when Owner allows (frozen today) | Medium | High | Medium–High |
| **High** | Prioritise brand + location pages only where stock exists | Medium | High | High |
| **Medium** | Seasonal / evergreen collection pages with unique intros | Medium | Medium | Medium |
| **Medium** | Pagination / crawl rules as catalogue grows | Medium | Medium | Medium |
| **Medium** | Image alt quality standards for sellers (title discipline) | Medium | Medium | Medium |
| **Medium** | 404 metadata + soft soft-404 patterns for crawlers | Low | Medium | Low–Medium |
| **Low** | Hreflang / multi-market (only when markets activate) | High | High later | Low now (UK-first) |
| **Low** | Separate true Blog CMS (today “blog” sitemap = Help) | High | Medium | Medium later |
| **Low** | Advanced sitelinks/asset optimisation beyond current OG | Low | Low–Medium | Low |

---

## Final Overall SEO Score

### **6.8 / 10**

**Justification:** ROVEXO’s **technical and marketplace SEO implementation is above average for a pre-scale UK marketplace** (metadata, sitemaps, schema, programmatic URLs, index control). Organic traffic before production is still capped by **index openness (private mode)**, **inventory depth**, **thin guide content**, and **domain authority** — areas where Vinted / eBay / Amazon remain far ahead regardless of code quality.

**PASS / FAIL for “SEO foundation exists”:** **PASS** (foundation present).  
**PASS / FAIL for “max organic ready without further work”:** **FAIL** — opportunities above remain open; no claim of ranking readiness.

---

## Deliverable status

| Rule | Status |
|------|--------|
| NO IMPLEMENTATION | Observed |
| NO CODE / METADATA / ROUTE / UI / CSS / API / DB changes | Observed |
| NO COMMIT / PUSH / DEPLOY | Observed |
| Evidence-only report | This file |

**Report path:** `ROVEXO_SEO_ORGANIC_TRAFFIC_AUDIT.md`
