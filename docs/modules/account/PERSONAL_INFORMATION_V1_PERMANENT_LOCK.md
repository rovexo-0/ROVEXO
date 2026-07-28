# ROVEXO Personal Information v1.0 — Permanent Lock

**STATUS:** PERMANENT LOCK · UI/UX APPROVED · FULL WIDTH · MOBILE FIRST · PRODUCTION READY  
**SSOT:** `lib/account/account-settings-v1.ts`  
**UI:** `features/account/components/ProfileEditPage.tsx`  
**Route:** http://localhost:3010/account/profile

## What changed

- Extracted Profile Master Tokens from Profile CSS (no invented px).
- Remapped Personal Information CSS to inherit Full Width / Profile tokens only (row 56 · title 16/400 · chevron 16 · avatar 64 · pad 24).
- Removed PI-only 72px rows, 18px titles, 80px photo, 20px pad.

## Why

Owner UI/UX Master Lock: Personal Information must **be** Profile design — not similar.

## What was not changed

- Field inventory (8 personal fields).
- Save Engine v2.
- Auth / payments / database / API contracts.

## Impact

| Area | Impact |
|------|--------|
| Performance | Neutral |
| Responsive | Aligns with Profile / Full Width |
| Security | None |
| Database | None |

## Official side-by-side QA

1. http://localhost:3010/account  
2. http://localhost:3010/account/profile  

Must match: fonts, weights, paddings, row heights, icons, chevrons, avatar, header, full width.
