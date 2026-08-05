# BLOOD_RUNTIME_ARCHITECTURE_REPORT.md

**STATUS:** ARCHITECTURAL FIX IMPLEMENTED · AWAITING OWNER APPROVAL  
**Date:** 2026-08-05  
**Mission:** COD SÂNGE — Blood Law Runtime Architectural Fix  
**FAIL CLOSED:** No push · No deploy · Stop after this report

---

## Root cause

Serverless production (Vercel NFT + ROVEXO prune) does **not** ship monorepo source files (`*.ts` / `*.tsx` / `*.css`) under `/var/task`.

Blood Laws XXXVII–XLV still certified by **reading source trees at instrumentation boot**. Missing files → throw → instrumentation hook fails → **HTTP 500** on `/login`, `/search`, `/help`, etc.

This is **not** Counter Offer, Inbox, Auth, Search, marketplace, Stripe, or RLS failure.

Identical class for: **XXXVII · XXXVIII · XXXIX · XL · XLI · XLII · XLIII · XLIV · XLV**.

---

## Architecture (ONE shared layer)

```
instrumentation.register()
  → runStartupCertificationGate(label, assertFn)     ← SINGLE choke point
       ├─ shouldSkipSourceTreeVerificationAtRuntime()
       ├─ isSourceIntegrityBloodLawLabel(label)      ← XXXVII–XLV
       ├─ isSourceTreeAvailable()                    ← NFT probe
       │     → SKIP assert · warn once · continue
       └─ catch → isSourceTreeEnoentError
                → isSourceTreeCertificationFailure   ← “file missing (lib/…ts)”
                     → warn once · never throw · continue

Blood Law readers (XLIII/XLIV/XLV + brand facade):
  → readSourceUtf8() / readUtf8SourceOrEmpty()
       → SOURCE_NOT_AVAILABLE_IN_SERVERLESS (never ENOENT throw on Vercel)
```

### SSOT

| Module | Role |
|--------|------|
| `lib/startup/source-integrity-runtime-v1.ts` | **ONE** architectural runtime helper |
| `lib/startup/startup-certification-policy-v1.ts` | Gate applies helper to **all** startup Blood Laws |
| `lib/startup/brand-integrity-runtime-v1.ts` | Thin facade → source-integrity (XXXVII–XLI imports unchanged) |

### Behaviour

| Condition | Result |
|-----------|--------|
| `VERCEL=1` + source tree absent + Blood XXXVII–XLV | Skip certification · **one** structured JSON warn · boot continues |
| Node `ENOENT` on source path | Soft-continue (unless `ROVEXO_CERTIFICATION_MODE`) |
| XLIII-style `file missing (features/…tsx)` on Vercel | Soft-continue |
| Stripe / Supabase / DB / env / security errors | **Still throw** (not suppressed) |
| Local monorepo + Vitest / certification mode | **Fail-closed** source scans still run |

Structured warning (exactly one per process):

```json
{
  "level": "warn",
  "event": "SOURCE_NOT_AVAILABLE_IN_SERVERLESS",
  "policy": "source-integrity-runtime-v1",
  "message": "Source-tree Blood Law verification skipped at serverless runtime (NFT prune). Boot continues."
}
```

---

## Affected Blood Laws

| Law | Covered by shared gate | Reader uses shared helper |
|-----|------------------------|---------------------------|
| XXXVII Official Brand Emblem | Yes | Via brand facade (`readUtf8SourceOrEmpty`) |
| XXXVIII Official Brand Application | Yes | Via brand facade |
| XXXIX Authentication Brand Freeze | Yes | Via brand facade |
| XL Register Visual Polish | Yes | Via brand facade |
| XLI Auth Experience Final Freeze | Yes | Via brand facade |
| XLII Full Platform Runtime | Yes | `shouldSkipSourceTreeVerificationAtRuntime` |
| XLIII Counter Offer | Yes | `readSourceUtf8` |
| XLIV Full Demo Environment | Yes | `readSourceUtf8` |
| XLV Final Live Production | Yes | `readSourceUtf8` |

**Not modified as marketplace logic:** Catalog XXXII/XXXIII, Global Freeze XXXIV, Category Visual XXXV/XXXVI (asset/`public` class — not this source-tree NFT fix).

---

## Files modified

| File | Change |
|------|--------|
| `lib/startup/source-integrity-runtime-v1.ts` | **NEW** — architectural SSOT |
| `lib/startup/brand-integrity-runtime-v1.ts` | Facade → source-integrity |
| `lib/startup/startup-certification-policy-v1.ts` | Gate consumes SSOT (auto-cover XXXVII–XLV) |
| `lib/supreme-blood-law-xlii-full-platform-certification-v1.ts` | Use shared skip helper |
| `lib/supreme-blood-law-xliii-counter-offer-certification-v1.ts` | `requireSource` → `readSourceUtf8` |
| `lib/supreme-blood-law-xliv-full-demo-certification-environment-v1.ts` | Workspace reads → `readSourceUtf8` |
| `lib/supreme-blood-law-xlv-final-live-production-certification-v1.ts` | Contract reads → `readSourceUtf8` |
| `instrumentation.ts` | Comment only (policy pointer) |
| `tests/source-integrity-runtime-v1.test.ts` | **NEW** — architectural tests |

### Explicitly unchanged

- Marketplace logic · UI · Auth UX · Payments · Checkout · Stripe · RLS · Database schema  
- No per-law one-off soft-fail forks for XLIII / XLIV / XLV alone

---

## Validation

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint (changed files) | **PASS** |
| Vitest source-integrity + brand + startup policy | **23/23 PASS** |
| Vitest Blood XLII–XLV / brand related suite | **89/89 PASS** |
| `npm run build` | **PASS** (`BUILD_EXIT:0`) |
| Serverless simulation (`VERCEL=1` + file-missing throws) | XLIII–XLV `blocked=false` · `sourceIntegritySkipped=true` |
| Local smoke `http://127.0.0.1:3000` | `/login` **200** · `/search` **200** · `/help` **200** · `/categories` **200** · `/` **307** (auth redirect, not 500) |

No Blood Law throws HTTP 500 because source files are absent under the shared policy.

---

## Recommendation for Owner

1. **Approve** this architectural fix (single source-integrity runtime).  
2. Authorize commit → push → production redeploy.  
3. Live smoke on `https://www.rovexo.co.uk` for `/login` `/search` `/help` `/categories` `/`.  
4. Keep release / Owner certification modes fail-closed with full monorepo source (CI / `ROVEXO_CERTIFICATION_MODE`).

---

## Stop

**NO commit · NO push · NO deploy** until Owner approval.
