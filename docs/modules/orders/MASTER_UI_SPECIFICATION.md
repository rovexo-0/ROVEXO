# ROVEXO Orders — Master UI Specification

**Route:** `/orders`  
**Canonical:** `OrdersHubV1` + `styles/rovexo/orders-hub-v1.css`  
**Authority:** Master Engineering Specification (Orders v1.0)  
**Status:** Implemented — `data-orders-freeze="pending-visual-qa"`  
**Rule:** Single canonical component. No alternate Mobile/Desktop forks.

## Locked engineering tokens

| Token | Value |
|-------|-------|
| Page bg | `#FFFFFF` |
| Primary | `#7C3AED` |
| Border | `#ECECEC` |
| Shadow | `0 6px 24px rgba(0,0,0,.06)` |
| Radius | 18px |
| Content pad | 16px |
| Header | 80px · title 28 bold · back 40×40 · notify 32 + 8px badge · touch 44 |
| Tabs | 54px · 18 semibold · underline 3px · 200ms |
| Stats | horizontal snap · 154×136 · gap 12 · ~3.3 visible |
| Chips | height 44 · radius 14 · gap 12 · **no** x-scroll · live counts |
| Order card | 215 × 18 radius · pad 18 · image 110×110 r14 |
| Timeline | track 4px · labels 12 · tap timestamp |
| List gap | 18px |
| Desktop | max-width / horizontal pad / stats width only |

## Section tree

1. Header  
2. Sold / Bought tabs  
3. Statistics (snap carousel)  
4. Status chips with counts  
5. Orders list (memo + infinite-ready windowing)  
6. Bottom navigation (canonical — do not redesign here)

## Freeze

Freeze only after pixel-perfect visual QA against this engineering spec.
