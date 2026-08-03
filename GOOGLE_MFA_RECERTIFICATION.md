# GOOGLE_MFA_RECERTIFICATION.md

**TITLE:** GOOGLE MFA RE-CERTIFICATION  
**DATE:** 2026-08-02  
**HOST:** `http://localhost:3000`  
**SUPABASE:** `https://pklotmwxtnnepaitedic.supabase.co`  
**MODE:** Evidence only · No code · No DB mutations · No migrations · No SQL · No refactoring · No commits · No push · No Preview · No Production

---

## FINAL STATUS

| Gate | Result |
|---|---|
| Google OAuth | **PASS** |
| Google + MFA | **FAIL** |
| Google + Recovery | **FAIL** |
| Playwright Coverage | **FAIL** |
| Production Ready | **NO** |

### Remaining blockers (ONLY)

1. Enroll verified TOTP on a Google-linked account, then complete **Google login → `/login/mfa` → TOTP → AAL2 → JWT/cookies → logout** (live evidence).  
2. Same Google path: **Recovery Code accept + single-use + session + logout** (live evidence).  
3. After MFA enrolled: prove **middleware** AAL1→`/login/mfa` / API `403 mfa_required` on that Google session.  
4. Playwright: no existing MFA/Google-MFA/Recovery E2E on Desktop/Mobile Chromium (create/run suite requires separate Owner authorization — forbidden under this freeze order).

---

## Evidence artefacts

| File | Notes |
|---|---|
| `test-results/google-mfa-recert-evidence.json` | Primary machine evidence |
| `test-results/google-mfa-recert-deep.json` | Identity deep scan (`getUserById`) |

---

## 1. Google-linked user exists — **PASS**

At least one Google-linked user now exists (**2** found via `admin.auth.admin.getUserById`).

| email | provider (app_metadata) | providers | google identity created_at | user created_at | last_sign_in_at |
|---|---|---|---|---|---|
| `dnseuropaltd@gmail.com` | `google` | `["google"]` | `2026-08-02T22:51:35.265806Z` | `2026-08-02T22:51:35.071197Z` | `2026-08-02T22:51:35.7929Z` |
| `palademihaita88@gmail.com` | `email` | `["email","google"]` | `2026-08-02T20:42:24.26526Z` | `2026-06-22T06:52:21.623234Z` | `2026-08-02T20:42:24.821221Z` |

**Primary Owner Google OAuth completion (newest):** `dnseuropaltd@gmail.com` — identity provider **google**, created and signed in **2026-08-02T22:51:35Z**.

**WARNING:** `listUsers` omits `identities[]` in this API version; confirmation requires `getUserById` (done).

**FAIL:** none for this gate.

---

## 2. Google OAuth flow — **PASS**

| Check | Result | Evidence |
|---|---|---|
| Google button | PASS | `/login` HTML: `data-testid="oauth-google"`, `Continue with Google`, `data-oauth-provider="google"` |
| Redirect to accounts.google.com | PASS | Authorize hop **302** → host `accounts.google.com` |
| OAuth callback | PASS | Fail-closed: `?error=access_denied` → **307** `/login?error=oauth_cancelled`. Success inferred from Google identity + session timestamps on `dnseuropaltd@gmail.com` (user created via Google at callback time) |
| Authenticated session | PASS | `app_metadata.provider=google`, `last_sign_in_at=2026-08-02T22:51:35.7929Z`, Google identity present |

**WARNING:** Live browser cookie jar for the Owner’s Google session was not captured in this agent run; Auth user record is the durable session-completion evidence.

**FAIL:** none for this gate.

---

## 3. Google + MFA — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Google session (account exists) | PASS | See §1–2 |
| MFA challenge displayed | FAIL | Both Google-linked users: `verifiedTotpCount: 0`, `factors: []` — no AAL2 challenge can fire |
| TOTP verification | FAIL | Not executable without enrolled factor (DB enroll forbidden this order) |
| AAL2 session | FAIL | Not observed |
| JWT | FAIL | No Google MFA AAL2 JWT captured |
| Cookies | FAIL | No Google MFA cookie capture |
| Logout | FAIL | Not observed on MFA path |

### FAIL detail

**Evidence:**  
`mfaState` for `dnseuropaltd@gmail.com` and `palademihaita88@gmail.com`: `factors: []`, `verifiedTotpCount: 0`, `recoveryCount: 0`.

