# ROVEXO PERFORMANCE IMPLEMENTATION ROADMAP v1.1

**STATUS:** MASTER EXECUTION PLAN · REVISION v1.1 · READ ONLY · ABSOLUTE LOCK · EVIDENCE ONLY  
**ROLE:** Sole approved execution document for future mobile performance optimisation phases.  
**SUPERSEDES:** Roadmap v1.0 ordering that placed Homepage EXPECTED REFRESH before verified CSS/client P0 work.

| Field | Value |
|---|---|
| Generated (UTC) | 2026-08-07T21:23:48.584Z |
| Revision | **v1.1** — reorder only; no new optimisation IDs invented; certification conclusions unchanged |
| Mode | Plan only — **no implementation** |
| Code / CSS / React / Next.js / API / DB / Runtime / UI / UX changes | **FORBIDDEN** |
| Commit / Push / Deploy | **FORBIDDEN** |

### Input certifications (unchanged set)

| # | Document |
|---|---|
| 1 | `docs/audits/ROVEXO_MOBILE_PERFORMANCE_SEO_MASTER_AUDIT_v1.md` |
| 2 | `docs/audits/ROVEXO_P0_FORENSIC_PERFORMANCE_AUDIT_v1.md` |
| 3 | `docs/audits/ROVEXO_CSS_ROUTE_DEPENDENCY_FORENSIC_v1.md` |
| 4 | `docs/audits/ROVEXO_CSS_USAGE_FORENSIC_v1.md` |
| 5 | `docs/audits/ROVEXO_AUTH_CSS_FINAL_CERTIFICATION_v1.md` |
| 6 | `docs/audits/ROVEXO_HOMEPAGE_DOUBLE_FETCH_FINAL_CERTIFICATION_v1.md` |
| 7 | `docs/audits/ROVEXO_CLIENT_COMPONENT_FORENSIC_CERTIFICATION_v1.md` |

---

## SECTION 0 — Mandatory ordering review (v1.0 → v1.1)

### v1.0 defect in priority

| Claim in v1.0 | Forensic truth |
|---|---|
| Started with **OPT-P0-FETCH-01** as first P0 | Double-fetch Final Cert classifies behaviour as **EXPECTED REFRESH**, **not** **TRUE DUPLICATE** |
| Treated dual page-1 load as automatic P0 #1 defect | SSR intentionally seeds page 1; client intentionally refreshes because `revalidate = 60` (documented intent) |
| Implied production degradation priority | **No** completed certification proves **measurable** production CWV/network degradation for this path (CWV columns **NOT VERIFIED**) |

### Ordering rule (absolute for v1.1)

```
EXPECTED REFRESH must NOT automatically become Priority P0 #1.
Verified CSS / client optimisation work precedes Homepage SSR refresh review.
```

### Approved P0 sequence (evidence-only)

| Order | ID | Title | Status |
|---|---|---|---|
| **P0-01** | OPT-P0-CSS-01 | CSS Megabundle (111 imports · ~945.5 KB raw of 111 sheets) | **READY** |
| **P0-02** | OPT-P0-CSS-02 | Enterprise / Admin CSS isolation from marketplace shell | **READY** (load path verified in P0 F-CSS-3) |
| **P0-03** | OPT-P0-CSS-03 | Auth CSS isolation (`auth-v1` out of platform index) | **BLOCKED** until Auth CSS Final = **REQUIRED ONLY FOR AUTH** |
| **P0-04** | OPT-P1-CLI-SEQ / OPT-CLI-* | Verified **PROBABLY REMOVABLE** client components only | **READY** (one file at a time) |
| **P1** | OPT-P0-FETCH-01 *(renamed priority band only)* | Homepage SSR ↔ Client page-1 **EXPECTED REFRESH** review | **READY** as **P1** — **not** classified as defect |

---

## SECTION 1 — Executive Summary

Scores unchanged from Master Audit (no new score invented).

| Score | Value (/100) | Source |
|---|---|---|
| **Current Production Score (Overall)** | **74** | Master Audit |
| **Mobile Score** | **68** | Master Audit |
| **SEO Score** | **84** | Master Audit |
| **Performance Score** | **70** | Master Audit |
| **Security Score** | **81** | Master Audit |
| **Accessibility Score** | **72** | Master Audit |
| **PWA Score** | **82** | Master Audit |
| **Production Readiness Score** | **91** | Master Audit |

