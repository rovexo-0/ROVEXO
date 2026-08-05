# ROOT_CAUSE.md

**STATUS:** INVESTIGATION ONLY · NO CODE CHANGES · FAIL CLOSED  
**Date:** 2026-08-05  
**Mission:** COD SÂNGE — Blood Laws Runtime Root Cause  
**Production URL:** https://www.rovexo.co.uk  
**Current live blocker:** Blood Law **XLIII**

---

## Verdict (one sentence)

**XLIII is the SAME serverless NFT / source-tree certification failure class as XXXVII–XLII** — not a different marketplace, auth, or Counter Offer runtime bug.

---

## Exact call chain (live HTTP 500)

```
Request (/login | /search | /help | …)
  → Next.js Node serverless handler loads instrumentation.register()
    → runStartupCertificationGate("BLOOD XLIII …", …)
      → assertCounterOfferCertificationOrBlock()
        → certifyCounterOfferXliii()
          → requireSource(...) / readWorkspace(...)
            → existsSync(workspacePath("<source .ts/.tsx>"))
            → FAIL (file absent under /var/task)
          → report.ok = false
        → throw Error("[BLOOD XLIII] Counter Offer Certification FAILED — BLOCK LOADING. …")
  → "An error occurred while loading instrumentation hook"
  → HTTP 500
```

**First throwing file (current production):**  
`lib/supreme-blood-law-xliii-counter-offer-certification-v1.ts`  
→ `assertCounterOfferCertificationOrBlock()` (≈ line 494)

**Observed live error excerpt:**

```text
[BLOOD XLIII] Counter Offer Certification FAILED — BLOCK LOADING.
Counter Offer Engine file missing (lib/offers/counter-offer-engine-v1.ts);
ConversationHub file missing (features/inbox/components/ConversationHub.tsx);
Inbox Event Engine file missing (lib/inbox/inbox-event-engine-v1.ts);
InboxPage file missing (features/inbox/components/InboxPage.tsx);
Notification Provider file missing (…RealtimeNotificationProvider.tsx)
```

**Proof XLII is no longer the thrower:** live logs already show  
`[XLII] Source verification skipped in production runtime.`  
then XLIII throws.

---

## Why those paths do not exist in Vercel Serverless

| Layer | What happens |
|-------|----------------|
| Next.js NFT | Traces **runtime import graph** into `/var/task`. Only modules actually required to execute the function are included. |
| ROVEXO `build:production` | Runs `scripts/next-build-and-prune.mjs` → `scripts/prune-serverless-traces.mjs` after `next build`, further shrinking serverless traces before Vercel packages output. |
| Blood Law “certify by reading source” | Uses `existsSync` / `readFileSync` on **repo-relative source paths** (`features/…/*.tsx`, `lib/…/*.ts`, `app/…/route.ts`, `instrumentation.ts`, migrations, etc.). Those paths are **not** runtime dependencies of the bundled chunks — they are CI/source-integrity checks. |
| Result on Vercel | `/var/task/features/inbox/components/ConversationHub.tsx` (etc.) → **ENOENT / missing** → gate FAIL → throw → HTTP 500. |

**Why local passes:**  
`npm run typecheck` / Vitest / local `next build` / `next start` still have the monorepo checkout (or fuller filesystem). Source files exist at `workspacePath(...)`. Production NFT `/var/task` does not.

This is **not** evidence that Counter Offer / Inbox code is missing from the app bundle as JS — only that **source files are missing as disk paths** for certification scanners.

---

## Same class vs different failure?

| Question | Answer |
|----------|--------|
| Same as XXXVII–XLII brand/source soft-fail? | **YES** — filesystem source-tree certification at instrumentation boot |
| Different Counter Offer business logic bug? | **NO** — failure is “file missing” before any offer state machine runs |
| Different auth / Stripe / RLS / UI bug? | **NO** |
| Would patching only XLIII end the story? | **NO** — XLIV and XLV still do the same pattern and run **after** XLIII in `instrumentation.ts` |

---

## Soft-fail status today (patched vs still fatal)