**Risk:** Google OAuth PASS without MFA step-up leaves 2FA unproven for Google entry (email MFA PASS does not transfer).

**Exact Owner Action:**  
1. Sign in as Google user (`dnseuropaltd@gmail.com` or linked account).  
2. Enroll TOTP at `/account/security/two-factor` (Owner UI — this creates DB factors; agent will not mutate).  
3. Sign out → Continue with Google → land on `/login/mfa` → enter TOTP → confirm AAL2 → capture JWT `aal` + cookies → logout.  
4. Re-run this re-certification order.

**Expected Verification:** `listFactors` shows verified TOTP; Google login redirects to `/login/mfa`; after TOTP, `currentLevel=aal2`, JWT `aal=aal2`, protected routes **200**, logout clears session.

---

## 4. Google + Recovery Code — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Recovery Code accepted | FAIL | `mfa_recovery_codes` count **0** for both Google users |
| Single-use enforced | FAIL | Not executable |
| Authenticated session | FAIL | Not observed on Google recovery path |
| Logout | FAIL | Not observed |

### FAIL detail

**Evidence:** Recovery rows `count: 0` for both Google-linked users; no verified TOTP (recovery codes are issued at MFA enrollment).

**Risk:** Google account lockout/recovery path unproven.

**Exact Owner Action:** After MFA enroll (issues recovery codes), Google login → MFA challenge → redeem one recovery code → reuse same code (expect reject) → logout. Re-run re-cert.

**Expected Verification:** First redeem succeeds; reuse fails; session policy matches product; logout works.

---

## 5. Middleware (Google MFA AAL) — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Protected routes under Google AAL1+MFA | FAIL | No MFA factors → `nextLevel` cannot be `aal2`; MFA redirect path not triggerable for these users |
| Protected APIs | FAIL | Same — no live `403 mfa_required` under Google MFA-required session |
| Server Components | FAIL | No Google MFA AAL1 session exercised against `/account` etc. |
| AAL enforcement | FAIL | Unobserved for Google MFA |

### WARNING

- Callback source still contains MFA gate (`app/auth/callback/route.ts` after session → `mfaChallengeHref`).  
- Email MFA live cert previously proved middleware for **password** AAL1. That is **not** Google MFA middleware evidence.

### FAIL detail

**Evidence:** Google users have zero verified TOTP; MFA middleware branch requires `currentLevel=aal1 && nextLevel=aal2`.

**Risk:** Claiming middleware PASS for Google MFA without a challenge-required session is an assumption.

**Exact Owner Action:** After MFA enroll on Google account, Google login (do not complete TOTP), request `/account`, `/sell`, `/api/wallet`; record **307** `/login/mfa` and **403** `mfa_required`. Then complete TOTP and confirm **200**.

**Expected Verification:** Same AAL enforcement as email MFA path, proven on Google session cookies.

---

## 6. Playwright coverage — **FAIL**

| Check | Result | Evidence |
|---|---|---|
| Desktop Chromium MFA | FAIL | No `e2e/*mfa*` specs |
| Mobile Chromium MFA | FAIL | No MFA mobile suite |
| Google OAuth E2E | FAIL | Only UI gating in `e2e/oauth-rc1.spec.ts` (button presence; not IdP completion) |
| Google MFA E2E | FAIL | Zero matches for `login/mfa` / `aal2` / `totp` in `e2e/**/*.ts` |
| Recovery Code E2E | FAIL | Zero MFA recovery E2E |

### FAIL detail

**Evidence:** Existing search — `e2e/oauth-rc1.spec.ts` only; no MFA E2E files. This order forbids creating/modifying tests.

**Risk:** No automated regression for Google MFA/recovery.

**Exact Owner Action:** Authorize a future Playwright MFA suite (Desktop + Mobile Chromium) covering Google OAuth → MFA → Recovery, **or** explicitly waive Playwright after interactive live PASS on gates 3–5.

**Expected Verification:** Green Playwright report asserting those scenarios — currently absent.

---

## Cross-gate summary

| # | Gate | Result |
|---|---|---|
| 1 | Google-linked user | **PASS** |
| 2 | Google OAuth flow | **PASS** |
| 3 | Google + MFA | **FAIL** |
| 4 | Google + Recovery | **FAIL** |
| 5 | Middleware (Google MFA) | **FAIL** |
| 6 | Playwright | **FAIL** |

---

*No assumptions. No code modifications. No database modifications. No new migrations. No commits. No push. No Preview. No Production.*
