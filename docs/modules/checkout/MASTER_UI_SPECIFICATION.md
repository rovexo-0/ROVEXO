# ROVEXO Checkout — Master UI Specification

**Status:** **FROZEN** — `CANONICAL_FROZEN_v1.0`  
**Markers:** `data-checkout-freeze="FROZEN"` · `data-checkout-version="v1.0"`  
**SSOT:** `CheckoutWizardV1` + `styles/rovexo/checkout-v1.css`  
**Freeze:** `lib/checkout/freeze.ts` · `docs/modules/checkout/UI_FREEZE.md`

## Universal UI v1.1 compatibility amendment

Approved 2026-07-15. Checkout behavior, routes and payment contracts remain frozen. Presentation now consumes Universal UI v1.1: 60px header, 44px back target, 24px icon, 48px CTA, 14px controls/cards, 16px inner padding, 24px section rhythm and 14px body text. Bottom navigation remains hidden throughout checkout.

## Routes

| Route | Purpose |
|-------|---------|
| `/checkout` | Redirects to `/cart` when no listing context |
| `/checkout/[slug]` | Canonical checkout summary (Confirm & Pay) |
| `/checkout/[slug]/address` | Delivery address + method |
| `/checkout/[slug]/payment` | Payment method selection (Wallet SSOT) |
| `/checkout/[slug]/review` | Alias of summary |
| `/checkout/[slug]/success` | Post-pay success (paid orders only) |
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

## Post-pay (locked behaviour)

Order · Inbox conversation · Wallet escrow · Sendcloud label (best-effort) · webhook status updates · success CTAs

## Post-freeze

No structural UI changes under v1.0. Enhancements ship as **Checkout v1.1**.
