# ROVEXO MASTER ENGINE v1.0 (LOCK)

| Field | Value |
|---|---|
| **Module** | ROVEXO MASTER ENGINE v1.0 |
| **SSOT** | `lib/master-engine/` |
| **Activation** | `activateProductionRules()` |
| **PRODUCTION_READY** | TRUE |
| **ACTIVE** | FALSE |

## Golden rule (LOCK)

**NO FEATURE MAY BE IMPLEMENTED OUTSIDE THE MASTER ENGINE.**

| Wrong | Correct |
|---|---|
| `if (user.hasListings) showHolidayMode()` | `resolveFeatureVisibility("holiday-mode", user)` |
| `if (user.isVerified) showVerifiedBadge()` | `resolveVerifiedStatus(user)` |
| `showBusinessBank()` | `resolveBusinessVisibility(user)` |
| `if (user.hasListings) showStoreShowcase()` | `resolveStoreShowcaseVisibility(user)` |
| `<p>{error.message}</p>` | `toUserSafeFailClosedMessage()` / `<FailClosedPanel />` |

Every feature must `registerSmartFeature()` / `registerStoreShowcase()` / `registerFailClosedEngine()` then resolve via Master Engine APIs. No exceptions.

Local / QA / Demo / Certification / Visual / E2E → **SHOW EVERYTHING**  
Only before production → `activateProductionRules()`  

## One switch

`activateProductionRules()` activates Visibility · Verified · Wallet · Balance · Payment · Business · Profile · Settings · Security · Feature · Smart Platform engines together.

## Inventory lock

- **Profile:** Favourites · Balance · Orders · Holiday Mode · Promote · Settings · Help · Legal · Sign Out  
- **Settings:** Account details · Notifications · Privacy · Security · Verification · Addresses · Language · Currency · Delete account  
- **Wallet:** Available · Pending · Processing · Locked · Withdraw · Transactions · Payment Methods · Personal Bank · Business Bank  

Nothing is deleted — only shown or hidden when production rules are active.
