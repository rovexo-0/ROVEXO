# ROVEXO_PRODUCTION_RELEASE_CERTIFICATION_RC2.md

**STATUS:** RELEASE CANDIDATE CLOSURE · RC1 → RC2 · FINAL PRODUCTION GATE · EVIDENCE  
**DATE:** 2026-08-03  
**BASELINE:** `ROVEXO_PRODUCTION_RELEASE_CERTIFICATION_RC1.md`  
**SECURITY:** `ROVEXO_PRODUCTION_SECURITY_FINAL_CERTIFICATION.md` → **Production Security Ready = YES**  
**GLOBAL PRODUCTION FREEZE:** ACTIVE  
**CONSTRAINTS:** Blocker remediation only · **NO COMMIT · NO PUSH · NO DEPLOY**  
**OFFICIAL HOST:** `https://www.rovexo.co.uk`

---

## Final Verdict

```
PRODUCTION RELEASE READY = NO
```

---

## Scorecard

| Gate | Verdict |
|------|---------|
| Security Certification | **PASS** |
| B2.1 Checkout | **FAIL** (Owner gate) |
| B12.1 Unit test failures | **PASS** (fixed + verified) |
| B12.2 Playwright | **FAIL** (OS shared libraries) |
| B5.1 Lighthouse (fresh) | **FAIL** (Chrome cannot launch) |
| B7.1 Mobile | **FAIL** (blocked by B12.2) |
| B8.1 Desktop | **FAIL** (blocked by B12.2) |
| B2.2 / B3.1 Buyer/Seller journeys | **FAIL** (no authenticated E2E evidence) |
| TypeScript | **PASS** |
| ESLint | **PASS** (0 errors) |
| Unit / integration (`test:ci`) | **PASS** (592 files) |
| Build | **PASS** (prior same-day production build) |

---

## B12.1 — Failed tests — **PASS**

### Test 1 — taxonomy pillows

| Field | Value |
|-------|--------|
| Test Name | `loads category-scoped materials for pillows` (`tests/canonical-taxonomy-v1.test.ts`) |
| Failure Reason | Expected `"Memory foam"`; product-type DB returns official `"Memory Foam"` |
| Root Cause | Test string lagged Canonical Material Registry V4 official casing |
| Regression | **NO** (data SSOT correct; assertion stale) |
| Production Impact | **NO** |
| Fix Applied | Assertion updated to `"Memory Foam"` (V4 official) |
| Evidence | `npx vitest run tests/canonical-taxonomy-v1.test.ts …` → **PASS** |

### Test 2 — product-detail rows

| Field | Value |
|-------|--------|
| Test Name | `info rows never duplicate stock; dynamic map omits empty fields` |
| Failure Reason | Expected hardcoded Fashion-root row order; Attribute Engine uses **leaf schema** (`fashion` lacks material) |
| Root Cause | Test fixture used root slug `fashion`; View Item Attribute Engine v1.0 is leaf-driven |
| Regression | **NO** (engine behaviour correct) |
| Production Impact | **NO** |
| Fix Applied | Fixture → `t-shirts` leaf; expectations match schema order; stock still omitted |
| Evidence | Same vitest run → **PASS** |

### Test 3 — sell-canonical

| Field | Value |
|-------|--------|
| Test Name | `primitives use CanonicalMenuRow — no Sell-only cards` |
| Failure Reason | Source uses `ListingAttributeRow` (Owner Attribute Design System), not string `CanonicalMenuRow` |
| Root Cause | Stale Absolute Authority string check vs frozen Listing Attribute rows (`cds-menu-row`) |
| Regression | **NO** (UI unchanged; test aligned to SSOT) |
| Production Impact | **NO** |
| Fix Applied | Test asserts `ListingAttributeRow` + still forbids `SellRowsCard` / `SellCompactRow` |
| Evidence | Same vitest run → **PASS**; full `npm run test:ci` → **592/592 files PASS** |

**Remaining Risk:** Low — test alignment only; no Sell visual change.

---

## B2.1 — Checkout certification — **FAIL**

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Evidence | Code audit (Buy Now Guard16, payment-before-order, Stripe signature + `stripe_webhook_events` idempotency, fee audit, ownership) = **engineering PASS**. Release SSOT: `docs/releases/rc1/CHECKOUT_CERTIFICATION_BLOOD_XXIII.md` + `lib/checkout/checkout-certification-rc1-v1.ts` → **`ownerCertified: false`**, **`NOT READY`**, artificial PASS forbidden. |
| Root Cause | Owner visual + Blood XXIII flag flip + non-skipped Checkout Playwright journey still required |
| Fix Applied | **None** (Owner-only; code already fail-closed) |
| Regression | N/A |
| Production Impact | **YES** — Buy/Pay release gate open |
| Remaining Risk | High until Owner certifies Checkout |

**Owner Action:** Complete Owner visual on frozen Checkout UI · run Checkout Playwright journey without skip · flip Blood XXIII Owner flags after Automatic Certification.  
**Expected Verification:** Checkout report **PASS + FREEZE** · `isCheckoutPassFreeze() === true`.

---

## B12.2 — Playwright — **FAIL**

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Evidence | Chromium downloaded (`chromium-1228`, `chromium_headless_shell-1228`). Launch fails: `libnspr4.so` / `libnss3.so` / `libasound.so.2` **not found**. Subset run: **24 failed / 1 passed** — all launch failures, not product assertions. `sudo npx playwright install-deps` → **password required** (cannot complete in this environment). |
| Root Cause | Host missing Playwright OS shared libraries (EXTERNAL / environment) |
| Fix Applied | Browsers installed to cache; OS deps **not** installable without sudo |
| Regression | N/A |
| Production Impact | **YES** for E2E release gate |
| Remaining Risk | High until deps installed |

