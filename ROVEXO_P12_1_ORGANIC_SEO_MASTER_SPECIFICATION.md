# ROVEXO P12.1 — ORGANIC SEO MASTER SPECIFICATION (CANONICAL)

**STATUS:** OWNER APPROVED · CANONICAL IMPLEMENTATION SPEC · NOT YET IMPLEMENTED  
**DATE:** 2026-08-04  
**VERSION:** P12.1  
**PARENTS:** `ROVEXO_SEO_ORGANIC_TRAFFIC_AUDIT.md` · `ROVEXO_P12_SEO_GROWTH_MASTERPLAN.md`  
**ENGINE SSOT (existing):** `lib/seo/` · Organic Growth Platform v4.0 (`lib/seo/engine/config.ts`)  
**TAXONOMY SSOT:** Catalog Master · Absolute Law XXX / XXXII · 10 roots only  

---

## Absolute Laws (bind all future SEO work)

1. **ONE SEO system** — extend `lib/seo/` + existing public routes. Forbidden: SEO v2, parallel sitemap engines, duplicate Help CMS, second FAQ store, speculative microsites.  
2. **Marketplace-first** — SEO never changes Buy Now, Checkout, Wallet, Escrow, Auth, Inbox, or Catalog Master rules.  
3. **UK-first** — `en-GB`, GBP, UK locations; no hreflang until Owner activates markets.  
4. **Listings-first** — Category hubs may add editorial blocks; the primary above-the-fold job remains discoverable listings (or approved empty state).  
5. **No speculative pages** — no URL in sitemap/index without inventory/quality gates (or evergreen Help/Legal exceptions below).  
6. **No AI filler** — editorial copy is human Owner/ops authored or approved templates with unique per-URL fields; no auto-paraphrase spam.  
7. **No duplicate content** — one intent = one canonical URL.  
8. **Catalog Master alignment** — popular/browse links never promote forbidden roots (whole vehicles, property, jobs, services, live animals). Vehicle Parts is its own root.  
9. **Private surfaces stay noindex** — forever (`index-control` prefixes + `privatePageMetadata`).  
10. **This document is the implementation contract** — Waves A–D implement only what is specified here.

---

## Complete Architecture Overview

```
ROVEXO Organic SEO (single system)
├── Technical layer (EXISTS — preserve)
│   ├── Metadata API (buildPageMetadata + engine metadata)
│   ├── robots.txt + private-mode gate
│   ├── Segmented sitemaps (12) + /sitemap.xml index
│   ├── JSON-LD (Org, WebSite, Product, Breadcrumb, FAQ, Collection, Person, Store)
│   └── Index gates (inventory · quality · path)
├── Hub layer (EXTEND — do not fork)
│   ├── /categories · /category/[...]
│   ├── /collections/[slug]
│   ├── /discover/[slug] · /trends/[slug] · /brand/[slug] · /browse/[...]
│   └── /l/[location] · /l/[location]/[...category]
├── Commerce layer (PRESERVE behaviour)
│   ├── /listing/[slug]
│   ├── /user/[username]
│   └── /store/[slug]
└── Knowledge layer (EXPAND content, same routes)
    ├── /help · /help/[slug] · /help/faq · hubs
    └── /legal/[slug] (compliance SSOT — not growth farm)
```

---

# SECTION 1 — Category Hub Architecture

## 1.1 Hierarchy

| Level | URL | Role |
|------:|-----|------|
| 0 | `/categories` | Index of exactly **10** Catalog Master roots |
| 1 | `/category/{root}` | Root hub (SEO landing + listings) |
| 2 | `/category/{root}/{sub}` | Subcategory hub |
| 3 | `/category/{root}/{sub}/{type}` | Product-type hub (when taxonomy depth exists) |

**Forbidden:** Parallel `/categories-v2`, desktop-only hubs, or taxonomy outside Catalog Master.

## 1.2 Listings-first rule (non-negotiable)

