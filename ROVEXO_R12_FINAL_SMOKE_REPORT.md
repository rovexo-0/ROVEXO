# ROVEXO R1.2 — FINAL SMOKE REPORT

**Status:** CONDITIONAL FAIL (menținut)  
**Certification:** NOT GRANTED — `FUNCTIONAL STABILITY CERTIFIED R1.2` nu poate fi solicitat  
**NO commit · NO push · NO deploy · NO optimizare / refactor / feature nou**

---

## Executive verdict

| Layer | Result |
|-------|--------|
| Technical gates (Owner already accepted) | PASS |
| Playwright suite (`--retries=0`) | **FAIL** — 86 passed · **23 failed** · 2 skipped |
| Console during Playwright | **FAIL** — Image 400 present |
| Agent surface smoke on `:3000` | Partial — guest redirected to Sign In for protected routes |
| Owner practical validation | **WAITING OWNER** |

---

## Timing

| Phase | Duration |
|-------|----------|
| Playwright core suite | **177 s** (~2.95 min) |
| Surface smoke (`scripts/r12-surface-smoke.mjs`) | **13 s** |
| **Total measured execution** | **~190 s** (~3.2 min) |

Artifacts root: `test-results/r12-smoke/`

---

## Playwright (retries = 0 · no masked retries)

**Command:** chromium project · listing/full-demo/messages/commerce/accessibility/responsive/marketplace/navigation/mobile-scroll/welcome specs  
**Exit:** `1`  
**Log:** `test-results/r12-smoke/playwright-core.log`  
**HTML report:** `test-results/r12-smoke/playwright-report/index.html`  
**Failure screenshots:** 23 under `test-results/r12-smoke/artifacts/**/test-failed-1.png`

### Passed (high-signal)

- Full Demo certification steps exercised (login / create product / homepage / search / buy now …)
- Listing lifecycle: **PUBLISH · HOMEPAGE · SEARCH · CATEGORY · STORE · PRODUCT DETAILS · DELETE** — DELETE PASS (`listing-lifecycle-certification` 3.4s)
- Inbox Messages + Notifications + responsive matrix — majority PASS
- Accessibility WCAG audits — PASS
- Commerce canonical redirects — PASS
- Responsive homepage layouts — PASS

### Failed (23) — not ignored

1. canonical-header-navigation — homepage → listing → back  
2. canonical-header-navigation — direct listing → back  
3. marketplace — homepage search/categories/featured  
4. marketplace — nested category slug  
5. mobile-scroll — `/` scrollable  
6. mobile-scroll — `/login` scrollable  
7. mobile-scroll — login scroll-margin  
8. mobile-scroll — search overlay fullscreen  
9–13. navigation-audit — bottom nav tabs (Home/Search/Sell/Saved/Account)  
14. navigation-audit — bottom nav visible on homepage  
15. navigation-audit — logo → homepage  
16–18. navigation-audit — Messages/Notifications/Account header auth  
19–20. navigation-audit — `/login` · `/register` loads  
21–23. navigation-audit — homepage responsive shells (mobile/tablet/desktop)

Example failure capture:  
`test-results/r12-smoke/artifacts/canonical-header-navigatio-b20ef--→-back-returns-to-homepage-chromium/test-failed-1.png`

---

## Console gate

| Banned signal | During Playwright | During agent surface smoke |
|---------------|-------------------|----------------------------|
| ChunkLoadError | 0 observed | 0 |
| releasePointerCapture | 0 observed | 0 |
| NotFoundError | 0 observed | 0 |
| Hydration mismatch | 0 observed | 0 |
| PGRST205 | 0 observed | 0 |
| POST 500 | 0 observed | 0 |
| Storage Object not found | 0 observed | 0 |
| **Image 400** | **FAIL — 41 log hits** | 0 (guest/login-heavy path) |

### Image 400 evidence (remaining defect)

Upstream optimizer failures during Playwright webServer logs, including Owner account products still referencing missing Storage objects:

- `…/b2002033-…/76f11b6f-…/1785518430996-ef5e336f.jpg`
- `…/b2002033-…/d6b6ed58-…/1785582025954-4309298d.jpg` (+ additional frames)
- also demo path: `…/full-demo-refund-….jpg`

**Console is NOT 100% clean.** R1.2 certification blocked.

