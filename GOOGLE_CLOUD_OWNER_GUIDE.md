# GOOGLE CLOUD — OWNER GUIDE (ROVEXO PRODUCTION)

**STATUS:** GOOGLE READY FOR OWNER SETUP  
**Application:** FROZEN · APPLICATION READY = YES  
**Forbidden:** Application code · Commit · Push · Preview · Production deploy · Invented credentials  

**Production facts (from ROVEXO project / live host):**

| Item | Value |
|------|--------|
| App origin | `https://www.rovexo.co.uk` |
| App OAuth callback | `https://www.rovexo.co.uk/auth/callback` |
| Local origin (dev only) | `http://localhost:3000` |
| Local callback | `http://localhost:3000/auth/callback` |
| Supabase project URL | `https://pklotmwxtnnepaitedic.supabase.co` |
| Supabase OAuth callback | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Support email (project) | `support@rovexo.co.uk` |
| Privacy Policy (live) | `https://www.rovexo.co.uk/legal/privacy-policy` |
| Terms (live) | `https://www.rovexo.co.uk/legal/terms-and-conditions` |
| Authorized domain | `rovexo.co.uk` |

**Client ID / Client Secret:** Created by Google Cloud → Owner copies into Supabase. **Never invent. Never write fake values into this file.**

---

## STEP 1 — Create or select Google Cloud Project

### Click-by-click

1. Open https://console.cloud.google.com/
2. Top bar → project picker → **Select** the existing ROVEXO production GCP project  
   **OR** → **New Project** → enter Owner’s real project name → **Create** → select it.
3. Confirm the selected project is visible in the top bar.

### Expected result

- Console loads with the chosen project active.

### Rollback

- If the wrong project was created: Project picker → select the correct project. Delete empty mistaken projects only if unused (IAM → manage resources).

---

## STEP 2 — OAuth Consent Screen

### Click-by-click

1. Left menu → **APIs & Services** → **OAuth consent screen**  
   (If Google shows **Google Auth Platform** → **Branding** / **Audience**, use the equivalent Consent / Branding screens.)
2. **User type:** choose **External** → **Create**  
   (Use **Internal** only if every user is inside your Google Workspace — not typical for ROVEXO marketplace.)
3. Fill **App information**:

| Field | Exact / production value |
|-------|---------------------------|
| **App name** | `ROVEXO` |
| **User support email** | `support@rovexo.co.uk` |
| **App logo** | Optional (Owner asset) |
| **Application home page** | `https://www.rovexo.co.uk` |
| **Application privacy policy link** | `https://www.rovexo.co.uk/legal/privacy-policy` |
| **Application terms of service link** | `https://www.rovexo.co.uk/legal/terms-and-conditions` |
| **Authorized domains** | `rovexo.co.uk` |
| **Developer contact information** | `support@rovexo.co.uk` |

4. **Save and Continue**.
5. **Scopes** → **Add or Remove Scopes** → select:

| Scope |
|-------|
| `openid` |
| `https://www.googleapis.com/auth/userinfo.email` |
| `https://www.googleapis.com/auth/userinfo.profile` |

6. **Save and Continue**.
7. **Test users** (while status = Testing): **Add Users** → add Owner Google accounts used for QA.
8. **Save and Continue** → review → **Back to Dashboard**.
9. **Publishing status:**
   - While testing: leave **Testing**.
   - For public production users: **Publish App** → confirm (complete Google verification if required).

### Expected result

- Consent screen shows App name **ROVEXO**, domain **rovexo.co.uk**, privacy + terms links above.
- Scopes include openid + email + profile.

### “to continue to pklotmwxtnnepaitedic.supabase.co”

Google shows the **OAuth redirect_uri host** (Supabase Auth callback), not the ROVEXO app `redirectTo`.

| What | Controls |
|------|----------|
| App name / logo on consent | Google Auth Platform → Branding → App name **`ROVEXO`** |
| Hostname in “to continue to …” | Google redirect URI = `https://…supabase.co/auth/v1/callback` **unless** Supabase **Custom Auth Domain** is configured |

**To hide the Supabase project hostname (ops only — no app code):**

1. Supabase Dashboard → Authentication → Custom Domains → configure e.g. `auth.rovexo.co.uk` (requires DNS + paid custom domain).
2. Google Cloud → OAuth client → Authorized redirect URIs → replace/add  
   `https://auth.rovexo.co.uk/auth/v1/callback` (exact host Supabase issues).
3. Keep app callbacks: `https://www.rovexo.co.uk/auth/callback` and `http://localhost:3000/auth/callback`.
4. Keep `NEXT_PUBLIC_SUPABASE_URL` pointing at the project API URL (or custom domain if Supabase documents that for the client).

Until a custom auth domain is live, “continue to …supabase.co” is expected for this architecture. Frontend must **not** fake the Google screen.

### Rollback

- OAuth consent screen → revert publishing to **Testing** if a bad publish causes issues.
- Remove incorrect authorized domains / links → Save.
- Do not delete the OAuth client until a replacement client is ready (see STEP 3 rollback).

---

## STEP 3 — OAuth Client (Web application)

### Click-by-click

1. **APIs & Services** → **Credentials**.
2. **+ Create credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** `ROVEXO Production Web` (label only).
5. **Authorized JavaScript origins** → **+ Add URI** for each (exact):

```text
https://www.rovexo.co.uk
http://localhost:3000
```

6. **Authorized redirect URIs** → **+ Add URI** (exact):

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

7. **Create**.
8. Dialog shows **Client ID** and **Client Secret** → **copy both** into the Owner password manager.
9. **OK**.

### Exact values required (production)

| Field | Exact value |
|-------|-------------|
| Application type | Web application |
| Authorized JavaScript Origins | `https://www.rovexo.co.uk` |
| Authorized JavaScript Origins | `http://localhost:3000` |
| Authorized Redirect URIs | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Client ID | **Owner copies from Google dialog — never invent** |
| Client Secret | **Owner copies from Google dialog — never invent** |

### Expected result

- Credentials list shows a Web client.
- Redirect URI matches Supabase callback exactly (no trailing slash variant unless Google normalizes identically).

### Rollback

1. Credentials → open the new client → remove bad origins/URIs → Save.  
2. Or **Delete** the client only after Supabase Google provider is disabled / cleared (see `SUPABASE_GOOGLE_SETUP.md` rollback).  
3. Create a replacement client if the secret was exposed.

---

## STEP 4 — Supabase (where to paste)

Full field map: **`SUPABASE_GOOGLE_SETUP.md`**.

Summary:

| Location | Action |
|----------|--------|
| Authentication → Providers → **Google** → Enable | **ON** |
| **Client ID** | Paste Google Client ID |
| **Client Secret** | Paste Google Client Secret |
| Authentication → URL Configuration → **Site URL** | `https://www.rovexo.co.uk` |
| **Redirect URLs** | `https://www.rovexo.co.uk/auth/callback` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

---

## STEP 5 — Verification

Use **`OAUTH_PRODUCTION_VERIFICATION.md`** (Google section).

Minimum:

| Test | Expected |
|------|----------|
| Login | `https://www.rovexo.co.uk/login` → Google → session |
| Logout | Session cleared |
| Session restore | Refresh stays signed in |
| Refresh token / expired session | Renew or clean Login — no white screen |
| Desktop · Android · iPhone · iPad · multi-browser | Same |

Pre-flight:

```bash
curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
```

Expected: **302/303** to Google — not `400 provider is not enabled`.

---

**No code. No commit. No push. No Preview. No Production.**
