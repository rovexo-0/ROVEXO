# Module 1 — Stabilization Report

**Date:** 2026-07-06  
**Scope:** Eliminate two production runtime errors before Module 2  
**Status:** Runtime issues resolved on fresh production build

---

## 1. Dicebear SVG

### Root cause
Demo and legacy profile records store Dicebear URLs as **SVG** (`…/shapes/svg?seed=…`). `next/image` rejects SVG from remote hosts unless `dangerouslyAllowSVG` is enabled. Several code paths passed raw `avatar_url` to `<Image>` without normalization; the production log showed `buyer01` triggering this on authenticated navigation.

`Avatar.tsx` already called `normalizeAvatarUrl`, but **bypass paths** (footer nav, profile cards, API mappers) still forwarded SVG URLs.

### Fix
- Hardened `normalizeAvatarUrl()` to rewrite any Dicebear `/svg` path segment to `/png`
- Normalized at **data boundaries**: profile repository, profile service, listings, messages, auctions
- Fixed **direct `<Image>` bypasses**: footer account avatar, account profile card, seller/buyer hero cards
- Existing `Avatar` component continues to normalize on render (defence in depth)

### Files modified
| File | Change |
|------|--------|
| `lib/media/normalize-avatar-url.ts` | Broader Dicebear SVG → PNG rewrite |
| `lib/profile/repository.ts` | Normalize `avatarUrl` on map |
| `lib/profile/service.ts` | Normalize `avatarUrl` in API details |
| `lib/listings/repository.ts` | Normalize `sellerAvatar` |
| `lib/messages/store.ts` | Normalize conversation participant avatars |
| `lib/auctions/queries.ts` | Normalize `sellerAvatar` |
| `components/home/RovexoFooterNavigation.tsx` | Normalize before footer `<Image>` |
| `components/account/ProfileCard.tsx` | Normalize profile `<Image>` |
| `components/buyer/BuyerProfileCard.tsx` | Use `Avatar` component |
| `components/seller/SellerHeroCard.tsx` | Use `Avatar` component |
| `tests/stabilization-runtime.test.ts` | Unit tests |

---

## 2. SSR / Client boundary (`resolveDashboardIconType`)

### Root cause
`resolveDashboardIconType()` lived in `DashboardIcon3D.tsx` marked `"use client"`. Server-safe modules (`lib/icons/module-icon.ts`, `HubSectionIcon.tsx` logic chain) imported it from that client boundary. When `/categories` rendered mobile hub tiles during SSR, Next.js threw:

> Attempted to call resolveDashboardIconType() from the server but resolveDashboardIconType is on the client.

### Fix
- Extracted pure function + types to **`lib/icons/resolve-dashboard-icon-type.ts`** (no `"use client"`)
- `DashboardIcon3D.tsx` now only renders Fluency3D icons; re-exports type resolver for client consumers
- Updated `module-icon.ts`, `HubSectionIcon.tsx`, `link-icons.tsx` to import from server-safe module

### Files modified
| File | Change |
|------|--------|
| `lib/icons/resolve-dashboard-icon-type.ts` | **New** — pure href → icon resolver |
| `components/icons/DashboardIcon3D.tsx` | Client render only; re-export resolver |
| `lib/icons/module-icon.ts` | Import from server-safe module |
| `components/icons/HubSectionIcon.tsx` | Import from server-safe module |
| `lib/navigation/link-icons.tsx` | `"use client"` + server-safe import |
| `tests/stabilization-runtime.test.ts` | SSR-safe import test |

---

## Validation results

| Gate | Result |
|------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass (0 errors; 1 pre-existing warning in checkout hook) |
| `pnpm build` | Pass |
| Vitest `stabilization-runtime.test.ts` | 4 / 4 pass |
| Route smoke (`/`, `/categories`, `/search`, `/help`, `/messages`, `/account`) | All HTTP 200 |
| Playwright Chromium (marketplace + navigation) | **21 / 21 pass** |
| Production server log (post-smoke) | **No Dicebear errors, no SSR exceptions** |

---

## Remaining issues (not introduced; outside this pass)

| Issue | Notes |
|-------|-------|
| Business dashboard server crash | Pre-existing; unrelated to these two fixes |
| Checkout Shippo quotes unavailable locally | Env/integration; not avatar/SSR |
| Help/Trust mobile hub icon debt | Fluency3D placeholders; separate cleanup |
| Physical Android My Account certification | Device QA still pending |
| Full Playwright matrix (Firefox/WebKit) | Not re-run in stabilization pass |

---

## Production readiness (post-stabilization)

**Runtime blockers from server log: RESOLVED**  
**Module 2 authorization:** Pending your review of this report. No commit, push, or deploy performed.
