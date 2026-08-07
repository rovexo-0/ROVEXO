# ROVEXO — CSS Route Dependency Forensic Audit v1.0 (Phase 1)

**STATUS:** READ ONLY · FORENSIC · NO OPTIMISATION · NO IMPLEMENTATION  
**DATE:** 2026-08-07  
**PARENT:** `docs/audits/ROVEXO_P0_FORENSIC_PERFORMANCE_AUDIT_v1.md`  

**ABSOLUTE:** No CSS changes · no import changes · no refactor · no delete · no commit · no push · no deploy.

**METHOD:** Trace `layout.tsx` / `page.tsx` / feature `import "@/styles/..."` edges and `@import` trees.  
**Gzip estimates:** `zlib.gzipSync` level 9 on source files (not live CDN/Brotli).  
**Tailwind expansion size in production CSSOM:** **NOT VERIFIED**.  
**Selector coverage (true unused):** **NOT VERIFIED** (no Chrome Coverage / Purge run).

**Classification legend:**
- **REQUIRED** — Route cannot render certified UI without it (auth screens ↔ auth-v1; documented).
- **ROUTE SPECIFIC** — Intended for one surface but may still be loaded globally.
- **GLOBAL** — Shared design-system / chrome.
- **PROBABLY UNUSED** — Loaded on route but no matching feature mount / admin-only naming; selector proof absent.
- **NOT VERIFIED** — Insufficient evidence.

---

# Shared baseline (every HTML document)

| Layer | File | Raw bytes | Evidence |
|-------|------|----------:|----------|
| Root layout | `app/layout.tsx` → `app/globals.css` | 6752 | Always |
| Nested from globals | `styles/rovexo/skip-link-v1.css` | 1134 | `@import` in globals |
| Tailwind | `@import "tailwindcss"` inside globals | **NOT VERIFIED** (build output) | Present in source |

Auth routes **do not** load `styles/rovexo/index.css` (platform layout).  
Platform routes **do not** load `styles/rovexo/auth-entry.css` (auth layout).  
**Exception:** `auth-v1.css` is still pulled into platform via `index.css` (see Auth section).

---

# `styles/rovexo/index.css` — full import tree

| Metric | Value |
|--------|------:|
| Entry | `styles/rovexo/index.css` |
| Loaded by | `app/(platform)/layout.tsx` |
| Direct `@import` count | **111** |
| Max import depth | **2** (platform-canonical-ui → 3 children) |
| Total resolved files in tree (excl. index self) | **114** |
| Raw sum (imported files) | **975305** bytes (~952.4 KB) |
| Gzip concat (lvl9) estimate | **132795** bytes (~129.7 KB) |

## Import depth map

| Depth | Meaning | Count |
|------:|---------|------:|
| 0 | `index.css` entry | 1 |
| 1 | Direct `@import` from index | 111 |
| 2 | Nested from `platform-canonical-ui.css` | 3 |

## Nested imports (exact)

Parent: `styles/rovexo/platform-canonical-ui.css`

| Child | Bytes |
|-------|------:|
| `styles/rovexo/account-canonical-v2.css` | 16787 |
| `styles/rovexo/account-settings-ui.css` | 6865 |
| `styles/rovexo/addresses-v1.css` | 6137 |

## Dependency graph (layout → index → sheets)

