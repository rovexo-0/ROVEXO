# ROVEXO v1.0 — Complete Financial Report

**Status:** CERTIFIED (Vitest + contract surfaces)  
**Scope:** Final Preview — not production money paths for demo accounts

## Balances (user-facing)

| Concept | Meaning | Certified |
|---------|---------|-----------|
| Pending | Funds held / not yet withdrawable | YES |
| Available | Withdrawable balance | YES |
| Withdraw | Bank payout request path | YES |
| Refund | Buyer refund contract | YES |
| Escrow | Marketplace hold until release rules | YES |

## Platform economics

- Platform fee: **5.5%** (contract tests)
- Currency active: **GBP only**
- Demo wallets: virtual floor protected; no real Stripe/Sendcloud for Full Demo accounts

## Integrations (contracts present)

| System | Role | Preview certification |
|--------|------|------------------------|
| Stripe | Payments / webhooks / CSP | PASS (Vitest) |
| Sendcloud | Labels / tracking webhooks | PASS (Vitest) |
| Wallet UI | Pending / Available / Withdraw | PASS |
| UK bank validation | Sort code + account number | PASS |

## Transparency rule (WOW)

Users must see where money is without documentation.  
Hub labels and wallet rows remain standard language — no marketing gloss.

## Limitations

- Live Stripe/Sendcloud production money not exercised in this preview gate.
- Admin financial E2E suites skipped without service role (policy).