| Topic | Certification conclusion (unchanged) |
|---|---|
| Platform CSS | **111** `@import`s · sum raw **945,516** bytes (~945.5 KB) · gzip-concat estimate ~125.5 KB (P0) |
| Homepage page-1 | **EXPECTED REFRESH** · Final Cert **FAIL** vs “no duplicate” gate · **not** TRUE DUPLICATE |
| Auth CSS outside auth | Final Cert **NOT VERIFIED** (gated routes uninspected) |
| Client density | **782** `"use client"` · **121** PROBABLY REMOVABLE · **109** live |

**Cumulative impact after roadmap:** **NOT VERIFIED**.

---

## SECTION 2 — Verified Optimisation Inventory

*(Same evidence items as v1.0; priorities and status gates revised. No new items.)*

### OPT-P0-CSS-01 — CSS Megabundle (**P0-01**)

| Field | Value |
|---|---|
| Priority | **P0-01** |
| Evidence source | P0 Forensic F-CSS-1; CSS Route Dependency; Master F-C2 |
| Reason | Verified global load of **111** CSS modules via `styles/rovexo/index.css` on every platform route; raw import sum **~945.5 KB** |
| Regression risk | **HIGH** |
| Complexity | **HIGH** |
| Dependencies | None (first executable P0) |
| Owner approval required | **YES** |
| Status | **READY** |

### OPT-P0-CSS-02 — Enterprise / Admin CSS isolation (**P0-02**)

| Field | Value |
|---|---|
| Priority | **P0-02** |
| Evidence source | P0 Forensic **F-CSS-3** (Enterprise/Super Admin sheets on marketplace); inventory rows e.g. `mission-control*.css`, `command-center*.css`, `enterprise-core.css`, `dashboard.css`, etc. loaded via platform index |
| Reason | Completed P0 evidence: enterprise/Super Admin intended sheets are **imported globally** on marketplace shell (buyer Homepage included) |
| Regression risk | **HIGH** (Super Admin/Admin must retain styles) |
| Complexity | **HIGH** |
| Dependencies | After **OPT-P0-CSS-01** certified (one at a time); uses same index inventory |
| Owner approval required | **YES** |
| Status | **READY** |

*(Selector-level “unused on Homepage” remains PARTIALLY USED / NOT VERIFIED in P0 coverage sense; **load** on marketplace is verified — sufficient for READY isolation work under P0 F-CSS-3.)*

### OPT-P0-CSS-03 — Auth CSS isolation (**P0-03**)

| Field | Value |
|---|---|
| Priority | **P0-03** |
| Evidence source | Route Dependency dual path; CSS Usage public DOM 0; Auth CSS Final Cert; P0 F-CSS-2 |
| Reason | `auth-v1.css` dual-loaded (auth-entry **and** platform index). Public `/search` `/browse` `/listing` matched **0** auth selectors. Final classification remains **NOT VERIFIED** for platform-wide “auth-only” claim |
| Regression risk | **MEDIUM–HIGH** |
| Complexity | **MEDIUM** |
| Dependencies | Auth CSS Final Certification must become **REQUIRED ONLY FOR AUTH**. **Never bypass this gate.** |
| Owner approval required | **YES** (after gate opens) |
| Status | **BLOCKED** |

### OPT-P1-CLI-SEQ — Verified PROBABLY REMOVABLE clients (**P0-04**)

| Field | Value |
|---|---|
| Priority | **P0-04** |
| Evidence source | Client Component Forensic § TOP 50 + PROBABLY REMOVABLE live list (**never** NOT VERIFIED class) |
| Reason | Static forensic classed **PROBABLY REMOVABLE** with zero matched strong hooks/browser/`on*`/client imports |
| Regression risk | **MEDIUM** per file |
| Complexity | **LOW–MEDIUM** per file |
| Dependencies | After P0-01 and P0-02; P0-03 may remain BLOCKED in parallel wait — do **not** wait forever on Auth if still BLOCKED: P0-04 proceeds after P0-02 per approved order (Auth stays BLOCKED independently) |
| Owner approval required | **YES** each file |
| Status | **READY** (one file at a time; Top 50 first) |

**Include:** only `PROBABLY REMOVABLE`.  
**Exclude:** `NOT VERIFIED` client files · `REQUIRED` · `PROBABLY REQUIRED`.

### OPT-P0-FETCH-01 — Homepage SSR refresh (**P1** — not a defect)

