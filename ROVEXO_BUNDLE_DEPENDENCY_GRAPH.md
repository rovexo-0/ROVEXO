# ROVEXO Bundle Dependency Graph

**Phase 11 · Evidence only · No implementation**  
**Captured:** 2026-08-04 · Host `http://127.0.0.1:3000` · Build `.next/static/chunks`  
**Raw data:** `test-results/phase11/`

---

## 1. Layout → Provider → Bundle graph

```
app/layout.tsx (ROOT — every route)
├── app/globals.css          → Tailwind @theme + global utilities  [CSS]
├── Geist + Geist_Mono fonts [preload sans]
├── PageVisibilityProvider   ["use client"]
├── LocaleProvider           ["use client"]
├── PwaProvider              ["use client"]  ← SW / install chrome
├── ToastProvider            ["use client"]
├── AuthProvider             ["use client"]  ← session / supabase client path
├── AvatarProvider           ["use client"]
├── AppShellLayout           ["use client"]
│   ├── (auth routes)        → passthrough only (RC6/RC7 defer)
│   └── (other routes)
│       ├── AppChromeScrollProvider   [dynamic]
│       ├── NavigationPathRecorder    [dynamic ssr:false]
│       ├── PromotionRealtimeRefresher[dynamic ssr:false]
│       ├── MobileScrollBootstrap     [dynamic ssr:false]
│       └── GlobalStickyBundleBar     [dynamic ssr:false]
└── AuthChromeDeferred

app/(auth)/layout.tsx
└── styles/rovexo/auth-entry.css   ← MINIMAL auth sheets (~8 imports)

app/(platform)/layout.tsx
├── styles/rovexo/index.css        ← 110 @imports (MARKETPLACE + ADMIN + ENGINES)
└── PlatformChromeProviders ["use client"]
    ├── SearchProvider
    └── HeaderProvider
```

**Forced large bundles**

| Provider / entry | Forces onto | Evidence |
|---|---|---|
| Root providers (Auth/Pwa/Toast/Locale/…) | **All routes including Login** | Login JS Initial **876 KB** |
| `AppShellLayout` client boundary | Root client graph | `"use client"` + `usePathname` |
| `styles/rovexo/index.css` | **All `(platform)` pages** | Search CSS Initial **952 KB**; chunk `0a0kbdf6e3ndx.css` **777 KB** |
| SearchProvider + HeaderProvider | All platform pages | Platform layout |
| React-DOM shared chunk | All pages | `3m-x0-nwv87vj.js` **226 KB** |
| Next runtime chunk | All pages | `0lt42bxaql9x1.js` **406 KB** |
| Supabase-marked chunk | Shared client | `101z-by49auj4.js` **202 KB** |

**Does NOT force admin CSS onto Login** — auth layout uses `auth-entry.css` only (PASS isolation for auth vs platform CSS).  
**DOES force admin+wallet+checkout+inbox+sell CSS onto Search/Home/Listing** — single platform CSS entry (FAIL for CSS budget).

---

## 2. Bundle / chunk graph (built artifacts)

Total static chunks: **338** · JS+CSS under `.next/static/chunks` ≈ **11 MB** on disk.

### Largest chunks (descending)

| KB | Chunk | Role (fingerprint) |
|---|---|---|
| 776.7 | `0a0kbdf6e3ndx.css` | Compiled **platform `index.css`** megasheet |
| 406.0 | `0lt42bxaql9x1.js` | **next/dist** runtime |
| 292×3 | `0yuny8gie2bal.js` / twins | Framework peers |
| 226.3 | `3m-x0-nwv87vj.js` | **react-dom** |
| 201.6 | `101z-by49auj4.js` | **supabase** client markers |
| 167.9 | `2fdnn8sw-9exy.js` | App shared |
| 119.0 | `2x8rot60kmmna.css` | Shared CSS (login+search) |
| 110.0 | `0cz1d0mv5g_q7.js` | App shared |

### Per-page initial HTML graph (scripts + CSS hrefs in first document)

| Page | JS Initial KB | CSS Initial KB | Largest JS | Notes |
|---|---|---|---|---|
| Homepage `/` | 876 | 210 | react-dom 226 | Guest → Login shell |
| Login | 876 | 210 | react-dom 226 | Auth CSS path |
| Search | **1058** | **952** | react-dom 226 | + platform CSS 777 |
| Categories | 977 | 901 | react-dom 226 | Platform CSS |
| Listing | **1084** | 941 | react-dom 226 | Platform CSS |
| Store | 1004 | 941 | react-dom 226 | Platform CSS |
| Profile/Wallet/Orders/Messages/Checkout/Settings | 876 | 210 | react-dom 226 | Guest → Login (not authenticated page weight) |

