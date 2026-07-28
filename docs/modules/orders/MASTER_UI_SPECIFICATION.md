# ROVEXO Orders — Master UI Specification

**STATUS:** LOCKED (Supreme Blood Code XII — Sprint III · 100% COMPLETE · PERMANENT FREEZE)  
**Route:** `http://localhost:3000/orders`  
**Single UI component:** `features/orders/components/OrdersPage.tsx`  
**Styles:** `styles/rovexo/orders-page-v1.css`  
**Status SSOT:** `lib/orders/orders-v7-status.ts`  
**Blood Code:** `lib/supreme-blood-code-xii-v1.ts`  
**DOM lock:** `data-orders-page="v7.0"` · `data-profile-master="v7.0"` · `data-full-width-surface="orders"` · `data-blood-code-xii="12.0"` · `data-orders-freeze="PERMANENT"`

## What changed (Blood XII freeze)

- Sprint III Orders declared 100% complete and permanently frozen
- Official localhost locked to `http://localhost:3000/orders`
- Marketplace Search Bar remains Homepage-only (unmounted on `/orders`)

## What did not change

- Auth, Stripe, Sendcloud, DB schema, escrow money movement APIs
- Canonical route `/orders` and detail routes `/orders/[id]` · `/seller/orders/[id]`
- Order fetch via `fetchOrdersForUser`
- No redesign · no new components · no cross-module edits

## Architecture

- One Orders UI module only: `OrdersPage`
- Deleted (must stay deleted): `OrdersHubV1`, `OrdersCanonicalPage`, `OrdersV1`

## Sections

1. Header (Back · Orders) — no Search Bar / ROVEXO logo
2. Sold / Bought tabs
3. Chips: All · In Progress · Completed · Cancelled
4. Empty state or order list with status pills
5. Bottom navigation (Home · Search · Sell · Inbox · Account) — permanent

## Financial absolute law

- Buyer: Subtotal · Shipping · Platform Fee · TOTAL PAID — never YOU'LL RECEIVE
- Seller: Subtotal · Shipping · YOU'LL RECEIVE — never TOTAL PAID

## Responsive

Design identical across breakpoints. Master certification device: iPhone 17 Pro Max.  
Only shell width inherits Full Width Engine (100%).

## Post-freeze

Allowed only: critical bug fixes with Owner approval.  
Forbidden: redesign, duplicates, new components, cross-module changes.

## QA (Owner)

Official: `http://localhost:3000/orders`  
Gates: Typecheck · ESLint · Build · Orders vitest · Visual QA · Mobile QA · Owner Certification.
