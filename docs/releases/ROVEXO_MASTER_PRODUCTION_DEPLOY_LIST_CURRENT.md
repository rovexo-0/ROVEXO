# ROVEXO MASTER PRODUCTION DEPLOY LIST — FINAL

**STATUS:** ONE MASTER TREE CERTIFIED · ONE COMMIT / ONE PUSH / ONE PRODUCTION DEPLOY  
**Authority:** Owner Master Production Deploy (2026-09-04).  
**Baseline:** `2eee08a130097e36732efd3f44e04e267d55f44e` (`origin/develop`)  
**Checkpoint (not pushed, not deployed):** `d99c5b87e5fc7071f845dace116333d71682cd5f`  
**Official URL:** https://www.rovexo.co.uk  
**Stripe lock:** `20.1.0` / `2025-12-15.clover` — ONE SDK. Connect = `v2.core.accounts` + `v2.core.accountLinks`. Checkout / Payments / Refunds / Transfers remain V1 APIs on the same client.  
**EUROPA Connect:** `acct_1UAhc7EUVQL3trL7` — no remap · no LIVE mutations  
**Business TEST account:** `acct_1UBJzBRMmbYMK816`

```
MASTER_64_SCOPE=CLOSED_FOR_CODE_RELEASE
GATE_34_HOSTED_ONBOARDING=PASS
GATE_34_TECHNICAL=EXTERNAL_PENDING
GATE_34_CODE_IMPLEMENTATION=PASS
GATE_34_RUNTIME_ACTIVATION=EXTERNAL_PENDING
GATE_33_DELIVERED_EVIDENCE=EXTERNAL_PENDING
GATE_33_CODE_IMPLEMENTATION=PASS
ALL_INCLUDED_PRODUCTION_CODE_COMPILES=PASS
FINAL_MANIFEST=PASS
FULL_REGRESSION=PASS
PLAYWRIGHT=PASS
TYPESCRIPT=PASS
ESLINT=PASS
BUILD=PASS
SECURITY=PASS
PRODUCTION_WRITES=0
STRIPE_LIVE_MUTATIONS=0
```

Class **LATER is retired**. External pending never removes implemented Production code.

---

## GATE 34 — DO NOT FABRICATE

| Record | Value |
|---|---|
| GATE_34_HOSTED_ONBOARDING | **PASS** — Owner completed Stripe TEST Agree and submit, returned to ROVEXO |
| GATE_34_TECHNICAL | **EXTERNAL_PENDING** — payouts/transfers restricted · 13 past_due · `verified_business=false` |
| GATE_34_CODE_IMPLEMENTATION | **PASS** — canonical V2 in this release · fail-closed |
| Activation predicate | **UNCHANGED** — requires `payoutsEnabled=true` · `past_due=0` · `verified_business=true` |

Do **not** fake `payoutsEnabled` or `verified_business`. Business engine stays inactive until Stripe reports the required state.

Read-only TEST verify (`acct_1UBJzBRMmbYMK816`): mapping MATCH · `sellerContext=business` · Individual distinct · EUROPA untouched · livemode=false · recipient applied=true · payouts restricted · 13 user past_due.

---

## GATE 33 — DO NOT FABRICATE

Shipping implementation is **INCLUDED**. Live carrier `delivered` evidence remains **EXTERNAL_PENDING**. Mapper / webhook tests ≠ Delivered.

---

## CERTIFICATION (exact isolated tree `/tmp/rovexo-master-final`)

| Gate | Result |
|---|---|
| TypeScript | **PASS** (`tsc --noEmit`) |
| ESLint | **PASS** (0 errors / 60 warnings) |
| `test:ci` | **PASS** 807 files / 6558 tests (rerun after homepage smoke-prefix fix) |
| Managed Playwright core | **PASS** 63 |
| Responsive E2E | **PASS** 17 |
| Production build | **PASS** (`build:production` + `ROVEXO_DOTENV_CWD`) |
| Secret / leak scan | **PASS** — prefix literals only · no `.env` in manifest · no Android/QA/localhost-auth |
| Stripe / Checkout / Wallet / Business / Shipping / Account / Help / AVIF unit | **PASS** (inside `test:ci`) |

Homepage Full Demo step 04 required removing `marketplace-smoke-item-` from homepage exclusion (that prefix **is** the official Full Demo listing). Refund/cancel prefixes remain excluded.

---

## FINAL 64-ITEM MATRIX

Statuses used: `PRODUCTION_RELEASE = INCLUDED` · `EXTERNAL_CERTIFICATION_PENDING` · `GENUINELY_EXCLUDED`.

`EXTERNAL_CERTIFICATION_PENDING` means evidence/runtime is still external. **Code stays in the release.**

