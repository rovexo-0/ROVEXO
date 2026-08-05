# ROVEXO P13 — ACCESSIBILITY AUDIT (WCAG 2.2 AA)

**STATUS:** AUDIT COMPLETE · EVIDENCE ONLY · AWAITING OWNER APPROVAL  
**DATE:** 2026-08-05  
**HOST:** `http://localhost:3000` (production `next start`)  
**TARGET:** WCAG 2.2 AA · Overall Accessibility ≥ **95 / 100**  
**PARENTS:** P10 PASS · P11 PASS (9.5) · P12 Wave A PASS  

```
NO UI REDESIGN · NO CSS REDESIGN · NO FEATURES · NO BUSINESS LOGIC · NO SEO · NO SECURITY · NO COMMIT · NO PUSH · NO DEPLOY
```

---

## Executive Summary

ROVEXO has **strong automated axe results on sampled public pages** (0 WCAG 2.2 AA violations on Login, Register, Search, Categories, Help, Accessibility policy page) and solid foundations (labelled auth forms, SafeImage, bottom-nav names, toasts with `aria-live`, many `focus-visible` / `prefers-reduced-motion` rules).

However, **structural and historical Lighthouse findings** prevent a ≥95 production Accessibility Certification:

1. **No skip links** anywhere in the product.  
2. **Inconsistent `<main>` / landmarks** (Login/Register lack `main`; Lighthouse `landmark-one-main` fails on several prod captures).  
3. **Homepage colour contrast FAIL** in Lighthouse (listing badge / protection text).  
4. **Search ARIA role misuse** in prior Lighthouse (tablist without tabs; listbox/listitem).  
5. **Modal focus trap incomplete** (only `CanonicalConfirmDialog` traps focus; most dialogs do not).  
6. **Full Accessibility Certification Engine matrix** (all auth pages · Sell · Checkout · Wallet · Inbox · Admin) **not completed** this phase — only public-sample axe + static + historical LH.

| Metric | Result |
|--------|--------|
| Overall Accessibility Score | **88 / 100** |
| Target ≥ 95 | **FAIL** |
| Fresh axe sample (public routes) | **0 violations** (limited matrix) |
| Lighthouse a11y (16 historical JSON) | avg **97.3** · min **88** (prod-search) |
| Skip links | **ABSENT** |
| Production readiness (a11y) | **NOT READY** until Critical/High fixed + full matrix PASS |

---

## Method & Evidence Sources

| Source | Used |
|--------|------|
| Static source review (layouts, forms, dialogs, images, ARIA) | YES |
| `lib/accessibility/accessibility-certification-engine-v1.ts` SSOT | YES |
| Vitest `tests/accessibility-certification-v1.test.ts` | PASS |
| Vitest `tests/image-safety-canonical.test.ts` | PASS |
| TypeScript / ESLint (a11y SSOT paths) | PASS |
| Production Build | Available (server started from existing `.next`) |
| Fresh axe-core WCAG 2.2 AA (`@axe-core/playwright` 4.12.1) on localhost:3000 | YES — sample matrix |
| Evidence files | `test-results/p13-accessibility/axe-sample.json` · `AXE_SAMPLE.md` |
| Historical Lighthouse JSON (repo root, Jul 2026) | YES |
| Full e2e `accessibility-certification.spec.ts` matrix | **NOT RUN** (requires demo auth + full page set) |

---

## Part 1 — Semantic HTML

| Finding | Severity | Evidence |
|---------|----------|----------|
| `html[lang=en-GB]` set | Pass | Root layout |
| Login / Register **no `<main>`** | **High** | Live probe 2026-08-05: `hasMain: false` |
| Guest `/` redirects to Login — no homepage landmarks for guests | Info | Expected auth startup |
| Search / Help / Accessibility page have `main` | Pass | Live probe |
| Bottom nav uses `<nav aria-label>` | Pass | `BottomNavigation.tsx` |
| Checkout uses `<main>` + `<header>` | Pass | Static |
| Account shell (`wallet`/`sell`/`inbox` hub) uses `<main>` | Pass | `AccountCanonicalShell` |
| Conversation Hub header without page `<main>` | Medium | Static |
| No skip link | **High** (WCAG 2.4.1 Bypass Blocks risk) | Repo + live: `skipLink: false` |