```mermaid
flowchart TD
  L["app/(platform)/layout.tsx"] --> I["styles/rovexo/index.css"]
  I --> Fstylestokenscss["tokens.css"]
  I --> Fstylesrovexotypographycss["typography.css"]
  I --> Fstylesrovexoformscss["forms.css"]
  I --> Fstylesrovexocardscss["cards.css"]
  I --> Fstylesrovexolistingcardofficialcss["listing-card-official.css"]
  I --> Fstylesrovexostorelistingcardpremiumv1css["store-listing-card-premium-v1.css"]
  I --> Fstylesrovexopromotioncardsv1css["promotion-cards-v1.css"]
  I --> Fstylesrovexoproductdetailv1css["product-detail-v1.css"]
  I --> Fstylesrovexomakeofferv1css["make-offer-v1.css"]
  I --> Fstylesrovexoauthv1css["auth-v1.css"]
  I --> Fstylesrovexoaccounthubv1css["account-hub-v1.css"]
  I --> Fstylesrovexoaccountmodulev1css["account-module-v1.css"]
  I --> Fstylesrovexoplatformcanonicaluicss["platform-canonical-ui.css"]
  I --> Fstylesrovexocanonicaldscss["canonical-ds.css"]
  I --> Fstylesrovexorovexoheaderstandardv1css["rovexo-header-standard-v1.css"]
  I --> Fstylesrovexofullwidthenginev1css["full-width-engine-v1.css"]
  I --> Fstylesrovexoprimarybuttonv1css["primary-button-v1.css"]
  I --> Fstylesrovexomyaccountprimarybuttonv1css["my-account-primary-button-v1.css"]
  I --> Fstylesrovexoaccountsettingsv1css["account-settings-v1.css"]
  I --> Fstylesrovexoaccountsettingscanonicalcss["account-settings-canonical.css"]
  I --> Fstylesrovexowallethubv1css["wallet-hub-v1.css"]
  I --> Fstylesrovexohmrcreportingcentrev1css["hmrc-reporting-centre-v1.css"]
  I --> Fstylesrovexoorderspagev1css["orders-page-v1.css"]
  I --> Fstylesrovexoinboxhubv1css["inbox-hub-v1.css"]
  I --> Fstylesrovexoconversationhubv1css["conversation-hub-v1.css"]
  I --> Fstylesrovexocartv1css["cart-v1.css"]
  I --> Fstylesrovexocheckoutv1css["checkout-v1.css"]
  I --> Fstylesrovexorvxtopbarv1css["rvx-topbar-v1.css"]
  I --> Fstylesrovexoshellcss["shell.css"]
  I --> Fstylesrovexoutilitiescss["utilities.css"]
  I --> Fstylesrovexolayoutcss["layout.css"]
  I --> Fstylesrovexoheaderpremiumcss["header-premium.css"]
  I --> Fstylesrovexobottomnavpremiumcss["bottom-nav-premium.css"]
  I --> Fstylesrovexodashboardcss["dashboard.css"]
  I --> Fstylesrovexomobilescrollv1css["mobile-scroll-v1.css"]
  I --> Fstylesrovexomobilecss["mobile.css"]
  I --> Fstylesrovexoherocss["hero.css"]
  I --> Fstylesrovexoauctionscss["auctions.css"]
  I --> Fstylesrovexochromescrollcss["chrome-scroll.css"]
  I --> Fstylesrovexosignoutcss["sign-out.css"]
  I --> Fstylesrovexohomepolishcss["home-polish.css"]
  I --> Fstylesrovexohomeproductcardscss["home-product-cards.css"]
  I --> Fstylesrovexohomefinalcss["home-final.css"]
  I --> Fstylesrovexohomelaunchpolishcss["home-launch-polish.css"]
  I --> Fstylesrovexohomesectionspremiumcss["home-sections-premium.css"]
  I --> Fstylesrovexohomev1launchpolishcss["home-v1-launch-polish.css"]
  I --> Fstylesrovexohomev1visualqacss["home-v1-visual-qa.css"]
  I --> Fstylesrovexoaccountcss["account.css"]
  I --> Fstylesrovexoaccountcentercss["account-center.css"]
  I --> Fstylesrovexoaccount2026css["account-2026.css"]
  I --> Fstylesrovexorovexoideasv1css["rovexo-ideas-v1.css"]
  I --> Fstylesrovexosecondarybannerscss["secondary-banners.css"]
  I --> Fstylesrovexocategoryrailcss["category-rail.css"]
  I --> Fstylesrovexopremiumemptystatecss["premium-empty-state.css"]
  I --> Fstylesrovexomissioncontrolcss["mission-control.css"]
  I --> Fstylesrovexomissioncontrolv2css["mission-control-v2.css"]
  I --> Fstylesrovexocommandcenterv1css["command-center-v1.css"]
  I --> Fstylesrovexocommandcenterv2css["command-center-v2.css"]
  I --> Fstylesrovexocommandcentreunifiedv1css["command-centre-unified-v1.css"]
  I --> Fstylesrovexobringyouritemcss["bring-your-item.css"]
  I --> Fstylesrovexoplatformvisualcss["platform-visual.css"]
  I --> Fstylesrovexothemestudioprocss["theme-studio-pro.css"]
  I --> Fstylesrovexoplatformstudiocss["platform-studio.css"]
  I --> Fstylesrovexoappstudiocss["app-studio.css"]
  I --> Fstylesrovexoenterprisecorecss["enterprise-core.css"]
  I --> Fstylesrovexoshippingenginecss["shipping-engine.css"]
  I --> Fstylesrovexoordersenginecss["orders-engine.css"]
  I --> Fstylesrovexowalletenginecss["wallet-engine.css"]
  I --> Fstylesrovexopaymentsenginecss["payments-engine.css"]
  I --> Fstylesrovexoprotectionenginecss["protection-engine.css"]
  I --> Fstylesrovexomessagesenginecss["messages-engine.css"]
  I --> Fstylesrovexonotificationsenginecss["notifications-engine.css"]
  I --> Fstylesrovexoanalyticsenginecss["analytics-engine.css"]
  I --> Fstylesrovexosecurityenginecss["security-engine.css"]
  I --> Fstylesrovexosearchenginecss["search-engine.css"]
  I --> Fstylesrovexoaienginecss["ai-engine.css"]
  I --> Fstylesrovexointegrationsenginecss["integrations-engine.css"]
  I --> Fstylesrovexovisualcmscss["visual-cms.css"]
  I --> Fstylesrovexoassetmanagercss["asset-manager.css"]
  I --> Fstylesrovexooperationscentercss["operations-center.css"]
  I --> Fstylesrovexorecoverycentercss["recovery-center.css"]
  I --> Fstylesrovexoauditcompliancecss["audit-compliance.css"]
  I --> Fstylesrovexocertificationcentercss["certification-center.css"]
  I --> Fstylesrovexomobiledistributioncentercss["mobile-distribution-center.css"]
  I --> Fstylesrovexodevicelifecyclemanagercss["device-lifecycle-manager.css"]
  I --> Fstylesrovexoomegaenterprisemobilecss["omega-enterprise-mobile.css"]
  I --> Fstylesrovexoexecutivecommandcss["executive-command.css"]
  I --> Fstylesrovexoincidentcommandcentercss["incident-command-center.css"]
  I --> Fstylesrovexoincidenttimelinecss["incident-timeline.css"]
  I --> Ftylesrovexoenterprisecompliancecentercss["enterprise-compliance-center.css"]
  I --> Fstylesrovexoenterprisemoduleregistrycss["enterprise-module-registry.css"]
  I --> Fstylesrovexoenterpriseworkflowenginecss["enterprise-workflow-engine.css"]
  I --> Fstylesrovexohomepagebuilderenginecss["homepage-builder-engine.css"]
  I --> Fstylesrovexoenterpriseaioscss["enterprise-ai-os.css"]
  I --> Fesrovexoenterprisemobilecontrolcentercss["enterprise-mobile-control-center.css"]
  I --> Ftylesrovexoenterprisedeploymentcentercss["enterprise-deployment-center.css"]
  I --> Fstylesrovexoincidentresponsecentercss["incident-response-center.css"]
  I --> Fstylesrovexoenterprisesoccss["enterprise-soc.css"]
  I --> Fsrovexoenterprisebusinessintelligencecss["enterprise-business-intelligence.css"]
  I --> Fstylesrovexoenterpriseautomationhubcss["enterprise-automation-hub.css"]
  I --> Fstylesrovexoomegacommandcentercss["omega-command-center.css"]
  I --> Fstylesrovexosuperadminpremiumcss["super-admin-premium.css"]
  I --> Fstylesrovexoenterpriseadminunifiedcss["enterprise-admin-unified.css"]
  I --> Fstylesrovexobenefitsrailcss["benefits-rail.css"]
  I --> Fstylesrovexoiconstandardv1css["icon-standard-v1.css"]
  I --> Fstylesrovexodesignstudiov1css["design-studio-v1.css"]
  I --> Fstylesrovexocommandosv4css["command-os-v4.css"]
  I --> Fstylesrovexouniversaluiv1css["universal-ui-v1.css"]
  I --> Fstylesrovexocompactpremiumv1css["compact-premium-v1.css"]
  I --> Fstylesrovexophonewidthv1freezecss["phone-width-v1-freeze.css"]
  I --> Fstylesrovexosellcss["sell.css"]
  Fstylesrovexoplatformcanonicaluicss --> Fstylesrovexoaccountcanonicalv2css["account-canonical-v2.css"]
  Fstylesrovexoplatformcanonicaluicss --> Fstylesrovexoaccountsettingsuicss["account-settings-ui.css"]
  Fstylesrovexoplatformcanonicaluicss --> Fstylesrovexoaddressesv1css["addresses-v1.css"]
```


