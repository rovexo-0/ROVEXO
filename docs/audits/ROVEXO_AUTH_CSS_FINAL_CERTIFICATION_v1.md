# ROVEXO AUTH CSS FINAL CERTIFICATION v1

**STATUS:** PHASE 3 · READ ONLY · ABSOLUTE LOCK · EVIDENCE ONLY

| Field | Value |
|---|---|
| Generated (UTC) | 2026-08-07T21:07:24.576Z |
| Host | `http://127.0.0.1:3000` (Law v4.0) |
| Target CSS | `styles/rovexo/auth-v1.css` |
| Method | SSR HTML (scripts stripped) + class/attr/id token match against parsed selectors |
| Playwright Coverage | NOT USED (not required for this certification) |
| Implementation | NONE — no CSS/import/route/file changes |
| Commit / Push / Deploy | FORBIDDEN this phase |

## FINAL CERTIFICATION (ONE CLASSIFICATION)

```
NOT VERIFIED
```

### Why NOT VERIFIED (not REQUIRED ONLY FOR AUTH)

Auth-gated marketplace routes could not be inspected without a session. Per Phase 3 absolute rule: if authentication is required → **NOT VERIFIED** — never mark UNUSED without DOM evidence.

**Authenticated / gated routes that could not be inspected (marketplace DOM):**

| Route | HTTP | Gate evidence |
|---|---|---|
| `/` | 307 → `/login` | Guest session gate; Homepage platform DOM not rendered |
| `/sell` | 307 → `/login?next=%2Fsell` | Auth required |
| `/messages` | 307 → `/login?next=%2Fmessages` | Auth required |
| `/notifications` | 307 → `/login?next=%2Fnotifications` | Auth required |
| `/wallet` | 307 → `/login?next=%2Fwallet` | Auth required |
| `/orders` | 307 → `/login?next=%2Forders` | Auth required |
| `/settings` | 307 → `/login?next=%2Fsettings` | Auth required |
| `/profile` | 404 | Canonical profile is `/account` (also gated) |
| `/business` | 308 → `/business/dashboard` | Followed gate not session-inspected |
| `/admin` | 307 → `/login?next=%2Fadmin` | Auth required |
| `/account` | 307 → `/login?next=%2Faccount` | Auth required |
| `/account/settings` | 307 → `/login?next=%2Faccount%2Fsettings` | Auth required |
| `/inbox` | 307 → `/login?next=%2Finbox` | Auth required (messages hub) |
| `/checkout` | 307 → `/login?next=%2Fcheckout` | Auth required |

**Also not verified as live auth surfaces (missing pages):** `/verify-phone` · `/two-factor` · `/oauth` · `/account-recovery` → HTTP **404**.

Because those marketplace routes remain uninspected, this certification **cannot** eliminate uncertainty that `auth-v1.css` is never required outside authentication. Classification therefore remains **NOT VERIFIED**.

### Partial verified facts (do not upgrade classification)

- On verified **auth** routes with HTTP 200, `auth-v1` selectors **do match** DOM (`data-auth-screen`, `.auth-*`).
- On verified **public marketplace** routes HTTP 200 — `/search` matched **0**, `/browse` matched **0**, `/listing/cabeau-best-neck-pillow-for-travel-evolution-earth-msi2tvgy` matched **0** — auth markers absent.
- Platform layout still **loads** `auth-v1.css` via `styles/rovexo/index.css` (LOAD ≠ REQUIRED).
- Auth layout loads `auth-v1.css` via `styles/rovexo/auth-entry.css` (REQUIRED for verified auth screens).

---

## Load path evidence (not usage)

| Path | Evidence |
|---|---|
| `app/(auth)/layout.tsx` → `auth-entry.css` | true |
| `auth-entry.css` → `auth-v1.css` | true |
| `app/(platform)/layout.tsx` → `index.css` | true |
| `index.css` → `auth-v1.css` | true |

Conclusion: file is **downloaded** on both auth and platform trees. This certification asks whether it is **required** (DOM needs those selectors), not whether it is imported.

---

## auth-v1.css selector totals

| Metric | Value |
|---|---|
| Total selector occurrences (parsed, comma-split) | **415** |
| Unique selector strings | **360** |
| Matched unique on ≥1 verified auth SSR route | **252** |
| Unmatched unique on all verified auth SSR routes | **108** |
| Matched % (of unique) | **70.0%** (252/360) |
| Unmatched % (of unique) | **30.0%** (108/360) |
| Duplicate occurrence surplus | **55** (415 − 360; same selector string appears more than once in CSS) |

Per-route match rates (occurrence universe = 415; a selector may match once per occurrence):

| Auth route | HTTP | Matched | Matched % | Unmatched |
|---|---|---|---|---|
| `/login` | 200 | 220 | 53% | 195 |
| `/register` | 200 | 191 | 46% | 224 |
| `/forgot-password` | 200 | 118 | 28.4% | 297 |
| `/reset-password` | 200 | 99 | 23.9% | 316 |
| `/verify-email` | 200 | 86 | 20.7% | 329 |
| `/verify-phone` | 404 | — | — | NOT VERIFIED |
| `/two-factor` | 404 | — | — | NOT VERIFIED |
| `/oauth` | 404 | — | — | NOT VERIFIED |
| `/account-recovery` | 404 | — | — | NOT VERIFIED |
| `/login/mfa` (extra; exists) | 200 | (auth route wrapper present) | — | supplemental |

Unmatched classification (across auth verified set, after source cross-check):