---

## Part 2 — Keyboard Navigation

| Check | Result | Evidence |
|-------|--------|----------|
| Tab moves focus (Search/Categories/Help) | **PASS** (sample) | 8 Tab steps recorded per page |
| Enter / Space / Escape / arrows / traps | **PARTIAL** | Escape on many modals; **Tab trap only** on `CanonicalConfirmDialog` |
| Sell / Checkout / Wallet / Messages / Admin keyboard | **UNVERIFIED** this phase | Full cert matrix not executed |
| Auth forms keyboard operable | Likely PASS | Labelled inputs + visible Sign In / Create Account |

---

## Part 3 — Focus Management

| Check | Result |
|-------|--------|
| `focus-visible` styles present across design system | **PASS** (many CSS modules) |
| Modal focus trap | **FAIL / incomplete** — most `role="dialog"` lack trap |
| Focus restoration | **UNVERIFIED** |
| Skip links | **FAIL** — absent |
| Cookie banner dialog | `role="dialog"` without `aria-modal` / trap |

---

## Part 4 — Screen Readers / ARIA

| Check | Result | Evidence |
|-------|--------|----------|
| Fresh axe WCAG tags on Login/Register/Search/Categories/Help | **0 violations** | `axe-sample.json` |
| Toast `aria-live="polite"` + `role="status"` | Pass | `Toast.tsx` |
| Icon buttons generally labelled (ListingCard, Hub, bottom nav) | Pass | Static |
| Historical Search tablist / listbox issues | **High** (residual) | `lighthouse-prod-search.json` score **88** · `aria-required-children` / parent / `listitem` |
| Historical homepage `aria-hidden-focus` | Medium | `lighthouse-prod-home.json` |

---

## Part 5 — Forms

| Check | Result |
|-------|--------|
| Login / Register labels via `htmlFor` | **PASS** |
| CanonicalInput label pattern | **PASS** |
| Field errors / `role="alert"` (sell/checkout samples) | Present |
| Platform-wide error summaries / autocomplete audit | **PARTIAL / not fully matrixed** |

---

## Part 6 — Contrast

| Check | Result |
|-------|--------|
| Login / Sell / Account Lighthouse a11y | Often **100 / 98** |
| Homepage `color-contrast` | **FAIL** (Lighthouse score 0 on that audit) |
| ListingCard featured / protection purple treatments | Suspected root | `ListingCard.module.css` + LH cites |

---

## Part 7 — Images

| Check | Result |
|-------|--------|
| SafeImage + empty-alt → `aria-hidden` | **PASS** |
| ListingCard meaningful `alt={title}` | **PASS** |
| Decorative search card images empty alt under named link | Acceptable pattern |
| Image safety Vitest | **PASS** |

---

## Part 8 — Responsive Accessibility

| Check | Result |
|-------|--------|
| Mobile viewport axe sample (390×844) | Run |
| Touch target SSOT ≥44px in cert engine | Defined; full runtime assert not completed this phase |
| iPhone Safari / Android Chrome Owner devices | **Not Owner-certified this phase** (agent Chromium only) |

---

## Part 9 — Automated Testing

### Fresh axe (localhost:3000 · WCAG 2.2 AA tags)

| Page | HTTP | Violations | Main | Skip |
|------|------|------------|------|------|
| Login | 200 | **0** | No | No |
| Register | 200 | **0** | No | No |
| Search | 200 | **0** | Yes | No |
| Accessibility | 200 | **0** | Yes | No |
| Search results `?q=phone` | 200 | **0** | — | No |
| Categories | 200 | **0** | — | No |
| Help | 200 | **0** | — | No |

