# ROVEXO Production Infrastructure Trace — Phase 4

**STATUS:** EVIDENCE ONLY · NO OPTIMIZATIONS · NO COMMIT · NO PUSH · NO DEPLOY  
**Host:** `https://www.rovexo.co.uk` only  
**Captured:** 2026-08-04 (probe GB / Walsall · AS5378 Vodafone)  
**Constraint:** Public HTTP headers · DNS · Vercel response metadata · publicly accessible endpoints only. **No `.env` · no Supabase keys · no secret injection.**

**Evidence:** `test-results/prod-infra-trace/curl-matrix.json` · `test-results/prod-infra-trace/summary.json`  
**Parents:** `ROVEXO_PERFORMANCE_ROOT_CAUSE.md` · `ROVEXO_SSR_TRACE.md`

---

## 1. Mission

Attribute the remaining **~2600–2900 ms** document TTFB on production after Phase 2–3 ruled out “unmeasured app awaits” as the primary floor.

| Question | Answer (evidence) |
|---|---|
| Where does the ~3 s HTML wait go? | Almost entirely **after** UK edge, inside **Vercel function region `iad1`** serving **dynamic SSR MISS** documents |
| Is it cold start alone? | **No** — `/login` burst ×8 still **2986–3092 ms** MISS |
| Is it UK↔US RTT alone? | **No** — same path `lhr1→iad1` light API ≈ **147 ms** |
| Is it Supabase public latency alone? | **No** — public host via Cloudflare LHR ≈ **40 ms** wait (401 without key; expected) |

---

## 2. Probe context (public)

| Fact | Value |
|---|---|
| Client IP / geo | `90.242.142.155` · Walsall · England · GB |
| ISP | AS5378 Vodafone Limited |
| DNS `www.rovexo.co.uk` | `64.29.17.65` · `216.198.79.65` → `*.vercel-dns-017.com` |
| Public Supabase host DNS | Cloudflare anycast (`172.64.149.246` · `104.18.38.10`) |
| Supabase health (no key) | HTTP **401** · `server: cloudflare` · `cf-ray: …-LHR` · wait ≈ **40 ms** |
| Repo `vercel.json` | **No `regions` field** → platform default; observed function region = **`iad1`** |
| `Server-Timing` on production | **Absent** on all sampled routes |
| Vercel CLI / dashboard observability | **Unavailable** in this environment (no `vercel` CLI / no Owner auth) |

---

## 3. Region & cache topology (from headers only)

```
Client (GB)
   │  DNS ~6–9 ms · TLS ~14–17 ms
   ▼
Vercel Edge POP  lhr1  (London)
   │
   ├─ Static / edge HIT  →  wait ~13–84 ms · x-vercel-id: lhr1::…  (no iad1)
   │
   └─ Dynamic / function MISS → x-vercel-id: lhr1::iad1::…
         ▼
      Function region  iad1  (Ashburn, US-East)
         │
         ├─ Light API (badge 401)     ~140–210 ms
         ├─ Feed API                  ~1100–2300 ms
         └─ HTML / RSC documents      ~2950–3260 ms  ← floor under investigation
```

### Header pattern (canonical)

```
x-vercel-cache: MISS | HIT
x-vercel-id:   lhr1::<optional-iad1>::<request-id>
x-matched-path: /login | /_not-found | /api/inbox/badge | …
server: Vercel
```

