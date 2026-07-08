# ROVEXO UI Polish Pass v1.0 — Gap Report

**Date:** 2026-07-06  
**Build:** Production (`npm run build` PASS)  
**Screenshots:** `reports/module-2/ui-polish/screenshots/` (14 captures, server `http://127.0.0.1:3026`)  
**Status:** **NOT APPROVED** — visual review required before commit

---

## Executive summary

This pass applied UI-only refinements across Homepage, Sell, Product, My Account, Business, and Super Admin navigation. Production build succeeds and screenshots are attached for your visual sign-off.

**We do not claim full spec compliance.** The sections below list every meaningful gap between the approved product vision and what renders today.

---

## Screenshots captured

| ID | File | Surface | Theme | Viewport |
|----|------|---------|-------|----------|
| 01 | `01-homepage-white.png` | Homepage | White | Mobile 390×844 |
| 02 | `02-homepage-black.png` | Homepage | Black | Mobile 390×844 |
| 03 | `03-showcase.png` | Homepage (showcase rails) | White | Mobile 390×844 |
| 04 | `04-sell.png` | Sell (empty upload) | White | Mobile 390×844 |
| 05 | `05-upload-photos.png` | Sell (8 photos uploaded) | White | Mobile 390×844 |
| 06 | `06-product-page.png` | Product detail | White | Desktop 1440×900 |
| 07 | `07-my-account.png` | My Account | White | Mobile 390×844 |
| 08 | `08-business.png` | Business dashboard | White | Desktop 1440×900 |
| 09 | `09-promotion.png` | Plans / promotion | White | Mobile 390×844 |
| 10 | `10-super-admin.png` | Super Admin home | White | Desktop 1440×900 |
| 11 | `11-theme-engine.png` | Theme Engine | White | Desktop 1440×900 |
| 12 | `12-android.png` | Homepage | White | Pixel 7 |
| 13 | `13-iphone.png` | Homepage | White | iPhone 14 (WebKit) |
| 14 | `14-desktop.png` | Homepage | White | Desktop 1440×900 |

### Screenshots **not** captured (spec requested)

| Missing capture | Reason |
|-----------------|--------|
| Dedicated **Listing Review** step after publish | Sell flow has no separate review screen; publish goes to `SellPublishedStep` |
| **Seller profile** after showcase click | Not scripted; seller links resolve to existing profile/search routes |
| **Business Showcase** standalone surface | No separate route; showcase lives on homepage rails + business listings |
| **Tablet** (e.g. iPad) | Script covers phone + desktop only |
| **Firefox / Edge** | Chromium + WebKit only |
| Black theme on Sell, Account, Business, Super Admin | Only homepage black theme captured |
| Authenticated route smoke for Settings, Wallet, Security, Notifications, Help | Routes exist in nav; no per-route screenshots in this pass |

---

## Changes applied in this pass (UI only)

| Area | Change |
|------|--------|
| **Homepage header** | Compact row: logo + search + messages + notifications + account; no “Bring your item” CTA on homepage |
| **Listing cards** | Homepage cards hide condition, buyer protection, photo count |
| **Showcase** | `statusBadgeLabel="Showcase"` on rail cards |
| **Super Admin nav** | `lib/super-admin/nav.ts` reduced to **14 canonical modules** (no Dashboard, Showcase, Pricing, Notifications, System Health duplicates in sidebar) |
| **My Account** | `ProfileCard` + Trust Score + Quick Actions grid; menu simplified to **12 items** |
| **Sell** | Removed `OptionalCard` from main flow |
| **Product page** | Removed breadcrumbs, engagement row, buyer protection block, similar items, report dialog |

---

## Gap analysis by surface

### Homepage

| Requirement | Status | Gap |
|-------------|--------|-----|
| Compact header: Logo, Search, Messages, Notifications, Account | **Partial** | Header matches on homepage; bottom nav still duplicates Search + Account |
| ROVEXO logo with purple X wordmark | **Gap** | Header uses icon mark only — no “ROVEXO” wordmark with purple X |
| Categories: horizontal scroll, text only, no icons | **Met** | Text capsules; smooth scroll preserved |
| Listing cards: image, favourite, title, price, business badge, showcase badge, rating, views | **Partial** | Core fields present; showcase rail **prices truncate** on narrow cards; green **NEW** status badges still appear (not in minimal spec) |
| No cropped images / truncated prices / compressed cards | **Gap** | Showcase rail prices clip (`£3…`); some titles ellipsized |
| Showcase: avatar, business badge, name, follow, horizontal listings | **Met** | Single `RovexoShowcaseSection` layout |
| Seller click → profile → all listings | **Partial** | Links work via `profileHref`; not a dedicated storefront UX review |
| Complete homepage redesign | **Partial** | Incremental polish, not a full visual rebuild |
| No visual clutter | **Partial** | Bottom nav + multiple feed sections still dense on long scroll |

