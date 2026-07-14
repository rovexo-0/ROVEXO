# Checkout v1.0 — UI Freeze

| Field | Value |
|-------|-------|
| Module | Checkout |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Canonical status | `CANONICAL_FROZEN_v1.0` |
| Frozen | `CHECKOUT_CANONICAL_FROZEN = true` |
| DOM | `data-checkout-freeze="FROZEN"` · `data-checkout-version="v1.0"` |
| Spec | `docs/modules/checkout/MASTER_UI_SPECIFICATION.md` |
| Freeze constant | `lib/checkout/freeze.ts` |
| Cursor rule | `.cursor/rules/checkout-v1-freeze.mdc` |

## Immutable reference

- Entry: Buy Now → `/checkout/[listingSlug]` (no cart intermediate)
- Shell: `CheckoutWizardV1` + `styles/rovexo/checkout-v1.css`
- Payment: Wallet `/wallet/payment-methods` SSOT + Stripe Checkout
- Shipping: Sendcloud via Shipping Engine only
- Post-pay: order · inbox conversation · wallet escrow · Sendcloud label/webhook
- Success: `/checkout/[listingSlug]/success` (paid statuses only)

## Post-freeze

No structural UI modifications under Checkout v1.0.  
Ship deltas as Checkout **v1.1** only.
Bug fixes that preserve layout/copy structure remain allowed.
