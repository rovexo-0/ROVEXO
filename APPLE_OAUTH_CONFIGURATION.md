# APPLE OAUTH CONFIGURATION

**STATUS:** OWNER ACTION REQUIRED  
**Mode:** Owner operations only · Application frozen · No code · No invented credentials  
**Evidence date:** 2026-08-02  

**Production project (evidence):** `https://pklotmwxtnnepaitedic.supabase.co`  
**Canonical app origin:** `https://www.rovexo.co.uk`  
**ROVEXO callback path:** `/auth/callback`  

**Live probe (before Owner config):**

| Check | Evidence |
|-------|----------|
| `external.apple` in `/auth/v1/settings` | `false` |
| Authorize Apple | HTTP **400** `provider is not enabled` |

---

## Section status: OWNER ACTION REQUIRED

Apple identifiers (Services ID, Team ID, Key ID, `.p8` private key) are created in **Apple Developer** and configured in **Supabase Auth → Providers → Apple**.  
ROVEXO application env does **not** store Apple Client Secrets in this architecture.  
**Never invent Team ID, Key ID, Services ID, or private keys.**

---

## 1. Apple Developer

### 1.1 Prerequisites

1. Active [Apple Developer Program](https://developer.apple.com/) membership.
2. Access to Certificates, Identifiers & Profiles.

### 1.2 App ID (Primary App Identifier)

1. Identifiers → **App IDs** → Register (if not already).
2. Capability: enable **Sign In with Apple**.
3. Bundle ID: Owner’s iOS/app identifier if applicable (web-only still needs an App ID that enables Sign In with Apple for the Services ID).
4. Record **App ID** / Bundle ID: **OWNER FILLS — never invent**.

### 1.3 Services ID (OAuth client for web)

1. Identifiers → **Services IDs** → Register.
2. Description: e.g. `ROVEXO Web Sign In` (Owner label).
3. Identifier (this becomes Supabase **Client ID** for Apple): **OWNER FILLS — never invent**  
   Example shape only (do not copy as real): `com.company.rovexo.web`.
4. Enable **Sign In with Apple** → Configure.

### 1.4 Domains and Return URLs (exact)

Under Sign In with Apple for the Services ID:

| Field | Exact value |
|-------|-------------|
| **Domains and Subdomains** | `pklotmwxtnnepaitedic.supabase.co` |
| **Return URLs** | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |

Save. Domain verification may require downloading Apple’s file or DNS — follow Apple’s prompt until domain shows verified.

### 1.5 Sign In with Apple Key

1. Keys → **Create a Key**.
2. Enable **Sign In with Apple** → Configure → select Primary App ID.
3. Register → **Download** the `.p8` file **once**.
4. Record:

| Field | Value in this doc |
|-------|-------------------|
| **Key ID** | **OWNER FILLS** |
| **Team ID** | **OWNER FILLS** (Membership → Team ID) |
| **Private Key (.p8)** | **OWNER FILLS** — store offline; never commit |

### 1.6 Client Secret generation

Supabase Auth for Apple expects:

- **Services ID** (Client IDs)
- **Secret Key** (contents of `.p8`)
- **Key ID**
- **Team ID**

Supabase generates/refreshes the Apple **client secret JWT** from the private key.  
Owner does **not** need to paste a long-lived JWT into ROVEXO env if using Supabase’s Apple provider UI.

If Owner generates JWT manually (advanced): JWT must use ES256, `iss` = Team ID, `sub` = Services ID, `aud` = `https://appleid.apple.com`, short expiry — **prefer Supabase-managed secret from `.p8`**.

---

## 2. Supabase configuration

### 2.1 Provider

1. Supabase Dashboard → Project **`pklotmwxtnnepaitedic`**.
2. Authentication → Providers → **Apple**.
3. Toggle **Enable Sign in with Apple**.

### 2.2 Fields (Owner pastes — never invent)

| Supabase Apple field | Source |
|----------------------|--------|
| Client IDs (Services ID) | Apple Services ID identifier |
| Secret Key (`.p8` contents) | Downloaded private key |
| Key ID | Apple Key ID |
| Team ID | Apple Team ID |

Save.

### 2.3 URL map

| Role | Exact URL |
|------|-----------|
| Apple Return URL / Supabase callback | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Apple Domains | `pklotmwxtnnepaitedic.supabase.co` |
| ROVEXO app callback | `https://www.rovexo.co.uk/auth/callback` |
| Local app callback | `http://localhost:3000/auth/callback` |

Flow:

```text
User → Apple → Supabase /auth/v1/callback → ROVEXO /auth/callback → Session → Homepage
```

### 2.4 Site URL + Additional Redirect URLs

Same as Google (shared Supabase Auth URL config):

| Setting | Exact value |
|---------|-------------|
| **Site URL** | `https://www.rovexo.co.uk` |
| **Additional Redirect URLs** | `https://www.rovexo.co.uk/auth/callback` |
| | `http://localhost:3000/auth/callback` |
| Optional | `https://staging.rovexo.com/auth/callback` |

### 2.5 Account linking

Enable automatic linking for verified email so Apple does not create a second account for an existing email user.

---

## 3. Environment variables

### 3.1 Required for ROVEXO app (no Apple secrets in Vercel for this stack)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | `https://pklotmwxtnnepaitedic.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable) | YES | |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (server) | |
| `NEXT_PUBLIC_SITE_URL` | YES | `https://www.rovexo.co.uk` |
| `NEXT_PUBLIC_APP_URL` | YES if used | Must match production Site URL |

### 3.2 Optional UI force flag

| Variable | Purpose |
|----------|---------|
| `OAUTH_APPLE_ENABLED` | Optional availability override. Do **not** force `true` while Supabase Apple is disabled. |

### 3.3 Do **not** invent or require in app env

- `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` / `APPLE_PRIVATE_KEY` in Vercel — **not** used by current ROVEXO OAuth start path (`signInWithOAuth({ provider: "apple" })` via Supabase).
- Fake Team ID / Key ID / Services ID in documentation commits.

---

## 4. Production verification (after Owner config)

| Test | Expected |
|------|----------|
| `/auth/v1/settings` → `external.apple` | `true` |
| Authorize Apple | HTTP 302/303 to `appleid.apple.com` (not 400) |
| Apple Login | Consent → session → Homepage |
| Apple Logout | Session cleared |
| Session restore | Refresh → still signed in |
| Expired session / refresh | Clean re-auth or Login |
| Desktop | PASS |
| Mobile Safari (iPhone) | PASS |
| Chrome Android | PASS (Apple may limit; record actual behaviour) |
| iPad | PASS |

**Hide relay email / private relay:** Owner documents whether users see private relay addresses; account linking must still work.

**This run:** verification **not** executable — provider disabled. Status remains **OWNER ACTION REQUIRED**.

---

## Checklist (Owner)

- [ ] App ID with Sign In with Apple
- [ ] Services ID created (Client ID)
- [ ] Domain `pklotmwxtnnepaitedic.supabase.co` verified
- [ ] Return URL `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`
- [ ] Key created · Key ID · Team ID · `.p8` secured
- [ ] Supabase Apple provider enabled with all four fields
- [ ] Site URL + redirect allowlist set
- [ ] Live authorize ≠ 400
- [ ] Multi-device login/logout/session evidence recorded

**Final for this file:** `OWNER ACTION REQUIRED`
