# ROVEXO PHASE R1.1 — FUNCTIONAL STABILITY HOTFIX  
## Runtime Report

**Mission:** Repair ONLY verified Owner mobile runtime faults.  
**Frozen:** UI · UX · CSS · performance roadmap · bundle · ISR · Edge · cache · image optimizer redesign.  
**Gate:** STOP — **NO commit · NO push · NO deploy.** Wait for Owner PASS.

**Date:** 2026-08-04  
**Baseline:** Functional Parity Lock v1.0 · production release `9ed6f9b3` restored prior to R1.1 patches.

---

## Owner evidence → disposition

| Evidence | Phase | Verdict | Repair |
|----------|-------|---------|--------|
| ChunkLoadError / Failed to load chunk | 1 | Root cause = stale chunks + LAN/WSL origin gaps | `ChunkLoadRecovery` + expanded `allowedDevOrigins` |
| Hydration mismatch | 2 | `<html>` locale script + cookie snapshot lie | `suppressHydrationWarning` + consent snapshot `null` |
| Account ~4.4s | 3 | Profile→wallet waterfall | Parallel wallet with profile |
| Browse ~2.7s | 4 | 10× probe+full category counts | Single-pass `countEligibleListings` |
| Repeated `GET /api/inbox/badge` | 5 | Per-page `BetaAppShell` remount | 2.5s badge TTL cache |
| Image HTTP 400 | 6 | Derived `-thumb.` Storage refs missing | Collapse invalid thumb refs + `imageFullUrl` on listing map |
| Delete Listing fails | 7 | `bundle_items` / `checkout_sessions` RESTRICT | Detach safe FKs + soft-delete fallback |
| Mobile nav / Home lag | 5+1 | Badge storm + chunk miss | Same as Phase 1 + 5 |
| Runtime console errors | 1+2+6 | Chunk / hydration / image 400 | Same repairs |

---

## Files changed (application)

- `components/runtime/ChunkLoadRecovery.tsx` *(new)*
- `app/layout.tsx`
- `next.config.ts` (`allowedDevOrigins` only)
- `components/legal/CookieConsentBanner.tsx`
- `features/notifications/components/RealtimeNotificationProvider.tsx`
- `app/(platform)/account/page.tsx`
- `lib/listings/eligible-listings.ts`
- `lib/listings/repository.ts`
- `lib/products/repository.ts`
- `app/api/listings/[id]/route.ts`

## Deliverable docs

- `ROVEXO_PHASE_R1_RUNTIME_REPORT.md` *(this file)*
- `ROVEXO_CHUNKLOAD_ROOTCAUSE.md`
- `ROVEXO_HYDRATION_ROOTCAUSE.md`
- `ROVEXO_DELETE_LISTING_ROOTCAUSE.md`
- `ROVEXO_REQUEST_TRACE.md`
- `ROVEXO_IMAGE_400_ROOTCAUSE.md`

---

## Validation (agent)

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint (touched files) | **PASS** (0 errors) |
| Production Build (`next build`) | **PASS** |
| Vitest focused (`homepage-image-loading-thumb-fallback` · `category-counter-ssot-v1`) | **PASS** 19/19 |
| Playwright | Owner mobile/desktop smoke preferred for R1.1 |
| Owner Mobile Smoke | **WAITING** |
| Desktop Smoke | **WAITING** |

---

## Strict prohibitions respected

No Homepage redesign · no Inbox feature changes · no Wallet/Orders/Checkout logic · no schema migrations · no CSS · no ISR/Edge/bundle/Lighthouse work · no provider lift to root layout (TTL only).

---

## OWNER GATE

**STOP.**

Verify on:

1. **iPhone Safari** (LAN or official URL as Owner prefers for this hotfix)  
2. **Chrome Android**  
3. **Desktop**

Checklist:

- [ ] No ChunkLoadError loop  
- [ ] No hydration mismatch warning  
- [ ] Account / Browse feel responsive vs prior Owner timings  
- [ ] Inbox badge not spamming on every tab switch  
- [ ] Image 400 storm reduced / gone for derived thumbs  
- [ ] Delete Listing succeeds  

Only after explicit **Owner PASS** may Functional Stability remain certified.
