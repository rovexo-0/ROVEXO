# ROVEXO Orders — Master UI Specification

**Route:** `/orders`  
**Canonical:** `OrdersHubV1` + `styles/rovexo/orders-hub-v1.css`  
**Status:** Minimal canonical — `data-orders-freeze="pending-visual-qa"`

## Section tree

1. Header (72 + safe-area · 34 bold · 44 controls)  
2. Sold / Bought tabs (54 · underline 150×3)  
3. Status chips — **All · Processing · Completed** only  
4. Empty state (package outline) **or** order list  
5. Bottom navigation (unchanged)

## Removed permanently

Statistics cards · Total Sales · Pending Payout · Positive Feedback · Search · Sort · CTAs · Banners · Shipping/Cancelled chips

## Empty state

- Icon 80×80 · opacity 35%  
- Title: `No orders yet.` · 26/700 `#111827`  
- Subtitle: `Your sold items will appear here.` (Bought uses purchase copy)  
- mt 96 · icon→title 24 · title→sub 12 · max-width 280