1. Primary content for users with inventory = **listing grid** (existing `ListingCard` / category results pattern).  
2. Editorial blocks are **secondary**: below H1/count or in a compact band that does not displace the grid on mobile.  
3. Empty inventory = existing marketplace empty state + **noindex** (do not invent fake listings).  
4. SEO must not redesign Category UX against Owner freezes; add modules only where Master Spec allows.

## 1.3 Editorial block placement (canonical order)

When inventory ≥ index threshold, page stack:

1. **Breadcrumbs** (visible + JSON-LD)  
2. **H1** = category name · listing count  
3. **Listing grid** (listings-first)  
4. **Intro** (unique 120–280 words) — after first screen of listings OR compact accordion on mobile (implementation wave decides layout; content contract fixed)  
5. **Buying advice** (unique bullets, category-specific)  
6. **Selling advice** (unique bullets, category-specific)  
7. **Featured collections** (3–5 links, stocked only)  
8. **Popular searches** (Catalog-Master-aligned aliases only)  
9. **Related categories** (existing `relatedCategoryLinks`)  
10. **Guides / Help** (2–4 contextual links)  
11. **FAQ** (3–6 unique Q&As + FAQPage schema)  
12. **InternalLinksSection** (capped)

Empty pages: breadcrumbs + empty state only; editorial optional collapsed; **robots noindex**.

## 1.4 Collections placement

- Root hubs link collections relevant to that root (e.g. Electronics → electronics-deals, trending).  
- Never link collections that fail inventory gate.  
- Max **5** collection links per hub.

## 1.5 FAQ placement

- After related/guides; before or inside `InternalLinksSection`.  
- Category FAQs must be **category-specific** (not copy-paste of global Help FAQ).

## 1.6 Breadcrumb strategy

```
Home → All categories → {Root} → {Sub} → {Type}
```

- Visible `<nav aria-label="Breadcrumb">`.  
- JSON-LD `BreadcrumbList` on every indexable category URL.  
- Each crumb is a real, crawlable `href`.

## 1.7 Schema strategy

| Type | When |
|------|------|
| `CollectionPage` | Every category hub |
| `BreadcrumbList` | Always when crumbs exist |
| `ItemList` (optional) | Top N listings when indexable |
| `FAQPage` | When ≥3 unique FAQs present |
| Forbidden | Fake `AggregateRating` on category; Product schema on hub |

## 1.8 Canonical strategy

| Case | Canonical |
|------|-----------|
| Standard category URL | Self (`/category/...`) |
| Browse pure-category alias | Canonical → Catalog `/category/...` path (existing `browsePageCanonicalPath` policy) |
| Faceted browse with 3+ filters | noindex or canonical to cleaner parent (see §8) |
| Empty / thin category | noindex; do not canonicalize to Homepage |

## 1.9 Internal linking (category)

Outbound (capped): related categories · popular searches (aligned) · collections · Help guides · optional top store if stocked.  
Inbound: Homepage rail · `/categories` · collections · Help · location pages · listings breadcrumbs.

## 1.10 Indexing rules (category)

| Condition | Robots |
|-----------|--------|
| Published listings ≥ **3** | `index,follow` |
| 1–2 listings | `noindex,follow` (soft render allowed) |
| 0 listings | `noindex,follow` |
| Quality score &lt; 55 (if computed) | `noindex,follow` |

Sitemap: include category URLs that are indexable or expected evergreen roots (roots always in sitemap; children only when indexable — Wave implementation must not spam empty deep paths).

---

# SECTION 2 — Help Centre Architecture

## 2.1 Single Help system

- Routes: `/help`, `/help/[slug]`, `/help/faq`, `/help/category/[slug]` (existing).  
- Content SSOT: `lib/help/content/` (+ hubs).  
- **Forbidden:** second Help app, Notion mirror as public index, AI article farms.

## 2.2 Clusters (canonical)

