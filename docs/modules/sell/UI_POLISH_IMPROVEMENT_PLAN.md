# ROVEXO Sell — UI Polish Product QA · Improvement Plan

| Field | Value |
|-------|--------|
| **Status** | AWAITING OWNER APPROVAL |
| **Page** | Sell only (`/sell`) |
| **Foundation** | UI Polish Foundation Lock v1.0 |
| **Mockup** | **Not required** if Owner confirms refine-only on existing Account/Sell system. Request local gallery only if Owner wants fullscreen→sheet visual compare. |
| **Implementation** | **FORBIDDEN** until Master UI Spec **Approved** |

---

## Principle

```
REFINE → ALIGN → REUSE → PRESERVE
Never: redesign · Attribute Engine edits · Publish/validation/API/DB · shipping logic
```

---

## Owner decisions required (before any code)

| # | Question | If YES | If NO |
|---|----------|--------|-------|
| A | Price/Quantity “extra page” = **misread** (already inline)? | Polish presentation only | Clarify which UI to remove |
| B | Attribute pickers stay **fullscreen**? | Visual density / CanonicalInput search only | Spec sheet variant (UI-only) |
| C | Add **Occasion** / **Care** fields? | **STOP** — needs Attribute Engine + Owner architecture unlock | Skip; cannot polish missing fields |
| D | Rename “Compatibility” → “Compatible With”? | Label-only in `ATTRIBUTE_DEFS` if Owner treats as UI copy | Keep Compatibility |

**Default plan assumes A=YES, B=YES (fullscreen), C=NO, D=Owner choice.**

---

## Workstreams (proposed — UI only)

### A — Price (inline — keep)

- Optional £ prefix / adornment via existing CDS / `lib/sell/currency.ts` **display only**
- Icon + row alignment polish (`sell-price-with-icon`)
- **Do not** change sanitize, validation, `draft.price`, keyboard `decimal`, or publish gate

### B — Quantity (inline — keep)

- Add `quantity` / `stock` to `SELL_FIELD_ICONS`; wire `fieldId` correctly (stop reusing price icon)
- Align row with Price block
- Remove or quarantine **dead** `.sell-stock-stepper*` CSS (CSS-only; do not restore stepper UI)
- **Do not** change `parseInventoryInput`, min/max, blur clamp, or draft writes

### C — Brand / Material / Condition / Colour / Size / Style / Pattern / Compatibility

- Polish `SellNavRow` + `SellOptionPicker` only: spacing, hierarchy, focus, touch ≥44, CanonicalInput for picker search if drop-in
- **Do not** change options lists, select/save, persistence, validation, APIs, databases, sorting algorithms

### D — Parcel Size (fullscreen OK)

- Token-align `.sell-parcel-*` to Sell/CDS (colours, radius, row height comments)
- Keep four options + one-tap + 200ms + `shippingMethod` write path **unchanged**

### E — Explicitly out of scope

Category · Photos · Title · Description · Category Suggest · Publish · Draft engines · Listing Cards · Occasion/Care (absent)

---

## Removals / non-changes

| Do | Do not |
|----|--------|
| Fix Quantity icon id | New Quantity page / stepper restore |
| £ display adornment | Price validation / formatting logic change |
| Dead stepper CSS cleanup | New Attribute Engine fields |
| Parcel visual tokens | Parcel calculation / Sendcloud / pricing |

---

## Product QA checklist (post-approval implement)

Must prove **all** before Owner Preview: Brand/Material/Condition select · Price/Quantity/Parcel save · Publish · Draft · Edit listing · Existing listings unchanged · no hydration mismatch · no console errors · no focus/keyboard/back regressions · TS · ESLint · Build · Playwright as applicable.

---

## Gate

| Step | Status |
|------|--------|
| 1. UI Audit | Done → `UI_POLISH_PRODUCT_QA_AUDIT.md` |
| 2. Improvement Plan | This document |
| 3. Mockup | Not required unless Owner requests sheet compare |
| 4. Master UI Spec | → `MASTER_UI_SPECIFICATION.md` · **Awaiting approval** |
| 5. Implementation | **Blocked** |

**WAIT FOR OWNER APPROVAL.**  
NO IMPLEMENTATION · NO COMMIT · NO PUSH · NO PREVIEW · NO PRODUCTION.
