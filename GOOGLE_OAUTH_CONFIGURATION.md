# GOOGLE OAUTH CONFIGURATION

**STATUS:** OWNER ACTION REQUIRED  
**Mode:** Owner operations only · Application frozen · No code · No invented credentials  
**Evidence date:** 2026-08-02  

**Production project (evidence):** `https://pklotmwxtnnepaitedic.supabase.co`  
**Canonical app origin:** `https://www.rovexo.co.uk`  
**ROVEXO callback path:** `/auth/callback`  

**Live probe (before Owner config):**

| Check | Evidence |
|-------|----------|
| `external.google` in `/auth/v1/settings` | `false` |
| Authorize Google | HTTP **400** `provider is not enabled` |

---

## Section status: OWNER ACTION REQUIRED

Google Client ID and Client Secret are **created in Google Cloud** and **stored only in Supabase Auth → Providers → Google**.  
They are **not** present as ROVEXO application environment variables in this architecture.  
**Never invent Client IDs or Secrets.** Owner pastes real values from Google Cloud into Supabase.

---

## 1. Google Cloud Console

### 1.1 Project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create the GCP project that owns ROVEXO production OAuth (Owner decision — do not invent project name/ID here).

### 1.2 Required APIs

1. APIs & Services → Library.
2. Ensure **Google+ API** / Identity services needed for Google Sign-In are available for OAuth clients (use Google’s current “Google Identity” / OAuth consent flow).
3. No ROVEXO app code change is required when enabling APIs.

### 1.3 OAuth Consent Screen

1. APIs & Services → **OAuth consent screen**.
2. User type: **External** (unless Owner uses Workspace Internal only).
3. App name: **ROVEXO** (or Owner-approved brand string).
4. User support email: Owner support address (e.g. `support@rovexo.co.uk` if that mailbox is live).
5. App logo / domain: use `www.rovexo.co.uk` as authorized domain when prompted.
6. Developer contact: Owner email.
7. **Scopes** (minimum for Supabase Google Auth):
   - `openid`
   - `email`
   - `profile`  
   (Add only what Supabase/Google Sign-In requires — do not expand scopes without Owner legal review.)
8. **Publishing status:**
   - While testing: **Testing** + add test users.
   - For public production login: move to **In production** / publish app when Google verification requirements are met.
9. Save.

### 1.4 Create OAuth Client

1. APIs & Services → **Credentials** → **Create credentials** → **OAuth client ID**.
2. **Application type:** **Web application**.
3. Name: e.g. `ROVEXO Production Web` (Owner label only).

### 1.5 Authorized JavaScript Origins (exact)

Add **exactly**:

```text
https://www.rovexo.co.uk
http://localhost:3000
```

Optional (only if that host serves this Supabase project):

```text
https://staging.rovexo.com
```

**Do not** add wildcards.  
**Do not** treat `https://rovexo.com` as the app origin unless Owner confirms that host serves ROVEXO (current ops evidence: it does not).

### 1.6 Authorized Redirect URIs (exact)

This must be the **Supabase Auth callback**, not the ROVEXO page path:

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

Local/dev (only if using the same or a dedicated Supabase project):

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

(Same URI is used for local and production when using one Supabase project; Google redirects to Supabase, then Supabase redirects to the app.)

### 1.7 Copy credentials (Owner only)

After create:

| Field | Where it goes | Value in this doc |
|-------|----------------|-------------------|
| Client ID | Supabase → Google provider | **OWNER FILLS — never invent** |
| Client Secret | Supabase → Google provider | **OWNER FILLS — never invent** |

Store Client Secret in a password manager. Do not commit to git.

---

## 2. Supabase configuration

### 2.1 Provider

1. Supabase Dashboard → Project **`pklotmwxtnnepaitedic`**.
2. **Authentication** → **Providers** → **Google**.
3. Toggle **Enable Sign in with Google**.