| Cluster ID | Name | Purpose |
|------------|------|---------|
| `buying` | Buying | Purchase, offers, protection, first buy |
| `selling` | Selling | List, photos, price, parcels, promote |
| `payments` | Payments | Checkout, cards, failures, refunds |
| `wallet` | Wallet | Balance, withdraw, bank, fees clarity |
| `shipping` | Shipping | Labels, tracking, delivery, delays |
| `verification` | Verification | Why/how/timelines/unlocks |
| `business` | Business | Tax status, storefront tips (unified account law) |
| `safety` | Safety | Scams, chat, off-platform ban |
| `community` | Community | Guidelines, reports, reviews etiquette |
| `account` | Account | Login, password, settings, delete |
| `returns` | Returns | Returns/refunds flows |
| `trust` | Trust | Ratings, badges, trust signals |
| `uk` | UK Marketplace | UK-specific buying/selling guides |

Policy full text lives in **`/legal/*` only**. Help may summarise and **link/redirect** (existing HELP_TO_LEGAL pattern).

## 2.3 Minimum article counts

| Horizon | Unique evergreen articles | Notes |
|---------|--------------------------:|-------|
| Wave A complete | **60** | All clusters represented |
| Wave B complete | **80–100** | Sub-intents + UK guides |
| Steady state | **100–120** | Cap churn; retire duplicates |

Current baseline ~**24** → expand under this architecture only.

## 2.4 Article standards

- Unique slug, title, summary (meta description), body.  
- Metadata via **`buildPageMetadata`** (canonical + OG + Twitter) — mandatory for new/updated articles.  
- Internal links: 2–5 related Help · 1 Legal if policy · 1–2 marketplace URLs (category/collection) when topical.  
- No keyword stuffing; UK English; no invented fees %.

## 2.5 Expansion strategy

1. Fill Critical clusters (buying, selling, safety, shipping, payments, wallet).  
2. Verification + returns + trust.  
3. Business + community + UK.  
4. Vertical deep-dives tied to 10 roots (one guide per root max until Wave C).

## 2.6 Category relationships

| Help topic | Links to |
|------------|----------|
| How to buy fashion | `/category/womens-fashion` (etc.) |
| Vehicle parts selling tips | `/category/vehicle-parts` only (never whole cars as root) |
| Shipping guide | Orders/Inbox concepts as text; no private deep links required for SEO |

---

# SECTION 3 — FAQ Engine Architecture

## 3.1 Single FAQ library model

```
FAQ Library (one logical store)
├── Global FAQs          → /help/faq + optional homepage snippet (capped)
├── Cluster FAQs         → Help hubs (buying, wallet, …)
├── Category FAQs        → Category hubs only
├── Listing FAQs         → Optional PDP accordion (product-agnostic platform Qs only)
├── Audience views       → Buyer / Seller / Business filters of same library
└── JSON-LD FAQPage      → Only on pages that render ≥3 unique FAQs
```

**Forbidden:** Separate FAQ databases per feature; duplicating Legal paragraphs as FAQ answers.

## 3.2 FAQ classes

| Class | Scope | Max per page | Schema |
|-------|-------|-------------:|--------|
| Global | Cross-cutting | 10 on `/help/faq` default view | Optional FAQPage on FAQ index |
| Category | One category slug | 3–6 | FAQPage on hub |
| Listing | Platform rules (protection, fee clarity, shipping) | 3–5 | Optional; never fake product Q&A |
| Buyer | Cluster `buying` + payments | via Help hub | Hub schema |
| Seller | Cluster `selling` + wallet | via Help hub | Hub schema |
| Business | Tax/storefront myths | via Help hub | Hub schema |
| Wallet | Balance/withdraw | via Help hub | Hub schema |
| Shipping | Delivery/tracking | via Help hub | Hub schema |

## 3.3 Template FAQs on programmatic pages

`generatePageFaq` may remain for discover/location **only if**:

