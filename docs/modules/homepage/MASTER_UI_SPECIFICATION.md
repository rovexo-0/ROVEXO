# ROVEXO Homepage — Master UI Specification (Compact Premium)

**Document type:** Master UI Specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc` + Product Owner Final Authorization (2026-07-18)  
**Philosophy:** Compact Premium — dense, mobile-first, premium, one design language

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Homepage |
| **Route(s)** | `/` |
| **Canonical component** | `components/homepage/canonical/CanonicalHomepage.tsx` |
| **Canonical styles** | `styles/homepage-canonical.css`, `styles/rovexo/compact-premium-v1.css`, `styles/rovexo/header-v2.css`, `styles/rovexo/bottom-nav-premium.css`, `components/ui/ListingCard.module.css` |
| **Visual reference** | Compact Premium size philosophy (PO Final Authorization) |
| **Canvas reference** | 390 × 844 (mobile-first) |
| **Version** | 1.0 Compact Premium |
| **Status** | `Approved` (PO Final Authorization 2026-07-18) → Implementing |
| **Owner** | Product Owner |
| **Approved by** | Product Owner — FINAL PRODUCT OWNER AUTHORIZATION |
| **Approved date** | 2026-07-18 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-18 | Auto + PO | Compact Premium Homepage Master UI Spec; supersedes oversized chrome |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/page.tsx` |
| Page | `components/homepage/canonical/CanonicalHomepage.tsx` |
| Category rail | `components/homepage/canonical/CanonicalCategoryRail.tsx` |
| Featured | `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` |
| Feed | `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` |
| Header | `components/header/RovexoHeaderV2.tsx` (`layout="homepage"`) |
| Search | `components/home/HomepageSearchField.tsx` |
| Listing card | `components/ui/ListingCard.tsx` |
| Bottom nav | `components/ui/BottomNavigation.tsx` |
| Tokens | `styles/rovexo/compact-premium-v1.css` |
| Tests | `tests/home-listing-grid-lock.test.ts`, homepage certification suites |

---

## 1. Master UI Specification

### 1.1 Page purpose

Discover and browse marketplace listings with immediate price, inclusive price, condition, and rating. Compact premium feed — minimal chrome, maximum product density.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone standard / 6.9" | Mobile-first |
| Reference width | 390 px | |
| Reference height | 844 px | |
| Safe area top | env(safe-area-inset-top) | |
| Safe area bottom | env(safe-area-inset-bottom) | |
| Content max-width (mobile) | 100% | |
| Content max-width (tablet) | 980 px | Columns only |
| Content max-width (desktop) | 980 px | Columns only |
| Page background | `#ffffff` / `--uv1-background` | |

### 1.3 Layout order (section tree)

1. Header V2 — search-only homepage chrome  
2. Category rail  
3. Featured store / showcase sections (when data present)  
4. Marketplace feed (listing grid)  
5. Bottom navigation (shell)

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) | 2 |
| Columns (tablet) | 3–4 |
| Columns (desktop) | 4 |
| Gutter | 8–12 px |
| Page horizontal inset | 12 px (`--cp-page-inset`) |
| Section vertical gap | 16 px (`--cp-section-gap`) |

### 1.5 Global spacing system

| Token | Value (px) |
|-------|------------|
| `--space-xs` / `--cp-row-gap` | 8 |
| `--space-sm` | 12 |
| `--space-md` / `--cp-page-inset` | 12–16 |
| `--space-lg` / `--cp-section-gap` | 16 |
| `--space-xl` | 24 (rare) |
| Section gap | 16 |
| Card internal padding | 10 |
| Row height (list) | N/A (grid cards) |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|-------|
| Radius card | 16 px |
| Radius button | 14 px |
| Radius badge | 999 px / pill where needed |
| Shadow card | soft / none under UV1 |
| Shadow elevated | soft |
| Brand | ROVEXO purple `#9333ea` / `#7c3aed` |
| Surface | `#ffffff` |
| Text primary | `#0f172a` |
| Text muted | `#64748b` |
| Border | `rgb(15 23 42 / 10%)` |

---

## 2. Component Dimension Table

### Component: Homepage Header (search)

| Field | Value |
|-------|-------|
| Purpose | Live search entry |
| Height | 64 px shell (`--cp-header-height`) |
| Search height | 44 px (`--cp-search-height`) |
| Padding | compact horizontal 12 px |
| Border radius | 14 px control |
| Background | white |
| Icon size | 18–22 px |
| Body font | 14 px |
| Pressed/Hover/Focus | existing Header V2 states |
| Navigation | `/search` + live suggestions |
| Responsive | identical chrome; max-width only |

### Component: Category Rail

