# ROVEXO P12 — SEO GROWTH MASTERPLAN (ORGANIC TRAFFIC)

**STATUS:** OWNER-APPROVED PLANNING DELIVERABLE · **NO IMPLEMENTATION IN THIS RUN**  
**DATE:** 2026-08-04  
**PARENT AUDIT:** `ROVEXO_SEO_ORGANIC_TRAFFIC_AUDIT.md` (overall SEO score 6.8/10)  
**MISSION:** Increase organic traffic · indexable content · long-tail · internal linking · domain-authority readiness  
**CONSTRAINTS:** Do not rebuild existing SEO · no business-logic change · no marketplace behaviour change · no AI features · no code/UI/CSS/DB/API in this deliverable  

---

## Executive Summary

ROVEXO already has a **technical SEO foundation** (Metadata API, segmented sitemaps, robots, Product/Org/FAQ schema, inventory noindex gates, discover/collections/locations/browse routes). Growth is blocked less by “missing robots.txt” and more by:

1. **Thin unique content** on category hubs (live category UI is listings-first).  
2. **Help Centre scale** (~24 articles vs competitor guide libraries).  
3. **Inventory-gated indexability** (index only when ≥3 listings; long-tail ≥5).  
4. **Internal linking gaps** (PDP similar items frozen; category hubs lack guide/collection links).  
5. **Ops readiness** (private mode OFF + Search Console) — enabler, not a rebuild.

**P12 strategy:** deepen and connect what already exists — category hubs, collections, UK location pages, Help/FAQ clusters, seller profile SEO — with **unique, non-duplicate editorial** and **strict index rules**. Do not invent a second SEO stack.

**Final Organic Readiness Score (post-plan target definition):** **4.5 / 10 today → 7.5 / 10 after P12 content + linking waves (assuming private mode OFF + meaningful inventory).**

Estimated early organic uplift (UK Google/Bing, 6–12 months after index open + content live): **+30% to +120% organic sessions** vs thin-launch baseline — contingent on inventory and authority, not code alone.

---

## Current SEO Strengths (do not rebuild)

| Strength | Evidence | P12 rule |
|----------|----------|----------|
| Shared metadata builder + OG/Twitter | `lib/seo/metadata.ts` | Reuse; extend Help onto it later |
| Segmented sitemaps (12) + index rewrite | `app/sitemap.ts`, `/api/seo/sitemap-index` | Keep; fill with indexable URLs only |
| Inventory noindex gates | `MIN_INVENTORY_TO_INDEX = 3`, long-tail 5 | Keep — anti-thin-content |
| Listing Product JSON-LD | `productJsonLd` | Keep |
| Discover / collections / trends / brand / browse / `/l/` | Existing routes + engines | Deepen content, do not fork |
| Seller / store metadata + schema | `/user/`, `/store/` | Improve linking/freshness signals only |
| Help category hubs + FAQ fragments | `category-hubs-v1.ts`, `/help/faq` | Expand topics; avoid duplicate Legal |
| Internal link component | `InternalLinksSection` | Wire more meaningful groups |
| Private path noindex | `index-control.ts`, `privatePageMetadata` | Keep forever |

---

## Missing Organic Opportunities (gap summary)

| Gap | Current state | Opportunity |
|-----|---------------|-------------|
| Category hubs as SEO landings | `CategoryPageView` = listings + related categories + popular browse; **no intro / buying / selling / FAQ / collections block** | Unique hub modules per root/subcategory |
| Help article volume | ~24 articles | Target **80–120** evergreen guides in topic clusters |
| Central FAQ depth | FAQ aggregates hub FAQs; few standalone SERP FAQ pages | Expand buyer/seller/shipping/payments/verification/business FAQ sets + FAQPage schema |
| Guide → marketplace linking | Help links Legal/Support; weak links into categories/collections | Bidirectional Help ↔ Category ↔ Collection |
| PDP internal links | Similar items **frozen off** | Owner-gated restore of related listings only (SEO + UX), no marketplace rule change |
| Location × category uniqueness | Routes + sitemap exist; thin template FAQs | Index only high-demand + stocked combos; unique local intros |
| Collection differentiation | ~38 static + price tiers defined; many share similar sorting | Prioritise distinctive collections; noindex clones |
| Seller authority signals | Profile indexable when stocked | Cross-link from listings/guides; keep AggregateRating honest |
| Domain authority readiness | Technical OK | Content + internal links + external citations later (ops/PR) |

