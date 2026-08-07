# ROVEXO — CSS Usage Forensic Audit v1.0 (Phase 2)

**STATUS:** READ ONLY · FORENSIC · NO OPTIMISATION · NO IMPLEMENTATION  
**DATE:** 2026-08-07  
**PARENTS:** `ROVEXO_CSS_ROUTE_DEPENDENCY_FORENSIC_v1.md` · `ROVEXO_P0_FORENSIC_PERFORMANCE_AUDIT_v1.md`

**ABSOLUTE:** No CSS changes · no import changes · no refactor · no delete · no commit · no push · no deploy.

---

## Method (evidence bounds)

| Method | Status | What it proves |
|--------|--------|----------------|
| Layout CSS load map | Verified (Phase 1) | Which files are **loaded** |
| Component import BFS → class/`data-`/id tokens | Verified this pass | Selectors **possibly referenced** by route UI source |
| SSR HTML DOM (scripts stripped) | Verified for `/search`, `/browse`, `/login` | Selectors whose class/`data-` tokens appear in **server HTML** |
| Live Homepage HTML | **NOT VERIFIED** | `GET /` → **307** `/login` (guest auth / private mode) without session |
| Auth-gated routes HTML | **NOT VERIFIED** | `/sell` `/inbox` `/wallet` `/orders` `/account` `/admin` → **307** login |
| Playwright CSS Coverage (byte ranges) | **NOT VERIFIED** | Chromium install blocked in this environment |
| Pseudo-state / hover-only / media-only application | Marked **CONDITIONAL** or **NOT VERIFIED** | Cannot prove paint without interaction lab |

**Loaded CSS ≠ Used CSS.** Percentages below are **token-match estimates**, not Coverage %.

---

## Environment snapshot (verified)

| Probe | Result |
|-------|--------|
| `GET /` | **307** → `/login` |
| `GET /search` | **200** |
| `GET /browse` | **200** |
| `GET /login` | **200** |
| `GET /sell`, `/inbox`, `/wallet`, `/orders`, `/account`, `/admin` | **307** → login |

---

## Applied CSS (load) reminder

| Surface | Applied CSS |
|---------|-------------|
| Platform routes | `app/globals.css` + `skip-link-v1.css` + **entire** `styles/rovexo/index.css` tree (111+ nested) |
| Auth routes | `app/globals.css` + `skip-link-v1.css` + `styles/rovexo/auth-entry.css` (includes `auth-v1.css`) |
| Dual-load exception | `auth-v1.css` also `@import`ed by platform `index.css` |

---

# AUTH CSS — `styles/rovexo/auth-v1.css`

| Metric | Value |
|-------:|------:|
| Total selectors extracted | **415** |
| AuthLogin matched (YES) | **238** |
| AuthLogin conditional | **91** |
| AuthLogin unused (NO) | **85** |
| AuthLogin not verified | **1** |
| AuthLogin estimated % used (token) | **79.3%** |
| Search live DOM matched | **0** |
| Search live DOM unused | **414** |
| Search live DOM % | **0%** |
| Browse live DOM matched | **0** |
| Browse live DOM % | **0%** |
| Homepage live DOM | **NOT VERIFIED** (307 redirect) |
| Homepage static corpus % | **0%** |

### DOM evidence (`/login` HTTP 200)

Verified in HTML (scripts stripped): `data-auth-screen="login"`, classes including `auth-login`, `auth-container`, `auth-login-route`, brand lockup classes.

### DOM evidence (`/search`, `/browse` HTTP 200)

**Zero** `auth-*` classes and **zero** `data-auth-screen` attributes in DOM after script strip.  
⇒ auth-v1 selectors: **0 matched** against live Search/Browse DOM tokens.

### Classification

| Context | Classification | Evidence |
|---------|----------------|----------|
| Auth routes (`/login` etc.) | **REQUIRED** | DOM + 79.3% token match |
| Search / Browse (live DOM) | **PROBABLY UNUSED** | 0 DOM auth tokens; 414 selectors unused |
| Other platform routes | **PROBABLY UNUSED** for auth chrome | Still **loaded** via `index.css`; live DOM **NOT VERIFIED** (auth wall) |
| Platform index inclusion | Load verified; usage on buyer DOM | Search/Browse prove non-use of auth selectors in HTML |


