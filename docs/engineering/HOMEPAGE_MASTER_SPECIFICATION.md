# ROVEXO Homepage Master Engineering Specification

**Module 1 — Homepage Engineering Specification**  
**Document type:** Engineering specification (implementation forbidden under this module)  
**Version:** 1.0  
**Status:** Draft — awaiting engineering review  
**Parent authority:** `docs/engineering-bible/ROVEXO_ENGINEERING_BIBLE.md` (Module 0)

---

## Document control

| Field | Value |
|-------|-------|
| **Title** | ROVEXO Homepage Master Engineering Specification |
| **Version** | 1.0 |
| **Module** | 1 — Homepage |
| **Owner** | ROVEXO Platform Engineering |
| **Location** | `docs/engineering/HOMEPAGE_MASTER_SPECIFICATION.md` |
| **Authority** | **Only** source of truth for Homepage implementation |
| **Implementation status** | Not authorized by this document — spec only |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-06 | Platform Engineering | Initial Homepage Master Specification. Defines complete layout, component behaviour, themes, responsive matrix, QA, regression, screenshots, acceptance, and freeze rules. |

### Canonical implementation map (reference — do not create duplicates)

| Layer | Canonical path |
|-------|----------------|
| Route | `app/page.tsx` |
| Page component | `components/home/RovexoHomePage.tsx` |
| Shell | `components/beta/BetaAppShell.tsx` + `components/home/HomePageShell.tsx` |
| Header | `components/Header.tsx` (`variant="homepage"`) |
| Search trigger | `components/header/HeaderSearchBar.tsx` |
| Categories | `components/home/RovexoCategoryRail.tsx` |
| Showcase | `components/home/RovexoShowcaseSection.tsx` |
| Feed | `components/home/RovexoAllListings.tsx` |
| Listing card | `components/ui/ListingCard.tsx` |
| Card config | `components/home/constants.ts` → `HOMEPAGE_LISTING_CARD_PROPS` |
| Homepage CSS | `styles/rovexo-homepage.css` |
| Card grid lock | `styles/rovexo/home-listing-grid-lock.css` |
| Category registry | `lib/home/category-premium-library.ts` → `ROVEXO_HOME_CATEGORY_RAIL` |
| Feed API | `GET /api/homepage/feed?page={n}` |
| Demo fallback | `lib/homepage/demo-data.ts` (certification only) |

### Relationship to Engineering Bible

- Module 0 defines platform-wide standards.
- Module 1 (this document) defines Homepage-specific requirements.
- Where Module 1 is more specific than Module 0 §9–10, **Module 1 wins for Homepage**.
- No Homepage work may proceed without compliance with both documents.

---

## Table of contents