### Sell

| Requirement | Status | Gap |
|-------------|--------|-----|
| Single photo upload card → gallery → up to 8 → horizontal preview → drag & drop | **Partial** | `PhotoUploader` supports this; form fields remain on same page |
| Review Listing → horizontal image slider | **Gap** | No dedicated review step; publish is inline |
| Remove unnecessary sections | **Partial** | `OptionalCard` removed; `ListingForm`, `ItemConditionSelector`, parcel size, category picker remain |
| Simple linear flow | **Gap** | Still single-page composer, not stepped wizard |

### My Account

| Requirement | Status | Gap |
|-------------|--------|-----|
| Premium dashboard: profile, trust score, business badge, stats, quick actions | **Met** | `ProfileCard` + `AccountQuickAccessGrid` |
| Simplified menu, no duplicates | **Partial** | 12-item menu; Quick Actions overlap thematically with menu (Buying/Selling hubs vs tiles) |
| Settings, Wallet, Security, Business, Notifications, Help open for auth users | **Assumed** | Routes in `account-nav.ts`; not screenshot-verified per route |
| Theme tokens only (no hardcoded colours) | **Gap** | `account-nav.ts` still uses hex literals (`#9333EA`, etc.) |

### Product page

| Requirement | Status | Gap |
|-------------|--------|-----|
| Large gallery, price, seller, buy, message, shipping | **Met** | Seller card below fold; action bar has buy/message |
| No unnecessary blocks | **Partial** | Description + “Show more”, share sheet, scroll-collapse header remain |
| Demo gallery | **Gap** | Screenshot shows placeholder gradient — demo images may not load in prod snapshot for this listing |

### Business

| Requirement | Status | Gap |
|-------------|--------|-----|
| Professional appearance, verified badge | **Met** | Profile card shows verified business |
| Business Dashboard | **Met** | `/business/dashboard` captured |
| Business Showcase | **Gap** | No dedicated business showcase page in screenshots |
| Business Profile | **Partial** | “View Store” on dashboard; separate profile polish not reviewed |
| No duplicated information | **Gap** | `DashboardQuickActionsGrid` renders mobile list + desktop grid variants; on some viewports both may feel redundant |
| Layout polish | **Gap** | Inventory section title can overlap summary cards (spacing bug visible in screenshot) |

### Super Admin

| Requirement | Status | Gap |
|-------------|--------|-----|
| 14 modules, no duplicates | **Met** (nav source) | `SUPER_ADMIN_PRIMARY_NAV` has exactly 14 items |
| Simplified navigation | **Partial** | Sidebar nav simplified; `/super-admin` home is still dense Command Center (NOC metrics, alerts, charts) |
| Everything synchronized live | **Met** | Existing live providers unchanged |
| Legacy routes | **Note** | `/super-admin/pricing`, `/super-admin/monitoring` pages still exist but are **not** in sidebar nav |

### Brand & Theme

| Requirement | Status | Gap |
|-------------|--------|-----|
| Official ROVEXO branding from Brand Center | **Partial** | Brand Center module exists; consumer surfaces still use mixed icon/header patterns |
| White + Black themes, purple accent | **Met** | `data-theme` light/dark; `#9333ea` token |
| No hardcoded colours | **Gap** | Account nav palette, some dashboard accents still hardcoded |

### Responsive / browsers

| Requirement | Status | Gap |
|-------------|--------|-----|
| Android, iPhone, Desktop | **Met** | Screenshots 12–14 |
| Tablet | **Gap** | Not captured |
| Chrome, Safari (WebKit), Firefox, Edge | **Partial** | Chromium + WebKit only |

---

## Automated certification note

`scripts/module2-final-visual-cert.mjs` still expects **legacy** Super Admin hrefs (`/super-admin/pricing`, `/super-admin/monitoring`). Nav was intentionally simplified per this spec; re-run cert after updating script expectations or accept WARN on those checks.

---

## Recommended next steps (after your visual review)

1. **You review** screenshots in `reports/module-2/ui-polish/screenshots/`
2. Reply with approve / change list (per-page)
3. Only after explicit approval: Git commit (not done in this pass)
4. High-impact follow-ups if you want closer spec match:
   - Sell: stepped flow with Review Listing screen
   - Homepage: wordmark logo, price truncation fix in showcase rails, remove NEW badges from feed cards
   - Business: fix inventory spacing; single quick-actions layout
   - Account: migrate nav colours to CSS tokens
   - Capture tablet + Firefox + per-route account screenshots

---

## STOP RULE

- **No commit**
- **No push**
- **No deploy**

Awaiting your visual approval.