| Classification | Count |
|---|---|
| Unused | 55 |
| Conditional | 52 |
| Not verified | 1 |

---

## AUTH ROUTES — layout / components / DOM markers

### `/login`

- **HTTP:** 200
- **Rendered layout:** app/(auth)/layout.tsx + login/layout.tsx (`auth-login-route`)
- **Rendered components:** LoginScreen, AuthContainer, PrimaryButton, BrandLogo
- **Note:** Bare auth (no AuthShell)
- **data-auth-screen:** `login`

| Marker | Evidence |
|---|---|
| data-auth-screen | login |
| .auth-* classes | 39 |
| auth class sample | auth-login-route, auth-login, auth-login--premium, auth-platform-theme, auth-compact-premium, auth-login--canonical-freeze, auth-container, auth-login__brand, auth-login__oauth, auth-divider, auth-divider__line, auth-divider__label |
| data-auth-* attrs | data-auth-module="v1.0", data-auth-spec="v1.0", data-auth-screen="login", data-auth-version="canonical-freeze-v1", data-auth-ui="canonical-freeze-v1", data-auth-freeze="LOCKED_FROZEN_CERTIFIED", data-auth-brand-freeze="XXXIX", data-auth-experience-freeze="XLI" |

### `/register`

- **HTTP:** 200
- **Rendered layout:** app/(auth)/layout.tsx + register/layout.tsx (`auth-register-route`)
- **Rendered components:** RegisterScreen, AuthBackButton, AuthContainer, PrimaryButton
- **Note:** Bare auth
- **data-auth-screen:** `register`

| Marker | Evidence |
|---|---|
| data-auth-screen | register |
| .auth-* classes | 45 |
| auth class sample | auth-register-route, auth-register, auth-register--premium, auth-platform-theme, auth-compact-premium, auth-register--canonical-freeze, auth-back-button, auth-register__back, auth-back-button--platform, auth-back-button__icon, auth-back-button__label, auth-container |
| data-auth-* attrs | data-auth-module="v1.0", data-auth-spec="v1.0", data-auth-screen="register", data-auth-version="canonical-freeze-v1", data-auth-ui="canonical-freeze-v1", data-auth-freeze="LOCKED_FROZEN_CERTIFIED", data-auth-brand-freeze="XXXIX", data-auth-experience-freeze="XLI" |

### `/forgot-password`

- **HTTP:** 200
- **Rendered layout:** app/(auth)/layout.tsx + forgot-password/layout.tsx
- **Rendered components:** ForgotPasswordScreen, AuthBackButton, AuthContainer, PrimaryButton
- **Note:** Bare auth
- **data-auth-screen:** `forgot-password`

| Marker | Evidence |
|---|---|
| data-auth-screen | forgot-password |
| .auth-* classes | 23 |
| auth class sample | auth-forgot-password-route, auth-forgot-password, auth-back-button, auth-forgot-password__back, auth-back-button__icon, auth-back-button__label, auth-container, auth-heading, auth-heading__title, auth-heading__description, auth-footer, auth-forgot-password__footer |
| data-auth-* attrs | data-auth-module="v1.0", data-auth-spec="v1.0", data-auth-screen="forgot-password", data-auth-version="v1.0-legal-lock", data-auth-brand-freeze="XXXIX", data-auth-experience-freeze="XLI" |

### `/reset-password`

- **HTTP:** 200
- **Rendered layout:** app/(auth)/layout.tsx + reset-password/layout.tsx
- **Rendered components:** ResetPasswordScreen, AuthBackButton, AuthContainer
- **Note:** Bare auth; token-invalid state observed in SSR
- **data-auth-screen:** `reset-password`

| Marker | Evidence |
|---|---|
| data-auth-screen | reset-password |
| .auth-* classes | 15 |
| auth class sample | auth-reset-password-route, auth-reset-password, auth-back-button, auth-reset-password__back, auth-back-button__icon, auth-back-button__label, auth-container, auth-reset-password__token-error, auth-heading, auth-heading__title, auth-heading__description, auth-reset-password__token-actions |
| data-auth-* attrs | data-auth-module="v1.0", data-auth-spec="v1.0", data-auth-screen="reset-password", data-auth-token-state="invalid", data-auth-version="v1.0-legal-lock", data-auth-brand-freeze="XXXIX", data-auth-experience-freeze="XLI" |

### `/verify-email`

- **HTTP:** 200
- **Rendered layout:** app/(auth)/layout.tsx → AuthRouteLayout → AuthShell
- **Rendered components:** VerifyEmailScreen, AuthShell, AuthContainer, PrimaryButton
- **Note:** AuthShell path
- **data-auth-screen:** `verify-email`

| Marker | Evidence |
|---|---|
| data-auth-screen | verify-email |
| .auth-* classes | 15 |
| auth class sample | auth-verify-email, auth-platform-theme, auth-container, auth-verify-email__container, auth-verify-email__panel, auth-verify-email__icon, auth-verify-email__icon--created, auth-verify-email__icon-svg, auth-heading, auth-heading__title, auth-heading__description, auth-verify-email__actions |
| data-auth-* attrs | data-auth-module="v1.0", data-auth-spec="v1.0", data-auth-screen="verify-email", data-auth-brand-freeze="XXXIX", data-auth-experience-freeze="XLI" |

### `/verify-phone`

- **HTTP:** 404
- **Rendered layout / components / DOM:** **NOT VERIFIED** — no page (404). No `app/(auth)` page for this path.
- **Presence of auth markers:** NOT VERIFIED

