# ROVEXO Homepage Search Bar Only v1.0

**STATUS:** OWNER APPROVED · PERMANENT FREEZE · 2026-07-23

## What changed

Marketplace Search Bar (ROVEXO + Search header) mounts **only** on Homepage (`/`).

## Why

Owner Absolute Law: Search Bar must not exist outside Homepage — not CSS-hidden.

## What was not changed

- Homepage Search Bar UI / tokens
- AccountCanonicalShell Back + Title headers
- Conversation Hub header
- Search Overlay system
- Bottom navigation

## Impact

| Area | Impact |
|---|---|
| Performance | Positive — less DOM off Homepage |
| Responsive | Unchanged tokens; chrome absent off `/` |
| Security | None |
| Database | None |

## SSOT

`lib/header/homepage-search-bar-only-v1.ts` · `features/header/HeaderProvider.tsx`