| Law | Wired in `instrumentation.ts` | Disk / source scan? | Serverless soft-fail today? | Boot effect on Vercel |
|-----|-------------------------------|---------------------|-----------------------------|------------------------|
| Catalog XXXII / XXXIII | Yes | In-memory tree / constants (not this NFT class) | N/A | Generally not this pattern |
| XXXIV Global Freeze | Yes | Constants / contracts | N/A | Not source NFT class |
| XXXV Category Visual | Yes | `existsSync` on **`public/`** assets | No soft-fail | Different artifact class (CDN/`public`); may or may not be in `/var/task` |
| XXXVI Category Visual Library | Yes | Mostly constants / branding contracts | N/A | Not primary NFT source throw |
| **XXXVII Brand Emblem** | Yes | `.tsx` + `public/` icons | **YES** (`shouldSoftFailBrandIntegrityAtRuntime`) | Warn + continue |
| **XXXVIII Brand Application** | Yes | `.tsx` + `public/` | **YES** | Warn + continue |
| **XXXIX Auth Brand Freeze** | Yes | `.tsx` / `.css` + assets | **YES** | Warn + continue |
| **XL Register Polish** | Yes | `.tsx` / `.css` + assets | **YES** | Warn + continue |
| **XLI Auth Experience** | Yes | `.tsx` / `.css` | **YES** | Warn + continue |
| **XLII Full Platform Runtime** | Yes | Massive sourceEvidence / routeEvidence scans | **YES** (skip on serverless) | Warn + continue |
| **XLIII Counter Offer** | Yes | `requireSource` on `.ts` / `.tsx` / migration | **NO** | **THROW → HTTP 500 (CURRENT)** |
| **XLIV Full Demo Env** | Yes | `readFileSync` engine / migration / `repository.ts` / `instrumentation.ts` | **NO** (only e2e gated) | **Would throw next** after XLIII |
| **XLV Final Live Cert** | Yes | `readFileSync` lib sources + `readdirSync`/`statSync` walk of `app/` | **NO** (only scripts gated) | **Would throw next** after XLIV |
| Suggest SSOT Runtime Catalog Index | Yes | Runtime index (separate) | N/A | Not this investigation’s throw |

---

## Every source-tree dependency (XLIII — first thrower)

From `CERTIFICATION_TARGETS` + `requireSource` in  
`lib/supreme-blood-law-xliii-counter-offer-certification-v1.ts`:

| Relative path | Type |
|---------------|------|
| `lib/offers/counter-offer-engine-v1.ts` | source `.ts` |
| `app/api/offers/[id]/route.ts` | source route |
| `features/inbox/components/ConversationHub.tsx` | source `.tsx` |
| `app/api/offers/route.ts` | source route |
| `instrumentation.ts` | source |
| `lib/inbox/inbox-event-engine-v1.ts` | source `.ts` |
| `app/api/messages/[id]/route.ts` | source route |
| `features/inbox/components/InboxPage.tsx` | source `.tsx` |
| `features/notifications/components/RealtimeNotificationProvider.tsx` | source `.tsx` |
| `supabase/migrations/20260725160000_inbox_event_engine_sync_open_xliii.sql` | migration SQL on disk |

These are **CI/source integrity** checks, not production request handlers.

---

## Affected Blood Laws (exact NFT / source-scan pattern)

### Confirmed same pattern (instrumentation boot + disk source reads + throw)

1. **XXXVII** — `RovexoBrandLogo.tsx` (+ assets) — **patched** soft-fail  
2. **XXXVIII** — brand/header `.tsx` (+ assets) — **patched** soft-fail  
3. **XXXIX** — Login/Register/Header `.tsx` + `auth-v1.css` / `header-v2.css` — **patched** soft-fail  
4. **XL** — Register `.tsx` + `auth-v1.css` — **patched** soft-fail  
5. **XLI** — Login/Register/Brand/Header `.tsx` + CSS — **patched** soft-fail  
6. **XLII** — Full Platform module `sourceEvidence` / `routeEvidence` tree — **patched** skip on serverless  
7. **XLIII** — Counter Offer + Inbox Event Engine source targets — **UNPATCHED · CURRENT FAIL**  
8. **XLIV** — `lib/full-demo/demo-session-engine-v1.ts`, migration SQL, `lib/products/repository.ts`, `instrumentation.ts` — **UNPATCHED · NEXT FAIL**  
9. **XLV** — `lib/full-demo/*.ts`, `instrumentation.ts`, **`discoverAppRoutes` walks `app/**/page.tsx`** — **UNPATCHED · NEXT FAIL**

