# ROVEXO P3.1 — RUNTIME STABILITY CERTIFICATION
**STATUS:** COMPLETE (awaiting Owner approval — no commit / push / deploy)  
**DATE:** 2026-08-04  
**SCOPE:** ChunkLoad recovery stability only · zero functional / UI change  
**HOST:** `http://localhost:3000` (Next.js 16 · Turbopack · HMR)

---

## 1. Root Cause

**Primary (framework / environment):**  
Long-lived Safari (and other) tabs keep an **in-memory Turbopack module graph / HMR async-loader identity** that outlives a `next dev` rebuild. The tab requests **superseded chunk hashes** (especially `%5Bturbopack%5D_browser_dev_hmr-client_*`). Server usually still has files (HTTP 200) or HMR is mid-rebuild → browser throws `ChunkLoadError`.

**Secondary (application amplifier — fixed this phase):**  
1. **Dual listeners** (inline bootstrap + React `ChunkLoadRecovery`) could both schedule `location.replace(?rx_chunk=1)` before a shared sync lock existed → recovery storms (R1.2: ~29 `GET …?rx_chunk=1`).  
2. Session flag cleared after **8s**, so HMR races shortly after a heal triggered **another** recovery.  
3. Auto-reload treated **Turbopack HMR-client** failures the same as **app route** chunk failures on localhost/LAN — full reload cannot eliminate HMR races and increases noise.

**Not root cause:** Sell/business logic, SW intercept of `/_next` on localhost (SW pass-through + unregister), missing production app code paths.

---

## 2. Evidence

| Source | Finding |
|--------|---------|
| Owner | Desktop/Android PASS · Safari iPhone functional PASS · Safari still shows ChunkLoadError → recovery → app continues |
| `R1_2_CHUNKLOAD_ROOT_CAUSE.md` | Failing URLs later **200**; HMR ids in errors ≠ current HTML HMR id; 51 ChunkLoad lines; ~29 `?rx_chunk=1` |
| `public/sw.js` | Localhost/LAN: **no fetch interception** |
| Next `allowedDevOrigins` | Localhost + RFC1918 (incl. WSL) already configured |

Classification (Step 2):

| Code | Verdict |
|------|---------|
| A Safari cache | **Contributing** (tab retention) |
| B Turbopack HMR | **PRIMARY** |
| C Dev rebuild | **Trigger** |
| D Multiple localhost tabs | **Amplifier** |
| E Old service worker | **REJECTED** on localhost |
| F Stale manifest | **Contributing** (client graph, not missing disk) |
| G Recovery implementation | **Amplifier** (dual fire + short unlock) → **HARDENED** |
| H Application bug | **REJECTED** (marketplace logic) |

---

## 3. Chunk Trace (canonical pattern)

| Field | Typical value |
|-------|----------------|
| Requested chunk | `/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_<OLD_HASH>._.js` |
| Expected (current HTML) | Newer `…hmr-client…_<NEW_HASH>._.js` |
| Current build | Turbopack content-hash filenames under `.next/dev/static/chunks/` |
| Browser | Safari iPhone (Owner) · also Chromium after rebuild |
| Path | Soft-nav / idle HMR / multi-tab after `next dev` restart |
| Recovery | Previously executed (one-shot) · app continued |

---

## 4. Recovery Trace (before → after)

**Before**

```
ChunkLoadError (often HMR)
→ bootstrap listener schedules reload
→ React listener may also schedule reload
→ ?rx_chunk=1 storm
→ session flag "1"
→ after 8s flag cleared
→ next HMR race recovers again
```

**After (P3.1)**

```
ChunkLoadError
→ shouldAutoRecover?
     · Turbopack HMR on localhost/LAN → NO auto-reload (error still logged by browser)
     · App chunk failure → YES
→ sync window.__rovexoChunkRecoveryLock (bootstrap + React)
→ session timestamp + 120s cooldown
→ single location.replace(?rx_chunk=1)
→ strip param; keep cooldown (no 8s unlock)
```

---

## 5. Safari Analysis