## Ordered depth-1 imports (111)

1. `styles/tokens.css` (5649 B)
2. `styles/rovexo/typography.css` (2092 B)
3. `styles/rovexo/forms.css` (2766 B)
4. `styles/rovexo/cards.css` (6340 B)
5. `styles/rovexo/listing-card-official.css` (1043 B)
6. `styles/rovexo/store-listing-card-premium-v1.css` (4773 B)
7. `styles/rovexo/promotion-cards-v1.css` (14457 B)
8. `styles/rovexo/product-detail-v1.css` (37396 B)
9. `styles/rovexo/make-offer-v1.css` (3635 B)
10. `styles/rovexo/auth-v1.css` (56419 B)
11. `styles/rovexo/account-hub-v1.css` (5197 B)
12. `styles/rovexo/account-module-v1.css` (26547 B)
13. `styles/rovexo/platform-canonical-ui.css` (4574 B)
14. `styles/rovexo/canonical-ds.css` (23233 B)
15. `styles/rovexo/rovexo-header-standard-v1.css` (1820 B)
16. `styles/rovexo/full-width-engine-v1.css` (12146 B)
17. `styles/rovexo/primary-button-v1.css` (3718 B)
18. `styles/rovexo/my-account-primary-button-v1.css` (272 B)
19. `styles/rovexo/account-settings-v1.css` (5974 B)
20. `styles/rovexo/account-settings-canonical.css` (2652 B)
21. `styles/rovexo/wallet-hub-v1.css` (28565 B)
22. `styles/rovexo/hmrc-reporting-centre-v1.css` (7435 B)
23. `styles/rovexo/orders-page-v1.css` (10001 B)
24. `styles/rovexo/inbox-hub-v1.css` (18227 B)
25. `styles/rovexo/conversation-hub-v1.css` (44422 B)
26. `styles/rovexo/cart-v1.css` (8236 B)
27. `styles/rovexo/checkout-v1.css` (17750 B)
28. `styles/rovexo/rvx-topbar-v1.css` (1542 B)
29. `styles/rovexo/shell.css` (3201 B)
30. `styles/rovexo/utilities.css` (9961 B)
31. `styles/rovexo/layout.css` (9452 B)
32. `styles/rovexo/header-premium.css` (3195 B)
33. `styles/rovexo/bottom-nav-premium.css` (4961 B)
34. `styles/rovexo/dashboard.css` (11934 B)
35. `styles/rovexo/mobile-scroll-v1.css` (8192 B)
36. `styles/rovexo/mobile.css` (6984 B)
37. `styles/rovexo/hero.css` (17218 B)
38. `styles/rovexo/auctions.css` (8495 B)
39. `styles/rovexo/chrome-scroll.css` (1079 B)
40. `styles/rovexo/sign-out.css` (741 B)
41. `styles/rovexo/home-polish.css` (5660 B)
42. `styles/rovexo/home-product-cards.css` (5248 B)
43. `styles/rovexo/home-final.css` (8056 B)
44. `styles/rovexo/home-launch-polish.css` (3126 B)
45. `styles/rovexo/home-sections-premium.css` (7527 B)
46. `styles/rovexo/home-v1-launch-polish.css` (13033 B)
47. `styles/rovexo/home-v1-visual-qa.css` (8210 B)
48. `styles/rovexo/account.css` (7251 B)
49. `styles/rovexo/account-center.css` (13044 B)
50. `styles/rovexo/account-2026.css` (22017 B)
51. `styles/rovexo/rovexo-ideas-v1.css` (13714 B)
52. `styles/rovexo/secondary-banners.css` (2222 B)
53. `styles/rovexo/category-rail.css` (6654 B)
54. `styles/rovexo/premium-empty-state.css` (229 B)
55. `styles/rovexo/mission-control.css` (13920 B)
56. `styles/rovexo/mission-control-v2.css` (11576 B)
57. `styles/rovexo/command-center-v1.css` (15024 B)
58. `styles/rovexo/command-center-v2.css` (17461 B)
59. `styles/rovexo/command-centre-unified-v1.css` (4273 B)
60. `styles/rovexo/bring-your-item.css` (3746 B)
61. `styles/rovexo/platform-visual.css` (2364 B)
62. `styles/rovexo/theme-studio-pro.css` (6386 B)
63. `styles/rovexo/platform-studio.css` (4326 B)
64. `styles/rovexo/app-studio.css` (6084 B)
65. `styles/rovexo/enterprise-core.css` (5161 B)
66. `styles/rovexo/shipping-engine.css` (3742 B)
67. `styles/rovexo/orders-engine.css` (4321 B)
68. `styles/rovexo/wallet-engine.css` (4592 B)
69. `styles/rovexo/payments-engine.css` (4468 B)
70. `styles/rovexo/protection-engine.css` (4998 B)
71. `styles/rovexo/messages-engine.css` (4434 B)
72. `styles/rovexo/notifications-engine.css` (4556 B)
73. `styles/rovexo/analytics-engine.css` (3744 B)
74. `styles/rovexo/security-engine.css` (3948 B)
75. `styles/rovexo/search-engine.css` (3858 B)
76. `styles/rovexo/ai-engine.css` (3786 B)
77. `styles/rovexo/integrations-engine.css` (3737 B)
78. `styles/rovexo/visual-cms.css` (6690 B)
79. `styles/rovexo/asset-manager.css` (4330 B)
80. `styles/rovexo/operations-center.css` (6030 B)
81. `styles/rovexo/recovery-center.css` (5256 B)
82. `styles/rovexo/audit-compliance.css` (5306 B)
83. `styles/rovexo/certification-center.css` (5393 B)
84. `styles/rovexo/mobile-distribution-center.css` (18274 B)
85. `styles/rovexo/device-lifecycle-manager.css` (8059 B)
86. `styles/rovexo/omega-enterprise-mobile.css` (11392 B)
87. `styles/rovexo/executive-command.css` (6579 B)
88. `styles/rovexo/incident-command-center.css` (8447 B)
89. `styles/rovexo/incident-timeline.css` (7640 B)
90. `styles/rovexo/enterprise-compliance-center.css` (9285 B)
91. `styles/rovexo/enterprise-module-registry.css` (6387 B)
92. `styles/rovexo/enterprise-workflow-engine.css` (4881 B)
93. `styles/rovexo/homepage-builder-engine.css` (4072 B)
94. `styles/rovexo/enterprise-ai-os.css` (2840 B)
95. `styles/rovexo/enterprise-mobile-control-center.css` (2750 B)
96. `styles/rovexo/enterprise-deployment-center.css` (2748 B)
97. `styles/rovexo/incident-response-center.css` (3629 B)
98. `styles/rovexo/enterprise-soc.css` (3303 B)
99. `styles/rovexo/enterprise-business-intelligence.css` (2811 B)
100. `styles/rovexo/enterprise-automation-hub.css` (2656 B)
101. `styles/rovexo/omega-command-center.css` (5823 B)
102. `styles/rovexo/super-admin-premium.css` (12698 B)
103. `styles/rovexo/enterprise-admin-unified.css` (11746 B)
104. `styles/rovexo/benefits-rail.css` (1679 B)
105. `styles/rovexo/icon-standard-v1.css` (1059 B)
106. `styles/rovexo/design-studio-v1.css` (9599 B)
107. `styles/rovexo/command-os-v4.css` (3475 B)
108. `styles/rovexo/universal-ui-v1.css` (15428 B)
109. `styles/rovexo/compact-premium-v1.css` (10578 B)
110. `styles/rovexo/phone-width-v1-freeze.css` (5820 B)
111. `styles/rovexo/sell.css` (30063 B)