---

## Phase 1 — Content Gap & Strategy

### Indexable page classes (audit lens)

| Class | Index intent today | Content gap |
|-------|--------------------|-------------|
| Homepage | Index | Generic copy; deepen unique UK marketplace value props without redesign mandate |
| `/categories` + `/category/...` | Index when stocked | Missing hub editorial blocks |
| `/listing/...` | Index | Thin beyond PDP fields; related links frozen |
| `/user/` · `/store/` | Index if listings ≥1 (metadata noindex if 0) | Few outbound SEO links to guides/categories |
| `/search` empty | Index | Thin; prefer linking out to hubs |
| `/search?q=` | **Noindex** (keep) | Not a content target |
| `/discover/` · `/collections/` · `/browse/` · `/l/` | Index if inventory gates pass | Template FAQ only; need unique intros |
| `/help/` · articles · FAQ | Index-capable | Volume + OG/canonical completeness |
| `/legal/` | Index | Compliance, not growth primary |
| Private app | Noindex | Out of scope |

### Content roadmap (topic clusters)

| Cluster | Exists today (examples) | Missing / expand |
|---------|-------------------------|------------------|
| **Help Centre core** | Account, password, how to buy/sell, photos, checkout, refunds, delivery, tracking, chat safety, tax, trust | Navigation hub pages per cluster; “start here” maps |
| **Buying Guides** | How to buy, purchase protection | How to make an offer, compare listings, condition guide, total buyer pays explained, first purchase checklist |
| **Selling Guides** | Start selling, photos, pro workspace, promotions | Pricing, parcels, holiday mode, listing quality checklist, when to promote |
| **Safety Guides** | Safety tips, chat safety, trust & safety, AI moderation | Scam red flags, off-platform payment ban, meetup vs courier |
| **Business Guides** | Tax status, tax registration | VAT basics (informational), storefront tips, bulk listing hygiene (no new account types) |
| **Shipping Guides** | Delivery, tracking | Label print flow overview, delivery times UK, lost parcel steps |
| **Wallet Guides** | Thin / hub FAQs only | Balance vs available, withdraw timing, bank setup, platform fee buyer-side |
| **Offers Guides** | Almost none as articles | Make offer, counter offer, accept/decline etiquette |
| **Verification Guides** | Scattered | Why verify, what unlocks, timelines |
| **Community Guides** | Community guidelines (often Legal redirect) | Reporting, reviews etiquette, prohibited items explainer (link Legal SSOT) |
| **Return Guides** | Refunds article | Returns window, buyer/seller steps, evidence |
| **Trust Guides** | Trust & safety | Ratings, reviews, badges (marketplace Follow/Rating rules only) |
| **UK Marketplace Guides** | None dedicated | “Buying second-hand in the UK”, “Sell locally vs courier”, city hubs → `/l/` |

**Uniqueness rule:** One canonical article per intent. Help summaries that duplicate Legal **must redirect/link Legal** (already partially done) — never two indexable full policies.

---

## Phase 2 — Category Strategy (SEO hubs)

### Principle

Every **major category** (start with **10 Catalog Master roots**, then high-traffic subcategories) becomes an SEO landing **without** duplicating the same boilerplate across all URLs.

### Required hub modules (content architecture — reuse existing schema/links)

