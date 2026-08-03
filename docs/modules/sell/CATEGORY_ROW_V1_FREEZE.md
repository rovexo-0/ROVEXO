# ROVEXO Sell Flow — Category Row v1.0

**STATUS:** OWNER APPROVED · UI LOCK · FEATURE LOCK · FREEZE CERTIFIED  
**SSOT:** `lib/sell/category-row-v1-freeze.ts`  
**Official:** `http://localhost:3000/sell`  
**Release:** Structural/visual change requires Owner unlock. No commit/push/deploy from this freeze alone.

## Canonical equation

```
ONE SELL = ONE CATEGORY ROW = ONE ICON · ONE LABEL · ONE BREADCRUMB · ONE CHEVRON
```

## Render tree (only)

```
SellCategoryBlock
 └── SellNavRow
      └── ListingAttributeRow
           ├── SellFieldMasterIcon (exactly one)
           ├── ListingAttributeLabel → Category
           ├── Category Breadcrumb (description under label)
           └── Chevron
```

`ListingAttributeIcon` is **forbidden** as a second wrapper (was the duplicate-icon root cause).

## Design rules

| Slot | Spec |
|------|------|
| Label | Inter · 16px · 500 · 24px · `#111111` |
| Breadcrumb | Inter · 14px · 400 · 22px · secondary |
| Icon | Left · single · vertical center |
| Chevron | Right aligned |
| Spacing | Sell Design System |

## Root cause (resolved)

- Breadcrumb not in right `value` slot — under label as `description`
- Duplicate icon wrapper removed
- Duplicate `aria-label="Category"` removed
- Single `ListingAttributeLabel`
- No CSS hide / opacity / absolute / z-index hacks

## Regression (must stay PASS)

Category · Brand · Condition · Colour · Material · Size · Parcel · Shipping — exactly one label each.

## Post-freeze

Allowed: bug · performance · a11y.  
Forbidden: redesign · parallel Category rows · duplicate render paths.
