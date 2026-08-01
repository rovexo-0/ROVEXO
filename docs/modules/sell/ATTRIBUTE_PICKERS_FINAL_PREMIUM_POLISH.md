# Sell Attribute Pickers — Final Premium UI Polish

**STATUS:** WAITING FOR OWNER VISUAL APPROVAL  
**Host:** `http://localhost:3000/sell` (authenticated)  
**Commit / push / deploy:** NONE

## Scope (visual only)

Canonical pickers only:

- `SellOptionPicker` (Brand / Material / Condition / …)
- `SellCategoryPicker`
- `SellParcelBlock` Parcel picker
- Shared `SellPanelHeader`
- Existing Price £ / Quantity unchanged behaviour (proof screenshots included)

**Not done (would be redesign / new features):** brand logos, material-specific art, condition descriptions/data, “See all brands” CTA, Attribute Engine changes.

## Files changed

| File | Change |
|---|---|
| `features/sell/ui/SellOptionPicker.tsx` | Search icon · Selected badge + purple check trailing · selected row class |
| `features/sell/ui/SellCategoryPicker.tsx` | Same search chrome + icon |
| `features/sell/ui/SellPrimitives.tsx` | Picker header class hooks |
| `features/sell/ui/SellParcelBlock.tsx` | Subtle Selected badge when active |
| `styles/rovexo/sell.css` | Search / header / section / row / selected / parcel rhythm |
| `tests/master-icon-system-v1.test.ts` | Parcel row `height: auto` + `min-height: 48px` (fixes overlap) |

## Polish summary

1. **Search** — 48px height, 16px radius, muted placeholder, purple focus ring, leading search icon, consistent padding  
2. **Header** — safe-area, 44px back target, clearer title weight  
3. **Section labels** — uppercase · tracking · secondary colour (Popular / Catalog…)  
4. **Rows** — ~52px min · rounded hover/selected surface · readable title weight  
5. **Selected** — purple “Selected” pill + circular check (no animation)  
6. **Parcel** — auto-height rows (no title/description overlap) · selected surface + badge · radio retained  

## Before / After evidence

Directory: `docs/modules/sell/failed-polish-audit-evidence/`

| Screen | Before | After |
|---|---|---|
| Brand | `before/03-brand-picker.png` | `after/03-brand-picker.png` + `after/03-brand-picker-selected.png` |
| Material | `before/04-material-picker.png` | `after/04-material-picker.png` + `*-selected.png` |
| Condition | `before/05-condition-picker.png` | `after/05-condition-picker.png` + `*-selected.png` |
| Compatibility | `before/06-compatibility-input.png` | `after/06-compatibility-input.png` |
| Category search | `before/10-category-search-polish.png` | `after/10-category-search-polish.png` |
| Parcel | `before/07-parcel-picker.png` | `after/07-parcel-picker.png` + `*-selected.png` |
| Price £ | `before/01-price-pound.png` | `after/01-price-pound.png` |
| Quantity | `before/02-quantity-icon.png` | `after/02-quantity-icon.png` |

## Visual QA checklist

| Gate | Result |
|---|---|
| Cleaner / more premium scan | PASS (Owner confirm) |
| Search chrome improved | PASS |
| Selected badge + check | PASS |
| Touch ≥44 / rows ~48–52 | PASS |
| Parcel no overlap | PASS |
| No logic / API / DB / validation / publish / Attribute Engine | PASS |
| TypeScript | PASS |
| ESLint (touched files) | PASS |
| Vitest (polish + master icons) | PASS |
| Light theme | PASS (authenticated localhost) |
| Dark theme | N/A on Sell pickers (light Sell surface) |
| Accessibility (focus ring, aria selected label) | PASS |
| Zero behaviour change (tap → select → return) | PASS |

## Owner gate

Review authenticated `http://localhost:3000/sell` + after screenshots.  
**Approve before Preview.** No commit / push / deploy until then.