---

# AUTH CSS — `auth-v1.css`

| Field | Evidence |
|-------|----------|
| File | `styles/rovexo/auth-v1.css` (56419 bytes) |
| Auth entry | `styles/rovexo/auth-entry.css` `@import "./auth-v1.css"` |
| Auth layout | `app/(auth)/layout.tsx` imports `auth-entry.css` |
| Platform entry | `styles/rovexo/index.css` line 13: `@import "./auth-v1.css"` |
| Platform layout | `app/(platform)/layout.tsx` imports `index.css` |

## Why it is loaded (two paths)

1. **Auth path (intended):** Auth layout → auth-entry → auth-v1. Comment in auth-entry: “auth-v1 owns compact/platform auth visuals.”
2. **Platform path (global megabundle):** Platform layout → index → auth-v1. Same file therefore loads on Homepage, Search, Sell, Inbox, etc.

## Auth-entry tree (auth routes only)

| Depth | File | Bytes |
|------:|------|------:|
| 0 | `styles/rovexo/auth-entry.css` | 583 |
| 1 | `styles/tokens.css` | 5649 |
| 1 | `styles/rovexo/typography.css` | 2092 |
| 1 | `styles/rovexo/forms.css` | 2766 |
| 1 | `styles/rovexo/auth-v1.css` | 56419 |
| 1 | `styles/rovexo/primary-button-v1.css` | 3718 |
| 1 | `styles/rovexo/platform-canonical-ui.css` | 4574 |
| 2 | `styles/rovexo/account-canonical-v2.css` | 16787 |
| 2 | `styles/rovexo/account-settings-ui.css` | 6865 |
| 2 | `styles/rovexo/addresses-v1.css` | 6137 |
| 1 | `styles/rovexo/icon-standard-v1.css` | 1059 |

Auth-entry leaf raw sum: **106066** bytes (~103.6 KB); gzip-concat estimate **16.2 KB**.

## Which routes actually require `auth-v1.css`

