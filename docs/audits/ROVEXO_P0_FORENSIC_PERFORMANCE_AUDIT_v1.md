# ROVEXO — P0 Forensic Performance Audit v1.0

**STATUS:** READ ONLY · FORENSIC · EVIDENCE ONLY  
**DATE:** 2026-08-07  
**PARENT:** `docs/audits/ROVEXO_MOBILE_PERFORMANCE_SEO_MASTER_AUDIT_v1.md`  
**SCOPE:** P0 #1 Platform CSS megabundle · P0 #2 Client density · P0 #3 Homepage SSR+client double fetch  

**ABSOLUTE:** No code changes · no refactor · no optimisation · no commit · no push · no deploy.

**METHOD:** Static filesystem + source inspection. No Lighthouse, no Safari/Chrome/Samsung runtime CSS coverage, no network panel capture in this pass.

**Classification legend (CSS Status):**
- **USED** — Sheet is shared marketplace / Homepage chrome (heuristic by filename + path ownership).
- **PARTIALLY USED** — Sheet is loaded on all platform routes (including Homepage) but is intended for another surface; Homepage selector matches **NOT VERIFIED** without coverage tooling.
- **UNUSED** — Not claimed in this forensic pass (would require coverage proof).
- **NOT VERIFIED** — Insufficient evidence for selector-level usage.

**Classification legend (Client):**
- **Required** — File contains `useState` / `useEffect` / `useReducer` / `useSyncExternalStore` / `createContext` / `useRouter` / `usePathname` / `useSearchParams` (static scan).
- **Probably required** — Other client APIs/hooks detected (`useRef`, `window`, observers, etc.).
- **Probably removable** — Small/`"use client"` file with **no** matched client APIs in static scan (still may be required e.g. Next.js `error.tsx` boundaries).
- **Not verified** — Could not classify confidently from static patterns.

---

# P0 #1 — PLATFORM CSS MEGABUNDLE

## Entry file (exact)

| Field | Evidence |
|-------|----------|
| Entry | `styles/rovexo/index.css` |
| Loaded by | `app/(platform)/layout.tsx` line: `import "@/styles/rovexo/index.css"` |
| Applies to | **All** platform (non-auth) routes under `app/(platform)/` including Homepage `/` |
| Auth isolation | Auth routes use `app/(auth)/layout.tsx` + `styles/rovexo/auth-entry.css` — **do not** load this index (comment RC6/RC7 in platform layout) |

## Import count

| Metric | Value | Evidence |
|--------|------:|----------|
| `@import` lines in index | **111** | Count of `@import` in `styles/rovexo/index.css` |
| Unique resolved files | **111** | No duplicate paths inside index |
| Nested `@import` inside children | **3** (from `platform-canonical-ui.css` only) | Nested scan |
| Total CSS files in tree (index + nested) | **114** | 111 + 3 |
| Duplicate imports **within** `index.css` | **0** | Path uniqueness check |

## Homepage additional CSS (outside index)

Loaded by `app/(platform)/page.tsx` **in addition to** platform index:

| File | Bytes | Gzip alone (lvl9) |
|------|------:|------------------:|
| `styles/homepage-canonical.css` | 2198 | 768 |
| `styles/homepage-canonical-responsive.css` | 1271 | 594 |
| `styles/rovexo/header-v2.css` | 5767 | 1742 |

**Header overlap note (evidence only):** platform index already imports `./rovexo-header-standard-v1.css` and `./header-premium.css`; Homepage also imports `styles/rovexo/header-v2.css`. Whether rules duplicate selectors = **NOT VERIFIED** (no selector diff run).

## Import order (exact, as in `styles/rovexo/index.css`)

1. `../tokens.css`
2. `./typography.css`
3. `./forms.css`
4. `./cards.css`
5. `./listing-card-official.css`
6. `./store-listing-card-premium-v1.css`
7. `./promotion-cards-v1.css`
8. `./product-detail-v1.css`
9. `./make-offer-v1.css`
10. `./auth-v1.css`
11. `./account-hub-v1.css`
12. `./account-module-v1.css`
13. `./platform-canonical-ui.css` → nests account-canonical-v2, account-settings-ui, addresses-v1
14. `./canonical-ds.css`
15. `./rovexo-header-standard-v1.css`
16. `./full-width-engine-v1.css`
17. `./primary-button-v1.css`
18. `./my-account-primary-button-v1.css`
19. `./account-settings-v1.css`
20. `./account-settings-canonical.css`
21. `./wallet-hub-v1.css`
22. `./hmrc-reporting-centre-v1.css`
23. `./orders-page-v1.css`
24. `./inbox-hub-v1.css`
25. `./conversation-hub-v1.css`
26. `./cart-v1.css`
27. `./checkout-v1.css`
28. `./rvx-topbar-v1.css`
29. `./shell.css`
30. `./utilities.css`
31. `./layout.css`
32. `./header-premium.css`
33. `./bottom-nav-premium.css`
34. `./dashboard.css`
35. `./mobile-scroll-v1.css`
36. `./mobile.css`
37. `./hero.css`
38. `./auctions.css`
39. `./chrome-scroll.css`
40. `./sign-out.css`
41–47. `./home-polish.css` … `./home-v1-visual-qa.css`
48–50. `./account.css` `./account-center.css` `./account-2026.css`
51. `./rovexo-ideas-v1.css`
52. `./secondary-banners.css`
53. `./category-rail.css`
54. `./premium-empty-state.css`
55–59. mission-control / command-center family
60. `./bring-your-item.css`
61–64. platform-visual / studios
65–103. enterprise / omega / incident / super-admin family
104. `./benefits-rail.css`
105. `./icon-standard-v1.css`
106. `./design-studio-v1.css`
107. `./command-os-v4.css`
108. `./universal-ui-v1.css`
109. `./compact-premium-v1.css`
110. `./phone-width-v1-freeze.css`
111. `./sell.css`

Comment in index (lines 26–27): page-scoped **wallet child** sheets (balance/withdraw/payment-methods/bank-accounts) are **intentionally excluded** from global index.

## File sizes (source bytes)

| Metric | Value | Evidence |
|--------|------:|----------|
| Sum of 111 imported file raw bytes | **945,516** (~923.4 KB) | `fs.stat` / byte length sum |
| Nested 3 files raw bytes | **29,789** (~29.1 KB) | Nested files |
| Index file itself | **4,152** bytes | `styles/rovexo/index.css` |
| Estimated parsed size (uncompressed CSS text of imports) | **~945.5 KB** (+ ~29.8 KB nested if inlined) | Source bytes = lower bound of parse input before browser CSSOM; **NOT VERIFIED** vs post-minify/post-LightningCSS output in `.next` |
| Gzip sum-of-each (level 9) | **~199.6 KB** | Artificial (not how browsers fetch once) |
| Gzip of concatenated imports (level 9) | **128544** bytes (~125.5 KB) | Closer estimate for single bundled CSS transfer |
| Estimated transferred size (production) | **NOT VERIFIED** | Requires live response or `.next` CSS asset bytes + Content-Encoding |

**Important:** Next.js may transform/minify CSS at build time. Production transferred bytes and final parsed CSSOM size = **NOT VERIFIED** in this pass.

## Critical vs non-critical (Homepage visit heuristic)

| Class | Meaning | Count (of 111) |
|-------|---------|----------------:|
| critical-or-shared | Tokens, shell, cards, home-*, bottom-nav, mobile, etc. | 34 |
| non-critical-on-homepage | Auth/wallet/inbox/sell/checkout/admin/enterprise sheets still loaded | 76 |
| unknown | Heuristic miss | 1 |

## Mobile / Safari / Android / Samsung impact (evidence-bounded)

| Target | Verified impact statement | NOT VERIFIED |
|--------|---------------------------|--------------|
| Mobile general | Platform layout forces **all 111 sheets** onto Homepage HTML/CSS pipeline for every mobile marketplace visit | Actual ms of CSS parse/style recalc |
| Safari iPhone | Same CSS entry as other browsers (no Safari-only split found in layout) | Safari CSS parser cost, FCP/LCP contribution |
| Chrome Android | Same | Lab metrics |
| Samsung Internet | Same; no Samsung-specific CSS entry found | Lab metrics |

## Finding records (P0 #1)

### F-CSS-1 — Global megabundle entry
| Field | Value |
|-------|-------|
| File | `app/(platform)/layout.tsx`, `styles/rovexo/index.css` |
| Function | PlatformGroupLayout |
| Component | Platform layout |
| Exact reason | Single import loads 111 CSS modules for every platform route including Homepage. |
| Estimated impact | ~945 KB source CSS (+ nested ~30 KB) must be handled on Homepage; gzip-concat estimate ~125.5 KB |
| Risk | High for mobile FCP/TBT CSS parse |
| Regression risk | High if sheets removed incorrectly |
| Complexity | High |
| Changes functionality | YES if removal breaks surfaces |
| Status | Verified load path |

