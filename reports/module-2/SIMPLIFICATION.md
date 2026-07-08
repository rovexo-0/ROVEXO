# Module 2 — Simplification Report

## Objective

Consolidate core marketplace surfaces under the unified design system without changing marketplace behaviour.

## Completed simplifications

### Showcase (homepage listing cards)
- Grid lock CSS migrated from hardcoded `#ffffff` / `#2563eb` to design tokens
- Dark theme rules extended for grid background, card shell, title, seller meta
- `ListingCard` shows compact `BusinessBadge` for business-tier sellers

### Business Badge SSOT
- New `BusinessBadge` component with `compact` and full variants
- `resolveBusinessBadgeKinds()` helper for multi-verification surfaces
- Wired into: ListingCard, ProfileCard, ProductSellerCard, BusinessProfileCard, BusinessDirectoryPage

### Upload Listing (sell flow)
- `sell.css` surfaces use `var(--ds-color-*)` for background, borders, inputs, upload zone, condition chips
- Removed hardcoded white/gray hex values on primary sell surfaces

### Listing Review (product detail)
- `ProductSellerCard` receives `sellerTier` and shows business badge when applicable

### Promotional Tools
- `SellerPromotionCard` renamed section to **Promotional Tools**
- Primary CTA links to canonical `/plans` surface

### Theme (Black / White)
- Showcase grid and sell upload surfaces respect `data-theme="light|dark"`
- Screenshots captured for both themes on homepage

## Not removed (intentional)

| Item | Reason |
|------|--------|
| `BusinessCenterPage.tsx` | Dead code — not routed; left untouched to avoid scope creep |
| `archive/`, mirror folders | Governance review still pending |
| Full platform dark polish | Remaining surfaces deferred to Module 3 / final UI audit |

## Screenshots

All under `reports/module-2/screenshots/` — captured from live app on port 3025.