### Matched on AuthLogin (sample 40)
| Selector | Used | Homepage static | Search DOM | Regression if isolated from platform index |
|----------|------|-----------------|------------|---------------------------------------------|
| `.auth-splash__wordmark .text-primary` | YES | NO | NO | LOW |
| `.auth-primary-button` | YES | NO | NO | LOW |
| `.auth-layout--form main` | CONDITIONAL | NO | NO | LOW |
| `.auth-container` | YES | NO | NO | LOW |
| `.rovexo-brand-logo` | YES | NO | NO | LOW |
| `.rovexo-brand-logo` | CONDITIONAL | NO | NO | LOW |
| `.auth-login .rovexo-brand-logo.rovexo-brand-logo--auth` | YES | NO | NO | LOW |
| `.auth-register .rovexo-brand-logo.rovexo-brand-logo--auth` | YES | NO | NO | LOW |
| `.auth-login .rovexo-brand-logo.rovexo-brand-logo--auth .rovexo-brand-logo__canonical-img` | YES | NO | NO | LOW |
| `.auth-register .rovexo-brand-logo.rovexo-brand-logo--auth .rovexo-brand-logo__canonical-img` | YES | NO | NO | LOW |
| `.auth-login--cod-sange-v3 .auth-login__brand` | YES | NO | NO | LOW |
| `.rovexo-brand-logo--canonical` | YES | NO | NO | LOW |
| `.rovexo-brand-logo__canonical-img` | YES | NO | NO | LOW |
| `.auth-heading` | YES | NO | NO | LOW |
| `.auth-heading__title` | YES | NO | NO | LOW |
| `.auth-heading__description` | YES | NO | NO | LOW |
| `.auth-divider` | YES | NO | NO | LOW |
| `.auth-divider__line` | YES | NO | NO | LOW |
| `.auth-divider__label` | YES | NO | NO | LOW |
| `.auth-social-login` | YES | NO | NO | LOW |
| `.auth-social-button` | YES | NO | NO | LOW |
| `.auth-social-button__icon` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-container` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-welcome__brand .rovexo-brand-logo--auth` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-heading__title` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-heading__description` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-primary-button` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-primary-button:hover:not(:disabled)` | CONDITIONAL | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-primary-button:focus-visible` | CONDITIONAL | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-divider__line` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-social-login` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-social-button` | YES | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-container` | CONDITIONAL | NO | NO | LOW |
| `.auth-welcome.auth-welcome--premium .auth-container` | CONDITIONAL | NO | NO | LOW |
| `.auth-login-route` | YES | NO | NO | LOW |
| `.auth-login` | YES | NO | NO | LOW |
| `.auth-register` | YES | NO | NO | LOW |
| `.auth-forgot-password` | YES | NO | NO | LOW |
| `.auth-reset-password` | YES | NO | NO | LOW |
| `.auth-login--premium .auth-container` | YES | NO | NO | LOW |

### Never matched on AuthLogin corpus (sample 40)
| Selector | Used | Reason |
|----------|------|--------|
| `.auth-splash-route` | NO | No matching class/data token |
| `.auth-splash` | NO | No matching class/data token |
| `.auth-splash--ssr` | NO | No matching class/data token |
| `.auth-splash--live` | NO | No matching class/data token |
| `.auth-splash--exit` | NO | No matching class/data token |
| `.auth-splash__stage` | NO | No matching class/data token |
| `.auth-splash__mark` | NO | No matching class/data token |
| `.auth-splash__wordmark` | NO | No matching class/data token |
| `.auth-splash__wordmark-x` | NO | No matching class/data token |
| `.auth-splash__tagline` | NO | No matching class/data token |
| `.auth-splash__indicator` | NO | No matching class/data token |
| `.auth-splash__indicator span` | NO | No matching class/data token |
| `.auth-splash__indicator span:nth-child(2)` | NO | No matching class/data token |
| `.auth-splash__indicator span:nth-child(3)` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__wordmark` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__tagline` | NO | No matching class/data token |
| `.auth-splash__pulse` | NO | No matching class/data token |
| `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__wordmark` | NO | No matching class/data token |
| `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__tagline` | NO | No matching class/data token |
| `.auth-splash--live .auth-splash__stage--wordmark-only .auth-splash__pulse` | NO | No matching class/data token |
| `.auth-splash--live` | NO | No matching class/data token |
| `.auth-splash__indicator span` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__wordmark` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__tagline` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__pulse` | NO | No matching class/data token |
| `.auth-splash__stage--wordmark-only .auth-splash__pulse` | NO | No matching class/data token |
| `.auth-layout--hero` | NO | No matching class/data token |
| `.auth-secondary-button` | NO | No matching class/data token |
| `.auth-welcome-route` | NO | No matching class/data token |
| `.auth-welcome` | NO | No matching class/data token |
| `.auth-logo` | NO | No matching class/data token |
| `.auth-login--cod-sange-v3 .auth-login__intro` | NO | No matching class/data token |
| `.rovexo-brand-logo--canonical-3d` | NO | No matching class/data token |
| `.rovexo-brand-logo__tagline` | NO | No matching class/data token |
| `.rovexo-brand-logo__tagline` | NO | No matching class/data token |
| `.rovexo-brand-logo__buy` | NO | No matching class/data token |
| `.rovexo-brand-logo__grow` | NO | No matching class/data token |
| `.rovexo-brand-logo__sell` | NO | No matching class/data token |
| `.rovexo-brand-logo__dot` | NO | No matching class/data token |
| `.rovexo-brand-logo__wordmark` | NO | No matching class/data token |

### Search live DOM: auth-v1 selectors with Used=NO (count 414 / 415)
Sample 30:
- `.auth-splash-route`
- `.auth-splash`
- `.auth-splash--ssr`
- `.auth-splash--live`
- `.auth-splash--exit`
- `.auth-splash__stage`
- `.auth-splash__mark`
- `.auth-splash__wordmark`
- `.auth-splash__wordmark-x`
- `.auth-splash__wordmark .text-primary`
- `.auth-splash__tagline`
- `.auth-splash__indicator`
- `.auth-splash__indicator span`
- `.auth-splash__indicator span:nth-child(2)`
- `.auth-splash__indicator span:nth-child(3)`
- `.auth-splash__stage--wordmark-only .auth-splash__wordmark`
- `.auth-splash__stage--wordmark-only .auth-splash__tagline`
- `.auth-splash__pulse`
- `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__wordmark`
- `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__tagline`
- `.auth-splash--live .auth-splash__stage--wordmark-only .auth-splash__pulse`
- `.auth-splash--live`
- `.auth-splash__indicator span`
- `.auth-splash__stage--wordmark-only .auth-splash__wordmark`
- `.auth-splash__stage--wordmark-only .auth-splash__tagline`
- `.auth-splash__stage--wordmark-only .auth-splash__pulse`
- `.auth-splash__stage--wordmark-only .auth-splash__pulse`
- `.auth-layout--hero`
- `.auth-primary-button`
- `.auth-secondary-button`


### Routes using auth-v1 (usage)

| Route | Uses auth-v1 selectors? | Evidence |
|-------|-------------------------|----------|
| AuthLogin | **YES** (REQUIRED) | Live DOM + corpus |
| Search | **NO** (live DOM) | 0 matches |
| Browse | **NO** (live DOM) | 0 matches |
| Homepage | **NOT VERIFIED** live; static **0%** | Redirect |
| Sell/Inbox/Wallet/Orders/Profile/Settings/Admin/Checkout | **NOT VERIFIED** live | 307 login; static corpus only |

---

# Route-by-route usage map


## Homepage