- Answers include page-specific entities (city, brand, price), and  
- Total template FAQs ≤ 6, and  
- Page is indexable.

If inventory thin → no FAQ schema (avoid thin rich-result spam).

## 3.4 Deduplication

Same question text → one library ID · reuse · never rewrite slightly for keyword variants.

---

# SECTION 4 — Collection Engine Architecture

## 4.1 Single collection system

- Route: `/collections/[slug]` only.  
- Definitions: `lib/seo/engine/collections.ts` (extend in place).  
- View: existing `SeoLandingPageView` pattern.  
- **Forbidden:** `/collections-v2`, Marketing CMS parallel.

## 4.2 Collection types

| Type | Examples | Index default |
|------|----------|---------------|
| Featured / evergreen | newly-listed, best-deals, trending-this-week, verified-sellers, premium-listings | Index if ≥3 listings + distinct set |
| Budget | under-10 … under-1000 price tiers | Index if stocked; canonical nearest tier if overlap severe |
| Premium | premium-listings, luxury, premium-stores | Index if stocked |
| Trending / popular | trending-today/week, most-viewed, most-saved | Index only if ranking distinct; else noindex |
| Seasonal | back-to-school, summer, winter, holiday-gifts, christmas*, garden-season | Index while in season + stocked |
| Gift ideas | gift-collections, holiday-gifts | Index if stocked |
| Vintage | **Add only** when condition/filter definition is explicit and non-duplicate of `used-*` discover | Gate: long-tail inventory ≥5 |

\*Christmas may map to `holiday-gifts` or dedicated slug — **one** seasonal gift intent per period.

## 4.3 Lifecycle

| State | Sitemap | Robots | Notes |
|-------|---------|--------|-------|
| Active + stocked | Include | index | |
| Active + thin | Exclude or include with noindex | noindex | Prefer exclude from sitemap |
| Seasonal off | Exclude | noindex | Keep URL resolving with noindex or 302 to parent collection |
| Deprecated | Remove from sitemap | noindex or 301 to successor | Record redirect in SEO redirects |

`TREND_TTL_DAYS = 14` applies to trend-like collections: stale trends → noindex.

## 4.4 Uniqueness rule

If two collections share &gt;70% of the same listing set (engine dedup), keep higher priority; noindex/canonical the other.

---

# SECTION 5 — Location SEO Architecture (UK-first)

## 5.1 Hierarchy

| Level | Examples | URL |
|-------|----------|-----|
| Country | United Kingdom (implicit site) | `/` and national content — not a thin `/l/uk` duplicate unless Owner adds |
| Nation | England, Scotland, Wales, NI | `/l/{nation}` |
| County | Greater Manchester, … | `/l/{county}` |
| City | London, Manchester, … | `/l/{city}` |
| City × category | Phones in Birmingham | `/l/{city}/{...category}` or `/browse/{alias}/{city}` with canonical policy |

Data SSOT: `lib/seo/locations/uk.ts`.

## 5.2 When indexable

| Page | Index when |
|------|------------|
| Nation / county / city hub | ≥ **3** published listings attributable to that location filter |
| City × category | ≥ **5** (long-tail) **and** quality ≥ 55 **and** demand score ≥ 20 when demand engine used |
| Else | `noindex,follow` |

## 5.3 Canonical rules

| Case | Action |
|------|--------|
| Stocked city×category | Self-canonical |
| Thin city×category | noindex; optional canonical to `/l/{city}` or `/category/...` (choose parent with most relevance; never Homepage) |
| Duplicate browse vs `/l/` | One winner: prefer `/l/{city}/...` for local intent; browse city combo canonicalises to `/l/` when equivalent |
| Whole-vehicle local pages | Do not index; prefer Vehicle Parts local |

## 5.4 Duplicate prevention

- Unique intro per Tier A city (Wave B+).  
- Template FAQ only with city name entity.  
- Tier C towns: no sitemap until long-tail gates pass.  
- Max city×category combinations in sitemap: prefer top cities × top aliases with stock (existing browse combo generator must be constrained by gates in implementation waves).

