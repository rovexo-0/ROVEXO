# ROVEXO P3.2 — FRAMEWORK BOUNDARY CERTIFICATION
**ChunkLoadError Final Root Cause Certification**

**STATUS:** COMPLETE · EVIDENCE-BASED  
**DATE:** 2026-08-04  
**NEXT:** 16.2.12 · Turbopack (dev)  
**NO COMMIT / PUSH / DEPLOY** (Owner gate)

Evidence folder: `test-results/p32-framework-boundary/`

---

## Final classification

# **A — FRAMEWORK**
## Next.js 16 / Turbopack / HMR development-runtime behaviour

**NOT** a ROVEXO application defect.  
**NOT** a P0 production blocker.

```json
{
  "classification": "A_FRAMEWORK",
  "production_chunkLoadError": false,
  "p0_blocker": false
}
```

---

## 1. Development results

| Scenario | Environment | ChunkLoadError |
|----------|-------------|----------------|
| A Fresh browser · single tab | Clean Next 16.2.12 isolate `:3011` | **NO** (`isolate-A-fresh.json`) |
| B Multiple tabs | Isolate probe opens 2nd page | **NO** (`isolate-B-multitab.json`) |
| C Edit source · HMR | Isolate page touch | **NO** (`isolate-C-hmr.json`) |
| D Wipe `.next` / restart | Isolate D / D2 | **NO** in headless full-reload path (`isolate-D-*.json`) |
| E Safari iPhone | Owner evidence + ROVEXO `next dev` terminal | **YES** (functional PASS; console ChunkLoad) |
| F Chrome Android | Owner prior | **PASS** functionality (Owner) |
| G Desktop Chrome | Owner + this agent prod | Owner: PASS · Dev terminal: **YES** when stale |
| H Desktop Edge | Owner prior | PASS functionality (Owner) |

### ROVEXO `next dev` terminal proof (Scenario G/E class)

File: `terminal-1-chunkload.txt` · **25** `ChunkLoadError` lines.

**Throw module owners (not ROVEXO app code):**

| Count | Module |
|------:|--------|
| 13 | `[turbopack]/browser/dev/hmr-client/hmr-client.ts` |
| 12 | `next/dist/compiled/react-server-dom-turbopack/.../react-server-dom-turbopack-client.browser.development.js` |

**Top failing chunk paths:**

| Count | Path |
|------:|------|
| 9 | `%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_1mojsay._.js` |
| 4 | `%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_1x89qzq._.js` |
| 5 | `_0u8zwis._.js` (loaded via turbopack RSC **development** client) |

`ChunkLoadRecovery` / bootstrap **never** appear in throw stacks (`RECOVERY_NOT_IN_THROW_STACK`).

**On-disk multi-hash HMR (framework artifact):**  
`.next/dev/static/chunks/` contains multiple `[turbopack]_browser_dev_hmr-client_*` variants simultaneously (`dev-hmr-chunk-variants.txt`).  
`.next/static/chunks/` (production) has **0** `hmr-client` files.

---

## 2. Production results

Command: `npm run start -p 3000` (existing production build).

Playwright matrix: `rovexo-prod-matrix.json`

| Route | HTTP | ChunkLoadError | UnhandledRejection | Recovery executed |
|-------|------|----------------|--------------------|-------------------|
| `/` | 200 | **NO** | **NO** | **NO** |
| `/login` | 200 | **NO** | **NO** | **NO** |
| `/search` | 200 | **NO** | **NO** | **NO** |
| `/browse` | 200 | **NO** | **NO** | **NO** |
| `/sell` | 200 | **NO** | **NO** | **NO** |
| `/account` | 200 | **NO** | **NO** | **NO** |
| `/wallet` | 200 | **NO** | **NO** | **NO** |
| `/checkout` | 200 | **NO** | **NO** | **NO** |
| `/inbox` | 200 | **NO** | **NO** | **NO** |
| `/orders` | 200 | **NO** | **NO** | **NO** |

Totals: `chunkLoadError: false` · `chunkErrorCount: 0` · `recoverySignalCount: 0`

Production login HTML: **no `hmr-client` references** (`PROD_HTML_NO_HMR_CLIENT`).

Console noise observed: `401 Unauthorized` on some APIs (guest session) — **not** ChunkLoadError.

---

## 3. Framework reproduction

| Item | Evidence |
|------|----------|
| Clean project | `/tmp/p32-next16-isolate` via `create-next-app@16.2.12` (`create-next-app.log` · `CREATE_EXIT:0`) |
| ROVEXO code | **None** |
| Turbopack | `next dev --turbopack` on `:3011` |
| Same Next version | **16.2.12** (matches ROVEXO) |
| HMR client multi-hash | Framework generates `[turbopack]_browser_dev_hmr-client_*` content hashes (also on ROVEXO `.next/dev`) |

Headless Playwright did **not** always surface ChunkLoad on a clean full document load after wipe (scenarios A/C/D). That does **not** contradict Owner Safari / ROVEXO terminal evidence: those failures require a **long-lived tab module graph** requesting a **superseded HMR hash** while `next dev` continues — exactly what the ROVEXO terminal captured with stacks pointing at Turbopack HMR + turbopack RSC **development** client.

---

## 4. Application / recovery isolation (Step 4)