| Field | Value |
|---|---|
| Priority | **P1** (after all verified P0 work above that is READY or skipped-as-BLOCKED) |
| Evidence source | Homepage Double Fetch Final Cert |
| Reason | Classification **EXPECTED REFRESH**: intentional client replace under ISR `revalidate = 60`. **Not** TRUE DUPLICATE. No measured production degradation in certifications |
| Regression risk | **MEDIUM–HIGH** (freshness) |
| Complexity | **MEDIUM** |
| Dependencies | Complete P0-01, P0-02, P0-04 (and P0-03 if unblocked). Do **not** treat as defect backlog item |
| Owner approval required | **YES** |
| Status | **READY** as **P1 review / optional optimisation** — **not** P0 defect |

### Remaining inventory items (unchanged evidence; execution after P0/P1 network review)

| ID | Priority band | Evidence source | Status |
|---|---|---|---|
| OPT-P0-CLI-01 Homepage client island | After P1 fetch review or later freeze-gated | Client Forensic Homepage; P0 F-CLI-3 | **READY** (freeze-gated) |
| OPT-P1-DATA-02 Browse counts | Later P1/P2 data | Master F-S4 | **READY** |
| OPT-P1-DATA-01 Following fan-out | Later | Master F-S3 | **READY** |
| OPT-P1-NEXT-01 Listing force-dynamic | Later | Master F-N9 | **READY** |
| OPT-P1-REACT-01 Virtualization | Later | Master F-R7 | **READY** |
| OPT-P2-CSS-HP Homepage extra CSS | With/after CSS phases | Master F-C3 | **READY** |
| OPT-P2-SEO-03 robots | Later P2 | Master F-SEO4 | **READY** |
| OPT-P2-SEO-01 / 02 H1 | Later P2 freeze-gated | Master F-SEO6/7 | **READY** (freeze-gated) |
| OPT-P3-MOBILE-01 visualViewport | P3 | Master F-M7 | **READY** |
| OPT-P3-PWA-01 iOS splash | P3 freeze-gated | Master F-PWA3 | **READY** (freeze-gated) |

---

## SECTION 3 — Execution Phases (revised)

### Phase 1 — Platform CSS megabundle (**P0-01**)

| ID | Status |
|---|---|
| OPT-P0-CSS-01 | **READY** |

### Phase 2 — Enterprise / Admin CSS isolation (**P0-02**)

| ID | Status |
|---|---|
| OPT-P0-CSS-02 | **READY** |

### Phase 3 — Auth CSS isolation (**P0-03**)

| ID | Status |
|---|---|
| OPT-P0-CSS-03 | **BLOCKED** until Auth CSS Final = **REQUIRED ONLY FOR AUTH** |

If still BLOCKED when Phase 2 completes → **skip Phase 3** and proceed to Phase 4. Do not bypass the Auth gate.

### Phase 4 — Verified PROBABLY REMOVABLE clients (**P0-04**)

| ID | Status |
|---|---|
| OPT-CLI-001 … Top 50 then remaining live PROBABLY REMOVABLE | **READY** · one file per step · never NOT VERIFIED |

### Phase 5 — Homepage SSR refresh (**P1**)

| ID | Status |
|---|---|
| OPT-P0-FETCH-01 | **READY** as P1 · **EXPECTED REFRESH** · not defect |

### Phase 6+ — Remaining certified inventory

OPT-P2-CSS-HP · OPT-P0-CLI-01 · data/listing/virtualization · SEO · mobile/PWA — same evidence as v1.0, after Phases 1–5 rules above.

---

## SECTION 4 — Priority Matrix (revised)

| ID | Priority | Evidence source | Reason | Expected gain | Risk | Dependencies | Status |
|---|---|---|---|---|---|---|---|
| OPT-P0-CSS-01 | **P0-01** | P0 F-CSS-1 | 111 imports · ~945.5 KB raw · global platform load | High qualitative CSS; CWV **NOT VERIFIED** | High | None | **READY** |
| OPT-P0-CSS-02 | **P0-02** | P0 F-CSS-3 | Enterprise/Admin CSS loaded on marketplace | High qualitative | High | After P0-01 | **READY** |
| OPT-P0-CSS-03 | **P0-03** | Auth Final **NOT VERIFIED** + dual load | Isolating auth-v1 from index | Medium–High | Medium–High | Auth Final → **REQUIRED ONLY FOR AUTH** | **BLOCKED** |
| OPT-CLI-* | **P0-04** | Client Forensic PROBABLY REMOVABLE | Verified removable directive candidates | Density; per-file **NOT VERIFIED** | Medium | After P0-02 (P0-03 may stay BLOCKED) | **READY** |
| OPT-P0-FETCH-01 | **P1** | Double-fetch **EXPECTED REFRESH** | Intentional ISR refresh — **not** TRUE DUPLICATE; no measured degradation | **NOT VERIFIED** | Medium–High | After verified P0 READY work | **READY** (P1) |

