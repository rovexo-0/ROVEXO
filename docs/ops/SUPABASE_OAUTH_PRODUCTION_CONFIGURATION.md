# ROVEXO Supabase OAuth — Production Configuration Checklist

**STATUS:** OPS ONLY · NO APP SECRETS IN GIT  
**SSOT:** Supabase Auth · `lib/auth/actions.ts` → `signInWithOAuthProvider` · `/auth/callback`  
**UI policy:** Public Login / Register keep `showOAuth = false` until Owner verifies providers live.

---

## Application readiness (code — already in place)

| Piece | Location | Status |
|-------|----------|--------|
| OAuth start | `lib/auth/actions.ts` → `signInWithOAuthProvider` | READY |
| Callback | `app/auth/callback/route.ts` (PKCE `code` exchange) | READY |
| Redirect sanitizer | `lib/auth/redirects.ts` → `sanitizeNextPath` | READY |
| Middleware bypass | `lib/supabase/middleware.ts` → `/auth/callback` | READY |
| Session cookies | `@supabase/ssr` browser + server + middleware | READY |
| Public UI gating | Login/Register email-only · `AuthForm` `showOAuth = false` | LOCKED OFF |

**App env (required for Auth overall — not OAuth client secrets):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key alias)
- `NEXT_PUBLIC_APP_URL` (builds `redirectTo` for callback)

**Do not put Google / Apple / Facebook Client IDs or secrets in the ROVEXO repo or Vercel app env.**  
Those belong only in the **Supabase Dashboard** (and the provider consoles that feed Supabase).

---

## Required redirect URLs (Supabase Auth → URL Configuration)

Add **exactly**:

1. `http://localhost:3000/auth/callback`
2. `https://www.rovexo.co.uk/auth/callback`

Also allowlist Site URL / Additional Redirect URLs as required by your Supabase project:

- Site URL production: `https://www.rovexo.co.uk` (must match `NEXT_PUBLIC_APP_URL`)
- Additional: `http://localhost:3000/**` (dev) if using wildcard patterns supported by the project

Staging: add only if staging is enabled, e.g. `https://staging.rovexo.com/auth/callback`.

---

## Manual steps — Google (REQUIRED)

### A. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create (or select) an **OAuth 2.0 Client ID** (Web application).
3. Authorized JavaScript origins: your Supabase project URL host (from Supabase dashboard) and app origins as Google requires.
4. Authorized redirect URIs — use the URI shown in **Supabase → Authentication → Providers → Google** (Supabase-hosted callback), **not** inventing a custom one.
5. Copy **Client ID** and **Client Secret** (keep offline; do not commit).

### B. Supabase Dashboard

1. Project → **Authentication** → **Providers** → **Google**.
2. Enable Google.
3. Paste Client ID and Client Secret from Google Cloud.
4. Save.
5. Confirm **URL Configuration** includes `http://localhost:3000/auth/callback` and `https://www.rovexo.co.uk/auth/callback`.

### C. Verify (Owner)

1. Do **not** enable Login UI yet.
2. From a secure ops session, confirm authorize no longer returns `provider is not enabled`.
3. Optional gated test via preserved `AuthOAuthButtons` / server action only after Owner approval.
4. Confirm session cookie after `/auth/callback` code exchange.

---

## Manual steps — Apple (REQUIRED)

### A. Apple Developer

1. Apple Developer → Certificates, Identifiers & Profiles.
2. Configure **Sign in with Apple** for your Services ID / App ID as Apple requires.
3. Create a **key** for Sign in with Apple; note Key ID, Team ID, Services ID, and generate the client secret JWT as Supabase documents for Apple.
4. Do not commit the `.p8` key or secret to Git.

### B. Supabase Dashboard

1. Authentication → Providers → **Apple**.
2. Enable Apple.
3. Enter Services ID, Secret Key, and related fields **exactly as Supabase Apple provider form requires**.
4. Save.
5. Confirm redirect allowlist includes the two required `/auth/callback` URLs above.

### C. Verify (Owner)

Same as Google: provider enabled → no `validation_failed` → session after callback → then Owner decides UI un-gate.

---

## Manual steps — Facebook (OPTIONAL — keep disabled unless configured)

1. Meta Developer → App → Facebook Login → Settings.
2. Valid OAuth Redirect URIs: use the URI shown in **Supabase → Providers → Facebook**.
3. Supabase → Authentication → Providers → **Facebook** → enable only if Client ID + Secret are ready.
4. If not configured: leave **disabled** in Supabase and keep UI off (current policy).

---

## After providers PASS (Owner only)

1. Re-probe authorize: Google and Apple must not return `provider is not enabled`.
2. Update certification SSOT flags only after live PASS (`lib/auth/oauth-configuration-golden-law-v1.ts` / production certification) — Owner-authorized.
3. UI: keep `showOAuth = false` until Owner explicitly re-authorizes public social buttons (Cluster 6 / Auth UI freeze). Enabling buttons is a **separate Owner decision** from enabling Supabase providers.

---

## Security notes (already implemented in app)

- OAuth uses Supabase-hosted authorize + **PKCE `code`** exchange in `/auth/callback`.
- `sanitizeNextPath` blocks open redirects (`//evil`, auth-loop paths).
- Cookies via `@supabase/ssr` (httpOnly session cookies managed by Supabase SSR).
- Production redirects must use HTTPS origins in Supabase allowlist.
- Cancel / fail → redirect `/login?error=auth_callback_failed`.

---

## Live probe result (this environment)

At certification time, Supabase Auth returned for Google, Apple, and Facebook:

`400 validation_failed` — `Unsupported provider: provider is not enabled`

→ **Configured: NO · Verified: NO** until Dashboard enablement + re-probe PASS.
