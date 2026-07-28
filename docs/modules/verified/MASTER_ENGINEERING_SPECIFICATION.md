# ROVEXO Verified Engine — Master Engineering Spec

| Field | Value |
|---|---|
| **Module** | ROVEXO Verified Engine v1.0 |
| **Status** | IMPLEMENTATION PASS — awaiting Owner approval |
| **Badge** | ROVEXO VERIFIED (single badge only) |
| **Component** | `components/VerifiedBadge.tsx` (7px SVG) |
| **SSOT** | `lib/verified/` |

## Scope

- Verified evaluation (personal / self-employed / LTD)
- Data Match Engine (fail closed)
- Smart Visibility (Holiday Mode, Promote Listings, Business Bank)
- Automatic recalculation → `profiles.verified`
- Money gate on withdraw (`assertRovexoVerifiedForMoney`)

## Forbidden

No commit / push / deploy / live migrations / fake secrets / admin override badges / paid badges.
