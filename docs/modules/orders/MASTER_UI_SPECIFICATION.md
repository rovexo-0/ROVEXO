# ROVEXO Orders — Master UI Specification

**Route:** `/orders`  
**Canonical:** `OrdersHubV1` + `styles/rovexo/orders-hub-v1.css`  
**SSOT:** Approved Orders mockup (user Master Canonical UI Spec v1.0)  
**Status:** Implemented — `data-orders-freeze="pending-visual-qa"`  
**Freeze:** Only after explicit pixel-perfect visual QA approval

## Document control

| Field | Value |
|-------|-------|
| Page / Module | Orders Hub |
| Route(s) | `/orders`, `/orders?tab=bought` |
| Canonical component | `features/orders/components/OrdersHubV1.tsx` |
| Canonical styles | `styles/rovexo/orders-hub-v1.css` |
| Canvas reference | 390 × 844 (iPhone 6.9") |
| Version | 1.0 |
| Status | Implemented (pending visual QA) |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/orders/page.tsx` |
| Hub | `features/orders/components/OrdersHubV1.tsx` |
| Entry shim | `features/account-module/components/OrdersV1.tsx` |
| Helpers | `lib/orders/hub-timeline.ts`, `lib/orders/hub-summary.ts` |
| Styles | `styles/rovexo/orders-hub-v1.css` |
| Tests | `tests/orders-canonical-hub.test.ts` |

---

## 1. Master UI Specification

### 1.1 Page purpose

Unified Bought / Sold orders hub: summary metrics, status filters, order cards with timeline, empty / error / loading states. Desktop = same UI (max-width / columns / horizontal spacing only).

### 1.2 Canvas

| Token | Value |
|-------|-------|
| Reference device | iPhone 6.9" |
| Reference width | 390px |
| Content max-width (mobile) | 390px |
| Content max-width (desktop) | 720px |
| Page background | `#FFFFFF` |
| Outer padding | 16px |
| Section spacing | 24px |
| Card spacing | 16px |
| Animation | 200ms ease |
| Border | 1px `#F1F2F5` |
| Shadow | `0 4px 20px rgba(17,24,39,0.05)` |
| Radius (card) | 18px |

### 1.3 Layout order

1. Header (Back · Orders · Notifications)
2. Tabs (Sold | Bought)
3. Summary cards 2×2
4. Status filter chips (horizontal scroll)
5. Order cards (or empty state)
6. Bottom navigation (canonical — do not modify)

### 1.4–1.6 Locked tokens

See Component / Spacing / Typography / Colour tables below.

---

## 2. Component Dimension Table

### Header

| Field | Value |
|-------|-------|
| Height | 64px |
| Padding | 20px |
| Back / Notification | 40×40 · radius 12px |
| Title | Orders · 28px · semibold |
| Notification unread | Purple dot |

### Tabs

| Field | Value |
|-------|-------|
| Height | 44px |
| Indicator | 3px · `#7C3AED` |
| Inactive | `#64748B` |
| Animation | 200ms ease |

### Summary cards

| Field | Value |
|-------|-------|
| Grid | 2×2 · gap 12px |
| Height | 92px |
| Radius | 18px |
| Padding | 16px |
| Icon container | 36×36 · radius 12px |
| Title | 13px medium |
| Value | 28px bold |
| Subtitle | 12px grey |
| Cards | Total Sales · Pending Payout · Orders · Positive Feedback (Sold); Total Spent · In Progress · Orders · Completed (Bought) |

### Status filters

| Field | Value |
|-------|-------|
| Chip height | 40px |
| Padding | 0 18px |
| Radius | 20px |
| Gap | 12px |
| Selected | Purple bg · white text |
| Chips | All · Processing · Shipping · Completed · Cancelled |

### Order card

| Field | Value |
|-------|-------|
| Radius | 18px |
| Padding | 16px |
| Gap | 16px |
| Image | 96×96 · radius 12px · object-fit cover |
| Order ID | 12px grey |
| Product title | 22px semibold |
| Variant | 14px grey |
| Counterparty avatar | 24×24 · gap 8px |
| Price | 28px bold · right |
| Status badge | height 28 · radius 999 · pad-x 10 |
| Date | 13px grey |
| Chevron | 20×20 |
| Timeline | height 44 · nodes 16 · line 3 · steps Paid→Packed→Shipped→Delivered |

### Empty state

| Field | Value |
|-------|-------|
| Illustration | 120×120 centered |
| Title | No orders yet |
| Body | Your orders will appear here after your first purchase or sale. |
| Primary | Browse Marketplace |
| Secondary | Sell an Item |

---

## 3. Spacing Table

| Context | Value |
|---------|-------|
| Page pad-x | 16px |
| Section gap | 24px |
| Card list gap | 16px |
| Summary gap | 12px |
| Chip gap | 12px |
| Card internal | 16px |

---

## 4. Typography Table

| Element | Size | Weight |
|---------|------|--------|
| Header title | 28px | 600 |
| Summary title | 13px | 500 |
| Summary value | 28px | 700 |
| Summary subtitle | 12px | 400 |
| Order ID | 12px | 400 |
| Product title | 22px | 600 |
| Variant / party | 14px | 400 |
| Price | 28px | 700 |
| Date | 13px | 400 |
| Empty title | ~18px | 600 |
| Empty body | 14px | 400 |

---

## 5. Colour Table

| Token | Value |
|-------|-------|
| Purple | `#7C3AED` |
| Inactive tab | `#64748B` |
| Border | `#F1F2F5` |
| Delivered | `#22C55E` |
| Shipping | `#3B82F6` |
| Processing | `#F59E0B` |
| Cancelled | `#94A3B8` |
| Completed | `#16A34A` |
| Timeline done/current | `#7C3AED` (+ glow on current) |
| Timeline future | Grey |
| Timeline cancelled | Red |

---

## 6. Interaction Specification

| Action | Behaviour |
|--------|-----------|
| Tab switch | URL `/orders` vs `?tab=bought`; reset status filter; 200ms indicator |
| Chip select | Filter list; purple selected; 200ms |
| Summary card | Navigate to filtered list / wallet payouts where relevant |
| Order card | `/orders/[id]` (buyer) or `/seller/orders/[id]` (seller) |
| Notification | `/notifications` |
| Empty primary | `/` marketplace |
| Empty secondary | `/sell` |
| Infinite scroll | Load more when near end |
| Pull / refresh | `router.refresh()` |

---

## 7. Responsive Specification

| Breakpoint | Change only |
|------------|-------------|
| Mobile | 390 max · 2-col summary |
| Desktop | max-width 720 · same components · optional 4-col summary ≥720 |

---

## 8. Accessibility Specification

- Tabs `role="tablist"` / `aria-selected`
- Chips `aria-pressed`
- Focus rings on controls
- Keyboard navigable cards (links)
- Status colours not sole signal (text labels)

---

## 9. Developer Notes

- Class prefix: `orders-v2`
- Import CSS via hub component + `styles/rovexo/index.css`
- Header lock via `:has(.orders-v2)` like Wallet
- `SafeImage` via `ProductRowImage`
- No Platform Fee on seller surfaces
- Bottom nav untouched
- Do not invent Desktop/Mobile split components

---

## 10. QA Checklist

- [ ] Pixel-perfect mobile vs approved mockup
- [ ] Desktop identical UI (max-width only)
- [ ] TypeScript / ESLint / Build pass
- [ ] No layout shift; 60 FPS scroll
- [ ] Empty / error / loading / success
- [ ] Infinite scroll
- [ ] Freeze only after explicit visual QA