HTML documents always: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` · `age: 0` · **MISS**.

---

## 4. Millisecond matrix (wait after TLS · medians)

### 4.1 Dynamic HTML / SSR (MISS · `lhr1→iad1`)

| Surface | Median wait | Min–Max | Cache | Path |
|---|---:|---|---|---|
| `/login` | **3046 ms** | 3036–3055 | MISS | `lhr1→iad1` |
| `/` | ~3000–3260 | (matrix) | MISS | `lhr1→iad1` |
| `/search` | ~3000–3260 | (matrix) | MISS | `lhr1→iad1` |
| `/categories` | ~3000–3260 | (matrix) | MISS | `lhr1→iad1` |
| `/terms` | **2977 ms** | 2954–3061 | MISS | `lhr1→iad1` |
| `/_not-found` via `/api/search/trending` 404 | **2979 ms** | 2949–3024 | MISS | `lhr1→iad1` |

**Critical:** `/terms` and `/_not-found` ≈ same floor as `/login` (±~70 ms). Page-specific React work cannot explain a shared **~3.0 s** floor.

### 4.2 Same-region functions (MISS · `lhr1→iad1`)

| Surface | Median wait | Notes |
|---|---:|---|
| `GET /api/inbox/badge` (guest **401**) | **147 ms** | Upper bound for edge→iad1 + middleware + light handler |
| `GET /api/homepage/feed` | **1273 ms** | Real work / data path; still **≪ HTML floor** |
| Sitemap (HIT after warm) | **66 ms** | Cached at edge/fn path; proves HIT can be fast |

### 4.3 Edge-only static (HIT · `lhr1` only)

| Surface | Median wait | Cache |
|---|---:|---|
| `/favicon.ico` | **20 ms** | HIT |
| Brand / manifest / robots / static JS·CSS·font | **13–84 ms** | HIT |

### 4.4 Burst warm (rules out cold-start-as-sole-cause)

`/login` ×8 sequential:

| Stat | ms |
|---|---:|
| Min | 2986 |
| Median | 3052 |
| Max | 3092 |

All **MISS** · all `lhr1→iad1`. Floor does **not** collapse after “warming.”

### 4.5 Client network phases (login sample)

| Phase | Median |
|---|---:|
| DNS | ~9 ms |
| TLS | ~17 ms |
| Wait after TLS (TTFB body) | **~3046 ms** |
| Transfer | ~181–335 ms (HTML body; separate from wait) |

---

## 5. Attribution model (subtractive)

| Slice | ms (approx) | Method |
|---|---:|---|
| A · Edge baseline (HIT favicon) | **20** | Public curl |
| B · Same-region light function (badge 401) | **147** | Public curl · includes `lhr1→iad1` RTT + middleware + 401 |
| C · HTML document floor (`/login`) | **3046** | Public curl |
| D · HTML − edge | **3026** | C − A |
| E · HTML − light function | **2899** | C − B = residual **document/platform SSR path** vs light API |
| F · Phase 3 local max RSC tree (`/account`) | **≤314** | Local `next start` + SSR instrumentation (not production) |
| G · Platform residual vs Phase 3 app bound | **≈2585** | E − 314 |

### Interpretation

```
~3046 ms HTML wait
  − ~20 ms   UK edge / TLS path (shown by HIT static)
  − ~147 ms  same-region function + middleware upper bound (badge)
  − ≤314 ms  generous app SSR bound from Phase 3 local instrumentation
  ≈ 2585 ms  UNEXPLAINED BY APP AWAITS · ATTRIBUTABLE TO VERCEL DOCUMENT/PLATFORM PATH ON iad1
```

**Server-Timing cannot split** Edge queue · cold start · Fluid compute · Next.js document pipeline on live production — header is **null** on every sample.

---

## 6. What each category can / cannot explain

### Application (confidence **low as primary cause of the 2.9 s**)

| Evidence | Implication |
|---|---|
| `/terms` ≈ `/login` ≈ `/_not-found` ≈ **3.0 s** | Shared floor independent of page body complexity |
| Phase 3 local RSC ≤ **314 ms** | App awaits do not produce a 2.9 s floor when platform path is local |
| Confidence that **application code is the missing 2.6–2.9 s** | **≤15%** |

App still contributes **some** time inside the iad1 function (middleware, RSC, data). That contribution is **bounded** by light API (~147 ms) + Phase 3 SSR (≤314 ms), not by the full 3 s.

### Database / Supabase (confidence **low as primary cause of the 2.9 s**)

| Evidence | Implication |
|---|---|
| Public Supabase host · Cloudflare **LHR** · ~**40 ms** | Public edge near UK; not a 3 s hop by itself |
| `/_not-found` still ~**3.0 s** | No successful DB query required for that floor |
| Badge 401 same region **147 ms** | Auth/middleware path can finish without a 3 s DB stall |
| Confidence that **DB alone is the missing 2.6–2.9 s** | **≤10%** |

DB can still add latency on data-heavy routes (e.g. feed ~1.1–2.3 s). That is **orthogonal** to the HTML document floor shared with `/terms` and `/_not-found`.

### Network (client ↔ edge) (confidence **ruled out as primary**)

| Evidence | Implication |
|---|---|
| DNS + TLS ≪ 50 ms | Not the floor |
| Edge HIT ~20 ms | Last-mile to `lhr1` is healthy |
| Confidence that **client network is the missing 2.6–2.9 s** | **≤5%** |

Transatlantic **edge→function** RTT is real but **bounded** by badge **~147 ms** on the same `lhr1→iad1` path.

### Configuration (confidence **high as enabler**)

| Evidence | Implication |
|---|---|
| `vercel.json` has **no `regions`** | Functions default to observed **`iad1`** |
| HTML always `private, no-store` · **MISS** | Every document navigation pays full function path |
| Confidence that **region + dynamic MISS config enables the floor** | **≥85%** as **enabling condition** (not a measured internal timer) |

This does **not** invent an Owner change. It only records that the observed topology matches “UK edge + US-East function + uncacheable HTML.”

### Vercel platform / document path on `iad1` (confidence **highest**)

| Evidence | Implication |
|---|---|
| Shared ~3.0 s floor across unrelated HTML + not-found | Platform/document class, not page code |
| Burst warm still ~3.0 s | Not pure cold start |
| Light API same region ~147 ms | Platform can be fast for short handlers; **document SSR class** is slow |
| Residual after subtractive model ≈ **2.6–2.9 s** | Matches Phase 2–3 “platform residual” |
| Confidence that **Vercel `iad1` dynamic document/SSR path is the primary location of the missing time** | **≥80%** |

**Unknown inside that bucket** (no Server-Timing / no dashboard): queueing · Fluid/compute scheduling · Next.js document bootstrap on Fluid · framework SSR overhead beyond Phase 3 local · other platform internals.  
Confidence for any **single** named sub-mechanism (e.g. “cold start only”): **≤25%**.

---

## 7. Diagrams

### 7.1 Request classes

```
                    ┌─────────────────────────┐
                    │     Client GB (probe)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Vercel Edge  lhr1      │
                    └───────┬─────────┬───────┘
           HIT static       │         │ MISS dynamic
           ~20 ms           │         │
              │             │         ▼
              │             │   ┌─────────────┐
              │             │   │ Function iad1│
              │             │   └──┬──────┬───┘
              │             │      │      │
              │             │   light   HTML/RSC
              │             │   ~147ms  ~3000ms
              ▼             ▼      │      │
           favicon        sitemap HIT   login/terms/_not-found
