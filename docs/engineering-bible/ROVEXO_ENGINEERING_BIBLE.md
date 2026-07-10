# ROVEXO Engineering Bible

**Module 0 — Foundation Pass**  
**Version:** 1.0  
**Status:** Draft — awaiting engineering review  
**Scope:** Permanent engineering standards and architecture only. This document does **not** redesign pages.

---

## Document control

| Field | Value |
|-------|-------|
| **Title** | ROVEXO Engineering Bible |
| **Version** | 1.0 |
| **Module** | 0 — Engineering Bible Initialization |
| **Owner** | ROVEXO Platform Engineering |
| **Location** | `docs/engineering-bible/ROVEXO_ENGINEERING_BIBLE.md` |
| **Authority** | Single source of truth for all future implementation |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-06 | Platform Engineering | Initial Engineering Bible — Foundation Pass. Establishes permanent standards across philosophy, UX, responsive engine, design system, theme, brand, domain rules, QA, freeze, and coding conventions. |

---

## Table of contents

1. [Platform Philosophy](#1-platform-philosophy)
2. [Marketplace UX Principles](#2-marketplace-ux-principles)
3. [Mobile First Rules](#3-mobile-first-rules)
4. [Desktop Rules](#4-desktop-rules)
5. [Responsive Engine](#5-responsive-engine)
6. [Design System](#6-design-system)
7. [Theme Engine](#7-theme-engine)
8. [Brand System](#8-brand-system)
9. [Homepage Rules](#9-homepage-rules-reference-only)
10. [Listing Card Rules](#10-listing-card-rules-reference-only)
11. [Sell Rules](#11-sell-rules-reference-only)
12. [Product Page Rules](#12-product-page-rules)
13. [Checkout Rules](#13-checkout-rules)
14. [Business Rules](#14-business-rules)
15. [Super Admin Rules](#15-super-admin-rules)
16. [Promotion Rules](#16-promotion-rules)
17. [Security Rules](#17-security-rules)
18. [Accessibility Rules](#18-accessibility-rules)
19. [Performance Rules](#19-performance-rules)
20. [QA Rules](#20-qa-rules)
21. [Audit Rules](#21-audit-rules)
22. [Freeze Rules](#22-freeze-rules)
23. [Coding Rules](#23-coding-rules)
24. [Naming Convention](#24-naming-convention)
25. [Single Source of Truth Rules](#25-single-source-of-truth-rules)

**Appendices**

- [Engineering Principles](#engineering-principles)
- [Future Modules](#future-modules)
- [Acceptance Criteria](#acceptance-criteria)

---

## Engineering principles

Every ROVEXO implementation must uphold these non-negotiable principles:

1. **One account, one identity** — Buying and selling are actions on the same user account, never separate account types.
2. **Mobile first, desktop enhanced** — Design and ship for phone viewports first; scale up deliberately.
3. **Premium minimalism** — Fast, modern, uncluttered surfaces with no duplicated information.
4. **Token-driven theming** — White and Black themes share one token system; purple is the only brand accent.
5. **Single source of truth** — Each domain has one canonical registry, route, and component set.
6. **Standards before screens** — No page may be redesigned without complying with this Bible.
7. **Backend immutability by default** — UI and standards work must not alter database schema, auth, payments, shipping, orders, messaging, or checkout logic unless explicitly authorized in a separate engineering module.
8. **Freeze respect** — Certified modules remain frozen until a formal unfreeze is approved.
9. **Auditability** — Super Admin actions, promotions, and commerce flows must remain traceable.
10. **Accessible by design** — WCAG 2.1 AA is the baseline for all consumer surfaces.

---

## 1. Platform Philosophy

ROVEXO is a **unified marketplace platform** where individuals and verified businesses buy and sell through one account.

### Core beliefs

| Belief | Implication |
|--------|-------------|
| **Trust is product** | Verification badges, trust scores, and transparent seller identity are first-class UI elements. |
| **Speed is premium** | Perceived performance (skeletons, optimistic UI, lazy media) is part of the brand. |
| **Clarity over features** | Every screen answers one primary user question. Secondary actions are grouped, not scattered. |
| **Action-based roles** | “Buyer” and “Seller” describe what the user is doing, not who they are. |
| **Platform neutrality** | ROVEXO provides infrastructure; sellers remain responsible for legal, tax, and compliance obligations. |

### What ROVEXO is not

- Not a dual-account marketplace (no buyer-only / seller-only signup).
- Not a theme playground — only **White** and **Black** official themes exist.
- Not a collection of one-off pages — every surface uses the shared design system.

### Canonical references

- Account architecture: `.cursor/rules/account-architecture.mdc`
- Design tokens: `styles/tokens.css`
- Global styles entry: `app/globals.css`

---

## 2. Marketplace UX Principles

### Experience goals

The platform must feel:

- **Premium** — generous spacing, refined typography, subtle elevation.
- **Minimal** — no visual noise, no redundant labels, no duplicate navigation paths.
- **Fast** — instant feedback, skeleton loading, no layout shift.
- **Modern** — rounded geometry, purple accent, glass surfaces where appropriate.
- **Easy to understand** — one primary CTA per context.

### UX laws

1. **One primary action per viewport** — e.g. Buy on product page, Publish on sell flow, Pay on checkout.
2. **No duplicated information** — if data appears in a header card, it must not repeat verbatim in the body.
3. **Progressive disclosure** — show essentials first; expand for detail (description, policies).
4. **Consistent navigation** — bottom nav on consumer mobile; contextual headers on task flows (sell, checkout).
5. **Trust signals near decisions** — price, seller, delivery, and protection appear before purchase commitment.
6. **Horizontal scroll for discovery** — categories and showcase rails scroll horizontally; grids scroll vertically.
7. **Native-first media** — photo pickers use native gallery on mobile where supported.

### Prohibited UX patterns

| Pattern | Why forbidden |
|---------|---------------|
| Separate buyer/seller account creation | Violates unified account model |
| Account switching UI | Same identity for all actions |
| Duplicate bottom nav on task flows | Sell and checkout hide bottom nav |
| Hardcoded brand colours in components | Breaks Theme Engine |
| Multiple showcase layouts | One canonical showcase component |
| Competing listing card implementations | One `ListingCard` with configuration props |

---

## 3. Mobile First Rules

### Reference device

| Property | Value |
|----------|-------|
| **Reference viewport** | 390 × 844 px (iPhone class) |
| **Primary content max-width** | 480 px (`max-w-2xl` / `--rovexo-content-width`) |
| **Safe areas** | Always respect `env(safe-area-inset-*)` on headers, footers, and sticky bars |

### Mobile layout rules

1. **Touch targets** — minimum 44 × 44 px for all interactive elements.
2. **Thumb zone** — primary actions live in bottom sticky bars or floating CTAs.
3. **Single column** — default layout is one column; 2-column grids only where specified (listing grid, quick actions).
4. **Compact header** — logo, search, messages, notifications, account; no unnecessary chrome.
5. **Bottom navigation** — consumer shell uses the shared bottom nav; hidden during sell, checkout, and focused admin tasks.
6. **Horizontal rails** — category and showcase sections use momentum scrolling with `scroll-snap` where implemented.
7. **No hover-only affordances** — every action must work on touch.
8. **Keyboard awareness** — inputs must not be obscured by sticky footers; use `100dvh` for full-height flows.

### Mobile typography

- Body default: `0.9375rem` (`--ds-font-body-size`)
- Page titles: `clamp()` display/heading scale from tokens
- Prices: semibold to extrabold; never truncate monetary values

### Mobile performance

- Lazy-load below-fold images
- Use `priority` only for hero / first listing image
- Prefer CSS transforms over layout-triggering properties for animations

---

## 4. Desktop Rules

### Breakpoint

| Name | Min width | Usage |
|------|-----------|-------|
| **Mobile** | 0 – 1023 px | Bottom nav, single-column flows |
| **Desktop** | 1024 px+ | Expanded grids, sidebar layouts, multi-column admin |

### Desktop layout rules

1. **Centered content column** — consumer pages remain centered (max ~672–768 px) unless a dashboard explicitly widens.
2. **No mobile bottom nav duplication** — desktop may use header links; bottom nav may hide or adapt per shell.
3. **Sidebar for admin** — Super Admin uses persistent sidebar navigation at `lg` breakpoint.
4. **Hover states** — permitted on desktop only; must not be the sole indicator of interactivity.
5. **Keyboard navigation** — all interactive elements reachable via Tab; modals trap focus.

### Desktop grids

| Surface | Desktop grid |
|---------|--------------|
| Homepage listings | 2–4 columns depending on container |
| Account quick actions | 2-column tile grid |
| Super Admin | Sidebar + fluid main content |

---

## 5. Responsive Engine

ROVEXO supports four device classes. All new UI must be verified on each class before certification.

### Device matrix

| Device class | Reference viewport | Engine priority | Primary shell |
|--------------|-------------------|-----------------|---------------|
| **Android** | 412 × 915 px (Pixel class) | Chrome, WebView | `BetaAppShell` + bottom nav |
| **iPhone** | 390 × 844 px | Safari, WebKit | `BetaAppShell` + bottom nav |
| **Tablet** | 768 × 1024 px | Safari / Chrome | Centered column or 2-column |
| **Desktop** | 1440 × 900 px | Chrome, Firefox, Edge, Safari | Header + centered content |

### Responsive implementation stack

1. **CSS custom properties** — `styles/tokens.css` for colours, spacing, radius, shadows, motion.
2. **Tailwind utilities** — `sm:`, `md:`, `lg:` for layout shifts; prefer token-backed classes.
3. **Container queries** — used in homepage carousels where documented (`@container`).
4. **`data-theme`** — theme is orthogonal to viewport; both dimensions must be tested.

### Responsive testing requirements

Every certified module must provide evidence for:

- Android (Chromium mobile emulation or device)
- iPhone (WebKit)
- Tablet (768 px width minimum)
- Desktop (1440 px width minimum)

### Orientation

- Portrait is the primary design target.
- Landscape must not break sticky bars, galleries, or checkout footers.

---

## 6. Design System

**Canonical file:** `styles/tokens.css`  
**Component primitives:** `components/ui/`  
**Icon system:** `components/icons/RovexoIcon`, `lib/icons/`

### 6.1 Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--ds-font-display-*` | clamp 2rem–2.75rem | 700 | Hero headlines |
| `--ds-font-heading-*` | clamp 1.5rem–1.875rem | 700 | Page titles |
| `--ds-font-title-*` | 1.25rem | 650 | Section titles |
| `--ds-font-subtitle-*` | 1rem | 500 | Subheads |
| `--ds-font-body-*` | 0.9375rem | 450 | Body copy |
| `--ds-font-caption-*` | 0.75rem | 500 | Meta, badges, labels |

**Rules:**

- Use semantic HTML headings (`h1`–`h3`) mapped to token scale.
- Negative letter-spacing on display/heading only.
- Prices use tabular numerals where available.
- Never use more than three typographic levels on a single card.

### 6.2 Spacing

| Token | Value |
|-------|-------|
| `--ds-space-1` | 4px |
| `--ds-space-2` | 8px |
| `--ds-space-3` | 12px |
| `--ds-space-4` | 16px |
| `--ds-space-5` | 20px |
| `--ds-space-6` | 24px |
| `--ds-space-7` | 32px |
| `--ds-space-8` | 40px |
| `--ds-space-9` | 48px |

**Rules:**

- Section gaps: `--ds-space-6` (24px) minimum on mobile.
- Card internal padding: `--ds-space-4` to `--ds-space-5`.
- Use Tailwind `gap-ds-*` / `p-ds-*` aliases wired to tokens.

### 6.3 Grid

| Context | Grid |
|---------|------|
| Homepage listings | 2-column mobile, expand at desktop |
| Account / dashboard tiles | 2-column |
| Super Admin metrics | Responsive auto-fit |

### 6.4 Radius

| Token | Value | Use |
|-------|-------|-----|
| `--ds-radius-sm` | 12px | Chips, small inputs |
| `--ds-radius-md` | 16px | Buttons, fields |
| `--ds-radius-lg` | 20px | Cards |
| `--ds-radius-xl` | 24px | Hero cards, account tiles |
| `--ds-radius-2xl` | 32px | Large panels |
| `--ds-radius-full` | 9999px | Pills, avatars |

### 6.5 Elevation

| Token | Use |
|-------|-----|
| `--ds-shadow-soft` | Resting cards |
| `--ds-shadow-medium` | Interactive cards |
| `--ds-shadow-floating` | Bottom nav, FAB |
| `--ds-shadow-premium` | Modals, hero elements |

### 6.6 Animations

| Token | Value |
|-------|-------|
| `--ds-duration-fast` | 180ms |
| `--ds-duration-normal` | 220ms |
| `--ds-duration-slow` | 280ms |
| `--ds-ease` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--ds-ease-spring` | cubic-bezier(0.34, 1.2, 0.64, 1) |

**Rules:**

- Animate `transform` and `opacity` only for micro-interactions.
- Respect `prefers-reduced-motion` — disable non-essential motion.
- Header hide/show on scroll: ~220ms max.

### 6.7 Loading

- **Route transitions** — use skeleton placeholders, not spinners alone.
- **Images** — blur placeholder or neutral surface; no layout shift.
- **Buttons** — inline loading state; disable double-submit.
- **Lists** — skeleton cards matching final card geometry.

### 6.8 Skeleton

- Skeleton shapes must match final content aspect ratio.
- Use `surface-muted` token for skeleton fills.
- Pulse animation ≤ 1.5s period; respect reduced motion.

### 6.9 Cards

- Background: `--ds-color-surface`
- Border: `--ds-color-border`
- Radius: `--ds-radius-lg` or `--ds-radius-xl`
- Interactive cards use `--ds-shadow-medium` on hover (desktop) and `active:scale` on press

### 6.10 Buttons

| Variant | Use |
|---------|-----|
| **Primary** | One per context — purple gradient or solid primary |
| **Secondary** | Outlined / muted surface |
| **Ghost** | Tertiary / toolbar |
| **Destructive** | Irreversible actions only |

**Rules:**

- Minimum height 48px on mobile primary CTAs.
- Full-width primary on mobile checkout/sell footers.
- Disabled state must reduce opacity and block pointer events.

### 6.11 Inputs

- Height minimum 48px on mobile.
- Visible focus ring using `--ds-color-ring`.
- Labels always present (visible or `aria-label`).
- Inline validation below field; form-level summary at top.

### 6.12 Dropdowns

- Use shared select/combobox primitives.
- Full-screen sheet on mobile for long option lists where implemented.
- Close on selection and on outside tap.

### 6.13 Badges

| Type | Use |
|------|-----|
| **Business** | Verified business sellers |
| **Showcase** | Featured seller listings |
| **Status** | New, promoted, out of stock |
| **Condition** | Product condition (when enabled) |

Badges use semantic colour tokens (`success`, `warning`, `primary`) — never raw hex in components.

### 6.14 Icons

- **Consumer UI:** `RovexoIcon` + `lib/icons` registry only.
- **Dashboard 3D:** `DashboardIcon3D` / `Fluency3DIcon` where established.
- **Prohibited:** Lucide, Heroicons, inline ad-hoc SVG in feature code.
- **Sizes:** 20px inline, 24px toolbar, 32px tiles — consistent per context.

---

## 7. Theme Engine

**Canonical files:**

- `styles/tokens.css` — token definitions
- `lib/settings/theme.ts` — theme resolution and persistence
- Super Admin Theme Manager: `/super-admin/theme-manager`

### Official themes

| Theme | `data-theme` | Description |
|-------|--------------|-------------|
| **White** | `light` | White background, slate text, purple accent |
| **Black** | `dark` | Deep slate background, light text, purple accent |

There is no third consumer theme. “System” preference resolves to an explicit `light` or `dark` before first paint.

### Purple accent (official)

| Theme | Primary token |
|-------|---------------|
| White | `#9333ea` (`--ds-color-primary`) |
| Black | `#a855f7` (`--ds-color-primary`) |

The “purple X” in the ROVEXO wordmark uses `text-primary` on the **X** character only.

### Theme tokens

All colour, shadow, and gradient consumption must use `var(--ds-color-*)` or Tailwind semantic classes mapped to tokens (`bg-background`, `text-primary`, `border-border`, etc.).

### No hardcoded colours

| Allowed | Forbidden |
|---------|-----------|
| `var(--ds-color-primary)` | `#9333ea` in component files |
| `text-primary`, `bg-surface` | `text-blue-500`, `bg-[#...]` |
| Token-backed CSS modules | Per-page colour overrides |

**Exception:** `styles/tokens.css` and brand asset source files may define raw values.

### Theme switching

- Storage key: `rovexo-theme` (`THEME_STORAGE_KEY`)
- Applied to `<html data-theme="light|dark">`
- Theme changes must not require page reload
- All surfaces including cards, inputs, skeletons, and overlays must respond to both themes

---

## 8. Brand System

**Canonical components:** `components/brand/RovexoLogo.tsx`, `components/brand/RovexoAppIconMark.tsx`  
**Brand Center (admin):** `/super-admin/assets`

### Official logo

| Variant | Use |
|---------|-----|
| **Mark** | Header icon (48px), favicon source |
| **Wordmark** | `ROVEXO` with purple **X** — `ROV<span>X</span>O` |
| **Full** | Marketing, splash, store assets |
| **Compact** | Tight spaces |
| **Responsive** | Mark on xs; mark + wordmark on sm+ |

### Official icon

- Rounded square app icon with ROVEXO mark
- Corner radius: ~14px at 48px size
- Generated from Brand Center assets — do not recreate in feature code

### PWA

- Web manifest must reference official icons only
- Theme colour must match `--ds-color-primary`
- `display: standalone` where supported

### Splash

- Official gradient (`--ds-gradient-hero`) or brand-approved static asset
- Centered mark; no taglines that duplicate marketing copy

### Favicons

- Source from Brand Center export set
- Include `apple-touch-icon` and standard PNG sizes

### Store assets

- Google Play and App Store graphics generated from Brand Center templates
- No unapproved colour shifts or alternate logos

---

## 9. Homepage Rules (reference only)

> **Note:** This chapter defines standards. Homepage implementation is governed by a future certified module. Do not redesign the homepage under Module 0.

### Structural standards

| Element | Rule |
|---------|------|
| **Header** | Compact: logo, search, messages, notifications, account |
| **Categories** | Horizontal scroll; text-only capsules; no category icons |
| **Showcase** | One layout: seller avatar, business badge, name, follow, horizontal listing rail |
| **Listing grid** | Shared `ListingCard` with homepage configuration |
| **Bottom nav** | Shared consumer bottom nav |

### Content rules

- No duplicate CTAs in header and body.
- Showcase seller click → seller profile → seller listings.
- Demo mode (`ROVEXO_HOMEPAGE_DEMO`) is for certification only; not production behaviour.

### Canonical references

- `components/home/RovexoHomePage.tsx`
- `components/home/RovexoShowcaseSection.tsx`
- `components/home/constants.ts` → `HOMEPAGE_LISTING_CARD_PROPS`
- `styles/rovexo-homepage.css`

---

## 10. Listing Card Rules (reference only)

> **Note:** Standards only. Implementation must use the canonical `ListingCard` component.

### Required fields (homepage / discovery)

| Field | Required |
|-------|----------|
| Large image | Yes |
| Favourite | Yes |
| Title | Yes |
| Price | Yes — never truncate |
| Business badge | When seller is verified business |
| Showcase badge | When listing is showcased |
| Rating | When available |
| Views | When available |

### Configuration

Use `HOMEPAGE_LISTING_CARD_PROPS` or explicit props — never fork the card component.

### Visual rules

- No cropped product images (`object-fit: cover` within fixed aspect ratio).
- No compressed card widths below readable price minimum.
- Condition, buyer protection, and photo count are **off** on minimal homepage cards unless a module spec enables them.

### Canonical reference

- `components/ui/ListingCard.tsx`
- `components/ui/ListingCard.module.css`

---

## 11. Sell Rules (reference only)

> **Note:** Standards only. Sell flow implementation is a separate certified module.

### Intended flow (target standard)

```
Photo upload card
  → native gallery
  → select up to 8 photos
  → horizontal preview with drag-and-drop reorder
  → listing details (minimal)
  → Review Listing (horizontal image slider)
  → Publish
```

### Rules

- Single photo upload entry point on step one.
- Bottom nav hidden during sell (`showBottomNav={false}`).
- Maximum 8 photos per listing.
- Primary CTA: Publish (sticky footer).
- No unnecessary optional sections in the core path.
- Condition selector remains required for marketplace compliance but must not dominate the UI.

### Canonical references

- `features/sell/components/SellPage.tsx`
- `features/sell/components/PhotoUploader.tsx`
- `styles/rovexo/sell.css`

---

## 12. Product Page Rules

### Required elements

| Element | Rule |
|---------|------|
| **Gallery** | Large, swipeable, dot or count indicator |
| **Price** | Prominent, uncropped, correct currency |
| **Title** | Below or adjacent to price; max 2-line clamp acceptable |
| **Seller** | Avatar, name, verification, rating |
| **Buy** | Primary CTA in sticky action bar |
| **Message** | Secondary action — always available when authenticated |
| **Shipping** | Carriers / delivery options when applicable |

### Prohibited clutter

- No breadcrumb trail on mobile consumer view.
- No “similar items” carousel unless explicitly re-enabled by module spec.
- No buyer protection wall before primary product facts.
- No engagement row (likes/shares) above the fold.

### Layout

- Gallery: ~45vh on mobile with collapse on scroll optional.
- Sticky `ProductActionBar` at bottom with safe-area padding.
- `max-w-2xl` centered column.

### Canonical references

- `features/product-detail/ProductDetailPage.tsx`
- `features/product-detail/ProductGallery.tsx`
- `features/product-detail/ProductActionBar.tsx`

---

## 13. Checkout Rules

### Immutable logic

Checkout **logic** (totals, tax, Stripe session, order creation) is frozen. This Bible governs presentation only.

### UX standards

| Rule | Detail |
|------|--------|
| **Single focus** | Checkout is a task flow — no bottom nav |
| **Order summary** | Always visible or one tap away |
| **Delivery** | Selected address and method before pay |
| **Pay CTA** | One primary “Pay” action |
| **Error handling** | Inline field errors + top-level payment failure message |
| **Pending state** | Show “calculating” / “processing” — never £0.00 for unknown totals |

### Trust

- Display item, seller, and total before payment confirmation.
- Stripe-hosted elements for card data — never raw card fields in ROVEXO DOM.

### Canonical references

- `features/checkout/`
- `app/checkout/`

---

## 14. Business Rules

### Account model

- **Personal** and **Verified Business** are account types on the same identity.
- Business features unlock after ROVEXO verification — not a separate login.

### Business surfaces

| Surface | Purpose |
|---------|---------|
| **Business Dashboard** | `/business/dashboard` — metrics, quick actions |
| **Business Profile / Store** | Public-facing seller identity |
| **Business Showcase** | Promoted listings via showcase promotion |
| **Inventory** | SKU and stock management |
| **Plans** | Business subscriptions |

### UI standards

- Verified Business badge on all business surfaces.
- Professional tone — no consumer slang in dashboard copy.
- No duplicate quick-action grids (one canonical layout per viewport).
- Business dashboard uses `BetaAppShell` with `showBottomNav={false}`.

### Legal

- Platform does not provide tax, legal, or accounting advice.
- Sellers remain responsible for their obligations.

### Canonical references

- `features/business/`
- `lib/business/`

---

## 15. Super Admin Rules

### Access

- Role: `super_admin` (singleton enforced in database).
- Route prefix: `/super-admin`
- Legacy `/admin/*` redirects here — no parallel admin stacks.

### Canonical navigation (14 modules)

| # | Module | Route |
|---|--------|-------|
| 1 | Users | `/super-admin/users` |
| 2 | Listings | `/super-admin/moderation` |
| 3 | Orders | `/super-admin/orders-engine` |
| 4 | Business | `/super-admin/businesses` |
| 5 | Payments | `/super-admin/payments-engine` |
| 6 | Shipping | `/super-admin/shipping-engine` |
| 7 | Promotion | `/super-admin/promotions` |
| 8 | Theme Engine | `/super-admin/theme-manager` |
| 9 | Brand Center | `/super-admin/assets` |
| 10 | Homepage Manager | `/super-admin/homepage-builder` |
| 11 | Banner Manager | `/super-admin/banners` |
| 12 | Mobile App | `/super-admin/mobile-distribution` |
| 13 | Analytics | `/super-admin/analytics` |
| 14 | Settings | `/super-admin/platform` |

**SSOT:** `lib/super-admin/nav.ts`

No duplicate nav entries (Dashboard, Showcase, Pricing, Notifications, System Health as separate sidebar items are prohibited).

### Commerce canonical routes

| Domain | Route |
|--------|-------|
| Listings / moderation | `/super-admin/moderation` |
| Orders | `/super-admin/orders-engine` |
| Payments | `/super-admin/payments-engine` |
| Wallet | `/super-admin/wallet-engine` |
| Shipping | `/super-admin/shipping-engine` |

### API rules

- All `/api/super-admin/*` routes require `requireApiSuperAdmin()`.
- Mutations call `auditSuperAdminAction()`.
- No client-side service-role keys.
- No arbitrary SQL execution in production UI.

### Canonical references

- `.cursor/rules/super-admin-architecture.mdc`
- `features/super-admin/components/SuperAdminShell.tsx`
- `lib/super-admin/command-center/registry.ts`

---

## 16. Promotion Rules

### Promotion types

| Type | Consumer label | Effect |
|------|----------------|--------|
| **Bump** | Boost | Elevated search ranking |
| **Feature / Showcase** | Showcase | Featured placement on homepage rails |

### Rules

- Promotions activate **only after confirmed payment** (Stripe).
- Pricing is configurable via Super Admin Promotion module — not hardcoded in UI.
- Cooldowns and per-seller limits enforced server-side.
- Display “Showcase” badge on listing cards when featured.

### Seller flow

My Listings → Promote → Stripe Checkout → confirmation → active promotion.

### Analytics

Track impressions and clicks per surface (`homepage`, `search`, `category`, `listing`, `seller`).

### Canonical references

- `docs/PROMOTIONS.md`
- `lib/promotions/`
- `/super-admin/promotions`

---

## 17. Security Rules

### Authentication

- Supabase Auth is the only authentication provider.
- Session validation server-side via `requireRole`, `requireApiSuperAdmin`, etc.
- Never expose service-role keys to the client.

### Authorization

- RLS enforced on all user data tables.
- Super Admin operations through audited API routes only.
- Role checks on every protected page and API handler.

### Data

- PII minimization in logs and client state.
- No sensitive data in URL query parameters.
- Stripe handles PCI scope — no card numbers in ROVEXO storage.

### Client

- CSP headers as configured in deployment.
- Sanitize user-generated HTML in descriptions.
- Rate-limit sensitive endpoints.

### Reporting

- Users can report listings; moderation via Super Admin Listings module.

---

## 18. Accessibility Rules

### Standard

**WCAG 2.1 Level AA** minimum for all consumer surfaces.

### Requirements

| Area | Rule |
|------|------|
| **Colour contrast** | 4.5:1 body text; 3:1 large text and UI components |
| **Focus** | Visible focus ring on all interactive elements (`focusRing` token) |
| **Labels** | Icons have `aria-label`; form fields have labels |
| **Headings** | Logical `h1`–`h6` hierarchy per page |
| **Images** | Meaningful `alt` text; decorative images `alt=""` |
| **Motion** | Respect `prefers-reduced-motion` |
| **Touch targets** | 44 × 44 px minimum |
| **Screen readers** | Landmarks (`header`, `main`, `nav`); live regions for toasts |

### Testing

- Automated: axe / Lighthouse accessibility audit in CI where configured.
- Manual: keyboard-only navigation on checkout and sell flows.

---

## 19. Performance Rules

### Targets

| Metric | Target |
|--------|--------|
| **LCP** | < 2.5s on 4G mobile |
| **CLS** | < 0.1 |
| **INP** | < 200ms |

### Implementation

- Next.js App Router with server components where appropriate.
- Image optimization via `next/image` with correct `sizes`.
- Lazy load below-fold content.
- Throttle scroll handlers (16ms max).
- Avoid layout thrashing in animations.

### Caching

- Static assets immutable cache.
- API routes: appropriate `Cache-Control` per endpoint.
- Revalidate on-demand for homepage builder publishes.

### Bundle

- No duplicate icon libraries.
- Dynamic import heavy admin modules.

---

## 20. QA Rules

### QA levels

| Level | When |
|-------|------|
| **Smoke** | Every PR — build + lint + typecheck |
| **Visual** | UI modules — screenshot comparison |
| **Regression** | Pre-release — automated audit scripts |
| **Cross-device** | Certification — Android, iPhone, tablet, desktop |
| **Cross-browser** | Certification — Chrome, Safari, Firefox, Edge |

### Certification scripts

| Script | Purpose |
|--------|---------|
| `scripts/module2-final-visual-cert.mjs` | Visual certification |
| `scripts/verify-color-tokens.mjs` | No rogue colours |
| `scripts/verify-theme-tokens.mjs` | Theme token integrity |

### Pass criteria

- 0 FAIL on blocking checks.
- All WARN items documented with owner and target fix module.
- Screenshots archived under `reports/`.

### Demo data

- Demo seed (`npm run seed:demo`) for certification environments only.
- Demo credentials must not ship to production docs visible to end users.

---

## 21. Audit Rules

### What must be audited

| Domain | Audit trail |
|--------|-------------|
| Super Admin mutations | `auditSuperAdminAction()` |
| Promotions / pricing changes | Admin audit log |
| Order state changes | Order engine log |
| Business verification | Business admin log |

### Audit properties

Every audit entry includes: actor, action, target, timestamp, and before/after where applicable.

### Read-only diagnostics

- Database health: `/super-admin/database` (read-only)
- System health metrics: via analytics / monitoring modules — not duplicate nav entries

### Reporting

- Audit reports stored in `reports/` per module certification.
- Gap reports must list remaining differences honestly — never claim PASS with known gaps.

---

## 22. Freeze Rules

### Purpose

Frozen modules are production-certified. Changes require formal unfreeze approval.

### Frozen layers

| Layer | Freeze scope |
|-------|--------------|
| **Database schema** | Always frozen unless migration module approved |
| **Checkout / orders / payments** | Logic frozen |
| **Auth** | Frozen |
| **Certified UI modules** | Frozen until explicit unfreeze |

### UI polish vs freeze

- Visual polish passes may adjust presentation within the same routes and data contracts.
- Freeze violations: new API fields, schema changes, checkout logic changes, duplicate components.

### Unfreeze process

1. Written approval from platform owner.
2. Engineering module created with scope and rollback plan.
3. Full regression certification before re-freeze.

### Hotfix

- Critical production fixes allowed with post-hoc audit report within 24 hours.

---

## 23. Coding Rules

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS modules + `styles/tokens.css` |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe |
| Shipping | Sendcloud |
| Auth | Supabase Auth |

### File organization

```
app/           → routes (thin — delegate to features)
features/      → domain UI + hooks
components/    → shared UI primitives
lib/           → server-safe business logic, types, queries
styles/        → global CSS and tokens
```

### Component rules

1. **Server components by default** — `"use client"` only when needed.
2. **Thin pages** — `app/**/page.tsx` fetches data and renders feature components.
3. **No business logic in components** — delegate to `lib/` or `features/*/services`.
4. **Shared UI** — reuse `components/ui/*` before creating new primitives.
5. **Props over forks** — configure shared components; do not duplicate.

### TypeScript

- Strict mode enabled.
- No `any` without explicit suppression comment.
- Shared types in `lib/**/types.ts` or `types/`.

### Imports

- Use `@/` path alias.
- No circular dependencies between features.

### CSS

- Prefer Tailwind utilities backed by design tokens.
- CSS modules for complex components (`*.module.css`).
- No `!important` unless documented.

### Git

- No commit without passing build.
- Conventional commit prefixes: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

---

## 24. Naming Convention

### Files and folders

| Type | Convention | Example |
|------|------------|---------|
| React component | PascalCase | `ListingCard.tsx` |
| Hook | camelCase with `use` prefix | `use-header-badges.ts` |
| Utility | kebab-case or camelCase | `normalize-avatar-url.ts` |
| CSS module | Match component | `ListingCard.module.css` |
| Route folder | kebab-case | `app/account/wallet/` |
| Types file | `types.ts` | `lib/products/types.ts` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductDetailPage` |
| Functions | camelCase | `resolveShowcaseSections` |
| Constants | SCREAMING_SNAKE | `HOMEPAGE_LISTING_CARD_PROPS` |
| CSS variables | `--ds-*` | `--ds-color-primary` |
| Data attributes | kebab-case | `data-theme`, `data-listing-card` |

### Routes

- Consumer: `/listing/[slug]`, `/sell`, `/account`, `/checkout/[slug]`
- Business: `/business/*`
- Super Admin: `/super-admin/*`
- API: `/api/[domain]/[action]`

### Database

- snake_case table and column names (Supabase convention).
- No renaming without migration module.

### Prohibited names

- `V2`, `New`, `Temp`, `Old` suffixes for production components.
- `BuyerAccount`, `SellerAccount` — use unified account naming.

---

## 25. Single Source of Truth Rules

Every domain has exactly one authoritative source. Duplicates must redirect or be deleted.

### Platform SSOT map

| Domain | SSOT location |
|--------|---------------|
| **Design tokens** | `styles/tokens.css` |
| **Theme resolution** | `lib/settings/theme.ts` |
| **Account architecture** | `.cursor/rules/account-architecture.mdc` |
| **Super Admin nav** | `lib/super-admin/nav.ts` |
| **Super Admin modules** | `lib/super-admin/command-center/registry.ts` |
| **Icons (consumer)** | `lib/icons/` + `RovexoIcon` |
| **Listing card** | `components/ui/ListingCard.tsx` |
| **Homepage** | `components/home/RovexoHomePage.tsx` |
| **Showcase layout** | `components/home/RovexoShowcaseSection.tsx` |
| **Engineering Bible** | `docs/engineering-bible/ROVEXO_ENGINEERING_BIBLE.md` |
| **Promotions pricing** | Super Admin Promotion module + `lib/promotions/` |
| **Brand assets** | Brand Center `/super-admin/assets` |

### Rules

1. **Read before write** — locate the SSOT before creating a new file.
2. **Extend, don't fork** — add props or registry entries instead of copying components.
3. **Redirect legacy routes** — never maintain parallel pages.
4. **Registries over hardcoded lists** — navigation, modules, and icons use registry files.
5. **Bible supersedes ad-hoc docs** — if a doc conflicts with this Bible, the Bible wins; update or archive the conflicting doc.

### When SSOT must be updated

Any change to canonical routes, tokens, nav modules, or account model **must** update the corresponding SSOT file and this Bible in the same engineering module.

---

## Future modules

The Engineering Bible is Module 0. Subsequent modules build on these standards without redefining them.

| Module | Name | Scope |
|--------|------|-------|
| **0** | Engineering Bible Initialization | This document — standards only |
| **1** | Core Platform Freeze | Auth, DB, checkout, orders baseline |
| **2** | Visual Certification | Theme, tokens, homepage, cards, showcase |
| **3** | Homepage Implementation | Full homepage compliance with Bible §9–10 |
| **4** | Sell Flow | Upload → review → publish per Bible §11 |
| **5** | Account Center | Premium dashboard per unified account model |
| **6** | Product & Checkout Polish | Bible §12–13 implementation pass |
| **7** | Business Suite | Dashboard, showcase, profile per Bible §14 |
| **8** | Super Admin Sync | 14-module nav, live sync, audit |
| **9** | Brand & PWA | Full Brand Center consumer rollout |
| **10** | Performance & A11y Certification | Bible §18–19 hard gates |
| **11** | Production Release | Final regression, freeze, deploy |

Each module must cite Bible chapters it implements and must not contradict frozen layers.

---

## Acceptance criteria

Module 0 (this document) is accepted when:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `docs/engineering-bible/ROVEXO_ENGINEERING_BIBLE.md` exists | ✅ |
| 2 | All 25 chapters present | ✅ |
| 3 | Table of contents with anchor links | ✅ |
| 4 | Version and change history documented | ✅ |
| 5 | Engineering principles defined | ✅ |
| 6 | Future modules roadmap included | ✅ |
| 7 | Acceptance criteria section included | ✅ |
| 8 | Document defines standards only — no page redesigns | ✅ |
| 9 | No database, API, auth, Stripe, Sendcloud, or checkout logic modified | ✅ |
| 10 | No commit, push, or deploy performed | ✅ |

### Review checklist for approvers

- [ ] Account unified model reflected throughout
- [ ] White / Black / Purple theme rules match `styles/tokens.css`
- [ ] Super Admin 14-module nav matches `lib/super-admin/nav.ts`
- [ ] Homepage, Sell, Listing Card chapters marked reference-only
- [ ] SSOT map is accurate for current codebase
- [ ] Future modules sequencing approved

---

## STOP

This module creates the Engineering Bible only.

- ❌ Do not redesign Homepage
- ❌ Do not redesign Sell
- ❌ Do not redesign My Account
- ❌ Do not redesign Business
- ❌ Do not redesign Super Admin
- ❌ Do not commit
- ❌ Do not push
- ❌ Do not deploy

**Awaiting review.**