**Owner Action:** On cert host run `sudo npx playwright install-deps chromium` (and firefox/webkit if required) · re-run full Playwright certification.  
**Expected Verification:** Playwright certification suite exit 0 · counts documented.

**Tests attempted:** `e2e/responsive.spec.ts`, `e2e/accessibility.spec.ts`, `e2e/marketplace.spec.ts` (chromium).  
**Passed:** 1 (spurious amid launch failures). **Failed:** 24 (browser launch). **Skipped:** 0.

---

## B5.1 — Lighthouse — **FAIL**

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Evidence | Fresh run attempted with Playwright Chrome path → **Unable to connect to Chrome** (same missing shared libs). Historical July reports **not reused** as PASS evidence. |
| Root Cause | Chrome headless cannot start without OS libs (same as B12.2) |
| Fix Applied | None possible without sudo |
| Regression | N/A |
| Production Impact | **YES** for Performance release criterion |
| Remaining Risk | Prior stored mobile LCP ~5s suggests ≥95 Performance target likely unmet even after Chrome works — needs fresh measure |

**Owner Action:** Install Chrome deps · generate new mobile/desktop Lighthouse for `/search` + authenticated `/` · remediate LCP if below target.  
**Expected Verification:** Fresh JSON under `test-results/rc2-lighthouse/` meeting Owner targets (Performance ≥95 · A11y ≥95 · BP ≥95 · SEO 100) **or** Owner-revised targets with evidence.

---

## B7.1 / B8.1 — Mobile & Desktop — **FAIL**

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Evidence | Blocked by B12.2 browser launch. No Chrome Android / Safari iPhone / Edge / Firefox matrix executed. |
| Root Cause | Playwright/Lighthouse environment dependency |
| Fix Applied | None |
| Regression | N/A |
| Production Impact | **YES** |
| Remaining Risk | High |

**Owner Action:** After B12.2 deps · run mobile-device + cross-browser + Owner phone/desktop visual on www.  
**Expected Verification:** Mobile PASS · Desktop PASS artefacts.

---

## B2.2 / B3.1 — End-to-end marketplace journeys — **FAIL**

| Field | Value |
|-------|--------|
| Result | **FAIL** |
| Evidence | No authenticated Buyer/Seller session available this run. Google OAuth provider probe historically PASS; MFA email cert PASS; Checkout Owner gate open (B2.1). Playwright journeys blocked (B12.2). |
| Root Cause | Missing credentials/Owner interactive session + E2E tooling blocked |
| Fix Applied | None (freeze forbids inventing logins) |
| Regression | N/A |
| Production Impact | **YES** |
| Remaining Risk | High |

**Owner Action:** Execute Buyer + Seller journeys on www (Email/Google/MFA · Buy/Checkout · Sell publish · Messages · Orders) with ownership checks.  
**Expected Verification:** Written Owner PASS + optional Playwright Full Demo certification green.

---

## Final Regression (machine)

| Gate | Result | Evidence |
|------|--------|----------|
| `npm run typecheck` | **PASS** | exit 0 |
| `npm run lint` | **PASS** | 0 errors / 31 warnings |
| `npm run test:ci` | **PASS** | **592/592** test files |
| `npm run build` | **PASS** | exit 0 earlier same day (Next 16.2.12) |
| Playwright | **FAIL** | B12.2 |
| Fresh Lighthouse | **FAIL** | B5.1 |

---

## Security (unchanged)

**PASS** — `ROVEXO_PRODUCTION_SECURITY_FINAL_CERTIFICATION.md`.

---

## Remaining verified blockers only

| ID | Severity | Evidence | Owner Action | Expected Verification |
|----|----------|----------|--------------|------------------------|
| B2.1 | Critical | Checkout SSOT **NOT READY** · Owner visual pending | Owner Checkout certification + freeze flags | Checkout PASS+FREEZE |
| B12.2 | Critical | Missing `libnspr4`/`libnss3`/`libasound` | `sudo npx playwright install-deps` + re-run E2E | Playwright PASS |
| B5.1 | High | Fresh Lighthouse cannot launch Chrome | Same deps + new LH reports | Targets met or Owner-accepted |
| B7.1 | High | Mobile E2E blocked | After B12.2 + Owner phone | Mobile PASS |
| B8.1 | High | Desktop E2E blocked | After B12.2 + Owner desktop | Desktop PASS |
| B2.2/B3.1 | High | No authenticated journey evidence | Owner Buyer/Seller journeys on www | Journey PASS |

**Closed this RC2 session:** B12.1 (all three unit failures fixed; full `test:ci` green).

**Not blockers:** Apple/Facebook OAuth (v2.0).

---

## Change Control

| Change | Purpose |
|--------|---------|
| `tests/canonical-taxonomy-v1.test.ts` | Align pillow material assertion to V4 |
| `tests/product-detail-ui-v1.test.ts` | Align row expectations to Attribute Engine leaf schema |
| `tests/sell-canonical-v1.test.ts` | Align Sell primitives assertion to ListingAttributeRow SSOT |

No application runtime/UI/business logic changes. Playwright browsers downloaded to agent cache only. **NO COMMIT · NO PUSH · NO DEPLOY.**

---

## Final Verdict (repeat)

```
PRODUCTION RELEASE READY = NO
```