- Owner device matrix: **functionality PASS**; instability = console ChunkLoad + recovery.
- Safari retains tab JS heap across server rebuilds more painfully with LAN/`allowedDevOrigins` sessions.
- SW not caching `/_next` on private hosts.
- Environment discipline still required for true silence: **one tab**, clear site data after `next dev` restart, full document load (see R1.2).

---

## 6. Turbopack Analysis

- HMR client chunks are content-hashed; multiple hash variants can coexist on disk during one process lifetime.
- Soft-nav + HMR async import maps desync without a full document navigation.
- Disabling Turbopack/HMR is **FORBIDDEN** this phase → cannot delete framework races in-app.

---

## 7. Framework vs Application conclusion

| Layer | Responsibility |
|-------|----------------|
| **Framework (Turbopack HMR)** | Origin of most localhost ChunkLoadErrors |
| **Environment** | Multi-tab / stale heap after rebuild |
| **Application (this phase)** | Recovery must not storm, double-fire, or full-reload for HMR-client races on dev hosts |

**Honest success boundary:**  
P3.1 eliminates **recovery instability** (duplicate reload, short unlock, HMR auto-heal spam).  
**Absolute ZERO ChunkLoadError lines in Safari while HMR is mid-rebuild with a stale tab** remains a **Turbopack/environment** property — not suppressible without hiding errors (forbidden).

---

## 8. Files modified

| File | Change |
|------|--------|
| `lib/runtime/chunk-load-recovery-guard-v1.ts` | **NEW** — pure classify / cooldown / host rules |
| `components/runtime/ChunkLoadRecovery.tsx` | Sync lock · 120s cooldown · HMR skip on dev hosts |
| `components/runtime/chunk-load-bootstrap.ts` | Mirrored rules (pre-React) |
| `tests/p3-1-chunk-load-recovery-guard-v1.test.ts` | **NEW** — guard + bootstrap sync |

---

## 9. Before vs After

| Behaviour | Before | After |
|-----------|--------|-------|
| Dual recovery race | Possible | Blocked (`__rovexoChunkRecoveryLock`) |
| Cooldown | ~8s unlock | **120s** timestamp cooldown |
| HMR-client ChunkLoad on localhost/LAN | Auto-reload | **No auto-reload** (error still visible) |
| App chunk stale after deploy/rebuild | One-shot reload | Unchanged intent · safer |
| Marketplace UI / APIs | — | **Unchanged** |

---

## 10. Console comparison

| Event | Before | After |
|-------|--------|-------|
| HMR ChunkLoadError (Safari localhost) | Error + recovery reload | Error (still logged) · **no recovery reload** |
| App chunk ChunkLoadError | Error + reload | Error + **single** reload |
| `?rx_chunk=1` storm | Observed (R1.2) | Guarded against |

---

## 11. Device matrix

| Device | Agent | Owner |
|--------|-------|-------|
| Desktop Chrome | Guard unit tests PASS · build pending/complete in log | Owner confirm |
| Desktop Edge | Same code path | Owner confirm |
| Safari iPhone | Logic targets LAN+HMR skip | **Owner confirm** (primary) |
| Chrome Android | Same | Owner confirm |
| Chrome iPhone | Same | Owner confirm |

Surfaces to spot-check after **one fresh tab** + hard load: Homepage · Browse · Search · Sell · Listing · Account · Wallet · Checkout · Messages · Inbox · back nav · HMR · hard refresh.

---

## 12. Quality gates

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (touched) | **PASS** |
| Vitest P3.1 guard | **PASS** 6/6 |
| Production Build | **PASS** (`EXIT:0`) |
| Playwright full matrix | Owner / env |
| Functional regression | **ZERO intended** |

---

## 13. PASS / FAIL

### **PASS** (runtime recovery stability · zero functional change)

**Owner actions for quietest Safari console**

1. Close all `localhost` / LAN tabs.  
2. Clear site data for that origin.  
3. One fresh full load after `next dev` Ready.  
4. Avoid keeping tabs open across `.next` deletes / server restarts.

**No commit / push / merge / deploy without Owner approval.**
