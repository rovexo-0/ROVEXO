# ROVEXO Sell — Master UI Specification (UI Polish Product QA)

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc` · UI Polish Foundation Lock v1.0  
**Rule:** No estimated redesign. Values measured from current Sell CSS / CDS / Account tokens. Refine only.

---

## Document control

| Field | Value |
|-------|--------|
| **Page / Module** | Sell (UI Polish — attributes · Price · Quantity · Parcel) |
| **Route(s)** | `/sell` · `/seller/listings/[id]/edit` |
| **Canonical component** | `SellPage` + scoped blocks below |
| **Canonical styles** | `styles/rovexo/sell.css` · `styles/rovexo/canonical-ds.css` |
| **Visual reference** | Current live Sell (Account design system) — refine in place |
| **Canvas reference** | iPhone 17 Pro Max · 430 × 932 (mobile first) |
| **Version** | 1.0-polish-qa |
| **Status** | `Approved` · Implemented (presentation only) |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | Product Owner |
| **Approved date** | 2026-08-01 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0-polish-qa | 2026-08-01 | Cursor | Product QA audit → awaiting Owner decisions + approval |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | `app/(platform)/sell/page.tsx` |
| Page | `features/sell/ui/SellPage.tsx` |
| Attributes | `SellProgressiveAttributes.tsx` · `SellOptionPicker.tsx` |
| Price | `SellPricingBlock.tsx` |
| Quantity | `SellStockQuantityBlock.tsx` |
| Parcel | `SellParcelBlock.tsx` |
| Styles | `styles/rovexo/sell.css` |
| Icons | `lib/design-system/master-icon-system-v1.ts` |
| Foundation | `lib/design-system/ui-polish-foundation-lock-v1.ts` |
| Audit / Plan | `docs/modules/sell/UI_POLISH_*.md` |

---

## STOP findings (must resolve in Owner approval)

1. **Price & Quantity are already inline** on `/sell` — no separate route to remove.  
2. **Occasion** and **Care** are **not** in `ATTRIBUTE_DEFS` — cannot polish without Attribute Engine change (forbidden).  
3. **Compatible With** is engine label **Compatibility** (`compatibility`).  

---

## 1. Master UI Specification

### 1.1 Page purpose (polish slice)

Seller completes taxonomy-driven attributes, sets price and stock, chooses parcel size, then publishes — **same flows**. Polish improves visual consistency with Account/CDS only.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone 17 Pro Max | Owner master |
| Reference width | 430 px | Mobile first |
| Page background | `#ffffff` / CDS background | Locked |
| Horizontal inset | **16px** (`--cds-space-page-x` via Account shell) | Design Decision #001 |
| Control height | **52px** (`--sell-control-height`) | Preserve Sell Absolute Authority |
| Publish height | **56px** | Preserve |
| Section gap | **20px** (`--cds-space-section-gap` on sell shell) | Preserve |

### 1.3 Layout order (unchanged — OUT OF SCOPE blocks frozen)

1. Photos *(out of scope)*  
2. Title *(out of scope)*  
3. Description *(out of scope)*  
4. Category *(out of scope)*  
5. Progressive attributes (Brand · Condition · Colour · Size · Material · Style · Pattern · Compatibility · other taxonomy attrs)  
6. **Price** (inline)  
7. **Quantity** (inline)  
8. **Parcel Size** (row → fullscreen modal)  
9. Publish bar *(out of scope)*  

### 1.4–1.6 Grid / spacing / radius

Reuse Account Full Width + Sell shell tokens only. No second layout system.  
Attribute pickers: fullscreen `ModalContainer` (default keep). Parcel: fullscreen (Owner allowed).  
Price/Quantity: icon column + `CanonicalInput` row (`sell-price-with-icon`).

---

## 2. Component Dimension Table

### Price (`SellPricingBlock`)

| Field | Value |
|-------|--------|
| Purpose | Inline listing price |
| Width | 100% of stack |
| Input height | 52px (`--sell-control-height`) |
| Input radius | 16px CDS / Sell |
| Icon | wallet / cyan — `fieldId="price"` |
| Label | “Price” · 14px |
| Input | 16px · `inputMode="decimal"` |
| Placeholder | `0.00` |
| Optional polish | £ adornment **display only** |
| Forbidden | Validation / sanitize / draft shape changes |

### Quantity (`SellStockQuantityBlock`)

| Field | Value |
|-------|--------|
| Purpose | Inline stock |
| Width | 100% |
| Input height | 52px |
| Icon (current) | **Wrong** — reuses `price` |
| Icon (proposed) | New `quantity`/`stock` master icon entry — UI only |
| Label | “Quantity (Stock)” |
| Input | numeric · max 5 digits |
| Forbidden | Clamp / min / max / blur logic changes |

