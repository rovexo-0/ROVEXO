# ROVEXO Orders — Master UI Specification

**Route:** `/orders`  
**Canonical:** `OrdersHubV1` + `styles/rovexo/orders-hub-v1.css`  
**Authority:** Master Implementation Specification (Orders v1.0)  
**Status:** Implemented — `data-orders-freeze="pending-visual-qa"`  
**Rule:** Single canonical component. No alternate layouts.

## Section tree

1. Header (84px)  
2. Sold / Bought tabs (58px · underline 170×3)  
3. Statistics **2×2 CSS grid** (156×20 · gap 16 · no x-scroll)  
4. Status chips (48px · radius 24 · gap 12)  
5. Empty text-only **or** order list  
6. Bottom navigation (canonical shell — unchanged)

## Locked tokens

| Token | Value |
|-------|-------|
| Page pad | 16px |
| Header | 84px · title 28/700 `#111827` |
| Tabs | 58px · 18/600 · underline `#7C3AED` 3×170 · 200ms |
| Stats cards | height 156 · radius 20 · pad 20 · icon 46×46 r23 |
| Stat title/value/sub | 14/600 · 32/700 · 13/400 |
| Chips | height 48 · pad-x 22 · radius 24 · 16/600 · 150ms |
| Empty | “No orders yet.” · 26/700 `#374151` · mt 100 · **no** art/buttons/subtitle |
| Forbidden | search · sort · sell/browse CTAs · banners · snap carousels |

## Freeze

Pending pixel-perfect visual QA against the approved design.
