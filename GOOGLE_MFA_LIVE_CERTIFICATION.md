# GOOGLE_MFA_LIVE_CERTIFICATION.md

**TITLE:** GOOGLE MFA LIVE CERTIFICATION  
**DATE:** 2026-08-02  
**HOST:** `http://localhost:3000`  
**SUPABASE:** `pklotmwxtnnepaitedic`  
**MODE:** Evidence only · No code · No DB · No migrations · No refactoring · No commits · No push · No Preview · No Production  
**PARENT:** Email MFA Live Certification = PASS (29/29) · MFA Migration = PASS

---

## FINAL STATUS

| Gate | Result |
|---|---|
| Google OAuth | **FAIL** |
| Google + MFA | **FAIL** |
| Google + Recovery | **FAIL** |
| Playwright Coverage | **FAIL** |
| Production Ready | **NO** |

### Remaining blockers (ONLY)

1. Owner interactive **Google OAuth login** to completion → `/auth/callback` → authenticated Google session (project currently has **0** Google-linked users).
2. With MFA enrolled on that Google account: **Google → `/login/mfa` → TOTP → AAL2 → JWT/cookies → logout** live evidence.
3. Same account: **Google → Recovery Code → single-use → session → logout** live evidence.
4. Existing Playwright suite does **not** cover Google MFA / recovery / Desktop+Mobile MFA (do not invent tests under this order — Owner must authorize a future suite or supply alternate evidence).

---

## Evidence artefacts

| Artefact | Content |
|---|---|
| `test-results/google-mfa-live-cert-evidence.json` | Part A–E machine evidence |
| Admin identity scan | `googleUserCount: 0` across Auth users (5 pages × 200) |
| Login HTML | `data-testid="oauth-google"` · `Continue with Google` · `oauthProviders:["google"]` |
| Callback source | `app/auth/callback/route.ts` lines 71–76 MFA gate after session |
| Playwright search | Only `e2e/oauth-rc1.spec.ts` mentions Google; **zero** MFA E2E specs |

---

## PART A — Google OAuth — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google provider enabled | PASS | `signInWithOAuth({ provider:'google' })` → URL; `provider=google`; host `pklotmwxtnnepaitedic.supabase.co` |
| OAuth redirect | PASS | Authorize hop **302** → `accounts.google.com` (`oauthRedirectHop.locationStartsWithAccountsGoogle: true`) |
| OAuth callback (fail-closed) | PASS | Missing code → **307** `/login?error=auth_callback_failed`; `error=access_denied` → **307** `/login?error=oauth_cancelled`; bad code → **307** `/login?error=auth_callback_failed` |
| OAuth callback (success session) | FAIL | No live `code=` exchange producing a Google-authenticated user |
| Authenticated user (Google) | FAIL | **0** users with `identities.provider === 'google'` in project |

### WARNING

- Login UI exposes Google (`oauth-google`) — UI presence ≠ completed IdP login.
- Callback MFA redirect is implemented in source (`readMfaAssurance` → `mfaChallengeHref`) but unproven for a Google session.

### FAIL detail — Authenticated Google user

**Evidence:** Admin `listUsers` scan → `googleLinkedUsersInProject: 0`. No successful OAuth callback cookies/session observed.

**Risk:** Provider enablement and redirect alone do not prove Google identity linkage, account creation/linking, or post-callback session cookies under production IdP.

**Exact Owner Action:** On `http://localhost:3000/login`, click **Continue with Google**, complete Google consent for a test account, land past `/auth/callback` with an authenticated session (or `/login/mfa` if MFA already enrolled). Confirm Auth user shows provider `google`.

**Expected Verification:** User record has Google identity; session cookies present; optional screenshot of post-callback URL + account email.

---

## PART B — Google + MFA — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google Login | FAIL | Not completed (blocked by Part A authenticated user) |
| Redirect | FAIL | No post-Google app redirect observed |
| MFA challenge displayed | FAIL | No `/login/mfa` after Google |
| TOTP verification | FAIL | Not executed |
| Authenticated session | FAIL | No Google AAL2 session |
| JWT | FAIL | No Google-session JWT `aal` claim captured |
| Cookies | FAIL | No Google auth cookies captured |
| Logout | FAIL | Not executed |

### FAIL detail

**Evidence:** `partB.liveCompleted: false` · reason `NO_GOOGLE_LINKED_USERS_AND_NO_INTERACTIVE_IDP_SESSION`. Email MFA 29/29 does not substitute for Google entry.

**Risk:** OAuth cookie path + MFA step-up may diverge from password path; unproven = security certification incomplete.

**Exact Owner Action:**  
1. Complete Google login (Part A).  
2. Enroll TOTP at `/account/security/two-factor` (or use already enrolled Google account).  
3. Sign out → Google login → confirm `/login/mfa` → enter TOTP → confirm AAL2 (`jwt.aal=aal2`) → protected route **200** → logout.

