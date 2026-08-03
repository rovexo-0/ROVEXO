# OAUTH PRODUCTION VERIFICATION (GOOGLE + APPLE)

**STATUS:** OWNER ACTION REQUIRED until all rows evidenced  
**Official host:** `https://www.rovexo.co.uk`  
**Supabase:** `https://pklotmwxtnnepaitedic.supabase.co`  
**Login page:** `https://www.rovexo.co.uk/login`  

**Do not certify from localhost alone.**  
**Do not invent credentials.** Application frozen.

---

## A. Pre-flight (API)

| # | Check | Pass if | ☐ |
|---|--------|---------|---|
| A1 | `GET …/auth/v1/settings` | `external.google: true` | ☐ |
| A2 | same | `external.apple: true` | ☐ |
| A3 | Authorize Google | HTTP **302/303** (not 400) | ☐ |
| A4 | Authorize Apple | HTTP **302/303** (not 400) | ☐ |

```bash
curl -s "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/settings"

curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"

curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=apple&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
```

### Expected after configuration

- Settings: Google + Apple `true`.  
- Authorize: redirect to Google / Apple IdP.

### If fail

- Google still 400 → `SUPABASE_GOOGLE_SETUP.md` + Google Redirect URI.  
- Apple still 400 → `SUPABASE_APPLE_SETUP.md` + Apple Return URL / domain verify.  
- Rollback: disable provider in Supabase (guides’ Rollback sections).

---

## B. Google — product tests

| # | Test | Pass criteria | ☐ |
|---|------|---------------|---|
| G1 | Login | From `/login` → Google → authenticated on ROVEXO | ☐ |
| G2 | Logout | Session cleared · Login required for protected routes | ☐ |
| G3 | Session restore | Hard refresh · still signed in | ☐ |
| G4 | Refresh token | Session renews after activity / token refresh without crash | ☐ |
| G5 | Expired session | After expiry → Login (no white screen) | ☐ |

---

## C. Apple — product tests

| # | Test | Pass criteria | ☐ |
|---|------|---------------|---|
| P1 | Login | Apple consent → authenticated on ROVEXO | ☐ |
| P2 | Logout | Session cleared | ☐ |
| P3 | Session restore | Hard refresh · still signed in | ☐ |

---

## D. Devices & browsers

| # | Surface | Google G1–G3 | Apple P1–P3 | ☐ |
|---|---------|--------------|-------------|---|
| D1 | Desktop Chrome | ☐ | ☐ | ☐ |
| D2 | Desktop Safari | ☐ | ☐ | ☐ |
| D3 | iPhone Safari | ☐ | ☐ | ☐ |
| D4 | iPad Safari | ☐ | ☐ | ☐ |
| D5 | Chrome Android | ☐ | ☐ | ☐ |
| D6 | Multiple browsers | ☐ | ☐ | ☐ |
| D7 | Private / Incognito | ☐ | ☐ | ☐ |

---

## E. Evidence log

| Field | Owner fill |
|-------|------------|
| Date | |
| Tester | |
| Google authorize HTTP | |
| Apple authorize HTTP | |
| Failures | |

---

## F. Verdict

| Status | When |
|--------|------|
| **OWNER ACTION REQUIRED** | Any critical ☐ open or authorize 400 |
| **WARNING** | Partial devices · consent still Testing |
| **PASS** | A–D evidenced on `https://www.rovexo.co.uk` |

---

## Guides

- `GOOGLE_CLOUD_OWNER_GUIDE.md`  
- `APPLE_DEVELOPER_OWNER_GUIDE.md`  
- `SUPABASE_GOOGLE_SETUP.md`  
- `SUPABASE_APPLE_SETUP.md`  

**No code. No commit. No push. No Preview. No Production.**
