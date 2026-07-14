# ROVEXO Checkout — Master UI Specification

**Status:** Sprint 2 — Payment + Sendcloud (business wiring; UI unchanged)  
**Freeze:** Not eligible until payment, Sendcloud, orders, inbox, wallet, and tracking QA pass  
**SSOT:** `CheckoutWizardV1` + `styles/rovexo/checkout-v1.css`  
**Marker:** `data-checkout-version="v1.0"` · `data-checkout-sprint="2-payment"`

## Routes

| Route | Purpose |
|-------|---------|
| `/checkout` | Redirects to `/cart` when no listing context |
| `/checkout/[slug]` | Canonical checkout summary (Confirm & Pay) |
| `/checkout/[slug]/address` | Delivery address + method |
| `/checkout/[slug]/payment` | Payment method selection (Wallet SSOT) |
| `/checkout/[slug]/review` | Alias of summary |
| `/checkout/[slug]/success` | Post-pay success (order + conversation CTAs) |
| `/checkout/success` | Legacy helper → `/orders` |

## Entry

Buy Now → `/checkout/[listingSlug]` (no cart intermediate). One listing per session.

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
2. Delivery (+ Change → address) — Sendcloud quotes only
3. Payment (+ Change → payment / Wallet SSOT)
4. Price summary (Item · Delivery · Platform Fee · TOTAL — fee buyer-visible only)

## Sprint 2 (this release)

- Wallet payment methods via `/api/payment-methods`
- Stripe Checkout + lock listing on confirm; unlock on cancel/fail
- Post-pay: order · inbox conversation · wallet escrow · Sendcloud label (best-effort) · tracking
- Success page with View Order / Open Conversation / Continue Shopping
- Sendcloud webhook → shipping status updates

## Not in scope

- Checkout UI redesign
- Wallet / Orders / Inbox UI changes
- Freeze (requires full QA)
