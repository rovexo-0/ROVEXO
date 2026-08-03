# ROVEXO TWO-FACTOR / MFA CERTIFICATION AUDIT v1.0

**STATUS:** EVIDENCE ONLY · NO CODE CHANGES  
**Date:** 2026-08-02  
**Scope:** Entire authentication relationship — Email · Google/Apple OAuth · 2FA · MFA · TOTP · Recovery Codes · Supabase Auth  

**Constraints:** No SQL · No migrations · No commits · No push · No Preview · No Deploy  

---

## FINAL VERDICT

```
2FA READY = NO
```

---

## Mission answers

### 1. Does ROVEXO already implement 2FA?

**NO** (as a login / session gate)

**Evidence:**

- Email login (`lib/auth/actions.ts` → `signInWithPassword`) creates a session and redirects with **no** `mfa.challenge` / `mfa.verify` / AAL2 check.
- OAuth (`signInWithOAuthProvider`) redirects to IdP with **no** MFA step in-app.
- Middleware (`middleware.ts` → `updateSession`) has **no** MFA / AAL references.
- Zero matches for `mfa.enroll`, `mfa.challenge`, `mfa.verify`, `getAuthenticatorAssuranceLevel`, `aal2` in auth/login paths.

**What exists instead:** status **read** of Supabase TOTP factors + a Support-only copy UI (not a complete 2FA product).

---

### 2. Which type?

| Type | Present in product? | Evidence |
|------|---------------------|----------|
| **TOTP** (authenticator) | **Status only** | `supabase.auth.mfa.listFactors()` → `data.totp` filtered `status === "verified"` |
| SMS | **NO** | No SMS MFA enroll/challenge in auth |
| Email OTP | **Not 2FA** | `verifyOtp` used for email verify / magiclink / recovery / email_change in `app/auth/callback/route.ts` — not a second factor after password |
| Passkey / WebAuthn | **NO** (login) | Security Engine registry lists passkeys; defaults leave `passkeys` **disabled**; no WebAuthn login flow |
| Recovery / backup codes | **NO** (implementation) | Listed in `SECURITY_ENGINE_AUTH_METHODS` as labels only — no generate/consume APIs |
| Other | Super Admin `mfaVerified: true` | Client/API **boolean stub** for admin actions — **not** TOTP verification |

---

### 3. Where is it implemented? (exact paths)

| Role | Path |
|------|------|
| 2FA status API | `app/api/account/security/route.ts` |
| 2FA status UI | `features/account/components/AccountTwoFactorPage.tsx` |
| 2FA route | `app/account/security/two-factor/page.tsx` |
| Security hub link | `features/account/components/AccountSecurityPage.tsx` |
| MFA factor read (Security Engine) | `lib/security-engine/reader.ts` (`readUserMfaEnabled`) |
| Auth method labels (config only) | `lib/security-engine/registry.ts` (`2fa`, `authenticator`, `backup-codes`, `passkeys`) |
| Email / password login (no MFA) | `lib/auth/actions.ts` (`signIn`) |
| Google / Apple OAuth (no MFA) | `lib/auth/actions.ts` (`signInWithOAuthProvider`) |
| Auth callback (OTP types ≠ login 2FA) | `app/auth/callback/route.ts` |
| Remember Me (cookie maxAge only) | `lib/auth/session-cookies.ts` (`applySessionPersistence`) |
| Session middleware (no MFA) | `middleware.ts`, `lib/supabase/middleware.ts` |

**Not found:** any `*mfa*enroll*`, challenge UI, TOTP QR enroll page, recovery-code issuer.

---

### 4. Which login methods trigger 2FA?

| Method | Triggers 2FA challenge? | Evidence |
|--------|-------------------------|----------|
| Email + Password | **NO** | `signIn` → session → redirect |
| Google OAuth | **NO** | `signInWithOAuth` → IdP → callback → session |
| Apple OAuth | **NO** | Same OAuth path (`provider` google\|apple only) |
| Magic Link / email OTP | **NO** as 2FA | Callback `verifyOtp` for link types — primary auth, not second factor |
| Password Reset | **NO** | Recovery OTP → reset flow; no TOTP step |
| Session Restore | **NO** | Cookie/session refresh via middleware |
| Refresh Token | **NO** | No AAL2 re-challenge in app |

---

### 5. Can Google Login bypass 2FA?

**YES**

Evidence: OAuth completes via `exchangeCodeForSession` / OAuth redirect with **no** MFA challenge. Even if a user had verified TOTP factors in Supabase, the application never enforces AAL2 after Google sign-in.

---

### 6. Can Session Refresh bypass 2FA?

**YES**