| Route family | Require? | Evidence |
|--------------|----------|----------|
| Login / Register / Forgot / Reset / Verify (auth group) | **REQUIRED** | Screens use `data-auth-screen` + `.auth-*` classes; freezes/tests assert auth-v1.css |
| Auth-related components under `components/auth/*` | **REQUIRED** when rendered | Class/DOM markers |

## Which routes do NOT require it (mount evidence)

| Route | Require auth-v1? | Evidence |
|-------|------------------|----------|
| Homepage `/` | **PROBABLY UNUSED** | No `data-auth-screen` / auth feature mount in CanonicalHomepage tree |
| Search / Browse / Listing / Sell / Inbox / Orders / Wallet / Profile / Settings / Checkout | **PROBABLY UNUSED** | No auth screen components on these pages; `rg` for `data-auth-screen` outside auth features did not show marketplace pages |
| Admin / Business | **PROBABLY UNUSED** for auth-v1 | Admin uses command-centre shell; still **loads** auth-v1 via index |

Selector-level proof that zero `.auth-*` rules match on Homepage: **NOT VERIFIED** (no coverage).

**Do not propose fixes** (Blood Code).

---

# Route-by-route CSS dependency map


## Homepage

| Field | Value |
|-------|-------|
| Route | `/` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | `styles/homepage-canonical.css`, `styles/homepage-canonical-responsive.css`, `styles/rovexo/header-v2.css` |
| Feature CSS imports (additional) | _(none beyond layout)_ |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **119** |
| Estimated raw KB | **969.2 KB** (992427 bytes) |
| Estimated gzip KB (concat lvl9) | **133.5 KB** (136697 bytes) |
| Critical CSS count (heuristic) | **39** |
| Non-critical CSS count (heuristic) | **80** |
| Files loaded but probably unused here | **79** |
| Notes | Page imports homepage-canonical + header-v2. CanonicalHomepage uses CSS module (not counted in global sheet sum unless separate). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+54 more — full list = admin/enterprise + other-route sheets)_

## Search

| Field | Value |
|-------|-------|
| Route | `/search` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | `styles/rovexo/search-results-v1.css` |
| Feature CSS imports (additional) | `styles/rovexo/search-landing-v1.css`, `styles/rovexo/category-rail.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **118** |
| Estimated raw KB | **975.9 KB** (999307 bytes) |
| Estimated gzip KB (concat lvl9) | **133.9 KB** (137139 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **86** |
| Files loaded but probably unused here | **85** |
| Notes | Page imports search-results-v1; SearchLandingView imports search-landing-v1 + category-rail (category-rail also in index). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+60 more — full list = admin/enterprise + other-route sheets)_

## Browse

| Field | Value |
|-------|-------|
| Route | `/browse` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | `styles/rovexo/search-results-v1.css` |
| Feature CSS imports (additional) | `styles/rovexo/search-landing-v1.css`, `styles/rovexo/category-rail.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **118** |
| Estimated raw KB | **975.9 KB** (999307 bytes) |
| Estimated gzip KB (concat lvl9) | **133.9 KB** (137139 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **86** |
| Files loaded but probably unused here | **85** |
| Notes | Browse page imports search-results-v1; renders SearchLandingView (same extras as Search idle). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+60 more — full list = admin/enterprise + other-route sheets)_

## Listing

| Field | Value |
|-------|-------|
| Route | `/listing/[slug]` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | _(none beyond layout)_ |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **84** |
| Files loaded but probably unused here | **83** |
| Notes | No page-level CSS import; ProductDetailPage has no @/styles import — relies on index product-detail-v1.css / make-offer-v1.css. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+58 more — full list = admin/enterprise + other-route sheets)_

## Sell

| Field | Value |
|-------|-------|
| Route | `/sell` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | _(none beyond layout)_ |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **31** |
| Non-critical CSS count (heuristic) | **85** |
| Files loaded but probably unused here | **84** |
| Notes | SellPage has no direct styles import — relies on index sell.css. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+59 more — full list = admin/enterprise + other-route sheets)_

## Messages

| Field | Value |
|-------|-------|
| Route | `/inbox (canonical); /messages → redirect` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/inbox-hub-v1.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **84** |
| Files loaded but probably unused here | **83** |
| Notes | Canonical UI: app/(platform)/inbox/(list)/page.tsx → InboxPage which re-imports inbox-hub-v1.css (also in index). /messages redirects to inbox messages tab. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+58 more — full list = admin/enterprise + other-route sheets)_

## Orders

| Field | Value |
|-------|-------|
| Route | `/orders` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/orders-page-v1.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **31** |
| Non-critical CSS count (heuristic) | **85** |
| Files loaded but probably unused here | **84** |
| Notes | OrdersPage re-imports orders-page-v1.css (also in index). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+59 more — full list = admin/enterprise + other-route sheets)_

## Wallet

| Field | Value |
|-------|-------|
| Route | `/wallet (canonical); /balance → redirect` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/wallet-hub-v1.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **31** |
| Non-critical CSS count (heuristic) | **85** |
| Files loaded but probably unused here | **83** |
| Notes | WalletHubV1 re-imports wallet-hub-v1.css (also in index). Child wallet sheets intentionally NOT in index. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+58 more — full list = admin/enterprise + other-route sheets)_

## Profile

| Field | Value |
|-------|-------|
| Route | `/account` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/account-canonical-v2.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **42** |
| Non-critical CSS count (heuristic) | **74** |
| Files loaded but probably unused here | **74** |
| Notes | AccountCenterPage imports account-canonical-v2 (also nested via platform-canonical-ui in index). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+49 more — full list = admin/enterprise + other-route sheets)_

## Settings

