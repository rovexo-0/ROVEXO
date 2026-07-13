# ROVEXO Orders — Canonical Specification

**Route:** `/orders`  
**Single UI component:** `features/orders/components/OrdersPage.tsx`  
**Styles:** `styles/rovexo/orders-page-v1.css`  

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
