# GOOGLE OAUTH — OWNER SETUP (PRODUCTION)

**STATUS:** OWNER READY TO CONFIGURE  
**Mode:** Operations only · Application frozen · No code  
**Do not invent:** Client ID · Client Secret · fake URLs  

**Sources for URLs (project SSOT / live env):**

| Source | Value |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` (live) | `https://pklotmwxtnnepaitedic.supabase.co` |
| Supabase Auth callback (derived) | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Production app origin (`lib/preview/owner-preview-ssot.ts`, Auth Master Freeze) | `https://www.rovexo.co.uk` |
| Production app callback (`oauth-configuration-golden-law-v1.ts`) | `https://www.rovexo.co.uk/auth/callback` |
| Local origin / callback (SSOT) | `http://localhost:3000` · `http://localhost:3000/auth/callback` |

**Note:** Local `.env.local` may set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Production Site URL in Supabase and Vercel must use **`https://www.rovexo.co.uk`**.

---

## STEP 1 — Google Cloud Console · OAuth Consent Screen

1. Open https://console.cloud.google.com/
2. Select the GCP project that will own ROVEXO production OAuth  
   - If none exists: **Create Project** → name it (Owner choice) → Create.
3. Go to **APIs & Services** → **OAuth consent screen**.
4. **User type:**
   - **External** — public marketplace users (typical for ROVEXO).
   - **Internal** — only if every user is in your Google Workspace (usually not).
5. Click **Create**.
6. Fill:
   - **App name:** `ROVEXO`
   - **User support email:** Owner support mailbox
   - **App logo:** optional
   - **App domain / Authorized domains:** add `rovexo.co.uk` when Google asks
   - **Developer contact:** Owner email
7. **Scopes** → Add (or confirm):
   - `openid`
   - `.../auth/userinfo.email` (`email`)
   - `.../auth/userinfo.profile` (`profile`)
8. **Test users** (while Publishing status = Testing): add Owner Google accounts.
9. **Publishing status:**
   - Development: leave **Testing**.
   - Public production login: **Publish app** / **In production** when Google’s verification rules are satisfied.
10. Save.

---

## STEP 2 — Create OAuth Client (Web application)

1. **APIs & Services** → **Credentials**.
2. **+ Create credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** `ROVEXO Production Web` (label only).
5. Continue to STEP 3 before clicking Create (origins + redirects).

---

## STEP 3 — Exact values for the OAuth Client

### Authorized JavaScript Origins — copy-paste exactly

```text
https://www.rovexo.co.uk
http://localhost:3000
```

### Authorized Redirect URIs — copy-paste exactly

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

### After Create — Google shows

| Field | What to do |
|-------|------------|
| **Client ID** | Copy from Google → paste into Supabase (STEP 4). **Do not invent.** |
| **Client Secret** | Copy from Google → paste into Supabase (STEP 4). **Do not invent.** |

Store the secret in the Owner password manager. Do not put it in git.

---

## STEP 4 — Paste into Supabase (Google provider)

1. Open https://supabase.com/dashboard → project **`pklotmwxtnnepaitedic`**.
2. **Authentication** → **Providers** → **Google**.
3. Toggle **Enable Sign in with Google** → **ON**.
4. Paste:

| Supabase field | Value |
|----------------|--------|
| **Client ID** | ← paste Google **Client ID** (from STEP 3) |
| **Client Secret** | ← paste Google **Client Secret** (from STEP 3) |

5. Click **Save**.

There is no ROVEXO application env var for Google Client ID/Secret in this architecture.

---

## STEP 5 — Every callback / redirect URL

### Google → Supabase (IdP redirect)

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

### Supabase → ROVEXO app (allowlisted redirects)

```text
https://www.rovexo.co.uk/auth/callback
http://localhost:3000/auth/callback
```

### Optional staging (SSOT only — use only if that host is live)

```text
https://staging.rovexo.com/auth/callback
```

### Flow

```text
www.rovexo.co.uk/login
  → Google consent
  → https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
  → https://www.rovexo.co.uk/auth/callback
  → Session cookie
  → Homepage
```

---

## Owner tick list

- [ ] Consent screen External + scopes
- [ ] Publishing status decided (Testing vs Production)
- [ ] Web client created
- [ ] JS origins set (exact block above)
- [ ] Redirect URI set (exact Supabase callback)
- [ ] Client ID + Secret pasted into Supabase Google
- [ ] Provider Enabled + Save
- [ ] Supabase URL Configuration completed (`SUPABASE_OAUTH_SETUP.md`)

**No code. No commit. No push. No Preview. No Production deploy.**