1. [Homepage Philosophy](#1-homepage-philosophy)
2. [Layout Structure](#2-layout-structure)
3. [Header](#3-header)
4. [Search Bar](#4-search-bar)
5. [Category Navigation](#5-category-navigation)
6. [Bring Your Item](#6-bring-your-item)
7. [Showcase](#7-showcase)
8. [Listing Cards](#8-listing-cards)
9. [Homepage Feed](#9-homepage-feed)
10. [Bottom Navigation](#10-bottom-navigation)
11. [White Theme](#11-white-theme)
12. [Black Theme](#12-black-theme)
13. [Responsive](#13-responsive)
14. [Accessibility](#14-accessibility)
15. [Performance](#15-performance)
16. [QA Checklist](#16-qa-checklist)
17. [Regression Checklist](#17-regression-checklist)
18. [Screenshot Checklist](#18-screenshot-checklist)
19. [Acceptance Criteria](#19-acceptance-criteria)
20. [Freeze Rules](#20-freeze-rules)

---

## 1. Homepage Philosophy

### 1.1 Purpose

The ROVEXO Homepage is the **primary discovery surface** of the marketplace. It must:

- Surface live marketplace inventory in one unified feed.
- Highlight verified business sellers via Showcase rails.
- Enable instant search, category browse, and navigation to buy/sell/account flows.
- Communicate trust (verified business, ratings, views) without visual clutter.
- Load fast on mobile networks and feel premium on all devices.

The Homepage is **not** a marketing landing page, admin preview, or experimental UI sandbox.

### 1.2 Goals

| # | Goal | Measurable outcome |
|---|------|-------------------|
| G1 | Discovery | User can reach any listing within 2 taps from homepage load |
| G2 | Trust | Business verification and ratings visible on cards and showcase headers |
| G3 | Speed | LCP < 2.5s on 4G reference device |
| G4 | Clarity | Zero duplicate navigation paths in header + bottom nav for same action |
| G5 | Consistency | One listing card component, one showcase layout, one category rail |
| G6 | Conversion | Sell CTA always reachable via bottom nav FAB |

### 1.3 UX Principles

1. **Mobile first** — Design at 390×844 px; desktop is an enhancement, not a separate product.
2. **Performance first** — Skeletons, lazy images, virtualized feed window, no layout shift.
3. **Minimal UI** — No hero banners, no duplicate CTAs, no buyer protection on cards, no photo count on cards.
4. **Premium design** — Generous radius, soft shadows, purple price accent, refined typography.
5. **Simple navigation** — Header: logo + search + messages + notifications + account. Bottom nav: home, search, sell, saved, account.

### 1.4 Prohibited on Homepage

| Prohibited | Reason |
|------------|--------|
| Separate buyer/seller account CTAs | Unified account model |
| Buyer Protection on listing cards | Clutter; protection applies at checkout |
| Category icons in rail | Text-only capsules per product vision |
| Multiple showcase layouts | One `RovexoShowcaseSection` |
| Forked listing card components | One `ListingCard` with homepage props |
| Header “Bring Your Item” CTA | Clutters compact header; BYI is optional module (§6) |
| Hardcoded colours outside tokens | Theme Engine compliance |

---

## 2. Layout Structure

### 2.1 Page hierarchy (top to bottom)

```
┌─────────────────────────────────────────────┐
│  APP SHELL: BetaAppShell                    │
│  class: rovexo-page-home                    │
│  bottomNavTab: "home"                       │
├─────────────────────────────────────────────┤
│  HEADER (sticky)                            │
│  Header variant="homepage"                  │
│  Logo | Search | Messages | Notifications   │
│       | Account                             │
├─────────────────────────────────────────────┤
│  MAIN: home-v1-main                         │
│  padding-inline: 16px                       │
│                                             │
│  ┌─ SECTION 1: Categories ─────────────┐  │
│  │  RovexoCategoryRail                   │  │
│  │  horizontal text capsules             │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ SECTION 2: Bring Your Item (OPTIONAL)─┐ │
│  │  OFF by default — §6                    │ │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ SECTION 3: Showcase ────────────────┐  │
│  │  RovexoShowcaseRails (0..N sellers)   │  │
│  │  each: header + horizontal card rail  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ SECTION 4: All Listings Feed ────────┐  │
│  │  RovexoAllListings                    │  │
│  │  2-column grid, infinite scroll       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  padding-bottom: 84px + 20px + safe-area    │
├─────────────────────────────────────────────┤
│  BOTTOM NAV (fixed, mobile/tablet only)     │
│  BetaAppShell → BottomNavigation            │
│  Home | Search | Sell FAB | Saved | Account │
└─────────────────────────────────────────────┘
```

### 2.2 Section order (mandatory)

| Order | Section | Component | Conditional |
|-------|---------|-----------|-------------|
| 0 | Header | `Header` | Hidden only if Homepage Manager disables header |
| 1 | Categories | `RovexoCategoryRail` | Always |
| 2 | Bring Your Item | Homepage Manager module | **Default: OFF** |
| 3 | Showcase | `RovexoShowcaseRails` | When `showcaseSections.length > 0` |
| 4 | All Listings | `RovexoAllListings` | Always |
| — | Bottom navigation | `BottomNavigation` | Mobile/tablet; hidden ≥1024px |

### 2.3 Spacing between sections

| Between | Gap |
|---------|-----|
| Header → Categories | 0 (categories `margin-top: 0`) |
| Categories → Showcase | `20px` (`--rovexo-space-20`) via showcase stack margin |
| Showcase → Feed | `24px` max between showcase sections; feed `margin-top: 0` |
| Feed internal rows | `20px` row gap (`--rx-home-grid-gap-y`) |
| Feed → bottom nav | `84px + 20px + env(safe-area-inset-bottom)` padding on `home-v1-main` |

### 2.4 Content width

| Viewport | Main padding | Effective content width |
|----------|--------------|-------------------------|
| 390px reference | 16px each side | 358px |
| Tablet | 16px each side | viewport − 32px |
| Desktop | 16px each side; header inner max 1440px | centered column |

### 2.5 Overflow rules

- `overflow-x: clip` on page shell — no horizontal page scroll.
- Horizontal scroll permitted **only** inside category scroller, showcase rails, and legacy listing marquees.
- Vertical scroll is the primary page scroll axis.

---

## 3. Header

### 3.1 Role

Compact persistent chrome for discovery and account access. On homepage, the header contains **exactly five elements**: Logo, Search, Messages, Notifications, Account.

### 3.2 Logo

| Property | Value |
|----------|-------|
| Component | `RovexoHeaderMark` |
| Link target | `/` |
| `aria-label` | `"ROVEXO Home"` |
| Size (homepage compact) | 40×40px mark (46px asset scaled down) |
| Corner radius | 14px on mark asset |
| Position | Far left of header row |
| Business icon | **Not shown** on homepage (`compact` mode on `HeaderActions`) |

### 3.3 Search

- Occupies **flexible centre** of header row (`flex: 1 1 auto; min-width: 0`).
- See [§4 Search Bar](#4-search-bar).

### 3.4 Messages

| Property | Value |
|----------|-------|
| Component | `HeaderIconLink` |
| Route | `/messages` |
| Icon | `RovexoIcons.chat.messages` |
| `aria-label` | `"Messages"` |
| Badge | Unread count when > 0 |
| Touch target | 44×44px minimum |

### 3.5 Notifications

| Property | Value |
|----------|-------|
| Component | `HeaderIconLink` |
| Route | `/notifications` |
| Icon | `RovexoIcons.notifications.bell` |
| `aria-label` | `"Notifications"` |
| Badge | Unread count when > 0 |
| Touch target | 44×44px minimum |

### 3.6 Account

| Property | Value |
|----------|-------|
| Component | `HeaderProfileLink` |
| Route | `/account` (via profile link) |
| Display | User avatar or fallback initial |
| Touch target | 44×44px |
| Border | 1px `rgb(15 23 42 / 0.08)` light; `rgb(255 255 255 / 0.12)` dark |

### 3.7 Spacing

| Element | Value |
|---------|-------|
| Row gap (mobile) | 8px |
| Row gap (≥640px) | 12px |
| Row gap (≥1024px) | 14px |
| Actions gap | 6px mobile; 8px ≥640px |
| Inner horizontal padding | `var(--ds-space-4)` (16px) |
| Row min-height | 48px mobile; 50px ≥640px; 52px ≥1024px |

### 3.8 Behaviour

| Behaviour | Rule |
|-----------|------|
| Sticky | `position: sticky; top: 0; z-index: 100` |
| Scroll hide (mobile) | When `MobileHeaderScrollContext` active: translate `-100%` + opacity 0 on scroll down; restore on scroll up |
| Transition | 220ms ease-in-out (transform + opacity) |
| Homepage variant | `data-header-layout="homepage"` |
| No Bring Your Item CTA | `HeaderBringYourItemCta` must not render on homepage |

### 3.9 Responsive

| Breakpoint | Behaviour |
|------------|-----------|
| <1024px | Full compact row; scroll-hide enabled when context provided |
| ≥1024px | Same element set; scroll-hide disabled on large screens |

### 3.10 Safe area

| Edge | Rule |
|------|------|
| Top | `padding-top: env(safe-area-inset-top)` on `.rx-header-premium` |
| Notch devices | Search row sits below notch inset; no double padding |

### 3.11 Touch targets

- All icon buttons: **minimum 44×44px**.
- Profile link: **44×44px** explicit min width/height.

### 3.12 Animations

| Interaction | Animation |
|-------------|-----------|
| Icon hover (desktop) | `scale(1.04)` 150ms |
| Icon active | `scale(0.98)` |
| Reduced motion | All transforms disabled |

### 3.13 Loading

- Badges populate from `useHeaderBadges` after hydration; initial SSR props may show `0`.
- No skeleton for header — render immediately with zero badges.

### 3.14 Accessibility

- `role="group"` + `aria-label="Quick links"` on actions cluster.
- Each icon link has visible `aria-label`.
- Focus ring: 2px `var(--ds-color-primary)` outline.

### 3.15 Performance

- Header is client component — must not block LCP (below fold content is LCP candidate, not header).
- Badge fetch deferred; no blocking API in header render path.

---

## 4. Search Bar

### 4.1 Role

Search bar is a **button that opens the search overlay** — not an inline typeahead field in the header.

### 4.2 Dimensions

| Property | Mobile | ≥640px | ≥1024px |
|----------|--------|--------|---------|
| Height | 48px | 50px | 52px |
| Min-height | 48px | 50px | 52px |
| Width | 100% of flex slot | same | same |
| Border radius | 9999px (full pill) | same | same |
| Horizontal padding | 12px (`--ds-space-3`) | same | same |

### 4.3 Visual

| Property | Light | Dark |
|----------|-------|------|
| Background | `#ffffff` | `#1a1a1a` |
| Border | `1px solid rgb(15 23 42 / 0.06)` | `1px solid rgb(255 255 255 / 0.08)` |
| Shadow | `0 1px 10px rgb(15 23 42 / 0.05)` | `0 2px 14px rgb(0 0 0 / 0.28)` |
| Placeholder colour | `#64748b` | `rgb(148 163 184)` |
| Icon size | 24×24px | same |
| Icon colour | `var(--ds-color-primary)` | same |

### 4.4 Placeholder text

- Default: **`"Search ROVEXO..."`**
- Must truncate with ellipsis if container too narrow — never wrap.
- Font: `var(--ds-font-body-size)` (0.9375rem), weight 500.

### 4.5 Behaviour

| Action | Result |
|--------|--------|
| Tap / click | `searchOverlay.open()` via `useSearchOverlayOptional()` |
| Keyboard Enter on focused button | Opens overlay |
| Homepage bottom nav Search tap | Same overlay when `pathname === "/"` (prevent navigation) |

### 4.6 Search suggestions

- Rendered **inside search overlay**, not in header bar.
- Overlay owns: recent searches, trending, category shortcuts, live results.
- Header bar shows **no dropdown**.

### 4.7 Loading

- Header search button has no loading state.
- Overlay shows skeleton results while fetching.

### 4.8 Keyboard behaviour

| Platform | Rule |
|----------|------|
| iOS | Button is focusable; overlay provides `input` with autofocus |
| Android | Same |
| Desktop | Tab to search button; Enter opens overlay; overlay traps focus |

### 4.9 Android specifics

- No zoom on focus (no native input in header).
- Tap highlight disabled on parent chrome.

### 4.10 iPhone specifics

- Safe area: search bar vertically centred in header row below notch inset.
- `-webkit-tap-highlight-color: transparent` on interactive chrome.

### 4.11 Desktop

- Hover: border darkens slightly; shadow increases.
- Focus-visible: `0 0 0 3px rgb(147 51 234 / 0.1)` ring.

### 4.12 Performance

- Zero network calls from header search render.
- Overlay code-split; not loaded in critical path unless opened.

---

## 5. Category Navigation

### 5.1 Role

Fast horizontal browse of top-level marketplace categories. **Text only — no icons.**

### 5.2 Structure

```
<section aria-label="Categories" class="home-v1-categories">
  <div class="home-v1-category-scroller premium-infinite-scroller">
    <div class="home-v1-category-track">
      <div class="home-v1-category-track__set"> …capsules… </div>
      <!-- duplicate set for infinite loop; copy aria-hidden="true" -->
    </div>
  </div>
</section>
```

### 5.3 Category list source

- **SSOT:** `ROVEXO_HOME_CATEGORY_RAIL` in `lib/home/category-premium-library.ts`
- Order is fixed in registry; do not hardcode in component.
- First four visible on 390px: Vehicles, Property, Phones, Computers (then scroll for remainder).

### 5.4 Capsule specification

| Property | Value |
|----------|-------|
| Class | `home-v1-category-capsule` |
| Min height | 36px |
| Padding | 8px 16px |
| Border radius | 999px |
| Border | `1px solid` token border at 88% mix |
| Background | `var(--ds-color-surface)` |
| Shadow | `var(--ds-shadow-soft)` |
| Font size | 14px |
| Font weight | 600 |
| Line height | 1.1 |
| Letter spacing | -0.01em |
| Colour | `var(--ds-color-text-primary)` |
| Gap between capsules | 10px |

### 5.5 Icons — PROHIBITED

| Rule | Enforcement |
|------|-------------|
| No category icons on homepage | `.home-v1-category-tile`, `__icon`, `__slot` display `none` |
| No `<img>` inside capsules | CSS + component uses text-only `RovexoCategoryCard` |

### 5.6 Selection / active state

- Categories are **links**, not tabs — no persistent selected state on homepage.
- Destination: `/search?category={slug}` (from registry `href` or default).
- Active press: `transform: scale(0.98)` on `:active`.

### 5.7 Scroll physics

| Property | Value |
|----------|-------|
| Overflow | `overflow-x: auto; overflow-y: hidden` |
| Scroll snap | `scroll-snap-type: x proximity` |
| Snap align | `scroll-snap-align: start` on each capsule |
| Momentum (iOS) | `-webkit-overflow-scrolling: touch` |
| Overscroll | `overscroll-behavior-x: contain` |
| Scrollbar | Hidden (`scrollbar-width: none`) |
| Touch action | `pan-y` — vertical page scroll wins |
| Infinite loop | `useInfiniteCarousel` duplicates track sets on mobile |
| Auto-scroll | Speed 0.5px/frame when idle; pauses on interaction; resumes after 320ms |

### 5.8 Pointer drag (desktop)

- `cursor: grab` / `grabbing` on scroller.
- Drag suppresses accidental link navigation via `shouldSuppressClick()`.

### 5.9 Accessibility

- `aria-label="Categories"` on section.
- Duplicate track sets: `aria-hidden="true"` on copies beyond first.
- Each capsule is a focusable link with visible focus ring.
- Category name is link text (no icon-only links).

### 5.10 Responsive

| Viewport | Behaviour |
|----------|-------------|
| Mobile | Infinite carousel + momentum |
| Desktop | Horizontal scroll without auto-scroll (mobileOnly hook) |

---

## 6. Bring Your Item

### 6.1 Purpose

**Bring Your Item (BYI)** is a seller migration workflow allowing users to import listings from external marketplaces (eBay, Vinted, etc.). It is **not** a core consumer discovery feature.

### 6.2 Homepage position — DEFAULT OFF

| Rule | Detail |
|------|--------|
| Certified homepage v1.0 | BYI section **must not** appear in `RovexoHomePage` main column |
| Header CTA | `HeaderBringYourItemCta` **must not** appear on homepage header |
| Rationale | Minimal UI — BYI is seller tooling, not buyer discovery |

### 6.3 When enabled (Homepage Manager only)

If Super Admin enables BYI via Homepage Manager, it inserts **between Categories (§5) and Showcase (§7)**.

| Property | Value |
|----------|-------|
| Max height | 120px mobile |
| Layout | Single row: headline + CTA button |
| Background | `var(--ds-color-surface-muted)` |
| Border radius | `var(--ds-radius-lg)` (20px) |
| CTA label | `"Import listings"` |
| CTA destination | `/seller/migration` (canonical wizard) |
| CTA colour | `var(--ds-color-primary)` |

### 6.4 Behaviour

- Renders only for authenticated users with seller capability.
- Guest users: section hidden entirely (not disabled grey box).
- Tap CTA → navigate to migration wizard; no modal.

### 6.5 Performance

- Lazy-load BYI module chunk only when Homepage Manager flag is true.
- No third-party API calls on homepage render.

### 6.6 Responsive

| Viewport | Layout |
|----------|--------|
| Mobile | Stacked: title above full-width CTA |
| Desktop | Row: title left, CTA right |

---

## 7. Showcase

### 7.1 Role

Promote **verified business sellers** with a horizontal listing rail per seller. Exactly **one** showcase layout platform-wide.

### 7.2 Component

- **SSOT:** `RovexoShowcaseSection` — one section per seller.
- Wrapper: `RovexoShowcaseRails` maps `showcaseSections[]`.

### 7.3 Section structure

```
<section class="home-v1-showcase-section" aria-labelledby="showcase-{sellerId}">
  <header class="home-v1-showcase-section__header">
    <Link class="home-v1-showcase-section__seller" href={profileHref}>
      Avatar (40px)
      Meta: Name | Rating | BusinessBadge[]
    </Link>
    <FollowSellerButton compact />
  </header>
  <div class="home-v1-showcase-section__rail" role="list">
    <div role="listitem" class="home-v1-showcase-section__card"> ListingCard × N </div>
  </div>
</section>
```

### 7.4 Seller avatar

| Property | Value |
|----------|-------|
| Size | 40×40px |
| Shape | Circle (`border-radius: 999px`) |
| Fallback | First letter of seller name, primary colour |
| Image | `next/image` fill, `sizes="40px"`, `object-cover` |

### 7.5 Seller name

| Property | Value |
|----------|-------|
| Font size | 15px |
| Font weight | 700 |
| Colour (light) | `#111111` |
| Colour (dark) | `var(--ds-color-text-primary)` |
| Overflow | Ellipsis single line |

### 7.6 Business badge

- Render when `sellerVerified && sellerTier === "business"`.
- Component: `BusinessBadge` compact.
- Kinds from `resolveBusinessBadgeKinds()`.
- Label example: `"Verified Business"`.

### 7.7 Follow button

| Property | Value |
|----------|-------|
| Component | `FollowSellerButton` `compact` |
| Position | Right of header row |
| States | Follow / Following / Loading |
| Auth required | Prompt sign-in if guest |

### 7.8 Rating line

| Condition | Display |
|-----------|---------|
| `rating > 0` | `"{rating.toFixed(1)} ({reviewCount})"` |
| `rating <= 0` | `"New seller"` |
| Font | 12px, colour `#666666` light / `text-secondary` dark |

### 7.9 Horizontal listing carousel

| Property | Value |
|----------|-------|
| Container | `.home-v1-showcase-section__rail` |
| Scroll | `overflow-x: auto`, snap `mandatory` |
| Gap | 12px |
| Card width | `var(--rx-home-listing-card-w)` = half grid column |
| Card badge | `statusBadgeLabel="Showcase"` (amber featured tone) |
| Min listings | 1 to render section |
| Max listings per seller | 12 (server-side cap) |

### 7.10 Seller profile navigation

| Action | Destination |
|--------|-------------|
| Tap seller header (avatar + name) | `section.profileHref` (seller profile / store) |
| Profile shows | All seller listings, bio, verification |
| Must not | Open unrelated search page |

### 7.11 Responsive

| Viewport | Behaviour |
|----------|-------------|
| Mobile | Full-width rail; card width = grid column width |
| Tablet | Same; wider cards proportional to content width |
| Desktop | Rail scrolls horizontally; cards same locked height |

### 7.12 Performance

- Showcase data fetched server-side in `app/page.tsx`.
- Images lazy-loaded except first card per rail.
- Empty `showcaseSections` → entire showcase stack omitted (no empty placeholder).

### 7.13 Loading

- SSR renders showcase with data or omits section.
- No skeleton for showcase on initial paint if data present.

### 7.14 Empty state

- **No showcase sections:** `RovexoShowcaseRails` renders `null` — no heading, no placeholder.
- **Seller with zero listings:** Section excluded server-side.

### 7.15 Stack spacing

- Gap between multiple showcase sections: `24px` (`--rovexo-space-24`).
- Margin block: `20px` top and bottom on stack.

---

## 8. Listing Cards

> **Most important section.** All homepage listing surfaces (grid feed + showcase rails) use the **same** `ListingCard` component with `HOMEPAGE_LISTING_CARD_PROPS`.

### 8.1 Configuration (mandatory props)

```typescript
HOMEPAGE_LISTING_CARD_PROPS = {
  surface: "homepage",
  showSeller: true,
  showRating: true,
  showViews: true,           // REQUIRED — must be true
  showCondition: false,      // REQUIRED — must be false
  showBuyerProtection: false, // REQUIRED — must be false
  showPhotoCount: false,
  conditionPlacement: "meta",
  buyerProtectionPlacement: "meta",
}
```

### 8.2 Buyer Protection — PROHIBITED

| Rule | Detail |
|------|--------|
| `showBuyerProtection` | **Must be `false`** on homepage |
| `.protection` element | Must not render |
| `.protectionMeta` element | Must not render |
| QA check | Zero occurrences of "Buyer Protection" text in homepage listing cards |

### 8.3 Views — REQUIRED

| Rule | Detail |
|------|--------|
| `showViews` | **Must be `true`** |
| Position | Bottom-right of card body, `.metaRow` → `.metaRight` → `.views` |
| Icon | `RovexoIcons.actions.eye`, 14×14px |
| Text | `formatViews(product.views)` — compact (e.g. `1.2k`) |
| Font | 13px, weight 500, colour `#9ca3af` light / `text-secondary` dark |
| Minimum display | Show `0` when views is zero — never hide row |

### 8.4 Card dimensions (390px reference — LOCKED)

| Property | Value |
|----------|-------|
| Viewport | 390px |
| Content width | 358px (390 − 32 padding) |
| Grid columns | 2 |
| Column gap | 12px (`--rx-home-grid-gap-x`) |
| Row gap | 20px (`--rx-home-grid-gap-y`) |
| **Card width** | **173px** (`--rx-home-listing-card-w`) |
| **Card height** | **300px** (`--rx-home-listing-card-h`) |
| Media height | 190px (`--rx-home-listing-card-media-h`) |
| Body height | 110px (`--rx-home-listing-card-body-h`) |
| Card radius | 20px (`--rx-home-listing-card-radius`) |

### 8.5 Image

| Property | Value |
|----------|-------|
| Aspect in locked layout | Fixed 190px height (not ratio-driven on homepage) |
| `object-fit` | `cover` |
| `object-position` | `center` |
| Background placeholder | `#f3f4f6` light / `#1f1f1f` dark |
| Crop rule | Image must fill frame — no letterboxing |
| Prohibited | Cropped price or truncated currency symbol |

### 8.6 Border radius

| Region | Radius |
|--------|--------|
| Card shell | 20px all corners |
| Image top | 20px top-left, top-right; 0 bottom |
| Body | 0 top; inherits card bottom radius |

### 8.7 Shadow

| Theme | Value |
|-------|-------|
| Light | `0 8px 24px rgba(0, 0, 0, 0.06)` |
| Dark | `var(--ds-shadow-medium)` |
| Hover (desktop) | `0 14px 34px rgb(15 23 42 / 0.12)` + `translateY(-3px)` |

### 8.8 Border

- Light: `1px solid rgba(0, 0, 0, 0.05)`
- Dark: `var(--ds-color-border)`

### 8.9 Favourite button

| Property | Value |
|----------|-------|
| Position | Top-right of image: 10px from top and right |
| Size | 42×42px (homepage lock) |
| Shape | Circle |
| Background | White opaque disc + 2px border |
| Icon | Heart 24×24px |
| Active colour | `#ef4444` |
| z-index | 3 (above image) |
| `aria-pressed` | Toggles with saved state |

### 8.10 Status badge (Showcase / NEW / Boost)

| Property | Value |
|----------|-------|
| Position | Top-left of image: 10px offset |
| Height | 26px (homepage lock) |
| Padding | 6px 12px |
| Font | 10px uppercase weight 700 |
| Showcase label | `"Showcase"` — tone `featured` (amber `#f59e0b`) |
| NEW label | Green `#10b981` — only when product flagged new AND `showStatusBadge` default |

### 8.11 Business badge (on card)

- Position: inline in seller row, right of seller handle.
- Shown when `shouldShowBusinessBadge(product)` true.
- Component: `BusinessBadge compact`.
- Max width: 5.5rem with ellipsis.

### 8.12 Showcase badge

- On showcase rails: always `statusBadgeLabel="Showcase"`.
- On main feed: only when product is featured/showcase promoted.

### 8.13 Price

| Property | Value |
|----------|-------|
| Position | Below title in `.priceRow` |
| Font size | 18px (homepage lock) |
| Font weight | 800 |
| Line height | 18px |
| Colour | `var(--ds-color-primary)` — **never truncated** |
| Rule | Full price always visible including `£` and decimals |
| Prohibited | Ellipsis on price text |

### 8.14 Title

| Property | Value |
|----------|-------|
| Position | Top of body stack |
| Font size | 16px |
| Font weight | 700 |
| Line height | 20px |
| Max lines | 1 (ellipsis) on homepage lock |
| Colour | `#111827` light / `text-primary` dark |

### 8.15 Seller row

| Property | Value |
|----------|-------|
| Avatar | 20×20px circle |
| Name | `@username` or seller name, 12px, ellipsis |
| Rating | Star icon + formatted rating when `showRating: true` |

### 8.16 Meta row layout

```
[ optional condition — HIDDEN on homepage ]
                    [ views + eye icon ]  ← REQUIRED right-aligned
```

### 8.17 Typography summary

| Element | Size | Weight |
|---------|------|--------|
| Title | 16px | 700 |
| Price | 18px | 800 |
| Seller | 12px | 500 |
| Views | 13px | 500 |
| Status badge | 10px | 700 |

### 8.18 Spacing (body)

- Body padding: `10px 12px`
- Body stack gap: 0px (tight)
- Meta row: flex space-between

### 8.19 Loading / skeleton

- Feed loading: no visible spinner (`home-v1-all-listings__loading { display: none }`).
- Initial SSR: render cards from server data.
- Append load: silent infinite scroll — no card skeleton on page 2+.
- First paint with empty data + demo flag: inject demo products without layout shift beyond grid appearance.

### 8.20 Hover (desktop only)

```css
@media (hover: hover) and (pointer: fine) {
  card:hover → translateY(-3px) + elevated shadow
  favorite:hover → scale(1.06)
}
```

### 8.21 Touch (mobile)

- Card `:active` → `scale(0.985)`.
- Favourite tap → heart scale animation 200ms.
- No hover effects on touch devices.

### 8.22 Responsive card width

| Viewport | Card width formula |
|----------|-------------------|
| All | `--rx-home-listing-card-w: calc((100% - gap) / 2)` |
| Rail | Fixed to same `card-w` — must not compress below price readability |

### 8.23 Lazy loading

| Image | Rule |
|-------|------|
| First 4 grid images | `priority` optional |
| Remaining | `loading="lazy"` |
| `sizes` | `"(max-width: 768px) 50vw, 200px"` default |

### 8.24 Image optimisation

- Format: AVIF/WebP via Next.js Image optimizer.
- No raw `<img>` tags in listing cards.
- `normalize` remote URLs via existing media helpers.

### 8.25 Performance

- `content-visibility: auto` on grid cards.
- `contain-intrinsic-size: auto 300px`.
- Impression tracking for promoted listings only when `trackImpressions` true (homepage default on).

### 8.26 Acceptance rules (listing cards)

| # | Rule | Pass condition |
|---|------|----------------|
| LC-1 | Buyer Protection absent | No shield icon or "Buyer Protection" copy on card |
| LC-2 | Views present | Every card shows eye icon + count |
| LC-3 | Price complete | No price ellipsis at 390px |
| LC-4 | Height locked | All grid cards 300px tall |
| LC-5 | One component | Only `ListingCard` with `data-listing-card="rovexo"` |
| LC-6 | Favourite works | Heart toggles watchlist without navigation |
| LC-7 | Business badge | Shows for verified business sellers |
| LC-8 | Showcase badge | Shows on showcase rail cards |
| LC-9 | Dark theme | Card readable with correct token colours |
| LC-10 | Tap target | Favourite ≥42px |

---

## 9. Homepage Feed

### 9.1 Component

- **SSOT:** `RovexoAllListings`
- Grid: `RovexoAllListingsGrid` with class `home-v1-listing-grid-lock`

### 9.2 Feed behaviour

| Property | Value |
|----------|-------|
| Layout | 2-column CSS grid |
| Section id | `home-v1-all-listings` |
| `aria-label` | `"Marketplace listings"` |
| Sort order | Server-defined (promoted + organic unified) |
| Initial data | SSR from `fetchHomepageFeed(1)` |
| Demo resolve | `resolveHomepageFeedItems()` |

### 9.3 Loading

| Phase | Behaviour |
|-------|-----------|
| SSR | Render first page items |
| Client hydration | Same items — no flash |
| Load more | Silent fetch; no spinner visible |
| Error | Stop pagination; demo fallback if `ROVEXO_HOMEPAGE_DEMO` |

### 9.4 Infinite scroll

| Property | Value |
|----------|-------|
| Trigger | `IntersectionObserver` on sentinel |
| Sentinel position | 75% through current item list |
| `rootMargin` | `320px 0px` |
| Threshold | `0` |
| Fetch | `GET /api/homepage/feed?page={n+1}` |
| Merge | Dedupe by `product.id` |
| Demo mode | Cycle `HOMEPAGE_DEMO_PRODUCTS` with synthetic ids |

### 9.5 Pagination

- No page numbers UI.
- No “Load more” button — scroll only.
- `hasMore: false` stops observer triggers.

### 9.6 Caching

| Layer | Policy |
|-------|--------|
| Page route | `revalidate = 60` (ISR) |
| Feed API client fetch | `cache: "no-store"` |
| Images | CDN cache via Next image |

### 9.7 Virtualization

- `useVirtualizedFeedWindow` tracks window for performance metrics.
- All items remain in DOM — virtualization is observability hook, not aggressive unmount in v1.0.

### 9.8 Column count

- `useMarketplaceFeedColumns()` — 2 columns on mobile/tablet.
- Desktop: 2 columns within content width (not 4-column on homepage v1.0).

### 9.9 Performance

- Sentinel is 1px height, `pointer-events: none`.
- Load more debounced by `loading` flag — no parallel fetches.

---

## 10. Bottom Navigation

### 10.1 Role

Primary mobile navigation. Rendered by `BetaAppShell`, **not** `HomePageShell`.

### 10.2 Layout

```
┌──────────────────────────────────────────┐
│  Home   Search   [SELL FAB]   Saved  Account │
└──────────────────────────────────────────┘
```

| Tab | ID | Route | Icon |
|-----|-----|-------|------|
| Home | `home` | `/` | `home` |
| Search | `search` | `/search` (overlay on `/`) | `search` |
| Sell | `sell` | `/sell` | Purple FAB `+` |
| Saved | `saved` | `/saved` | `saved` |
| Account | `account` | `/account` | `account` or avatar |

### 10.3 Sell FAB

| Property | Value |
|----------|-------|
| Size | 64×64px outer tap area |
| Shape | Circle |
| Background | `var(--ds-color-primary)` |
| Icon | White `+` stroke 2.75px |
| Label below | `"Sell"` 11px weight 600 |
| Elevated | `margin-bottom: 16px` above bar baseline |

### 10.4 Touch targets

| Element | Min size |
|---------|----------|
| Standard tab | 44×44px (`rx-bottom-nav-item`) |
| Icon wrap | 40×40px |
| Sell FAB | 64×64px |

### 10.5 Labels

- Font: 11px, weight 600.
- Visible on all tabs including Sell.
- Active tab: `aria-current="page"`.

### 10.6 Active state

| Property | Value |
|----------|-------|
| Colour | `var(--ds-color-primary)` |
| Icon scale | `1.08` when active |
| Account avatar | `ring-2 ring-primary` when active |

### 10.7 Animations

| Behaviour | Animation |
|-----------|-------------|
| Scroll hide (mobile) | `translateY(120px)` + opacity 0, 250ms |
| Icon hover | `translateY(-1px)` |
| Reduced motion | Transforms disabled |

### 10.8 Responsive

| Viewport | Behaviour |
|----------|-------------|
| <1024px | Fixed bottom, full width |
| ≥1024px | **Hidden** (`display: none`) |

### 10.9 Safe area

- `padding-bottom: calc(34px + env(safe-area-inset-bottom))` on shell.
- Bar height total: 72px + safe area.

### 10.10 Z-index

- `z-index: 50` — below header (100), above feed content.

---

## 11. White Theme

### 11.1 Activation

- `data-theme="light"` on `<html>`
- `color-scheme: light`

### 11.2 Page

| Token | Value |
|-------|-------|
| Background | `#ffffff` (`--ds-color-background`) |
| Text | `#0f172a` (`--ds-color-text-primary`) |
| Muted text | `#64748b` |
| Primary accent | `#9333ea` |
| Page class | `rovexo-page-home` background `#ffffff` |

### 11.3 Header

- White / surface background.
- Icon colour: `text-primary` slate.
- Search pill: white background, subtle border shadow.

### 11.4 Categories

- Capsule surface: white.
- Border: token border 88% mix.

### 11.5 Cards

- Surface: `#ffffff`
- Border: `rgba(0, 0, 0, 0.05)`
- Title: `#111827`
- Price: `#9333ea`
- Views: `#9ca3af`

### 11.6 Bottom nav

- Background: `#ffffff`
- Border top: `#eeeeee`
- Inactive icons: `#666666`
- Active: primary purple

### 11.7 Shadows

- Soft elevation throughout — no harsh black drops.

---

## 12. Black Theme

### 12.1 Activation

- `data-theme="dark"` on `<html>`
- Storage: `localStorage.rovexo-theme = "dark"`

### 12.2 Page

| Token | Value |
|-------|-------|
| Background | `#0b1120` (`--ds-color-background`) |
| Surface | `#111827` |
| Text | `#f1f5f9` |
| Primary accent | `#a855f7` |

### 12.3 Header

- Dark surface icons with white/slate text.
- Search pill: `#1a1a1a` background.

### 12.4 Categories

- Capsule: surface mix 92% + 8% white.
- Border: token border 70% mix.

### 12.5 Cards

- Surface: `#141414` / `var(--ds-color-surface)`
- Border: `rgb(255 255 255 / 0.08)`
- Title: `#f9fafb`
- Price: `var(--ds-color-primary)` (`#a855f7`)
- Favourite disc: dark `rgb(24 24 24 / 0.92)` with light border

### 12.6 Bottom nav

- Dark shell matching surface elevated token.
- Active accent: primary purple light variant.

### 12.7 Contrast

- All text pairings must meet **WCAG AA 4.5:1** minimum.
- Purple on dark must use `#a855f7` not `#9333ea`.

---

## 13. Responsive

### 13.1 Device matrix

| Device | Viewport | Orientation | Priority |
|--------|----------|-------------|----------|
| Android | 412×915 | Portrait | P0 |
| Android | 915×412 | Landscape | P1 |
| iPhone | 390×844 | Portrait | P0 |
| iPhone | 844×390 | Landscape | P1 |
| Tablet | 768×1024 | Portrait | P0 |
| Tablet | 1024×768 | Landscape | P1 |
| Desktop | 1440×900 | Landscape | P0 |

### 13.2 Breakpoints

| Name | Min width | Homepage behaviour |
|------|-----------|-------------------|
| Mobile | 0 | 2-col grid, bottom nav, compact header |
| `sm` | 640px | Slightly taller search/header |
| `lg` | 1024px | Bottom nav hidden; extra header gap |

### 13.3 Android

- Chrome + WebView.
- `-webkit-tap-highlight-color: transparent`.
- Momentum scroll on rails.
- `100dvh` not required on homepage (natural scroll).

### 13.4 iPhone

- Safari + WebKit.
- Safe area insets mandatory.
- Bottom nav home indicator clearance: 34px + inset.
- Scroll-hide header/nav synchronised via `MobileHeaderScrollContext`.

### 13.5 Tablet

- Same 2-column feed — not 3 or 4 column in v1.0.
- Bottom nav visible (<1024px).
- More horizontal category visibility — no layout change.

### 13.6 Desktop

- Content centred; max inner width 1440px for header.
- No bottom nav.
- Hover states enabled.
- Feed remains 2-column within padded main.

### 13.7 Landscape

- Header and bottom nav remain visible.
- Horizontal rails gain visible items; no layout break.
- Sticky chrome must not overlap feed content.

---

## 14. Accessibility

### 14.1 Standard

**WCAG 2.1 Level AA** on all homepage surfaces.

### 14.2 Keyboard

| Key | Action |
|-----|--------|
| Tab | Move through header links, categories, cards, bottom nav |
| Enter | Activate focused link/button |
| Escape | Close search overlay |

### 14.3 Screen reader

| Element | Requirement |
|---------|-------------|
| Homepage main | `<main class="home-v1-main">` |
| Categories | `aria-label="Categories"` |
| Feed | `aria-label="Marketplace listings"` |
| Showcase | `aria-labelledby` → seller name id |
| Favourite | `aria-pressed` + add/remove label |
| Views | `aria-label="{n} views"` |
| Bottom nav | `aria-label="Main navigation"` |

### 14.4 Contrast

| Pair | Minimum ratio |
|------|---------------|
| Body text / background | 4.5:1 |
| Price / card surface | 4.5:1 |
| Placeholder / search bg | 4.5:1 |
| Badge text / badge bg | 4.5:1 |

### 14.5 Touch

- All targets ≥44×44px (favourite 42px minimum on homepage lock — **must be increased to 44px in implementation review**).
- Spacing between adjacent targets ≥8px.

### 14.6 Motion

- `prefers-reduced-motion: reduce` disables header hide, card hover, heart animation, category auto-scroll.

---

## 15. Performance

### 15.1 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** | < 2.5s | Largest listing image or showcase card |
| **CLS** | < 0.1 | No grid shift after load |
| **INP** | < 200ms | Favourite tap, category scroll |
| **TTFB** | < 800ms | SSR homepage document |

### 15.2 CLS prevention

- Locked card heights: 300px before images load.
- Explicit image container height: 190px.
- Bottom nav fixed — reserve padding on main.
- No web fonts causing FOUT beyond system stack.

### 15.3 LCP optimisation

- SSR first page listings.
- `priority` on first visible image optional.
- Preconnect Supabase CDN / image host.

### 15.4 Lazy loading

- Images below fold: `loading="lazy"`.
- Showcase rails: lazy except first item.
- Search overlay: dynamic import.

### 15.5 Image compression

- Next.js image optimizer quality default.
- Source images ≤ 200KB recommended per listing thumbnail.

### 15.6 Hydration

- `RovexoHomePage` is client component — minimise hydration mismatch.
- Feed initial state must match SSR props exactly.
- Badges (header) may hydrate upward from 0.

### 15.7 Render optimisation

- `memo()` on `RovexoHomePage`, `RovexoAllListings`, `RovexoShowcaseSection`.
- `content-visibility: auto` on feed cards.
- Throttle scroll handlers 16ms.

---

## 16. QA Checklist

### 16.1 Visual

- [ ] Header shows exactly: logo, search, messages, notifications, account
- [ ] No Bring Your Item in header on homepage
- [ ] Categories horizontal, text only, no icons visible
- [ ] Showcase sections match §7 layout
- [ ] Listing cards 300px height at 390px viewport
- [ ] Prices never truncated
- [ ] Views visible on every card
- [ ] Buyer Protection absent on every card
- [ ] White theme correct
- [ ] Black theme correct
- [ ] Bottom nav five items with purple Sell FAB

### 16.2 Functional

- [ ] Search opens overlay from header and bottom nav on `/`
- [ ] Category links navigate to correct search filter
- [ ] Showcase seller link opens profile
- [ ] Follow button works (auth / prompt)
- [ ] Favourite toggles without navigation
- [ ] Card tap opens `/listing/{slug}`
- [ ] Infinite scroll loads page 2
- [ ] No duplicate products in feed

### 16.3 Responsive

- [ ] Android portrait PASS
- [ ] iPhone portrait PASS
- [ ] Tablet portrait PASS
- [ ] Desktop 1440 PASS
- [ ] Landscape no overlap PASS

### 16.4 Accessibility

- [ ] axe scan 0 critical violations
- [ ] Keyboard navigation complete
- [ ] Screen reader announces landmarks
- [ ] Contrast AA PASS

### 16.5 Performance

- [ ] Lighthouse mobile LCP < 2.5s
- [ ] CLS < 0.1
- [ ] No console errors on load

### 16.6 Theme

- [ ] `verify-color-tokens.mjs` PASS
- [ ] `verify-theme-tokens.mjs` PASS
- [ ] No hardcoded blue accents in homepage CSS

---

## 17. Regression Checklist

These behaviours must **never break** after homepage certification:

| # | Regression | Verification |
|---|------------|--------------|
| R1 | Unified account — no buyer/seller split CTAs | Visual + copy audit |
| R2 | Single ListingCard component | Grep for duplicate card components |
| R3 | `HOMEPAGE_LISTING_CARD_PROPS` unchanged without spec bump | Unit test |
| R4 | Buyer Protection off on cards | Automated DOM check |
| R5 | Views on on cards | Automated DOM check |
| R6 | Category icons hidden | CSS + DOM check |
| R7 | Showcase `statusBadgeLabel="Showcase"` | Component test |
| R8 | Feed API contract `ProductsPage` | API integration test |
| R9 | Bottom nav hidden on sell/checkout routes | E2E |
| R10 | Header `variant="homepage"` on `/` | Route test |
| R11 | ISR `revalidate = 60` on homepage | Config test |
| R12 | Safe area padding on header and bottom nav | Visual device test |
| R13 | `data-theme` respected on all homepage surfaces | Theme toggle E2E |
| R14 | No horizontal page scroll | Playwright overflow check |
| R15 | Card lock dimensions 173×300 @ 390 | Pixel audit script |

---

## 18. Screenshot Checklist

### 18.1 Required captures before approval

| ID | Filename | Description | Viewport | Theme |
|----|----------|-------------|----------|-------|
| HP-01 | `homepage-white-mobile.png` | Full page top | 390×844 | light |
| HP-02 | `homepage-black-mobile.png` | Full page top | 390×844 | dark |
| HP-03 | `homepage-header.png` | Header crop | 390×844 | light |
| HP-04 | `homepage-search-overlay.png` | Search open | 390×844 | light |
| HP-05 | `homepage-categories.png` | Category rail | 390×844 | light |
| HP-06 | `homepage-showcase.png` | Showcase section | 390×844 | light |
| HP-07 | `homepage-listing-card.png` | Single card crop | 390×844 | light |
| HP-08 | `homepage-feed-grid.png` | 2×2 grid crop | 390×844 | light |
| HP-09 | `homepage-bottom-nav.png` | Bottom nav | 390×844 | light |
| HP-10 | `homepage-android.png` | Full page | 412×915 | light |
| HP-11 | `homepage-iphone.png` | Full page | 390×844 WebKit | light |
| HP-12 | `homepage-tablet.png` | Full page | 768×1024 | light |
| HP-13 | `homepage-desktop.png` | Full page | 1440×900 | light |
| HP-14 | `homepage-landscape.png` | Full page | 844×390 | light |
| HP-15 | `homepage-card-views.png` | Views close-up | 390×844 | light |
| HP-16 | `homepage-no-buyer-protection.png` | Card DOM proof | 390×844 | light |

### 18.2 Storage

- Path: `reports/module-1/homepage/screenshots/`
- Format: PNG full-page or crop as labelled
- Indexed in `reports/module-1/homepage/SCREENSHOT_REPORT.md`

---

## 19. Acceptance Criteria

Homepage Module 1 implementation is accepted **only when all criteria pass**:

| ID | Criterion | Pass/Fail rule |
|----|-----------|----------------|
| AC-01 | Document compliance | Implementation matches this spec §2–§15 |
| AC-02 | Engineering Bible compliance | No violation of Module 0 |
| AC-03 | Buyer Protection absent | 0 instances in homepage listing cards |
| AC-04 | Views present | 100% of cards show views count |
| AC-05 | Price integrity | 0 truncated prices at 390px |
| AC-06 | Card dimensions | 173×300px ±1px at reference viewport |
| AC-07 | Category text-only | 0 visible category icons |
| AC-08 | Header element count | Exactly 5 elements — no more, no less |
| AC-09 | BYI default off | No BYI in feed or header unless Manager flag |
| AC-10 | Showcase layout | One layout component only |
| AC-11 | Infinite scroll | Page 2 loads without user action |
| AC-12 | Themes | White + Black both PASS visual QA |
| AC-13 | Accessibility | 0 critical axe violations |
| AC-14 | LCP | < 2.5s mobile lab |
| AC-15 | CLS | < 0.1 mobile lab |
| AC-16 | Regression suite | R1–R15 all PASS |
| AC-17 | Screenshots | HP-01 through HP-16 captured |
| AC-18 | No backend changes | Zero schema/API/checkout diffs in homepage module |
| AC-19 | SSOT paths | Only canonical files modified |
| AC-20 | Human sign-off | Product owner visual approval recorded |

**Fail any single AC → homepage not certified.**

---

## 20. Freeze Rules

### 20.1 When frozen

After Module 1 passes AC-01 through AC-20 and receives human sign-off, the Homepage enters **FROZEN** state.

### 20.2 Frozen artifacts

| Artifact | Frozen |
|----------|--------|
| `RovexoHomePage.tsx` structure | Yes |
| Section order §2.2 | Yes |
| `HOMEPAGE_LISTING_CARD_PROPS` | Yes |
| `home-listing-grid-lock.css` dimensions | Yes |
| Header homepage variant | Yes |
| Category text-only rule | Yes |
| Buyer Protection off rule | Yes |
| Views on rule | Yes |

### 20.3 Permitted changes while frozen

| Change type | Allowed |
|-------------|---------|
| Bug fixes (broken navigation, crash, data not loading) | Yes |
| Security patches (XSS, auth leak) | Yes |
| Performance fixes (LCP/CLS regression) | Yes |
| Copy typo fix | Yes with QA note |

### 20.4 Prohibited while frozen

| Change type | Forbidden |
|-------------|-----------|
| Layout redesign | Yes |
| New homepage sections without spec version bump | Yes |
| Card dimension changes | Yes |
| Re-enabling Buyer Protection on cards | Yes |
| Removing Views from cards | Yes |
| Adding category icons | Yes |
| Database schema changes for homepage | Yes |
| API contract breaking changes | Yes |

### 20.5 Unfreeze process

1. Publish spec version ≥ 1.1 with written changelog.
2. Product owner approval.
3. Full regression §17 + screenshots §18 re-run.
4. Re-freeze with new version number.

---

## STOP

This document is **specification only**.

- ❌ Do not implement Homepage changes under Module 1 document creation
- ❌ Do not modify UI
- ❌ Do not generate React or CSS code
- ❌ Do not commit
- ❌ Do not push
- ❌ Do not deploy

**Awaiting engineering and product review.**

---

*End of ROVEXO Homepage Master Engineering Specification v1.0*
