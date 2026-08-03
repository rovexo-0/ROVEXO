# APPLE SIGN IN — OWNER SETUP (PRODUCTION)

**STATUS:** OWNER READY TO CONFIGURE  
**Mode:** Operations only · Application frozen · No code  
**Do not invent:** Team ID · Key ID · Services ID · `.p8` · Client Secret  

**URLs from project (same as Google):**

| Role | Exact value |
|------|-------------|
| Supabase project | `https://pklotmwxtnnepaitedic.supabase.co` |
| Apple **Domains** | `pklotmwxtnnepaitedic.supabase.co` |
| Apple **Return URL** / Supabase callback | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Production app callback | `https://www.rovexo.co.uk/auth/callback` |
| Local app callback | `http://localhost:3000/auth/callback` |

---

## STEP 1 — Apple Developer

### 1.1 Account

1. Open https://developer.apple.com/account  
2. Confirm **Apple Developer Program** membership is active.  
3. Note **Team ID**: Membership details → **Team ID**.  
   - Value: **OWNER COPIES FROM APPLE — never invent.**

### 1.2 Certificates, Identifiers & Profiles

Open **Certificates, Identifiers & Profiles**.

### 1.3 App ID (Identifiers → App IDs)

1. **+** Register a new App ID (or select existing).  
2. Type: **App**.  
3. Description: Owner choice (e.g. `ROVEXO`).  
4. **Bundle ID:** Owner’s real bundle/identifier (explicit or wildcard per Apple rules).  
   - Value: **OWNER FILLS — never invent.**  
5. Capabilities → enable **Sign In with Apple** → Continue → Register.

### 1.4 Services ID (this is the OAuth Client ID for web)

1. Identifiers → **Services IDs** → **+**.  
2. Description: e.g. `ROVEXO Web`.  
3. **Identifier** (reverse-DNS string): **OWNER CREATES — never invent.**  
   - This string is pasted into Supabase as **Client IDs** / Services ID.  
4. Enable **Sign In with Apple** → **Configure**.

### 1.5 Domains and Return URLs — copy-paste exactly

| Field | Paste exactly |
|-------|----------------|
| **Domains and Subdomains** | `pklotmwxtnnepaitedic.supabase.co` |
| **Return URLs** | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |

Complete Apple’s domain verification if prompted → Save → Continue → Register.

### 1.6 Create Key + download `.p8`

1. **Keys** → **+**.  
2. Key Name: e.g. `ROVEXO Sign In with Apple`.  
3. Enable **Sign In with Apple** → **Configure** → select the Primary App ID from §1.3.  
4. Continue → Register.  
5. **Download** the `.p8` file (one-time download).  
6. Record:

| Field | Source | Value in this doc |
|-------|--------|-------------------|
| **Key ID** | Key details page | **OWNER COPIES — never invent** |
| **Team ID** | Membership | **OWNER COPIES — never invent** |
| **Private key** | `.p8` file contents | **OWNER SECURES OFFLINE — never invent · never commit** |
| **Services ID** | Identifier from §1.4 | **OWNER COPIES — never invent** |

---

## STEP 2 — Exact Supabase fields (where each value goes)

1. https://supabase.com/dashboard → project **`pklotmwxtnnepaitedic`**.  
2. **Authentication** → **Providers** → **Apple**.  
3. Toggle **Enable Sign in with Apple** → **ON**.  
4. Enter:

| Supabase Apple UI field | Paste from Apple |
|-------------------------|------------------|
| **Client IDs** (Services ID) | Services ID identifier (§1.4) |
| **Secret Key** (private key) | Full contents of the `.p8` file |
| **Key ID** | Key ID from §1.6 |
| **Team ID** | Team ID from Membership |

5. **Save**.

No ROVEXO `APPLE_*` application env vars are required for this stack.

---

## STEP 3 — How Client Secret is generated

Apple does **not** give a static “Client Secret” string like Google.

1. Owner uploads the **`.p8` private key** + **Key ID** + **Team ID** + **Services ID** into Supabase.  
2. **Supabase generates** the short-lived **client secret JWT** (ES256) required by Apple’s token endpoint and refreshes it as needed.  
3. Owner should **not** invent a JWT or paste a fake secret into Vercel.  
4. Advanced (optional, not required): Owner can manually create an ES256 JWT (`iss`=Team ID, `sub`=Services ID, `aud`=`https://appleid.apple.com`) — prefer Supabase-managed secret from `.p8`.

---

## STEP 4 — Every required callback / redirect URL

| System | Field | Exact URL / domain |
|--------|-------|---------------------|
| Apple | Domains | `pklotmwxtnnepaitedic.supabase.co` |
| Apple | Return URLs | `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback` |
| Supabase | Site URL | `https://www.rovexo.co.uk` |
| Supabase | Redirect allowlist | `https://www.rovexo.co.uk/auth/callback` |
| Supabase | Redirect allowlist | `http://localhost:3000/auth/callback` |
| Optional | Staging callback | `https://staging.rovexo.com/auth/callback` |

### Flow

```text
www.rovexo.co.uk/login
  → Apple ID consent
  → https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback
  → https://www.rovexo.co.uk/auth/callback
  → Session cookie
  → Homepage
```

---

## Owner tick list

- [ ] Team ID recorded  
- [ ] App ID + Sign In with Apple  
- [ ] Services ID created  
- [ ] Domain + Return URL set (exact block)  
- [ ] Key created · `.p8` downloaded · Key ID saved  
- [ ] All four fields pasted into Supabase Apple  
- [ ] Provider Enabled + Save  
- [ ] URL Configuration completed (`SUPABASE_OAUTH_SETUP.md`)  

**No code. No commit. No push. No Preview. No Production deploy.**
