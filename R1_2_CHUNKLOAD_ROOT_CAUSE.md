# R1.2 CHUNKLOAD ROOT CAUSE — COD SÂNGE

**STATUS:** ROOT CAUSE IDENTIFIED · **NO SOURCE CHANGES**  
**DATE:** 2026-08-04  
**HOST:** `http://localhost:3000` (Next.js 16.2.12 · Turbopack)  
**EVIDENCE:** `R1_2_CHUNKLOAD_ROOT_CAUSE.json` · terminal `655380` (clean post-recovery `next dev`)

---

## Verdict

ChunkLoadError messages that continue **after** successful artifact recovery are **not** caused by:

- Missing files in the current `.next` graph  
- Sell page business logic  
- Routes / APIs / DB  
- Service Worker intercepting `/_next` on localhost  

They are caused by **stale browser client module graphs (and HMR async loaders) that outlive a Turbopack rebuild**, amplified by the one-shot `?rx_chunk=1` recovery reload while those tabs stay open.

| Check | Result |
|-------|--------|
| Failing chunk URLs on disk now | **Present** |
| Live HTTP for those URLs | **10/10 → 200** |
| Current HTML HMR client | `…hmr-client…_0qns9ce._.js` only |
| Error-log HMR clients | `…_1mojsay._.js` + `…_1x89qzq._.js` (**stale vs HTML**) |
| HMR variants on disk simultaneously | **3** (`0qns9ce`, `1mojsay`, `1x89qzq`) |
| `ChunkLoadError` lines after clean start | **51** |
| `GET …?rx_chunk=1` recovery reloads | **~29** (mostly `/browse?rx_chunk=1`) |
| Localhost SW fetch intercept | **Disabled by design** (`public/sw.js`) |
| Functional / source changes this investigation | **NONE** |

---

## Root cause (single)

**Client–server Turbopack chunk-graph desync in long-lived browser tabs.**

Sequence observed on the **same** clean server session that already passed Sell SSR recovery:

1. `next dev` starts clean → Ready → `.next` regenerated.  
2. An **already-open** browser tab (or soft-nav session) still holds an older in-memory Turbopack import map / HMR async-loader identity.  
3. That tab requests superseded chunk hashes (notably HMR: `1mojsay`, `1x89qzq`) while the **current document** wants `0qns9ce`.  
4. Turbopack reports `ChunkLoadError` in the browser → Next forwards `[browser] unhandledRejection: ChunkLoadError` to the terminal.  
5. Pre-React / React recovery (`rovexo_chunk_load_recovery_v1` / `?rx_chunk=1`) performs a **one-shot** reload. Logs show a storm of `GET /browse?rx_chunk=1` (29).  
6. After the one-shot flag is set, further ChunkLoadErrors **keep logging** but recovery will not fire again → appears as “errors continue after recovery” even though the **server chunk set is healthy**.

Server-side probe of every unique failing path from those logs: **all HTTP 200 and on disk**. Therefore the continuing errors are **not** “chunks missing from `.next`”; they are **stale client references + HMR race**, not a broken Sell build.

---

## Why hydration / Sell looked broken (context)

Soft navigation shows `app/(platform)/sell/loading.tsx` until the client tree mounts. If the tab’s module graph cannot load chunks, the skeleton stays. Document `GET /sell` can still be **200** with Sell markup (already proven in `R1_2_SELL_RUNTIME_VERIFY.json`) while a **zombie tab** keeps emitting ChunkLoadError.

---

## Manifest / asset versioning

- Turbopack stores client assets under `.next/dev/static/chunks/` (content-hashed filenames).  
- Classic `build-manifest.json` does **not** enumerate those Turbopack hashes the way webpack did (`containsFailing: 0` is expected).  
- **Authoritative version check:** current HTML script tags vs on-disk files vs live HTTP.  
- Current `/login` HTML references HMR `0qns9ce` (200). Error logs request older HMR ids still left on disk from earlier compilations in the same process lifetime.

False-positive “404” from naive regex truncation (`_0u8zwis._.`, `fail-closed-v1_0oz`) are **not** real missing assets; full hashed URLs resolve.

---

## Service Worker / browser cache

| Layer | Finding |
|-------|---------|
| `public/sw.js` | On localhost / private LAN: **no fetch interception**; activate unregisters + clears caches. |
| `PwaProvider` | Dev/localhost: unregister SW + delete `rovexo-static*` caches. |
| Browser HTTP cache | Can retain old HTML that points at dead hashes **if** the tab never does a full document load against the new server. |
| sessionStorage | `rovexo_chunk_load_recovery_v1` blocks a second automatic heal → remaining errors look “persistent”. |

SW is **not** the active root cause for this continuing noise on localhost. Tab / HMR desync is.

---

## Why messages continue after “successful runtime recovery”

Runtime recovery fixed the **server** (cleared `.next`, coherent chunk graph, Sell document + chunks 200).  

It did **not** forcibly destroy every open Chromium/WebKit tab’s in-memory Turbopack runtime. Those tabs reconnect over HMR, request obsolete async-loader chunks, trigger recovery once, then keep throwing.

**Continuing ChunkLoadError ≠ failed server recovery.**

---

## Runtime / environment fix (no source changes)

Do this in order:

1. **Close every tab** on `localhost:3000` / `127.0.0.1:3000` (all windows).  
2. Optional but recommended: DevTools → Application → clear **site data** for that origin (Cache Storage, Service Workers, sessionStorage including `rovexo_chunk_load_recovery_v1`).  
3. Leave **one** fresh tab. Hard navigate to `http://localhost:3000/` (full load, not soft restore).  
4. Confirm terminal no longer floods `ChunkLoadError` / `?rx_chunk=1` on idle.  
5. Then open `/sell` once (authenticated).  

Do **not** delete `.next` while tabs remain open. Do **not** keep multiple long-lived tabs across `next dev` restarts.

No application source, Sell behavior, routes, or APIs were changed for this investigation.

---

## Classification

| Hypothesis | Status |
|------------|--------|
| Corrupted / empty `.next` after recovery | **REJECTED** (160 chunks on disk; failing URLs 200) |
| Sell / business logic defect | **REJECTED** |
| SW caching `/_next` on localhost | **REJECTED** (pass-through + unregister) |
| Stale tab + Turbopack HMR multi-hash race | **CONFIRMED** |
| `?rx_chunk=1` recovery amplifying log noise | **CONFIRMED** (secondary amplifier) |

---

## Final

**ROOT CAUSE = STALE BROWSER / HMR MODULE GRAPH AFTER TURBOPACK REBUILD**  
**SERVER RECOVERY = HEALTHY**  
**CONTINUING ERRORS = CLIENT TAB STATE (+ one-shot recovery spam)**  
**FIX = ENVIRONMENT (close tabs · clear site data · single fresh full load) — NO FUNCTIONAL CODE CHANGES**