**Expected Verification:** URL trail Google → callback → `/login/mfa` → app; JWT `aal=aal2`; cookies set; logout clears session.

---

## PART C — Google + Recovery Code — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google Login | FAIL | No Google AAL1 session |
| Recovery Code accepted | FAIL | Not executed on Google path (email path previously PASS only) |
| Single-use enforcement | FAIL | Not executed on Google path |
| Authenticated session | FAIL | Not executed |
| Logout | FAIL | Not executed |

### FAIL detail

**Evidence:** `partC.liveCompleted: false` · reason `NO_GOOGLE_AAL1_SESSION`. Prior email recovery PASS cannot be attributed to Google.

**Risk:** Recovery redeem after OAuth AAL1 unproven.

**Exact Owner Action:** After Google login lands on MFA challenge, redeem one unused recovery code; retry same code (expect reject); confirm session policy; logout. Capture API/UI responses.

**Expected Verification:** First redeem succeeds; reuse fails; session consistent with product recovery rules; logout works.

---

## PART D — Session Security (Google MFA context) — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| AAL level (Google session) | FAIL | No Google MFA session |
| Session persistence | FAIL | Not measured on Google path |
| Refresh token | FAIL | Not measured on Google path |
| Protected routes | FAIL | Not measured under Google AAL1/AAL2 |
| Protected API routes | FAIL | Not measured under Google AAL1/AAL2 |

### WARNING

- Email MFA live cert previously proved middleware AAL1→`/login/mfa` / API `403 mfa_required` and AAL2 persistence after refresh for **password** sessions (`MFA_LIVE_CERTIFICATION.md`). That evidence is **not** Google OAuth evidence.

### FAIL detail

**Evidence:** `partD.liveCompleted: false` · reason `NO_GOOGLE_MFA_SESSION`.

**Risk:** Claiming session security PASS for Google without a Google session would be an assumption.

**Exact Owner Action:** After Part B AAL2 Google session: refresh session; confirm `aal=aal2` persists; with a fresh Google AAL1 (pre-MFA) session, hit `/account` and `/api/wallet` and record redirect/403.

**Expected Verification:** Same enforcement as email path: AAL1 blocked; AAL2 allowed; refresh keeps AAL2.

---

## PART E — Playwright (existing tests only) — **FAIL**

**Constraint obeyed:** Search only. Do **not** create tests. Do **not** modify tests.

### What exists

| File | What it covers | MFA? |
|---|---|---|
| `e2e/oauth-rc1.spec.ts` | Login Google/Apple button presence gating; Facebook absent; oauth error message | **No** |
| `tests/mfa-totp-v1.test.ts` | Unit SSOT / recovery crypto (Vitest) | Not Playwright E2E |
| Desktop/Mobile Chromium projects | Configured in `scripts/playwright-projects.mjs` for general E2E | **No MFA suite** attached |

### Scenario coverage matrix

| Required scenario | Existing E2E coverage |
|---|---|
| Google Login (UI button optional presence) | PARTIAL — `e2e/oauth-rc1.spec.ts` only |
| Google Login full IdP → callback session | **NONE** |
| Google MFA challenge | **NONE** |
| Google MFA TOTP verify | **NONE** |
| Google Recovery Code | **NONE** |
| Desktop Chromium MFA certification | **NONE** |
| Mobile Chromium MFA certification | **NONE** |

### Exact scenarios with no existing E2E coverage

1. Google Login full IdP completion → `/auth/callback` session  
2. Google Login → MFA challenge displayed (`/login/mfa`)  
3. Google MFA TOTP verification → AAL2 session  
4. Google → Recovery Code accept + single-use enforcement  
5. Desktop Chromium MFA certification suite  
6. Mobile Chromium MFA certification suite  

### FAIL detail

**Evidence:** Repo search of `e2e/**/*.ts` for `mfa|aal2|login/mfa|recovery code|2fa` → **no MFA matches**. Only Google UI gating in `oauth-rc1.spec.ts`.

**Risk:** No automated regression net for Google MFA/recovery on Desktop/Mobile Chromium.

**Exact Owner Action:** Either (a) authorize creation/run of a Playwright MFA suite later (outside this freeze order), or (b) accept Owner-recorded interactive live evidence for Parts A–D as the certification substitute and explicitly waive Playwright for this gate.

**Expected Verification:** Existing suite would need to assert the six missing scenarios above on Desktop + Mobile Chromium — currently impossible without new tests (forbidden under this order).

---

## Cross-part summary

| Part | Result |
|---|---|
| A Google OAuth | **FAIL** (provider + redirect PASS; authenticated Google user FAIL) |
| B Google + MFA | **FAIL** |
| C Google + Recovery | **FAIL** |
| D Session Security (Google) | **FAIL** |
| E Playwright Coverage | **FAIL** |

---

*No assumptions. No code changes. No database changes. No migrations. No commits. No push. No Preview. No Production.*