| Field | Value |
|-------|-------|
| Route | `/account/settings` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/account-settings-canonical.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **42** |
| Non-critical CSS count (heuristic) | **74** |
| Files loaded but probably unused here | **74** |
| Notes | SettingsMenuSections imports account-settings-canonical (also in index). |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+49 more — full list = admin/enterprise + other-route sheets)_

## Notifications

| Field | Value |
|-------|-------|
| Route | `/inbox?tab=notifications (canonical); /notifications → redirect` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/inbox-hub-v1.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **84** |
| Files loaded but probably unused here | **83** |
| Notes | Same InboxPage CSS path as Messages. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+58 more — full list = admin/enterprise + other-route sheets)_

## Checkout

| Field | Value |
|-------|-------|
| Route | `/checkout/[slug]` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | `styles/rovexo/checkout-v1.css` |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **32** |
| Non-critical CSS count (heuristic) | **84** |
| Files loaded but probably unused here | **83** |
| Notes | CheckoutWizardV1 imports checkout-v1.css (also in index). checkout/page.tsx may redirect; success page also imports checkout-v1.css. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+58 more — full list = admin/enterprise + other-route sheets)_

## Business

| Field | Value |
|-------|-------|
| Route | `/business → dashboard redirect` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | _(none beyond layout)_ |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **30** |
| Non-critical CSS count (heuristic) | **86** |
| Files loaded but probably unused here | **85** |
| Notes | business/layout.tsx has no CSS import. business/page.tsx redirects. Still loads full platform index via (platform)/layout. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+60 more — full list = admin/enterprise + other-route sheets)_

## Admin

| Field | Value |
|-------|-------|
| Route | `/admin` |
| Entry layout chain | `app/layout.tsx → globals.css` → `app/(platform)/layout.tsx → styles/rovexo/index.css` → `app/(platform)/admin/layout.tsx (no CSS import; AdminCommandCentreShell)` |
| Page-level CSS imports | _(none)_ |
| Feature CSS imports (additional) | _(none beyond layout)_ |
| Nested imports | Via `index.css` tree (depth 1–2) + `globals.css` → skip-link; see § index tree |
| Total unique CSS files (approx) | **116** |
| Estimated raw KB | **960.1 KB** (983191 bytes) |
| Estimated gzip KB (concat lvl9) | **131.5 KB** (134626 bytes) |
| Critical CSS count (heuristic) | **30** |
| Non-critical CSS count (heuristic) | **86** |
| Files loaded but probably unused here | **85** |
| Notes | Admin nested layout adds no CSS file import; still inherits full platform index including enterprise sheets. |

### Why unused sheets are still loaded
Platform group layout always imports `styles/rovexo/index.css` (111 `@import`s). There is **no** per-route CSS splitting in `app/(platform)/layout.tsx`.

### Non-critical / probably-unused sample (first 25)
- `styles/rovexo/auth-v1.css`
- `styles/rovexo/mission-control.css`
- `styles/rovexo/mission-control-v2.css`
- `styles/rovexo/command-center-v1.css`
- `styles/rovexo/command-center-v2.css`
- `styles/rovexo/command-centre-unified-v1.css`
- `styles/rovexo/theme-studio-pro.css`
- `styles/rovexo/platform-studio.css`
- `styles/rovexo/app-studio.css`
- `styles/rovexo/enterprise-core.css`
- `styles/rovexo/shipping-engine.css`
- `styles/rovexo/orders-engine.css`
- `styles/rovexo/wallet-engine.css`
- `styles/rovexo/payments-engine.css`
- `styles/rovexo/protection-engine.css`
- `styles/rovexo/messages-engine.css`
- `styles/rovexo/notifications-engine.css`
- `styles/rovexo/analytics-engine.css`
- `styles/rovexo/security-engine.css`
- `styles/rovexo/search-engine.css`
- `styles/rovexo/ai-engine.css`
- `styles/rovexo/integrations-engine.css`
- `styles/rovexo/visual-cms.css`
- `styles/rovexo/asset-manager.css`
- `styles/rovexo/operations-center.css`

_(+60 more — full list = admin/enterprise + other-route sheets)_


---

# Classification — every module in `index.css` tree

