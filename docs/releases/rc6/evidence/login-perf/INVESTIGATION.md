# RC6 Login Performance Investigation

## Baseline (RC5 FINAL — before route CSS split)

| Metric | Mobile | Target |
|--------|--------|--------|
| Performance | 83 | ≥95 |
| LCP | ~4386–4508 ms | <2500 ms |
| CLS | 0 | <0.1 |
| Unused CSS | ~103 KiB | — |

LCP element: Primary Emblem AVIF (already optimized in prior RC).

## Exact bottlenecks (evidence)

1. **Render-blocking global CSS** — root `app/layout.tsx` previously imported `styles/rovexo/index.css`, so `/login` downloaded marketplace/admin CSS (~795 KiB chunk on platform routes).
2. **Unused CSS ~103 KiB** (BEFORE-mobile unused-css-rules).
3. **Unused JS ~66–77 KiB** — shared client chunks (`38o-jlfrz7gew.js`, `3m-x0-nwv87vj.js`).
4. **Mobile throttle TTI ≈ LCP** — LCP still ~3.6 s after CSS split; remaining time dominated by JS parse/eval + remaining CSS on login document.

## Authorized fixes applied (RC6)

### A. Route-group CSS split

- `app/(auth)/layout.tsx` → `styles/rovexo/auth-entry.css` only
- `app/(platform)/layout.tsx` → `@/styles/rovexo/index.css`
- Root `app/layout.tsx` → no design-system CSS (globals + providers only)
- Non-auth routes moved under `app/(platform)/` (URLs unchanged)

### B. Login-path JS / chrome deferral (no auth logic change)

- `SearchProvider` imported from feature path (not search barrel)
- Dynamic `SearchOverlay` (`ssr: false`)
- Dynamic `RovexoHeaderV2`; `header-v2.css` colocated on header component
- `AuthChromeDeferred`: skip GA / cookies / presence / push on auth routes
- `AppShellLayout`: auth routes = children wrapper only

### C. Fonts

- Geist Mono `preload: false`, `display: "swap"` (kept)

## Measured AFTER (FINAL)

| Metric | Mobile FINAL | Desktop FINAL | Target |
|--------|--------------|---------------|--------|
| Performance | **90** | **100** | ≥95 |
| LCP | **3560 ms** | **712 ms** | <2500 ms |
| CLS | 0 | 0 | <0.1 |
| A11y | 98 | 98 | ≥95 |
| Best Practices | 96 | 96 | ≥95 |
| SEO | 69 | 69 | 100 (auth `noindex` — expected) |
| Unused CSS | ~21 KiB | ~21 KiB | — |
| Unused JS | ~77 KiB | ~77 KiB | — |

Register AFTER mobile: Perf **100**, LCP **1.1 s** (same CSS split).

## Residual (verified)

- Login still loads shared CSS chunk `2_qpvi1hbk7zb.css` (~169 KiB disk) that **contains marketplace selector strings** (`wallet-v2`, `inbox-hub`, `checkout-v1`, etc.). Login HTML does **not** load the full `2mb0…` (~795 KiB) platform `index.css` chunk.
- Further reduction requires deeper shared-chunk isolation (risk to Global Production Freeze / platform CSS SSOT) — **not applied** without Owner architecture authorization beyond route-group split.
- Mobile Perf **90** / LCP **3.6 s** still miss RC6 targets.

## Evidence files

- `BEFORE-mobile.report.json` / `BEFORE-desktop.report.json`
- `AFTER-login-*.report.json` (CSS split)
- `FINAL-login-*.report.json` (CSS split + JS deferral)
- `AFTER-register-*.report.json`
- `../coverage/css-sizes.txt`