---

## SECTION 5 — Regression Matrix

*(Unchanged mapping from v1.0; FETCH no longer first.)*

| Optimisation | Primary regression modules |
|---|---|
| OPT-P0-CSS-01 | All platform: Homepage, Search, Browse, Listing, Sell, Messages, Notifications, Orders, Wallet, Profile, Settings, Checkout, Business, Admin + Auth if shared tokens |
| OPT-P0-CSS-02 | Marketplace buyer surfaces + Admin + Super Admin |
| OPT-P0-CSS-03 | Platform + **Authentication** (must PASS) |
| OPT-CLI-* | Per-file module only |
| OPT-P0-FETCH-01 | **Homepage** only |

Realtime / Push / PWA / SEO / Authentication columns apply as in v1.0 when those domains are touched.

---

## SECTION 6 — Certification Matrix

Unchanged mandatory gates per optimisation:

TypeScript · ESLint · Production Build · Playwright · Manual QA · Safari iPhone · Chrome Android · Samsung Internet · Realtime (if touched) · Performance (claim-specific evidence) · Accessibility · SEO (if touched) · Owner visual when freezes apply.

---

## SECTION 7 — Implementation Order (ONLY approved sequence v1.1)

| Step | Priority | ID | Rule |
|---:|---|---|---|
| 1 | P0-01 | OPT-P0-CSS-01 | First |
| 2 | P0-02 | OPT-P0-CSS-02 | After step 1 certified |
| 3 | P0-03 | OPT-P0-CSS-03 | **Only if** Auth CSS Final = **REQUIRED ONLY FOR AUTH**; else **skip** (remain BLOCKED) |
| 4… | P0-04 | OPT-CLI-001 → Top 50 → remaining live PROBABLY REMOVABLE | One file at a time; **no** NOT VERIFIED files |
| next | **P1** | OPT-P0-FETCH-01 | Homepage **EXPECTED REFRESH** review — **after** verified P0 work |
| next | … | Remaining inventory (CLI island, data, listing, SEO, P3) | As v1.0 evidence list |

**Forbidden:** Starting with Homepage fetch. **Forbidden:** Parallel P0s. **Forbidden:** Bypassing Auth CSS gate.

---

## SECTION 8 — Estimated Impact

| Claim | Result |
|---|---|
| Cumulative score / CWV improvement | **NOT VERIFIED** |
| Measurable degradation from EXPECTED REFRESH | **NOT VERIFIED** (no lab/field proof in certifications) |
| Megabundle size evidence | **Verified** 111 imports · ~945.5 KB raw (P0) |

---

## SECTION 9 — Execution Rules (absolute)

1. One optimisation at a time.  
2. No parallel optimisation.  
3. No feature / UI / UX redesign.  
4. No business logic / API / DB / schema changes except Owner-approved minimum for a listed item.  
5. Performance improvements only (plus inventoried SEO/a11y).  
6. **EXPECTED REFRESH ≠ automatic P0 defect.**  
7. **Auth CSS isolation never proceeds until Final Cert = REQUIRED ONLY FOR AUTH.**  
8. Client work: **PROBABLY REMOVABLE only** — never NOT VERIFIED.  
9. Obey all ROVEXO freezes.  
10. localhost:3000 agent · Owner URL `https://www.rovexo.co.uk` for Owner approval.

---

## SECTION 10 — FINAL ROADMAP TABLE

