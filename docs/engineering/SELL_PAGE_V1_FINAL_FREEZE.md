# ROVEXO Sell Page v1.0 — Absolute Authority gate

**STATUS:** NOT frozen / NOT certified until Level 8 = 100% PASS  
**ROUTE:** `/sell` · `features/sell/ui/SellPage.tsx`

## Locked fixes

| Level | Requirement | Implementation |
|-------|-------------|----------------|
| L3 | My Account design system | `AccountCanonicalShell` + CDS rows/inputs/buttons |
| L4 | Compact whitespace | `.sell-aa-stack` gap **12px** |
| L5 | Category | Suggested / Choose another / Search · DB tree · no AI label · no drafts |
| L6 | Parcel | SMALL / MEDIUM / LARGE / EXTRA LARGE · no Recommended |
| L7 | Success | X · Photo · Published · Your listing is now live. · Share · View · Sell Another |

## Publish gate

Photo + Title + Description + Category + Price + Parcel. Attributes optional.

## Production

Blocked until Typecheck · ESLint · Build · Vitest · Playwright · responsive all PASS and Owner visual approval.
