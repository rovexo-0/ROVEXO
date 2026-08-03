# APPLE DEVELOPER — OWNER GUIDE (ROVEXO PRODUCTION)

**STATUS:** APPLE READY FOR OWNER SETUP  
**Application:** FROZEN · APPLICATION READY = YES  
**Forbidden:** Application code · Commit · Push · Preview · Production deploy · Invented Team ID / Key ID / Services ID / `.p8`  

**Production facts (from ROVEXO project):**

| Item | Value |
|------|--------|
| App origin | `https://www.rovexo.co.uk` |
| App OAuth callback | `https://www.rovexo.co.uk/auth/callback` |
| Local callback | `http://localhost:3000/auth/callback` |
| Supabase project URL | `https://pklotmwxtnnepaitedic.supabase.co` |
| Apple **Domains** | `pklotmwxtnnepaitedic.supabase.co` |
| Apple **Return URLs** | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Support email | `support@rovexo.co.uk` |

**Team ID · Key ID · Services ID · Client ID · `.p8`:** Created in Apple Developer → Owner copies into Supabase. **Never invent. Never paste fake values into this file.**

---

## STEP 1 — Apple Developer · Certificates, IDs & Profiles

### Click-by-click

1. Open https://developer.apple.com/account  
2. Sign in with the Owner Apple Developer account (paid Program membership required).  
3. Click **Certificates, Identifiers & Profiles**.  
4. Left sidebar confirm you see **Identifiers**, **Keys**, **Profiles**.

### Expected result

- Certificates, Identifiers & Profiles home loads for the correct **Team**.

### Record Team ID

1. Click account/membership → **Membership details** (or Account → Membership).  
2. Copy **Team ID**.  
3. Store offline. Value = **Owner copy only**.

### Rollback

- Switch team (top-right) if the wrong organization was selected before creating identifiers.

---

## STEP 2 — Create App ID + Services ID + Sign In with Apple

### 2A — App ID

1. **Identifiers** → **+** (blue).  
2. Select **App IDs** → **Continue**.  
3. Select **App** → **Continue**.  
4. **Description:** `ROVEXO` (or Owner label).  
5. **Bundle ID:** choose **Explicit** → enter the Owner’s real bundle identifier  
   - **Owner supplies the real Bundle ID — never invent in docs.**  
6. Capabilities → enable **Sign In with Apple** → **Continue** → **Register**.

### Expected result

- App ID appears in Identifiers list with Sign In with Apple enabled.

### Rollback

- Identifiers → App ID → Edit → disable Sign In with Apple → Save  
  **or** delete unused App ID only if nothing else depends on it.

### 2B — Services ID (web Client ID)

1. **Identifiers** → **+**.  
2. Select **Services IDs** → **Continue**.  
3. **Description:** `ROVEXO Web`.  
4. **Identifier:** Owner’s reverse-DNS Services ID string  
   - This string **is** the OAuth **Client ID** / Supabase **Client IDs** field.  
   - **Owner creates the real identifier — never invent.**  
5. Enable **Sign In with Apple** → **Configure**.  
6. **Primary App ID:** select the App ID from §2A.  
7. **Domains and Subdomains** → paste exactly:

```text
pklotmwxtnnepaitedic.supabase.co
```

8. **Return URLs** → paste exactly:

```text
https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
```

9. **Next** → **Done** → **Continue** → **Register**.  
10. Complete Apple domain verification if shown (Download / Host / Verify).

### Expected result

- Services ID listed. Domain verified (or verification pending until DNS/file completes).  
- Return URL matches Supabase callback exactly.

### Rollback

- Identifiers → Services ID → Edit → clear Return URLs / Domains → Save  
  **or** delete Services ID after disabling Supabase Apple provider.

---

## STEP 3 — Create Key · Download `.p8`

### Click-by-click

1. **Keys** → **+**.  
2. **Key Name:** `ROVEXO Sign In with Apple`.  
3. Enable **Sign In with Apple** → **Configure**.  
4. **Primary App ID:** select App ID from §2A → **Save**.  
5. **Continue** → **Register**.  
6. **Download** the `.p8` file immediately (Apple shows it once).  
7. Note **Key ID** on the confirmation page.  
8. Store `.p8` + Key ID + Team ID + Services ID in the Owner password manager / HSM — **never commit to git**.

### Values Owner must record (do not invent here)

| Name | Where shown | Pasted into Supabase as |
|------|-------------|-------------------------|
| **Team ID** | Membership | Team ID |
| **Key ID** | Keys page | Key ID |
| **Services ID** | Identifiers → Services IDs | Client IDs |
| **Client ID** | Same as Services ID for web | Client IDs |
| **Private key** | `.p8` file contents | Secret Key |

### Expected result

- `.p8` downloaded. Key ID visible. Key listed under Keys.

### Rollback

- Keys → revoke/delete key **only after** Supabase Apple provider is updated to a new key (or disabled).  
- Create a replacement key + update Supabase if `.p8` is lost (cannot re-download).

---

## STEP 4 — Supabase (where every value is pasted)

Full map: **`SUPABASE_APPLE_SETUP.md`**.

| Apple value | Supabase path | Supabase field |
|-------------|---------------|----------------|
| Services ID | Authentication → Providers → **Apple** | **Client IDs** |
| `.p8` contents | same | **Secret Key** |
| Key ID | same | **Key ID** |
| Team ID | same | **Team ID** |
| — | Enable Sign in with Apple | **ON** |

Client secret JWT: **generated by Supabase** from `.p8` + Key ID + Team ID + Services ID. Owner does not invent a JWT.

---

## STEP 5 — All callback URLs (real project only)

| System | Field | Exact value |
|--------|-------|-------------|
| Apple | Domains | `pklotmwxtnnepaitedic.supabase.co` |
| Apple | Return URLs | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Supabase | Site URL | `https://www.rovexo.co.uk` |
| Supabase | Redirect URL | `https://www.rovexo.co.uk/auth/callback` |
| Supabase | Redirect URL | `http://localhost:3000/auth/callback` |

---

## STEP 6 — Verification

Use **`OAUTH_PRODUCTION_VERIFICATION.md`** (Apple section).

| Surface | Required |
|---------|----------|
| Desktop Safari | Login · Logout · Session restore |
| iPhone Safari | same |
| iPad Safari | same |
| Chrome (desktop) | same (document any Apple limitations) |
| Multiple devices | same account |

```bash
curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=apple&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
```

Expected: **302/303** to Apple — not `400 provider is not enabled`.

---

**No code. No commit. No push. No Preview. No Production.**
