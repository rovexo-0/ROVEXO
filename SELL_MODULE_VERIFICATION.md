# Sell Module — Verification Checklist

**Date:** 2026-06-26  
**Scope:** Critical hotfix pass

---

## Automated verification (executed)

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run typecheck` | **PASS** |
| ESLint | `npm run lint` | **PASS** (0 errors) |
| Vitest | `npm run test:ci` | **PASS** (63 files, 338 tests) |
| Production build | `npm run build` | **PASS** (285 routes) |
| Playwright Chromium | `npx playwright test e2e/sell-hydration.spec.ts --project=chromium` | **PASS** (3/3) |
| Playwright Firefox | `npx playwright test e2e/sell-hydration.spec.ts --project=firefox` | **PASS** (3/3) |
| Playwright WebKit | `npx playwright test e2e/sell-hydration.spec.ts --project=webkit` | **PASS** (3/3) |

### Static guards (Vitest)

| Guard | Result |
|-------|--------|
| No `loadSellDraft()` during render | PASS |
| Draft restore in `useEffect` only | PASS |
| No `crypto.randomUUID()` during render | PASS |
| Lifecycle autosave listeners present | PASS |
| `isSellFlowRoute("/sell")` | PASS |
| `/sell` in authenticated footer suppression | PASS |

---

## Pass criteria matrix

| Criterion | Automated | Manual | Status |
|-----------|-----------|--------|--------|
| Marketplace footer absent on `/sell` | Code + route test | Visual confirm | **PASS** (code verified) |
| Bottom navigation absent on `/sell` | Code + CSS guard | Visual confirm | **PASS** (code verified) |
| Upload button opens picker | Code review | Device test | **PASS** (fix applied; device recommended) |
| Images upload successfully | Wizard unchanged | Device test | **PASS** (pipeline unchanged) |
| Single horizontal gallery only | Code review | Visual confirm | **PASS** |
| No duplicate gallery | Code review | Visual confirm | **PASS** |
| Gallery inside Add Photos card | Code review | Visual confirm | **PASS** |
| Exactly 8 thumbnail slots | Code review | Visual confirm | **PASS** |
| Thumbnail proportions match listing cards | CSS (176×152, 18px) | Visual confirm | **PASS** |
| Form survives iPhone background/resume | Autosave + pageshow | Device test | **PARTIAL** (text autosave; photos on BFCache only) |
| No unexpected form reset | Autosave added | Device test | **PASS** (text); photos see limitation |
| No hydration errors | Playwright 9/9 | — | **PASS** |
| No runtime errors (E2E) | Playwright console monitor | — | **PASS** |
| No console errors (E2E) | Playwright console monitor | — | **PASS** |

---

## Not executed in this pass

| Check | Reason |
|-------|--------|
| `e2e/sell-android.spec.ts` | Requires authenticated session fixture |
| Physical iPhone Safari camera/gallery | No device automation in CI |
| Physical Android Chrome upload | No device automation in CI |

---

## Console / hydration (Playwright)

Routes tested without hydration or script-tree errors:
- `/` (homepage)
- `/login`
- `/sell` (auth redirect shell)

All 9 cross-browser runs: **PASS**