| Priority | Task | Evidence Source | Reason | Regression risk | Complexity | Dependencies | Owner Approval Required | Status |
|---|---|---|---|---|---|---|---|---|
| **P0-01** | OPT-P0-CSS-01 CSS Megabundle | P0 F-CSS-1 · Route Dependency · Master F-C2 | 111 imports · ~945.5 KB raw · global platform load | High | High | None | **YES** | **READY** |
| **P0-02** | OPT-P0-CSS-02 Enterprise/Admin CSS isolation | P0 F-CSS-3 | Enterprise sheets loaded on marketplace shell | High | High | After P0-01 | **YES** | **READY** |
| **P0-03** | OPT-P0-CSS-03 Auth CSS isolation | Auth Final · Usage · Route · P0 F-CSS-2 | Dual-load auth-v1; Final still **NOT VERIFIED** | Medium–High | Medium | Auth Final → **REQUIRED ONLY FOR AUTH** | **YES** | **BLOCKED** |
| **P0-04** | OPT-CLI-* PROBABLY REMOVABLE only | Client Forensic Top 50 + live removable | Verified static removable candidates | Medium | Low–Med | After P0-02; skip-wait on BLOCKED P0-03 | **YES** each | **READY** |
| **P1** | OPT-P0-FETCH-01 Homepage SSR refresh | Double-fetch Final Cert | **EXPECTED REFRESH** · not TRUE DUPLICATE · no measured degradation | Medium–High | Medium | After verified P0 READY work | **YES** | **READY** (P1 · not defect) |
| Later | OPT-P2-CSS-HP | Master F-C3 | Homepage extra CSS + megabundle | High | Medium | CSS phases | **YES** | **READY** |
| Later | OPT-P0-CLI-01 | Client Forensic · P0 F-CLI-3 | Homepage client island | High | High | Freeze unlock | **YES** | **READY** (freeze-gated) |
| Later | OPT-P1-DATA-02 | Master F-S4 | Browse parallel counts | Medium | Medium | — | **YES** | **READY** |
| Later | OPT-P1-DATA-01 | Master F-S3 | Following fan-out | High | High | XLVI | **YES** | **READY** |
| Later | OPT-P1-NEXT-01 | Master F-N9 | Listing force-dynamic | High | High | Financial/listing | **YES** | **READY** |
| Later | OPT-P1-REACT-01 | Master F-R7 | Virtualization wiring | High | High | Feed freezes | **YES** | **READY** |
| Later | OPT-P2-SEO-03 | Master F-SEO4 | robots wallet/inbox | Medium | Low | — | **YES** | **READY** |
| Later | OPT-P2-SEO-01/02 | Master F-SEO6/7 | H1 gaps | High | Low+approval | Owner visual | **YES** | **READY** (freeze-gated) |
| Later | OPT-P3-MOBILE-01 | Master F-M7 | visualViewport | High | High | — | **YES** | **READY** |
| Later | OPT-P3-PWA-01 | Master F-PWA3 | iOS splash | Medium+icon freeze | Medium | Favicon freeze | **YES** | **READY** (freeze-gated) |

---

## FINAL CHECK

### Verify: every P0 item backed by completed forensic evidence

| P0 | Backing evidence | Result |
|---|---|---|
| P0-01 Megabundle | P0 F-CSS-1 · 111 imports · ~945.5 KB | **PASS** |
| P0-02 Enterprise/Admin isolation | P0 F-CSS-3 · global load of enterprise sheets | **PASS** |
| P0-03 Auth isolation | Dual-load verified; execution **BLOCKED** by Auth Final **NOT VERIFIED** (gate correct) | **PASS** (status correctly BLOCKED) |
| P0-04 PROBABLY REMOVABLE clients | Client Forensic PROBABLY REMOVABLE / Top 50 | **PASS** |

### Verify: no EXPECTED REFRESH before verified optimisation work

| Check | Result |
|---|---|
| OPT-P0-FETCH-01 is **P1**, after P0-01…P0-04 | **PASS** |
| FETCH not classified as TRUE DUPLICATE / automatic P0 defect | **PASS** |
| Auth gate not bypassable | **PASS** |

### FINAL CHECK VERDICT

```
PASS
```

**Evidence:** v1.1 places CSS megabundle first; Enterprise/Admin second (P0 F-CSS-3); Auth third but **BLOCKED** until **REQUIRED ONLY FOR AUTH**; verified PROBABLY REMOVABLE clients fourth; Homepage **EXPECTED REFRESH** only as **P1** after verified P0 work. Certification conclusions unchanged. No new optimisations invented.

---

## Document control

| Field | Value |
|---|---|
| Output | `docs/audits/ROVEXO_PERFORMANCE_IMPLEMENTATION_ROADMAP_v1.md` (overwritten as **v1.1**) |
| Implementation | **NONE** |
| STOP | Roadmap revision complete |