### Attribute row (`SellNavRow`)

| Field | Value |
|-------|--------|
| Purpose | Open fullscreen option picker |
| Height | Sell control / menu row (52px) |
| Icon | Per `SELL_FIELD_ICONS` / attribute id |
| Interaction | Tap → `SellOptionPicker` |

### Option picker (`SellOptionPicker`)

| Field | Value |
|-------|--------|
| Variant | Fullscreen modal (default) |
| Header | `SellPanelHeader` back + title |
| Search | Optional; prefer `CanonicalInput` if drop-in |
| Single select | Tap → save → close |
| Multi | Apply → close |
| Forbidden | Options / sort / persistence / validation changes |

### Parcel Size

| Field | Value |
|-------|--------|
| Trigger row | `SellNavRow` · icon shipping/orange |
| Picker | Fullscreen · 48px option rows (current) |
| Options | SMALL · MEDIUM · LARGE · EXTRA LARGE |
| Forbidden | Option set · shippingMethod side effects · pricing |

---

## 3. Spacing Table

| Context | Values | Notes |
|---------|--------|-------|
| Page X | 16px | Account / Full Width |
| Section gap | 20px | Sell shell override |
| Price/Qty icon gap | 8px | `sell-price-with-icon__row` |
| Parcel option | 48px h · 16px gap | Preserve behaviour; token-align colours |
| Picker body | Existing `RX_MODAL_BODY` / `gap-ds-*` | No new scale |

---

## 4. Typography Table

| Role | Weight | Size | Notes |
|------|--------|------|-------|
| Page title | — | 17px | `--sell-font-page-title` |
| Section | 600 | 15px | `--sell-font-section` |
| Control / input | — | 16px | `--sell-font-control` |
| Label | — | 14px | `--sell-font-label` |
| Helper / error | — | 13px | `--sell-font-helper` |
| Parcel option label | 600 | 15px | Current parcel freeze |

---

## 5. Colour Table

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#9333ea` / `--cds-color-primary` | Focus · parcel active |
| Text | `#111111` | Labels · values |
| Muted | CDS secondary | Helpers |
| Surface | `#ffffff` | Page · inputs |
| Danger | CDS danger | Validation outline |

---

## 6. Interaction Specification

| Control | Behaviour (unchanged unless noted) |
|---------|-------------------------------------|
| Price input | Decimal keyboard · sanitize digits/dot · validate > 0 on showValidation |
| Quantity | Numeric · empty allowed while typing · clamp on blur |
| Attribute row | Opens picker |
| Single option | Tap → save → close |
| Parcel option | Tap → 200ms → save + shippingMethod → close |
| Polish only | Focus rings · hover · transitionFast existing · no new motion language |

---

## 7. Responsive Specification

One Sell design. Desktop/tablet: max-width / shell only — no desktop-only Sell redesign. Bottom nav visible per Sell freezes.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Touch | ≥ 44×44 on interactive chrome |
| Inputs | 16px text (no iOS zoom) |
| Labels | `aria-label` preserved |
| Errors | `SellInlineError` / validation messages unchanged in meaning |

---

## 9. Developer Notes

1. Implement **only** after Owner **Approved** + answers to STOP decisions.  
2. Touch only Sell polish-scope files listed above (+ icon map entry for quantity).  
3. **Never** edit Attribute Engine option sources, publish engine, validation rules, APIs, DB, Category/Photo/Title/Description/Suggest.  
4. **Never** invent Occasion/Care without separate Owner unlock.  
5. No Commit / Push / Preview / Production for Sell polish until Owner stage approvals.  
6. Product QA checklist in Improvement Plan must all PASS before Owner Preview.

---

## 10. QA Checklist

- [ ] Brand / Material / Condition / Colour / Size / Style / Pattern select correctly  
- [ ] Compatibility (if shown) selects/saves correctly  
- [ ] Price saves · Quantity saves · Parcel saves  
- [ ] Publish · Draft · Edit listing work  
- [ ] Existing listings unchanged  
- [ ] No hydration / React / console / layout-shift / focus / keyboard / back regressions  
- [ ] TypeScript · ESLint · Build · Playwright as required  
- [ ] Listing Card / Homepage untouched  

---

## Owner approval block

| Gate | Status |
|------|--------|
| UI Audit | Complete |
| Improvement Plan | Complete |
| Mockup | Not required |
| STOP decisions A–D | Owner approved (inline · fullscreen · skip Occasion/Care · Compatible With label) |
| Master UI Spec | **Approved** |
| Implementation | Presentation-only applied |
| Commit / Push / Production | **Forbidden** until Owner Preview cert |
