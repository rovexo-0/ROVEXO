# ROVEXO v1.0 — Launch Ready Certification Maps

**STATUS:** **FAIL** — Master Preview refresh pending after this push; live Full Demo E2E + Product Owner visual approval still required for PASS.

**STOP CONDITION:** Master Preview only — no Production / Google Play / App Store deploy

## Master Preview URL (canonical)

| Property | Value |
|----------|--------|
| Permanent Preview | https://rovexo-git-develop-rovexo.vercel.app |
| Branch | `develop` |
| Environment | Vercel Preview |
| Production | **FORBIDDEN** until Launch Ready PASS + PO approval |

## Demo accounts (permanent)

| Account | Email |
|---------|--------|
| Buyer | `demo.buyer@rovexo.co.uk` |
| Seller | `demo.seller@rovexo.co.uk` |

---

## Launch Ready gate scorecard

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| Production build | PASS |
| Unit menu/legal/cart tests | PASS |
| Live `certify:predeploy` seed+E2E | **BLOCKED / PENDING** (needs Supabase Preview env) |
| Responsive visual suite | **PENDING** PO |
| UK Legal SSOT + aliases | PASS (22 docs + gdpr/accessibility/dmca/etc.) |
| Master shell commerce paths | PASS (Cart, Order detail, Tracking, Review, Compliance, Wallet txn) |
| One Entry Point polish | PASS (Wallet≠Payouts; Help≠Legal duplicates) |
| App Store test (1.7M) | **FAIL** until live E2E + PO visual |

**Binary verdict: LAUNCH READY FAIL** (honest — do not ship).