| Field | Evidence |
|-------|----------|
| Route | `/` |
| Rendered components (entry corpus) | `components/homepage/canonical/CanonicalHomepage.tsx`, `components/homepage/canonical/CanonicalMarketplaceFeed.tsx`, `components/homepage/canonical/CanonicalCategoryRail.tsx`, `components/ui/ListingCard.tsx`, `components/beta/BetaAppShell.tsx` |
| Component files scanned (BFS) | **26** |
| Class tokens in corpus | **148** |
| Data-attr tokens | **31** |
| Live HTML DOM | **NOT VERIFIED live** — GET / returns 307 → /login (guest auth startup); no authenticated session in this pass |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` + page `homepage-canonical*.css` + `header-v2.css` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`main-content`, `phase-2-refinement-01`, `hpCanonical`, `rx-scroll-page`, `rx-scroll-page--with-nav`, `rx-scroll-page--no-nav`, `rail`, `railTrack`, `chip`, `view-all`, `block`, `carousel`, `carouselItem`, `no-store`, `initial-reconcile`, `render-state`, `feedGrid`, `feedSentinel`, `feedLoading`, `biz-1`, `techvault-pro`, `biz-2`, `luxe-collective`, `biz-3`, `urban-motors`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/wallet-hub-v1.css` — unused selectors **213** / total≈213 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/canonical-ds.css` — unused selectors **162** / total≈164 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Search

| Field | Evidence |
|-------|----------|
| Route | `/search` |
| Rendered components (entry corpus) | `features/search/components/SearchLandingView.tsx`, `features/search/components/SearchResultsView.tsx`, `features/search/components/SearchCategoryBrowseCard.tsx` |
| Component files scanned (BFS) | **45** |
| Class tokens in corpus | **349** |
| Data-attr tokens | **39** |
| Live HTML DOM | **HTTP 200** · DOM classes≈127 |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` + `search-results-v1.css` / `search-landing-v1.css` |
| auth-v1 static match | matched **1** · conditional **0** · unused **413** · NV **1** · **0.2%** |

### Sample class tokens
`srch-land__section`, `srch-land__section-head`, `srch-land__section-title`, `srch-land__grid`, `srch-land__chips`, `srch-land__chip`, `srch-land__chip--trending`, `srch-land__chip-icon`, `srch-land__chip-label`, `srch-land`, `srch-land__bar-row`, `srch-land__bar`, `srch-land__bar-icon`, `srch-land__bar-input`, `srch-land__camera`, `srch-land__chip-main`, `srch-land__chip-x`, `srch-land-categories-title`, `srch-land__section-action`, `srch-land-trending-title`, `search-v1`, `srch-land__close`, `srch-land-recent-title`, `h-5`, `w-5`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/canonical-ds.css` — unused selectors **162** / total≈164 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/promotion-cards-v1.css` — unused selectors **103** / total≈103 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match + SSR HTML DOM class/data attributes (scripts stripped). Playwright CSS Coverage: **NOT VERIFIED**.

## Browse

| Field | Evidence |
|-------|----------|
| Route | `/browse` |
| Rendered components (entry corpus) | `features/search/components/SearchLandingView.tsx` |
| Component files scanned (BFS) | **36** |
| Class tokens in corpus | **265** |
| Data-attr tokens | **29** |
| Live HTML DOM | **HTTP 200** · DOM classes≈133 |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` + `search-results-v1.css` / `search-landing-v1.css` |
| auth-v1 static match | matched **1** · conditional **0** · unused **413** · NV **1** · **0.2%** |

### Sample class tokens
`srch-land__section`, `srch-land__section-head`, `srch-land__section-title`, `srch-land__grid`, `srch-land__chips`, `srch-land__chip`, `srch-land__chip--trending`, `srch-land__chip-icon`, `srch-land__chip-label`, `srch-land`, `srch-land__bar-row`, `srch-land__bar`, `srch-land__bar-icon`, `srch-land__bar-input`, `srch-land__camera`, `srch-land__chip-main`, `srch-land__chip-x`, `srch-land-categories-title`, `srch-land__section-action`, `srch-land-trending-title`, `search-v1`, `srch-land__close`, `srch-land-recent-title`, `h-5`, `w-5`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/canonical-ds.css` — unused selectors **162** / total≈164 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/promotion-cards-v1.css` — unused selectors **103** / total≈103 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match + SSR HTML DOM class/data attributes (scripts stripped). Playwright CSS Coverage: **NOT VERIFIED**.

## Listing

| Field | Evidence |
|-------|----------|
| Route | `/listing/[slug]` |
| Rendered components (entry corpus) | `features/product-detail/ProductDetailPage.tsx`, `features/product-detail/ProductGalleryV1.tsx` |
| Component files scanned (BFS) | **61** |
| Class tokens in corpus | **388** |
| Data-attr tokens | **53** |
| Live HTML DOM | **NOT VERIFIED live** — No public slug fetched this pass; static corpus only |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **5** · conditional **9** · unused **400** · NV **1** · **3.4%** |

### Sample class tokens
`pd-v1`, `pd-v1__shell`, `pd-v1__hero`, `pd-v1__main`, `pd-v1__sold-banner`, `pd-v1__badge`, `pd-v1__badge--sold`, `pd-v1__sold-subtitle`, `pd-v1__price-block`, `pd-v1__title`, `pd-v1__price-row`, `pd-v1__price-col`, `pd-v1__price`, `pd-v1__price-incl`, `pd-v1__scroll-end`, `Content-Type`, `removed-forever`, `pd-product-title`, `pointer-events-none`, `fixed`, `inset-x-0`, `top-[calc(env(safe-area-inset-top)+72px)]`, `z-[300]`, `flex`, `flex-col`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/promotion-cards-v1.css` — unused selectors **103** / total≈103 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Sell

| Field | Evidence |
|-------|----------|
| Route | `/sell` |
| Rendered components (entry corpus) | `features/sell/ui/SellPage.tsx` |
| Component files scanned (BFS) | **75** |
| Class tokens in corpus | **451** |
| Data-attr tokens | **67** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **1** · conditional **0** · unused **413** · NV **1** · **0.2%** |

### Sample class tokens
`cds-field__error`, `w-full`, `max-w-none`, `sell-compact-premium`, `gap-[var(--cds-space-section-gap)]`, `pb-[calc(var(--cds-bottom-nav-offset,72px)+16px)]`, `flex`, `flex-col`, `gap-0`, `text-sm`, `text-text-secondary`, `PERMANENT-FREEZE`, `photo-publish-success`, `sell-field-stock`, `h-7`, `w-7`, `text-primary`, `sell-photo-tile__add-label`, `sell-photo-section__header`, `font-medium`, `text-text-primary`, `text-xs`, `tabular-nums`, `text-text-muted`, `sell-photo-rail`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)
- `styles/rovexo/account-center.css` — unused selectors **82** / total≈82 (pct 0%)
- `styles/rovexo/enterprise-compliance-center.css` — unused selectors **82** / total≈82 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Messages

