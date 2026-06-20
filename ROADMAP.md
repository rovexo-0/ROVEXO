# ROVEXO Beta v1.0 Roadmap

**Version:** Beta v1.0  
**Policy:** No experimental features beyond this scope. Post-beta ideas are tracked in `lib/beta/post-beta.ts` as TODO comments only.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **COMPLETE** | Shipped for Beta — UI/flow ready on mock data |
| **IN PROGRESS** | Started — partial implementation |
| **PLANNED** | In Beta scope — not yet built |

---

## Buyer

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Homepage | `/` | **COMPLETE** | Trending, New, Recommended, pull-to-refresh, infinite scroll |
| Search | Overlay + `/search` | **COMPLETE** | Debounced live results, history, trending, keyboard nav |
| Product Details | `/listing/[slug]` | **COMPLETE** | Gallery, price, seller, delivery, protection, action bar |
| Saved | `/saved` | **COMPLETE** | Wishlist grid, filters, sort, multi-select |
| Notifications | `/notifications` | **COMPLETE** | Filters, swipe actions, settings |
| Messages | `/messages` | **COMPLETE** | Inbox, filters, chat, quick actions |
| Checkout | `/checkout/[slug]` | **COMPLETE** | Review → Payment → Confirmation, price breakdown |
| Orders | `/orders` | **COMPLETE** | Buyer/seller views, statuses, card-based UI |
| Buyer Profile | `/account` | **COMPLETE** | Avatar, seller stats, menu, sign out |
| Settings | `/settings` | **COMPLETE** | Account, notifications, appearance, privacy, payments, selling |

---

## Seller

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Dashboard | `/seller/dashboard` | **COMPLETE** | Summary, performance, quick actions, recent orders |
| Sell Flow | `/sell` | **IN PROGRESS** | AI Camera entry + sell hub |
| My Listings | `/seller/listings` | PLANNED | Route scaffolded |
| Wallet | `/seller/wallet` | **COMPLETE** | Balance, withdraw flow, transactions, payout methods |
| Analytics | `/seller/analytics` | **COMPLETE** | Overview, charts, top products, traffic, export |
| Orders | `/seller/orders` | **COMPLETE** | Seller list, add tracking, message buyer |
| AI Camera | `/sell/camera` | **IN PROGRESS** | Category tree matching, brand/color/size detection |
| AI Description | Sell flow | PLANNED | Stub in search seller actions |
| AI Price Suggestion | Sell flow | PLANNED | Stub in search seller actions |

---

## Business

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Business Dashboard | `/business/dashboard` | **COMPLETE** | Profile, summary, inventory overview, performance, orders |
| Inventory | `/business/inventory` | **COMPLETE** | Stock status with active, low stock, out of stock filters |
| Analytics | `/business/analytics` | **COMPLETE** | Performance, channels, top products, geographic sales, export |

---

## Payments

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Buyer Protection Fee | PDP + checkout | **COMPLETE** | Protected Fee in checkout summary |
| 36 hour payment release | Checkout / orders | PLANNED | Escrow release policy |
| Seller shipping label | Seller orders | PLANNED | Seller issues own label |
| Return policy | Checkout / orders | PLANNED | Policy + buyer flow |
| Refund flow | Orders | PLANNED | Dispute + refund UI |

---

## Removed from Beta (Post-Beta Only)

Do **not** implement for Beta v1.0. See `lib/beta/post-beta.ts`.

- AI Scan
- Voice Search
- AI Translation
- AI Auto Reply
- Price History
- Demand Score
- Trending AI
- Fake Detection
- SEO AI
- Live Views
- Future AI features

---

## Architecture

- **Design system:** `styles/tokens.css`, `components/ui/*`
- **Module status (code):** `lib/beta/roadmap.ts`
- **Post-beta TODOs:** `lib/beta/post-beta.ts`
- **Page shell:** `components/beta/BetaAppShell.tsx`
- **Planned module UI:** `components/beta/BetaModulePlaceholder.tsx`

---

## Beta Release Checklist

- [x] Homepage
- [x] Search
- [x] Product Details
- [x] Saved
- [x] Notifications
- [x] Messages
- [x] Checkout
- [x] Buyer Orders
- [x] Buyer Profile
- [x] Seller Dashboard
- [ ] Sell Flow
- [ ] My Listings
- [ ] Wallet
- [x] Seller Orders
- [ ] AI Description
- [ ] AI Price Suggestion
- [ ] AI Camera
- [ ] Buyer Protection Fee (full checkout integration)
- [ ] 36h payment release
- [ ] Seller shipping label
- [ ] Return policy
- [ ] Refund flow

---

*Last updated: Beta v1.0 scope lock*
