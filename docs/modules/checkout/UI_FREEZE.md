# Checkout UI Freeze — CHECKOUT_UI_v1.0

| Field | Value |
|-------|-------|
| Freeze name | `CHECKOUT_UI_v1.0` |
| Module | Checkout (presentation only) |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Owner | **APPROVED** |
| Date | **2026-07-25** |
| SSOT | `lib/checkout/checkout-ui-v1-freeze.ts` |
| Companion | `lib/checkout/freeze.ts` |
| DOM | `data-checkout-freeze="CHECKOUT_UI_v1.0"` · `data-checkout-ui="v1.0"` · `data-checkout-version="v1.0"` |
| Spec | `docs/modules/checkout/MASTER_UI_SPECIFICATION.md` |
| Cursor rule | `.cursor/rules/checkout-ui-v1-freeze.mdc` |

## Frozen scope

Checkout Layout · Product Card · Address Card · Delivery Option · Delivery Details · Contact Details · Payment Section · Price Summary · PAY Button · Secure Checkout Footer · Typography · Card Radius · Padding · Margins · Spacing · Visual Density · Responsive · Mobile · Visual Hierarchy

## Locked — no change without Owner approval

Visual redesign · spacing · padding · margin · card height · typography · button position · component order · visual polishing · UI refactoring

## Not included

Payment Completion · Stripe Success · Order Engine · Transaction Engine · Escrow · Shipping · Print Label · Tracking · Delivery · Review · Seller Flow · Backend Logic · Business Rules

## Canonical surfaces

- `features/checkout/components/CheckoutWizardV1.tsx`
- `styles/rovexo/checkout-v1.css`
- `features/checkout/components/CheckoutProductSummary.tsx`
- `features/checkout/components/CheckoutPriceSummary.tsx`
- `features/checkout/components/CheckoutPageHeader.tsx`

## Post-freeze

Checkout **UI** is LOCKED + FROZEN + OWNER APPROVED.  
Backend / payment / order work may continue only if frozen visuals are untouched.
