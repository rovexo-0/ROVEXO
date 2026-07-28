# ROVEXO My Profile v6.0 — Your Store

**STATUS:** IMPLEMENTED · Owner visual / freeze pending  
**Route:** `/user/[username]` (own profile = My Profile)  
**SSOT:** `features/profile/components/ViewProfilePage.tsx`

## Behaviour

| Surface | Rule |
|---------|------|
| Your Store | Empty / Active / Sold / Drafts only |
| Reviews | Empty or list |
| About | Add Bio / Show Bio · Member since · Verified Seller · Last active |
| Avatar | Default or image · own click → change / remove / upload |
| Loading | Max **3s** → soft empty (no Retry / Home) |
| Fail-closed | API/DB/network → empty store |

## Forbidden on this surface

White pages · Retry · Home · technical / API / DB errors · infinite loading · blank tabs · broken images · crashes · “Something went wrong”

## Create listing

→ `/sell#sell-field-photos` · scroll + autofocus photos

## Gates

Typecheck / ESLint / Vitest when last run: PASS  
Playwright / Lighthouse / Freeze / 8-level Owner audit: **NOT PASS** until Owner verifies
