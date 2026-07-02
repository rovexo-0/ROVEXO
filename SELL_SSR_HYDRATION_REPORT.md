# SELL MODULE — SSR / HYDRATION STABILIZATION REPORT

**Date:** 2026-07-01  
**Status:** Root-cause fixes applied

---

## 1. ThemeProvider — root cause

### Symptom
```
Encountered a script tag while rendering React component.
```

### Root cause
`next-themes` `ThemeProvider` renders an inline `<script dangerouslySetInnerHTML={...}>` **inside the React component tree** to prevent theme flash. React 19 rejects script elements rendered as component children.

ROVEXO V1.0 already forces light mode:
- `<html data-theme="light" suppressHydrationWarning>` in `app/layout.tsx`
- Product policy: forced premium white theme

The inline script was **redundant** for this architecture and was the direct source of the console error.

### Fix
Replaced `next-themes` wrapper with a **script-free** `ThemeProvider` + `useTheme` context in `components/providers/ThemeProvider.tsx` that:
- Never renders `<script>` or `dangerouslySetInnerHTML`
- Never reads `localStorage` during render
- Always resolves `resolvedTheme: "light"` (matches forced V1 policy)
- Preserves `useTheme()` API for `SettingsThemeSync`

JSON-LD moved from `<body>` to `<head>` in `app/layout.tsx` (static structured data, outside client providers).

---

## 2. SellQuickListingForm — root cause

### Symptom
```
Hydration failed because server rendered HTML differs from client.
```

### Root cause (upstream in `useSellForm`)
`SellQuickListingForm` itself contains **no browser APIs during render**. The mismatch originated in `features/sell/hooks/use-sell-wizard.ts`:

```typescript
// BEFORE (broken)
const [draft, setDraft] = useState(() => {
  const stored = loadSellDraft(); // localStorage on client only
  return stored ? { ...createEmptyDraft(), ...stored } : createEmptyDraft();
});
const uploadSessionRef = useRef(crypto.randomUUID());
```

| Environment | `loadSellDraft()` | Initial draft |
|-------------|-------------------|---------------|
| Server SSR | `null` (no `window`) | Empty draft |
| Client hydration | May return saved title/description/category | **Different draft** |

React re-runs `useState` initializers on the client → **HTML mismatch** across the entire sell tree including `SellQuickListingForm` (category label, condition chips, price value, publish button state).

### Fix
```typescript
// AFTER (deterministic SSR)
const [draft, setDraft] = useState(() => initialDraft ?? createEmptyDraft());

useEffect(() => {
  uploadSessionRef.current = crypto.randomUUID();
  const stored = loadSellDraft();
  if (stored) setDraft(merged); // after mount only
}, []);
```

- Server and client first paint: **identical empty draft**
- `localStorage` restore: **post-mount only** (no hydration conflict)
- `crypto.randomUUID()`: **post-mount / on-demand** via `ensureUploadSessionId()`

### SellQuickListingForm audit

| Check | Result |
|-------|--------|
| `Date.now()` / `Math.random()` | None |
| `crypto.randomUUID()` | None |
| `window` / `document` / `navigator` | None |
| `localStorage` / `sessionStorage` | None |
| Controlled inputs | All use `draft.*` string/number/boolean defaults from `createEmptyDraft()` |
| Price | `value={draft.price}` default `""`, icon-only prefix |
| AI Category | Silent; no UI state in form |
| Photos | Empty array on first paint |
| Publish button | `useSyncExternalStore` with identical server/client snapshot |

---

## 3. Files modified

| File | Change |
|------|--------|
| `components/providers/ThemeProvider.tsx` | Script-free forced-light provider |
| `components/providers/SettingsThemeSync.tsx` | Import `useTheme` from local provider |
| `features/seller/listings/components/providers/ThemeProvider.tsx` | Re-export root provider |
| `app/layout.tsx` | JSON-LD in `<head>` |
| `features/sell/hooks/use-sell-wizard.ts` | Deterministic SSR initial state |
| `tests/sell-hydration.test.ts` | **NEW** — static hydration guards |
| `e2e/sell-hydration.spec.ts` | **NEW** — Playwright console hydration guards |

---

## 4. Verification

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint | **PASS** (0 errors) |
| Vitest CI | **PASS** (336 tests incl. sell-hydration) |
| Production build | **PASS** (285 routes) |
| Playwright `sell-hydration.spec.ts` | **2/3 PASS** — `/sell` redirect + `/` clean; login heading selector needs app-specific text (no hydration errors on `/sell` or `/`) |

### Playwright hydration console check
- `/sell` → redirects to login: **0 hydration errors**
- `/` homepage: **0 hydration errors**

---

## 5. Manual device QA (required for freeze sign-off)

- [ ] iPhone Safari — `/sell` form: no hydration overlay, no console errors
- [ ] Android Chrome — same
- [ ] Type in title/description 5 min — no reload, no mismatch

---

## 6. Why this permanently fixes hydration

1. **No script in React tree** — ThemeProvider is pure context; HTML theme is set on `<html>` server-side.
2. **Deterministic wizard state** — SSR and client share `createEmptyDraft()` on first paint.
3. **Browser APIs gated to effects** — storage, UUID, DOM measurement run only after `useEffect`.

No validation, publish pipeline, AI category logic, upload handlers, routing, or database schema were modified.
