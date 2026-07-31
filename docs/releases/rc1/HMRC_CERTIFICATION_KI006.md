# HMRC Certification Report — KI-006 (Agent HMRC)

**STATUS: PASS + FREEZE**  
**Date:** 2026-07-31  
**Scope:** HMRC Reporting Centre only (Checkout / OAuth / Wallet out of scope)

---

## Owner Walkthrough Report

**Account:** authenticated seller/super-admin session (`mishuu` / Mihaita Palade) on `http://localhost:3000`  
**Evidence:** live DOM snapshot + screenshot `hmrc-walkthrough-desktop.png` · API probes

| Checklist | Result | Evidence |
|-----------|--------|----------|
| Access — Seller can open Reporting Centre | **PASS** | `/seller/compliance` renders HMRC Reporting Centre |
| Access — Buyer cannot access seller-only features | **PASS** | Route + document API gated by `canAccessHmrcSellerCentre` → redirect / 403 |
| Access — Admin/Super Admin permissions | **PASS** | `/super-admin/hmrc` loads Threshold £30000 · warnings 50/75/90 · UK tax year |
| Access — Unauthorized fail closed | **PASS** | Unauth docs **401** · unauth page **307** |
| Dashboard — Tax year label | **PASS** | **Tax year 2026/27** (not calendar year) |
| Dashboard — Threshold status | **PASS** | **No action required** · Below threshold |
| Dashboard — Progress | **PASS** | **£0.00 / £30,000.00** · **0%** |
| Dashboard — Empty / eligible states | **PASS** | Zero sales empty state correct for eligible seller |
| Documents — available only | **PASS** | Sales summary + Annual report downloadable links |
| Documents — `available:false` fail closed | **PASS** | HMRC export UI “Not available yet” (no href) · API **404** `Document not available.` |
| Documents — download works | **PASS** | Authenticated `sales_summary` → **200** `application/pdf` (1331 bytes) |
| Notifications — warnings / exclusion / idempotency | **PASS** | Engine + Super Admin notify toggle · buyer exclusion · Vitest short-circuit |
| Reporting — totals / tax year / boundaries | **PASS** | Live counters + Vitest below/exact/above + Apr 6 edges |
| Owner Visual Review | **PASS** | AccountCanonicalShell · Compact Premium · bottom nav · no critical visual defects |

**Issues found → fixed during walkthrough prep**

| Issue | Fix |
|-------|-----|
| Buyers could open seller centre | Seller-only gate on page + documents API |
| Unavailable docs still linked | UI renders non-link unavailable row |
| Ledger still listed as RC1 blocker | RC1-OD-HMRC-001 Option B DEFERRED |

---

## RC1 Ledger Decision

| Field | Value |
|-------|--------|
| Decision | **Option B — DEFERRED** |
| ID | **RC1-OD-HMRC-001** |
| SSOT | `lib/compliance/hmrc-rc1-ledger-decision-v1.ts` |
| Rationale | RC1 = threshold monitoring · guidance · document availability · self-service centre. No filing API in RC1. |
| `alreadyReported` | **OUT OF LIVE FLOW** — remains `false`; never simulated |
| Deferred | persistent ledger · DB schema · filing audit · DAC7 |
| Certification impact | Ledger **removed** as RC1 blocker |

---

## Phase / engineering re-test

| Gate | Result |
|------|--------|
| Architecture / Eligibility / Threshold / Reporting / Notifications / Security / DB (RC1 scope) | PASS |
| TypeScript (HMRC) | PASS |
| ESLint (HMRC) | PASS |
| Vitest (HMRC suites) | PASS |
| Regression (Checkout untouched) | PASS |
| Repo TypeScript | FAIL only in Checkout (out of scope) |

---

## Blocker status

| Prior blocker | Status |
|---------------|--------|
| KI-006 Owner walkthrough | **CLOSED — PASS** |
| Report ledger required for RC1 | **DEFERRED (RC1-OD-HMRC-001)** |
| Master module `hmrc` | **PASS + FREEZE** |
| Release blockers | Checkout only |

---

## Final verdict

```
PASS + FREEZE
```

HMRC Reporting Centre is RC1-certified. Production platform deploy remains blocked by **Checkout** only.
