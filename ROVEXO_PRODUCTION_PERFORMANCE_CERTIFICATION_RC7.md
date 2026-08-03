# ROVEXO_PRODUCTION_PERFORMANCE_CERTIFICATION_RC7.md

**STATUS:** FINAL LOGIN PERFORMANCE · GO / NO-GO  
**DATE:** 2026-08-03  
**BASELINE:** RC6 FINAL (Perf **90** · LCP **3560 ms**)  
**GLOBAL PRODUCTION FREEZE:** ACTIVE  
**CONSTRAINTS:** Login route performance only · **ZERO functional regression** · **NO COMMIT · NO PUSH · NO DEPLOY**  
**EVIDENCE:** `docs/releases/rc7/evidence/`

---

## Final Verdict

```
PRODUCTION RELEASE READY = NO
```

---

## Hang recovery note (ops)

| Field | Value |
|-------|--------|
| Hung command | `npm run build` → `prebuild` → `eslint` |
| Evidence | `docs/releases/rc7/evidence/regression/build4.log` ends with `eslint` then **`Killed`** |
| Why | OOM kill during full `prebuild` lint (duplicate of already-passing lint) · shell wait interrupted |
| Action taken | Confirmed process dead · terminated orphan RC7 CDP chrome (`/tmp/lh-rc7-cdp`) · continued from checkpoint with `npx next build` only |

---

## Before → After (Login mobile)

| Metric | BEFORE (RC6 FINAL) | AFTER1 (JS/provider split) | FINAL (CSS slim + plain emblem `<img>`) | Target | Gate |
|--------|--------------------|----------------------------|------------------------------------------|--------|------|
| Performance | **90** | **89** | **91** | ≥95 | **FAIL** |
| LCP | **3560 ms** | **3689 ms** | **3539 ms** | <2500 ms | **FAIL** |
| CLS | 0 | 0.004 | 0.004 | <0.1 | PASS |
| Unused CSS | ~21 KiB | ~20 KiB | **none** | — | improved |
| Unused JS | ~77 KiB | ~73 KiB | ~74 KiB | — | residual |
| CSS transfer | 60429 B | 59373 B | **46867 B** | — | −22% vs BEFORE |
| JS transfer | 296874 B | 301339 B | **295683 B** | — | ≈ flat |
| A11y | 98 | 98 | **98** | ≥95 | PASS |
| Best Practices | 96 | 100 | **100** | ≥95 | PASS |
| SEO | 69 | 69 | **69** | 100 | auth `noindex` (expected) |

### Desktop FINAL

Performance **99** · LCP **826 ms** · CLS **0** · A11y **98** · BP **100** · SEO **69**

### Deltas (BEFORE → FINAL mobile)

| Delta | Value |
|-------|-------|
| Performance | **+1** (90 → 91) |
| LCP | **−21 ms** (3560 → 3539) |
| CSS transfer | **−13 562 B** |
| Auth CSS disk chunk | ~163 KiB → **~80 KiB** · `wallet-v2` count **0** on auth chunk |
| Unused CSS | 21 KiB → **0** |

Evidence: `docs/releases/rc7/evidence/login-perf/FINAL-login-*.report.json` · `docs/releases/rc7/evidence/coverage/css-sizes.txt`

---

## Optimizations applied (RC7, evidence-backed)

1. **Platform chrome isolation** — `SearchProvider` / `HeaderProvider` → `PlatformChromeProviders` under `app/(platform)` only  
2. **Dynamic marketplace shell** — `AppShellLayout` dynamic-imports bundle/promo/scroll chrome  
3. **Deferred platform beacons** — GA / cookies / presence / push via `AuthChromeDeferred mode="platform-chrome"`  
4. **Auth profile fetch deferral** — skip `/api/profile` on auth routes (sign-in still server actions)  
5. **Dynamic OAuth buttons** on LoginScreen  
6. **Auth CSS slim** — `auth-entry.css` keeps tokens/typography/forms/`auth-v1`/primary-button/platform-canonical/icon-standard only  
7. **Plain `<img>` Primary Emblem** — same AVIF/size/appearance; removes client image wrapper from LCP path  

No Checkout / Marketplace / Auth business-logic / API / DB / security changes.

---

## Regression status

| Gate | Result | Evidence |
|------|--------|----------|
| typecheck | PASS | `typecheck3.log` |
| lint | PASS (0 errors) | `lint3.log` |
| next build | PASS | `build5-next.log` (`NEXT_BUILD:0`) |
| `npm run build` full prebuild | **Killed** (OOM on eslint) | `build4.log` — not required after isolated typecheck/lint/next build PASS |
| Targeted vitest | PASS (21) | `vitest-final2.log` |
| Auth functional logic | Unchanged (no session/OAuth/MFA handler edits beyond perf deferrals) | scope control |
| Checkout XXIII | Remains 6/6 PASS (RC5) — **not modified** | Owner visual gate only |

---

## Owner Checkout certification status

| Field | Value |
|-------|--------|
| Engineering | Blood XXIII **6/6 PASS** (RC5) · RVX-2007 CLOSED |
| Code this RC | **No Checkout changes** |
| Flags | `ownerCertified: false` · `permanentlyFrozen: false` |
| Required | **Owner visual approval only** → flip flags |

---

## Residual risks (verified)

1. Mobile login LCP still ~3.5 s under Lighthouse throttle — remaining unused JS ~74 KiB + shared root provider hydration  
2. Further gains likely need deeper root-layout provider stripping (freeze-sensitive)  
3. Auth SEO 69 = `noindex` — not a marketplace SEO regression  

---

## Verified remaining Production blockers

### RC7-B1 / RC5-B2 — Login Performance

| Field | Value |
|-------|--------|
| Status | **FAIL** |
| Evidence | Mobile Perf **91** · LCP **3539 ms** (`FINAL-login-mobile.report.json`) |
| Required | Perf ≥95 **and** LCP <2.5 s **or** Owner residual-risk acceptance |

### RC5-B1 — Owner Checkout certification

| Field | Value |
|-------|--------|
| Status | **FAIL** (Owner gate) |
| Engineering | Blood XXIII **6/6 PASS** |
| Required | Owner visual Desktop/Tablet/Mobile Checkout approve → `ownerCertified` + `permanentlyFrozen` |

---

## STOP

**NO COMMIT · NO PUSH · NO DEPLOY**  
Await explicit Owner approval.

---

```
PRODUCTION RELEASE READY = NO
```
