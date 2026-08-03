# OA-B2 Root Cause — Login Performance

**Date:** 2026-08-03

## Measured baseline (RC4 / Owner Acceptance)

| Metric | Value | Target |
|--------|-------|--------|
| Performance (mobile) | **83** | ≥95 |
| LCP | **~4508 ms** | &lt;2500 ms |
| CLS | **0** | &lt;0.1 |

LCP element: Primary Emblem `<img>` (AVIF ~22 KB) — already `fetchpriority=high`, preload, `unoptimized`.

## Exact bottleneck (evidence)

1. **Render-blocking global CSS** — Lighthouse unused-css ~**103 KiB** on  
   `/_next/static/chunks/*` design-system bundle (source: `styles/rovexo/index.css` ~930 KB raw).  
2. **Unused JS** ~**77 KiB** (root providers / shared chunks).  
3. Emblem network is **not** the LCP problem (resource load ~17 ms observed).

## Attempted isolation (RC5) — FAILED to remove CSS from login

Implemented `PlatformDesignSystemCss` + `auth-entry.css` + dynamic import of full `index.css` for non-auth.

**Evidence after rebuild:** `/login` HTML still linked **`2mb0vdux0xjt1.css` = 794 886 bytes** (+ other chunks; **CSS_TOTAL ≈ 1.1 MB**).  
Next.js App Router collects CSS from the layout module graph **including** statically analyzable `import()` targets — runtime `headers()` branch does **not** exclude the platform CSS chunk from auth documents.

Attempt **reverted** (restored static `import "@/styles/rovexo/index.css"` in `app/(platform)/layout.tsx`) to avoid dual-load regression.

Auth-provider skip (prior OA) also yielded **Perf 83** with no gain.

## Kept isolated safe opts

- Geist Mono `preload: false` + `display: "swap"`  
- Emblem AVIF + login preload (from RC4)  
- Checkout OA-B1 fix unrelated

## What would actually hit ≥95

Authorize **true** route-group CSS split: root layout without design-system CSS; `app/(auth)/layout.tsx` → auth-entry only; `app/(shop)/layout.tsx` → full `index.css` — requires moving non-auth routes under `(shop)` (architecture change under Global Production Freeze → **Owner authorization required**).

## Classification

Until Owner authorizes route-group CSS architecture **or** accepts residual risk: **Production Blocker OA-B2**.
