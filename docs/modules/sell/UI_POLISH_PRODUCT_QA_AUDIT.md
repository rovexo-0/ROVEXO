# ROVEXO Sell — UI Polish Product QA · Audit

| Field | Value |
|-------|--------|
| **Status** | AUDIT COMPLETE · AWAITING OWNER APPROVAL |
| **Route** | `/sell` (edit: `/seller/listings/[id]/edit`) |
| **Scope** | Sell UI polish only (Brand · attributes · Price · Quantity · Parcel Size) |
| **Date** | 2026-08-01 |
| **Foundation** | `lib/design-system/ui-polish-foundation-lock-v1.ts` |
| **Parent freezes** | Sell Absolute Authority · Blood XXII · Catalog XXXII (Sell UI frozen except Owner unlock) |

---

## Critical findings (STOP / report before implement)

### 1. Price and Quantity are already inline

There is **no** `/sell/price` or `/sell/quantity` route. Both live on the single Sell form:

| Field | Component | Presentation |
|-------|-----------|--------------|
| Price | `SellPricingBlock.tsx` | Inline `CanonicalInput` `inputType="price"` |
| Quantity | `SellStockQuantityBlock.tsx` | Inline `CanonicalInput` `inputMode="numeric"` |

Owner instruction “REMOVE ONLY THE EXTRA PAGE” and “replace navigation with inline component” **does not match current architecture**. No page-navigation removal is available without inventing a functional change.

**Recommendation:** Treat Price / Quantity as **presentation polish only** (icons, £ affordance, spacing). Confirm with Owner that “extra page” meant fullscreen attribute pickers, not Price/Quantity routes.

### 2. Occasion and Care do not exist

`ATTRIBUTE_DEFS` has no `occasion` or `care` entries. They are not rendered. Adding them = Attribute Engine / taxonomy change → **forbidden** under this QA.

### 3. “Compatible With” = Compatibility

Engine id `compatibility`, label **“Compatibility”**. Rename = copy/label change in attribute defs — Owner must confirm if label polish is allowed (UI-only) vs engine change.

---

## 1. Architecture map (current)

```
/sell → SellPage (AccountCanonicalShell + AccountPageStack)
  Photos · Title · Description · Category     [OUT OF SCOPE]
  SellProgressiveAttributes                   [Brand / Condition / Colour / Size / Material / Style / Pattern / …]
  SellPricingBlock                            [Price INLINE]
  SellStockQuantityBlock                      [Quantity INLINE]
  SellParcelBlock                             [row → fullscreen ModalContainer]
  SellPublishBar                              [OUT OF SCOPE]
```

Select attributes open **`SellOptionPicker`** via local `activeId` — `ModalContainer variant="fullscreen"` (page-like overlay, **not** a Next.js route). Parcel Size uses the same fullscreen pattern inside `SellParcelBlock`.

---

## 2. Attribute surfaces

| Owner label | Engine | UI | Route? |
|-------------|--------|-----|--------|
| Brand | `brand` select-single searchable | `SellNavRow` → fullscreen picker | No |
| Material | `material` | same | No |
| Condition | `condition` → `draft.condition` | same | No |
| Colour | `colour` label “Colours” + swatches | same | No |
| Size | `size` grid-single | same | No |
| Style | `style` (taxonomy-gated) | same | No |
| Pattern | `pattern` (taxonomy-gated) | same | No |
| Occasion | **missing** | — | — |
| Care | **missing** | — | — |
| Compatible With | `compatibility` / “Compatibility” | text or picker | No |
| Other optional | Model, Storage, Season Rating, … | text = inline `CanonicalInput`; select = picker | No |

---

## 3. Price (logic must stay identical)

| Concern | Current |
|---------|---------|
| UI | `CanonicalInput` · `type="number"` · `inputMode="decimal"` · `step="0.01"` |
| State | `draft.price` string via `updateDraft` |
| Sanitize | `replace(/[^\d.]/g, "")` on change |
| Validation | `Number(draft.price) > 0` via `getListingValidationErrors` |
| Currency | `lib/sell/currency.ts` exists — **not shown** on input (no £ prefix) |
| Icon | `SellFieldMasterIcon fieldId="price"` (wallet/cyan) |

---

## 4. Quantity (logic must stay identical)

| Concern | Current |
|---------|---------|
| UI | Inline `CanonicalInput` · `inputMode="numeric"` |
| State | `draft.stock` · local `editingValue` while focused |
| Blur | `parseInventoryInput` · clamp `1…99999` |
| Publish | Stock **not** in quick validation field list |
| Icon bug | `fieldId="price"` — **reuses Price icon** |
| Dead CSS | `.sell-stock-stepper*` in `sell.css` — unused by current TSX |

---

## 5. Parcel Size

| Item | Current |
|------|---------|
| Trigger | Inline `SellNavRow` |
| Picker | Fullscreen modal (Owner: may remain separate) |
| Options | SMALL / MEDIUM / LARGE / EXTRA LARGE |
| On select | `parcelSize` + `shippingMethod: "delivery_available"` + 200ms close |
| Polish risk | Changing option ids / `onSelect` / shippingMethod = **shipping logic** — forbidden |

---

## 6. Measured polish issues (UI-only)

| # | Issue | Severity |
|---|-------|----------|
| 1 | Quantity uses Price master icon | High (visual) |
| 2 | No £ display affordance on Price | Medium |
| 3 | Dead `.sell-stock-stepper*` CSS | Low (cleanup) |
| 4 | `sell-aa-block` class with no CSS rules | Low |
| 5 | Comment vs token: 48px vs `--sell-control-height: 52px` | Low |
| 6 | Parcel hard-coded colours / 48px rows vs CDS vars | Medium |
| 7 | Option picker search uses raw input, not `CanonicalInput` | Medium |
| 8 | Fullscreen pickers feel like “separate pages” | Owner call: keep fullscreen vs sheet |
| 9 | Style / Pattern / Compatibility missing from `SELL_FIELD_ICONS` for some ids | Low |

---

## 7. Out of scope (must not change)

Category · Photos · Title · Description · Price/Quantity/Publish/Suggest logic · Attribute Engine · Parcel calculation · Shipping provider · Listing Cards · API · DB

---

## 8. Canonical files (absolute)

- `/home/mihai/ROVEXO/features/sell/ui/SellPage.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellProgressiveAttributes.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellOptionPicker.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellPricingBlock.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellStockQuantityBlock.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellParcelBlock.tsx`
- `/home/mihai/ROVEXO/features/sell/ui/SellPrimitives.tsx`
- `/home/mihai/ROVEXO/styles/rovexo/sell.css`
- `/home/mihai/ROVEXO/lib/design-system/master-icon-system-v1.ts`
- `/home/mihai/ROVEXO/lib/sell/attribute-engine.ts` (**read-only** for this QA)
- `/home/mihai/ROVEXO/lib/sell/currency.ts` (**display-only** if used)
- `/home/mihai/ROVEXO/lib/sell/inventory.ts` (**read-only**)

---

## Verdict

Ready for Owner decision on Improvement Plan + Master UI Spec.  
**No implementation until explicit Owner APPROVED.**  
**No Commit · No Push · No Preview · No Production** for Sell polish.