### `/two-factor`

- **HTTP:** 404
- **Rendered layout / components / DOM:** **NOT VERIFIED** — no page (404). No `app/(auth)` page for this path.
- **Presence of auth markers:** NOT VERIFIED

### `/oauth`

- **HTTP:** 404
- **Rendered layout / components / DOM:** **NOT VERIFIED** — no page (404). No `app/(auth)` page for this path.
- **Presence of auth markers:** NOT VERIFIED

### `/account-recovery`

- **HTTP:** 404
- **Rendered layout / components / DOM:** **NOT VERIFIED** — no page (404). No `app/(auth)` page for this path.
- **Presence of auth markers:** NOT VERIFIED

### Supplemental existing auth pages (not in mandatory list)

| Path | Source |
|---|---|
| `/login/mfa` | `app/(auth)/login/mfa/page.tsx` → `MfaChallengeScreen` · HTTP 200 · `.auth-login-route` present |
| `/splash`, `/welcome` | exist under `app/(auth)` · Welcome removed by product law · not in Phase 3 mandatory list |

---

## MARKETPLACE ROUTES — layout / components / DOM markers

### `/`

- **HTTP:** 307 → /login
- **Classification:** **NOT VERIFIED**
- **Reason:** Guest redirected to login; Homepage marketplace DOM not available without session
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/search`

- **HTTP:** 200
- **Rendered layout:** `app/(platform)/layout.tsx` → `PlatformChromeProviders` + page
- **Rendered components:** Search landing (platform)
- **auth-v1 selectors matched:** **0** / 415
- **Auth DOM markers:** ABSENT

| Marker | Evidence |
|---|---|
| data-auth-screen | absent |
| .auth-* / .login-* / .register-* / .verify-* / .password-* | 0 classes |
| .auth-layout / .auth-page / .auth-form / .auth-card / .auth-container / .auth-modal / .auth-dialog | none in SSR DOM |
| Class sample | none |

### `/browse`

- **HTTP:** 200
- **Rendered layout:** `app/(platform)/layout.tsx` → `PlatformChromeProviders` + page
- **Rendered components:** Browse (platform)
- **auth-v1 selectors matched:** **0** / 415
- **Auth DOM markers:** ABSENT

| Marker | Evidence |
|---|---|
| data-auth-screen | absent |
| .auth-* / .login-* / .register-* / .verify-* / .password-* | 0 classes |
| .auth-layout / .auth-page / .auth-form / .auth-card / .auth-container / .auth-modal / .auth-dialog | none in SSR DOM |
| Class sample | none |

### `/listing/[slug]`

- **HTTP:** 200 (slug=cabeau-best-neck-pillow-for-travel-evolution-earth-msi2tvgy)
- **Rendered layout:** `app/(platform)/layout.tsx` → `PlatformChromeProviders` + page
- **Rendered components:** Listing detail (platform)
- **auth-v1 selectors matched:** **0** / 415
- **Auth DOM markers:** ABSENT

| Marker | Evidence |
|---|---|
| data-auth-screen | absent |
| .auth-* / .login-* / .register-* / .verify-* / .password-* | 0 classes |
| .auth-layout / .auth-page / .auth-form / .auth-card / .auth-container / .auth-modal / .auth-dialog | none in SSR DOM |
| Class sample | none |

### `/sell`

- **HTTP:** 307 → /login?next=%2Fsell
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/messages`

- **HTTP:** 307 → /login?next=%2Fmessages
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required (no live /messages page without session)
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/notifications`

- **HTTP:** 307 → /login?next=%2Fnotifications
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/wallet`

- **HTTP:** 307 → /login?next=%2Fwallet
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/orders`

- **HTTP:** 307 → /login?next=%2Forders
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/profile`

- **HTTP:** 404
- **Classification:** **NOT VERIFIED**
- **Reason:** No page; use /account (also gated)
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/settings`

- **HTTP:** 307 → /login?next=%2Fsettings
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/business`

- **HTTP:** 308 → /business/dashboard
- **Classification:** **NOT VERIFIED**
- **Reason:** Redirect; dashboard not session-inspected
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

### `/admin`

- **HTTP:** 307 → /login?next=%2Fadmin
- **Classification:** **NOT VERIFIED**
- **Reason:** Auth required
- **Rendered layout / components / DOM markers:** not inspected (gate or missing route)

---

## EVERY MATCHED SELECTOR (verified auth SSR ≥1 route)

Count: **252**