---

# SECTION 6 — Seller SEO Architecture

## 6.1 Public profiles (only)

| Surface | URL | Schema |
|---------|-----|--------|
| Seller | `/user/{username}` | `Person` + optional `ItemList` + `AggregateRating` if reviews &gt; 0 |
| Business store | `/store/{slug}` | `Store` + `ItemList` |
| Dashboards `/seller/*`, `/business/*` | Private | **noindex** (robots disallow) |

## 6.2 Indexability

- 0 public listings → `noindex`.  
- ≥1 published listing → eligible `index` (prefer ≥3 for sitemap priority).  
- Demo/forbidden inventory never indexed.

## 6.3 Authority signals (SEO-safe)

- Real ratings/reviews only.  
- Verified seller collection links when eligible.  
- Freshness via `lastModified` in sitemap from profile/listing updates.  
- **Forbidden:** fake follower counts, social feeds, fabricated review schema.

## 6.4 Internal links

Outbound: active listing subset · categories of those listings · 1–2 Help (buying safety).  
Inbound: PDP seller name · collections (verified/featured) · optional hub “top stores”.

## 6.5 Fresh content

Profiles stay fresh through listing updates — no mandatory blog on seller pages for v1.0.

---

# SECTION 7 — Internal Linking Engine

## 7.1 Graph (canonical)

```
Homepage ──► Roots · Collections(3–5) · Help clusters(2–3)
Category ──► Subs · Collections · Help · Sellers(optional) · Locations(optional)
Collection ──► Categories · Related collections(≤4) · Help
Listing ──► Category crumbs · Seller/Store · Related listings* · Guide(≤2)
Seller/Store ──► Listings · Categories · Help(≤2)
Help/FAQ ──► Categories/Collections · Legal · Sibling articles
Legal ──► Help summaries only (not marketplace farms)
```

\*Related listings: only if Owner unfreezes PDP similar module (marketplace behaviour preserved otherwise).

## 7.2 Caps (anti-spam)

| Page type | Max SEO content links (excl. primary nav) |
|-----------|------------------------------------------:|
| Homepage | 25 |
| Category hub | 20 |
| Collection / discover | 18 |
| Listing | 12 |
| Seller / store | 15 |
| Help article | 10 |
| FAQ index | 15 |

## 7.3 Rules

- Prefer deep, stocked URLs.  
- Align popular searches with Catalog Master.  
- No reciprocal link schemes.  
- Reuse `InternalLinksSection` + `lib/seo/internal-links.ts` — extend groups, do not clone components.

---

# SECTION 8 — Index Strategy (exact rules)

## 8.1 Always noindex