| Module | Purpose | Duplicate risk control |
|--------|---------|------------------------|
| Intro (150–300 unique words) | Define category + UK marketplace angle | Written per slug; no shared spinner paragraphs |
| Buying advice | How buyers should evaluate this category | Category-specific tips only |
| Selling advice | How sellers should list in this category | Category-specific tips only |
| Popular searches | Links to `/browse/...` or discover that pass inventory gates | Cap links; prefer stocked URLs |
| Related categories | Already via `relatedCategoryLinks` | Keep |
| Featured collections | Links to `/collections/...` relevant to root | Only collections with stock |
| Internal links | Guides + Help cluster for that vertical | 3–8 links max |
| FAQ (3–6) | Category-specific Q&A + FAQPage schema | Prefer hub FAQ over generic template alone |
| Breadcrumbs + schema | Already present on category route | Keep |

### Live gap (evidence)

`CategoryPageView` is intentionally **listings-first** (Phase I simplification). Schema/metadata exist on the route; **editorial hub modules are the missing organic layer**.

### Rollout order

1. 10 roots (Women’s · Men’s · Designer/Jewellery · Kids · Home & Garden · Electronics · Books · Collectables · Sports · Vehicle Parts).  
2. Top subcategories with inventory.  
3. Never index empty category hubs (respect existing gates / empty state).

### Note on “popular searches”

Current `popularBrowseLinks` includes aliases such as **Cars** (`/browse/cars`). Catalog Master forbids whole vehicles as production roots. **SEO growth must align popular links to courier-safe roots** (e.g. Vehicle Parts, Electronics, Fashion) so organic URLs do not promote out-of-scope taxonomy — without changing marketplace purchase rules.

---

## Phase 3 — Location Strategy

### What exists

- `/l/{location}` and `/l/{location}/{...category}`  
- ~100 UK locations (nations/counties/cities)  
- Sitemap location + browse city×alias combos  
- Template local FAQ generation  
- Index only with inventory (`listingCount` gates)

### Demand-led priority (traditional UK marketplace queries)

| Tier | Examples | Index strategy |
|------|----------|----------------|
| **A — Launch** | London, Manchester, Birmingham, Glasgow, Liverpool, Leeds, Bristol, Edinburgh, Cardiff, Belfast × top categories with stock | Unique intro + local FAQ; index if ≥3–5 listings |
| **B — Scale** | Remaining major cities × Home/Electronics/Fashion/Vehicle Parts | Same rules |
| **C — Long-tail** | Town/county × niche category | Index only if long-tail inventory ≥5 + quality score; else noindex or canonical to city/category |

### Example evaluation (architecture, not live keyword tool output)

| Example URL intent | Demand (typical UK marketplace) | Duplicate risk | Strategy |
|--------------------|---------------------------------|----------------|----------|
| Furniture in London | High | Medium (vs national furniture) | Unique local intro; canonical = location-category URL when stocked; link to `/category/...` + `/collections/` |
| Cars in Manchester | High search, **taxonomy conflict** | High + policy risk | Prefer **Vehicle Parts in Manchester** or noindex whole-vehicle browse; do not fight Catalog Master |
| Phones in Birmingham | High | Medium | Strong candidate when stocked |
| Fashion in Glasgow | High | Medium | Root fashion + city |
| Pets in Liverpool | Medium | Medium | Only if pets remain a valid browse alias with inventory |

### Canonical strategy

- Stocked location+category page → **self-canonical**.  
- Empty / thin → **noindex,follow** (existing pattern) or soft-canonical to parent `/l/{city}` or `/category/...`.  
- Never create parallel city pages with identical body text.

---

## Phase 4 — Collections Strategy

### What exists

Collection engine with slugs such as: best-deals, newly-listed, recently-reduced, trending-this-week/today, premium, verified-sellers, top-rated-stores, most-viewed/saved, seasonal (back-to-school, summer, winter, holiday-gifts, garden-season, gaming-week, electronics-deals, spring/summer/winter collection), price tiers `under-{n}`, etc. Routes: `/collections/[slug]` + sitemap.

### Architecture recommendation (scale without duplication)