| Field | Evidence |
|-------|----------|
| Route | `/inbox` |
| Rendered components (entry corpus) | `features/inbox/components/InboxPage.tsx`, `features/inbox/components/ConversationHub.tsx` |
| Component files scanned (BFS) | **64** |
| Class tokens in corpus | **537** |
| Data-attr tokens | **71** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`inbox-hub__list`, `inbox-hub__list--skeleton`, `inbox-hub__skel-row`, `inbox-hub__skel-avatar`, `inbox-hub__skel-lines`, `inbox-hub__skel-line`, `inbox-hub__skel-line--title`, `inbox-hub__skel-line--party`, `inbox-hub__skel-line--preview`, `inbox-hub__rx-mark`, `inbox-hub__rx-mark-img`, `inbox-hub__notif-thumb`, `inbox-hub__notif-thumb-img`, `ac-canonical__menu-icon`, `inbox-hub__notif-icon`, `list-none`, `inbox-hub__mark-all`, `inbox-hub`, `inbox-hub__refresh`, `inbox-hub__banner`, `inbox-hub__tabs`, `inbox-hub__tab-count`, `inbox-hub__mark-all-row`, `inbox-hub__pane`, `inbox-hub__empty`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)
- `styles/rovexo/account-center.css` — unused selectors **82** / total≈82 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Notifications

| Field | Evidence |
|-------|----------|
| Route | `/inbox (notifications tab)` |
| Rendered components (entry corpus) | `features/inbox/components/InboxPage.tsx` |
| Component files scanned (BFS) | **46** |
| Class tokens in corpus | **260** |
| Data-attr tokens | **34** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login; redirects from /notifications |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`inbox-hub__list`, `inbox-hub__list--skeleton`, `inbox-hub__skel-row`, `inbox-hub__skel-avatar`, `inbox-hub__skel-lines`, `inbox-hub__skel-line`, `inbox-hub__skel-line--title`, `inbox-hub__skel-line--party`, `inbox-hub__skel-line--preview`, `inbox-hub__rx-mark`, `inbox-hub__rx-mark-img`, `inbox-hub__notif-thumb`, `inbox-hub__notif-thumb-img`, `ac-canonical__menu-icon`, `inbox-hub__notif-icon`, `list-none`, `inbox-hub__mark-all`, `inbox-hub`, `inbox-hub__refresh`, `inbox-hub__banner`, `inbox-hub__tabs`, `inbox-hub__tab-count`, `inbox-hub__mark-all-row`, `inbox-hub__pane`, `inbox-hub__empty`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Wallet

| Field | Evidence |
|-------|----------|
| Route | `/wallet` |
| Rendered components (entry corpus) | `features/wallet/components/WalletHubV1.tsx`, `features/wallet/components/WalletPage.tsx` |
| Component files scanned (BFS) | **19** |
| Class tokens in corpus | **89** |
| Data-attr tokens | **32** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`wallet-v2__skeleton`, `wallet-v2__skeleton-bar`, `wallet-v2__metric-top`, `wallet-v2__metric-icon`, `wallet-v2__metric-chevron`, `wallet-v2__metric-title`, `wallet-v2__metric-amount`, `wallet-v2`, `wallet-v2__notice`, `wallet-v2__hero`, `wallet-v2__hero-top`, `wallet-v2__hero-label`, `wallet-v2__status-pill`, `wallet-v2__status-dot`, `wallet-v2__hero-balance`, `wallet-v2__hero-footer`, `wallet-v2__hero-sub`, `wallet-v2__hero-info`, `wallet-v2__hero-actions`, `wallet-v2__hero-btn`, `wallet-v2__hero-btn--secondary`, `wallet-v2__metrics`, `wallet-v2__skeleton-card`, `wallet-v2__skeleton-card--tall`, `wallet-v2__metric`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Orders

| Field | Evidence |
|-------|----------|
| Route | `/orders` |
| Rendered components (entry corpus) | `features/orders/components/OrdersPage.tsx` |
| Component files scanned (BFS) | **44** |
| Class tokens in corpus | **225** |
| Data-attr tokens | **33** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`orders-page`, `orders-page__tabs`, `orders-page__skel`, `orders-page__skel--tab`, `orders-page__chips`, `orders-page__skel--chip`, `orders-page__skel--empty`, `fw-engine__stack`, `orders-page__empty`, `orders-page__empty-title`, `orders-page__empty-sub`, `orders-page__empty-cta`, `orders-page__list`, `v7-status-lock`, `orders`, `orders-page__tab`, `orders-page__tab--on`, `orders-page__chip`, `orders-page__chip--on`, `same-origin`, `no-store`, `orders-page__item-thumb`, `orders-page__item-main`, `orders-page__item-title`, `orders-page__item-price`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Profile

| Field | Evidence |
|-------|----------|
| Route | `/account` |
| Rendered components (entry corpus) | `features/account-center/components/AccountCenterPage.tsx` |
| Component files scanned (BFS) | **56** |
| Class tokens in corpus | **253** |
| Data-attr tokens | **43** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **5** · conditional **9** · unused **400** · NV **1** · **3.4%** |

### Sample class tokens
`ac-canonical`, `profile-v1`, `main-only`, `account-canonical`, `cds-layout`, `cds-layout--account-canonical`, `cds-layout__header`, `cds-section__intro`, `account-canonical-shell`, `main-content`, `cds-layout__content`, `cds-layout__content--with-bottom-nav`, `cds-layout__content--account-canonical`, `rovexo-chrome-spacer`, `account-canonical-header__title`, `account-canonical-header__action`, `account-canonical-header--titled`, `rovexo-chrome--hidden`, `account-canonical-header__bar`, `account-canonical-header__bar--titled`, `cds-header__back`, `aria-label`, `my-account-template`, `my-account-template__content`, `profile-footer-banner`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)
- `styles/rovexo/account-center.css` — unused selectors **82** / total≈82 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Settings