```

### 7.2 Cold vs warm (public)

```
Cold start hypothesis alone  →  FAIL
  Evidence: /login burst ×8 still 2986–3092 ms MISS

Warm edge HIT                →  PASS (fast)
  Evidence: favicon / static ~20 ms

Warm function HIT (sitemap)  →  PASS (fast when cacheable)
  Evidence: sitemap HIT ~66 ms

Warm function MISS (HTML)    →  STILL ~3.0 s
  Evidence: every HTML sample MISS · age 0
```

---

## 8. Confidence board (Owner question)

| Category | Is it the missing ~2.6–2.9 s? | Confidence |
|---|---|---:|
| **Application** | Primary cause? **No** | **15%** yes / **85%** no |
| **Database** | Primary cause? **No** | **10%** yes / **90%** no |
| **Network (client↔edge)** | Primary cause? **No** | **5%** yes / **95%** no |
| **Configuration** (no `regions` · HTML no-store MISS · default `iad1`) | Enabling? **Yes** | **85%** |
| **Vercel platform / `iad1` dynamic document path** | Primary location? **Yes** | **80%** |
| **Unknown sub-timer inside Vercel document path** | Exact mechanism? **Yes unknown** | Residual **~2585 ms** unexplained at mechanism granularity |

**Residual unexplained delay (mechanism-level):** ≈ **2500–2900 ms** inside the Vercel `iad1` dynamic HTML/RSC class — **not** explained by measured app awaits, public DB RTT, or UK last-mile.

---

## 9. Explicit non-actions (this phase)

- No code optimizations  
- No region changes applied  
- No commit · push · deploy  
- No `.env` / secret reads  
- No Supabase key extract/inject  
- No claim of Owner Certification / Production PASS from this trace alone  

---

## 10. Final verdict

**The missing ~2.6–2.9 s on production document TTFB is located on the Vercel `lhr1 → iad1` dynamic SSR / HTML MISS path — not on UK last-mile, not on public Supabase edge latency, and not on page-specific application awaits as the primary floor.**

Public subtractive evidence:

1. Edge HIT ≈ **20 ms**  
2. Same-region light function ≈ **147 ms**  
3. Unrelated HTML + `/_not-found` share ≈ **3000 ms**  
4. Burst warm does not remove the floor  
5. Phase 3 local app SSR ≤ **314 ms**  
6. Residual ≈ **2585 ms** → **Vercel document/platform class on `iad1`** (configuration enables US-East function + uncacheable HTML)

**Await Owner** before any infrastructure change (e.g. region, caching class, platform settings). This report is attribution evidence only.
