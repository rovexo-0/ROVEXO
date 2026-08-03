# MFA_LIVE_CERTIFICATION.md

**TITLE:** MFA LIVE PRODUCTION CERTIFICATION  
**DATE:** 2026-08-02  
**HOST:** `http://localhost:3000`  
**SUPABASE:** `pklotmwxtnnepaitedic`  
**MODE:** Evidence only · No code changes · No DB schema changes · No new migrations · No SQL changes · No refactoring · No commits · No push · No Preview · No Production  
**PREREQUISITE:** `MFA_MIGRATION_CERTIFICATION.md` → **MFA MIGRATION = PASS**

---

## FINAL STATUS

| Axis | Result |
|---|---|
| Implementation | **PASS** |
| Configuration | **PASS** |
| Live Certification | **FAIL** |
| Security Certification | **FAIL** |
| Production Ready | **NO** |

### Remaining blockers (ONLY)

1. Owner live **Google OAuth → MFA challenge → TOTP verify → authenticated session → logout** evidence (interactive IdP).
2. Owner live **Google OAuth → Recovery Code → authenticated session** evidence.
3. **Playwright MFA certification suite** (Desktop Chromium + Mobile Chromium) — suite does not exist; zero `e2e/*mfa*` specs; cannot PASS without a complete run + failure screenshots policy.

---

## Evidence artefacts

| Artefact | Result |
|---|---|
| `test-results/mfa-live-cert-evidence.json` | **29/29 steps PASS**, `errors: []` |
| `MFA_MIGRATION_CERTIFICATION.md` | **PASS** (`public.mfa_recovery_codes` live) |
| Post-run DB probe | `mfa_recovery_codes` count **0**; demo.buyer factors **[]** (cleaned) |
| Unit | `npx vitest run tests/mfa-totp-v1.test.ts` → **5/5 PASS** |
| Host | `GET /login` → **200**; `GET /api/auth/mfa/status` (unauth) → **401** |
| Google provider probe | `signInWithOAuth({ provider:'google', skipBrowserRedirect:true })` → URL host `pklotmwxtnnepaitedic.supabase.co`, **no error** |
| Playwright MFA | `find e2e -iname '*mfa*'` → **empty**; `rg` MFA paths in `e2e/` → **no matches** |

Account used for live API/SDK flows: `demo.buyer@rovexo.co.uk` (Full Demo). MFA factors and recovery rows removed after certification (`final_cleanup_no_factors: count 0`).

---

## 1. Email Login + MFA — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Email login | PASS | `login` ok · cookies: 2 |
| Password verification | PASS | `signInWithPassword` succeeded; AAL methods include `password` |
| MFA challenge displayed | PASS | `email_relogin_aal1_needs_aal2` · `currentLevel=aal1` `nextLevel=aal2` · `GET /login/mfa` → **200** · `/account` → **307** `/login/mfa?next=%2Faccount` |
| TOTP accepted | PASS | `sdk_challenge` + `sdk_verify_totp` ok |
| Authenticated session | PASS | `aal2_after_verify` · `currentLevel=aal2` · methods include `totp` · `GET /account` → **200** |
| Logout | PASS | `logout` ok · cleanup left **0** factors |

**WARNING:** none  
**FAIL:** none

---

## 2. TOTP Lifecycle — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Enroll | PASS | `POST /api/auth/mfa/enroll` → **200** |
| Secret generation | PASS | `hasSecret: true` |
| QR generation | PASS | `hasQr: true` |
| Authenticator pairing | PASS | `verify_enrollment` → `enabled: true` with live TOTP |
| Challenge | PASS | `sdk_challenge` ok |
| Verification | PASS | `sdk_verify_totp` → AAL2 |
| Disable | PASS | `POST /api/auth/mfa/disable` → `{ enabled: false, method: "totp" }` |
| Re-enroll | PASS | `reenroll` + `reenroll_verify` → **200**, 10 recovery codes |

**WARNING:** none  
**FAIL:** none

---

## 3. Recovery Codes — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Generate | PASS | Enrollment returned **10** codes; DB `count: 10` unused |
| Download / display | PASS | Codes returned once in `verify-enrollment` / regenerate JSON (API surface) |
| Redeem | PASS | `POST /api/auth/mfa/verify` `{ recoveryCode }` → `{ verified: true, method: "recovery_code", mfaDisabled: true, reenrollRequired: true }` |
| Single-use / reuse prevention | PASS | Reuse → **400** `{ code: "recovery_invalid", error: "Invalid or used recovery code." }` |
| Regeneration | PASS | `POST /api/auth/mfa/recovery/regenerate` → **200**, `count: 10`, `previousInvalidated: true` |