| Field | Value |
|-------|-------|
| Purpose | Category shortcuts |
| Height | compact chip row |
| Gap | 8 px |
| Font size | 12–13 px secondary |
| Responsive | horizontal scroll mobile; denser desktop |

### Component: Listing Card (Homepage)

| Field | Value |
|-------|-------|
| Purpose | Product discovery card |
| Radius | 16 px |
| Title | 15–16 px / 600 |
| Price | 18 px / 700 |
| Secondary / views | 12–13 px |
| Body | 14 px where used |
| Padding | 10 px content |
| Must expose | price, inclusive price, condition, numeric rating |
| Favourite | ≥28 px touch |
| Responsive | grid columns only |

### Component: Bottom Nav + Sell FAB

| Field | Value |
|-------|-------|
| Bar height | 52 px + safe area |
| Icon | 22 px |
| Label | 12 px |
| Sell FAB | 56 px |
| Touch | ≥40 px items |

### Component: Standard Button (platform)

| Field | Value |
|-------|-------|
| Height | 40–44 px (`--cp-button-height` = 44) |
| Font | 14 px |
| Radius | 14 px |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | 0 | 12 | 12 | 12 | 16 | Compact inset |
| Section | 0 | 0 | 16 | 0 | 8 | |
| Card | 0 | 0 | 0 | 0 | 4–6 | Internal |
| Button group | 0 | 0 | 0 | 0 | 8 | |
| Grid | 0 | 0 | 0 | 0 | 8–12 | |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Section title | Geist Sans | 650 | 16 px | 22 px | -0.01em | primary | start |
| Listing title | Geist Sans | 600 | 15–16 px | 1.2 | -0.01em | primary | start |
| Listing price | Geist Sans | 700 | 18 px | 1.2 | -0.01em | brand | start |
| Body | Geist Sans | 450 | 14 px | 1.45 | -0.005em | primary | start |
| Secondary | Geist Sans | 500 | 12–13 px | 1.3 | 0 | muted | start |
| Meta / views | Geist Sans | 500–600 | 12–13 px | 1.2 | 0 | muted | start |
| Button | Geist Sans | 600 | 14 px | 1.25 | 0 | on-brand | center |

---

## 5. Colour Table

| Token | Hex / gradient | Usage |
|-------|----------------|-------|
| Background | `#ffffff` | Page |
| Surface | `#ffffff` | Cards |
| Text primary | `#0f172a` | Titles |
| Text muted | `#64748b` | Meta |
| Brand | `#9333ea` | Price, FAB, accents |
| Border | `rgb(15 23 42 / 10%)` | Dividers |

---

## 6. Interaction Specification

| Control | Behaviour |
|---------|-----------|
| Search | Live search, filters, camera entry (canonical search system) |
| Category chip | Navigates category / search with category |
| Listing card | Opens product; favourite toggles save |
| Bottom nav | Home / Search / Sell / Inbox / Account |
| Sell FAB | `/sell` one-page flow |

Pressed: scale/opacity per existing chrome. Focus: visible ring. Loading: feed skeletons. Empty: approved empty (omit or compact).

---

## 7. Responsive Specification

One design. Breakpoints may change **only**: max-width, grid columns, horizontal inset. No separate Mobile/Desktop components.

| Viewport | Columns | Notes |
|----------|---------|-------|
| Phone | 2 | Default |
| Tablet | 3–4 | Wider gutters optional |
| Desktop | 4 | max-width 980 |
| PWA | same as phone/desktop | |

---

## 8. Accessibility Specification

- Touch targets ≥ 40 px  
- Search accessible name + keyboard  
- Listing links have discernible names  
- Contrast AA for text/icons  
- Reduced motion respected  
- No broken images (`SafeImage`)

---

## 9. Developer Notes

- Tokens live in `styles/rovexo/compact-premium-v1.css` — do not hardcode oversized chrome.  
- Do not touch Login/Register (`auth-v1.css`).  
- Preserve feed API, eligibility, favourite, rating, views.  
- Listing card structure stays; Compact Premium adjusts density/type within PO sizes.  
- Platform modules must consume the same `--cp-*` / UV1 mappings (No Old UI).

---

## 10. QA Checklist

- [ ] Header 64 px; search 44 px  
- [ ] Buttons 40–44 px; Sell FAB 56 px  
- [ ] Listing title 15–16 px; price 18 px; meta 12–13 px  
- [ ] Price, inclusive price, condition, rating visible on cards  
- [ ] 2-column mobile grid; no giant empty gaps  
- [ ] Bottom nav compact; FAB 56 px  
- [ ] iPhone / Samsung / Tablet / Desktop / PWA smoke  
- [ ] No Login/Register visual changes  
- [ ] Preview deploy after Homepage pass  

**Freeze:** Auth Login/Register remain permanently locked. Homepage Compact Premium replaces prior oversized UV1 chrome values.