| Field | Evidence |
|-------|----------|
| Route | `/account/settings` |
| Rendered components (entry corpus) | `features/account-module/components/SettingsV1.tsx`, `features/account-module/components/SettingsMenuSections.tsx` |
| Component files scanned (BFS) | **44** |
| Class tokens in corpus | **223** |
| Data-attr tokens | **32** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`settings-canonical-v1`, `settings-canonical`, `fw-engine__stack`, `fw-engine__group`, `fail-closed-v1`, `?`, `fail-closed-v1__title`, `fail-closed-v1__body`, `fail-closed-v1__hint`, `fail-closed-v1__actions`, `fail-closed-v1__retry`, `fail-closed-v1__home`, `account-canonical`, `cds-layout`, `cds-layout--account-canonical`, `cds-layout__header`, `cds-section__intro`, `account-canonical-shell`, `main-content`, `cds-layout__content`, `cds-layout__content--with-bottom-nav`, `cds-layout__content--account-canonical`, `rovexo-chrome-spacer`, `account-canonical-header__title`, `account-canonical-header__action`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)
- `styles/rovexo/enterprise-admin-unified.css` — unused selectors **92** / total≈92 (pct 0%)
- `styles/rovexo/design-studio-v1.css` — unused selectors **91** / total≈91 (pct 0%)
- `styles/rovexo/dashboard.css` — unused selectors **82** / total≈83 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Checkout

| Field | Evidence |
|-------|----------|
| Route | `/checkout/[slug]` |
| Rendered components (entry corpus) | `features/checkout/components/CheckoutWizardV1.tsx` |
| Component files scanned (BFS) | **14** |
| Class tokens in corpus | **90** |
| Data-attr tokens | **12** |
| Live HTML DOM | **NOT VERIFIED live** — No slug; auth gated |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
`ckt-v1`, `ckt-v1__main`, `ckt-v1__sections`, `ckt-v1__section`, `ckt-v1__section-title`, `ckt-v1__card`, `ckt-v1__card--pad`, `ckt-v1__card--editable`, `ckt-v1__card--edit-top`, `ckt-v1__edit-link`, `ckt-v1__review-value`, `ckt-v1__review-subvalue`, `ckt-v1__option-list`, `ckt-v1__option-icon`, `ckt-v1__option-copy`, `ckt-v1__option-title`, `ckt-v1__option-detail`, `ckt-v1__option-radio`, `ckt-v1__delivery-details`, `ckt-v1__delivery-details-top`, `ckt-v1__shipping-brand`, `ckt-v1__delivery-meta`, `ckt-v1__option-copy--stacked`, `ckt-v1__section--price`, `ckt-v1__footer`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/product-detail-v1.css` — unused selectors **251** / total≈251 (pct 0%)
- `styles/rovexo/wallet-hub-v1.css` — unused selectors **213** / total≈213 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/canonical-ds.css` — unused selectors **162** / total≈164 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/inbox-hub-v1.css` — unused selectors **109** / total≈109 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Business

| Field | Evidence |
|-------|----------|
| Route | `/business` |
| Rendered components (entry corpus) | `app/(platform)/business/layout.tsx` |
| Component files scanned (BFS) | **1** |
| Class tokens in corpus | **0** |
| Data-attr tokens | **0** |
| Live HTML DOM | **NOT VERIFIED live** — 308 → /business/dashboard then likely auth |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **0** · conditional **0** · unused **414** · NV **1** · **0%** |

### Sample class tokens
_none_

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/auth-v1.css` — unused selectors **414** / total≈415 (pct 0%)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/product-detail-v1.css` — unused selectors **251** / total≈251 (pct 0%)
- `styles/rovexo/wallet-hub-v1.css` — unused selectors **213** / total≈213 (pct 0%)
- `styles/rovexo/sell.css` — unused selectors **197** / total≈197 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/command-center-v2.css` — unused selectors **174** / total≈174 (pct 0%)
- `styles/rovexo/canonical-ds.css` — unused selectors **162** / total≈164 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/phone-width-v1-freeze.css` — unused selectors **125** / total≈129 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/universal-ui-v1.css` — unused selectors **120** / total≈120 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.

## Admin

| Field | Evidence |
|-------|----------|
| Route | `/admin` |
| Rendered components (entry corpus) | `features/command-centre/AdminCommandCentreShell.tsx`, `app/(platform)/admin/page.tsx` |
| Component files scanned (BFS) | **24** |
| Class tokens in corpus | **177** |
| Data-attr tokens | **6** |
| Live HTML DOM | **NOT VERIFIED live** — 307 → login |
| Applied CSS files | `app/globals.css` + `styles/rovexo/skip-link-v1.css` + `styles/rovexo/index.css (+111 @imports)` |
| auth-v1 static match | matched **5** · conditional **9** · unused **400** · NV **1** · **3.4%** |

### Sample class tokens
`cc2-sidebar__brand`, `cc2-sidebar__list`, `cc2-sidebar__icon`, `h-[18px]`, `w-[18px]`, `cc2-sidebar__label`, `cc2-sidebar__live`, `cc2-sidebar__footer`, `cc2-sidebar__omega`, `h-5`, `w-5`, `cc2-sidebar__collapse`, `sa-premium-header`, `cc-unified__header`, `sa-premium-header__inner`, `sa-premium-header__brand`, `flex`, `flex-wrap`, `items-center`, `gap-ds-2`, `sa-premium-header__eyebrow`, `cc-unified__title`, `cc-unified__title-icon`, `sa-premium-header__actions`, `cc2-theme-toggle`

### Unused loaded CSS files (0% token match on this route corpus — top 15 by unused selectors)
- `styles/rovexo/conversation-hub-v1.css` — unused selectors **304** / total≈304 (pct 0%)
- `styles/rovexo/product-detail-v1.css` — unused selectors **251** / total≈251 (pct 0%)
- `styles/rovexo/wallet-hub-v1.css` — unused selectors **213** / total≈213 (pct 0%)
- `styles/rovexo/account-module-v1.css` — unused selectors **191** / total≈191 (pct 0%)
- `styles/rovexo/account-2026.css` — unused selectors **155** / total≈155 (pct 0%)
- `styles/rovexo/mobile-distribution-center.css` — unused selectors **150** / total≈150 (pct 0%)
- `styles/rovexo/command-center-v1.css` — unused selectors **146** / total≈146 (pct 0%)
- `styles/rovexo/mission-control.css` — unused selectors **121** / total≈121 (pct 0%)
- `styles/rovexo/account-canonical-v2.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/checkout-v1.css` — unused selectors **118** / total≈118 (pct 0%)
- `styles/rovexo/omega-enterprise-mobile.css` — unused selectors **113** / total≈113 (pct 0%)
- `styles/rovexo/rovexo-ideas-v1.css` — unused selectors **111** / total≈111 (pct 0%)
- `styles/rovexo/hero.css` — unused selectors **108** / total≈108 (pct 0%)
- `styles/rovexo/promotion-cards-v1.css` — unused selectors **103** / total≈103 (pct 0%)
- `styles/rovexo/home-v1-launch-polish.css` — unused selectors **98** / total≈98 (pct 0%)

