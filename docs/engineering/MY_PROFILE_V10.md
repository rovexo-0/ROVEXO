# ROVEXO My Profile v10.0

**STATUS:** IMPLEMENTED · Owner visual / freeze pending  
**Route:** `/user/[username]`  
**SSOT:** `features/profile/components/ViewProfilePage.tsx`

## Create Listing (v10)

- Height **42px** · radius **21px** · font **16/600** · pad **0 20px** · icon **16px**
- Full width · purple · light shadow (not checkout/withdraw scale)
- Opens **`/sell`** without fail

## Spacing

Increased gaps: avatar → name → username → counters → tabs → empty CTA

## About

- Empty: “No bio added yet.” + Add Bio  
- Edit Bio · character counter · Save Changes  
- Seller information · Profile details

## Forbidden

Retry · Home · FailClosed panels · Browse Marketplace · Listings tab · oversized CTAs (56/60/64)

## Gates

Typecheck / ESLint / Vitest: PASS (last run)  
Playwright / Freeze / 8-level Owner audit: **NOT PASS** until Owner verifies