| File | Depth | Bytes | Classification | Scope | Reason |
|------|------:|------:|----------------|-------|--------|
| `styles/rovexo/account-2026.css` | 1 | 22017 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-center.css` | 1 | 13044 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-hub-v1.css` | 1 | 5197 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-module-v1.css` | 1 | 26547 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-settings-canonical.css` | 1 | 2652 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-settings-v1.css` | 1 | 5974 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account.css` | 1 | 7251 | NOT VERIFIED | unknown | No heuristic match. |
| `styles/rovexo/ai-engine.css` | 1 | 3786 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/analytics-engine.css` | 1 | 3744 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/app-studio.css` | 1 | 6084 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/asset-manager.css` | 1 | 4330 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/auctions.css` | 1 | 8495 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/audit-compliance.css` | 1 | 5306 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/auth-v1.css` | 1 | 56419 | PROBABLY UNUSED | GLOBAL + AUTH entry | In platform index AND auth-entry. Auth screens require it; marketplace routes do not mount data-auth-screen (scan outside auth features found no usage). |
| `styles/rovexo/benefits-rail.css` | 1 | 1679 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/bottom-nav-premium.css` | 1 | 4961 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/bring-your-item.css` | 1 | 3746 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/canonical-ds.css` | 1 | 23233 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/cards.css` | 1 | 6340 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/cart-v1.css` | 1 | 8236 | ROUTE SPECIFIC | Checkout | Intended for Checkout but loaded via platform index on all platform routes. |
| `styles/rovexo/category-rail.css` | 1 | 6654 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/certification-center.css` | 1 | 5393 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/checkout-v1.css` | 1 | 17750 | ROUTE SPECIFIC | Checkout | Intended for Checkout but loaded via platform index on all platform routes. |
| `styles/rovexo/chrome-scroll.css` | 1 | 1079 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/command-center-v1.css` | 1 | 15024 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/command-center-v2.css` | 1 | 17461 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/command-centre-unified-v1.css` | 1 | 4273 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/command-os-v4.css` | 1 | 3475 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/compact-premium-v1.css` | 1 | 10578 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/conversation-hub-v1.css` | 1 | 44422 | ROUTE SPECIFIC | Messages/Inbox | Intended for Messages/Inbox but loaded via platform index on all platform routes. |
| `styles/rovexo/dashboard.css` | 1 | 11934 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/design-studio-v1.css` | 1 | 9599 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/device-lifecycle-manager.css` | 1 | 8059 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-admin-unified.css` | 1 | 11746 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-ai-os.css` | 1 | 2840 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-automation-hub.css` | 1 | 2656 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-business-intelligence.css` | 1 | 2811 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-compliance-center.css` | 1 | 9285 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-core.css` | 1 | 5161 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-deployment-center.css` | 1 | 2748 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-mobile-control-center.css` | 1 | 2750 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-module-registry.css` | 1 | 6387 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-soc.css` | 1 | 3303 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/enterprise-workflow-engine.css` | 1 | 4881 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/executive-command.css` | 1 | 6579 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/forms.css` | 1 | 2766 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/full-width-engine-v1.css` | 1 | 12146 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/header-premium.css` | 1 | 3195 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/hero.css` | 1 | 17218 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/hmrc-reporting-centre-v1.css` | 1 | 7435 | ROUTE SPECIFIC | Wallet | Intended for Wallet but loaded via platform index on all platform routes. |
| `styles/rovexo/home-final.css` | 1 | 8056 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/home-launch-polish.css` | 1 | 3126 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/home-polish.css` | 1 | 5660 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/home-product-cards.css` | 1 | 5248 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/home-sections-premium.css` | 1 | 7527 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/home-v1-launch-polish.css` | 1 | 13033 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/home-v1-visual-qa.css` | 1 | 8210 | ROUTE SPECIFIC | Homepage(+) | Homepage-oriented sheet also in global index or homepage page imports. |
| `styles/rovexo/homepage-builder-engine.css` | 1 | 4072 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/icon-standard-v1.css` | 1 | 1059 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/inbox-hub-v1.css` | 1 | 18227 | ROUTE SPECIFIC | Messages/Inbox | Intended for Messages/Inbox but loaded via platform index on all platform routes. |
| `styles/rovexo/incident-command-center.css` | 1 | 8447 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/incident-response-center.css` | 1 | 3629 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/incident-timeline.css` | 1 | 7640 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/integrations-engine.css` | 1 | 3737 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/layout.css` | 1 | 9452 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/listing-card-official.css` | 1 | 1043 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/make-offer-v1.css` | 1 | 3635 | ROUTE SPECIFIC | Listing | Intended for Listing but loaded via platform index on all platform routes. |
| `styles/rovexo/messages-engine.css` | 1 | 4434 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/mission-control-v2.css` | 1 | 11576 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/mission-control.css` | 1 | 13920 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/mobile-distribution-center.css` | 1 | 18274 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/mobile-scroll-v1.css` | 1 | 8192 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/mobile.css` | 1 | 6984 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/my-account-primary-button-v1.css` | 1 | 272 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/notifications-engine.css` | 1 | 4556 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/omega-command-center.css` | 1 | 5823 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/omega-enterprise-mobile.css` | 1 | 11392 | GLOBAL | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/operations-center.css` | 1 | 6030 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/orders-engine.css` | 1 | 4321 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/orders-page-v1.css` | 1 | 10001 | ROUTE SPECIFIC | Orders | Intended for Orders but loaded via platform index on all platform routes. |
| `styles/rovexo/payments-engine.css` | 1 | 4468 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/phone-width-v1-freeze.css` | 1 | 5820 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/platform-canonical-ui.css` | 1 | 4574 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/platform-studio.css` | 1 | 4326 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/platform-visual.css` | 1 | 2364 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/premium-empty-state.css` | 1 | 229 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/primary-button-v1.css` | 1 | 3718 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/product-detail-v1.css` | 1 | 37396 | ROUTE SPECIFIC | Listing | Intended for Listing but loaded via platform index on all platform routes. |
| `styles/rovexo/promotion-cards-v1.css` | 1 | 14457 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/protection-engine.css` | 1 | 4998 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/recovery-center.css` | 1 | 5256 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/rovexo-header-standard-v1.css` | 1 | 1820 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/rovexo-ideas-v1.css` | 1 | 13714 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/rvx-topbar-v1.css` | 1 | 1542 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/search-engine.css` | 1 | 3858 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/secondary-banners.css` | 1 | 2222 | ROUTE SPECIFIC | Other marketplace | Intended for Other marketplace but loaded via platform index on all platform routes. |
| `styles/rovexo/security-engine.css` | 1 | 3948 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/sell.css` | 1 | 30063 | ROUTE SPECIFIC | Sell | Intended for Sell but loaded via platform index on all platform routes. |
| `styles/rovexo/shell.css` | 1 | 3201 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/shipping-engine.css` | 1 | 3742 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/sign-out.css` | 1 | 741 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/store-listing-card-premium-v1.css` | 1 | 4773 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/super-admin-premium.css` | 1 | 12698 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/theme-studio-pro.css` | 1 | 6386 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/typography.css` | 1 | 2092 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/universal-ui-v1.css` | 1 | 15428 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/utilities.css` | 1 | 9961 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/visual-cms.css` | 1 | 6690 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/wallet-engine.css` | 1 | 4592 | PROBABLY UNUSED | GLOBAL (enterprise/admin) | In platform index; intended Super Admin/enterprise. Selector usage on buyer routes NOT VERIFIED. |
| `styles/rovexo/wallet-hub-v1.css` | 1 | 28565 | ROUTE SPECIFIC | Wallet | Intended for Wallet but loaded via platform index on all platform routes. |
| `styles/tokens.css` | 1 | 5649 | GLOBAL | Shared DS | Shared design-system / chrome. |
| `styles/rovexo/account-canonical-v2.css` | 2 | 16787 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/account-settings-ui.css` | 2 | 6865 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |
| `styles/rovexo/addresses-v1.css` | 2 | 6137 | ROUTE SPECIFIC | Profile/Settings | Intended for Profile/Settings but loaded via platform index on all platform routes. |