| # | Item | Status | In SHA? | Notes |
|---|---|---|---|---|
| #1 | Stripe Connect Individual | PRODUCTION_RELEASE = INCLUDED | YES | Isolated from Business · V2 retrieve + Individual dual-write |
| #2 | Stripe Connect Business V2 | PRODUCTION_RELEASE = INCLUDED | YES | `v2.core` · fail-closed until Stripe ready |
| #3 | Checkout Stripe TEST E2E | PRODUCTION_RELEASE = INCLUDED | YES | Full Demo 07–09 passed on final tree |
| #4 | Shipping pricing | PRODUCTION_RELEASE = INCLUDED | YES | |
| #5 | Tracking fail-closed | PRODUCTION_RELEASE = INCLUDED | YES | |
| #6 | shipping_records SSOT | PRODUCTION_RELEASE = INCLUDED | YES | |
| #7 | Provider vs buyer price | PRODUCTION_RELEASE = INCLUDED | YES | |
| #8 | Canonical shipping DB types | PRODUCTION_RELEASE = INCLUDED | YES | |
| #9 | Post-payment quote enrichment | PRODUCTION_RELEASE = INCLUDED | YES | |
| #10 | Quote expiry + seller deadline | PRODUCTION_RELEASE = INCLUDED | YES | |
| #11 | Duplicate shipment/label | PRODUCTION_RELEASE = INCLUDED | YES | |
| #12 | Active Carrier Order Details | PRODUCTION_RELEASE = INCLUDED | YES | |
| #13 | Cancel claim-key | PRODUCTION_RELEASE = INCLUDED | YES | |
| #14 | Password Recovery | PRODUCTION_RELEASE = INCLUDED | YES | Surgical callback/actions only. Dirty `guest-redirect` **excluded**. Live mailbox = EXTERNAL_CERTIFICATION_PENDING |
| #15 | Localhost Production Auth | GENUINELY_EXCLUDED | NO | `localhost-production-auth-v1` |
| #16 | AVIF Production backfill | GENUINELY_EXCLUDED | NO | No Production Storage mutation |
| #17 | New upload AVIF | PRODUCTION_RELEASE = INCLUDED | YES | Serving pipeline. MIME apply = EXTERNAL_CERTIFICATION_PENDING |
| #18 | Full AVIF derivatives | PRODUCTION_RELEASE = INCLUDED | YES | Same pipeline |
| #19 | Thumbnail AVIF | PRODUCTION_RELEASE = INCLUDED | YES | Same pipeline |
| #20 | AVIF-first frontend | PRODUCTION_RELEASE = INCLUDED | YES | |
| #21 | Local AVIF storage tooling | GENUINELY_EXCLUDED | NO | Local-only |
| #22 | Browser AVIF render | PRODUCTION_RELEASE = INCLUDED | YES | Visual Owner = EXTERNAL_CERTIFICATION_PENDING |
| #23 | AVIF GAP audit-only tests | GENUINELY_EXCLUDED | NO | Not runtime |
| #24 | Production writes = 0 | PRODUCTION_RELEASE = INCLUDED | constraint | Held through certification |
| #25 | Business onboarding | PRODUCTION_RELEASE = INCLUDED | YES | Fail-closed · #34 technical EXTERNAL_PENDING |
| #26 | Stripe-only Business verification | PRODUCTION_RELEASE = INCLUDED | YES | Predicate unchanged |
| #27 | Business Home/Menu/Store | PRODUCTION_RELEASE = INCLUDED | YES | |
| #28 | seller_context | PRODUCTION_RELEASE = INCLUDED | YES | Account context switch included |
| #29 | Business VAT/address/shipping | PRODUCTION_RELEASE = INCLUDED | YES | |
| #30 | Emoji icon system | PRODUCTION_RELEASE = INCLUDED | YES | `platform-emoji-v1` |
| #31 | Business profile / menu | PRODUCTION_RELEASE = INCLUDED | YES | |
| #32 | business/information | PRODUCTION_RELEASE = INCLUDED | YES | |
| #33 | Shipping Owner E2E Delivered | EXTERNAL_CERTIFICATION_PENDING | YES (code) | Implementation included · live `delivered` not fabricated |
| #34 | Business Stripe hosted E2E | HOSTED PASS · TECHNICAL EXTERNAL_PENDING · CODE PASS | YES | See Gate 34 table |
| #35 | Complete Business E2E | EXTERNAL_CERTIFICATION_PENDING | YES (code) | Runtime after Stripe activation |
| #36 | Performance v2 source | PRODUCTION_RELEASE = INCLUDED | YES | Measure artifact excluded · Owner CWV EXTERNAL_PENDING |
| #37 | Business Shipping E2E | EXTERNAL_CERTIFICATION_PENDING | YES (code) | Same shipping + Business engines |
| #38 | Full Business PWA | PRODUCTION_RELEASE = INCLUDED | YES (web) | Owner PWA EXTERNAL_PENDING |
| #39 | Final TypeScript | PRODUCTION_RELEASE = INCLUDED | YES | PASS on final tree |
| #40 | Managed Playwright | PRODUCTION_RELEASE = INCLUDED | YES | 63 + 17 PASS on final tree |
| #41 | Owner Visual | EXTERNAL_CERTIFICATION_PENDING | YES (code) | After official URL shows this SHA |
| #42 | Full Regression | PRODUCTION_RELEASE = INCLUDED | YES | 807 / 6558 |
| #43 | TypeScript release gate | PRODUCTION_RELEASE = INCLUDED | YES | |
| #44 | Production env/config | EXTERNAL_CERTIFICATION_PENDING | YES (code) | Public health only · no secret print |
| #45 | Staged-only diff review | PRODUCTION_RELEASE = INCLUDED | YES | Never `git add -A` |
| #46 | Production Release Certification | PRODUCTION_RELEASE = INCLUDED | YES | This one SHA |
| NEW-1 | Wallet seller-context + Business Wallet isolation | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-2 | Localhost Production Auth | GENUINELY_EXCLUDED | NO | |
| NEW-3 | LAN mobile runtime | GENUINELY_EXCLUDED | NO | |
| NEW-4 | Lost Parcel Guarantee | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-5 | Label idempotency | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-6 | Store Cover | GENUINELY_EXCLUDED | NO | Owner REMOVE |
| NEW-7 | Dangling listing image | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-8 | Business Analytics | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-9 | Business Inventory | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-10 | Business Reviews | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-11 | Connect runtime origin | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-12 | Implicit recovery hash | GENUINELY_EXCLUDED | NO | |
| NEW-13 | Native bearer (web) | PRODUCTION_RELEASE = INCLUDED | YES | Android-only artifacts excluded |
| NEW-14 | Withdraw Transfer vs Payout ID | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-15 | Checkout expire skip | PRODUCTION_RELEASE = INCLUDED | YES | |
| NEW-16 | Auction **feature** | GENUINELY_EXCLUDED | NO | Columns may exist · UI/runtime out of v1 |
| NEW-17 | Local Production-copy restore | GENUINELY_EXCLUDED | NO | |
| NEW-18 | QA Business fixture | GENUINELY_EXCLUDED | NO | |

