# ROVEXO V1.0 — Global Mobile & UI Stabilization Report

**Date:** 2026-06-26  
**Status:** Automated gates PASS — Manual device QA required for release sign-off

---

## 1. Global footer removal (product decision)

### Action
Marketplace footer **permanently deleted** from the platform — not hidden, not conditional.

### Removed components
- `components/Footer.tsx`
- `components/layout/ConditionalSiteFooter.tsx`
- `features/help/components/HelpPageFooter.tsx`
- `features/help/components/NeedHelpLink.tsx`

### Removed integrations
- `AppShellLayout` — no footer render
- `SettingsPage`, `SellerDashboardPage`, `BusinessDashboardPage`, `OrdersListPage` — `HelpPageFooter` removed

### Removed CSS
- `styles/rovexo/white-v1-global.css` — marketing footer overrides
- `styles/rovexo/shell.css` — `.rx-footer` block

### Preserved (not marketplace footer)
- `RovexoFooterNavigation` — mobile **bottom tab navigation** (Home, Search, Sell, Saved, Account)
- `SellPublishFooter` — sticky publish bar on sell flow
- `CheckoutPayFooter` — checkout pay bar
- Auth form footers (sign-in links on login/register)

Legal content remains at `/legal`, `/help/*`, `/support` — reachable by direct URL, not via global footer.

---

## 2. Sell form state persistence (P0)

### Root cause
Draft text saved to localStorage only on manual save; photos never persisted. Safari background/tab kill lost all in-memory state.

### Fix
- `lib/sell/draft-photo-storage.ts` — IndexedDB blob storage for up to 8 photos
- `lib/sell/draft-storage.ts` — upload session ID persistence
- `lib/sell/persist-sell-draft.ts` — unified async snapshot (text + photos + session)
- `use-sell-wizard.ts`:
  - Load photos + session on mount
  - Debounced autosave (1.5s)
  - Persist on `visibilitychange` / `pagehide`
  - Restore on BFCache `pageshow` (text + photos)

---

## 3. Sell photo UX (from prior hotfix — verified)

- Single Add Photos card with embedded 8-slot horizontal gallery
- Programmatic file picker (no visible native input)
- Listing card proportions (176×152, 18px radius)

---

## Automated validation (executed 2026-06-26)

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| ESLint | PASS (0 errors) |
| Vitest | PASS (344/344) |
| Production build | PASS (285 routes) |
| Playwright Chromium/Firefox/WebKit | PASS (9/9) |

---

## Manual QA — NOT EXECUTED in this environment

The following require physical devices and **cannot be marked PASS** without human verification:

- Manual iPhone Safari
- Manual Chrome Android
- Samsung Internet
- Firefox Mobile
- Edge Mobile
- Older iOS / Android devices

**Release cannot be marked COMPLETE until manual device matrix is signed off.**

---

## Files modified

See `tests/platform-no-footer.test.ts` for automated guards.