| Selector | DOM evidence | Component(s) | Route(s) | Evidence |
|---|---|---|---|---|
| `.auth-splash__wordmark .text-primary` | token match (partial-classes) | DOM/layout token | /login | SSR HTML token match (partial-classes) on /login; component source layout/DOM only |
| `.auth-primary-button` | token match (all-classes) | PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source PrimaryButton; files: components/auth/PrimaryButton.tsx |
| `.auth-container` | token match (all-classes) | AuthContainer | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source AuthContainer; files: components/auth/AuthContainer.tsx |
| `.rovexo-brand-logo` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email | SSR HTML token match (all-classes) on /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-login .rovexo-brand-logo.rovexo-brand-logo--auth` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-register .rovexo-brand-logo.rovexo-brand-logo--auth` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen, register layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen|register layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-login .rovexo-brand-logo.rovexo-brand-logo--auth .rovexo-brand-logo__canonical-img` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-register .rovexo-brand-logo.rovexo-brand-logo--auth .rovexo-brand-logo__canonical-img` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen, register layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen|register layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-login--cod-sange-v3 .auth-login__brand` | token match (partial-classes) | LoginScreen | /login | SSR HTML token match (partial-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.rovexo-brand-logo--canonical` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.rovexo-brand-logo__canonical-img` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-divider` | token match (all-classes) | DOM/layout token | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source layout/DOM only |
| `.auth-divider__line` | token match (all-classes) | DOM/layout token | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source layout/DOM only |
| `.auth-divider__label` | token match (all-classes) | DOM/layout token | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-container` | token match (partial-classes) | AuthContainer | /login, /login, /login, /register, /register, /register, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email | SSR HTML token match (partial-classes) on /login, /login, /login, /register, /register, /register, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email; component source AuthContainer; files: components/auth/AuthContainer.tsx |
| `.auth-welcome.auth-welcome--premium .auth-welcome__brand .rovexo-brand-logo--auth` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-welcome.auth-welcome--premium .auth-primary-button` | token match (partial-classes) | PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source PrimaryButton; files: components/auth/PrimaryButton.tsx |
| `.auth-welcome.auth-welcome--premium .auth-primary-button:hover:not(:disabled)` | token match (partial-classes) | PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source PrimaryButton; files: components/auth/PrimaryButton.tsx |
| `.auth-welcome.auth-welcome--premium .auth-primary-button:focus-visible` | token match (partial-classes) | PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source PrimaryButton; files: components/auth/PrimaryButton.tsx |
| `.auth-welcome.auth-welcome--premium .auth-divider__line` | token match (partial-classes) | DOM/layout token | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source layout/DOM only |
| `.auth-login-route` | token match (all-classes) | login layout | /login | SSR HTML token match (all-classes) on /login; component source login layout; files: app/(auth)/login/layout.tsx |
| `.auth-login` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login--premium .auth-container` | token match (all-classes) | LoginScreen, AuthContainer | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|AuthContainer; files: features/auth/components/LoginScreen.tsx, components/auth/AuthContainer.tsx |
| `.auth-register--premium .auth-container` | token match (partial-classes) | RegisterScreen, AuthContainer | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen|AuthContainer; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthContainer.tsx |
| `.auth-login--premium .rovexo-brand-logo--auth` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-register--premium .rovexo-brand-logo--auth` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-login--premium .auth-heading` | token match (partial-classes) | LoginScreen | /login, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /forgot-password, /reset-password, /verify-email; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login--premium .auth-heading__title` | token match (partial-classes) | LoginScreen | /login, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /forgot-password, /reset-password, /verify-email; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login--premium .auth-heading__description` | token match (partial-classes) | LoginScreen | /login, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /forgot-password, /reset-password, /verify-email; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-primary-button--gradient` | token match (all-classes) | PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source PrimaryButton; files: components/auth/PrimaryButton.tsx |
| `.auth-form-fields` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx |
| `.auth-icon-field` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|RegisterScreen|ForgotPasswordScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-icon-field__label` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source layout/DOM only |
| `.auth-icon-field__control` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source layout/DOM only |
| `.auth-icon-field__icon` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source layout/DOM only |
| `.auth-icon-field__svg` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|RegisterScreen|ForgotPasswordScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-icon-field__input` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source layout/DOM only |
| `.auth-icon-field__input--password` | token match (all-classes) | DOM/layout token | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source layout/DOM only |
| `.auth-icon-field__input::placeholder` | token match (all-classes) | DOM/layout token | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source layout/DOM only |
| `.auth-icon-field__visibility` | token match (all-classes) | DOM/layout token | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source layout/DOM only |
| `.auth-login .auth-container` | token match (all-classes) | LoginScreen, AuthContainer, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|AuthContainer|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/login/layout.tsx |
| `.auth-register .auth-container` | token match (partial-classes) | RegisterScreen, AuthContainer, register layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen|AuthContainer|register layout; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/register/layout.tsx |
| `.auth-forgot-password .auth-container` | token match (partial-classes) | ForgotPasswordScreen, AuthContainer, forgot layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source ForgotPasswordScreen|AuthContainer|forgot layout; files: features/auth/components/ForgotPasswordScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/forgot-password/layout.tsx |
| `.auth-reset-password .auth-container` | token match (partial-classes) | ResetPasswordScreen, AuthContainer, reset layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source ResetPasswordScreen|AuthContainer|reset layout; files: features/auth/components/ResetPasswordScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/reset-password/layout.tsx |
| `.auth-login__form` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login__meta` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login__remember` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login__forgot` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login__footer` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login__register-prompt` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login--premium .auth-primary-button` | token match (all-classes) | LoginScreen, PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|PrimaryButton; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx |
| `.auth-register--premium .auth-primary-button` | token match (partial-classes) | RegisterScreen, PrimaryButton | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen|PrimaryButton; files: features/auth/components/RegisterScreen.tsx, components/auth/PrimaryButton.tsx |
| `.auth-login.auth-login--premium` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium *` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-container` | token match (all-classes) | LoginScreen, AuthContainer, login layout | /login, /login, /login, /login, /login, /login, /login, /login, /register, /register, /register, /register, /register, /register, /register, /register, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email | SSR HTML token match (all-classes) on /login, /login, /login, /login, /login, /login, /login, /login, /register, /register, /register, /register, /register, /register, /register, /register, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email, /verify-email; component source LoginScreen|AuthContainer|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__back .auth-back-button` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton, login layout | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-back-button` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton, login layout | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-back-button:hover` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton, login layout | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-back-button:focus-visible` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton, login layout | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__brand` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .rovexo-brand-logo--auth` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login--premium .auth-login__brand + .auth-login__form` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login.auth-login--premium .rovexo-brand-logo__wordmark` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (partial-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .rovexo-brand-logo__tagline` | token match (partial-classes) | LoginScreen, login layout | /login | SSR HTML token match (partial-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__intro` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (partial-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-heading` | token match (partial-classes) | LoginScreen, login layout | /login, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /forgot-password, /reset-password, /verify-email; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-heading__title` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /login, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email | SSR HTML token match (partial-classes) on /login, /login, /login, /forgot-password, /forgot-password, /forgot-password, /reset-password, /reset-password, /reset-password, /verify-email, /verify-email, /verify-email; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-heading__description` | token match (partial-classes) | LoginScreen, login layout | /login, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /forgot-password, /reset-password, /verify-email; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__form` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__fields` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__label` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control` | token match (all-classes) | LoginScreen, login layout | /login, /login, /register, /register, /forgot-password, /forgot-password | SSR HTML token match (all-classes) on /login, /login, /register, /register, /forgot-password, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:hover` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:focus-within` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:has(.auth-icon-field__input--invalid)` | token match (partial-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:has(.auth-icon-field__input:invalid:not(:focus):not(:placeholder-shown))` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:has(.auth-icon-field__input:disabled)` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:has(
  .auth-icon-field__input:valid:not(:placeholder-shown):not(:focus):not(.auth-icon-field__input--invalid)
)` | token match (partial-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__icon` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:focus-within .auth-icon-field__icon` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:has(.auth-icon-field__input--invalid) .auth-icon-field__icon` | token match (partial-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__input` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__input::placeholder` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__visibility` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__visibility:hover` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__visibility:active` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__visibility:focus-visible` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-icon-field__control:focus-within .auth-icon-field__visibility` | token match (all-classes) | LoginScreen, login layout | /login, /register, /forgot-password | SSR HTML token match (all-classes) on /login, /register, /forgot-password; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__meta` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__remember` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__remember span` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__forgot` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__forgot:hover` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__forgot:focus-visible` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__cta` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-primary-button` | token match (all-classes) | LoginScreen, PrimaryButton, login layout | /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email | SSR HTML token match (all-classes) on /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email; component source LoginScreen|PrimaryButton|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-primary-button:hover:not(:disabled)` | token match (all-classes) | LoginScreen, PrimaryButton, login layout | /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email | SSR HTML token match (all-classes) on /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email; component source LoginScreen|PrimaryButton|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-primary-button:active:not(:disabled)` | token match (all-classes) | LoginScreen, PrimaryButton, login layout | /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email | SSR HTML token match (all-classes) on /login, /login, /register, /register, /forgot-password, /forgot-password, /reset-password, /reset-password, /verify-email, /verify-email; component source LoginScreen|PrimaryButton|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-primary-button:disabled` | token match (all-classes) | LoginScreen, PrimaryButton, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|PrimaryButton|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-primary-button:focus-visible` | token match (all-classes) | LoginScreen, PrimaryButton, login layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|PrimaryButton|login layout; files: features/auth/components/LoginScreen.tsx, components/auth/PrimaryButton.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__trust` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__trust-title` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__trust-icon` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__trust-copy` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__social` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (partial-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__oauth` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-divider` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-divider__line` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-divider__label` | token match (all-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-social-login` | token match (partial-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-social-button` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /register, /register | SSR HTML token match (partial-classes) on /login, /login, /register, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-social-button:hover:not(:disabled)` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /register, /register | SSR HTML token match (partial-classes) on /login, /login, /register, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-social-button:active:not(:disabled)` | token match (partial-classes) | LoginScreen, login layout | /login, /login, /register, /register | SSR HTML token match (partial-classes) on /login, /login, /register, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-social-button:focus-visible` | token match (partial-classes) | LoginScreen, login layout | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__footer` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__register-prompt` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__register-cta` | token match (all-classes) | LoginScreen, login layout | /login, /login, /login | SSR HTML token match (all-classes) on /login, /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `a.auth-login__register-cta` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login.auth-login--premium .auth-login__register-cta:hover` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-login.auth-login--premium .auth-login__register-cta:focus-visible` | token match (all-classes) | LoginScreen, login layout | /login, /login | SSR HTML token match (all-classes) on /login, /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `a.auth-login__register-cta:hover` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `a.auth-login__register-cta:focus-visible` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-login.auth-login--premium .auth-login__register-cta:active` | token match (all-classes) | LoginScreen, login layout | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen|login layout; files: features/auth/components/LoginScreen.tsx, app/(auth)/login/layout.tsx |
| `a.auth-login__register-cta:active` | token match (all-classes) | LoginScreen | /login | SSR HTML token match (all-classes) on /login; component source LoginScreen; files: features/auth/components/LoginScreen.tsx |
| `.auth-platform-theme` | token match (all-classes) | LoginScreen, RegisterScreen, VerifyEmailScreen | /login, /register, /verify-email | SSR HTML token match (all-classes) on /login, /register, /verify-email; component source LoginScreen|RegisterScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-login.auth-login--premium.auth-platform-theme` | token match (all-classes) | LoginScreen, RegisterScreen, VerifyEmailScreen, login layout | /login, /register, /verify-email | SSR HTML token match (all-classes) on /login, /register, /verify-email; component source LoginScreen|RegisterScreen|VerifyEmailScreen|login layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/login/layout.tsx |
| `.auth-register.auth-register--premium.auth-platform-theme` | token match (partial-classes) | LoginScreen, RegisterScreen, VerifyEmailScreen, register layout | /login, /register, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /verify-email; component source LoginScreen|RegisterScreen|VerifyEmailScreen|register layout; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/VerifyEmailScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-container` | token match (partial-classes) | RegisterScreen, AuthContainer, register layout | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen|AuthContainer|register layout; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthContainer.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-icon-field__control` | token match (partial-classes) | RegisterScreen, register layout | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-icon-field__control:focus-within` | token match (partial-classes) | RegisterScreen, register layout | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-compact-premium.auth-login--premium .auth-container` | token match (all-classes) | LoginScreen, RegisterScreen, AuthContainer | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|AuthContainer; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthContainer.tsx |
| `.auth-compact-premium.auth-register--premium .auth-container` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthContainer | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|AuthContainer; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthContainer.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__form` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-register__form` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__fields` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-form-fields` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen | /login, /register, /forgot-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx |
| `.auth-compact-premium.auth-login--premium .rovexo-brand-logo--auth` | token match (all-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-heading` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-heading` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__cta` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-register__cta` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-login__trust` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__trust` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-login__trust-title` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__trust-title` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-login__trust-icon` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__trust-icon` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-login__trust-copy` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__trust-copy` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__checkboxes` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-login__footer` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-register__footer` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-secondary-button--platform` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /login, /register, /register | SSR HTML token match (partial-classes) on /login, /login, /register, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium a.auth-secondary-button.auth-secondary-button--platform` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /login, /register, /register, /reset-password, /reset-password | SSR HTML token match (partial-classes) on /login, /login, /register, /register, /reset-password, /reset-password; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-secondary-button--platform:hover` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-secondary-button--platform:focus-visible` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium a.auth-secondary-button.auth-secondary-button--platform:hover` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /reset-password; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium a.auth-secondary-button.auth-secondary-button--platform:focus-visible` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /reset-password; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-secondary-button--platform:active` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium a.auth-secondary-button.auth-secondary-button--platform:active` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /reset-password; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium .auth-back-button--platform` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-back-button` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx |
| `.auth-compact-premium .auth-back-button--platform:hover` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-back-button:hover` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx |
| `.auth-compact-premium .auth-back-button--platform:focus-visible` | token match (partial-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (partial-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-register--premium .auth-back-button:focus-visible` | token match (partial-classes) | LoginScreen, RegisterScreen, AuthBackButton | /login, /register, /forgot-password, /reset-password | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password; component source LoginScreen|RegisterScreen|AuthBackButton; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__footer` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-prompt` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-prefix` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-cta` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium a.auth-login__register-cta` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-cta:hover` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-cta:focus-visible` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium a.auth-login__register-cta:hover` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium a.auth-login__register-cta:focus-visible` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium .auth-login__register-cta:active` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-compact-premium.auth-login--premium a.auth-login__register-cta:active` | token match (all-classes) | LoginScreen, RegisterScreen | /login, /register | SSR HTML token match (all-classes) on /login, /register; component source LoginScreen|RegisterScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx |
| `.auth-verify-email .rovexo-brand-logo--auth` | token match (partial-classes) | LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailScreen | /login, /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /login, /register, /forgot-password, /reset-password, /verify-email; component source LoginScreen|RegisterScreen|ForgotPasswordScreen|ResetPasswordScreen|VerifyEmailScreen; files: features/auth/components/LoginScreen.tsx, features/auth/components/RegisterScreen.tsx, features/auth/components/ForgotPasswordScreen.tsx, features/auth/components/ResetPasswordScreen.tsx, features/auth/components/VerifyEmailScreen.tsx |
| `.auth-social-login` | token match (all-classes) | DOM/layout token | /register | SSR HTML token match (all-classes) on /register; component source layout/DOM only |
| `.auth-social-button` | token match (all-classes) | DOM/layout token | /register | SSR HTML token match (all-classes) on /register; component source layout/DOM only |
| `.auth-social-button__icon` | token match (all-classes) | DOM/layout token | /register | SSR HTML token match (all-classes) on /register; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-social-login` | token match (partial-classes) | DOM/layout token | /register | SSR HTML token match (partial-classes) on /register; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-social-button` | token match (partial-classes) | DOM/layout token | /register | SSR HTML token match (partial-classes) on /register; component source layout/DOM only |
| `.auth-register-route` | token match (all-classes) | register layout | /register | SSR HTML token match (all-classes) on /register; component source register layout; files: app/(auth)/register/layout.tsx |
| `.auth-register` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register--premium .auth-heading` | token match (partial-classes) | RegisterScreen | /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register--premium .auth-heading__title` | token match (partial-classes) | RegisterScreen | /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register--premium .auth-heading__description` | token match (partial-classes) | RegisterScreen | /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register__back` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-back-button` | token match (all-classes) | RegisterScreen, AuthBackButton | /register, /forgot-password, /reset-password | SSR HTML token match (all-classes) on /register, /forgot-password, /reset-password; component source RegisterScreen|AuthBackButton; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx |
| `.auth-back-button__icon` | token match (all-classes) | AuthBackButton | /register, /forgot-password, /reset-password | SSR HTML token match (all-classes) on /register, /forgot-password, /reset-password; component source AuthBackButton; files: components/auth/AuthBackButton.tsx |
| `.auth-back-button__label` | token match (all-classes) | AuthBackButton | /register, /forgot-password, /reset-password | SSR HTML token match (all-classes) on /register, /forgot-password, /reset-password; component source AuthBackButton; files: components/auth/AuthBackButton.tsx |
| `.auth-register__form` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register__footer` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register__sign-in-prompt` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register__checkboxes` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox__input` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox--compact .auth-register-checkbox__input` | token match (partial-classes) | RegisterScreen | /register | SSR HTML token match (partial-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox__text` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox--compact .auth-register-checkbox__text` | token match (partial-classes) | RegisterScreen | /register | SSR HTML token match (partial-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox__link` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register-checkbox__link:hover` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register--premium .auth-register__brand + .auth-register__form` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register.auth-register--premium .auth-register__sign-in-prompt a` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium` | token match (all-classes) | RegisterScreen, register layout | /register, /register | SSR HTML token match (all-classes) on /register, /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-register__back .auth-back-button` | token match (all-classes) | RegisterScreen, AuthBackButton, register layout | /register, /forgot-password, /reset-password | SSR HTML token match (all-classes) on /register, /forgot-password, /reset-password; component source RegisterScreen|AuthBackButton|register layout; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-back-button` | token match (all-classes) | RegisterScreen, AuthBackButton, register layout | /register, /forgot-password, /reset-password | SSR HTML token match (all-classes) on /register, /forgot-password, /reset-password; component source RegisterScreen|AuthBackButton|register layout; files: features/auth/components/RegisterScreen.tsx, components/auth/AuthBackButton.tsx, app/(auth)/register/layout.tsx |
| `.auth-register--canonical-freeze .auth-register__brand` | token match (all-classes) | RegisterScreen | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register--canonical-freeze .auth-register__sign-in-prompt` | token match (all-classes) | RegisterScreen | /register, /register | SSR HTML token match (all-classes) on /register, /register; component source RegisterScreen; files: features/auth/components/RegisterScreen.tsx |
| `.auth-register.auth-register--premium .rovexo-brand-logo__wordmark` | token match (partial-classes) | RegisterScreen, register layout | /register | SSR HTML token match (partial-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-heading__title` | token match (partial-classes) | RegisterScreen, register layout | /register, /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /register, /forgot-password, /reset-password, /verify-email; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-register-checkbox__link` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium *` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-register__oauth` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-register__oauth .auth-social-login` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-register.auth-register--premium .auth-register__oauth .auth-social-button` | token match (all-classes) | RegisterScreen, register layout | /register | SSR HTML token match (all-classes) on /register; component source RegisterScreen|register layout; files: features/auth/components/RegisterScreen.tsx, app/(auth)/register/layout.tsx |
| `.auth-heading` | token match (all-classes) | DOM/layout token | /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-heading__title` | token match (all-classes) | DOM/layout token | /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-heading__description` | token match (all-classes) | DOM/layout token | /forgot-password, /reset-password, /verify-email | SSR HTML token match (all-classes) on /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-heading__title` | token match (partial-classes) | DOM/layout token | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-heading__description` | token match (partial-classes) | DOM/layout token | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source layout/DOM only |
| `.auth-forgot-password-route` | token match (all-classes) | forgot layout | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source forgot layout; files: app/(auth)/forgot-password/layout.tsx |
| `.auth-forgot-password` | token match (all-classes) | ForgotPasswordScreen, forgot layout | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source ForgotPasswordScreen|forgot layout; files: features/auth/components/ForgotPasswordScreen.tsx, app/(auth)/forgot-password/layout.tsx |
| `.auth-forgot-password__back` | token match (all-classes) | ForgotPasswordScreen | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source ForgotPasswordScreen; files: features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-forgot-password__form` | token match (all-classes) | ForgotPasswordScreen | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source ForgotPasswordScreen; files: features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-forgot-password__footer` | token match (all-classes) | ForgotPasswordScreen | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source ForgotPasswordScreen; files: features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-forgot-password__sign-in-prompt` | token match (all-classes) | ForgotPasswordScreen | /forgot-password | SSR HTML token match (all-classes) on /forgot-password; component source ForgotPasswordScreen; files: features/auth/components/ForgotPasswordScreen.tsx |
| `.auth-reset-password__success .auth-heading` | token match (partial-classes) | ResetPasswordScreen | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source ResetPasswordScreen; files: features/auth/components/ResetPasswordScreen.tsx |
| `.auth-verify-email__panel .auth-heading` | token match (partial-classes) | VerifyEmailScreen | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__panel .auth-heading__title` | token match (partial-classes) | VerifyEmailScreen | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__panel .auth-heading__description` | token match (partial-classes) | VerifyEmailScreen | /forgot-password, /reset-password, /verify-email | SSR HTML token match (partial-classes) on /forgot-password, /reset-password, /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-secondary-button` | token match (all-classes) | DOM/layout token | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-secondary-button` | token match (partial-classes) | DOM/layout token | /reset-password | SSR HTML token match (partial-classes) on /reset-password; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-secondary-button:hover:not(:disabled)` | token match (partial-classes) | DOM/layout token | /reset-password | SSR HTML token match (partial-classes) on /reset-password; component source layout/DOM only |
| `.auth-welcome.auth-welcome--premium .auth-secondary-button:focus-visible` | token match (partial-classes) | DOM/layout token | /reset-password | SSR HTML token match (partial-classes) on /reset-password; component source layout/DOM only |
| `.auth-reset-password-route` | token match (all-classes) | reset layout | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source reset layout; files: app/(auth)/reset-password/layout.tsx |
| `.auth-reset-password` | token match (all-classes) | ResetPasswordScreen, reset layout | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source ResetPasswordScreen|reset layout; files: features/auth/components/ResetPasswordScreen.tsx, app/(auth)/reset-password/layout.tsx |
| `.auth-reset-password__back` | token match (all-classes) | ResetPasswordScreen | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source ResetPasswordScreen; files: features/auth/components/ResetPasswordScreen.tsx |
| `.auth-reset-password__token-error` | token match (all-classes) | ResetPasswordScreen | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source ResetPasswordScreen; files: features/auth/components/ResetPasswordScreen.tsx |
| `.auth-reset-password__token-actions` | token match (all-classes) | ResetPasswordScreen | /reset-password | SSR HTML token match (all-classes) on /reset-password; component source ResetPasswordScreen; files: features/auth/components/ResetPasswordScreen.tsx |
| `.auth-verify-email` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__container` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__panel` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__icon` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__icon-svg` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__icon--created` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__icon--expired .auth-verify-email__icon-svg` | token match (partial-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (partial-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__actions` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__resend-link` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |
| `.auth-verify-email__resend-link:disabled` | token match (all-classes) | VerifyEmailScreen | /verify-email | SSR HTML token match (all-classes) on /verify-email; component source VerifyEmailScreen; files: features/auth/components/VerifyEmailScreen.tsx |

---

## EVERY UNMATCHED SELECTOR (absent from all verified auth SSR)

Count: **108**

| Selector | Classification | Notes |
|---|---|---|
| `.auth-splash-route` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash--ssr` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash--live` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash--exit` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__stage` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__mark` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__wordmark` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__wordmark-x` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__tagline` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__indicator` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__indicator span` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash__indicator span:nth-child(2)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash__indicator span:nth-child(3)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash__stage--wordmark-only .auth-splash__wordmark` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash__stage--wordmark-only .auth-splash__tagline` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-splash__pulse` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__wordmark` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash--live
  .auth-splash__stage--wordmark-only
  .auth-splash__tagline` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash--live .auth-splash__stage--wordmark-only .auth-splash__pulse` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-splash__stage--wordmark-only .auth-splash__pulse` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-layout--hero` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-layout--form main` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-welcome-route` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-logo` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-login--cod-sange-v3 .auth-login__intro` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo--canonical-3d` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__tagline` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.rovexo-brand-logo__buy` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__grow` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__sell` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__dot` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__wordmark` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.rovexo-brand-logo__wordmark .rx-wordmark__rove` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__wordmark .rx-wordmark__o` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.rovexo-brand-logo__wordmark .rx-wordmark__x` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome__actions` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome__footer` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome__legal` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-welcome.auth-welcome--premium .rovexo-brand-logo__wordmark` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-welcome.auth-welcome--premium .rovexo-brand-logo__tagline` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__actions` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__trust` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__trust-title` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__trust-icon` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__trust-copy` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__social` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__footer` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__legal` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-welcome.auth-welcome--premium .auth-welcome__legal a` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-login__back` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-icon-field__control--solo` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-icon-field__input--solo` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-name-row` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-icon-field__input--invalid` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-icon-field__error` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-icon-field__hint` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-reset-password__form` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-reset-password__submit-pending` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-reset-password__success` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-forgot-password__submit-pending` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-forgot-password__success` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-forgot-password__success-actions` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-login__submit-pending` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-register__submit-pending` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength__bars` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength__bar` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength__bar--filled` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-strength__bar--level-1` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-strength__bar--level-2` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-strength__bar--level-3` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-strength__bar--level-4` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-strength__bar--level-5` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-checklist` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-checklist__item` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-checklist__item--met` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-checklist__mark` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-reset-password__password-meta` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-reset-password__success-icon` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength__label` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-password-strength__hint` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-register__checkboxes--compact` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-register-checkbox--compact` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-reqs` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-reqs__item` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-password-reqs__item--met` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `:root` | Not verified | Element/complex selector without class/attr/id tokens; SSR method cannot prove. |
| `.auth-verify-email__icon--verifying` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__icon--success` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__icon--expired` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__email-chip` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__email-icon` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__resend-form` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-verify-email__full-form` | Unused | Not in verified auth SSR DOM and no matching class token found in features/auth + components/auth source (static). Still may be CSS-only ancestor/descendant; classified Unused for auth-surface SSR evidence only — NOT proven for gated marketplace. |
| `.auth-verify-email__hint` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__progress` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__progress-bar` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__success-burst span` | Conditional | Token exists in auth component source but not in SSR HTML of verified routes (likely success/error/MFA/client state). Not proven unused. |
| `.auth-verify-email__success-burst span:nth-child(1)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst span:nth-child(2)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst span:nth-child(3)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst span:nth-child(4)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst span:nth-child(5)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |
| `.auth-verify-email__success-burst span:nth-child(6)` | Conditional | Pseudo-state or media/support conditional; base tokens may match elsewhere or only on interaction. |

---

## Absolute rules honored

- No CSS changes · No import changes · No file moves · No refactor · No delete · No rename
- No commit · No push · No deploy
- No assumption that gated routes are UNUSED
- Evidence only

## STOP

Phase 3 final certification document complete. No further action authorized under this Blood Code.