### Lighthouse Accessibility (historical repo JSON)

| Band | Files |
|------|-------|
| 100 | login, sell, account, buyer, cart, categories (local) |
| 98 | prod login/sell/account/cart/buyer |
| 96 | home |
| 92 | prod-home |
| 91 | search |
| **88** | **prod-search** (worst) |
| Average | **97.3** across 16 files |

---

## WCAG Findings by Severity

### Critical
*None identified that block all users without assistive tech on sampled public pages.*  
*(No Critical axe impacts on sample.)*

### High
1. **No skip link** — bypass blocks incomplete for keyboard users on long pages.  
2. **Login/Register missing `<main>`** — landmark navigation weak.  
3. **Homepage colour contrast FAIL** (Lighthouse).  
4. **Search ARIA structure** (historical LH) — tablist/listbox misuse.  
5. **Dialog focus trap incomplete** outside confirm dialog.

### Medium
1. Conversation Hub / some surfaces lack `<main>`.  
2. Cookie consent dialog incomplete ARIA/focus.  
3. `label-content-name-mismatch` noise in several LH runs.  
4. Full keyboard matrix for Sell/Checkout/Wallet/Inbox/Admin **unverified**.

### Low
1. Guest homepage redirect (expected).  
2. Decorative icon `aria-hidden` patterns (generally correct).

---

## Domain Scores (P13)

| Domain | Score / 100 | Notes |
|--------|-------------|-------|
| Navigation | **78** | No skip; landmark gaps |
| Forms | **92** | Auth labels strong |
| Images | **93** | SafeImage + alts |
| Dialogs | **72** | Trap incomplete |
| Keyboard | **82** | Sample Tab OK; flows unverified |
| ARIA | **86** | Fresh axe clean; LH search residual |
| Contrast | **80** | Home FAIL |
| Responsive | **88** | Mobile sample only |
| **Overall** | **88** | Weighted composite |

---

## Remaining Risks

- Keyboard users cannot skip chrome efficiently.  
- Screen-reader landmark navigation inconsistent on Auth.  
- Low-contrast listing badges may fail WCAG 1.4.3 on Homepage.  
- Modals may allow Tab to escape dialog into background.  
- Search filter chips may confuse AT if tablist pattern returns.  
- Admin / authenticated commerce flows not axe-certified this run.

---

## Recommended Fixes (Owner-approved hardening sprint — NOT implemented)

1. Add a single **skip-to-main** link in root shell (minimal CSS, no redesign).  
2. Wrap Login/Register (and other bare pages) in **`<main>`**.  
3. Fix ListingCard **contrast** tokens for badge/protection text (token tweak only).  
4. Correct Search **ARIA roles** (chips as tabs or remove tablist).  
5. Add **focus trap** to `ModalContainer` / `CanonicalModal` (behaviour-preserving).  
6. Run full `npm run test:e2e:accessibility` matrix on localhost:3000 with demo auth.  
7. Re-score; target ≥95.

---

## Validation Gates (this phase)

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (a11y SSOT paths) | **PASS** |
| Production server (`next start :3000`) | **PASS** |
| Vitest accessibility + image safety | **PASS** (9) |
| Fresh axe sample | **PASS** (0 violations on sampled pages) |
| Full Accessibility Certification Engine | **NOT EXECUTED** |
| Owner device / SR manual | **NOT EXECUTED** |

---

## Final Audit Verdict

# **FAIL** (score **88 / 100** · target ≥ **95**)

Automated sample axe is encouraging, but **WCAG structural High findings + contrast + incomplete dialog keyboard + incomplete platform matrix** block Accessibility Certification PASS.

**STOP.** No hardening implemented. Await Owner approval for a P13.1 fix sprint.