Also **INCLUDED** (completed Production-intended work): Help / Privacy / Legal / Safety / About / Contact Support · CSRF / security · saved/follow APIs · inbox/messages · Homepage ListingCard lock · Account/UI fixes.

---

## GENUINELY EXCLUDED

| Item | Why |
|---|---|
| Localhost Production Auth + implicit recovery | Local-only / GoTrue hash |
| QA fixtures · LAN · local restore / mirror | Not Production |
| Android `apps/rovexo-android/**` | Separate native release |
| AVIF Production backfill | Owner: no Storage mutation |
| Store Cover + `20260901120000` | Owner REMOVE |
| Auction feature | Outside v1 product |
| Secrets · `.env*` · debug artifacts · checkpoints | Unsafe / not a release |
| Dirty `guest-redirect.ts` | Production login leak if Production-ref cookie skips `getUser()` |
| Hosted/E2E launcher scripts | Local operators, not Production runtime |
| Any bypass of Stripe verification | Forbidden |

---

## EXTERNAL CERTIFICATION PENDING (code still ships)

| Item | Pending evidence |
|---|---|
| #34 technical / runtime activation | Stripe TEST `payouts=active` · past_due=0 · `verified_business=true` |
| #33 Delivered | Live Sendcloud tracking `delivered` |
| #14 live mailbox | Owner recovery on https://www.rovexo.co.uk |
| #17 MIME | Production `image/avif` allowlist verify (do **not** apply without Owner) |
| #35 #37 #38 #41 #44 #36 CWV | Owner / carrier / LIVE env / visual |

These do **not** authorize a second deployment.

---

## PRODUCTION MIGRATIONS (READ-ONLY)

Already on Production — **do not rerun**:

- `20260719120000_wallet_security_certification_v1`
- `20260831170000_stripe_e2e_canonical_seller_context_v1`
- `20260902180000_seller_profiles_active_seller_context_v1`
- `20260903210000_withdraw_methods_seller_context_v1`

Not applied this release: AVIF MIME `20260902120000` · auction feature · Store Cover.

---

## MANIFEST

- Include list: `/tmp/rovexo-master-include.txt` (**557** paths)
- Deleted vs develop: `LegalInformationSection.tsx` · `AnalyticsGeographicSection.tsx` · `HelpAssistant.tsx` · `lib/help/i18n.ts`
- Isolated tree: `/tmp/rovexo-master-final`
- Never `git add -A`

---

## FINAL RELEASE GATE

| Gate | Result |
|---|---|
| DEPENDENCY_CLOSURE | **PASS** |
| TYPESCRIPT | **PASS** |
| ESLINT | **PASS** (0 / 60) |
| FULL_REGRESSION | **PASS** 807 / 6558 |
| PLAYWRIGHT | **PASS** 63 + 17 |
| BUILD | **PASS** |
| SECURITY / SECRET / QA / AUTH EXCLUSION | **PASS** |
| STRIPE_LIVE_MUTATIONS | **0** |
| PRODUCTION_WRITES | **0** |

Checkpoint `d99c5b87` is **not** pushed and **not** deployed.