### 2.2 Client ID / Client Secret

| Supabase field | Source |
|----------------|--------|
| Client ID | Google Cloud OAuth Web client → Client ID |
| Client Secret | Google Cloud OAuth Web client → Client Secret |

Paste → **Save**.

### 2.3 Redirect / Callback URL map

| Role | Exact URL |
|------|-----------|
| **Supabase OAuth callback** (Google Redirect URI) | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| **ROVEXO app callback** (post-Supabase) | `https://www.rovexo.co.uk/auth/callback` |
| Local app callback | `http://localhost:3000/auth/callback` |

Flow:

```text
User → Google → Supabase /auth/v1/callback → ROVEXO /auth/callback → Session → Homepage
```

### 2.4 Site URL + Additional Redirect URLs

Authentication → **URL Configuration**:

| Setting | Exact value |
|---------|-------------|
| **Site URL** | `https://www.rovexo.co.uk` |
| **Additional Redirect URLs** | `https://www.rovexo.co.uk/auth/callback` |
| | `http://localhost:3000/auth/callback` |
| Optional staging | `https://staging.rovexo.com/auth/callback` |

Save.

### 2.5 Account linking (recommended)

Enable Supabase **automatic linking** for the same verified email so Google does not create a duplicate user (aligns with RC1 account-linking policy). Owner confirms in Auth settings.

---

## 3. Environment variables

### 3.1 Required for ROVEXO app (names only — values already owned by Production)

Google Client ID/Secret are **not** ROVEXO `GOOGLE_*` env vars in this stack. They live in Supabase.

| Variable | Required for Google OAuth to work in app | Notes |
|----------|------------------------------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Must be `https://pklotmwxtnnepaitedic.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable equivalent) | YES | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (server) | Not for browser OAuth start |
| `NEXT_PUBLIC_SITE_URL` | YES | Canonical: `https://www.rovexo.co.uk` |
| `NEXT_PUBLIC_APP_URL` | YES if used by `getAppUrl()` | Must match Site URL in production |

### 3.2 Optional UI force flags (not secrets)

| Variable | Purpose |
|----------|---------|
| `OAUTH_GOOGLE_ENABLED` | Optional override for availability probe (`true`/`false`). Prefer live probe after providers are enabled. **Do not** set `true` while Google is disabled in Supabase. |

### 3.3 Do **not** invent or require

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Vercel — **not** part of current ROVEXO OAuth wiring (secrets belong in Supabase).
- Fake Client IDs in git, docs, or chat.

---

## 4. Production verification (after Owner config)

| Test | Expected |
|------|----------|
| Authorize probe | HTTP 302/303 to Google accounts (not 400) |
| `/auth/v1/settings` → `external.google` | `true` |
| Google Login on `https://www.rovexo.co.uk/login` | Consent → session → Homepage |
| Google Logout | Session cleared → Login |
| Session restore | Refresh page → still signed in |
| Refresh token / expiry | After idle/expiry → re-auth or clean redirect to Login |
| Desktop Chrome / Firefox / Edge | PASS |
| Mobile Safari (iPhone) | PASS |
| Chrome Android | PASS |
| iPad Safari | PASS |

**This run:** verification **not** executable — provider disabled. Status remains **OWNER ACTION REQUIRED**.

---

## Checklist (Owner)

- [ ] OAuth consent screen configured + scopes `openid` `email` `profile`
- [ ] Publishing status appropriate for production users
- [ ] Web OAuth client created
- [ ] JS origins: `https://www.rovexo.co.uk`, `http://localhost:3000`
- [ ] Redirect URI: `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`
- [ ] Client ID + Secret pasted into Supabase Google provider
- [ ] Google provider **Enabled**
- [ ] Site URL + Additional Redirect URLs set
- [ ] Live authorize ≠ 400
- [ ] Multi-device login/logout/session tests recorded

**Final for this file:** `OWNER ACTION REQUIRED`
