# OAUTH VERIFICATION CHECKLIST

**STATUS:** OWNER ACTION REQUIRED until every row is evidenced  
**Official test host:** `https://www.rovexo.co.uk`  
**Supabase:** `https://pklotmwxtnnepaitedic.supabase.co`  

**Do not mark PASS from localhost alone for Production.**  
**Do not invent credentials.** Application remains frozen.

---

## 0. Pre-flight (API)

Run after Supabase providers are enabled.

| # | Check | Command / action | Pass if | ☐ |
|---|--------|------------------|---------|---|
| 0.1 | Settings Google | `curl -s …/auth/v1/settings` | `external.google: true` | ☐ |
| 0.2 | Settings Apple | same | `external.apple: true` | ☐ |
| 0.3 | Authorize Google | `curl -sI …/authorize?provider=google&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback` | **302/303** to Google (not 400) | ☐ |
| 0.4 | Authorize Apple | same with `provider=apple` | **302/303** to Apple (not 400) | ☐ |

Copy-paste probes:

```bash
curl -s "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/settings" | head -c 800

curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"

curl -sI "https://pklotmwxtnnepaitedic.supabase.co/auth/v1/authorize?provider=apple&redirect_to=https%3A%2F%2Fwww.rovexo.co.uk%2Fauth%2Fcallback"
```

---

## 1. Google — functional

Test URL: `https://www.rovexo.co.uk/login`

| # | Test | Pass criteria | ☐ |
|---|------|---------------|---|
| G1 | Google Login | Consent → lands authenticated on ROVEXO (Homepage or intended `next`) | ☐ |
| G2 | Google Logout | Session cleared · redirected to Login · cannot open protected routes | ☐ |
| G3 | Google Session Restore | Hard refresh while logged in · still authenticated | ☐ |
| G4 | Google Refresh Token | Wait / force token refresh (or return after idle) · session renews without forced re-login (or clean re-auth if expired — document which) | ☐ |

---

## 2. Apple — functional

| # | Test | Pass criteria | ☐ |
|---|------|---------------|---|
| A1 | Apple Login | Apple sheet → authenticated on ROVEXO | ☐ |
| A2 | Apple Logout | Session cleared · Login | ☐ |
| A3 | Apple Session Restore | Hard refresh · still authenticated | ☐ |

---

## 3. Devices & browsers

Repeat **G1–G3** and **A1–A3** (or note Apple limitation) on each:

| # | Surface | Google | Apple | ☐ |
|---|---------|--------|-------|---|
| D1 | Desktop Chrome | ☐ | ☐ | ☐ |
| D2 | Desktop Safari | ☐ | ☐ | ☐ |
| D3 | iPhone Safari | ☐ | ☐ | ☐ |
| D4 | iPad Safari | ☐ | ☐ | ☐ |
| D5 | Chrome Android | ☐ | ☐ | ☐ |
| D6 | Multiple browsers (same account) | ☐ | ☐ | ☐ |
| D7 | Private / Incognito window | ☐ | ☐ | ☐ |

---

## 4. Session edge cases

| # | Test | Pass criteria | ☐ |
|---|------|---------------|---|
| S1 | Expired session | After expiry · protected route → Login (no white screen / crash) | ☐ |
| S2 | Private window Login | Fresh private window · Google and/or Apple Login works | ☐ |
| S3 | Account linking | Existing email user + Google/Apple with same verified email → **one** account (no duplicate) | ☐ |

---

## 5. Evidence log (Owner fills)

| Field | Value |
|-------|--------|
| Date | |
| Tester | |
| Google Client ID (last 6 chars only) | |
| Apple Services ID (last segment only) | |
| Authorize Google HTTP | |
| Authorize Apple HTTP | |
| Failures / notes | |

---

## 6. Verdict gates

| Gate | When |
|------|------|
| **OWNER ACTION REQUIRED** | Any ☐ unchecked or authorize still 400 |
| **WARNING** | Works on some devices only · consent still Testing · Android Apple limited |
| **PASS** | §§0–4 all evidenced on `https://www.rovexo.co.uk` |

---

## Related guides

- `GOOGLE_OAUTH_OWNER_SETUP.md`  
- `APPLE_OAUTH_OWNER_SETUP.md`  
- `SUPABASE_OAUTH_SETUP.md`  

**No code. No commit. No push. No Preview. No Production deploy.**
