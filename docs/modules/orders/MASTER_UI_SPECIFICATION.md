# ROVEXO Orders — Canonical Specification

**Route:** `/orders`  
**Single UI component:** `features/orders/components/OrdersPage.tsx`  
**Styles:** `styles/rovexo/orders-page-v1.css`  

## Universal UI v1.1 compatibility amendment

Approved 2026-07-15. Orders data and status behavior are unchanged. Presentation now consumes Universal UI v1.1: 60px header, 44px back/tab/chip targets, 24px icons, 16px inner padding, 14px body text, 14px controls and divider-based compact rows.

## Architecture

- One Orders UI module only: `OrdersPage`
- Deleted: `OrdersHubV1`, `OrdersCanonicalPage`, `OrdersV1`
- Route renders `<OrdersPage />` (data loaded in `app/orders/page.tsx`)

## Sections

1. Header  
2. Sold / Bought tabs  
3. Chips: All · Processing · Completed  
4. Empty state (or order rows when data exists)  
5. Bottom navigation (shell)