**WARNING:** none  
**FAIL:** none

---

## 4. Google OAuth + MFA — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google Login (provider) | WARNING | OAuth URL generated successfully (provider enabled) — **not** a completed browser login |
| OAuth callback MFA gate (code) | WARNING | `app/auth/callback/route.ts` lines 71–76: after session exchange, `readMfaAssurance` → redirect `mfaChallengeHref(next)` |
| MFA challenge after Google | FAIL | No live interactive Google session → MFA page observed |
| Successful TOTP after Google | FAIL | Not executed |
| Authenticated session after Google MFA | FAIL | Not executed |
| Logout after Google MFA | FAIL | Not executed |

### FAIL detail

**Evidence:** No browser IdP completion; no cookies from Google OAuth callback observed in this certification run. Only `skipBrowserRedirect` URL probe + source callback MFA gate.

**Risk:** Email MFA PASS does not prove Google identity linkage + callback cookie path reaches AAL2 under production IdP.

**Exact Owner Action:** On `http://localhost:3000`, enroll MFA on a Google-linked account (or link Google to a test account), sign out, Sign in with Google → complete Google consent → land on `/login/mfa` → enter TOTP → confirm session AAL2 → logout. Capture URL trail + screenshots.

**Expected Verification:** Callback redirects to `/login/mfa?next=…` when AAL1+next aal2; after TOTP, protected routes return 200 without MFA redirect; logout clears session.

---

## 5. Google + Recovery Code — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google Login | FAIL | No live Google session |
| Recovery Code after Google | FAIL | Not executed |
| Authenticated session | FAIL | Not executed |

### FAIL detail

**Evidence:** Recovery redeem PASS exists only on **email password** AAL1 path (`recovery_redeem` in `mfa-live-cert-evidence.json`). No Google-origin AAL1 session used a recovery code.

**Risk:** Recovery path after OAuth cookie issuance unproven.

**Exact Owner Action:** After Google login lands on MFA challenge, redeem a valid unused recovery code; confirm `verified: true` and session advancement / MFA-disabled policy as implemented; capture evidence.

**Expected Verification:** Same recovery API behaviour as email path; no AAL1 access to protected APIs without verify.

---

## 6. Middleware — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Protected routes | PASS | AAL1: `/account` **307** → `/login/mfa?next=%2Faccount`; `/sell` **307** → `/login/mfa?next=%2Fsell`; `/orders` **307** → `/login/mfa?next=%2Forders` |
| Protected API routes | PASS | AAL1: `/api/account/security` **403** `mfa_required`; `/api/wallet` **403** `mfa_required` |
| Server Components / pages | PASS | AAL2: `/account` **200** |
| Redirect behaviour | PASS | `next` preserved on MFA redirect |
| AAL enforcement | PASS | Source: `lib/supabase/middleware.ts` AAL1+next aal2 → redirect / 403; fail-closed on assurance error |

**WARNING:** Guest `/login/mfa` behaviour not re-asserted in this run (prior cert: unauthenticated challenge path redirects to login).  
**FAIL:** none for exercised middleware paths.

---

## 7. Authenticated Session — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Session creation | PASS | Cookies after login/verify: `sb-pklotmwxtnnepaitedic-auth-token.0` / `.1` |
| Session refresh | PASS | `refreshSession` ok |
| Refresh token / AAL persistence | PASS | `aal_after_refresh` → `currentLevel=aal2` |
| JWT claims | PASS | Access token payload `aal: "aal2"` (`jwt_aal_claim`) |
| Cookies | PASS | Cookie names recorded in evidence |
| AAL persistence | PASS | AAL2 retained across refresh; AAL1 blocked until verify |

**WARNING:** none  
**FAIL:** none

---

## 8. Bypass Audit — **FAIL** (incomplete live matrix)

