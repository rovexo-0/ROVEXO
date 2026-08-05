# ROVEXO PHASE 9 — IMAGE PERFORMANCE OMEGA
## Image Engine Certification Report

**Status:** COMPLETE — AWAITING OWNER APPROVAL  
**Host:** `http://localhost:3000` only  
**Release policy:** No commit · No push · No deploy  
**Scope:** Image delivery pipeline only (no marketplace / UI redesign / auth / Wallet / Orders / Checkout / Messages / API changes)

---

## Verdict

Phase 9 delivery optimizations are implemented and quality-gated (TypeScript · ESLint · Production Build · Playwright smoke).  
Largest measured win: empty-state Teddy **783 KB PNG → ~10–25 KB AVIF**.  
Search category WebP sources reduced **~116–170 KB → ~23–85 KB**.  
Next Image optimizer already prefers **AVIF → WebP**.  

**Lighthouse Mobile:** blocked in this environment (`Unable to connect to Chrome`) — EXTERNAL BLOCKER for numeric LH scores. Estimates below are engineering estimates from transfer audits, not Owner Lighthouse PASS.

Guest auth redirects `/` → `/login`, so authenticated Homepage / Listing gallery transfer samples require Owner demo session for full live certification.

---

## 1. Pipeline inventory

| Class | Source | Runtime delivery |
|---|---|---|
| Original uploads | Supabase `products` bucket | JPEG originals + `{name}-thumb.jpg` |
| Listing thumbnails | `thumbnail_url` / derived `-thumb` | `SafeImage` → `/_next/image` AVIF/WebP |
| Gallery | Product image URLs | Progressive: active±1 full @ q90; far slides + strip use thumbs |
| Hero banners | `public/hero/*` (masters ≤22 MB) | Campaign WebP via `heroCampaignImage` when banners live; masters excluded from serverless trace |
| Category icons | `public/icons/categories/*.svg` | SVG (~0.5–0.8 KB) |
| Search category heroes | `public/search/categories/*.webp` (+ PNG masters) | `SafeImage` + compressed WebP sources |
| Avatars | Supabase / Dicebear | `Avatar` / `SafeImage` |
| Brand / logos | `public/brand/canonical-rx/*` | App icon PNG ~18 KB; auth Primary Emblem AVIF ~21 KB |
| Favicons | `public/favicon.ico` + `/icons/favicon-*.png` | ~6.8 KB ico |
| Empty state | `public/assets/teddy/*` | **AVIF delivery** (PNG master retained) |

**Disk footprint (not all runtime):** `hero` ~201 MB · `icons` ~125 MB · `categories` ~88 MB · `assets` ~36 MB · `brand` ~22 MB · `search` ~20 MB.  
Most oversized files are **source/master libraries**, not first-paint paths.

SSOT render path: **`components/ui/SafeImage.tsx`** (only `next/image` entry).

---

## 2. Oversized assets — ranked by impact

| Rank | Asset | Before | After / note | Impact |
|---|---|---|---|---|
| 1 | `teddy-shrug.png` (empty category/search) | **783 KB** transferred raw | AVIF master **~24 KB**; `/_next/image` **~10.5 KB** | **Critical** — was LCP on empty category |
| 2 | Search heroes (`jewellery.webp` etc.) | 106–170 KB source | 23–85 KB source; `/_next/image` jewellery **~19.8 KB** AVIF | High — Search landing grid |
| 3 | Card thumbs with `unoptimized` | Full JPEG path possible | Always optimize via Next | High — Homepage/feed |
| 4 | Gallery strip using full-res | Full originals × N | Derived `-thumb` @ 56px / q75 | High — PDP |
| 5 | `deviceSizes` incl. 2048/3840 | Phone could pick huge widths | Cap at **1920**; add **400** thumb width | Medium |
| 6 | Hero/category PNG masters on disk | Multi‑MB | Not removed (library); not first-paint when WebP/AVIF used | Low runtime / high repo size |
| 7 | Wallet/empty-state PNG masters | ~1.9 MB each | Out of Phase 9 product paths; recommend later compress if wired raw | Backlog |

---

## 3–11. Checklist results

| # | Rule | Result |
|---|---|---|
| 3 | Responsive sizes | PASS — cards `(max-width: 640px) 46vw…`; gallery mobile-first; search cats `33vw`; teddy `70vw` |
| 4 | Modern formats | PASS — `formats: ["image/avif","image/webp"]` |
| 5 | Lazy loading | PASS — non-priority cards/gallery/search lazy; first gallery slide priority |
| 6 | Preload | PASS — Login Primary Emblem only (critical LCP); no marketplace preload spam |
| 7 | Decoding | PASS — `SafeImage` default `decoding="async"` (sync when `priority`) |
| 8 | Priority | PASS — first 2 feed cards + gallery[0]; else normal/lazy |
| 9 | Thumbnails | PASS — cards prefer `thumbnail_url`; gallery strip/`deriveListingThumbnailUrl` |
| 10 | Gallery progressive | PASS — near-active full; far = thumb; lightbox mounts only when open |
| 11 | Caching | PASS — brand/search/categories/assets/favicon → `public, max-age=31536000, immutable`; `/_next/image` → long TTL (`minimumCacheTTL: 2592000`) |

---

## 12. Page measurements (iPhone 14 Pro Max emulation)

Evidence: `test-results/phase9/page-image-metrics.json`  
Note: Guest → Login for protected routes; Search SSR may hydrate client-side images after measure window.