### F-CSS-2 — Auth CSS inside platform megabundle
| Field | Value |
|-------|-------|
| File | `styles/rovexo/auth-v1.css` (order #10) |
| Function | — |
| Component | — |
| Exact reason | Largest single sheet (**56,419** bytes) imported into **platform** index while auth routes already isolate via auth-entry. |
| Estimated impact | Extra ~55 KB source CSS on Homepage/Inbox/Sell/etc. |
| Risk | Medium–High |
| Regression risk | Medium |
| Complexity | Medium |
| Changes functionality | YES if platform still needs auth modal styles |
| Status | PARTIALLY USED on Homepage (heuristic) |

### F-CSS-3 — Enterprise/Super Admin sheets on marketplace
| Field | Value |
|-------|-------|
| File | Multiple `enterprise-*`, `mission-control*`, `command-center*`, `super-admin-premium.css`, etc. |
| Function | — |
| Component | — |
| Exact reason | ~49 admin/enterprise-named sheets in global index. |
| Estimated impact | Large non-marketplace CSS parsed on buyer Homepage |
| Risk | High |
| Regression risk | High for Super Admin if split wrong |
| Complexity | High |
| Changes functionality | YES if Super Admin loses styles |
| Status | PARTIALLY USED (loaded globally) |

## Complete CSS inventory (111 + nested)

| # | Path | Bytes | Gzip alone (lvl9) | Criticality (Homepage) | Status | Evidence basis |
|--:|------|------:|------------------:|------------------------|--------|----------------|
| 1 | `styles/tokens.css` | 5649 | 1308 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 2 | `styles/rovexo/typography.css` | 2092 | 392 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 3 | `styles/rovexo/forms.css` | 2766 | 749 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 4 | `styles/rovexo/cards.css` | 6340 | 1605 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 5 | `styles/rovexo/listing-card-official.css` | 1043 | 445 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 6 | `styles/rovexo/store-listing-card-premium-v1.css` | 4773 | 1145 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 7 | `styles/rovexo/promotion-cards-v1.css` | 14457 | 2949 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 8 | `styles/rovexo/product-detail-v1.css` | 37396 | 6920 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 9 | `styles/rovexo/make-offer-v1.css` | 3635 | 1175 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 10 | `styles/rovexo/auth-v1.css` | 56419 | 8564 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 11 | `styles/rovexo/account-hub-v1.css` | 5197 | 1242 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 12 | `styles/rovexo/account-module-v1.css` | 26547 | 3920 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 13 | `styles/rovexo/platform-canonical-ui.css` | 4574 | 1568 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 14 | `styles/rovexo/canonical-ds.css` | 23233 | 4420 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 15 | `styles/rovexo/rovexo-header-standard-v1.css` | 1820 | 714 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 16 | `styles/rovexo/full-width-engine-v1.css` | 12146 | 2790 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 17 | `styles/rovexo/primary-button-v1.css` | 3718 | 1130 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 18 | `styles/rovexo/my-account-primary-button-v1.css` | 272 | 208 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 19 | `styles/rovexo/account-settings-v1.css` | 5974 | 1797 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 20 | `styles/rovexo/account-settings-canonical.css` | 2652 | 834 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 21 | `styles/rovexo/wallet-hub-v1.css` | 28565 | 5214 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 22 | `styles/rovexo/hmrc-reporting-centre-v1.css` | 7435 | 1713 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 23 | `styles/rovexo/orders-page-v1.css` | 10001 | 2501 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 24 | `styles/rovexo/inbox-hub-v1.css` | 18227 | 4027 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 25 | `styles/rovexo/conversation-hub-v1.css` | 44422 | 7253 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 26 | `styles/rovexo/cart-v1.css` | 8236 | 1644 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 27 | `styles/rovexo/checkout-v1.css` | 17750 | 3644 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 28 | `styles/rovexo/rvx-topbar-v1.css` | 1542 | 646 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 29 | `styles/rovexo/shell.css` | 3201 | 982 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 30 | `styles/rovexo/utilities.css` | 9961 | 1985 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 31 | `styles/rovexo/layout.css` | 9452 | 2321 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 32 | `styles/rovexo/header-premium.css` | 3195 | 867 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 33 | `styles/rovexo/bottom-nav-premium.css` | 4961 | 1299 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 34 | `styles/rovexo/dashboard.css` | 11934 | 2384 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 35 | `styles/rovexo/mobile-scroll-v1.css` | 8192 | 1859 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 36 | `styles/rovexo/mobile.css` | 6984 | 1780 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 37 | `styles/rovexo/hero.css` | 17218 | 3586 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 38 | `styles/rovexo/auctions.css` | 8495 | 1501 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 39 | `styles/rovexo/chrome-scroll.css` | 1079 | 398 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 40 | `styles/rovexo/sign-out.css` | 741 | 374 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 41 | `styles/rovexo/home-polish.css` | 5660 | 1323 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 42 | `styles/rovexo/home-product-cards.css` | 5248 | 1076 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 43 | `styles/rovexo/home-final.css` | 8056 | 1863 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 44 | `styles/rovexo/home-launch-polish.css` | 3126 | 908 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 45 | `styles/rovexo/home-sections-premium.css` | 7527 | 1814 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 46 | `styles/rovexo/home-v1-launch-polish.css` | 13033 | 2431 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 47 | `styles/rovexo/home-v1-visual-qa.css` | 8210 | 1909 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 48 | `styles/rovexo/account.css` | 7251 | 1906 | unknown | **NOT VERIFIED** | No ownership heuristic matched. |
| 49 | `styles/rovexo/account-center.css` | 13044 | 2623 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 50 | `styles/rovexo/account-2026.css` | 22017 | 4632 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 51 | `styles/rovexo/rovexo-ideas-v1.css` | 13714 | 2954 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 52 | `styles/rovexo/secondary-banners.css` | 2222 | 893 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 53 | `styles/rovexo/category-rail.css` | 6654 | 1696 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 54 | `styles/rovexo/premium-empty-state.css` | 229 | 175 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 55 | `styles/rovexo/mission-control.css` | 13920 | 2305 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 56 | `styles/rovexo/mission-control-v2.css` | 11576 | 1896 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 57 | `styles/rovexo/command-center-v1.css` | 15024 | 2750 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 58 | `styles/rovexo/command-center-v2.css` | 17461 | 3366 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 59 | `styles/rovexo/command-centre-unified-v1.css` | 4273 | 1270 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 60 | `styles/rovexo/bring-your-item.css` | 3746 | 1077 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 61 | `styles/rovexo/platform-visual.css` | 2364 | 770 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |
| 62 | `styles/rovexo/theme-studio-pro.css` | 6386 | 1409 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 63 | `styles/rovexo/platform-studio.css` | 4326 | 1005 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 64 | `styles/rovexo/app-studio.css` | 6084 | 1278 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 65 | `styles/rovexo/enterprise-core.css` | 5161 | 1178 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 66 | `styles/rovexo/shipping-engine.css` | 3742 | 888 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 67 | `styles/rovexo/orders-engine.css` | 4321 | 939 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 68 | `styles/rovexo/wallet-engine.css` | 4592 | 971 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 69 | `styles/rovexo/payments-engine.css` | 4468 | 946 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 70 | `styles/rovexo/protection-engine.css` | 4998 | 1020 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 71 | `styles/rovexo/messages-engine.css` | 4434 | 956 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 72 | `styles/rovexo/notifications-engine.css` | 4556 | 969 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 73 | `styles/rovexo/analytics-engine.css` | 3744 | 845 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 74 | `styles/rovexo/security-engine.css` | 3948 | 869 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 75 | `styles/rovexo/search-engine.css` | 3858 | 868 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 76 | `styles/rovexo/ai-engine.css` | 3786 | 858 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 77 | `styles/rovexo/integrations-engine.css` | 3737 | 847 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 78 | `styles/rovexo/visual-cms.css` | 6690 | 1294 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 79 | `styles/rovexo/asset-manager.css` | 4330 | 1060 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 80 | `styles/rovexo/operations-center.css` | 6030 | 1347 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 81 | `styles/rovexo/recovery-center.css` | 5256 | 1222 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 82 | `styles/rovexo/audit-compliance.css` | 5306 | 1217 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 83 | `styles/rovexo/certification-center.css` | 5393 | 1219 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 84 | `styles/rovexo/mobile-distribution-center.css` | 18274 | 3273 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 85 | `styles/rovexo/device-lifecycle-manager.css` | 8059 | 1799 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 86 | `styles/rovexo/omega-enterprise-mobile.css` | 11392 | 2366 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 87 | `styles/rovexo/executive-command.css` | 6579 | 1597 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 88 | `styles/rovexo/incident-command-center.css` | 8447 | 1935 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 89 | `styles/rovexo/incident-timeline.css` | 7640 | 1828 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 90 | `styles/rovexo/enterprise-compliance-center.css` | 9285 | 1976 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 91 | `styles/rovexo/enterprise-module-registry.css` | 6387 | 1500 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 92 | `styles/rovexo/enterprise-workflow-engine.css` | 4881 | 1174 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 93 | `styles/rovexo/homepage-builder-engine.css` | 4072 | 1040 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 94 | `styles/rovexo/enterprise-ai-os.css` | 2840 | 778 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 95 | `styles/rovexo/enterprise-mobile-control-center.css` | 2750 | 751 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 96 | `styles/rovexo/enterprise-deployment-center.css` | 2748 | 748 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 97 | `styles/rovexo/incident-response-center.css` | 3629 | 935 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 98 | `styles/rovexo/enterprise-soc.css` | 3303 | 914 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 99 | `styles/rovexo/enterprise-business-intelligence.css` | 2811 | 790 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 100 | `styles/rovexo/enterprise-automation-hub.css` | 2656 | 765 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 101 | `styles/rovexo/omega-command-center.css` | 5823 | 1317 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 102 | `styles/rovexo/super-admin-premium.css` | 12698 | 2442 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 103 | `styles/rovexo/enterprise-admin-unified.css` | 11746 | 2223 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 104 | `styles/rovexo/benefits-rail.css` | 1679 | 673 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 105 | `styles/rovexo/icon-standard-v1.css` | 1059 | 458 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 106 | `styles/rovexo/design-studio-v1.css` | 9599 | 1812 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 107 | `styles/rovexo/command-os-v4.css` | 3475 | 784 | non-critical-on-homepage | **PARTIALLY USED** | Loaded globally via platform layout; intended for Super Admin / enterprise surfaces. Selector match on Homepage DOM: NOT VERIFIED (no coverage). |
| 108 | `styles/rovexo/universal-ui-v1.css` | 15428 | 2665 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 109 | `styles/rovexo/compact-premium-v1.css` | 10578 | 2386 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 110 | `styles/rovexo/phone-width-v1-freeze.css` | 5820 | 1794 | critical-or-shared | **USED** | Shared marketplace design-system / homepage chrome or home-* sheets. |
| 111 | `styles/rovexo/sell.css` | 30063 | 5899 | non-critical-on-homepage | **PARTIALLY USED** | Page-module CSS imported globally; Homepage may not mount matching DOM. Selector usage on Homepage: NOT VERIFIED. |


### Nested imports

| Path | Bytes | Parent | Status | Evidence |
|------|------:|--------|--------|----------|
| `styles/rovexo/account-canonical-v2.css` | 16787 | `styles/rovexo/platform-canonical-ui.css` | **PARTIALLY USED** | Nested via platform-canonical-ui.css; account/settings/addresses module CSS. |
| `styles/rovexo/account-settings-ui.css` | 6865 | `styles/rovexo/platform-canonical-ui.css` | **PARTIALLY USED** | Nested via platform-canonical-ui.css; account/settings/addresses module CSS. |
| `styles/rovexo/addresses-v1.css` | 6137 | `styles/rovexo/platform-canonical-ui.css` | **PARTIALLY USED** | Nested via platform-canonical-ui.css; account/settings/addresses module CSS. |


---

# P0 #2 — CLIENT DENSITY

## Exact count

| Metric | Value | Evidence |
|--------|------:|----------|
| Files containing `"use client"` | **759** | `rg -l '"use client"'` excl. `archive/`, `apps/`, `node_modules/`; extensions `.ts`/`.tsx` |
| Top-level directory split | features **513** · components **172** · app **35** · lib **20** · src **13** · hooks **5** · scripts **1** | Path prefix counts |

## Why `"use client"` exists (pattern evidence)

Static scan reasons (file may match multiple):

| Reason pattern | Classification implication |
|----------------|----------------------------|
| `useState` / `useEffect` / router hooks / context | **Required** (388 files) |
| Other browser/React client APIs | **Probably required** (54) |
| `"use client"` but no matched APIs (often `error.tsx`, thin wrappers) | **Probably removable** (83) — **not proof** they can be removed (Next.js error boundaries require Client Components) |
| Ambiguous | **Not verified** (234) |

**Totals:** Required **388** · Probably required **54** · Probably removable **83** · Not verified **234** · Sum **759**.

## Module grouping (requested modules)

| Module | Count | Required | Probably required | Probably removable | Not verified |
|--------|------:|---------:|------------------:|-------------------:|-------------:|
| Homepage | 50 | 17 | 6 | 10 | 17 |
| Search | 25 | 15 | 4 | 3 | 3 |
| Browse | 0 | 0 | 0 | 0 | 0 |
| Listing | 25 | 14 | 0 | 2 | 9 |
| Sell | 59 | 35 | 5 | 2 | 17 |
| Inbox | 12 | 8 | 0 | 0 | 4 |
| Orders | 12 | 8 | 1 | 1 | 2 |
| Wallet | 35 | 9 | 8 | 9 | 9 |
| Profile | 54 | 28 | 2 | 5 | 19 |
| Settings | 11 | 4 | 0 | 4 | 3 |
| Admin | 12 | 9 | 0 | 0 | 3 |
| Business | 3 | 1 | 0 | 1 | 1 |
| Super Admin | 158 | 109 | 5 | 8 | 36 |

| Other groups | Count | Required | Probably required | Probably removable | Not verified |
|--------------|------:|---------:|------------------:|-------------------:|-------------:|
| Auth | 32 | 18 | 1 | 7 | 6 |
| Checkout | 19 | 9 | 2 | 0 | 8 |
| Chrome/Providers | 22 | 11 | 0 | 4 | 7 |
| Notifications | 7 | 3 | 0 | 1 | 3 |
| Other | 204 | 85 | 16 | 26 | 77 |
| UI primitives | 19 | 5 | 4 | 0 | 10 |


**Browse:** **0** client files matched path heuristic `/browse` — Browse page may be Server Component shell + shared Search client UI (**NOT VERIFIED** beyond path match).

## Finding records (P0 #2)

### F-CLI-1 — 759 Client Component modules
| Field | Value |
|-------|-------|
| File | Repo-wide (759 paths) |
| Function | — |
| Component | Many |
| Exact reason | `"use client"` directive present in 759 modules. |
| Estimated impact | Large client JS graph / hydration cost on mobile |
| Risk | High |
| Regression risk | High if blindly converted to RSC |
| Complexity | High |
| Changes functionality | YES if incorrect conversion |
| Status | Count verified; per-file necessity partially classified |

### F-CLI-2 — Super Admin client concentration
| Field | Value |
|-------|-------|
| File | Super Admin module group |
| Function | — |
| Component | — |
| Exact reason | **158** client files classified under Super Admin heuristic. |
| Estimated impact | Does not prove Homepage downloads all; webpack/app router splits by route = **NOT VERIFIED** without bundle analysis |
| Risk | Medium for admin routes; Homepage impact **NOT VERIFIED** |
| Regression risk | High |
| Complexity | High |
| Changes functionality | YES |
| Status | Path classification verified; bundle inclusion on Homepage **NOT VERIFIED** |

### F-CLI-3 — Homepage client tree rooted at CanonicalHomepage
| Field | Value |
|-------|-------|
| File | `components/homepage/canonical/CanonicalHomepage.tsx` |
| Function | CanonicalHomepage |
| Component | CanonicalHomepage (`"use client"`, `memo`) |
| Exact reason | Homepage UI is a Client Component receiving SSR props. |
| Estimated impact | Entire homepage interactive tree hydrates on client |
| Risk | High for Homepage TBT/INP |
| Regression risk | High (Homepage freeze) |
| Complexity | High |
| Changes functionality | YES if split to RSC |
| Status | Verified |

## Every file (complete list)

Appendix below lists **all 759** paths with module group + classification.


### Homepage
Count: **50** (Required 17 · Probably required 6 · Probably removable 10 · Not verified 17)

- `components/header/HomepageHeaderShareButton.tsx` — **Required**
- `components/home/HomeCategoryIconImage.tsx` — **Not verified**
- `components/home/HomePageShell.tsx` — **Probably removable**
- `components/home/HomepageHeader.tsx` — **Required**
- `components/home/HomepageSearchField.tsx` — **Required**
- `components/home/ImageSearchCamera.tsx` — **Not verified**
- `components/home/MobileHeaderScrollContext.tsx` — **Probably removable**
- `components/home/ProductSectionStates.tsx` — **Not verified**
- `components/home/RovexoAllListings.tsx` — **Required**
- `components/home/RovexoAllListingsGrid.tsx` — **Probably required**
- `components/home/RovexoBringYourItemCta.tsx` — **Not verified**
- `components/home/RovexoCategoryCard.tsx` — **Probably removable**
- `components/home/RovexoCategoryRail.tsx` — **Probably removable**
- `components/home/RovexoFooterNavigation.tsx` — **Required**
- `components/home/RovexoMobileHeaderScrollContext.tsx` — **Required**
- `components/home/RovexoShowcaseRails.tsx` — **Probably removable**
- `components/home/RovexoShowcaseSection.tsx` — **Not verified**
- `components/home/hooks/useInfiniteCarousel.ts` — **Required**
- `components/home/hooks/useMarketplaceFeedColumns.ts` — **Required**
- `components/home/hooks/useVirtualizedFeedWindow.ts` — **Required**
- `components/home/stores/StoreCard.tsx` — **Probably required**
- `components/home/stores/StoresHeader.tsx` — **Not verified**
- `components/home/stores/StoresSection.tsx` — **Probably required**
- `components/homepage-v3/HomepageV3.tsx` — **Not verified**
- `components/homepage-v3/HomepageV3BringYourItem.tsx` — **Probably removable**
- `components/homepage-v3/HomepageV3CategoryRail.tsx` — **Probably removable**
- `components/homepage-v3/HomepageV3Feed.tsx` — **Required**
- `components/homepage-v3/HomepageV3Header.tsx` — **Required**
- `components/homepage-v3/HomepageV3ListingRail.tsx` — **Not verified**
- `components/homepage-v3/HomepageV3Search.tsx` — **Probably removable**
- `components/homepage-v3/HomepageV3Showcase.tsx` — **Not verified**
- `components/homepage-v4/HomepageV4.tsx` — **Probably required**
- `components/homepage-v4/HomepageV4BringYourItem.tsx` — **Not verified**
- `components/homepage-v4/HomepageV4CategoryRail.tsx` — **Probably removable**
- `components/homepage-v4/HomepageV4Featured.tsx` — **Not verified**
- `components/homepage-v4/HomepageV4Feed.tsx` — **Required**
- `components/homepage-v4/HomepageV4Header.tsx` — **Required**
- `components/homepage-v4/HomepageV4Search.tsx` — **Probably removable**
- `components/homepage-v4/HomepageV4Showcase.tsx` — **Not verified**
- `components/homepage/canonical/CanonicalCategoryRail.tsx` — **Not verified**
- `components/homepage/canonical/CanonicalHomepage.tsx` — **Probably required**
- `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` — **Required**
- `components/homepage/canonical/HomepageEmptyState.tsx` — **Not verified**
- `components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx` — **Not verified**
- `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` — **Probably required**
- `components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx` — **Not verified**
- `components/homepage/canonical/featured-store/StoreProfileCard.tsx` — **Not verified**
- `features/home/components/FollowingFeedSection.tsx` — **Required**
- `features/home/hooks/use-product-watchlist.ts` — **Required**
- `lib/home/hero-category-sync.tsx` — **Required**

### Search
Count: **25** (Required 15 · Probably required 4 · Probably removable 3 · Not verified 3)

- `features/search/client.ts` — **Not verified**
- `features/search/components/ImageSearchView.tsx` — **Required**
- `features/search/components/MarketplaceNoProductsEmpty.tsx` — **Probably required**
- `features/search/components/ProductResults.tsx` — **Probably required**
- `features/search/components/SavedSearchesPanel.tsx` — **Required**
- `features/search/components/SearchCategoryBrowseCard.tsx` — **Not verified**
- `features/search/components/SearchFilters.tsx` — **Not verified**
- `features/search/components/SearchInputActions.tsx` — **Required**
- `features/search/components/SearchLandingClient.tsx` — **Probably removable**
- `features/search/components/SearchLandingView.tsx` — **Required**
- `features/search/components/SearchLocationFilter.tsx` — **Required**
- `features/search/components/SearchOverlay.tsx` — **Required**
- `features/search/components/SearchProvider.tsx` — **Probably required**
- `features/search/components/SearchResultCard.tsx` — **Required**
- `features/search/components/SearchResultsEmpty.tsx` — **Probably removable**
- `features/search/components/SearchResultsView.tsx` — **Required**
- `features/search/components/SearchScopeChips.tsx` — **Required**
- `features/search/components/SearchSuggestionList.tsx` — **Probably required**
- `features/search/components/SearchTypeaheadPanel.tsx` — **Required**
- `features/search/components/SuggestedSearches.tsx` — **Probably removable**
- `features/search/hooks/use-debounced-value.ts` — **Required**
- `features/search/hooks/use-search-keyboard.ts` — **Required**
- `features/search/hooks/use-search-overlay-state.ts` — **Required**
- `features/search/hooks/use-search-overlay.tsx` — **Required**
- `features/search/hooks/use-search-results.ts` — **Required**

### Browse
Count: **0** (no files matched classifier)

### Listing
Count: **25** (Required 14 · Probably required 0 · Probably removable 2 · Not verified 9)

- `app/(platform)/listing/[slug]/error.tsx` — **Probably removable**
- `components/listing/ListingAttributeIcon.tsx` — **Probably removable**
- `components/listing/ListingAttributeLabel.tsx` — **Not verified**
- `components/listing/ListingAttributeRow.tsx` — **Not verified**
- `components/listing/ListingAttributeValue.tsx` — **Not verified**
- `features/product-detail/AddToBundleSheet.tsx` — **Required**
- `features/product-detail/AddedToCartToast.tsx` — **Required**
- `features/product-detail/ProductActionBarV1.tsx` — **Not verified**
- `features/product-detail/ProductDescriptionV1.tsx` — **Required**
- `features/product-detail/ProductDetailPage.tsx` — **Required**
- `features/product-detail/ProductFullscreenImageViewer.tsx` — **Required**
- `features/product-detail/ProductGalleryV1.tsx` — **Required**
- `features/product-detail/ProductInformationRows.tsx` — **Not verified**
- `features/product-detail/ProductListingActionsMenu.tsx` — **Required**
- `features/product-detail/ProductPageChrome.tsx` — **Not verified**
- `features/product-detail/ProductQuantityStepper.tsx` — **Required**
- `features/product-detail/ProductRecentlyViewed.tsx` — **Required**
- `features/product-detail/ProductReportDialog.tsx` — **Required**
- `features/product-detail/ProductStockStatus.tsx` — **Not verified**
- `features/product-detail/ProductStoreSection.tsx` — **Not verified**
- `features/product-detail/ProductViewsLive.tsx` — **Not verified**
- `features/product-detail/RecordProductViewBeacon.tsx` — **Required**
- `features/product-detail/SellerReportDialog.tsx` — **Required**
- `features/product-detail/use-product-action-bar.ts` — **Required**
- `features/product-detail/use-product-offer-negotiation.ts` — **Required**

### Sell
Count: **59** (Required 35 · Probably required 5 · Probably removable 2 · Not verified 17)

- `components/sell/PublishSuccessDialog.tsx` — **Required**
- `components/sell/PublishingOverlay.tsx` — **Not verified**
- `features/sell/components/FieldError.tsx` — **Probably removable**
- `features/sell/context/SellProvider.tsx` — **Required**
- `features/sell/hooks/use-sell-page-bottom-clearance.ts` — **Required**
- `features/sell/hooks/use-sell-progressive-flow.ts` — **Probably required**
- `features/sell/hooks/useDraftListing.ts` — **Required**
- `features/sell/hooks/usePhotoUpload.ts` — **Probably required**
- `features/sell/hooks/usePublishListing.ts` — **Not verified**
- `features/sell/ui/DeletePhotoAction.tsx` — **Probably required**
- `features/sell/ui/SellCategoryBlock.tsx` — **Required**
- `features/sell/ui/SellCategoryPicker.tsx` — **Required**
- `features/sell/ui/SellCategorySuggestion.tsx` — **Not verified**
- `features/sell/ui/SellDescriptionBlock.tsx` — **Required**
- `features/sell/ui/SellOptionPicker.tsx` — **Required**
- `features/sell/ui/SellPage.tsx` — **Required**
- `features/sell/ui/SellParcelBlock.tsx` — **Required**
- `features/sell/ui/SellPhotoFileInput.tsx` — **Not verified**
- `features/sell/ui/SellPhotoRail.tsx` — **Required**
- `features/sell/ui/SellPickerLeadingMark.tsx` — **Required**
- `features/sell/ui/SellPricingBlock.tsx` — **Probably required**
- `features/sell/ui/SellPrimitives.tsx` — **Not verified**
- `features/sell/ui/SellProgressiveAttributes.tsx` — **Required**
- `features/sell/ui/SellPublishBar.tsx` — **Required**
- `features/sell/ui/SellStockQuantityBlock.tsx` — **Required**
- `features/sell/ui/SellTitleBlock.tsx` — **Required**
- `features/seller-performance/components/SellerPerformanceFactorCard.tsx` — **Required**
- `features/seller-performance/components/SellerPerformanceHistorySection.tsx` — **Required**
- `features/seller-performance/components/SellerPerformanceScoreMeter.tsx` — **Required**
- `features/seller/compliance/ComplianceDashboard.tsx` — **Not verified**
- `features/seller/listings/components/PromotionPicker.tsx` — **Required**
- `features/seller/listings/components/RestockListingDialog.tsx` — **Required**
- `features/seller/listings/components/SellerListingOverflowMenu.tsx` — **Required**
- `features/seller/marketplace/components/MarketplaceConnectorCard.tsx` — **Not verified**
- `features/seller/marketplace/components/MarketplaceConnectorSettingsModal.tsx` — **Required**
- `features/seller/marketplace/components/MarketplaceConnectorsPage.tsx` — **Required**
- `features/seller/marketplace/hooks/use-marketplace-connectors.ts` — **Required**
- `features/seller/migration/components/HeroSlideVisual.tsx` — **Not verified**
- `features/seller/migration/components/MigrationBulkPublishPanel.tsx` — **Required**
- `features/seller/migration/components/MigrationCenterPage.tsx` — **Required**
- `features/seller/migration/components/MigrationSourceFields.tsx` — **Probably required**
- `features/seller/migration/components/MigrationStepIndicator.tsx` — **Not verified**
- `features/seller/migration/components/StoreMigrationHeroBanner.tsx` — **Not verified**
- `features/seller/migration/components/inline/MigrationImportProgressPanel.tsx` — **Not verified**
- `features/seller/migration/components/inline/MigrationInlinePreviewPanel.tsx` — **Not verified**
- `features/seller/migration/components/inline/MigrationItemReviewPanel.tsx` — **Not verified**
- `features/seller/migration/components/inline/MigrationValidationList.tsx` — **Not verified**
- `features/seller/migration/components/steps/MigrationConnectStep.tsx` — **Not verified**
- `features/seller/migration/components/steps/MigrationImportStep.tsx` — **Required**
- `features/seller/migration/components/steps/MigrationPlatformStep.tsx` — **Not verified**
- `features/seller/migration/components/steps/MigrationProgressStep.tsx` — **Probably removable**
- `features/seller/migration/components/steps/MigrationReportStep.tsx` — **Not verified**
- `features/seller/migration/hooks/use-inline-import-preview.ts` — **Required**
- `features/seller/migration/hooks/use-migration-poll.ts` — **Required**
- `features/seller/migration/hooks/use-migration-publish-poll.ts` — **Required**
- `features/seller/migration/hooks/use-migration-wizard.ts` — **Required**
- `features/seller/review-center/components/SellerReviewCasePage.tsx` — **Required**
- `features/seller/review-center/components/SellerReviewCenterPage.tsx` — **Required**
- `features/seller/tax/components/SellerTaxRegistrationPage.tsx` — **Required**

### Inbox
Count: **12** (Required 8 · Probably required 0 · Probably removable 0 · Not verified 4)

- `features/inbox/components/ConversationHub.tsx` — **Required**
- `features/inbox/components/InboxPage.tsx` — **Required**
- `features/inbox/components/PlatformFeeSheet.tsx` — **Required**
- `features/inbox/components/TransactionActionBar.tsx` — **Not verified**
- `features/inbox/components/TransactionStatusCard.tsx` — **Not verified**
- `features/inbox/hooks/use-owner-demo-mode.ts` — **Required**
- `features/messages/hooks/use-chat-realtime.ts` — **Required**
- `features/transaction-hub/CheckoutHubSheet.tsx` — **Required**
- `features/transaction-hub/MakeOfferSheet.tsx` — **Not verified**
- `features/transaction-hub/OfferComposerSheet.tsx` — **Required**
- `features/transaction-hub/TransactionHubBottomActions.tsx` — **Required**
- `features/transaction-hub/TransactionHubPaymentSuccess.tsx` — **Not verified**

### Orders
Count: **12** (Required 8 · Probably required 1 · Probably removable 1 · Not verified 2)

- `app/(platform)/orders/error.tsx` — **Probably removable**
- `features/orders/components/BuyerCancelOrderCard.tsx` — **Required**
- `features/orders/components/BuyerOrderDetailCanonical.tsx` — **Required**
- `features/orders/components/IssueResolutionLink.tsx` — **Required**
- `features/orders/components/OrderActionsCard.tsx` — **Probably required**
- `features/orders/components/OrderCheckoutConfirmation.tsx` — **Required**
- `features/orders/components/OrderDetailView.tsx` — **Required**
- `features/orders/components/OrderReviewCard.tsx` — **Required**
- `features/orders/components/OrdersListItem.tsx` — **Not verified**
- `features/orders/components/OrdersPage.tsx` — **Required**
- `features/orders/components/SellerFulfillmentCard.tsx` — **Required**
- `features/orders/components/SellerOrderFulfillment.tsx` — **Not verified**

### Wallet
Count: **35** (Required 9 · Probably required 8 · Probably removable 9 · Not verified 9)

- `app/(platform)/balance/error.tsx` — **Probably removable**
- `app/(platform)/wallet/bank-account/error.tsx` — **Probably removable**
- `app/(platform)/wallet/bank-accounts/error.tsx` — **Probably required**
- `app/(platform)/wallet/error.tsx` — **Probably removable**
- `app/(platform)/wallet/locked/error.tsx` — **Probably removable**
- `app/(platform)/wallet/payment-methods/error.tsx` — **Probably required**
- `app/(platform)/wallet/pending/error.tsx` — **Probably removable**
- `app/(platform)/wallet/processing/error.tsx` — **Probably removable**
- `app/(platform)/wallet/transactions/error.tsx` — **Probably removable**
- `app/(platform)/wallet/withdraw/error.tsx` — **Probably removable**
- `features/wallet/components/AnnualStatementDetail.tsx` — **Probably required**
- `features/wallet/components/AnnualStatementsList.tsx` — **Not verified**
- `features/wallet/components/BankAccountForm.tsx` — **Required**
- `features/wallet/components/MonthSummaryGrid.tsx` — **Not verified**
- `features/wallet/components/MonthlyStatementDetail.tsx` — **Probably required**
- `features/wallet/components/MonthlyStatementsList.tsx` — **Not verified**
- `features/wallet/components/PayoutSetupSection.tsx` — **Required**
- `features/wallet/components/PayoutStatusCard.tsx` — **Not verified**
- `features/wallet/components/ProfileBalanceMenuIcon.tsx` — **Probably removable**
- `features/wallet/components/WalletBankAccountsPage.tsx` — **Required**
- `features/wallet/components/WalletConnectedBank.tsx` — **Required**
- `features/wallet/components/WalletHubV1.tsx` — **Probably required**
- `features/wallet/components/WalletInsights.tsx` — **Not verified**
- `features/wallet/components/WalletMenuSections.tsx` — **Not verified**
- `features/wallet/components/WalletPaymentMethodsPage.tsx` — **Required**
- `features/wallet/components/WalletPayoutsPage.tsx` — **Not verified**
- `features/wallet/components/WalletProfileChrome.tsx` — **Not verified**
- `features/wallet/components/WalletRecentTransactions.tsx` — **Required**
- `features/wallet/components/WalletTransactionsList.tsx` — **Not verified**
- `features/wallet/components/withdraw/WithdrawAmountStep.tsx` — **Probably required**
- `features/wallet/components/withdraw/WithdrawMethodStep.tsx` — **Probably required**
- `features/wallet/components/withdraw/WithdrawPage.tsx` — **Required**
- `features/wallet/components/withdraw/WithdrawReviewStep.tsx` — **Probably required**
- `features/wallet/hooks/use-wallet-live.ts` — **Required**
- `features/wallet/hooks/use-withdraw-flow.ts` — **Required**

### Profile
Count: **54** (Required 28 · Probably required 2 · Probably removable 5 · Not verified 19)

- `app/(platform)/account/error.tsx` — **Probably removable**
- `app/(platform)/account/promotion-tools/error.tsx` — **Probably removable**
- `features/account-canonical/MyAccountTemplate.tsx` — **Not verified**
- `features/account-canonical/header/AccountCanonicalHeader.tsx` — **Required**
- `features/account-canonical/shell/AccountCanonicalShell.tsx` — **Not verified**
- `features/account-center/components/AccountCanonicalProfile.tsx` — **Not verified**
- `features/account-center/components/AccountCenterDeleteButton.tsx` — **Probably removable**
- `features/account-center/components/AccountCenterHome.tsx` — **Not verified**
- `features/account-center/components/AccountCenterLogoutButton.tsx` — **Probably required**
- `features/account-center/components/AccountCenterModulePage.tsx` — **Not verified**
- `features/account-center/components/AccountMenuSections.tsx` — **Required**
- `features/account-center/components/AccountSellerPerformanceCard.tsx` — **Not verified**
- `features/account-center/components/BuyingHubPage.tsx` — **Probably removable**
- `features/account-center/components/BuyingMenuSections.tsx` — **Not verified**
- `features/account-center/components/HolidayModeProfileRow.tsx` — **Required**
- `features/account-center/components/MasterMenuIcon.tsx` — **Not verified**
- `features/account-center/components/MessagesHubPage.tsx` — **Not verified**
- `features/account-center/components/RecentlyViewedPage.tsx` — **Required**
- `features/account-center/components/SellingMenuSections.tsx` — **Not verified**
- `features/account-center/components/VerificationHubPage.tsx` — **Probably required**
- `features/account-center/hooks/useAccountHubLive.ts` — **Required**
- `features/account-module/components/BringYourItemPage.tsx` — **Required**
- `features/account-module/components/DeleteAccountFlow.tsx` — **Required**
- `features/account-module/components/PromotionToolEntryV1.tsx` — **Required**
- `features/account-module/components/PromotionToolsV1.tsx` — **Required**
- `features/account-module/components/ReviewsV1.tsx` — **Not verified**
- `features/account-module/components/RovexoIdeasPage.tsx` — **Required**
- `features/account-module/components/SavedItemsV1.tsx` — **Required**
- `features/account-module/components/SellerListingsV1.tsx` — **Required**
- `features/account/components/AccountBlockedUsersPage.tsx` — **Required**
- `features/account/components/AccountBuyerPreferencesPage.tsx` — **Required**
- `features/account/components/AccountCurrencyPage.tsx` — **Not verified**
- `features/account/components/AccountDevicesPage.tsx` — **Required**
- `features/account/components/AccountLanguagePage.tsx` — **Required**
- `features/account/components/AccountPrivacyPage.tsx` — **Required**
- `features/account/components/AccountSecurityPage.tsx` — **Required**
- `features/account/components/AccountSecurityResetViaEmailPage.tsx` — **Not verified**
- `features/account/components/AccountSessionsPage.tsx` — **Required**
- `features/account/components/AccountTimezonePage.tsx` — **Required**
- `features/account/components/AccountTwoFactorPage.tsx` — **Required**
- `features/account/components/AvatarUploader.tsx` — **Probably removable**
- `features/account/components/CardSetupSheet.tsx` — **Required**
- `features/account/components/CookiePreferencesPage.tsx` — **Required**
- `features/account/components/EmailChangeForm.tsx` — **Required**
- `features/account/components/PasswordChangeForm.tsx` — **Required**
- `features/account/components/ProfileEditPage.tsx` — **Required**
- `features/account/components/addresses/AddressCard.tsx` — **Not verified**
- `features/account/components/addresses/AddressForm.tsx` — **Not verified**
- `features/account/components/addresses/AddressesPage.tsx` — **Required**
- `features/account/components/addresses/AddressesTabs.tsx` — **Not verified**
- `features/account/components/addresses/BusinessAddressForm.tsx` — **Not verified**
- `features/account/components/addresses/BusinessAddresses.tsx` — **Not verified**
- `features/account/components/addresses/EditAddress.tsx` — **Required**
- `features/account/components/addresses/PersonalAddresses.tsx` — **Not verified**

### Settings
Count: **11** (Required 4 · Probably required 0 · Probably removable 4 · Not verified 3)

- `app/(platform)/account/settings/error.tsx` — **Probably removable**
- `app/(platform)/settings/error.tsx` — **Probably removable**
- `features/account-module/components/SettingsMenuIcon.tsx` — **Not verified**
- `features/account-module/components/SettingsMenuSections.tsx` — **Not verified**
- `features/account-module/components/SettingsV1.tsx` — **Required**
- `features/notifications/components/NotificationSettingsPage.tsx` — **Required**
- `features/settings/components/ConfirmDialog.tsx` — **Required**
- `features/settings/components/LanguagePicker.tsx` — **Probably removable**
- `features/settings/components/PreferenceToggleRow.tsx` — **Not verified**
- `features/settings/components/SettingToggle.tsx` — **Probably removable**
- `features/super-admin/hmrc/HmrcSettingsPanel.tsx` — **Required**

### Admin
Count: **12** (Required 9 · Probably required 0 · Probably removable 0 · Not verified 3)

- `features/admin/components/AdminPromotionsPage.tsx` — **Required**
- `features/admin/components/HelpAdminDashboard.tsx` — **Required**
- `features/admin/components/ModerationDashboard.tsx` — **Required**
- `features/admin/components/MonetizationAdminDashboard.tsx` — **Not verified**
- `features/admin/components/PlatformAnalyticsDashboard.tsx` — **Not verified**
- `features/admin/components/ProductionOperationsDashboard.tsx` — **Not verified**
- `features/admin/components/SellerPerformanceAdminDashboard.tsx` — **Required**
- `features/admin/components/SeoAdminDashboard.tsx` — **Required**
- `features/admin/components/SeoAnalyticsDashboard.tsx` — **Required**
- `features/admin/components/SeoHealthCenter.tsx` — **Required**
- `features/admin/components/TrustAdminDashboard.tsx` — **Required**
- `features/admin/components/TrustReviewActions.tsx` — **Required**

### Business
Count: **3** (Required 1 · Probably required 0 · Probably removable 1 · Not verified 1)

- `features/business/dashboard/components/BusinessDashboardHeader.tsx` — **Probably removable**
- `features/business/dashboard/components/BusinessMenuSections.tsx` — **Not verified**
- `features/business/inventory/components/BusinessInventoryPage.tsx` — **Required**

### Super Admin
Count: **158** (Required 109 · Probably required 5 · Probably removable 8 · Not verified 36)

- `app/(platform)/super-admin/pricing/page.tsx` — **Required**
- `app/(platform)/super-admin/promotion-catalog/page.tsx` — **Required**
- `app/(platform)/super-admin/staff/page.tsx` — **Probably removable**
- `components/auth/SocialButton.tsx` — **Probably removable**
- `components/auth/SocialLogin.tsx` — **Probably removable**
- `features/auth/hooks/use-super-admin.ts` — **Probably removable**
- `features/command-centre/AdminCommandCentreShell.tsx` — **Probably removable**
- `features/command-centre/CommandCentreLayout.tsx` — **Required**
- `features/command-centre/SuperAdminPageHeader.tsx` — **Required**
- `features/super-admin/ai-engine/AiEngineAdmin.tsx` — **Required**
- `features/super-admin/analytics-engine/AnalyticsEngineAdmin.tsx` — **Required**
- `features/super-admin/app-studio/AppStudio.tsx` — **Required**
- `features/super-admin/app-studio/AppStudioSimulator.tsx` — **Required**
- `features/super-admin/asset-manager/AssetManagerAdmin.tsx` — **Required**
- `features/super-admin/audit-compliance/AuditComplianceCenterAdmin.tsx` — **Required**
- `features/super-admin/certification-center/CertificationCenterAdmin.tsx` — **Required**
- `features/super-admin/command-center-v1/CommandCenterLiveProvider.tsx` — **Required**
- `features/super-admin/command-center-v1/CommandCenterV1.tsx` — **Probably required**
- `features/super-admin/command-center-v1/components/ActivityFeed.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/ChartsPanel.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/CommandCenterWorldMap.tsx` — **Probably required**
- `features/super-admin/command-center-v1/components/CriticalAlertsBar.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/GlobalSearchBar.tsx` — **Required**
- `features/super-admin/command-center-v1/components/HealthScoresPanel.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/LiveStatusBadge.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/MetricCard.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/MetricSection.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/NotificationsPanel.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/QuickActionsGrid.tsx` — **Not verified**
- `features/super-admin/command-center-v1/components/StatusHeader.tsx` — **Not verified**
- `features/super-admin/command-center-v2/CommandCenterV2.tsx` — **Probably required**
- `features/super-admin/command-center-v2/components/CcAnimatedCounter.tsx` — **Required**
- `features/super-admin/command-center-v2/components/CcDonutChart.tsx` — **Not verified**
- `features/super-admin/command-center-v2/components/CcHeader.tsx` — **Required**
- `features/super-admin/command-center-v2/components/CcLineChart.tsx` — **Required**
- `features/super-admin/command-center-v2/components/CcSparkline.tsx` — **Probably required**
- `features/super-admin/command-os-v4/CommandOsShell.tsx` — **Required**
- `features/super-admin/components/LiveCountriesPanel.tsx` — **Required**
- `features/super-admin/components/OwnerDemoModePanel.tsx` — **Not verified**
- `features/super-admin/components/PreferredMarketplaceStoresPanel.tsx` — **Required**
- `features/super-admin/components/SuperAdminAuditLog.tsx` — **Required**
- `features/super-admin/components/SuperAdminAutomationPanel.tsx` — **Required**
- `features/super-admin/components/SuperAdminCommandCentre.tsx` — **Required**
- `features/super-admin/components/SuperAdminDashboard.tsx` — **Not verified**
- `features/super-admin/components/SuperAdminGlobalSearch.tsx` — **Required**
- `features/super-admin/components/SuperAdminGrantsPanel.tsx` — **Required**
- `features/super-admin/components/SuperAdminMonitoringWidgets.tsx` — **Not verified**
- `features/super-admin/components/SuperAdminNotificationsPanel.tsx` — **Required**
- `features/super-admin/components/SuperAdminPlatformPanel.tsx` — **Required**
- `features/super-admin/components/SuperAdminQuickActions.tsx` — **Required**
- `features/super-admin/components/SuperAdminShell.tsx` — **Probably removable**
- `features/super-admin/components/SuperAdminUsersPanel.tsx` — **Required**
- `features/super-admin/components/premium/EnterpriseAdminShell.tsx` — **Not verified**
- `features/super-admin/components/premium/EnterpriseAdminToolbar.tsx` — **Not verified**
- `features/super-admin/components/premium/EnterpriseDashboardStandard.tsx` — **Not verified**
- `features/super-admin/components/premium/EnterpriseEngineAdminShell.tsx` — **Not verified**
- `features/super-admin/components/premium/OmegaStatusBar.tsx` — **Not verified**
- `features/super-admin/components/premium/SuperAdminBreadcrumbs.tsx` — **Not verified**
- `features/super-admin/components/premium/SuperAdminCommandPalette.tsx` — **Required**
- `features/super-admin/components/premium/SuperAdminPremiumDashboard.tsx` — **Not verified**
- `features/super-admin/components/premium/SuperAdminSearchToolbar.tsx` — **Not verified**
- `features/super-admin/device-lifecycle-manager/DeviceLifecycleManagerAdmin.tsx` — **Required**
- `features/super-admin/enterprise-ai-operating-system/EnterpriseAiOperatingSystemAdmin.tsx` — **Required**
- `features/super-admin/enterprise-automation-hub/EnterpriseAutomationHubAdmin.tsx` — **Required**
- `features/super-admin/enterprise-autonomous-execution-engine/EnterpriseAutonomousExecutionAdmin.tsx` — **Required**
- `features/super-admin/enterprise-business-intelligence/EnterpriseBiAdmin.tsx` — **Required**
- `features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin.tsx` — **Required**
- `features/super-admin/enterprise-compliance-center/EnterpriseComplianceCenterAdmin.tsx` — **Required**
- `features/super-admin/enterprise-core/EnterpriseCore.tsx` — **Required**
- `features/super-admin/enterprise-deployment-center/EnterpriseDeploymentCenterAdmin.tsx` — **Required**
- `features/super-admin/enterprise-development-center/EnterpriseDevelopmentAdmin.tsx` — **Required**
- `features/super-admin/enterprise-e2e-validation-engine/EnterpriseE2eValidationAdmin.tsx` — **Required**
- `features/super-admin/enterprise-governance-center/EnterpriseGovernanceAdmin.tsx` — **Required**
- `features/super-admin/enterprise-launch-readiness-engine/EnterpriseLaunchReadinessAdmin.tsx` — **Required**
- `features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin.tsx` — **Required**
- `features/super-admin/enterprise-mobile-control-center/EnterpriseMobileControlCenterAdmin.tsx` — **Required**
- `features/super-admin/enterprise-module-registry/EnterpriseModuleRegistryAdmin.tsx` — **Required**
- `features/super-admin/enterprise-observability-center/EnterpriseObservabilityAdmin.tsx` — **Required**
- `features/super-admin/enterprise-security-operations-center/EnterpriseSocAdmin.tsx` — **Required**
- `features/super-admin/enterprise-workflow-engine/EnterpriseWorkflowEngineAdmin.tsx` — **Required**
- `features/super-admin/executive-command/ExecutiveCommandAdmin.tsx` — **Required**
- `features/super-admin/experience-v3/ExperienceShell.tsx` — **Required**
- `features/super-admin/homepage-builder-engine/HomepageBuilderEngineAdmin.tsx` — **Required**
- `features/super-admin/homepage-enterprise-certification-engine/HomepageEnterpriseCertificationAdmin.tsx` — **Required**
- `features/super-admin/incident-command-center/IncidentCommandCenterAdmin.tsx` — **Required**
- `features/super-admin/incident-response-center/IncidentResponseCenterAdmin.tsx` — **Required**
- `features/super-admin/incident-timeline/IncidentTimelineAdmin.tsx` — **Required**
- `features/super-admin/integrations-engine/IntegrationsEngineAdmin.tsx` — **Required**
- `features/super-admin/launch-certification/CertificationDashboard.tsx` — **Required**
- `features/super-admin/live-analytics/LiveAnalyticsCenter.tsx` — **Required**
- `features/super-admin/live-analytics/components/AnimatedNumber.tsx` — **Probably removable**
- `features/super-admin/live-analytics/components/LiveAnalyticsToolbar.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LiveCitiesSection.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LiveCountriesSection.tsx` — **Required**
- `features/super-admin/live-analytics/components/LiveDimensionPanel.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LiveEventFeed.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LivePerformanceSection.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LiveVisitorMetricsCard.tsx` — **Not verified**
- `features/super-admin/live-analytics/components/LiveWorldMap.tsx` — **Probably required**
- `features/super-admin/live-analytics/components/MiniSparkline.tsx` — **Probably removable**
- `features/super-admin/marketplace-intelligence/MarketplaceIntelligenceAdmin.tsx` — **Required**
- `features/super-admin/marketplace-os/MosControlCenter.tsx` — **Required**
- `features/super-admin/marketplace/DeleteAllListingsPanel.tsx` — **Required**
- `features/super-admin/messages-engine/MessagesEngineAdmin.tsx` — **Required**
- `features/super-admin/mission-control-engine/MissionControlEngineAdmin.tsx` — **Required**
- `features/super-admin/mission-control/AiManagerPanel.tsx` — **Required**
- `features/super-admin/mission-control/BannerManagerPanel.tsx` — **Required**
- `features/super-admin/mission-control/DeveloperToolsPanel.tsx` — **Required**
- `features/super-admin/mission-control/FeatureManagerPanel.tsx` — **Required**
- `features/super-admin/mission-control/HomepageBuilderPanel.tsx` — **Required**
- `features/super-admin/mission-control/MissionControlAutoRefresh.tsx` — **Required**
- `features/super-admin/mission-control/MissionControlCenterV2.tsx` — **Required**
- `features/super-admin/mission-control/MissionControlShortcutGrid.tsx` — **Not verified**
- `features/super-admin/mission-control/QuickListingPanel.tsx` — **Required**
- `features/super-admin/mission-control/ResponsivePreviewFrame.tsx` — **Required**
- `features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin.tsx` — **Required**
- `features/super-admin/notifications-engine/NotificationsEngineAdmin.tsx` — **Required**
- `features/super-admin/omega-command-center/OmegaCommandCenterAdmin.tsx` — **Required**
- `features/super-admin/omega-command-center/OmegaEngineAdmin.tsx` — **Not verified**
- `features/super-admin/omega-development-director/OmegaDevelopmentDirectorAdmin.tsx` — **Required**
- `features/super-admin/omega-enterprise-mobile/OmegaEnterpriseMobileAdmin.tsx` — **Required**
- `features/super-admin/omega-global-ui-integrity-engine/OmegaGlobalUiIntegrityAdmin.tsx` — **Required**
- `features/super-admin/omega-quality-assurance-center/OmegaQualityAssuranceAdmin.tsx` — **Required**
- `features/super-admin/operations-center/OperationsCenterAdmin.tsx` — **Required**
- `features/super-admin/operations/AiEmergencySection.tsx` — **Required**
- `features/super-admin/operations/AiIncidentHistorySection.tsx` — **Not verified**
- `features/super-admin/operations/AiLiveMonitoringSection.tsx` — **Not verified**
- `features/super-admin/operations/AiOperationsAssistantSection.tsx` — **Required**
- `features/super-admin/operations/AiOperationsCenter.tsx` — **Required**
- `features/super-admin/operations/AiOperationsLogsSection.tsx` — **Required**
- `features/super-admin/operations/AiOperationsSummaryCards.tsx` — **Not verified**
- `features/super-admin/operations/AiPerformanceSection.tsx` — **Not verified**
- `features/super-admin/operations/AiPlatformScanSection.tsx` — **Required**
- `features/super-admin/operations/AiRecommendationsSection.tsx` — **Not verified**
- `features/super-admin/operations/AiRepairCenterSection.tsx` — **Required**
- `features/super-admin/operations/AiSecuritySection.tsx` — **Not verified**
- `features/super-admin/operations/AiSelfHealingSection.tsx` — **Required**
- `features/super-admin/orders-engine/OrdersEngineAdmin.tsx` — **Required**
- `features/super-admin/organic-growth/OrganicGrowthDashboard.tsx` — **Required**
- `features/super-admin/payments-engine/PaymentsEngineAdmin.tsx` — **Required**
- `features/super-admin/platform-studio/PlatformStudio.tsx` — **Required**
- `features/super-admin/platform-visual/MenuBuilderPanel.tsx` — **Required**
- `features/super-admin/platform-visual/ThemeStudioPanel.tsx` — **Required**
- `features/super-admin/platform-visual/ThemeStudioPro.tsx` — **Required**
- `features/super-admin/platform-visual/studio-pro/VisualCanvas.tsx` — **Required**
- `features/super-admin/premium-design/PremiumAssetManagerPanel.tsx` — **Required**
- `features/super-admin/production-assets/ProductionAssetValidatorPanel.tsx` — **Required**
- `features/super-admin/promotion-management/UserPromotionsAdmin.tsx` — **Required**
- `features/super-admin/protection-engine/ProtectionEngineAdmin.tsx` — **Required**
- `features/super-admin/recovery-center/RecoveryCenterAdmin.tsx` — **Required**
- `features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx` — **Required**
- `features/super-admin/search-engine/SearchEngineAdmin.tsx` — **Required**
- `features/super-admin/security-engine/SecurityEngineAdmin.tsx` — **Required**
- `features/super-admin/shipping-engine/ShippingEngineAdmin.tsx` — **Required**
- `features/super-admin/shipping-engine/ShippingProvidersPanel.tsx` — **Required**
- `features/super-admin/staff-profile/StaffProfileAdmin.tsx` — **Required**
- `features/super-admin/visual-cms/VisualCmsAdmin.tsx` — **Required**
- `features/super-admin/wallet-engine/WalletEngineAdmin.tsx` — **Required**

### Additional groups (outside requested modules)

#### Auth (32)
- `components/auth/AuthBackButton.tsx` — **Not verified**
- `components/auth/AuthIconInput.tsx` — **Required**
- `components/auth/AuthInput.tsx` — **Probably removable**
- `components/auth/AuthPasswordInput.tsx` — **Required**
- `components/auth/AuthRouteLayout.tsx` — **Required**
- `components/auth/Checkbox.tsx` — **Probably removable**
- `components/auth/PasswordInput.tsx` — **Probably removable**
- `components/auth/RovexoSignOutLink.tsx` — **Required**
- `features/auth/components/AuthField.tsx` — **Required**
- `features/auth/components/AuthForm.tsx` — **Required**
- `features/auth/components/AuthOAuthButtons.tsx` — **Probably required**
- `features/auth/components/AuthPasswordField.tsx` — **Required**
- `features/auth/components/AuthSelect.tsx` — **Not verified**
- `features/auth/components/ForgotPasswordScreen.tsx` — **Required**
- `features/auth/components/LoginRememberRow.tsx` — **Probably removable**
- `features/auth/components/LoginScreen.tsx` — **Required**
- `features/auth/components/MfaChallengeScreen.tsx` — **Required**
- `features/auth/components/RegisterFields.tsx` — **Required**
- `features/auth/components/RegisterScreen.tsx` — **Required**
- `features/auth/components/RequireSuperAdmin.tsx` — **Required**
- `features/auth/components/ResetPasswordChecklist.tsx` — **Not verified**
- `features/auth/components/ResetPasswordFields.tsx` — **Required**
- `features/auth/components/ResetPasswordScreen.tsx` — **Required**
- `features/auth/components/ResetPasswordStrengthMeter.tsx` — **Not verified**
- `features/auth/components/RoleGuard.tsx` — **Probably removable**
- `features/auth/components/SuperAdminGuard.tsx` — **Probably removable**
- `features/auth/components/VerifyEmailScreen.tsx` — **Required**
- `features/auth/hooks/use-profile.ts` — **Not verified**
- `features/auth/hooks/use-role.ts` — **Probably removable**
- `features/auth/providers/AuthProvider.tsx` — **Required**
- `features/auth/providers/AvatarProvider.tsx` — **Required**
- `lib/auth/bootstrap.ts` — **Not verified**

#### Checkout (19)
- `app/(platform)/checkout/error.tsx` — **Not verified**
- `features/cart/components/CartCheckoutSheet.tsx` — **Required**
- `features/cart/components/CartPage.tsx` — **Required**
- `features/checkout/components/BuyNowPublicErrorDialog.tsx` — **Not verified**
- `features/checkout/components/CheckoutDeliverySection.tsx` — **Probably required**
- `features/checkout/components/CheckoutGuardBlocked.tsx` — **Not verified**
- `features/checkout/components/CheckoutPage.tsx` — **Required**
- `features/checkout/components/CheckoutPageHeader.tsx` — **Not verified**
- `features/checkout/components/CheckoutPriceSummary.tsx` — **Required**
- `features/checkout/components/CheckoutProcessingOverlay.tsx` — **Not verified**
- `features/checkout/components/CheckoutProductSummary.tsx` — **Not verified**
- `features/checkout/components/CheckoutReturnPolicy.tsx` — **Not verified**
- `features/checkout/components/CheckoutSuccessView.tsx` — **Required**
- `features/checkout/components/CheckoutWizardV1.tsx` — **Required**
- `features/checkout/hooks/use-buy-now-navigation.ts` — **Probably required**
- `features/checkout/hooks/use-checkout-form.ts` — **Required**
- `features/commerce-ui/components/CheckoutLineItem.tsx` — **Required**
- `lib/checkout/checkout-session-self-heal-client-v1.ts` — **Not verified**
- `lib/checkout/use-saved-payment-methods.ts` — **Required**

#### Chrome/Providers (22)
- `components/Header.tsx` — **Required**
- `components/header/HeaderBringYourItemCta.tsx` — **Not verified**
- `components/header/HeaderCategoryBar.tsx` — **Required**
- `components/header/HeaderProfileLink.tsx` — **Not verified**
- `components/header/HeaderSearchBar.tsx` — **Not verified**
- `components/header/RovexoHeaderV2.tsx` — **Required**
- `components/header/RvxTopBar.tsx` — **Not verified**
- `components/icons/BottomNavIcon3D.tsx` — **Not verified**
- `components/layout/AppChromeScrollProvider.tsx` — **Probably removable**
- `components/layout/AppShellLayout.tsx` — **Required**
- `components/layout/AuthChromeDeferred.tsx` — **Required**
- `components/layout/CanonicalPageShell.tsx` — **Not verified**
- `components/layout/HubPageMain.tsx` — **Probably removable**
- `components/layout/PlatformChromeProviders.tsx` — **Probably removable**
- `components/layout/UniversalUiBoundary.tsx` — **Required**
- `components/providers/PageVisibilityProvider.tsx` — **Required**
- `components/pwa/PwaProvider.tsx` — **Required**
- `components/ui/BottomNavV2Icon.tsx` — **Not verified**
- `components/ui/BottomNavigation.tsx` — **Required**
- `components/ui/Toast.tsx` — **Required**
- `features/header/HeaderProvider.tsx` — **Required**
- `features/header/hooks/use-header-badges.ts` — **Probably removable**

#### Notifications (7)
- `components/NotificationBell.tsx` — **Not verified**
- `components/buyer/BuyerNotifications.tsx` — **Not verified**
- `components/header/NotificationsBellLink.tsx` — **Probably removable**
- `features/notifications/components/NotificationBell.tsx` — **Not verified**
- `features/notifications/components/PushPermissionPrompt.tsx` — **Required**
- `features/notifications/components/PushSubscriptionManager.tsx` — **Required**
- `features/notifications/components/RealtimeNotificationProvider.tsx` — **Required**

#### Other (204)
- `app/(platform)/buyer/error.tsx` — **Probably removable**
- `app/(platform)/inbox/error.tsx` — **Probably removable**
- `app/(platform)/messages/error.tsx` — **Probably removable**
- `app/(platform)/search/error.tsx` — **Probably removable**
- `app/(platform)/seller/error.tsx` — **Probably removable**
- `app/(platform)/staff/calls/page.tsx` — **Probably removable**
- `app/(platform)/staff/directory/page.tsx` — **Probably removable**
- `app/(platform)/staff/messages/page.tsx` — **Probably removable**
- `app/(platform)/staff/page.tsx` — **Probably removable**
- `app/(platform)/user/[username]/error.tsx` — **Not verified**
- `app/(platform)/user/[username]/followers/loading.tsx` — **Probably required**
- `app/(platform)/user/[username]/following/loading.tsx` — **Probably required**
- `app/(platform)/user/[username]/loading.tsx` — **Required**
- `app/error.tsx` — **Probably removable**
- `app/global-error.tsx` — **Probably removable**
- `components/analytics/GoogleAnalytics.tsx` — **Required**
- `components/analytics/GoogleAnalyticsPageView.tsx` — **Required**
- `components/analytics/GoogleAnalyticsQueuedEvents.tsx` — **Required**
- `components/analytics/VisitorPresenceBeacon.tsx` — **Required**
- `components/beta/BetaAppShell.tsx` — **Required**
- `components/brand/RovexoAppIconMark.tsx` — **Probably removable**
- `components/brand/RovexoLogo.tsx` — **Not verified**
- `components/brand/RovexoWordmark.tsx` — **Not verified**
- `components/branding/CanonicalRx3dSplashGate.tsx` — **Required**
- `components/branding/CanonicalRx3dSplashVisual.tsx` — **Not verified**
- `components/buyer/BuyerAddresses.tsx` — **Not verified**
- `components/buyer/BuyerDashboard.tsx` — **Probably required**
- `components/buyer/BuyerHeader.tsx` — **Not verified**
- `components/buyer/BuyerHero.tsx` — **Probably removable**
- `components/buyer/BuyerLogout.tsx` — **Probably removable**
- `components/buyer/BuyerMessages.tsx` — **Not verified**
- `components/buyer/BuyerOrderHistory.tsx` — **Not verified**
- `components/buyer/BuyerOrders.tsx` — **Not verified**
- `components/buyer/BuyerPayments.tsx` — **Not verified**
- `components/buyer/BuyerProfileCard.tsx` — **Not verified**
- `components/buyer/BuyerProtection.tsx` — **Not verified**
- `components/buyer/BuyerQuickActions.tsx` — **Probably removable**
- `components/buyer/BuyerRecentlyViewed.tsx` — **Not verified**
- `components/buyer/BuyerReviews.tsx` — **Not verified**
- `components/buyer/BuyerSavedListings.tsx` — **Not verified**
- `components/buyer/BuyerSection.tsx` — **Not verified**
- `components/buyer/BuyerSecurity.tsx` — **Not verified**
- `components/buyer/BuyerSettings.tsx` — **Probably removable**
- `components/buyer/BuyerStatistics.tsx` — **Not verified**
- `components/buyer/BuyerSupport.tsx` — **Not verified**
- `components/buyer/BuyerTrustCard.tsx` — **Probably removable**
- `components/celebration/CelebrationAnimation.tsx` — **Required**
- `components/empty-state/TeddyAnimation.tsx` — **Probably removable**
- `components/empty-state/TeddyEmptyState.tsx` — **Probably removable**
- `components/errors/ForbiddenBackButton.tsx` — **Required**
- `components/fail-closed/FailClosedBoundary.tsx` — **Not verified**
- `components/fail-closed/FailClosedPanel.tsx` — **Not verified**
- `components/follow/FollowButton.tsx` — **Required**
- `components/icons/CategoryIcon3D.tsx` — **Not verified**
- `components/icons/DashboardIcon3D.tsx` — **Not verified**
- `components/icons/HomeCategoryIcon3D.tsx` — **Not verified**
- `components/icons/HubSectionIcon.tsx` — **Not verified**
- `components/icons/ModuleIcon.tsx` — **Probably removable**
- `components/icons/PremiumNavIcon.tsx` — **Not verified**
- `components/icons/RovexoGlassIcon.tsx` — **Probably removable**
- `components/icons/RovexoIcon.tsx` — **Not verified**
- `components/legal/CookieConsentBanner.tsx` — **Required**
- `components/mobile/MobileScrollBootstrap.tsx` — **Probably removable**
- `components/navigation/CanonicalPageHeader.tsx` — **Not verified**
- `components/navigation/NavigationPathRecorder.tsx` — **Required**
- `components/navigation/PageBack.tsx` — **Not verified**
- `components/navigation/RovexoHeaderCloseButton.tsx` — **Required**
- `components/preview/Run3PadPreviewGate.tsx` — **Required**
- `components/preview/Run3PreviewHub.tsx` — **Required**
- `components/preview/Run4InternalPadGate.tsx` — **Required**
- `components/preview/Run4InternalPreviewHub.tsx` — **Required**
- `components/profile/ProfileFooterBanner.tsx` — **Not verified**
- `components/promotions/PromotionAnalyticsBeacon.tsx` — **Required**
- `components/promotions/PromotionRealtimeRefresher.tsx` — **Required**
- `components/promotions/cards-v1/PromotionCardsPage.tsx` — **Required**
- `components/promotions/cards-v1/PromotionListingPicker.tsx` — **Required**
- `components/promotions/cards-v1/PromotionPackagePicker.tsx` — **Required**
- `components/promotions/cards-v1/PromotionPaymentMethodSelector.tsx` — **Required**
- `components/promotions/cards-v1/PromotionPreview.tsx` — **Not verified**
- `components/runtime/ChunkLoadRecovery.tsx` — **Required**
- `components/share/ShareListingSheet.tsx` — **Required**
- `components/store/StoreUnavailablePage.tsx` — **Required**
- `features/analytics/components/AnalyticsDoughnutChart.tsx` — **Not verified**
- `features/analytics/components/AnalyticsExportSection.tsx` — **Probably required**
- `features/analytics/components/AnalyticsGeographicSection.tsx` — **Required**
- `features/analytics/components/AnalyticsHeader.tsx` — **Required**
- `features/analytics/components/AnalyticsOverviewGrid.tsx` — **Not verified**
- `features/analytics/components/AnalyticsPromotionsSection.tsx` — **Not verified**
- `features/analytics/components/AnalyticsRangeAction.tsx` — **Required**
- `features/analytics/components/AnalyticsRecentActivitySection.tsx` — **Not verified**
- `features/analytics/components/BusinessAnalyticsPage.tsx` — **Probably required**
- `features/analytics/components/SellerAnalyticsPage.tsx` — **Probably required**
- `features/analytics/hooks/use-analytics-data.ts` — **Required**
- `features/bundle/BundleReviewPage.tsx` — **Required**
- `features/bundle/GlobalStickyBundleBar.tsx` — **Required**
- `features/bundle/StickyBundleBar.tsx` — **Not verified**
- `features/commerce-ui/components/ParcelOperations.tsx` — **Required**
- `features/commerce-ui/components/ParcelTrackingCard.tsx` — **Not verified**
- `features/dashboard/components/AnimatedCounter.tsx` — **Required**
- `features/dashboard/components/DashboardHeader.tsx` — **Required**
- `features/dashboard/components/DashboardPerformanceSection.tsx` — **Required**
- `features/dashboard/components/DashboardQuickAccess.tsx` — **Not verified**
- `features/dashboard/components/DashboardSummaryGrid.tsx` — **Not verified**
- `features/dashboard/components/DashboardTile.tsx` — **Not verified**
- `features/dashboard/components/LogoutButton.tsx` — **Required**
- `features/dashboard/components/ProfileCard.tsx` — **Not verified**
- `features/help/components/DecisionTreeWizard.tsx` — **Required**
- `features/help/components/HelpArticlePage.tsx` — **Required**
- `features/help/components/HelpAssistant.tsx` — **Probably removable**
- `features/help/components/HelpCategoryHubPage.tsx` — **Not verified**
- `features/help/components/HelpCentrePage.tsx` — **Required**
- `features/help/components/HelpFaqPage.tsx` — **Required**
- `features/help/components/HelpPoliciesPage.tsx` — **Not verified**
- `features/help/components/HelpRelatedContent.tsx` — **Not verified**
- `features/help/components/HelpResolutionPrompt.tsx` — **Probably required**
- `features/help/components/HelpSolutionView.tsx` — **Not verified**
- `features/integrations-engine/IntegrationsEngineHub.tsx` — **Required**
- `features/launch/components/RecordRecentlyViewed.tsx` — **Required**
- `features/legal/components/LegalDocumentCanonical.tsx` — **Probably required**
- `features/legal/components/LegalDocumentPage.tsx` — **Probably required**
- `features/legal/components/LegalIndexCanonical.tsx` — **Probably required**
- `features/mobile-ui/components/MobileHubCard.tsx` — **Not verified**
- `features/mobile-ui/components/MobileHubFolderIcon.tsx` — **Not verified**
- `features/mobile-ui/components/MobileHubNav.tsx` — **Probably removable**
- `features/mobile-ui/components/MobileHubNavigator.tsx` — **Not verified**
- `features/mobile-ui/components/MobileHubSections.tsx` — **Not verified**
- `features/mobile-ui/components/MobilePrimaryHubFolder.tsx` — **Not verified**
- `features/mobile-ui/components/MobilePrimaryHubs.tsx` — **Required**
- `features/mobile-ui/hooks/use-mobile-badges.ts` — **Not verified**
- `features/mobile-ui/hooks/use-mobile-hub-profile.ts` — **Required**
- `features/monetization/components/PlansPage.tsx` — **Required**
- `features/profile/components/CanonicalProfileAvatar.tsx` — **Required**
- `features/profile/components/FollowListLoadingShell.tsx` — **Not verified**
- `features/profile/components/FollowListPage.tsx` — **Required**
- `features/profile/components/ProfileAvatarEditor.tsx` — **Required**
- `features/profile/components/ProfileBioEditor.tsx` — **Required**
- `features/profile/components/ProfileCommandCentreButton.tsx` — **Not verified**
- `features/profile/components/ViewProfilePage.tsx` — **Required**
- `features/promote/components/StoreAnalytics.tsx` — **Not verified**
- `features/promote/components/StoreShowcase.tsx` — **Not verified**
- `features/promote/components/StoreShowcaseCheckout.tsx` — **Required**
- `features/promote/components/StoreShowcasePanel.tsx` — **Required**
- `features/promote/components/StoreShowcaseSuccess.tsx` — **Not verified**
- `features/protection/components/ProtectionCaseActions.tsx` — **Required**
- `features/shipping/ShippingEngineHub.tsx` — **Required**
- `features/shipping/components/LabelCard.tsx` — **Required**
- `features/shipping/components/ParcelCard.tsx` — **Required**
- `features/shipping/components/ShipmentSummary.tsx` — **Not verified**
- `features/shipping/components/ShipmentWizard.tsx` — **Required**
- `features/shipping/components/ShippingCard.tsx` — **Not verified**
- `features/shipping/components/ShippingLabelViewer.tsx` — **Required**
- `features/shipping/components/ShippingSummary.tsx` — **Not verified**
- `features/shipping/components/ShippingTrackingTimeline.tsx` — **Not verified**
- `features/shipping/components/TrackingCard.tsx` — **Required**
- `features/size/components/CustomSizeModal.tsx` — **Required**
- `features/size/components/SizeGuideModal.tsx` — **Not verified**
- `features/size/components/SizeSelector.tsx` — **Required**
- `features/staff-enterprise/StaffEnterpriseShell.tsx` — **Required**
- `features/staff-enterprise/useStaffCall.ts` — **Required**
- `features/staff-enterprise/useStaffMessages.ts` — **Required**
- `features/store/components/StoreVisitPageV2.tsx` — **Required**
- `features/support/components/SupportForm.tsx` — **Required**
- `features/support/components/SupportSuccessPage.tsx` — **Not verified**
- `features/trust/components/TrustCenterPage.tsx` — **Not verified**
- `features/trust/components/TrustScoreMeter.tsx` — **Required**
- `features/trust/components/TrustTierBadge.tsx` — **Not verified**
- `features/trust/components/TrustVerificationActions.tsx` — **Required**
- `features/wholesale/components/RfqSubmitForm.tsx` — **Required**
- `features/wholesale/components/WholesalePricingManager.tsx` — **Required**
- `hooks/buyer/BuyerDashboardProvider.tsx` — **Required**
- `hooks/navigation/usePageBack.ts` — **Required**
- `hooks/use-body-scroll-lock.ts` — **Required**
- `hooks/use-focus-trap.ts` — **Required**
- `hooks/use-mobile-input-scroll.ts` — **Required**
- `lib/bring-your-item/certification.ts` — **Not verified**
- `lib/help/session.ts` — **Probably required**
- `lib/i18n/provider.tsx` — **Required**
- `lib/i18n/use-translation.ts` — **Probably required**
- `lib/media/use-card-image-src.ts` — **Required**
- `lib/messages/prepare-message-photo-v1.ts` — **Probably required**
- `lib/messages/resolve-message-photo-url.client.ts` — **Not verified**
- `lib/motion/use-prefers-reduced-motion.ts` — **Required**
- `lib/navigation/link-icons.tsx` — **Probably removable**
- `lib/ops/performance-audit.ts` — **Not verified**
- `lib/performance/hooks.ts` — **Required**
- `lib/push/client-subscribe.ts` — **Probably required**
- `lib/react/use-client-hydrated.ts` — **Required**
- `lib/supabase/client.ts` — **Probably required**
- `lib/views/use-live-product-views.ts` — **Required**
- `lib/views/view-live-sync.ts` — **Required**
- `scripts/cert-run6-zero-lag.ts` — **Probably required**
- `src/components/canonical/CanonicalAccountHeader.tsx` — **Probably removable**
- `src/components/canonical/CanonicalButton.tsx` — **Not verified**
- `src/components/canonical/CanonicalCheckbox.tsx` — **Not verified**
- `src/components/canonical/CanonicalInput.tsx` — **Not verified**
- `src/components/canonical/CanonicalMenuRow.tsx` — **Not verified**
- `src/components/canonical/CanonicalModal.tsx` — **Required**
- `src/components/canonical/CanonicalPageHeader.tsx` — **Not verified**
- `src/components/canonical/CanonicalPageLayout.tsx` — **Not verified**
- `src/components/canonical/CanonicalRadio.tsx` — **Not verified**
- `src/components/canonical/CanonicalSection.tsx` — **Not verified**
- `src/components/canonical/CanonicalSelector.tsx` — **Not verified**
- `src/components/canonical/CanonicalSwitch.tsx` — **Not verified**
- `src/components/canonical/dialogs/CanonicalConfirmDialog.tsx` — **Required**

#### UI primitives (19)
- `components/ui/Avatar.tsx` — **Required**
- `components/ui/Checkbox.tsx` — **Probably required**
- `components/ui/Dialog.tsx` — **Not verified**
- `components/ui/ListingCard.tsx` — **Required**
- `components/ui/ModalContainer.tsx` — **Required**
- `components/ui/NativeImageFileInput.tsx` — **Not verified**
- `components/ui/Pagination.tsx` — **Not verified**
- `components/ui/PremiumEmptyStateImage.tsx` — **Not verified**
- `components/ui/PrimaryButton.tsx` — **Not verified**
- `components/ui/ProductRowImage.tsx` — **Not verified**
- `components/ui/Radio.tsx` — **Probably required**
- `components/ui/SafeImage.tsx` — **Required**
- `components/ui/ScrollContainer.tsx` — **Not verified**
- `components/ui/SearchBar.tsx` — **Required**
- `components/ui/Select.tsx` — **Probably required**
- `components/ui/SkeletonFade.tsx` — **Not verified**
- `components/ui/Tabs.tsx` — **Not verified**
- `components/ui/Textarea.tsx` — **Probably required**
- `components/ui/motion.tsx` — **Not verified**


### Flat path list (759)

```
app/(platform)/account/error.tsx
app/(platform)/account/promotion-tools/error.tsx
app/(platform)/account/settings/error.tsx
app/(platform)/balance/error.tsx
app/(platform)/buyer/error.tsx
app/(platform)/checkout/error.tsx
app/(platform)/inbox/error.tsx
app/(platform)/listing/[slug]/error.tsx
app/(platform)/messages/error.tsx
app/(platform)/orders/error.tsx
app/(platform)/search/error.tsx
app/(platform)/seller/error.tsx
app/(platform)/settings/error.tsx
app/(platform)/staff/calls/page.tsx
app/(platform)/staff/directory/page.tsx
app/(platform)/staff/messages/page.tsx
app/(platform)/staff/page.tsx
app/(platform)/super-admin/pricing/page.tsx
app/(platform)/super-admin/promotion-catalog/page.tsx
app/(platform)/super-admin/staff/page.tsx
app/(platform)/user/[username]/error.tsx
app/(platform)/user/[username]/followers/loading.tsx
app/(platform)/user/[username]/following/loading.tsx
app/(platform)/user/[username]/loading.tsx
app/(platform)/wallet/bank-account/error.tsx
app/(platform)/wallet/bank-accounts/error.tsx
app/(platform)/wallet/error.tsx
app/(platform)/wallet/locked/error.tsx
app/(platform)/wallet/payment-methods/error.tsx
app/(platform)/wallet/pending/error.tsx
app/(platform)/wallet/processing/error.tsx
app/(platform)/wallet/transactions/error.tsx
app/(platform)/wallet/withdraw/error.tsx
app/error.tsx
app/global-error.tsx
components/Header.tsx
components/NotificationBell.tsx
components/analytics/GoogleAnalytics.tsx
components/analytics/GoogleAnalyticsPageView.tsx
components/analytics/GoogleAnalyticsQueuedEvents.tsx
components/analytics/VisitorPresenceBeacon.tsx
components/auth/AuthBackButton.tsx
components/auth/AuthIconInput.tsx
components/auth/AuthInput.tsx
components/auth/AuthPasswordInput.tsx
components/auth/AuthRouteLayout.tsx
components/auth/Checkbox.tsx
components/auth/PasswordInput.tsx
components/auth/RovexoSignOutLink.tsx
components/auth/SocialButton.tsx
components/auth/SocialLogin.tsx
components/beta/BetaAppShell.tsx
components/brand/RovexoAppIconMark.tsx
components/brand/RovexoLogo.tsx
components/brand/RovexoWordmark.tsx
components/branding/CanonicalRx3dSplashGate.tsx
components/branding/CanonicalRx3dSplashVisual.tsx
components/buyer/BuyerAddresses.tsx
components/buyer/BuyerDashboard.tsx
components/buyer/BuyerHeader.tsx
components/buyer/BuyerHero.tsx
components/buyer/BuyerLogout.tsx
components/buyer/BuyerMessages.tsx
components/buyer/BuyerNotifications.tsx
components/buyer/BuyerOrderHistory.tsx
components/buyer/BuyerOrders.tsx
components/buyer/BuyerPayments.tsx
components/buyer/BuyerProfileCard.tsx
components/buyer/BuyerProtection.tsx
components/buyer/BuyerQuickActions.tsx
components/buyer/BuyerRecentlyViewed.tsx
components/buyer/BuyerReviews.tsx
components/buyer/BuyerSavedListings.tsx
components/buyer/BuyerSection.tsx
components/buyer/BuyerSecurity.tsx
components/buyer/BuyerSettings.tsx
components/buyer/BuyerStatistics.tsx
components/buyer/BuyerSupport.tsx
components/buyer/BuyerTrustCard.tsx
components/celebration/CelebrationAnimation.tsx
components/empty-state/TeddyAnimation.tsx
components/empty-state/TeddyEmptyState.tsx
components/errors/ForbiddenBackButton.tsx
components/fail-closed/FailClosedBoundary.tsx
components/fail-closed/FailClosedPanel.tsx
components/follow/FollowButton.tsx
components/header/HeaderBringYourItemCta.tsx
components/header/HeaderCategoryBar.tsx
components/header/HeaderProfileLink.tsx
components/header/HeaderSearchBar.tsx
components/header/HomepageHeaderShareButton.tsx
components/header/NotificationsBellLink.tsx
components/header/RovexoHeaderV2.tsx
components/header/RvxTopBar.tsx
components/home/HomeCategoryIconImage.tsx
components/home/HomePageShell.tsx
components/home/HomepageHeader.tsx
components/home/HomepageSearchField.tsx
components/home/ImageSearchCamera.tsx
components/home/MobileHeaderScrollContext.tsx
components/home/ProductSectionStates.tsx
components/home/RovexoAllListings.tsx
components/home/RovexoAllListingsGrid.tsx
components/home/RovexoBringYourItemCta.tsx
components/home/RovexoCategoryCard.tsx
components/home/RovexoCategoryRail.tsx
components/home/RovexoFooterNavigation.tsx
components/home/RovexoMobileHeaderScrollContext.tsx
components/home/RovexoShowcaseRails.tsx
components/home/RovexoShowcaseSection.tsx
components/home/hooks/useInfiniteCarousel.ts
components/home/hooks/useMarketplaceFeedColumns.ts
components/home/hooks/useVirtualizedFeedWindow.ts
components/home/stores/StoreCard.tsx
components/home/stores/StoresHeader.tsx
components/home/stores/StoresSection.tsx
components/homepage-v3/HomepageV3.tsx
components/homepage-v3/HomepageV3BringYourItem.tsx
components/homepage-v3/HomepageV3CategoryRail.tsx
components/homepage-v3/HomepageV3Feed.tsx
components/homepage-v3/HomepageV3Header.tsx
components/homepage-v3/HomepageV3ListingRail.tsx
components/homepage-v3/HomepageV3Search.tsx
components/homepage-v3/HomepageV3Showcase.tsx
components/homepage-v4/HomepageV4.tsx
components/homepage-v4/HomepageV4BringYourItem.tsx
components/homepage-v4/HomepageV4CategoryRail.tsx
components/homepage-v4/HomepageV4Featured.tsx
components/homepage-v4/HomepageV4Feed.tsx
components/homepage-v4/HomepageV4Header.tsx
components/homepage-v4/HomepageV4Search.tsx
components/homepage-v4/HomepageV4Showcase.tsx
components/homepage/canonical/CanonicalCategoryRail.tsx
components/homepage/canonical/CanonicalHomepage.tsx
components/homepage/canonical/CanonicalMarketplaceFeed.tsx
components/homepage/canonical/HomepageEmptyState.tsx
components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx
components/homepage/canonical/featured-store/FeaturedStoreSection.tsx
components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx
components/homepage/canonical/featured-store/StoreProfileCard.tsx
components/icons/BottomNavIcon3D.tsx
components/icons/CategoryIcon3D.tsx
components/icons/DashboardIcon3D.tsx
components/icons/HomeCategoryIcon3D.tsx
components/icons/HubSectionIcon.tsx
components/icons/ModuleIcon.tsx
components/icons/PremiumNavIcon.tsx
components/icons/RovexoGlassIcon.tsx
components/icons/RovexoIcon.tsx
components/layout/AppChromeScrollProvider.tsx
components/layout/AppShellLayout.tsx
components/layout/AuthChromeDeferred.tsx
components/layout/CanonicalPageShell.tsx
components/layout/HubPageMain.tsx
components/layout/PlatformChromeProviders.tsx
components/layout/UniversalUiBoundary.tsx
components/legal/CookieConsentBanner.tsx
components/listing/ListingAttributeIcon.tsx
components/listing/ListingAttributeLabel.tsx
components/listing/ListingAttributeRow.tsx
components/listing/ListingAttributeValue.tsx
components/mobile/MobileScrollBootstrap.tsx
components/navigation/CanonicalPageHeader.tsx
components/navigation/NavigationPathRecorder.tsx
components/navigation/PageBack.tsx
components/navigation/RovexoHeaderCloseButton.tsx
components/preview/Run3PadPreviewGate.tsx
components/preview/Run3PreviewHub.tsx
components/preview/Run4InternalPadGate.tsx
components/preview/Run4InternalPreviewHub.tsx
components/profile/ProfileFooterBanner.tsx
components/promotions/PromotionAnalyticsBeacon.tsx
components/promotions/PromotionRealtimeRefresher.tsx
components/promotions/cards-v1/PromotionCardsPage.tsx
components/promotions/cards-v1/PromotionListingPicker.tsx
components/promotions/cards-v1/PromotionPackagePicker.tsx
components/promotions/cards-v1/PromotionPaymentMethodSelector.tsx
components/promotions/cards-v1/PromotionPreview.tsx
components/providers/PageVisibilityProvider.tsx
components/pwa/PwaProvider.tsx
components/runtime/ChunkLoadRecovery.tsx
components/sell/PublishSuccessDialog.tsx
components/sell/PublishingOverlay.tsx
components/share/ShareListingSheet.tsx
components/store/StoreUnavailablePage.tsx
components/ui/Avatar.tsx
components/ui/BottomNavV2Icon.tsx
components/ui/BottomNavigation.tsx
components/ui/Checkbox.tsx
components/ui/Dialog.tsx
components/ui/ListingCard.tsx
components/ui/ModalContainer.tsx
components/ui/NativeImageFileInput.tsx
components/ui/Pagination.tsx
components/ui/PremiumEmptyStateImage.tsx
components/ui/PrimaryButton.tsx
components/ui/ProductRowImage.tsx
components/ui/Radio.tsx
components/ui/SafeImage.tsx
components/ui/ScrollContainer.tsx
components/ui/SearchBar.tsx
components/ui/Select.tsx
components/ui/SkeletonFade.tsx
components/ui/Tabs.tsx
components/ui/Textarea.tsx
components/ui/Toast.tsx
components/ui/motion.tsx
features/account-canonical/MyAccountTemplate.tsx
features/account-canonical/header/AccountCanonicalHeader.tsx
features/account-canonical/shell/AccountCanonicalShell.tsx
features/account-center/components/AccountCanonicalProfile.tsx
features/account-center/components/AccountCenterDeleteButton.tsx
features/account-center/components/AccountCenterHome.tsx
features/account-center/components/AccountCenterLogoutButton.tsx
features/account-center/components/AccountCenterModulePage.tsx
features/account-center/components/AccountMenuSections.tsx
features/account-center/components/AccountSellerPerformanceCard.tsx
features/account-center/components/BuyingHubPage.tsx
features/account-center/components/BuyingMenuSections.tsx
features/account-center/components/HolidayModeProfileRow.tsx
features/account-center/components/MasterMenuIcon.tsx
features/account-center/components/MessagesHubPage.tsx
features/account-center/components/RecentlyViewedPage.tsx
features/account-center/components/SellingMenuSections.tsx
features/account-center/components/VerificationHubPage.tsx
features/account-center/hooks/useAccountHubLive.ts
features/account-module/components/BringYourItemPage.tsx
features/account-module/components/DeleteAccountFlow.tsx
features/account-module/components/PromotionToolEntryV1.tsx
features/account-module/components/PromotionToolsV1.tsx
features/account-module/components/ReviewsV1.tsx
features/account-module/components/RovexoIdeasPage.tsx
features/account-module/components/SavedItemsV1.tsx
features/account-module/components/SellerListingsV1.tsx
features/account-module/components/SettingsMenuIcon.tsx
features/account-module/components/SettingsMenuSections.tsx
features/account-module/components/SettingsV1.tsx
features/account/components/AccountBlockedUsersPage.tsx
features/account/components/AccountBuyerPreferencesPage.tsx
features/account/components/AccountCurrencyPage.tsx
features/account/components/AccountDevicesPage.tsx
features/account/components/AccountLanguagePage.tsx
features/account/components/AccountPrivacyPage.tsx
features/account/components/AccountSecurityPage.tsx
features/account/components/AccountSecurityResetViaEmailPage.tsx
features/account/components/AccountSessionsPage.tsx
features/account/components/AccountTimezonePage.tsx
features/account/components/AccountTwoFactorPage.tsx
features/account/components/AvatarUploader.tsx
features/account/components/CardSetupSheet.tsx
features/account/components/CookiePreferencesPage.tsx
features/account/components/EmailChangeForm.tsx
features/account/components/PasswordChangeForm.tsx
features/account/components/ProfileEditPage.tsx
features/account/components/addresses/AddressCard.tsx
features/account/components/addresses/AddressForm.tsx
features/account/components/addresses/AddressesPage.tsx
features/account/components/addresses/AddressesTabs.tsx
features/account/components/addresses/BusinessAddressForm.tsx
features/account/components/addresses/BusinessAddresses.tsx
features/account/components/addresses/EditAddress.tsx
features/account/components/addresses/PersonalAddresses.tsx
features/admin/components/AdminPromotionsPage.tsx
features/admin/components/HelpAdminDashboard.tsx
features/admin/components/ModerationDashboard.tsx
features/admin/components/MonetizationAdminDashboard.tsx
features/admin/components/PlatformAnalyticsDashboard.tsx
features/admin/components/ProductionOperationsDashboard.tsx
features/admin/components/SellerPerformanceAdminDashboard.tsx
features/admin/components/SeoAdminDashboard.tsx
features/admin/components/SeoAnalyticsDashboard.tsx
features/admin/components/SeoHealthCenter.tsx
features/admin/components/TrustAdminDashboard.tsx
features/admin/components/TrustReviewActions.tsx
features/analytics/components/AnalyticsDoughnutChart.tsx
features/analytics/components/AnalyticsExportSection.tsx
features/analytics/components/AnalyticsGeographicSection.tsx
features/analytics/components/AnalyticsHeader.tsx
features/analytics/components/AnalyticsOverviewGrid.tsx
features/analytics/components/AnalyticsPromotionsSection.tsx
features/analytics/components/AnalyticsRangeAction.tsx
features/analytics/components/AnalyticsRecentActivitySection.tsx
features/analytics/components/BusinessAnalyticsPage.tsx
features/analytics/components/SellerAnalyticsPage.tsx
features/analytics/hooks/use-analytics-data.ts
features/auth/components/AuthField.tsx
features/auth/components/AuthForm.tsx
features/auth/components/AuthOAuthButtons.tsx
features/auth/components/AuthPasswordField.tsx
features/auth/components/AuthSelect.tsx
features/auth/components/ForgotPasswordScreen.tsx
features/auth/components/LoginRememberRow.tsx
features/auth/components/LoginScreen.tsx
features/auth/components/MfaChallengeScreen.tsx
features/auth/components/RegisterFields.tsx
features/auth/components/RegisterScreen.tsx
features/auth/components/RequireSuperAdmin.tsx
features/auth/components/ResetPasswordChecklist.tsx
features/auth/components/ResetPasswordFields.tsx
features/auth/components/ResetPasswordScreen.tsx
features/auth/components/ResetPasswordStrengthMeter.tsx
features/auth/components/RoleGuard.tsx
features/auth/components/SuperAdminGuard.tsx
features/auth/components/VerifyEmailScreen.tsx
features/auth/hooks/use-profile.ts
features/auth/hooks/use-role.ts
features/auth/hooks/use-super-admin.ts
features/auth/providers/AuthProvider.tsx
features/auth/providers/AvatarProvider.tsx
features/bundle/BundleReviewPage.tsx
features/bundle/GlobalStickyBundleBar.tsx
features/bundle/StickyBundleBar.tsx
features/business/dashboard/components/BusinessDashboardHeader.tsx
features/business/dashboard/components/BusinessMenuSections.tsx
features/business/inventory/components/BusinessInventoryPage.tsx
features/cart/components/CartCheckoutSheet.tsx
features/cart/components/CartPage.tsx
features/checkout/components/BuyNowPublicErrorDialog.tsx
features/checkout/components/CheckoutDeliverySection.tsx
features/checkout/components/CheckoutGuardBlocked.tsx
features/checkout/components/CheckoutPage.tsx
features/checkout/components/CheckoutPageHeader.tsx
features/checkout/components/CheckoutPriceSummary.tsx
features/checkout/components/CheckoutProcessingOverlay.tsx
features/checkout/components/CheckoutProductSummary.tsx
features/checkout/components/CheckoutReturnPolicy.tsx
features/checkout/components/CheckoutSuccessView.tsx
features/checkout/components/CheckoutWizardV1.tsx
features/checkout/hooks/use-buy-now-navigation.ts
features/checkout/hooks/use-checkout-form.ts
features/command-centre/AdminCommandCentreShell.tsx
features/command-centre/CommandCentreLayout.tsx
features/command-centre/SuperAdminPageHeader.tsx
features/commerce-ui/components/CheckoutLineItem.tsx
features/commerce-ui/components/ParcelOperations.tsx
features/commerce-ui/components/ParcelTrackingCard.tsx
features/dashboard/components/AnimatedCounter.tsx
features/dashboard/components/DashboardHeader.tsx
features/dashboard/components/DashboardPerformanceSection.tsx
features/dashboard/components/DashboardQuickAccess.tsx
features/dashboard/components/DashboardSummaryGrid.tsx
features/dashboard/components/DashboardTile.tsx
features/dashboard/components/LogoutButton.tsx
features/dashboard/components/ProfileCard.tsx
features/header/HeaderProvider.tsx
features/header/hooks/use-header-badges.ts
features/help/components/DecisionTreeWizard.tsx
features/help/components/HelpArticlePage.tsx
features/help/components/HelpAssistant.tsx
features/help/components/HelpCategoryHubPage.tsx
features/help/components/HelpCentrePage.tsx
features/help/components/HelpFaqPage.tsx
features/help/components/HelpPoliciesPage.tsx
features/help/components/HelpRelatedContent.tsx
features/help/components/HelpResolutionPrompt.tsx
features/help/components/HelpSolutionView.tsx
features/home/components/FollowingFeedSection.tsx
features/home/hooks/use-product-watchlist.ts
features/inbox/components/ConversationHub.tsx
features/inbox/components/InboxPage.tsx
features/inbox/components/PlatformFeeSheet.tsx
features/inbox/components/TransactionActionBar.tsx
features/inbox/components/TransactionStatusCard.tsx
features/inbox/hooks/use-owner-demo-mode.ts
features/integrations-engine/IntegrationsEngineHub.tsx
features/launch/components/RecordRecentlyViewed.tsx
features/legal/components/LegalDocumentCanonical.tsx
features/legal/components/LegalDocumentPage.tsx
features/legal/components/LegalIndexCanonical.tsx
features/messages/hooks/use-chat-realtime.ts
features/mobile-ui/components/MobileHubCard.tsx
features/mobile-ui/components/MobileHubFolderIcon.tsx
features/mobile-ui/components/MobileHubNav.tsx
features/mobile-ui/components/MobileHubNavigator.tsx
features/mobile-ui/components/MobileHubSections.tsx
features/mobile-ui/components/MobilePrimaryHubFolder.tsx
features/mobile-ui/components/MobilePrimaryHubs.tsx
features/mobile-ui/hooks/use-mobile-badges.ts
features/mobile-ui/hooks/use-mobile-hub-profile.ts
features/monetization/components/PlansPage.tsx
features/notifications/components/NotificationBell.tsx
features/notifications/components/NotificationSettingsPage.tsx
features/notifications/components/PushPermissionPrompt.tsx
features/notifications/components/PushSubscriptionManager.tsx
features/notifications/components/RealtimeNotificationProvider.tsx
features/orders/components/BuyerCancelOrderCard.tsx
features/orders/components/BuyerOrderDetailCanonical.tsx
features/orders/components/IssueResolutionLink.tsx
features/orders/components/OrderActionsCard.tsx
features/orders/components/OrderCheckoutConfirmation.tsx
features/orders/components/OrderDetailView.tsx
features/orders/components/OrderReviewCard.tsx
features/orders/components/OrdersListItem.tsx
features/orders/components/OrdersPage.tsx
features/orders/components/SellerFulfillmentCard.tsx
features/orders/components/SellerOrderFulfillment.tsx
features/product-detail/AddToBundleSheet.tsx
features/product-detail/AddedToCartToast.tsx
features/product-detail/ProductActionBarV1.tsx
features/product-detail/ProductDescriptionV1.tsx
features/product-detail/ProductDetailPage.tsx
features/product-detail/ProductFullscreenImageViewer.tsx
features/product-detail/ProductGalleryV1.tsx
features/product-detail/ProductInformationRows.tsx
features/product-detail/ProductListingActionsMenu.tsx
features/product-detail/ProductPageChrome.tsx
features/product-detail/ProductQuantityStepper.tsx
features/product-detail/ProductRecentlyViewed.tsx
features/product-detail/ProductReportDialog.tsx
features/product-detail/ProductStockStatus.tsx
features/product-detail/ProductStoreSection.tsx
features/product-detail/ProductViewsLive.tsx
features/product-detail/RecordProductViewBeacon.tsx
features/product-detail/SellerReportDialog.tsx
features/product-detail/use-product-action-bar.ts
features/product-detail/use-product-offer-negotiation.ts
features/profile/components/CanonicalProfileAvatar.tsx
features/profile/components/FollowListLoadingShell.tsx
features/profile/components/FollowListPage.tsx
features/profile/components/ProfileAvatarEditor.tsx
features/profile/components/ProfileBioEditor.tsx
features/profile/components/ProfileCommandCentreButton.tsx
features/profile/components/ViewProfilePage.tsx
features/promote/components/StoreAnalytics.tsx
features/promote/components/StoreShowcase.tsx
features/promote/components/StoreShowcaseCheckout.tsx
features/promote/components/StoreShowcasePanel.tsx
features/promote/components/StoreShowcaseSuccess.tsx
features/protection/components/ProtectionCaseActions.tsx
features/search/client.ts
features/search/components/ImageSearchView.tsx
features/search/components/MarketplaceNoProductsEmpty.tsx
features/search/components/ProductResults.tsx
features/search/components/SavedSearchesPanel.tsx
features/search/components/SearchCategoryBrowseCard.tsx
features/search/components/SearchFilters.tsx
features/search/components/SearchInputActions.tsx
features/search/components/SearchLandingClient.tsx
features/search/components/SearchLandingView.tsx
features/search/components/SearchLocationFilter.tsx
features/search/components/SearchOverlay.tsx
features/search/components/SearchProvider.tsx
features/search/components/SearchResultCard.tsx
features/search/components/SearchResultsEmpty.tsx
features/search/components/SearchResultsView.tsx
features/search/components/SearchScopeChips.tsx
features/search/components/SearchSuggestionList.tsx
features/search/components/SearchTypeaheadPanel.tsx
features/search/components/SuggestedSearches.tsx
features/search/hooks/use-debounced-value.ts
features/search/hooks/use-search-keyboard.ts
features/search/hooks/use-search-overlay-state.ts
features/search/hooks/use-search-overlay.tsx
features/search/hooks/use-search-results.ts
features/sell/components/FieldError.tsx
features/sell/context/SellProvider.tsx
features/sell/hooks/use-sell-page-bottom-clearance.ts
features/sell/hooks/use-sell-progressive-flow.ts
features/sell/hooks/useDraftListing.ts
features/sell/hooks/usePhotoUpload.ts
features/sell/hooks/usePublishListing.ts
features/sell/ui/DeletePhotoAction.tsx
features/sell/ui/SellCategoryBlock.tsx
features/sell/ui/SellCategoryPicker.tsx
features/sell/ui/SellCategorySuggestion.tsx
features/sell/ui/SellDescriptionBlock.tsx
features/sell/ui/SellOptionPicker.tsx
features/sell/ui/SellPage.tsx
features/sell/ui/SellParcelBlock.tsx
features/sell/ui/SellPhotoFileInput.tsx
features/sell/ui/SellPhotoRail.tsx
features/sell/ui/SellPickerLeadingMark.tsx
features/sell/ui/SellPricingBlock.tsx
features/sell/ui/SellPrimitives.tsx
features/sell/ui/SellProgressiveAttributes.tsx
features/sell/ui/SellPublishBar.tsx
features/sell/ui/SellStockQuantityBlock.tsx
features/sell/ui/SellTitleBlock.tsx
features/seller-performance/components/SellerPerformanceFactorCard.tsx
features/seller-performance/components/SellerPerformanceHistorySection.tsx
features/seller-performance/components/SellerPerformanceScoreMeter.tsx
features/seller/compliance/ComplianceDashboard.tsx
features/seller/listings/components/PromotionPicker.tsx
features/seller/listings/components/RestockListingDialog.tsx
features/seller/listings/components/SellerListingOverflowMenu.tsx
features/seller/marketplace/components/MarketplaceConnectorCard.tsx
features/seller/marketplace/components/MarketplaceConnectorSettingsModal.tsx
features/seller/marketplace/components/MarketplaceConnectorsPage.tsx
features/seller/marketplace/hooks/use-marketplace-connectors.ts
features/seller/migration/components/HeroSlideVisual.tsx
features/seller/migration/components/MigrationBulkPublishPanel.tsx
features/seller/migration/components/MigrationCenterPage.tsx
features/seller/migration/components/MigrationSourceFields.tsx
features/seller/migration/components/MigrationStepIndicator.tsx
features/seller/migration/components/StoreMigrationHeroBanner.tsx
features/seller/migration/components/inline/MigrationImportProgressPanel.tsx
features/seller/migration/components/inline/MigrationInlinePreviewPanel.tsx
features/seller/migration/components/inline/MigrationItemReviewPanel.tsx
features/seller/migration/components/inline/MigrationValidationList.tsx
features/seller/migration/components/steps/MigrationConnectStep.tsx
features/seller/migration/components/steps/MigrationImportStep.tsx
features/seller/migration/components/steps/MigrationPlatformStep.tsx
features/seller/migration/components/steps/MigrationProgressStep.tsx
features/seller/migration/components/steps/MigrationReportStep.tsx
features/seller/migration/hooks/use-inline-import-preview.ts
features/seller/migration/hooks/use-migration-poll.ts
features/seller/migration/hooks/use-migration-publish-poll.ts
features/seller/migration/hooks/use-migration-wizard.ts
features/seller/review-center/components/SellerReviewCasePage.tsx
features/seller/review-center/components/SellerReviewCenterPage.tsx
features/seller/tax/components/SellerTaxRegistrationPage.tsx
features/settings/components/ConfirmDialog.tsx
features/settings/components/LanguagePicker.tsx
features/settings/components/PreferenceToggleRow.tsx
features/settings/components/SettingToggle.tsx
features/shipping/ShippingEngineHub.tsx
features/shipping/components/LabelCard.tsx
features/shipping/components/ParcelCard.tsx
features/shipping/components/ShipmentSummary.tsx
features/shipping/components/ShipmentWizard.tsx
features/shipping/components/ShippingCard.tsx
features/shipping/components/ShippingLabelViewer.tsx
features/shipping/components/ShippingSummary.tsx
features/shipping/components/ShippingTrackingTimeline.tsx
features/shipping/components/TrackingCard.tsx
features/size/components/CustomSizeModal.tsx
features/size/components/SizeGuideModal.tsx
features/size/components/SizeSelector.tsx
features/staff-enterprise/StaffEnterpriseShell.tsx
features/staff-enterprise/useStaffCall.ts
features/staff-enterprise/useStaffMessages.ts
features/store/components/StoreVisitPageV2.tsx
features/super-admin/ai-engine/AiEngineAdmin.tsx
features/super-admin/analytics-engine/AnalyticsEngineAdmin.tsx
features/super-admin/app-studio/AppStudio.tsx
features/super-admin/app-studio/AppStudioSimulator.tsx
features/super-admin/asset-manager/AssetManagerAdmin.tsx
features/super-admin/audit-compliance/AuditComplianceCenterAdmin.tsx
features/super-admin/certification-center/CertificationCenterAdmin.tsx
features/super-admin/command-center-v1/CommandCenterLiveProvider.tsx
features/super-admin/command-center-v1/CommandCenterV1.tsx
features/super-admin/command-center-v1/components/ActivityFeed.tsx
features/super-admin/command-center-v1/components/ChartsPanel.tsx
features/super-admin/command-center-v1/components/CommandCenterWorldMap.tsx
features/super-admin/command-center-v1/components/CriticalAlertsBar.tsx
features/super-admin/command-center-v1/components/GlobalSearchBar.tsx
features/super-admin/command-center-v1/components/HealthScoresPanel.tsx
features/super-admin/command-center-v1/components/LiveStatusBadge.tsx
features/super-admin/command-center-v1/components/MetricCard.tsx
features/super-admin/command-center-v1/components/MetricSection.tsx
features/super-admin/command-center-v1/components/NotificationsPanel.tsx
features/super-admin/command-center-v1/components/QuickActionsGrid.tsx
features/super-admin/command-center-v1/components/StatusHeader.tsx
features/super-admin/command-center-v2/CommandCenterV2.tsx
features/super-admin/command-center-v2/components/CcAnimatedCounter.tsx
features/super-admin/command-center-v2/components/CcDonutChart.tsx
features/super-admin/command-center-v2/components/CcHeader.tsx
features/super-admin/command-center-v2/components/CcLineChart.tsx
features/super-admin/command-center-v2/components/CcSparkline.tsx
features/super-admin/command-os-v4/CommandOsShell.tsx
features/super-admin/components/LiveCountriesPanel.tsx
features/super-admin/components/OwnerDemoModePanel.tsx
features/super-admin/components/PreferredMarketplaceStoresPanel.tsx
features/super-admin/components/SuperAdminAuditLog.tsx
features/super-admin/components/SuperAdminAutomationPanel.tsx
features/super-admin/components/SuperAdminCommandCentre.tsx
features/super-admin/components/SuperAdminDashboard.tsx
features/super-admin/components/SuperAdminGlobalSearch.tsx
features/super-admin/components/SuperAdminGrantsPanel.tsx
features/super-admin/components/SuperAdminMonitoringWidgets.tsx
features/super-admin/components/SuperAdminNotificationsPanel.tsx
features/super-admin/components/SuperAdminPlatformPanel.tsx
features/super-admin/components/SuperAdminQuickActions.tsx
features/super-admin/components/SuperAdminShell.tsx
features/super-admin/components/SuperAdminUsersPanel.tsx
features/super-admin/components/premium/EnterpriseAdminShell.tsx
features/super-admin/components/premium/EnterpriseAdminToolbar.tsx
features/super-admin/components/premium/EnterpriseDashboardStandard.tsx
features/super-admin/components/premium/EnterpriseEngineAdminShell.tsx
features/super-admin/components/premium/OmegaStatusBar.tsx
features/super-admin/components/premium/SuperAdminBreadcrumbs.tsx
features/super-admin/components/premium/SuperAdminCommandPalette.tsx
features/super-admin/components/premium/SuperAdminPremiumDashboard.tsx
features/super-admin/components/premium/SuperAdminSearchToolbar.tsx
features/super-admin/device-lifecycle-manager/DeviceLifecycleManagerAdmin.tsx
features/super-admin/enterprise-ai-operating-system/EnterpriseAiOperatingSystemAdmin.tsx
features/super-admin/enterprise-automation-hub/EnterpriseAutomationHubAdmin.tsx
features/super-admin/enterprise-autonomous-execution-engine/EnterpriseAutonomousExecutionAdmin.tsx
features/super-admin/enterprise-business-intelligence/EnterpriseBiAdmin.tsx
features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin.tsx
features/super-admin/enterprise-compliance-center/EnterpriseComplianceCenterAdmin.tsx
features/super-admin/enterprise-core/EnterpriseCore.tsx
features/super-admin/enterprise-deployment-center/EnterpriseDeploymentCenterAdmin.tsx
features/super-admin/enterprise-development-center/EnterpriseDevelopmentAdmin.tsx
features/super-admin/enterprise-e2e-validation-engine/EnterpriseE2eValidationAdmin.tsx
features/super-admin/enterprise-governance-center/EnterpriseGovernanceAdmin.tsx
features/super-admin/enterprise-launch-readiness-engine/EnterpriseLaunchReadinessAdmin.tsx
features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin.tsx
features/super-admin/enterprise-mobile-control-center/EnterpriseMobileControlCenterAdmin.tsx
features/super-admin/enterprise-module-registry/EnterpriseModuleRegistryAdmin.tsx
features/super-admin/enterprise-observability-center/EnterpriseObservabilityAdmin.tsx
features/super-admin/enterprise-security-operations-center/EnterpriseSocAdmin.tsx
features/super-admin/enterprise-workflow-engine/EnterpriseWorkflowEngineAdmin.tsx
features/super-admin/executive-command/ExecutiveCommandAdmin.tsx
features/super-admin/experience-v3/ExperienceShell.tsx
features/super-admin/hmrc/HmrcSettingsPanel.tsx
features/super-admin/homepage-builder-engine/HomepageBuilderEngineAdmin.tsx
features/super-admin/homepage-enterprise-certification-engine/HomepageEnterpriseCertificationAdmin.tsx
features/super-admin/incident-command-center/IncidentCommandCenterAdmin.tsx
features/super-admin/incident-response-center/IncidentResponseCenterAdmin.tsx
features/super-admin/incident-timeline/IncidentTimelineAdmin.tsx
features/super-admin/integrations-engine/IntegrationsEngineAdmin.tsx
features/super-admin/launch-certification/CertificationDashboard.tsx
features/super-admin/live-analytics/LiveAnalyticsCenter.tsx
features/super-admin/live-analytics/components/AnimatedNumber.tsx
features/super-admin/live-analytics/components/LiveAnalyticsToolbar.tsx
features/super-admin/live-analytics/components/LiveCitiesSection.tsx
features/super-admin/live-analytics/components/LiveCountriesSection.tsx
features/super-admin/live-analytics/components/LiveDimensionPanel.tsx
features/super-admin/live-analytics/components/LiveEventFeed.tsx
features/super-admin/live-analytics/components/LivePerformanceSection.tsx
features/super-admin/live-analytics/components/LiveVisitorMetricsCard.tsx
features/super-admin/live-analytics/components/LiveWorldMap.tsx
features/super-admin/live-analytics/components/MiniSparkline.tsx
features/super-admin/marketplace-intelligence/MarketplaceIntelligenceAdmin.tsx
features/super-admin/marketplace-os/MosControlCenter.tsx
features/super-admin/marketplace/DeleteAllListingsPanel.tsx
features/super-admin/messages-engine/MessagesEngineAdmin.tsx
features/super-admin/mission-control-engine/MissionControlEngineAdmin.tsx
features/super-admin/mission-control/AiManagerPanel.tsx
features/super-admin/mission-control/BannerManagerPanel.tsx
features/super-admin/mission-control/DeveloperToolsPanel.tsx
features/super-admin/mission-control/FeatureManagerPanel.tsx
features/super-admin/mission-control/HomepageBuilderPanel.tsx
features/super-admin/mission-control/MissionControlAutoRefresh.tsx
features/super-admin/mission-control/MissionControlCenterV2.tsx
features/super-admin/mission-control/MissionControlShortcutGrid.tsx
features/super-admin/mission-control/QuickListingPanel.tsx
features/super-admin/mission-control/ResponsivePreviewFrame.tsx
features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin.tsx
features/super-admin/notifications-engine/NotificationsEngineAdmin.tsx
features/super-admin/omega-command-center/OmegaCommandCenterAdmin.tsx
features/super-admin/omega-command-center/OmegaEngineAdmin.tsx
features/super-admin/omega-development-director/OmegaDevelopmentDirectorAdmin.tsx
features/super-admin/omega-enterprise-mobile/OmegaEnterpriseMobileAdmin.tsx
features/super-admin/omega-global-ui-integrity-engine/OmegaGlobalUiIntegrityAdmin.tsx
features/super-admin/omega-quality-assurance-center/OmegaQualityAssuranceAdmin.tsx
features/super-admin/operations-center/OperationsCenterAdmin.tsx
features/super-admin/operations/AiEmergencySection.tsx
features/super-admin/operations/AiIncidentHistorySection.tsx
features/super-admin/operations/AiLiveMonitoringSection.tsx
features/super-admin/operations/AiOperationsAssistantSection.tsx
features/super-admin/operations/AiOperationsCenter.tsx
features/super-admin/operations/AiOperationsLogsSection.tsx
features/super-admin/operations/AiOperationsSummaryCards.tsx
features/super-admin/operations/AiPerformanceSection.tsx
features/super-admin/operations/AiPlatformScanSection.tsx
features/super-admin/operations/AiRecommendationsSection.tsx
features/super-admin/operations/AiRepairCenterSection.tsx
features/super-admin/operations/AiSecuritySection.tsx
features/super-admin/operations/AiSelfHealingSection.tsx
features/super-admin/orders-engine/OrdersEngineAdmin.tsx
features/super-admin/organic-growth/OrganicGrowthDashboard.tsx
features/super-admin/payments-engine/PaymentsEngineAdmin.tsx
features/super-admin/platform-studio/PlatformStudio.tsx
features/super-admin/platform-visual/MenuBuilderPanel.tsx
features/super-admin/platform-visual/ThemeStudioPanel.tsx
features/super-admin/platform-visual/ThemeStudioPro.tsx
features/super-admin/platform-visual/studio-pro/VisualCanvas.tsx
features/super-admin/premium-design/PremiumAssetManagerPanel.tsx
features/super-admin/production-assets/ProductionAssetValidatorPanel.tsx
features/super-admin/promotion-management/UserPromotionsAdmin.tsx
features/super-admin/protection-engine/ProtectionEngineAdmin.tsx
features/super-admin/recovery-center/RecoveryCenterAdmin.tsx
features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx
features/super-admin/search-engine/SearchEngineAdmin.tsx
features/super-admin/security-engine/SecurityEngineAdmin.tsx
features/super-admin/shipping-engine/ShippingEngineAdmin.tsx
features/super-admin/shipping-engine/ShippingProvidersPanel.tsx
features/super-admin/staff-profile/StaffProfileAdmin.tsx
features/super-admin/visual-cms/VisualCmsAdmin.tsx
features/super-admin/wallet-engine/WalletEngineAdmin.tsx
features/support/components/SupportForm.tsx
features/support/components/SupportSuccessPage.tsx
features/transaction-hub/CheckoutHubSheet.tsx
features/transaction-hub/MakeOfferSheet.tsx
features/transaction-hub/OfferComposerSheet.tsx
features/transaction-hub/TransactionHubBottomActions.tsx
features/transaction-hub/TransactionHubPaymentSuccess.tsx
features/trust/components/TrustCenterPage.tsx
features/trust/components/TrustScoreMeter.tsx
features/trust/components/TrustTierBadge.tsx
features/trust/components/TrustVerificationActions.tsx
features/wallet/components/AnnualStatementDetail.tsx
features/wallet/components/AnnualStatementsList.tsx
features/wallet/components/BankAccountForm.tsx
features/wallet/components/MonthSummaryGrid.tsx
features/wallet/components/MonthlyStatementDetail.tsx
features/wallet/components/MonthlyStatementsList.tsx
features/wallet/components/PayoutSetupSection.tsx
features/wallet/components/PayoutStatusCard.tsx
features/wallet/components/ProfileBalanceMenuIcon.tsx
features/wallet/components/WalletBankAccountsPage.tsx
features/wallet/components/WalletConnectedBank.tsx
features/wallet/components/WalletHubV1.tsx
features/wallet/components/WalletInsights.tsx
features/wallet/components/WalletMenuSections.tsx
features/wallet/components/WalletPaymentMethodsPage.tsx
features/wallet/components/WalletPayoutsPage.tsx
features/wallet/components/WalletProfileChrome.tsx
features/wallet/components/WalletRecentTransactions.tsx
features/wallet/components/WalletTransactionsList.tsx
features/wallet/components/withdraw/WithdrawAmountStep.tsx
features/wallet/components/withdraw/WithdrawMethodStep.tsx
features/wallet/components/withdraw/WithdrawPage.tsx
features/wallet/components/withdraw/WithdrawReviewStep.tsx
features/wallet/hooks/use-wallet-live.ts
features/wallet/hooks/use-withdraw-flow.ts
features/wholesale/components/RfqSubmitForm.tsx
features/wholesale/components/WholesalePricingManager.tsx
hooks/buyer/BuyerDashboardProvider.tsx
hooks/navigation/usePageBack.ts
hooks/use-body-scroll-lock.ts
hooks/use-focus-trap.ts
hooks/use-mobile-input-scroll.ts
lib/auth/bootstrap.ts
lib/bring-your-item/certification.ts
lib/checkout/checkout-session-self-heal-client-v1.ts
lib/checkout/use-saved-payment-methods.ts
lib/help/session.ts
lib/home/hero-category-sync.tsx
lib/i18n/provider.tsx
lib/i18n/use-translation.ts
lib/media/use-card-image-src.ts
lib/messages/prepare-message-photo-v1.ts
lib/messages/resolve-message-photo-url.client.ts
lib/motion/use-prefers-reduced-motion.ts
lib/navigation/link-icons.tsx
lib/ops/performance-audit.ts
lib/performance/hooks.ts
lib/push/client-subscribe.ts
lib/react/use-client-hydrated.ts
lib/supabase/client.ts
lib/views/use-live-product-views.ts
lib/views/view-live-sync.ts
scripts/cert-run6-zero-lag.ts
src/components/canonical/CanonicalAccountHeader.tsx
src/components/canonical/CanonicalButton.tsx
src/components/canonical/CanonicalCheckbox.tsx
src/components/canonical/CanonicalInput.tsx
src/components/canonical/CanonicalMenuRow.tsx
src/components/canonical/CanonicalModal.tsx
src/components/canonical/CanonicalPageHeader.tsx
src/components/canonical/CanonicalPageLayout.tsx
src/components/canonical/CanonicalRadio.tsx
src/components/canonical/CanonicalSection.tsx
src/components/canonical/CanonicalSelector.tsx
src/components/canonical/CanonicalSwitch.tsx
src/components/canonical/dialogs/CanonicalConfirmDialog.tsx
```

---

# P0 #3 — HOMEPAGE SSR + CLIENT DOUBLE FETCH

## Summary verdict (evidence)

| Question | Answer | Evidence |
|----------|--------|----------|
| Same underlying feed function? | **YES** | Both call `getHomepageFeed` from `lib/products/repository.ts` (API via `lib/products/catalog.ts` re-export) |
| Same HTTP endpoint? | **NO** | SSR: direct server function. Client: `GET /api/homepage/feed?page=1` |
| Same page? | **YES (page 1)** | SSR `fetchHomepageFeed(1)`; client `loadPage(1, "replace")` |
| Same preferred-store resolution? | **YES (both apply)** | SSR: `resolveHomepageV4Sections` → `resolveHomepageFeedItems`; API route: `resolveHomepageFeedItems` for page===1 |
| Showcase reserved filter? | **Both** | SSR filters in `resolveHomepageV4Sections`; client filters `reservedIds` in `CanonicalMarketplaceFeed` |
| Duplicate request (network + server work)? | **YES** | SSR DB work + later browser fetch causes second `getHomepageFeed(1)` |
| Shared cache between SSR and client? | **NO (verified different mechanisms)** | Page `revalidate = 60` (ISR); client `shareInflightJson` TTL **500ms** + `cache: "no-store"` on non-replace paths |
| Parallel vs sequential | **Sequential across tiers** | SSR completes before HTML; client reconcile runs in `useEffect` after mount/hydrate |
| Within SSR | **Parallel** | `Promise.all([visualConfig, feed, showcase, preferredStores])` |

## SSR request

| Field | Evidence |
|-------|----------|
| File | `app/(platform)/page.tsx` |
| Function / Component | `HomePage` (**Server Component**, default export `async function`) |
| Hook | None (RSC) |
| Fetch | `fetchHomepageFeed(1)` from `@/lib/products/queries` |
| Implementation | `queries.ts`: `return getHomepageFeed(page)` |
| Data source | `lib/products/repository.ts` `getHomepageFeed` (`HOMEPAGE_FEED_PAGE_SIZE = 12`) |
| Also parallel | `fetchShowcaseSellerSections()`, `listActivePreferredMarketplaceStores()`, `getPlatformVisualConfig` |
| Post-process | `resolveHomepageV4Sections({ feed: feedResult, showcase, preferredStores, featuredPage: emptyPage })` which calls `resolveHomepageFeedItems` |
| Props path | `<CanonicalHomepage {...sections} />` → feed becomes `initialPage` in `CanonicalMarketplaceFeed` |
| Caching | `export const revalidate = 60` on page |
| Pre-feed await | `await awaitCheckoutSessionSelfHeal("homepage")` (**sequential before** Promise.all) |

## Client request

| Field | Evidence |
|-------|----------|
| File | `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` |
| Function / Component | `CanonicalMarketplaceFeed` (`"use client"`, `memo`) |
| Hook | `useEffect` (mount reconcile) + `useCallback` `loadPage` |
| Fetch | `shareInflightJson("GET:/api/homepage/feed?page=1", "/api/homepage/feed?page=1", { ttlMs: 500 })` |
| Endpoint | `app/api/homepage/feed/route.ts` `GET` |
| API body | `getHomepageFeed(page)`; if `page === 1` also `resolveHomepageFeedItems(result, { preferredStores })` |
| Mode | **Always** `loadPage(1, "replace")` once per mount (`initialFetchDoneRef`) |
| Comment (exact intent) | Lines 151–157: SSR seed can be stale under ISR; client ALWAYS replaces with API |

## Hydration sequence (code-derived timeline)

| Step | Where | What |
|-----:|-------|------|
| 1 | Server | `awaitCheckoutSessionSelfHeal("homepage")` |
| 2 | Server | `Promise.all` feed+showcase+stores+visual |
| 3 | Server | `resolveHomepageV4Sections` → feed page props |
| 4 | Server | Render HTML including seeded feed items in RSC payload / client props |
| 5 | Browser | Download JS for client tree; hydrate `CanonicalHomepage` / feed |
| 6 | Browser | First paint may show `seedItems` from SSR props |
| 7 | Browser | `useEffect` reconcile → `GET /api/homepage/feed?page=1` |
| 8 | Browser | `setItems` replace with API payload (possible UI rewrite) |
| 9 | Browser | Later: IntersectionObserver may `loadPage(n, "append")` for page>1 |

**Measured timings (ms):** **NOT VERIFIED** (no performance trace).

## Finding records (P0 #3)

### F-FETCH-1 — Mandatory client page-1 replace
| Field | Value |
|-------|-------|
| File | `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` |
| Function | `useEffect` → `loadPage(1, "replace")` |
| Component | CanonicalMarketplaceFeed |
| Exact reason | Documented always-on reconcile against ISR staleness. |
| Estimated impact | Second `getHomepageFeed(1)` + network RTT on every Homepage visit |
| Risk | High for mobile LCP/INP/network |
| Regression risk | Medium–High if removed (stale empty feed risk) |
| Complexity | Medium |
| Changes functionality | YES if reconcile removed without alternate freshness |
| Status | Verified |

### F-FETCH-2 — SSR and API share repository function but not request cache
| Field | Value |
|-------|-------|
| File | `lib/products/repository.ts` `getHomepageFeed`; `app/api/homepage/feed/route.ts` |
| Function | `getHomepageFeed` |
| Component | — |
| Exact reason | Identical DB function invoked twice across tiers; no shared React `cache()` across HTTP. |
| Estimated impact | Duplicate DB scan work (`while` eligibility loop in repository) |
| Risk | High under load |
| Regression risk | Medium |
| Complexity | Medium |
| Changes functionality | NO if caching preserves freshness semantics |
| Status | Verified dual invocation path |

### F-FETCH-3 — shareInflightJson only coalesces client callers
| Field | Value |
|-------|-------|
| File | `lib/performance/fetch.ts` `shareInflightJson`; feed uses `ttlMs: 500` |
| Function | `shareInflightJson` |
| Component | CanonicalMarketplaceFeed |
| Exact reason | Soft TTL 500ms helps Strict Mode remount; does **not** reuse SSR result. |
| Estimated impact | Limits duplicate client GETs only |
| Risk | Low |
| Regression risk | Low |
| Complexity | Low |
| Changes functionality | NO |
| Status | Verified |

---

# TOP PRIORITIES (verified findings only)

| Rank | Priority | Finding | Estimated mobile gain | Regression risk | Implementation complexity | LCP | CLS | INP | FCP | TBT |
|-----:|----------|---------|----------------------|-----------------|---------------------------|-----|-----|-----|-----|-----|
| 1 | P0 | F-CSS-1 Global 111-sheet platform index on Homepage | High (remove non-marketplace parse/transfer) | High | High | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 2 | P0 | F-CSS-3 Enterprise/Super Admin CSS on marketplace shell | High | High | High | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 3 | P0 | F-CSS-2 `auth-v1.css` (56 KB) inside platform index | Medium–High | Medium | Medium | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 4 | P0 | F-FETCH-1 Mandatory Homepage client page-1 replace | High (eliminate duplicate feed work/RTT) | Medium–High | Medium | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 5 | P0 | F-FETCH-2 Dual `getHomepageFeed(1)` SSR+API | High under load | Medium | Medium | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 6 | P0 | F-CLI-3 Homepage rooted on Client Component | Medium–High hydration | High (freeze) | High | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| 7 | P0 | F-CLI-1 759 client modules (repo density) | **NOT VERIFIED** on Homepage alone (route splitting unknown) | High | High | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |

**Core Web Vitals columns:** No lab/field measurements in this forensic pass → **NOT VERIFIED** for numeric improvement. Directional mobile gain above is qualitative from code paths only.

---

## Document control

| Field | Value |
|-------|-------|
| Document | `docs/audits/ROVEXO_P0_FORENSIC_PERFORMANCE_AUDIT_v1.md` |
| Version | 1.0 |
| Mode | READ ONLY · FORENSIC |
| Implementation | NONE |
| Commit / Push / Deploy | NONE |

**END OF FORENSIC AUDIT · STOP.**
