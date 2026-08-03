# SUPABASE — GOOGLE PROVIDER SETUP (ROVEXO PRODUCTION)

**STATUS:** SUPABASE READY FOR OAUTH  
**Project ref:** `pklotmwxtnnepaitedic`  
**Project URL:** `https://pklotmwxtnnepaitedic.supabase.co`  
**Dashboard:** https://supabase.com/dashboard/project/pklotmwxtnnepaitedic  

**Do not invent Client ID or Client Secret.** Paste only values created in Google Cloud (`GOOGLE_CLOUD_OWNER_GUIDE.md`).

---

## Prerequisites

- [ ] Google OAuth Web client created  
- [ ] Authorized Redirect URI on Google client:

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

- [ ] Authorized JavaScript Origins on Google client:

```text
https://www.rovexo.co.uk
http://localhost:3000
```

---

## STEP A — URL Configuration (shared with Apple)

### Click-by-click

1. Open https://supabase.com/dashboard/project/pklotmwxtnnepaitedic  
2. Left sidebar → **Authentication**.  
3. Open **URL Configuration** (under Configuration / sign-in settings, depending on Dashboard UI version).  
4. **Site URL** → replace with exactly:

```text
https://www.rovexo.co.uk
```

5. **Redirect URLs** / **Additional Redirect URLs** → ensure these lines exist (exact):

```text
https://www.rovexo.co.uk/auth/callback
http://localhost:3000/auth/callback
```

6. **Save**.

### Expected result

- Site URL shows `https://www.rovexo.co.uk`.  
- Both redirect URLs listed. No typo, no trailing path errors.

### Rollback

- Restore previous Site URL / Redirect URLs from Owner notes → Save.  
- If Login redirects break, set Site URL back to `https://www.rovexo.co.uk` and confirm redirect allowlist includes `/auth/callback`.

---

## STEP B — Enable Google provider

### Click-by-click

1. **Authentication** → **Providers**.  
2. Click **Google**.  
3. Toggle **Enable Sign in with Google** → **ON**.  
4. **Client ID** field → paste Google **Client ID** (from Google Cloud credentials dialog).  
5. **Client Secret** field → paste Google **Client Secret**.  
6. Leave other Google options at Supabase defaults unless Owner has a documented reason to change.  
7. Click **Save**.

### Field map

| Supabase field name | Paste from |
|---------------------|------------|
| Enable Sign in with Google | ON |
| Client ID | Google Cloud → OAuth 2.0 Client ID → Client ID |
| Client Secret | Google Cloud → OAuth 2.0 Client ID → Client Secret |

### Expected result

- Provider shows enabled.  
- `GET https://pklotmwxtnnepaitedic.supabase.co/auth/v1/settings` → `external.google: true`.  
- Authorize probe returns 302/303 (see verification doc).

### Rollback

1. Authentication → Providers → Google → toggle **Enable** → **OFF** → Save.  
2. Clear Client ID / Client Secret if credentials were wrong → Save.  
3. Rotate Google Client Secret in Google Cloud → paste new secret → Enable again.  
4. Application code is **not** changed for rollback.

---

## Callback URLs (reference)

| Role | Exact URL |
|------|-----------|
| Google Redirect URI (= Supabase callback) | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| ROVEXO production callback | `https://www.rovexo.co.uk/auth/callback` |
| ROVEXO local callback | `http://localhost:3000/auth/callback` |

### Flow

```text
https://www.rovexo.co.uk/login
  → Google
  → https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
  → https://www.rovexo.co.uk/auth/callback
  → session
```

---

## Vercel / app env

Google Client ID/Secret are **not** stored in ROVEXO application env for this architecture.

Confirm Production:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pklotmwxtnnepaitedic.supabase.co` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.rovexo.co.uk` |
| `NEXT_PUBLIC_APP_URL` | `https://www.rovexo.co.uk` (if used) |

---

**No code. No commit. No push. No Preview. No Production.**