### Used / unused / conditional selectors
Full per-selector dump for all sheets is impractical in one markdown; **auth-v1 full findings** are in § AUTH. Per-file percentages are in § CSS FILE MATRIX.

**Evidence method:** static component token match. Playwright CSS Coverage: **NOT VERIFIED**.


---

# CSS FILE MATRIX (token-match % by route)

| File | Selectors | Homepage % | Search % | Browse % | AuthLogin % | Sell % | Messages % | Wallet % | Orders % | Profile % | Checkout % | Admin % |
|------|----------:|----------:|---------:|---------:|------------:|-------:|-----------:|---------:|---------:|----------:|-----------:|--------:|
| `styles/rovexo/auth-v1.css` | 415 | 0 | 0.2 | 0.2 | 79.3 | 0.2 | 0 | 0 | 0 | 3.4 | 0 | 3.4 |
| `app/globals.css` | 29 | 0 | 10.3 | 10.3 | 0 | 6.9 | 3.4 | 0 | 0 | 0 | 3.4 | 0 |
| `styles/rovexo/platform-canonical-ui.css` | 33 | 0 | 0 | 0 | 0 | 6.1 | 6.1 | 0 | 6.1 | 6.1 | 3 | 0 |
| `styles/rovexo/sell.css` | 197 | 2.5 | 3 | 3 | 3 | 97 | 27.4 | 4.1 | 25.9 | 27.4 | 2.5 | 3 |
| `styles/rovexo/conversation-hub-v1.css` | 304 | 0 | 0 | 0 | 0 | 0.3 | 70.1 | 0.3 | 0.3 | 0.3 | 0 | 0 |
| `styles/rovexo/inbox-hub-v1.css` | 109 | 2.8 | 2.8 | 2.8 | 0 | 22.9 | 81.7 | 18.3 | 22.9 | 22.9 | 0 | 0.9 |
| `styles/rovexo/wallet-hub-v1.css` | 213 | 0 | 0.9 | 0.9 | 0.9 | 4.7 | 4.7 | 34.3 | 4.7 | 4.7 | 0 | 0 |
| `styles/rovexo/checkout-v1.css` | 118 | 0 | 0 | 0 | 0 | 0 | 5.9 | 0 | 0 | 0 | 55.1 | 0 |
| `styles/rovexo/product-detail-v1.css` | 251 | 0.8 | 0.8 | 0.8 | 0 | 2 | 7.2 | 0.8 | 0.8 | 1.2 | 0 | 0 |
| `styles/rovexo/super-admin-premium.css` | 78 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 73.1 |
| `styles/rovexo/enterprise-core.css` | 48 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `styles/rovexo/mission-control.css` | 121 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `styles/rovexo/bottom-nav-premium.css` | 26 | 100 | 100 | 100 | 0 | 100 | 100 | 100 | 100 | 100 | 0 | 0 |
| `styles/rovexo/listing-card-official.css` | 2 | 50 | 50 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `styles/homepage-canonical.css` | 16 | 68.8 | 81.3 | 31.3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `styles/rovexo/search-landing-v1.css` | 44 | 0 | 95.5 | 95.5 | 2.3 | 2.3 | 2.3 | 0 | 0 | 2.3 | 0 | 2.3 |


### How to read

- **High % on AuthLogin + ~0% on Search DOM for auth-v1** → strong isolation candidate (load path still global).  
- **High % on Messages + low on Search** for `conversation-hub-v1.css` / `inbox-hub-v1.css` → route-specific intent, globally loaded.  
- **Admin/enterprise sheets with ~0% on Search/Browse** → loaded globally, unused on public marketplace HTML.

---

# EVERY ANALYZED CSS FILE (selector counts)

