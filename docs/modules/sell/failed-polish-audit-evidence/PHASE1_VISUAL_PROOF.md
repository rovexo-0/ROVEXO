# Sell UI Polish Phase 1 — Authenticated localhost visual proof

**Host:** `http://localhost:3000/sell`  
**Session:** Demo seller (cookie auth)  
**Captured:** 2026-08-01  
**Commit / push / deploy:** NONE

## Checklist

| Surface | Result | Evidence |
|---|---|---|
| Price £ | **PASS** | `01-price-pound.png` + `price-evidence.json` (£ visible, padding-left 28px) |
| Quantity | **PASS** | `02-quantity-icon.png` |
| Brand | **PASS** | `03c-brand-row-element.png` + `03-brand-picker.png` |
| Material | **PASS** | `04b-material-row-on-form.png` + `04-material-picker.png` |
| Condition | **PASS** | `05-condition-picker.png` |
| Compatibility | **PASS** | `06-compatibility-input.png` + `06c-compatibility-field.png` (`Compatible With`) |
| Parcel | **PASS** | `07-parcel-picker.png` |
| Category search | **PASS** | `10-category-search-polish.png` |

## Categories used

- Fashion (Brand / Material / Condition): Women's Fashion → Clothing → Dresses / Jeans
- Compatibility: Vehicle Parts → Car Parts → Filters

## Price £ live DOM

```json
{
  "symbolText": "£",
  "display": "block",
  "visibility": "visible",
  "opacity": "1",
  "inputPaddingLeft": "28px",
  "inViewport": true
}
```

Root fix: adornment wraps the **input control only** (not the label) in `SellPricingBlock.tsx`.

## Canonical files touched this pass

- `features/sell/ui/SellPricingBlock.tsx` — £ DOM fix
- `features/sell/ui/SellCategoryPicker.tsx` — CanonicalInput search + picker spacing/typography classes
- `styles/rovexo/sell.css` — £ control-only positioning

## Gate

Screenshots are on authenticated localhost. **Owner visual review required.**  
No commit · no push · no deploy.