| Layer | Role |
|-------|------|
| **Core evergreen** (always on if stocked) | New arrivals (`newly-listed`), Best value (`best-deals` / price tiers), Trending this week, Premium, Verified sellers |
| **Seasonal** (time-boxed index) | Back to school, Summer, Christmas/holiday-gifts, Winter essentials, Garden season |
| **Signal collections** | Most viewed / saved — index only if ranking logic is distinct and stocked; otherwise noindex to avoid near-duplicates |
| **Vintage** | Add only if condition/filter definition is clear and inventory exists (do not clone “used” discover pages) |
| **Budget** | Prefer price-tier collections already defined |

### Rules

1. One collection = one intent.  
2. If two collections return near-identical listing sets → **canonical or noindex** the weaker (engine already has dedup/quality hooks — use them).  
3. Seasonal: sitemap priority while active; noindex after season if stale.  
4. Homepage / category hubs link **3–5** collections max (no spam).

---

## Phase 5 — Internal Linking Strategy

### Current graph (evidence)

- Categories → related categories + popular browse.  
- SEO landings → `InternalLinksSection` + FAQ.  
- Homepage → listings / categories / stores.  
- Help → Legal / Support.  
- **Listings:** similar items frozen → weak PDP outbound SEO.

### Target graph (meaningful, capped)

```
Homepage
  → 10 root categories
  → 3–5 collections (stocked)
  → 2–3 UK guides / Help clusters

Category hub
  → Subcategories
  → 2–4 collections
  → 2–4 Help/Buying/Selling guides
  → Top sellers/stores (optional, stocked only)
  → Sibling categories

Listing PDP
  → Category breadcrumbs (exists)
  → Seller / store profile
  → Related listings (when Owner unfreezes)
  → 1–2 category guides (contextual)

Seller / Store
  → Active listings
  → Category of top listings
  → “How to buy / safety” Help (1–2 links)

Collections
  → Parent categories
  → Related collections (max 4)
  → Relevant guides

Help / FAQ
  → Exact category or collection when topical
  → Legal SSOT for policy
  → Never orphan articles
```

### Anti-spam rules

- Max **~15–25** contextual outbound content links per page type (excluding nav).  
- Prefer deep links over repeating the same 8 “popular searches” everywhere.  
- Align popular links with Catalog Master (courier-safe).  
- No footer link farms.

---

## Phase 6 — Help Centre Strategy

### Current

~**24** articles (account, buy, sell, payments, delivery, safety, tax, moderation, redirects to Legal).

### Minimum target

| Horizon | Article count (evergreen, unique) | Purpose |
|---------|-----------------------------------|---------|
| **P12 Wave A** | **60** | Cover all Owner-requested clusters with 1 canonical each |
| **P12 Wave B** | **80–100** | Sub-intents + UK marketplace guides |
| **Steady state** | **100–120** | Maintenance; retire duplicates |

### Topic clusters & priority order

| Priority | Cluster | Min articles | Expected organic role |
|----------|---------|-------------:|------------------------|
| Critical | Buying + Purchase protection + Offers | 8–10 | High-intent “how to buy / offer” queries |
| Critical | Selling + Photos + Pricing + Parcels | 8–10 | Seller acquisition SEO |
| Critical | Safety + Trust + Scams | 6–8 | Trust SERPs + brand safety |
| High | Shipping + Tracking + Returns/Refunds | 8–10 | Post-purchase + mid-funnel |
| High | Wallet + Withdraw + Fees (buyer fee clarity) | 5–7 | Confusion queries → retention |
| High | Verification | 3–4 | Conversion trust |
| Medium | Business / tax (informational) | 4–6 | Long-tail B2C sellers |
| Medium | Community + Reports | 4–5 | Policy education → Legal |
| Medium | UK Marketplace Guides | 6–8 | Topical authority |
| Low | Vertical deep-dives (fashion, electronics, vehicle parts) | 8–12 | Category reinforcement |

### Expected traffic (directional)

- Wave A alone: often **low thousands of impressions/month** early on a new domain, scaling with brand + links.  
- Combined with category hubs: Help becomes **supporting authority**, not the only traffic engine.  
- Competitors win Help SERPs with hundreds of articles + backlinks — ROVEXO’s goal is **coverage of commercial intents**, not parity of article count with Amazon.

### Metadata hygiene (recommendation only)

