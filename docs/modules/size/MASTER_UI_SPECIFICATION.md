# ROVEXO Size Engine v1.0 — Master UI Specification

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** Owner Size Selector Master Spec · COD SÂNGE · `.cursor/rules/master-ui-specification-mode.mdc`  
**Rule:** Match approved mockup 1:1. No redesign. No Clothing/Footwear toggle.

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | Size Engine — Size Selector |
| **Route(s)** | Sell Flow size step (`/sell` attribute Size) |
| **Canonical component** | `features/size/components/SizeSelector.tsx` |
| **Canonical styles** | `features/size/components/SizeSelector.module.css` |
| **Visual reference** | `docs/modules/size/size-selector-mockup-v1.png` |
| **Canvas reference** | 390 × 844 mobile first |
| **Version** | 1.0 |
| **Status** | `Approved` · Owner Certified UI LOCK · Implemented |
| **Owner** | ROVEXO Product Owner |
| **Approved by** | Product Owner |
| **Approved date** | 2026-08-03 |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-08-03 | Cursor | Owner certified Size Selector Master Spec → Size Engine v1.0 |

### Canonical implementation map

| Layer | Path |
|-------|------|
| SSOT | `lib/size/size-engine-v1.ts` · `size-value-v1.ts` · `size-category-resolve-v1.ts` |
| UI | `features/size/components/SizeSelector.tsx` |
| Modals | `CustomSizeModal.tsx` · `SizeGuideModal.tsx` |
| Sell wire | `features/sell/ui/SellProgressiveAttributes.tsx` |
| View Item | `features/product-detail/build-product-information-rows.ts` |
| Tests | `tests/size-engine-v1.test.ts` · `e2e/size-engine-v1.spec.ts` |

---

## 1. Master UI Specification

### 1.1 Page purpose

Select a listing size for any category that requires Size. Category auto-opens Clothing or Footwear (or kids/rings). Custom size always available.

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | iPhone | Mobile first |
| Reference width | 390 px | Also 393 / 414 |
| Page background | `#FFFFFF` | White |
| Primary | ROVEXO purple `#9333ea` | Gradient CTA |

### 1.3 Layout order (section tree)

1. Top bar 64px — ← · ROVEXO · ✕  
2. Progress line 4px purple  
3. Title “Select size” 22px bold  
4. Subtitle “Choose the right fit for you” 16px grey  
5. Section head — Clothing/Footwear title + Size guide  
6. Size rows 56px  
7. Custom size row 64px  
8. Info callout  

**Auto-return (Owner APPROVED):** No Continue button. Standard tap → ~180ms purple flash → save → close → Sell. Custom Save → validate → save → close modal + selector → Sell.

**Forbidden:** Clothing / Footwear segmented control or tabs · Continue confirmation step.

### 1.4–1.6 Spacing / colour

| Token | Value |
|-------|-------|
| Horizontal inset | 16px |
| Row height | 56px |
| Custom row | 64px |
| Continue | 56px · radius 16px |
| Selected row bg | `#f5f3ff` |
| Progress | 4px purple gradient |

---

## 2. Component Dimension Table

| Component | W | H | Radius | Notes |
|-----------|---|----|--------|-------|
| Top bar | 100% | 64 | — | Back / brand / close |
| Progress | 100% | 4 | — | Purple |
| Size row | 100% | 56 | 16 | Radio + label + optional badge |
| Custom row | 100% | 64 | 16 | Plus / check + chevron |
| Continue | — | — | — | **Removed** (auto-return) |

---

## 3. Spacing Table

| Location | Value |
|----------|-------|
| Body pad X | 16px |
| Body pad top | 20px |
| Body pad bottom | 120px (above sticky) |
| Row gap | 8px |
| Section head margin top | 24px |

---

## 4. Typography Table

| Element | Size | Weight | Colour |
|---------|------|--------|--------|
| Title | 22px | 700 | `#0a0a0a` |
| Subtitle | 16px | 400 | `#6b7280` |
| Section title | 16px | 700 | `#0a0a0a` |
| Size guide | 14px | 600 | `#9333ea` |
| Row label | 16px | 600 | `#0a0a0a` |
| Row secondary | 13px | 400 | `#6b7280` |
| Continue | 17px | 700 | `#ffffff` |

---

## 5. Colour Table

| Role | Value |
|------|-------|
| Background | `#FFFFFF` |
| Brand / CTA | `#9333ea` · gradient `#a855f7 → #9333ea → #7c3aed` |
| Selected row | `#f5f3ff` / border `#c4b5fd` |
| Info box | `#f5f3ff` / border `#c4b5fd` |
| Secondary text | `#6b7280` |

---

## 6. Interaction Specification

| Action | Result |
|--------|--------|
| Tap size row | Select · ~180ms flash · auto-save · auto-close · Sell |
| Tap Size guide | Modal (no navigation) |
| Tap Custom size… | Enter custom size modal |
| Save custom | Validate · save · close modal · close selector · Sell |
| Cancel custom | Stay on selector · no save |
| ← / ✕ | Close · Sell · previous value unchanged |

---

## 7. Responsive Specification

Certified widths: 390 · 393 · 414 · 768 · Desktop. Same design; width 100% only.

---

## 8. Accessibility Specification

Touch ≥ 44px · radio `aria-selected` · dialog labels · VoiceOver on Back/Close/rows/Continue.

---

## 9. Developer Notes

- One Size Engine only — no parallel SizeSelectors.  
- Kind from `resolveSizeEngineKind(categoryPath)`.  
- Storage: `products.size` text — `custom:` prefix for custom; standard display string otherwise.  
- View Item uses `formatSizeForViewItem`.  

---

## 10. QA Checklist

- [ ] Clothing XXS / M / XXXL · auto-return  
- [ ] Footwear UK 3 / 8 / 15 · auto-return  
- [ ] Custom save · auto-close modal + selector  
- [ ] Back / Close preserve previous  
- [ ] Custom Cancel stays on selector  
- [ ] Sell row: `XL (UK 12 • EU 40)` / `46 Tall`  
- [ ] No Continue button  
- [ ] TypeScript · ESLint · Build · Unit · E2E  

**Status:** UI LOCK · AUTO RETURN APPROVED · No Commit until certification gates PASS.