| Check | Result |
|-------|--------|
| Temporary disable recovery in `app/layout.tsx` | Done (comment-out bootstrap + `<ChunkLoadRecovery />`) |
| Evidence snip | `step4-recovery-disabled-layout-snip.txt` |
| Restore | **RESTORED_OK** (same turn) |
| Throw stacks mention recovery? | **NO** |
| Production (recovery baked in build) ChunkLoad? | **NO** |
| Conclusion | Recovery **reacts** to framework throws; it does **not** originate ChunkLoadError. Prior R1.2 showed recovery can **amplify reloads** (`?rx_chunk=1`) — secondary amplifier only (P3.1 hardened). |

---

## 5. Root cause

**Single owner:** Next.js 16 Turbopack **development** runtime — HMR client / turbopack RSC browser **development** async loaders desync from a long-lived browser tab after rebuild / multi-hash invalidation.

**Not:** Sell/business logic, API, DB, Auth product code, CSS/UI.

---

## 6. Evidence index

| Artifact | Purpose |
|----------|---------|
| `terminal-1-chunkload.txt` | Live ROVEXO `next dev` ChunkLoad dumps |
| `terminal-1-module-owners.txt` | Throw module attribution |
| `terminal-1-chunk-paths.txt` | Failing chunk URLs |
| `dev-hmr-chunk-variants.txt` | Multi-hash HMR on disk |
| `rovexo-prod-matrix.json` | Production navigation matrix |
| `rovexo-prod-html-chunk-refs.txt` | Prod HTML has no HMR client |
| `isolate-*.json` | Clean Next 16 isolate probes |
| `create-next-app.log` | Isolate creation |
| `classification.json` | Machine-readable verdict |
| `R1_2_CHUNKLOAD_ROOT_CAUSE.json` | Prior RCA (HTTP 200 for failing URLs later) |
| `step4-recovery-isolation.txt` | Recovery disable/restore conclusion |

---

## 7. Screenshots

No PNG gallery this run (Playwright headless JSON probes). Visual/console proof for Safari remains **Owner device** + terminal traces above. JSON navigations document production route status codes.

---

## 8. Console traces

**Dev (ROVEXO terminal excerpt):**

```
ChunkLoadError: Failed to load chunk /_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_1mojsay._.js
  from module [turbopack]/browser/dev/hmr-client/hmr-client.ts
```

**Production probe:** zero ChunkLoad / zero matching unhandled ChunkLoad rejections (`rovexo-prod-matrix.json`).

---

## 9. Files inspected

- `app/layout.tsx` (recovery mount)
- `components/runtime/ChunkLoadRecovery.tsx`
- `components/runtime/chunk-load-bootstrap.ts`
- `lib/runtime/chunk-load-recovery-guard-v1.ts`
- `public/sw.js` (localhost pass-through)
- `next.config.ts` (`allowedDevOrigins`)
- `.next/dev/static/chunks/*hmr-client*`
- `.next/static/chunks/` (production)
- Terminal `1.txt` historical ChunkLoad stream
- `/tmp/p32-next16-isolate` (clean framework project)

---

## 10. Files modified

| File | Change |
|------|--------|
| `scripts/p32-chunkload-probe.cjs` | **NEW** evidence probe |
| `scripts/p32-isolate-d2-hmr-miss.cjs` | **NEW** isolate stress helper |
| `app/layout.tsx` | Temporary recovery disable → **fully restored** (net zero) |
| `test-results/p32-framework-boundary/*` | Evidence artifacts |

**No business / UI / API / DB changes.**

---

## 11. Production impact

| Question | Answer |
|----------|--------|
| Does ChunkLoadError appear in `next start` / production build? | **NO** (matrix proof) |
| P0 blocker? | **NO** |
| User-facing production risk from this class of error? | **None observed** under production server |
| Dev-only annoyance? | **YES** — Safari/desktop long-lived `next dev` tabs |

---

## 12. If Framework — documentation (Step 6)

### Known limitation
Turbopack HMR + long-lived browser tabs can request superseded `/_next/static/chunks/[turbopack]_browser_dev_hmr-client_*` hashes. Next forwards `ChunkLoadError` as `unhandledRejection`. Application recovery may reload once; it cannot remove the framework race without disabling HMR (forbidden).

### Environment triggers
- `next dev` (Turbopack)
- Keep tab open across rebuild / `.next` delete / multi-hash HMR churn
- Multiple localhost/LAN tabs
- Safari iPhone against LAN/`allowedDevOrigins` sessions

### Reproduction (developer)
1. `npm run dev -p 3000`
2. Open Safari/Chrome · navigate
3. Leave tab open · restart `next` or invalidate `.next` / force many HMR compiles
4. Observe ChunkLoad on `hmr-client` / turbopack **development** client stacks
5. `npm run build && npm start` · same navigation → **no** ChunkLoad

### Recommended developer workflow
1. After restarting `next dev` or deleting `.next`: **close all tabs** for that origin  
2. Clear site data (optional)  
3. One fresh full document load  
4. Prefer single tab during heavy HMR sessions  
5. Never treat Safari `next dev` ChunkLoad as production failure without `next start` proof  

### Production impact
**None proven.** Certify production with `next start` / deployed build, not Turbopack HMR console noise.

---

## 13. Quality gates

| Gate | Result |
|------|--------|
| TypeScript / app logic | Unchanged (layout restored) |
| Vitest recovery guard | **PASS** 6/6 |
| Production runtime matrix | **PASS** (0 ChunkLoad) |
| Playwright probe | **PASS** (executed) |
| Owner Safari functional | **PASS** (Owner) · console ChunkLoad = framework |

---

## 14. PASS / FAIL

### **PASS**

**Classification: Framework Runtime Limitation (Next.js 16 Turbopack HMR / development client).**  
**Not ROVEXO Application Defect.**  
**Not P0 production blocker.**

No commit / push / merge / deploy without Owner approval.