Bring Help articles onto full `buildPageMetadata` (canonical + OG) — identified gap in audit; do not rebuild Help UX.

---

## Phase 7 — FAQ Strategy

### Current

- `/help/faq` aggregates FAQs from Help hubs (`listHelpFaqs`).  
- Category hubs embed FAQ sets (Orders, Payments & Wallet, Shipping, Safety, etc. — ~31 Q&As in hubs file).  
- Programmatic landings use **template FAQ** (`generatePageFaq`) — useful but repetitive if overused.

### Missing questions (by audience)

| Audience | Missing / weak FAQ themes |
|----------|---------------------------|
| **Buyer** | Total Buyer Pays, offers vs Buy Now, when to open issue, review window, platform fee visibility |
| **Seller** | £0 seller fee clarity, label print, holiday mode, payout timing, photo rejection |
| **Shipping** | Who buys label, address change, late delivery, tracking missing |
| **Payments** | Failed payment, escrow hold, refund timing, payment methods |
| **Verification** | What is checked, how long, what is blocked until verified |
| **Business** | Tax status vs “business account” myth (unified account law), storefront vs profile |
| **Category** | Condition meanings per vertical, authenticity tips, restricted items pointers |

### Expansion approach

1. Keep **one FAQ library** per cluster; render on Help FAQ + relevant hubs.  
2. Category FAQs = **category-specific only** (3–6).  
3. Emit FAQPage JSON-LD only where answers are unique (avoid sitewide duplicate FAQ spam).  
4. Link answers to canonical Help articles / Legal — not parallel policy text.

---

## Phase 8 — Seller Strategy (public profiles only)

### Current

- `/user/{username}` and `/store/{slug}` with metadata, Person/Store + ItemList JSON-LD, noindex when empty, sitemap inclusion.

### Recommendations (no marketplace behaviour change)

| Area | Recommendation |
|------|----------------|
| **Indexability** | Keep empty noindex; ensure published listings keep profiles in sitemap |
| **Internal links** | From profile: categories represented, 1 safety/buying Help link; from PDP: clear seller/store link (already expected UX) |
| **Structured data** | Keep AggregateRating only when `reviewCount > 0` (already); do not fabricate |
| **Authority** | Editorial “featured sellers” collections only when verified + stocked |
| **Freshness** | Sitemap `lastModified` from profile/listing updates (already patterned); avoid stale empty stores in index |
| **Content** | Optional short public bio in SERP description only if already in product data — do not invent new social feed |

---

## Phase 9 — Measurement & Priority Roadmap

### Priority matrix

| ID | Workstream | Priority | Difficulty | Dev effort* | Traffic potential | ROI |
|----|------------|----------|------------|-------------|-------------------|-----|
| P12-0 | Private mode OFF + GSC/Bing sitemap submit | **Critical** | Low | Ops | Unlocks all | Critical |
| P12-1 | Inventory growth so hubs clear index gates | **Critical** | High | Ops/sellers | Very high | Critical |
| P12-2 | Category hub editorial modules (10 roots first) | **Critical** | Medium | Medium | Very high | High |
| P12-3 | Help Wave A → 60 articles + full metadata | **High** | Medium | Medium–High | High | High |
| P12-4 | FAQ cluster expansion + schema discipline | **High** | Low–Medium | Low–Medium | Medium–High | High |
| P12-5 | Collection prioritisation + seasonal index rules | **High** | Medium | Medium | High | High |
| P12-6 | Internal linking map (Home/Category/Help/Collection) | **High** | Low–Medium | Low–Medium | High | Very high |
| P12-7 | Location Tier A pages (unique intros, stocked only) | **High** | Medium | Medium | High | Medium–High |
| P12-8 | PDP related listings restore (Owner gate) | **Medium** | Medium | Medium | Medium–High | High |
| P12-9 | Seller/store cross-links + freshness hygiene | **Medium** | Low | Low | Medium | Medium |
| P12-10 | Help Wave B (80–100) + UK guides | **Medium** | Medium | Medium | Medium | Medium |
| P12-11 | Align popular browse links to Catalog Master | **Medium** | Low | Low | Medium (quality) | High (risk reduction) |
| P12-12 | Pagination / crawl rules at scale | **Low** | Medium | Medium | Medium later | Medium later |
| P12-13 | Hreflang / multi-market | **Low** | High | High | Low now | Defer |