| Vector | Result | Evidence |
|---|---|---|
| Refresh Token | PASS | Refresh kept AAL2; AAL1 still needs challenge before verify |
| Existing Session (AAL1) | PASS | Middleware blocks pages/APIs until MFA |
| Remember Me / Remember Device | PASS | `rememberDeviceEnabled: false` (`lib/auth/mfa/ssot.ts`); evidence step `remember_device_disabled` |
| OAuth Callback | FAIL | Code gate present; **live Google callback not proven** |
| Magic Link | FAIL | Callback OTP path exists (`verifyOtp` then MFA gate); **live magic-link MFA not executed** (email side-effects avoided) |
| Password Reset | FAIL | Callback recovery OTP path exists; **live reset→session MFA not executed** |
| Parallel Tabs | WARNING | Same cookie jar would share AAL; **no multi-tab browser harness run** |
| Cached Session | PASS | AAL1 cookies cannot open `/account|/sell|/orders` or wallet API |
| Replay Attack | PASS | Bogus `challengeId` + `000000` → **400** `verify_failed` |
| Direct URL | PASS | `/sell`, `/orders` → MFA redirect |
| Expired Challenge | WARNING | Bogus challenge rejected; **timed natural expiry** not separately proven |
| API requests | PASS | **403** `mfa_required` on protected APIs at AAL1 |
| Middleware cache | PASS | Live per-request AAL checks observed (redirect/403 consistent) |

### FAIL detail (OAuth / Magic Link / Password Reset live)

**Evidence:** No live IdP/email OTP completion under MFA enrollment in this run.

**Risk:** Unproven auth entry paths could diverge from password path if callback cookies or OTP types behave differently in production.

**Exact Owner Action:** With MFA enrolled: (1) complete Google OAuth to MFA; (2) complete one magic-link login to MFA; (3) complete one password-reset session that yields an authenticated session and confirm MFA challenge before app entry. Record redirects and AAL.

**Expected Verification:** Every authenticated entry with verified TOTP and AAL1 lands on `/login/mfa` (or API `403 mfa_required`) until TOTP or recovery succeeds.

---

## 9. Playwright — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Complete MFA certification suite | FAIL | No `e2e/*mfa*` files; no MFA strings in `e2e/**/*.ts` |
| Desktop Chromium | FAIL | Suite absent — not run |
| Mobile Chromium | FAIL | Suite absent — not run |
| Screenshots on failures | FAIL | No MFA Playwright run to capture |

### FAIL detail

**Evidence:** `e2e/` listing contains zero MFA specs. Unit file `tests/mfa-totp-v1.test.ts` is **not** Playwright Desktop/Mobile certification.

**Risk:** UI challenge screen, layout, and browser cookie behaviour uncertified by Owner-required Playwright matrix.

**Exact Owner Action:** Author/run official Playwright MFA certification (Desktop + Mobile Chromium) covering email MFA, TOTP lifecycle, recovery, middleware redirects, and (if feasible) Google MFA; require failure screenshots; re-run to green.

**Expected Verification:** Playwright report PASS for Desktop and Mobile Chromium with artefacts under `test-results/`.

---

## Cross-gate summary

| # | Gate | Result |
|---|---|---|
| 1 | Email Login + MFA | **PASS** |
| 2 | TOTP Lifecycle | **PASS** |
| 3 | Recovery Codes | **PASS** |
| 4 | Google OAuth + MFA | **FAIL** |
| 5 | Google + Recovery Code | **FAIL** |
| 6 | Middleware | **PASS** |
| 7 | Authenticated Session | **PASS** |
| 8 | Bypass Audit | **FAIL** (live OAuth/magic/reset unproven) |
| 9 | Playwright | **FAIL** |

---

## Axis rationale (evidence only)

- **Implementation = PASS** — APIs, UI routes, middleware/callback/email MFA gates, unit tests 5/5, live email/TOTP/recovery/middleware/session paths exercised without code changes.
- **Configuration = PASS** — Migration applied (`mfa_recovery_codes` readable, count 0); Google OAuth provider returns authorize URL; localhost serving auth surfaces.
- **Live Certification = FAIL** — Google interactive MFA + Google recovery + Playwright suite missing.
- **Security Certification = FAIL** — Bypass matrix incomplete for OAuth/magic-link/password-reset live entry; no Playwright security/UI gate.
- **Production Ready = NO** — Any FAIL blocks production per Owner gate.

---

*No assumptions. No code modifications. No database schema modifications. No new migrations. No commits. No push. No Preview. No Production.*
