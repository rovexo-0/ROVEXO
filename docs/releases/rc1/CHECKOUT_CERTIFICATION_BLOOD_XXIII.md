# ROVEXO RC1 — Checkout Certification Report (Blood XXIII)

**Agent:** AGENT 1 — Blocker Elimination  
**SSOT:** `lib/checkout/checkout-certification-rc1-v1.ts`  
**Blockers SSOT:** `lib/checkout/checkout-certification-blockers-rc1-v1.ts`  
**Final verdict:** **NOT READY** (no artificial PASS + FREEZE)

---

## INFRA-001 (Development Runtime)

| | |
|---|---|
| Status | **RESOLVED** — clean runtime recovered |
| Cause | Turbopack persistence vs concurrent `.next` wipe (not app / not HMRC) |
| Evidence | `docs/releases/rc1/evidence/infra-001/INFRA-001.md` |
| Playwright post-recovery | Suite runs without Compaction/SST ENOENT; **6 skipped** (journey not executed — skip ≠ PASS) |
| HMRC | Unaffected |

---

## Engineering quality (unchanged PASS)

| Phase | Gate |
|-------|------|
| Architecture | PASS |
| Functional | PASS |
| Payment | PASS |
| Data Integrity | PASS |
| Security | PASS |
| Regression | PASS |
| Engineering | PASS |

Vitest Checkout/runtime suite maintained green after CKT-002.

---

## Blocker elimination log

### BLOCKER 1 — Owner certification flags
| | |
|---|---|
| Root cause | Intentional release metadata. `resolveBloodXxiiiPermanentFreeze` requires Owner + Automatic + complete100 — not Vitest alone. |
| Fix | **None (correct).** Do not hardcode `ownerCertified` / `permanentlyFrozen` / `complete100`. |
| Recommendation | Flip only after Owner Certification PASS. |
| Status | OWNER_MANUAL_GATE — remains open |

### BLOCKER 2 — End-to-end Buy flow
| | |
|---|---|
| Root cause | Dedicated Playwright Checkout journey was missing (Full Demo covered API path only). |
| Fix | Added `e2e/checkout-blood-xxiii-certification.spec.ts` (Product → Buy Now → Checkout UI → virtual Confirm & Pay → duplicate → done-ready → Hub). |
| Verification | Post–INFRA-001: Playwright exit 0 on clean production webServer; **6/6 skipped** (not executed). Admin skip-RCA probe declined. |
| Status | RUNTIME_RECOVERED · JOURNEY_EVIDENCE_INCOMPLETE |

### BLOCKER 3 — Owner visual certification
| | |
|---|---|
| Root cause | Owner product visual gate — cannot be auto-passed. |
| Prep | CHECKOUT_UI_v1.0 freeze surface; no redesign. Checklist in blockers SSOT. |
| Owner URL | After Buy Now: `/checkout/[slug]?cs=…` on https://www.rovexo.co.uk (Owner) / `http://localhost:3000` (agent). |
| Status | PREPARED_FOR_OWNER_REVIEW |

### BLOCKER 4 — Runtime proof
| Behaviour | Expected | Observed | Status |
|-----------|----------|----------|--------|
| Duplicate click | One in-flight pay | `isSubmitting` + **`submittingLockRef`** (CKT-002) | FIXED |
| Refresh | Reopen with `cs` | Session reuse / load gate | CODE_EVIDENCED |
| Back | No new payment | cancel_url + open Stripe reuse | CODE_EVIDENCED |
| Expired | Error, no order | `Payment session expired.` | CODE_EVIDENCED |
| Cancelled | Return cancel_url | Wired on Stripe create | CODE_EVIDENCED |
| Repeat after success | Same order | `status === paid` short-circuit | CODE_EVIDENCED |

### BLOCKER 5 — Stripe Payment Intent
| Stage | Behaviour |
|-------|-----------|
| Buy Now | **Intentional shell** `pi_pending_*` / `pi_virtual_*` / `pi_dev_*` — binding only |
| Confirm & Pay | `stripe.checkout.sessions.create` + `payment_intent_data` + idempotency `cs-checkout-{id}` |
| PI created | By Stripe when Checkout Session is created |
| Duplicate | Stripe idempotency + paid short-circuit + client lock |
| Order | After paid / virtual settle → `createOrderFromPaidCheckoutSession` |
| Failure | Public Sorry copy · expire destroy · virtual debit fail cancels |

**RC1 position:** Shell at Buy Now is **intentional**. Live hosted Stripe card E2E on production keys = Owner ops evidence.

---

## Defects this Agent

| ID | Status |
|----|--------|
| CKT-001 Guard16 soft-true | FIXED (prior) |
| CKT-002 Double-submit race | **FIXED** (`submittingLockRef`) |

---

## Remaining for PASS + FREEZE

1. Obtain non-skipped Playwright Blood XXIII journey (resolve precondition skip — likely no active Full Demo listing or worker env)  
2. Owner visual sign-off on frozen Checkout UI  
3. Owner flips Blood XXIII flags after Automatic Certification  

**PASS + FREEZE:** **NO**  
**INFRA-001:** resolved (does not alone unlock PASS + FREEZE)  
**HMRC:** unaffected by INFRA-001; RC1 sequencing still Owner-controlled