Evidence: `middleware.ts` only calls `updateSession`. No assurance-level gate. Refreshed sessions remain usable without a second factor.

---

### 7. Can Remember Device bypass 2FA?

**YES** (and “Remember Me” is not MFA device trust)

Evidence: `applySessionPersistence(remember)` only adjusts cookie `maxAge` (`lib/auth/session-cookies.ts`). There is **no** trusted-device MFA skip store. Because login 2FA is not enforced, Remember Me never requires a second factor.

---

### 8. Does Supabase MFA exist? Used / Unused / Disabled?

| Layer | Status | Evidence |
|-------|--------|----------|
| Supabase Auth MFA API | **Exists** (SDK) | `supabase.auth.mfa.listFactors()` called |
| Enroll / Challenge / Verify in ROVEXO | **Unused** | No `mfa.enroll` / `mfa.challenge` / `mfa.verify` in repo auth flows |
| Login enforcement | **Disabled** (app) | Password + OAuth ignore MFA |
| Account UI | **Status + Support redirect** | `AccountTwoFactorPage` — enable via Support, not self-serve |
| Security Engine auth method flags | **Config labels** | `2fa` / `authenticator` enabled in defaults; **not wired** to login |

---

### 9. Every authentication flow (as implemented)

```text
1) EMAIL + PASSWORD
   /login → signIn → signInWithPassword → [optional Remember Me cookie maxAge]
   → profile role → redirect Homepage / next
   → NO MFA

2) GOOGLE OAUTH
   /login|/register → signInWithOAuthProvider(google) → Google → /auth/callback
   → exchangeCodeForSession → session → Homepage / next
   → NO MFA

3) APPLE OAUTH
   Same as Google with provider=apple
   → NO MFA

4) EMAIL VERIFY / MAGIC LINK / INVITE (OTP link)
   Email link → /auth/callback?token_hash&type=…
   → verifyOtp → session (as applicable)
   → NOT login 2FA

5) PASSWORD RESET
   Forgot → recovery email → /auth/callback type=recovery → /reset-password
   → NO TOTP step

6) SESSION RESTORE / REFRESH
   Request → middleware updateSession → continue
   → NO MFA re-challenge

7) LOGOUT
   Sign out clears session (out of 2FA scope)

8) ACCOUNT 2FA PAGE
   GET /api/account/security → listFactors (TOTP verified count)
   → Display On/Off → Support/Help to enable
   → NO enroll UI · NO challenge UI

9) SUPER ADMIN “mfaVerified”
   Admin clients POST { mfaVerified: true } → permission helpers
   → NOT authenticator 2FA
```

---

## Per-method certification board

| Authentication method | Status | Evidence summary |
|-----------------------|--------|------------------|
| Email + Password login | **FAIL** (2FA) | Session without MFA challenge |
| Google OAuth | **FAIL** (2FA) | Bypasses any MFA gate in app |
| Apple OAuth | **FAIL** (2FA) | Same as Google |
| Magic Link / email OTP | **WARNING** | OTP used for verify/recovery — not second factor after password |
| Password Reset | **FAIL** (2FA) | No TOTP on recovery |
| Session Restore | **FAIL** (2FA) | No AAL2 |
| Refresh Token | **FAIL** (2FA) | No re-challenge |
| Remember Me | **WARNING** | Cookie lifetime only; not MFA-aware |
| TOTP status display | **WARNING** | Reads Supabase factors; no self-serve enroll/challenge |
| Recovery Codes | **FAIL** | Registry label only |
| Passkeys / WebAuthn | **FAIL** | Disabled / unimplemented in login |
| SMS 2FA | **FAIL** | Not implemented |
| Super Admin `mfaVerified` flag | **FAIL** (as real 2FA) | Boolean stub, often hardcoded `true` |
| Supabase MFA SDK (listFactors) | **PASS** (API call exists) | Used for status only |

---

## Relationship diagram (evidence)

```text
Supabase Auth
├── Email/Password ──► Session ──► App (NO MFA gate)
├── Google/Apple ────► Session ──► App (NO MFA gate)
├── Email OTP links ─► verify / recovery (NOT 2FA)
└── MFA TOTP factors ─► listFactors ─► Account Security UI (status)
                        enroll/challenge/verify ─► NOT USED BY APP LOGIN
```

---

## Why `2FA READY = NO`

1. No login-time MFA challenge for email or OAuth.  
2. Google (and Apple) can obtain a full session without a second factor in-app.  
3. Session refresh / Remember Me do not enforce MFA.  
4. Self-serve TOTP enroll + recovery codes + WebAuthn login are absent.  
5. Super Admin `mfaVerified` is not authenticator 2FA.

**No code. No changes. Evidence only.**
