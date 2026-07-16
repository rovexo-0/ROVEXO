# ROVEXO My Account — Master UI Specification

**STATUS:**  
**CANONICAL_FROZEN_v1.0**

## Universal UI v1.1 compatibility amendment

Approved 2026-07-15. Account information architecture and frozen behavior remain unchanged. Account and Settings presentation now consume Universal UI v1.1: 60px headers, 44px header controls, 24px icons, 14px body text, 16px section titles, 16px inner padding, 24px section rhythm, 14px cards and shadowless white surfaces.

| Field | Value |
|-------|-------|
| Module | My Account |
| Version | v1.0 |
| Freeze | `ACCOUNT_UI_FREEZE` = `CANONICAL_FROZEN_v1.0` (`lib/account/freeze.ts`) |
| DOM | `data-account-freeze="FROZEN"` · `data-ac-hub-version="v1.0-production"` · `data-account-version="v1.0"` |
| SSOT | `AccountCenterHome` (`.ac-canonical`) + `styles/rovexo/account-canonical-v2.css` |
| Freeze doc | `docs/modules/account/UI_FREEZE.md` |
| Cursor rule | `.cursor/rules/account-v1-freeze.mdc` |
| Freeze date | 2026-07-14 |

## Route

| Route | Purpose |
|-------|---------|
| `/account` | Canonical My Account hub (frozen) |

## Header

- Hub uses `AccountCanonicalShell` with **`hideBack`** (no back / title row on the hub root)
- Bottom navigation remains the Account tab via `BetaAppShell`

## Frozen sections (order)

1. **Profile** — `AccountCanonicalProfile`  
   Avatar · name · verified · member since · rating · followers row  
   **No** View Public Profile · **No** Edit Profile
2. **Quick Stats** — `AccountStatsStrip`  
   Listings · Saved · Orders · Wallet
3. **Seller Performance** — `AccountSellerPerformanceCard`  
   Level badge · rating · score ring · completed sales · progress bar · View details  
   Marker: `data-ac-seller-performance="v1.0-frozen"`
4. **Menu** — `AccountMenuSections`  
   MANAGE · ACCOUNT · SUPPORT · SYSTEM (Sign Out)

## Menu inventory (SSOT)

`lib/account-center/canonical-menu.ts`

**MANAGE:** My Listings · Orders · Saved Items · My Reviews · Wallet  
**ACCOUNT:** Settings · Promotion Tools  
**SUPPORT:** Help Centre · Ideas  
**SYSTEM:** Sign Out

## Architecture

One ROVEXO Account for buy + sell. Capabilities unlock by action and verification — never by role switching or separate Buyer / Seller / Business account types.

## Post-freeze policy

No structural UI changes under My Account **v1.0**.  
Ship deltas as My Account **v1.1** only.  
Bug fixes that preserve layout and copy structure remain allowed.
