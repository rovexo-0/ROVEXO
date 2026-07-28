# ROVEXO Global Button Recovery v1.0

**STATUS:** RECOVERY IN PROGRESS · Owner verification required  
**Authority:** Absolute Authority Global Button Recovery contract  
**Type:** Smart recovery (not project revert)

## What changed

| Area | Recovery |
|------|----------|
| Primary CTA geometry | Restored Profile functional **56px / radius 16 / font 16** (removed unusable 20px) |
| Balance Withdraw | Restored **in-card** top-right position (compact white on purple) |
| Checkout CTA | Restored functional height via tokens; label **Pay Securely** |
| Back routes | Wallet children → **Balance** (`/wallet`), not Home/404 |
| Preserved | Full Width · Purple theme · Profile inheritance · Stripe · PrimaryButton SSOT · Wallet hub rows |

## What did not change

- Auth Login/Register frozen primary
- PremiumButton Visit/Follow family
- Wallet v3 architecture / Stripe integrations
- No git revert · no commit · no push · no freeze

## Verification surfaces

- `http://localhost:3010/wallet`
- `http://localhost:3010/wallet/payment-methods`
- `http://localhost:3010/wallet/bank-accounts`
- `http://localhost:3010/wallet/withdraw`
- `http://localhost:3010/wallet/transactions`
- `http://localhost:3010/orders`
- `http://localhost:3010/checkout`
- `http://localhost:3010/account`
- `http://localhost:3010/account/settings`

## Gate honesty

- Typecheck / ESLint / Vitest: run after recovery
- Playwright / Owner visual: **NOT PASS** until Owner verifies