\*Dev effort = future implementation sizing only; **this document does not implement**.

### Estimated organic growth impact

| Phase | Timing (after index open) | Directional impact |
|-------|---------------------------|--------------------|
| Ops unlock + inventory | 0–3 months | Index coverage from ~near-zero usable URLs → core category/listing set |
| Category hubs + linking | 3–6 months | Material growth in category + long-tail impressions |
| Help/FAQ + collections | 3–9 months | Assistive + mid-funnel queries; brand trust SERPs |
| Location Tier A | 6–12 months | Local long-tail; only where stock sustains |
| Authority (PR/links) | 6–18 months | Required to approach Vinted/eBay; outside pure on-page |

**Blended planning assumption:** with P12-0…P12-7 executed well and sustained inventory, organic sessions **roughly 1.3×–2.2×** a thin-content launch baseline within 6–12 months. Exact numbers depend on competition and backlinks.

---

## Competitor Gap (organic SEO only)

| Capability | Vinted | eBay | Amazon MP | Bidzzy | ROVEXO after P12 plan |
|------------|--------|------|-----------|--------|------------------------|
| Technical SEO | Mature | Mature | Extreme | Growing | **Equal foundation** (already) |
| Category hub content | Strong | Very strong | Extreme | Medium | **Closing gap** if hubs shipped |
| Guides / Help library | Strong | Very strong | Extreme | Medium | **Still behind count**; aim coverage not parity |
| Programmatic SEO | Strong | Extreme | Extreme | Strong | **Competitive for size** if gated |
| Local SEO | Medium | Strong | Strong | Medium | **Credible UK tier** if Tier A only |
| Seller profile SEO | Strong | Strong | Strong | Medium | **Equal architecture** |
| Domain authority | Extreme | Extreme | Extreme | Lower | **Still behind** (needs time + citations) |

**Ahead (potential):** disciplined noindex of thin/query pages.  
**Equal:** metadata/schema/sitemaps.  
**Behind until P12+authority:** editorial depth and backlink trust.

---

## Content Strategy (single page summary)

1. **Do not rebuild** SEO engines.  
2. **Write unique** intros/FAQs/guides per URL intent.  
3. **Index only** when inventory/quality gates pass.  
4. **Cluster** Help around buy/sell/ship/pay/trust.  
5. **Connect** hubs ↔ collections ↔ Help ↔ sellers with capped links.  
6. **Align** browse popularity with Catalog Master (no whole-vehicle root promotion).  
7. **Measure** via Search Console: indexed count, impressions by template, CTR, queries → hubs.

---

## Final Organic Readiness Score

| Lens | Score |
|------|------:|
| Technical SEO readiness | **8.0 / 10** (exists) |
| Content readiness (today) | **3.5 / 10** |
| Internal linking readiness | **5.0 / 10** |
| Indexable inventory readiness | **Variable / ops-dependent** |
| Domain authority readiness | **2.5 / 10** (new brand) |
| **Overall organic readiness (today)** | **4.5 / 10** |
| **Overall organic readiness (after P12 plan executed + inventory + index open)** | **7.5 / 10** |

**Verdict:** Foundation is sufficient. P12 success = **content + hubs + linking + ops**, not a new SEO platform.

---

## Strict compliance

| Rule | Status |
|------|--------|
| NO IMPLEMENTATION | Observed |
| NO CODE / UI / CSS / DB / API / business logic | Observed |
| NO COMMIT / PUSH / DEPLOY | Observed |
| Evidence-backed recommendations | Observed (audit + codebase inventory) |

**STOP.** Next step requires separate Owner authorisation per implementation wave (recommend start: **P12-0 ops** + **P12-2 category hubs** + **P12-3 Help Wave A**).