| File | Selectors | Bytes |
|------|----------:|------:|
| `styles/rovexo/auth-v1.css` | 415 | 56419 |
| `styles/rovexo/conversation-hub-v1.css` | 304 | 44422 |
| `styles/rovexo/product-detail-v1.css` | 251 | 37396 |
| `styles/rovexo/wallet-hub-v1.css` | 213 | 28565 |
| `styles/rovexo/sell.css` | 197 | 30063 |
| `styles/rovexo/account-module-v1.css` | 191 | 26547 |
| `styles/rovexo/command-center-v2.css` | 174 | 17461 |
| `styles/rovexo/canonical-ds.css` | 164 | 23233 |
| `styles/rovexo/account-2026.css` | 155 | 22017 |
| `styles/rovexo/mobile-distribution-center.css` | 150 | 18274 |
| `styles/rovexo/command-center-v1.css` | 146 | 15024 |
| `styles/rovexo/phone-width-v1-freeze.css` | 129 | 5820 |
| `styles/rovexo/mission-control.css` | 121 | 13920 |
| `styles/rovexo/universal-ui-v1.css` | 120 | 15428 |
| `styles/rovexo/account-canonical-v2.css` | 118 | 16787 |
| `styles/rovexo/checkout-v1.css` | 118 | 17750 |
| `styles/rovexo/omega-enterprise-mobile.css` | 113 | 11392 |
| `styles/rovexo/rovexo-ideas-v1.css` | 111 | 13714 |
| `styles/rovexo/compact-premium-v1.css` | 110 | 10578 |
| `styles/rovexo/inbox-hub-v1.css` | 109 | 18227 |
| `styles/rovexo/hero.css` | 108 | 17218 |
| `styles/rovexo/promotion-cards-v1.css` | 103 | 14457 |
| `styles/rovexo/full-width-engine-v1.css` | 99 | 12146 |
| `styles/rovexo/home-v1-launch-polish.css` | 98 | 13033 |
| `styles/rovexo/enterprise-admin-unified.css` | 92 | 11746 |
| `styles/rovexo/design-studio-v1.css` | 91 | 9599 |
| `styles/rovexo/dashboard.css` | 83 | 11934 |
| `styles/rovexo/account-center.css` | 82 | 13044 |
| `styles/rovexo/enterprise-compliance-center.css` | 82 | 9285 |
| `styles/rovexo/mission-control-v2.css` | 80 | 11576 |
| `styles/rovexo/super-admin-premium.css` | 78 | 12698 |
| `styles/rovexo/home-v1-visual-qa.css` | 77 | 8210 |
| `styles/rovexo/incident-command-center.css` | 77 | 8447 |
| `styles/rovexo/device-lifecycle-manager.css` | 75 | 8059 |
| `styles/rovexo/hmrc-reporting-centre-v1.css` | 73 | 7435 |
| `styles/rovexo/orders-page-v1.css` | 68 | 10001 |
| `styles/rovexo/incident-timeline.css` | 67 | 7640 |
| `styles/rovexo/category-rail.css` | 66 | 6654 |
| `styles/rovexo/omega-command-center.css` | 65 | 5823 |
| `styles/rovexo/cart-v1.css` | 63 | 8236 |
| `styles/rovexo/mobile.css` | 61 | 6984 |
| `styles/rovexo/utilities.css` | 60 | 9961 |
| `styles/rovexo/app-studio.css` | 60 | 6084 |
| `styles/rovexo/home-final.css` | 59 | 8056 |
| `styles/rovexo/enterprise-module-registry.css` | 57 | 6387 |
| `styles/rovexo/executive-command.css` | 56 | 6579 |
| `styles/rovexo/layout.css` | 55 | 9452 |
| `styles/rovexo/home-sections-premium.css` | 54 | 7527 |
| `styles/rovexo/operations-center.css` | 54 | 6030 |
| `styles/rovexo/header-v2.css` | 54 | 5767 |
| `styles/rovexo/theme-studio-pro.css` | 52 | 6386 |
| `styles/rovexo/enterprise-workflow-engine.css` | 50 | 4881 |
| `styles/rovexo/enterprise-core.css` | 48 | 5161 |
| `styles/rovexo/recovery-center.css` | 46 | 5256 |
| `styles/rovexo/auctions.css` | 45 | 8495 |
| `styles/rovexo/certification-center.css` | 45 | 5393 |
| `styles/rovexo/mobile-scroll-v1.css` | 44 | 8192 |
| `styles/rovexo/visual-cms.css` | 44 | 6690 |
| `styles/rovexo/audit-compliance.css` | 44 | 5306 |
| `styles/rovexo/homepage-builder-engine.css` | 44 | 4072 |
| `styles/rovexo/incident-response-center.css` | 44 | 3629 |
| `styles/rovexo/search-landing-v1.css` | 44 | 9901 |
| `styles/rovexo/cards.css` | 43 | 6340 |
| `styles/rovexo/account.css` | 41 | 7251 |
| `styles/rovexo/protection-engine.css` | 40 | 4998 |
| `styles/rovexo/notifications-engine.css` | 39 | 4556 |
| `styles/rovexo/asset-manager.css` | 39 | 4330 |
| `styles/rovexo/enterprise-soc.css` | 39 | 3303 |
| `styles/rovexo/addresses-v1.css` | 37 | 6137 |
| `styles/rovexo/platform-studio.css` | 37 | 4326 |
| `styles/rovexo/wallet-engine.css` | 37 | 4592 |
| `styles/rovexo/account-hub-v1.css` | 36 | 5197 |
| `styles/rovexo/payments-engine.css` | 36 | 4468 |
| `styles/rovexo/bring-your-item.css` | 35 | 3746 |
| `styles/rovexo/messages-engine.css` | 35 | 4434 |
| `styles/rovexo/home-polish.css` | 34 | 5660 |
| `styles/rovexo/shipping-engine.css` | 34 | 3742 |
| `styles/rovexo/orders-engine.css` | 34 | 4321 |
| `styles/rovexo/enterprise-business-intelligence.css` | 34 | 2811 |
| `styles/rovexo/store-listing-card-premium-v1.css` | 33 | 4773 |
| `styles/rovexo/platform-canonical-ui.css` | 33 | 4574 |
| `styles/rovexo/command-os-v4.css` | 33 | 3475 |
| `styles/rovexo/account-settings-ui.css` | 32 | 6865 |
| `styles/rovexo/account-settings-v1.css` | 32 | 5974 |
| `styles/rovexo/header-premium.css` | 32 | 3195 |
| `styles/rovexo/enterprise-automation-hub.css` | 32 | 2656 |
| `styles/rovexo/security-engine.css` | 31 | 3948 |
| `styles/rovexo/search-engine.css` | 31 | 3858 |
| `styles/rovexo/primary-button-v1.css` | 30 | 3718 |
| `app/globals.css` | 29 | 6752 |
| `styles/rovexo/command-centre-unified-v1.css` | 29 | 4273 |
| `styles/rovexo/analytics-engine.css` | 29 | 3744 |
| `styles/rovexo/ai-engine.css` | 29 | 3786 |
| `styles/rovexo/enterprise-ai-os.css` | 29 | 2840 |
| `styles/rovexo/search-results-v1.css` | 29 | 6215 |
| `styles/rovexo/integrations-engine.css` | 28 | 3737 |
| `styles/rovexo/enterprise-mobile-control-center.css` | 28 | 2750 |
| `styles/rovexo/enterprise-deployment-center.css` | 28 | 2748 |
| `styles/rovexo/make-offer-v1.css` | 26 | 3635 |
| `styles/rovexo/bottom-nav-premium.css` | 26 | 4961 |
| `styles/rovexo/image-search.css` | 26 | 3688 |
| `styles/rovexo/account-settings-canonical.css` | 24 | 2652 |
| `styles/rovexo/home-product-cards.css` | 23 | 5248 |
| `styles/rovexo/home-launch-polish.css` | 23 | 3126 |
| `styles/homepage-canonical.css` | 16 | 2198 |
| `styles/rovexo/forms.css` | 15 | 2766 |
| `styles/rovexo/platform-visual.css` | 15 | 2364 |
| `styles/rovexo/secondary-banners.css` | 12 | 2222 |
| `styles/rovexo/chrome-scroll.css` | 11 | 1079 |
| `styles/rovexo/icon-standard-v1.css` | 11 | 1059 |
| `styles/rovexo/rovexo-header-standard-v1.css` | 10 | 1820 |
| `styles/rovexo/shell.css` | 10 | 3201 |
| `styles/rovexo/benefits-rail.css` | 10 | 1679 |
| `styles/rovexo/typography.css` | 9 | 2092 |
| `styles/rovexo/rvx-topbar-v1.css` | 8 | 1542 |
| `styles/rovexo/sign-out.css` | 5 | 741 |
| `styles/rovexo/skip-link-v1.css` | 3 | 1134 |
| `styles/homepage-canonical-responsive.css` | 3 | 1271 |
| `styles/tokens.css` | 2 | 5649 |
| `styles/rovexo/listing-card-official.css` | 2 | 1043 |
| `styles/rovexo/premium-empty-state.css` | 2 | 229 |
| `styles/rovexo/my-account-primary-button-v1.css` | 0 | 272 |
| `styles/rovexo/auth-entry.css` | 0 | 583 |