**JS Lazy / CSS Lazy:** Not fully instrumented (no coverage map). Known lazy patterns: `AppShellLayout` `dynamic()` chrome; page-level `next/dynamic` islands. Platform CSS is **eager** (layout import) — effectively **no CSS lazy** for marketplace modules today.

---

## 3. Client graph

```
734 files with "use client"
Top-100 by source size: ~96% use hooks, ~92% DOM events
```

**High-weight client pages (source KB — not gzip)**

| KB | File | Why client (evidence) | Server opportunity |
|---|---|---|---|
| 38.4 | `InboxPage.tsx` | hooks + navigation + browser + events | Extract islands; page shell server |
| 35.3 | `ViewProfilePage.tsx` | same | same |
| 29.7 | `RovexoIdeasPage.tsx` | same | same |
| 15.5 | `ProductDetailPage.tsx` | hooks + dynamic host | Gallery/CTA client; shell server |
| 9.3 | `SellPage.tsx` | hooks + browser | Keep interactive; audit imports |
| 11.7 | `ComplianceDashboard.tsx` | **no obvious hooks** | INVESTIGATE mis-mark |
| 9.1 | `SuperAdminDashboard.tsx` | **no obvious hooks** | INVESTIGATE mis-mark |

**Root client walls that enlarge every page**

- `AuthProvider` / `AvatarProvider`
- `PwaProvider`
- `ToastProvider`
- `LocaleProvider`
- `AppShellLayout` (forces client boundary above children)

---

## 4. CSS graph

```
globals.css (root)
└── @import "tailwindcss" + @theme   → shared on ALL routes (~part of 210 KB login CSS)

auth-entry.css (auth layout only)
└── tokens, typography, forms, auth-v1, primary-button, platform-canonical, icon-standard

index.css (platform layout) — 110 @imports
├── shared_core        ~151 KB source
├── home_search        ~142 KB source
├── account            ~95 KB source
├── inbox_chat         ~68 KB source   ← loaded on Search
├── wallet_finance     ~42 KB source   ← loaded on Search
├── sell               ~30 KB source   ← loaded on Search
├── checkout_cart      ~25 KB source   ← loaded on Search
├── orders             ~13 KB source   ← loaded on Search
├── admin_enterprise   ~282 KB source  ← loaded on Search  ★ PRIMARY CSS WIN
└── other              ~56 KB source
```

**Compiled:** platform megasheet ≈ **777 KB** CSS chunk on Search/Listing.  
**Search-unneeded source CSS (approx):** **~460 KB** (admin+checkout+wallet+inbox+sell+orders) before Tailwind expansion.

---

## 5. Lazy / dynamic graph (known)

```
AppShellLayout
  dynamic → AppChromeScrollProvider (ssr:true)
  dynamic → MobileScrollBootstrap (ssr:false)
  dynamic → NavigationPathRecorder (ssr:false)
  dynamic → PromotionRealtimeRefresher (ssr:false)
  dynamic → GlobalStickyBundleBar (ssr:false)

Product / Sell / Wallet pages
  various next/dynamic islands (page-local)
```

**Gap:** CSS modules above are **not** in this lazy graph — they ride the platform layout.

---

## 6. Dependency risk graph (npm disk size ≠ browser weight)

| Package | Disk | Browser risk note |
|---|---|---|
| `lucide-react` | 32 MB | **Almost unused in app TSX** (tests only) — keep out of client graph |
| `framer-motion` | 4.6 MB | Only under `archive/` — ensure never imported from live app |
| `@supabase/*` | (in chunk) | **202 KB** client chunk present |
| `react-dom` | 7 MB pkg | **226 KB** chunk — irreducible baseline |
| `next` | 54 MB | **406 KB** runtime chunk |
| `xlsx` / `@sparticuz/chromium` | large | Should remain **server-only** / tooling |

---

## 7. Duplicate modules / packages

| Finding | Evidence |
|---|---|
| Triple ~292 KB JS twins | Three near-identical chunk sizes in build |
| Multiple account CSS eras | `account.css`, `account-2026.css`, `account-module-v1.css`, `account-hub-v1.css`, … |
| Command center v1+v2 both imported | Both in `index.css` |
| Mission control + mission-control-v2 | Both in `index.css` |
| Login vs Search CSS divergence | Search adds 6 CSS chunks incl. 777 KB megasheet |

---

*Graph for Owner planning only. No code was changed.*
