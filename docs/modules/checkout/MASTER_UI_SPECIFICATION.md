# ROVEXO Checkout — Master UI Specification

**Status:** Sprint 1 — Canonical Foundation (UI only)  
**Freeze:** Pending QA approval before Sprint 2  
**SSOT:** `CheckoutWizardV1` + `styles/rovexo/checkout-v1.css`  
**Marker:** `data-checkout-version="v1.0"` · `data-checkout-sprint="1-foundation"`

## Routes

| Route | Purpose |
|-------|---------|
| `/checkout` | Redirects to `/cart` when no listing context |
| `/checkout/[slug]` | Canonical checkout summary (Confirm & Pay) |
| `/checkout/[slug]/address` | Delivery address + method |
| `/checkout/[slug]/payment` | Payment method selection |
| `/checkout/[slug]/review` | Alias of summary |
| `/checkout/[slug]/success` | Local success (Sprint 1) |
| `/checkout/success` | Post-pay redirect helper → `/orders` |

## Layout tokens

| Token | Value |
|-------|-------|
| Background | `#FFFFFF` |
| Container | max-width `430px` |
| Pad | 16px horizontal · 24px bottom |
| Section gap | 24px |
| Card radius | 18px |
| Header | 64px · back only 40×40 · pad 20 · no title |
| CTA | sticky · full width · 56px · Confirm & Pay |

## Sections (summary)

1. Product summary (tap → listing)
2. Delivery (+ Change → address)
3. Payment (+ Change → payment / Wallet)
4. Price summary (Item · Delivery · Platform Fee · TOTAL)

## Sprint 1 stop

- UI foundation + preview deploy
- **No** new payment processing
- **No** new Sendcloud API work
- Existing place-order / quotes wiring may remain untouched under the new shell