| Page | HTTP | Image count | Transferred | Largest | Notes |
|---|---|---|---|---|---|
| Homepage `/` | 200 | 1 | 20.3 KB | Auth emblem | Redirects to Login |
| Search | 200 | 0* | 0* | — | Client hydrate / empty feed; heroes validated via `/_next/image` probe |
| Categories | 200 | 10 | 6.1 KB | 0.8 KB SVG | PASS |
| Category (empty) | 200 | 0* | was **783 KB** | Teddy | Fixed to AVIF; dynamic Teddy may load after networkidle |
| Listing | — | — | — | — | No guest listing slug (auth / empty DB) |
| Store | — | — | — | — | Not found on guest homepage |
| Legal / Help | 200 | 0 | 0 | — | PASS |
| Sell / Profile / Wallet / Orders / Messages / Checkout | 200 | 1 | 20.3 KB | Auth emblem | Auth gate |
| Login | 200 | 1 | **20.3 KB** | Primary Emblem AVIF | LCP |

**Optimizer probes (localhost):**  
- `/_next/image?url=/search/categories/jewellery.webp&w=384&q=75` → **AVIF 19.8 KB**, `Cache-Control: public, max-age=31536000, must-revalidate`  
- `/_next/image?url=/assets/teddy/teddy-shrug.avif&w=384&q=75` → **AVIF 10.5 KB**

---

## 13. Performance budget

| Budget | Target | Observed | Gate |
|---|---|---|---|
| Homepage first-viewport images | ≤150 KB | Guest Login LCP **20.3 KB** | PASS (auth shell) |
| Listing thumbnail | ≤100 KB | Pipeline enforces thumb + AVIF (live listing sample pending auth) | CONDITIONAL |
| Hero | ≤150 KB | Search hero optimized ~20 KB; sources ≤85 KB | PASS |
| Logo | ≤20 KB | Auth emblem **20.3 KB** | **WARN** (+0.3 KB) |
| Favicon | ≤10 KB | **6.8 KB** + immutable | PASS |
| Zero oversized runtime | — | Teddy raw PNG no longer delivery path | PASS (masters remain on disk) |

---

## Changes applied (delivery only)

1. `lib/media/listing-thumbnail-url.ts` — derive `-thumb` URLs  
2. `SafeImage` — default async decode  
3. `use-card-image-src` — always optimize (`unoptimized: false`)  
4. `next.config.ts` — mobile-first `deviceSizes` / `imageSizes`  
5. `ProductGalleryV1` — progressive gallery + thumb strip  
6. `ListingCard` — `quality={75}`  
7. `SearchCategoryBrowseCard` — explicit `loading="lazy"`  
8. Teddy empty state → AVIF + `SafeImage`  
9. Recompressed Search category WebPs  
10. Immutable cache for `/assets/*`, favicon, apple-touch  
11. Unit test: `tests/listing-thumbnail-url.test.ts`

**Explicitly untouched:** Auth architecture · Wallet · Orders · Checkout · Messages · Sell business logic · APIs · upload pipeline · marketplace UX redesign.

---

## Quality gates

| Gate | Result |
|---|---|
| TypeScript | PASS |
| ESLint | PASS (0 errors; pre-existing warnings elsewhere) |
| Production Build | PASS |
| Playwright smoke (`categories` · `search` · `health`) | **3/3 PASS** |
| Image unit tests | PASS |
| Lighthouse Mobile | **EXTERNAL BLOCKER** — Chrome DevTools connection failed in WSL sandbox |
| Image / Perf audit | Completed via Playwright transfer + `/_next/image` probes |

---

## Current vs Optimized — savings

| Item | Before | After | Savings |
|---|---|---|---|
| Empty Teddy | 783 KB | ~10–25 KB | **~97%** |
| Search jewellery source | 170 KB | 67 KB (source) / ~20 KB optimized | **~60–88%** |
| 8 other search WebPs | 101–156 KB | 23–46 KB | **~60–80%** |
| Gallery far slides | Full JPEG × N | Thumb × N | Large on multi-image PDP |
| Card thumbs | Sometimes unoptimized | Always AVIF/WebP | Mobile bandwidth |

**Estimated (engineering, not LH PASS):**  
- Lighthouse Mobile Performance: **+5 to +15** on empty/search-heavy routes when Teddy/heroes dominated LCP  
- LCP: empty category **~0.5–1.5 s** faster on mid-tier mobile (783 KB → ~11 KB)  
- Bandwidth: **~0.7–1.5 MB** saved per empty category visit; Search landing heroes **~0.5–1 MB** if all 10 loaded raw before  
- CPU / memory: less decode work on mobile GPUs (smaller bitmaps + async decode)

---

## Remaining bottlenecks (Owner backlog)

1. **Authenticated** Homepage / Listing / Store transfer samples + Owner Lighthouse on device  
2. Logo AVIF **20.3 KB** vs ≤20 KB budget — optional recompress primary emblem (appearance freeze → Owner approval)  
3. Disk masters (`public/hero/*-3840.png`, icon sources) inflate deploy/trace — already partly excluded; consider archive outside `public/`  
4. Other empty-state PNG masters (~1.9 MB) if any path still requests PNG without optimizer  
5. Lighthouse Chrome connectivity in this agent environment  

---

## Release decision

```
NO COMMIT · NO PUSH · NO DEPLOY
Await Owner approval of this report.
```

Owner preview URL (when authorized later): `https://www.rovexo.co.uk`  
Agent evidence host: `http://localhost:3000`

---

*Generated: 2026-08-04 · Phase 9 Image Engine Certification · ROVEXO Mobile Image Performance Omega*
