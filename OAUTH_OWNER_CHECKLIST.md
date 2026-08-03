# OAUTH OWNER CHECKLIST

**STATUS:** OWNER ACTION REQUIRED  
**Mode:** Owner operations only · Application frozen  
**Evidence date:** 2026-08-02  

**Companion docs:**

- `GOOGLE_OAUTH_CONFIGURATION.md`
- `APPLE_OAUTH_CONFIGURATION.md`

**Policy:** Public Login/Register OAuth = **Google + Apple only**. Facebook = **not** required (RC1 public forbidden).

---

## FINAL VERDICT (this run)

| Gate | Status |
|------|--------|
| Application OAuth wiring (frozen) | **PASS** (code not in scope; APPLICATION READY = YES) |
| Google production configuration | **OWNER ACTION REQUIRED** |
| Apple production configuration | **OWNER ACTION REQUIRED** |
| Post-config live verification (all devices) | **OWNER ACTION REQUIRED** |
| Facebook public | N/A (not officially supported on public UI) |

```text
GOOGLE OAUTH = OWNER ACTION REQUIRED
APPLE OAUTH  = OWNER ACTION REQUIRED
```

---

## Evidence (live · no guesses)

| Check | Result |
|-------|--------|
| Supabase URL | `https://pklotmwxtnnepaitedic.supabase.co` |
| Supabase callback | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| App Site URL (canonical) | `https://www.rovexo.co.uk` |
| App callback | `https://www.rovexo.co.uk/auth/callback` |
| Local callback | `http://localhost:3000/auth/callback` |
| `external.google` | `false` |
| `external.apple` | `false` |
| `external.email` | `true` |
| Google authorize | HTTP **400** `provider is not enabled` |
| Apple authorize | HTTP **400** `provider is not enabled` |
| `GOOGLE_*` / `APPLE_*` client secrets in app env | **Not used** by this stack (secrets → Supabase Dashboard) |

---

## A. Exact URLs (copy-paste)

### Google Cloud — Authorized JavaScript Origins

```text
https://www.rovexo.co.uk
http://localhost:3000
```

### Google Cloud — Authorized Redirect URIs

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

### Apple — Domains

```text
pklotmwxtnnepaitedic.supabase.co
```

### Apple — Return URLs

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

### Supabase — Site URL

```text
https://www.rovexo.co.uk
```

### Supabase — Additional Redirect URLs

```text
https://www.rovexo.co.uk/auth/callback
http://localhost:3000/auth/callback
```

Optional staging (only if used):

```text
https://staging.rovexo.com/auth/callback
```

---

## B. Google — Owner steps (summary)

1. Google Cloud → OAuth consent screen (External) → scopes `openid` `email` `profile` → publish when ready.  
2. Create **Web application** OAuth client.  
3. Set JS origins + Redirect URI from §A.  
4. Copy **Client ID** + **Client Secret** (real values only).  
5. Supabase → Authentication → Providers → **Google** → Enable → paste → Save.  
6. Confirm URL Configuration (§A).  
7. Verify authorize ≠ 400.  

**Secrets:** OWNER FILLS in Supabase only. **Never invent. Never commit.**

---

## C. Apple — Owner steps (summary)

1. Apple Developer → App ID with Sign In with Apple.  
2. Services ID → Domains + Return URL from §A.  
3. Create Key → download `.p8` → record Key ID + Team ID.  
4. Supabase → Providers → **Apple** → Enable → Services ID + `.p8` + Key ID + Team ID → Save.  
5. Confirm URL Configuration (§A).  
6. Verify authorize ≠ 400.  

**Secrets:** OWNER FILLS in Supabase only. **Never invent. Never commit.**

---

## D. Environment variables (app)

### Required (names — use Production values already managed by Owner)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only |
| `NEXT_PUBLIC_SITE_URL` | Must be `https://www.rovexo.co.uk` in Production |
| `NEXT_PUBLIC_APP_URL` | Must match Site URL if set |

### Optional (UI probe overrides — not IdP secrets)

| Variable | Role |
|----------|------|
| `OAUTH_GOOGLE_ENABLED` | Force show/hide Google button probe |
| `OAUTH_APPLE_ENABLED` | Force show/hide Apple button probe |

### Not required in Vercel for OAuth client credentials

| Do not invent in app env |
|--------------------------|
| Google Client ID / Secret |
| Apple Services ID / Team ID / Key ID / `.p8` / client secret JWT |

Those belong in **Supabase Auth Providers**.

---

## E. Verification matrix (Owner after enable)

Run on **`https://www.rovexo.co.uk`** (not localhost for Production PASS).

| # | Test | Google | Apple |
|---|------|--------|-------|
| 1 | Login | ☐ | ☐ |
| 2 | Logout | ☐ | ☐ |
| 3 | Session restore (refresh) | ☐ | ☐ |
| 4 | Expired session behaviour | ☐ | ☐ |
| 5 | Refresh token / long session | ☐ | ☐ |
| 6 | Desktop Chrome | ☐ | ☐ |
| 7 | Desktop Safari / Firefox | ☐ | ☐ |
| 8 | Mobile Safari (iPhone) | ☐ | ☐ |
| 9 | Chrome Android | ☐ | ☐ |
| 10 | iPad | ☐ | ☐ |
| 11 | Multiple browsers same account | ☐ | ☐ |

### Automated smoke (Owner or agent with network)

```bash
# Expect 302/303 Location to IdP — NOT 400 provider is not enabled
curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=apple&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
```

```bash
# Expect external.google=true and external.apple=true
curl -s "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/settings" | head
```

---

## F. Status legend

| Status | Meaning |
|--------|---------|
| **PASS** | Evidence proves configured and verified |
| **WARNING** | Partial / optional gap (e.g. consent still in Testing) |
| **OWNER ACTION REQUIRED** | Dashboard/credentials/device tests only Owner can complete |

### Current scoring

| Item | Status |
|------|--------|
| Exact production URLs documented | **PASS** |
| Env var **names** documented (no fake values) | **PASS** |
| Google Client ID/Secret in Supabase | **OWNER ACTION REQUIRED** |
| Apple Services ID / Key / Team / `.p8` in Supabase | **OWNER ACTION REQUIRED** |
| Providers enabled (live settings) | **OWNER ACTION REQUIRED** |
| Device login matrix | **OWNER ACTION REQUIRED** |
| Consent screen Production publishing | **WARNING** until Owner publishes (after enable) |

---

## G. Forbidden

- Inventing Client IDs, Secrets, Team IDs, Key IDs, Services IDs  
- Application code / callback / auth rewrites  
- Commit · Push · Preview · Production deploy from this task  
- Declaring Google/Apple **PASS** without live authorize ≠ 400 + Owner device evidence  

---

**No code. Evidence only. No commit. No push. No Preview. No Production.**