Paths under: `/admin`, `/api`, `/checkout`, `/account`, `/seller`, `/business`, `/messages`, `/inbox` (and conversation), `/orders`, `/saved`, `/notifications`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auctions`, `/sell/auction`, `/super-admin`, `/staff`, `/403`, `/wallet` (and balance aliases as private financial), resolution private flows — as per `NOINDEX_PATH_PREFIXES` + product private metadata. Extend list only with Owner approval.

**Launch private mode ON:** sitewide noindex / robots disallow — **organic growth forbidden until OFF**.

## 8.2 Search URLs

| URL | Robots |
|-----|--------|
| `/search` (empty landing) | `index,follow` |
| `/search?q=*` | `noindex,follow` |
| `/search?category=*` | `noindex,follow` |
| Image/visual search results | `noindex,follow` |

## 8.3 Filtered / faceted / pagination

| Case | Rule |
|------|------|
| ≤2 mild filters, stocked | May index if unique and quality OK |
| &gt;2 active filters (`page`, `sort`, `brand`, `condition`, price, location combined) | `noindex` (existing `shouldNoIndexDuplicateFilters` spirit) |
| `?page=2+` | `noindex` or rel-canonical to page 1; **no** thin paginated index bloat |
| Sort-only variants | Canonical to default sort URL |

## 8.4 Empty / thin pages

| Listings | Default |
|---------:|---------|
| 0 | noindex |
| &lt; MIN_INVENTORY_TO_INDEX (3) | noindex |
| Long-tail &lt; 5 | noindex |
| Quality &lt; 55 | noindex |

## 8.5 Evergreen exceptions (may index without listing count)

- Help articles meeting content standards.  
- Legal documents.  
- `/categories` index.  
- About / core trust pages Owner designates.  
- `/search` empty landing.  
- `/help`, `/help/faq`.

## 8.6 Canonical summary

Self-canonical when indexable · parent canonical when thin duplicate · 301 for retired slugs via SEO redirects / next.config · never canonical to `/search?q=`.

---

# SECTION 9 — Content Governance

## 9.1 Prevent duplicate content

- One intent → one slug.  
- Help ↔ Legal: redirect or link, never dual full policy.  
- Collections: dedup by listing overlap.  
- Browse ↔ category: canonical to category when equivalent.

## 9.2 Prevent thin content

- Enforce inventory gates before index.  
- Category intros required for Wave A root hubs before claiming “hub complete”.  
- Template-only pages without unique fields → noindex.

## 9.3 Prevent keyword stuffing

- Titles: natural UK English; brand suffix via template `\| ROVEXO`.  
- No repeated city/category stuffing in H1.  
- Meta description ≤ ~160 chars, unique.

## 9.4 Prevent auto-generated spam pages

- No mass URL generation into sitemap without gates.  
- No AI paraphrased intros.  
- Discovery slug explosion allowed in resolver only if **noindex until gates pass**.

## 9.5 Prevent expired indexation

- Seasonal collections: lifecycle noindex.  
- Trends: TTL 14 days.  
- Sold-out sole listing profiles: noindex when zero active.  
- Removed Help: 301 to cluster hub or `/help`.  
- Sitemap regeneration must drop non-indexable URLs.

## 9.6 Content acceptance checklist (per URL)

- [ ] Unique title & description  
- [ ] Canonical set  
- [ ] Robots correct per §8  
- [ ] Schema valid & non-fabricated  
- [ ] Internal links within caps  
- [ ] Catalog Master aligned  
- [ ] No private data leakage  
- [ ] Owner/ops approved copy for editorial blocks  

---

# SECTION 10 — Implementation Roadmap (Waves)

**This section schedules future work. No wave starts without Owner “START WAVE X”.**

### Wave A — Foundation unlock + Core hubs

| Item | Priority | Difficulty | Traffic impact | ROI |
|------|----------|------------|----------------|-----|
| Private mode OFF + GSC/Bing sitemap | Critical | Low | Critical enabler | Critical |
| Root category hub modules (10) + FAQ + links | Critical | Medium | Very high | Very high |
| Help metadata → `buildPageMetadata` | High | Low | Medium | High |
| Help Wave A → 60 articles (clusters) | High | Medium | High | High |
| Popular links Catalog Master alignment | High | Low | Quality | High |
| Internal linking caps wired on hubs/Help | High | Low–Med | High | Very high |

### Wave B — Long-tail + FAQ + Collections hygiene

| Item | Priority | Difficulty | Traffic impact | ROI |
|------|----------|------------|----------------|-----|
| Category FAQs library + schema discipline | High | Medium | Medium–High | High |
| Collection lifecycle + seasonal rules | High | Medium | High | High |
| Location Tier A (top cities × stocked cats) | High | Medium | High | Medium–High |
| Help → 80–100 + UK guides | Medium | Medium | Medium | Medium |
| Seller/store outbound Help + category links | Medium | Low | Medium | Medium |

### Wave C — Depth + PDP linking

| Item | Priority | Difficulty | Traffic impact | ROI |
|------|----------|------------|----------------|-----|
| Subcategory hubs (stocked) | Medium | Medium | High | Medium–High |
| Owner-gated related listings on PDP | Medium | Medium | Medium–High | High |
| Vintage collection (if defined) | Low–Med | Medium | Medium | Medium |
| Pagination / facet crawl rules at scale | Medium | Medium | Medium | Medium |

### Wave D — Authority & markets (defer)

| Item | Priority | Difficulty | Traffic impact | ROI |
|------|----------|------------|----------------|-----|
| External citations / PR (ops) | Medium | High | High long-term | High long-term |
| Hreflang / multi-market | Low | High | Low until markets ON | Defer |
| Editorial “magazine” beyond Help | Low | High | Medium | Defer |

---

## Canonical Standards (quick reference)

| Standard | Value |
|----------|-------|
| Locale | `en-GB` |
| Currency in schema | GBP |
| Min listings to index (standard) | **3** |
| Min listings to index (long-tail) | **5** |
| Min quality score | **55** |
| Min demand (long-tail, when used) | **20** |
| Trend TTL | **14 days** |
| Root categories | **10** Catalog Master |
| Help target Wave A / B | **60** / **80–100** |
| Max collection links on hub | **5** |
| FAQ per category hub | **3–6** |
| Metadata helper | `buildPageMetadata` / engine metadata |
| Sitemap | Existing 12-segment system only |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Indexing empty programmatic URLs | High | Gates + sitemap exclusion |
| Duplicate Help/Legal | High | Redirect/link Legal SSOT |
| Whole-vehicle SEO URLs vs Catalog Master | High | Align popular/browse; noindex vehicle-whole |
| Private mode left ON | Critical | Wave A ops checklist |
| Link spam / footer farms | Medium | Caps in §7 |
| AI filler / thin rich results | High | Governance §9; FAQ schema only when unique |
| Redesigning frozen Category/Sell UI | High | Listings-first; Owner visual approval per wave |
| Parallel SEO systems | Critical | Absolute Law #1 |
| Over-generating city×category sitemap | Medium | Tier A first; long-tail gates |
| Fabricated review schema | Critical | Reviews &gt; 0 only |

---

## Estimated Organic Growth Timeline

Assumes: Wave A ops unlock, sustained real inventory, no private mode, UK Google/Bing.

| Window | Expected state |
|--------|----------------|
| **0–30 days** | Indexation of roots, stocked listings, Help; impressions begin |
| **1–3 months** | Category hub queries; early long-tail; Help assist queries |
| **3–6 months** | Collections + Tier A local; measurable organic session growth (**~1.3×–1.8×** thin baseline) |
| **6–12 months** | Deeper hubs + authority compounding (**~1.5×–2.2×** if Waves B–C + inventory hold) |
| **12–18 months** | Competitive with mid-tier UK marketplaces on mid-tail; still behind eBay/Amazon authority |

Exact traffic is not guaranteed; this timeline is a **planning band**, not a certification claim.

---

## Implementation Rules (for future agents)

1. Read this spec before any SEO PR.  
2. Prefer extending `lib/seo/*`, `lib/help/*`, existing routes.  
3. No new public SEO entry points without updating this spec + Owner approval.  
4. No commits/push/deploy without Owner stage approval.  
5. UI changes require Master UI / Owner visual gates where freezes apply.  
6. Marketplace financial/auth/catalog laws override SEO convenience.  
7. After each wave: update sitemap robots verification on `localhost:3000` + Owner preview URL policy for approval — never claim PRODUCTION_READY from SEO alone.

---

## Document control

| Field | Value |
|-------|-------|
| Deliverable | `ROVEXO_P12_1_ORGANIC_SEO_MASTER_SPECIFICATION.md` |
| Type | Canonical specification only |
| Implementation in this run | **NONE** |
| Code / UI / CSS / DB / API / git | **NOT MODIFIED** |

**STOP.** Future work requires Owner: `START P12 WAVE A` (or named wave) before any implementation.