For each file, per-route matched/unused counts live in the machine JSON used to generate this report (`/tmp/rovexo-css-usage-phase2.json` — local artifact; not a product file). Markdown lists percentages for key files above; full selector-by-selector listings for non-auth sheets are omitted for size but follow the same match algorithm as auth-v1.

---

# GLOBAL CSS

## `app/globals.css`

| Field | Evidence |
|-------|----------|
| Selectors extracted | **29** |
| Role | Tailwind import + skip-link import + theme tokens |
| Truly global | Root layout always; skip-link CSS imported here |
| Feature-only | Tailwind utilities used across features — **NOT VERIFIED** per-utility without Coverage |

## `styles/rovexo/index.css`

| Field | Evidence |
|-------|----------|
| Direct selectors | **0** (import hub only) |
| Effect | Loads **114** resolved sheets (Phase 1) onto every platform route |
| Truly global children | tokens, typography, forms, shell, layout, utilities, bottom-nav, mobile-scroll, full-width, universal-ui, compact-premium, phone-width, listing-card, etc. |
| Feature-only children loaded globally | sell, checkout, conversation-hub, wallet-hub, auth-v1, enterprise/*, mission-control/*, etc. |

## `styles/rovexo/platform-canonical-ui.css`

| Field | Evidence |
|-------|----------|
| Selectors | **33** |
| Nested | account-canonical-v2, account-settings-ui, addresses-v1 |
| Feature group heuristic counts | Shared:15, Profile:1, Wallet:10, Checkout:3, Settings:4 |
| Auth-entry also imports it | Yes (auth layout) |

---

# FEATURE GROUPS (selector naming heuristic across analyzed CSS)

| Group | Selector count (heuristic) |
|-------|---------------------------:|
| Shared | 4157 |
| Profile | 773 |
| Auth | 428 |
| Messages | 409 |
| Homepage | 356 |
| Listing | 354 |
| Wallet | 331 |
| Admin | 316 |
| Sell | 206 |
| Orders | 104 |
| Checkout | 75 |
| Search | 60 |
| Settings | 50 |
| Notifications | 23 |
| Business | 13 |

Naming heuristic ≠ proven DOM usage.

---

# MOBILE IMPACT

| Target | Evidence | Impact |
|--------|----------|--------|
| Safari iPhone | No device Coverage / performance trace | **NOT VERIFIED** |
| Chrome Android | No device Coverage | **NOT VERIFIED** |
| Samsung Internet | No device Coverage | **NOT VERIFIED** |

Code+DOM evidence only: globally loading `auth-v1.css` (**56419 bytes**, **415** selectors) on Search/Browse contributes **0** matched auth selectors in live HTML — parse cost exists, paint use not evidenced.

---

# VERIFIED CSS ISOLATION OPPORTUNITIES

Only items with verified load + verified non-use on at least one live DOM route (or dual-path load proof).

| # | File | Route | Reason | Evidence | Estimated mobile benefit | Regression risk | Complexity | Functional change |
|--:|------|-------|--------|----------|--------------------------|-----------------|------------|-------------------|
| 1 | `styles/rovexo/auth-v1.css` | Platform Search/Browse (loaded via `index.css`) | Auth selectors unused in live Search/Browse DOM while file still loaded globally | Load: `index.css` @import; Usage: Search/Browse HTML scripts-stripped → **0** auth class/`data-auth-screen`; Login DOM uses auth classes | Medium–High (56KB source / 415 selectors not needed on those pages) | **LOW** for removing from **platform index only** (auth-entry still loads it); **HIGH** if deleted entirely | Medium | **NO** if only dropped from platform index and auth-entry retained; **YES** if platform secretly depends on auth classes (**NOT VERIFIED** beyond Search/Browse) |
| 2 | Enterprise/admin sheets in `index.css` (e.g. `super-admin-premium.css`, `mission-control.css`, `enterprise-core.css`) | Homepage/Search/Browse | Globally loaded; token match ~0% on Search/Browse corpora | Phase 1 load map + Phase 2 matrix low/zero % on Search/Browse | High aggregate | **HIGH** for Super Admin routes | High | **YES** if Super Admin loses styles |
| 3 | `conversation-hub-v1.css` / `inbox-hub-v1.css` on Search/Browse | Search/Browse | Route-specific sheets loaded globally; low token match on public browse/search | Matrix % vs Messages corpus higher | Medium | **HIGH** for Inbox | High | **YES** if Inbox loses styles |
| 4 | `sell.css` / `checkout-v1.css` on Search/Browse | Search/Browse | Same pattern | Matrix | Medium | **HIGH** for Sell/Checkout freezes | High | **YES** if those routes lose styles |
| 5 | Duplicate feature re-imports of sheets already in index | Messages/Orders/Wallet/Checkout | Second `import` of same file | Phase 1 dependency forensic | Low (if bundler dedupes — **NOT VERIFIED**) | Low | Low | **NO** if dedupe-only |

**Not listed:** Homepage live isolation (redirect prevents DOM proof); auth-gated route live isolation (no session).

---

## Finding template compliance (auth-v1)

Every auth-v1 selector is recorded in generator output with fields: File · Selector · Used (YES/NO/CONDITIONAL/NOT VERIFIED) · Reason · Route · Homepage static · Search DOM · Regression risk.  
Markdown shows samples; complete array length = **415**.

---

## Document control

| Field | Value |
|-------|-------|
| Document | `docs/audits/ROVEXO_CSS_USAGE_FORENSIC_v1.md` |
| Version | 1.0 · Phase 2 |
| Implementation | NONE |
| Commit / Push / Deploy | NONE |

**END OF PHASE 2 · STOP.**