### Related but different artifact class

- **XXXV** — `existsSync` on `public/categories/*` and `public/search/categories/*` (static assets, not `.tsx` source integrity). Not the current throw; still a disk assumption at boot.

### Not this pattern

- **XXXII / XXXIII Catalog**, **XXXIV Global Freeze** — contract/tree/constants oriented (not the XLIII error).

---

## fs / scan inventory (startup path)

| Location | APIs | Purpose |
|----------|------|---------|
| `instrumentation.ts` | (imports assert* only) | Ordered Blood Law boot chain XXXII→XLV + catalog index |
| `lib/startup/startup-certification-policy-v1.ts` | catch + soft ENOENT for source paths | Gate wrapper; still rethrows non-soft production failures |
| `lib/startup/brand-integrity-runtime-v1.ts` | `existsSync` / `readFileSync` helpers | Soft-fail policy for Vercel (`VERCEL=1`) |
| XXXVII–XLI | `existsSync` / `readFileSync` / `readUtf8SourceOrEmpty` | Brand/auth source + asset integrity |
| XLII | `existsSync` / `readFileSync` via `readRelative` / `firstExisting` | Full-platform sourceEvidence matrix (skipped on Vercel) |
| **XLIII** | `existsSync` + `readFileSync` via `requireSource` | Counter Offer + Inbox Event Engine **source** certification |
| **XLIV** | bare `readFileSync` (throws ENOENT if missing) | Demo session engine / migration / products repo / instrumentation |
| **XLV** | `readFileSync` + `readdirSync` / `statSync` (`discoverAppRoutes`) | Final live cert contract + app route discovery |
| XXXV | `existsSync` on `public/` | Category visual assets |

No `glob()` usage found in these Blood Law startup assertors; discovery uses `readdirSync`/`statSync` (XLV).

---

## Recommendation (architectural — do NOT patch XLIII alone)

**Do not** ship another one-off soft-fail only for XLIII (then XLIV, then XLV).

### Recommended single architectural fix

1. **One startup policy helper** (extend `brand-integrity-runtime-v1` / rename to e.g. `source-integrity-runtime-v1`):  
   `shouldSkipSourceTreeVerificationAtRuntime()` when `VERCEL=1` (or production without monorepo source probe).

2. **Apply once to all remaining instrumentation Blood Laws that certify by reading source files:**  
   **XLIII · XLIV · XLV** (and any future law that `requireSource` / `readFileSync` repo paths).

3. **Behaviour (match Owner XLII contract):**  
   - If source tree unavailable: **log warn · continue · never throw · never HTTP 500**  
   - Keep **fail-closed** on localhost / Vitest / `ROVEXO_CERTIFICATION_MODE` when the checkout exists  
   - Keep **release gates** (`assert*ProductionReleaseOrBlock`) fail-closed for Owner/CI with full tree + E2E evidence

4. Optionally: move “source token” certification **out of request boot** into `npm run certify:*` / predeploy only — instrumentation should only verify **runtime-safe** invariants (constants, env, imported modules — never raw `.tsx` paths).

### Explicitly out of scope for that fix

Marketplace logic · Auth UX · Payments · Checkout · RLS · Stripe · UI/CSS redesign.

---

## Investigation constraints honored

- No application code edited for this report  
- No commit · No push · No deploy  
- No XLIII patch in this mission  

**Next Owner gate:** authorize the **single architectural serverless source-integrity skip** for XLIII+XLIV+XLV (same class), then validate → commit → deploy → live smoke.
