# SUPABASE — APPLE PROVIDER SETUP (ROVEXO PRODUCTION)

**STATUS:** SUPABASE READY FOR OAUTH  
**Project ref:** `pklotmwxtnnepaitedic`  
**Project URL:** `https://pklotmwxtnnepaitedic.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/pklotmwxtnnepaitedic  

**Do not invent Team ID · Key ID · Services ID · `.p8`.** Paste only values from Apple Developer (`APPLE_DEVELOPER_OWNER_GUIDE.md`).

---

## Prerequisites

- [ ] Apple App ID with Sign In with Apple  
- [ ] Services ID with:

| Field | Exact value |
|-------|-------------|
| Domains | `pklotmwxtnnepaitedic.supabase.co` |
| Return URLs | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |

- [ ] Key downloaded (`.p8`) + Key ID + Team ID recorded  

---

## STEP A — URL Configuration

Same as Google. If already done, skip.

**Authentication** → **URL Configuration**

| Field | Exact value |
|-------|-------------|
| Site URL | `https://www.rovexo.co.uk` |
| Redirect URLs | `https://www.rovexo.co.uk/auth/callback` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

**Save.**

### Rollback

Restore prior Site URL / Redirect URLs → Save.

---

## STEP B — Enable Apple provider

### Click-by-click

1. Open https://supabase.com/dashboard/project/pklotmwxtnnepaitedic  
2. **Authentication** → **Providers**.  
3. Click **Apple**.  
4. Toggle **Enable Sign in with Apple** → **ON**.  
5. Paste each value into the matching field:

| Supabase field name | Paste from Apple |
|---------------------|------------------|
| **Client IDs** | Services ID identifier (this is the web Client ID) |
| **Secret Key** | Full text contents of the `.p8` private key file |
| **Key ID** | Key ID from Keys |
| **Team ID** | Team ID from Membership |

6. **Save**.

### How Client Secret works

1. Owner pastes `.p8` + Key ID + Team ID + Services ID.  
2. **Supabase generates** the Apple client secret JWT and refreshes it.  
3. Owner does **not** invent a JWT or put Apple secrets in Vercel app env for this stack.

### Expected result

- Apple provider enabled.  
- `/auth/v1/settings` → `external.apple: true`.  
- Authorize probe → 302/303 to `appleid.apple.com`.

### Rollback

1. Authentication → Providers → Apple → **Enable** → **OFF** → Save.  
2. Clear Secret Key / Key ID / Team ID / Client IDs if wrong → Save.  
3. If key compromised: revoke Apple Key → create new Key → download new `.p8` → update Supabase → Enable.  
4. No application code changes.

---

## Callback URLs (reference)

| Role | Exact URL / domain |
|------|---------------------|
| Apple Domains | `pklotmwxtnnepaitedic.supabase.co` |
| Apple Return URL (= Supabase callback) | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| ROVEXO production callback | `https://www.rovexo.co.uk/auth/callback` |
| ROVEXO local callback | `http://localhost:3000/auth/callback` |

### Flow

```text
https://www.rovexo.co.uk/login
  → Apple
  → https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
  → https://www.rovexo.co.uk/auth/callback
  → session
```

---

## Facebook

Do **not** enable for public Login/Register (RC1). Google + Apple + Email only.

---

**No code. No commit. No push. No Preview. No Production.**