---

## Owner-required surfaces

| Surface | Agent result | Notes |
|---------|--------------|-------|
| Desktop | PASS* | *guest; many routes → Sign In |
| Homepage | PASS* | screenshot = Sign In (private launch redirect) · `desktop-homepage.png` |
| Browse | PASS | `/search` 200 · `desktop-browse.png` |
| Categories | PASS | `/categories` 200 · `desktop-categories.png` |
| Search | PASS | `/search?q=pillow` 200 · `desktop-search.png` |
| Listing | PASS* | no listing link on guest homepage |
| Upload | PASS* | auth-redirect · `desktop-upload.png` |
| Publish | PASS* | auth-redirect · covered by Playwright PUBLISH PASS |
| Delete | NOT_EXECUTED (agent) / **PASS (Playwright)** | listing-lifecycle DELETE PASS |
| Inbox | PASS* | auth-redirect · Playwright Inbox PASS |
| Orders | PASS* | auth-redirect · `desktop-orders.png` |
| Wallet | PASS* | auth-redirect · `desktop-wallet.png` |
| Profile | PASS* | auth-redirect · `desktop-profile.png` |
| Business | PASS* | auth-redirect · `desktop-business.png` |
| Settings | PASS* | auth-redirect + back probe · `desktop-settings.png` |
| Navigation | FAIL (Playwright) | 23 nav/marketplace/mobile-scroll failures |
| Back | PASS (agent probe) / FAIL (Playwright header-back) | conflict — PW FAIL wins for gate |
| Refresh | PASS (agent homepage reload) | |
| Infinite scroll | PASS (agent scroll probe) | |
| Mobile Safari | PASS* | emulation · `mobile-safari-home.png` |
| Chrome Android | PASS* | emulation · `chrome-android-home.png` |
| Responsive layout | PASS* (agent) / mixed (PW) | PW responsive homepage PASS; nav responsive FAIL |
| Touch | PASS | |
| Swipe | PASS | pointer swipe probe |
| Long scroll | PASS | |
| Rotation | PASS | |

\*Agent smoke was largely **unauthenticated** (Sign In page). It does **not** replace Owner logged-in practical validation.

Surface JSON: `test-results/r12-smoke/surface-smoke.json`

---

## Playwright captures (paths)

- HTML report: `test-results/r12-smoke/playwright-report/index.html`
- Suite log: `test-results/r12-smoke/playwright-core.log`
- Failure PNGs: `test-results/r12-smoke/artifacts/**/test-failed-1.png` (23)
- Surface PNGs: `test-results/r12-smoke/screenshots/*.png` (14)

## Console capture (summary)

- Clean agent surface run: `bannedConsoleCount: 0` in `surface-smoke.json`
- Dirty Playwright run: Image 400 × 41 in `playwright-core.log` (not clean)

---

## Remaining defects (blocking certification)

1. **Playwright 23 failures** — navigation-audit / marketplace homepage selectors / mobile-scroll / header-back (retries=0, not ignored).  
2. **Image 400** — broken Storage refs still live for Owner (`b2002033-…`) and at least one demo image. R8 purged only the two approved Travel pillows; other CEO listings still produce Image 400.  
3. **Owner practical smoke incomplete** — agent could not certify authenticated Homepage/Listing/Upload/Publish/Business UX; Owner must validate on device with clean console.  
4. Transient `:3000` hang observed mid-session (search timeout) — recovered after hard restart; note for Owner session stability.

---

## Already accepted (unchanged)

R8 purge PASS · zeroRemnants · Seller Queue PASS · PGRST205=0 · TypeScript · ESLint · Vitest · Next Build  
Official purge evidence kept: `ROVEXO_R12_CEO_PURGE_REPORT.json` · `ROVEXO_R12_R8_VERIFY.json`

---

## STOP

**R1.2 remains CONDITIONAL FAIL.**  
Do not request `FUNCTIONAL STABILITY CERTIFIED R1.2` until:

1. Playwright failures are resolved or Owner accepts root-cause + re-run = 100% PASS  
2. Image 400 = 0 on live smoke  
3. Owner validates all listed surfaces on Desktop + Mobile Safari + Chrome Android with a clean console  

No commit · no push · no deploy · no new development until that Owner certification.
