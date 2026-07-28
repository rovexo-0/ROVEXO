# ROVEXO — Official Owner Preview (Policy v3.0)

**STATUS: LOCKED · Owner Preview Policy v3.0**  
**Official Owner URL:** https://www.rovexo.co.uk  
**Cursor local (agent only — never Owner approval):** http://localhost:3010  
**Deprecated:** https://preview.rovexo.co.uk (DNS failure)

SSOT: `lib/preview/owner-preview-ssot.ts` · rules: `owner-preview-policy-v3.mdc`

## Absolute Authority rule

```
ONE PROJECT
+ ONE OFFICIAL OWNER URL
+ ONE PERMANENT DOMAIN
+ ALL MODULES UNDER SAME ORIGIN
= APPROVED (after Owner mobile + desktop test)
```

## Workflow

```
DEVELOP (Cursor)
  ↓
localhost:3010 (agent hot reload only)
  ↓
Owner-authorized update live on https://www.rovexo.co.uk/<path>
  ↓
OWNER REVIEW on phone + desktop (same URL)
  ↓
FIX → OWNER REVIEW → FIX → …
  ↓
FREEZE (Owner)
  ↓
COMMIT / PUSH / DEPLOY (only with Owner stage approval)
```

## Auto-sync

| Surface | What updates it |
|---------|-----------------|
| `localhost:3010` | Cursor save / Next hot reload (immediate) — **not** Owner approval |
| `https://www.rovexo.co.uk` | Owner-authorized production/main deploy — **sole Owner testing URL** |

Forbidden: disposable Vercel commit URLs, `npx vercel` for Owner review, rotating links, localhost for Owner approval.

## Verify

```bash
ROVEXO_DEV_PREVIEW_URL=https://www.rovexo.co.uk npm run verify:dev-preview
```

## Owner routes (examples)

- https://www.rovexo.co.uk/
- https://www.rovexo.co.uk/account
- https://www.rovexo.co.uk/account/settings
- https://www.rovexo.co.uk/balance
- https://www.rovexo.co.uk/wallet
- https://www.rovexo.co.uk/wallet/transactions
- https://www.rovexo.co.uk/wallet/payment-methods
- https://www.rovexo.co.uk/wallet/bank-accounts
- https://www.rovexo.co.uk/orders
- https://www.rovexo.co.uk/checkout
- https://www.rovexo.co.uk/sell
- https://www.rovexo.co.uk/inbox
- https://www.rovexo.co.uk/saved
- https://www.rovexo.co.uk/search