**Note on auth-v1 row:** Classification **PROBABLY UNUSED** refers to **platform/marketplace routes**. On auth routes the same file is **REQUIRED**.

**Sheets NOT in index but route-loaded:**

| File | Bytes | Routes | Classification |
|------|------:|--------|----------------|
| `styles/homepage-canonical.css` | 2198 | Homepage | ROUTE SPECIFIC |
| `styles/homepage-canonical-responsive.css` | 1271 | Homepage | ROUTE SPECIFIC |
| `styles/rovexo/header-v2.css` | 5767 | Homepage (+ image search results page) | ROUTE SPECIFIC |
| `styles/rovexo/search-results-v1.css` | 6215 | Search, Browse | ROUTE SPECIFIC |
| `styles/rovexo/search-landing-v1.css` | 9901 | Search/Browse via SearchLandingView | ROUTE SPECIFIC |
| `styles/rovexo/image-search.css` | 3688 | Image search features | ROUTE SPECIFIC |
| Wallet child sheets (`payment-methods-v4`, `bank-accounts-v5`, `withdraw-v7`) | varies | Wallet children only | ROUTE SPECIFIC (intentionally excluded from index — comment in index.css) |

---

# Mobile impact (evidence-bounded)

| Target | Evidence-based statement | Measured impact |
|--------|--------------------------|-----------------|
| Safari iPhone | Same platform CSS entry as other browsers; ~952.4 KB source CSS imported on every platform route | **NOT VERIFIED** (no Safari CSS parse/FCP lab) |
| Chrome Android | Same | **NOT VERIFIED** |
| Samsung Internet | Same; no Samsung-specific CSS entry found | **NOT VERIFIED** |

Qualitative (code only): loading ~952.4 KB of CSS source (gzip-concat ~129.7 KB estimate) on buyer Homepage including enterprise/auth/sell/checkout sheets increases CSS download/parse work on mobile. Numeric LCP/FCP/TBT deltas = **NOT VERIFIED**.

---

# TOP VERIFIED CSS OPTIMISATION OPPORTUNITIES

Only items with verified load-path evidence. **No implementation.**

| # | File | Route | Reason | Estimated mobile impact | Regression risk | Complexity | Functional change |
|--:|------|-------|--------|-------------------------|-----------------|------------|-------------------|
| 1 | `styles/rovexo/index.css` (enterprise/admin `@import` block ~orders 55–103) | All platform routes incl. Homepage | Verified: Super Admin/enterprise sheets imported globally via platform layout | High (large non-buyer CSS on buyer routes) | High (Super Admin visuals) | High | **YES** if removed from wrong entry |
| 2 | `styles/rovexo/auth-v1.css` | All platform routes | Verified dual load: required on auth-entry; also `@import` in platform index | Medium–High (56419 B source on every platform page) | Medium (if platform still needs shared auth classes — **NOT VERIFIED**) | Medium | **YES** if platform modal depends on it |
| 3 | `styles/rovexo/index.css` page modules (`sell.css`, `checkout-v1.css`, `conversation-hub-v1.css`, `wallet-hub-v1.css`, …) | Routes that are not Sell/Checkout/Inbox/Wallet | Verified global import; route-specific intent | Medium–High | High per frozen module | High | **YES** if route loses styles |
| 4 | Duplicate feature re-imports (`InboxPage`→inbox-hub, `OrdersPage`→orders-page, `WalletHubV1`→wallet-hub, `CheckoutWizardV1`→checkout-v1, `SearchLandingView`→category-rail) | Messages/Orders/Wallet/Checkout/Search | Verified second `import` of sheets already in index; Next may dedupe — **dedupe effectiveness NOT VERIFIED** | Low–Medium (if not deduped) | Low | Low | **NO** if only remove duplicate import after verifying Next dedupe |
| 5 | Homepage extras + index home-* overlap | Homepage | Verified: page imports `homepage-canonical*` + `header-v2` while index already has home-* and header-premium / rovexo-header-standard | Medium | Medium (Homepage freeze) | Medium | **YES** if wrong sheet dropped |
| 6 | `auth-entry.css` vs platform split already exists | Auth vs Platform | Verified auth isolation works for **other** sheets; auth-v1 is the documented exception still in index | — (architectural evidence) | — | — | **NOT VERIFIED** as “gain” without change |

Opportunities **not** listed: anything requiring Coverage/Lighthouse numbers, Tailwind final size, or assumed unused selectors without mount evidence.

---

## Document control

| Field | Value |
|-------|-------|
| Document | `docs/audits/ROVEXO_CSS_ROUTE_DEPENDENCY_FORENSIC_v1.md` |
| Version | 1.0 · Phase 1 |
| Mode | READ ONLY · FORENSIC |
| Implementation | NONE |

**END OF PHASE 1 · STOP.**
