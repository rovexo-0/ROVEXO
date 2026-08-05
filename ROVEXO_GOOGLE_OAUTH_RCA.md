# ROVEXO GOOGLE OAUTH — ROOT CAUSE ANALYSIS

**STATUS:** RCA COMPLETE · IMPLEMENTATION CORRECT · SMOKE METHOD WAS WRONG  
**DATE:** 2026-08-05  
**HOST:** `http://127.0.0.1:3000/login`  
**PARENT:** `ROVEXO_FINAL_PRODUCTION_CERTIFICATION.md` (false negative on Google button)

```
NO FEATURE CHANGES · NO COMMIT · NO PUSH · NO DEPLOY
```

---

## Executive Verdict

| Question | Answer |
|----------|--------|
| Is the Google button missing in the product? | **NO** — Owner is correct; button is visible after hydration |
| Was production cert wrong about “button not present”? | **YES** — false negative from SSR/`curl` string search |
| Classification | **#2 Incorrect selector/method** (+ intentional **client-only** OAuth UI) |
| Actual OAuth flow failure? | **NO** for render + click → Google redirect (automated PASS) |
| Full consent → callback → session? | **Owner live** (requires Google account; not auto-completed) |

**Root cause:** Final cert smoke used raw HTTP HTML and searched for `"Continue with Google"`.  
`AuthOAuthButtons` is loaded with `next/dynamic(..., { ssr: false })`, so that string is **never** in SSR HTML. The server still correctly passes `oauthProviders: ["google"]`; the button mounts on the client.

---

## Classification Checklist

| Hypothesis | Result |
|------------|--------|
| 1. Outdated test | **PARTIAL** — method obsolete for client-hydrated OAuth UI |
| 2. Incorrect selector / method | **PRIMARY** — curl SSR ≠ visible UI |
| 3. Timing/race | **CONTRIBUTING** — button appears only after JS hydrate; curl never waits |
| 4. Environment configuration | **NOT the false-negative cause** — Google provider is enabled (redirect works) |
| 5. Actual OAuth flow failure | **NOT for button/redirect** — click reaches `accounts.google.com` |

---

## Evidence — Implementation (canonical)

### Render path

```
app/(auth)/login/page.tsx
  → loadPublicOauthProviders()   // server probe
  → LoginScreen oauthProviders={...}
  → showOAuth = oauthProviders.length > 0
  → dynamic(AuthOAuthButtons, { ssr: false })   // CLIENT ONLY
  → SocialButton data-testid="oauth-google"
```

### Click path

```
SocialButton onClick
  → FormData { provider: "google", returnPath: "/login" }
  → signInWithOAuthProvider (server action)
  → supabase.auth.signInWithOAuth({ provider: "google", redirectTo: …/auth/callback })
  → redirect(data.url)  // Google IdP
```

### Callback path

```
GET /auth/callback?code=…
  → exchangeCodeForSession(code)
  → syncAutoVerifiedProfile
  → MFA challenge if required
  → redirect(next)
```

Canonical UI selectors:

- `[data-oauth-surface="login"]`
- `[data-testid="oauth-google"]`
- `button[data-oauth-provider="google"]`
- Visible label: `Continue with Google`

---

## Evidence — Why cert said “not present”

Final cert Python smoke (approx):

```python
'Continue with Google' in curl(/login body)
→ False   # SSR has no client OAuth chunk
```

Observed SSR facts:

- `"Continue with Google"` **absent** from SSR HTML  
- `data-testid="oauth-google"` **absent** from SSR HTML  
- OAuth chunk referenced as dynamic client import  

Owner browser: button **visible** after hydration.

---

## Evidence — Corrected smoke (Playwright)

Script: `test-results/google-oauth-rca/run-google-oauth-smoke.cjs`  
Results: `test-results/google-oauth-rca/smoke-result.json` · `SMOKE.md`

| Check | Result |
|-------|--------|
| SSR text “Continue with Google” | **false** (expected) |
| Hydrated `[data-testid="oauth-google"]` visible | **PASS** |
| aria-label | `Continue with Google` |
| Click → URL | **PASS** → `https://accounts.google.com/...` |
| Supabase client_id / redirect_uri present | **PASS** (in Google URL) |
| App callback target | `…/auth/callback?next=…` (in OAuth params) |
| Full Google consent + session cookie | **Owner live only** |

`SMOKE_EXIT: 0`

---

## End-to-end status

| Step | Status |
|------|--------|
| Google button rendered | **PASS** (hydrated) |
| Click handler attached | **PASS** |
| `signInWithOAuth` invoked | **PASS** (redirect proves server action) |
| Redirect to Google | **PASS** |
| Callback received | **Owner live** (after consent) |
| User session created | **Owner live** |
| Return to application | **Owner live** |

---

## Smoke test update (done)

Replaced invalid SSR curl assumption with Playwright canonical smoke:

- Waits for `[data-testid="oauth-google"]`
- Asserts visibility + attributes
- Clicks and asserts navigation to Google (or Supabase authorize / oauth error URL)

Run:

```bash
node test-results/google-oauth-rca/run-google-oauth-smoke.cjs
```

---

## Correction to Final Cert wording

Previous claim:

> Google OAuth smoke — Google button not present on Login → **FAIL**

Corrected claim:

> Google OAuth **SSR curl smoke was invalid**. Canonical hydrated smoke → button **PASS**; click→Google **PASS**. Full IdP consent/session remains Owner live confirmation (SSOT `GOOGLE_LIVE` still awaiting Owner product confirmation if required elsewhere).

---

## What was not changed

- No OAuth feature / UI redesign  
- No auth architecture rewrite  
- No commit / push / deploy  

---

## Bottom line

**The product was right. The smoke test was wrong.**  
False negative caused by testing SSR HTML for a client-only (`ssr: false`) Google button.
