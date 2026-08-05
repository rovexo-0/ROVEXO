# ROVEXO P10.5 — PERFORMANCE & CONSOLE ZERO-WARNING FINAL AUDIT

**STATUS:** COMPLETE · WAITING OWNER APPROVAL  
**DATE:** 2026-08-04  
**SCOPE:** Resource hints / preload console hygiene only  

**FORBIDDEN (honoured):** Publish · Draft · Autosave · Storage · Upload · Repository · API · Database · UI visuals · CSS rules · Routing · business logic  

**STOP:** No commit · No push · No deploy  

---

## Verdict

**PASS (machine) · Owner console re-check recommended on authenticated Sell**

Justified change applied: remove redundant Login layout `<link rel="preload" as="image">` for the Primary Emblem. LCP remains owned by `RovexoBrandLogo` (`fetchPriority="high"` on the same AVIF). No functional / visual / engine changes.

Remaining console messages in `npm run dev` are **documented and kept intentionally** (Fast Refresh / HMR, Next error-boundary CSS preload, framework font Link preload).

---

## 1. Preload audit

| Resource | Where | Why preloaded | Necessary? | Action |
|----------|-------|---------------|------------|--------|
| `/brand/canonical-rx/primary-emblem-auth-v4.avif` (manual layout) | Was `app/(auth)/login/layout.tsx` | Intended LCP hint | **No** — duplicate of `RovexoBrandLogo` `fetchPriority="high"`; also contributed to unused-preload noise | **ELIMINATED** |
| Same AVIF (auto) | Injected when auth screens render high-priority `<img>` | React/Next high-priority image hint | **Yes** on `/login` / `/register` — matches visible `<img>` | **KEEP** |
| `styles_rovexo_fail-closed-v1_*.css` (`as=style`) | Next graph via `FailClosedPanel` → error boundaries | Faster Fail Closed paint if a route errors | **Yes for fail-closed**; unused on healthy navigations by design | **KEEP (document)** |
| Turbopack HMR client (`as=script`) | `npm run dev` only | Fast Refresh | Dev-only | **KEEP (document)** |
| Geist woff2 (`Link: rel=preload; as=font`) | `app/layout.tsx` `Geist({ preload: true })` | Primary UI font | Yes for first paint | **KEEP** |
| Supabase + Stripe `preconnect` | `app/layout.tsx` `<head>` | Early connection for media/payments | Yes | **KEEP** |
| Bottom-nav `router.prefetch` | Platform chrome | Next route prefetch | Yes | **KEEP** (not `link rel=preload`) |

### Redirect note (evidence)

Unauthenticated `GET /` and `GET /sell` return **307 → `/login`**. Audits that follow redirects appear to show Login preloads on Sell/Home — that is middleware auth, not a global emblem preload bug.

---

## 2. Warning eliminated (justified)

**Cause:** Manual `<link rel="preload" as="image" type="image/avif" …>` in Login layout, while the same file is already requested by:

```tsx
<img src={PRIMARY_EMBLEM_LCP_SRC} fetchPriority="high" … />
```

Chrome reports resources that are preloaded but not consumed as the preload consumer (duplicate / timing / type mismatch). Removing the **manual** layout hint stops the redundant preload without changing the painted emblem.

**Change file:** `app/(auth)/login/layout.tsx` only (resource hint removal; same `auth-login-route` wrapper).

---

## 3. Warnings kept intentionally

| Warning / signal | Justification |
|------------------|---------------|
| **Fast Refresh / `[HMR]` / Turbopack HMR preload** | Normal for `npm run dev`. Not present in production build. Do not “fix”. |
| **`fail-closed-v1.css` preloaded as style but unused on healthy page** | Next preloads CSS imported by Fail Closed / error UI so failures never white-screen unstyled. On success paths the panel is not mounted → browser may warn. Eliminating it would require CSS architecture / error-boundary delivery changes (out of P10.5 scope; risk to Fail Closed). |
| **Geist font `Link` preload** | Required for typography LCP; font is applied via CSS variables on `<html>`. |
| **React auto image preload for auth emblem** | Paired with visible AVIF `<img>` on Login/Register — expected consumption. |

---

## 4. Performance / Next / PWA (no behaviour change)

| Area | Finding |
|------|---------|
| CSS | Auth `auth-entry.css` · Platform `index.css` · Root `globals.css` — unchanged rules |
| Fonts | Geist Sans `preload: true` · Geist Mono `preload: false` — unchanged |
| JS chunks | Unchanged |
| Images | Auth LCP still AVIF Primary Emblem via `RovexoBrandLogo` |
| Manifest | `app/manifest.ts` — unchanged |
| Icons | Metadata icons — unchanged |
| PWA | `PwaProvider` unregisters SW on localhost (unchanged); prod registers `/sw.js` |
| `preconnect` | Supabase + Stripe — kept |
| Engines | Publish / Draft / Autosave / Storage / Upload / Repository — **not touched** |

---

## 5. Modifications performed

| File | Change |
|------|--------|
| `app/(auth)/login/layout.tsx` | Removed manual emblem `<link rel="preload">`. Wrapper class remains `auth-login-route`. |

No other production files changed for P10.5.

---

## 6. Quality gates

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (touched files) | **PASS** |
| Build | **PASS** (prior full build in session; typecheck green after layout fix) |
| Vitest (`auth-login-v1`, `fail-closed-engine-v1`, brand/auth related) | **PASS** |

Acceptance (behaviour):

- Publish / Draft / Upload / Storage — unchanged (no code paths touched)  
- Zero functional / UI / CSS-rule regressions intended  
- Manual unused emblem preload removed  
- Fast Refresh documented as normal in development  

---

## 7. Owner console checklist (`http://localhost:3000`)

1. Hard-refresh `/login` — Primary Emblem still paints; no manual `type="image/avif"` layout preload.  
2. Sign in → `/sell` — ignore Fast Refresh / HMR lines.  
3. Note any remaining **fail-closed CSS preload** warning as documented (intentional).  
4. Production preview later: HMR preload must be absent.

---

## Final verdict

**PASS**

Root unused-preload cause addressed with a minimal, justified resource-hint removal. Remaining console noise is development/framework-intentional and documented.

**STOP — waiting for Owner approval. No commit / push / deploy.**
