# ROVEXO Hydration Mismatch — Root Cause (Phase R1.1)

**Status:** REPAIRED  
**Target:** ZERO hydration mismatch for certified surfaces  

## Symptom

Owner mobile: React hydration mismatch warnings / console errors during navigation.

## Root causes (verified)

1. **`<html lang/dir>` pre-paint locale script** — `LOCALE_INIT_SCRIPT` in `app/layout.tsx` mutates `document.documentElement` from `localStorage` before React hydrates, while SSR always emits `lang="en-GB"` / `dir="ltr"`. Classic mismatch on the root element.
2. **CookieConsentBanner server snapshot lied** — `useSyncExternalStore` `getServerSnapshot` returned `"accepted"` (banner hidden) while client `readCookieConsent()` often returns `null` (banner shown). Component is loaded with `ssr: false` today, but the snapshot was still incorrect and unsafe if ever SSR’d.

## Repair (smallest · deterministic only)

| Change | File |
|--------|------|
| `suppressHydrationWarning` on `<html>` (locale script contract) | `app/layout.tsx` |
| Server snapshot → `null` (matches unread consent) | `components/legal/CookieConsentBanner.tsx` |

## Explicitly not touched

Date formatting redesign · Homepage · Conversation Hub · wallet UI · CSS.

## Owner verify

iPhone Safari + Chrome Android + Desktop DevTools: open Home / Account / Browse with a fresh profile (no consent) and with stored locale ≠ en-GB — no hydration mismatch warning.
