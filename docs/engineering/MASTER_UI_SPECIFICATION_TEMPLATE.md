# ROVEXO Master UI Specification Template

**Document type:** Engineering UI specification (implementation gate)  
**Authority:** `.cursor/rules/master-ui-specification-mode.mdc`  
**Usage:** Copy to `docs/modules/<module>/MASTER_UI_SPECIFICATION.md` and fill every field.  
**Rule:** No estimated values. Measure from the approved mockup (or design tokens) before marking **Approved**.

---

## Document control

| Field | Value |
|-------|-------|
| **Page / Module** | |
| **Route(s)** | |
| **Canonical component** | |
| **Canonical styles** | |
| **Visual reference** | Approved mockup path / asset ID |
| **Canvas reference** | e.g. 390 × 844 (6.9" mobile) |
| **Version** | 1.0 |
| **Status** | `Draft` → `Awaiting approval` → `Approved` → `Implemented` → `Frozen` |
| **Owner** | |
| **Approved by** | |
| **Approved date** | |

### Change history

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 1.0 | | | Initial Master UI Spec |

### Canonical implementation map

| Layer | Path |
|-------|------|
| Route | |
| Page / hub component | |
| Section components | |
| Styles | |
| Tests | |

---

## 1. Master UI Specification

### 1.1 Page purpose

|

### 1.2 Canvas

| Token | Value | Notes |
|-------|-------|-------|
| Reference device | | e.g. 6.9" iPhone |
| Reference width | px | |
| Reference height | px | |
| Safe area top | px | |
| Safe area bottom | px | |
| Content max-width (mobile) | px | |
| Content max-width (tablet) | px | |
| Content max-width (desktop) | px | |
| Page background | token / hex | |

### 1.3 Layout order (section tree)

Exact top-to-bottom order. Do not reorder in implementation.

1.  
2.  
3.  

### 1.4 Grid

| Token | Value |
|-------|-------|
| Columns (mobile) | |
| Columns (tablet) | |
| Columns (desktop) | |
| Gutter | px |
| Page horizontal inset | px |
| Section vertical gap | px |

### 1.5 Global spacing system

| Token | Value (px) |
|-------|------------|
| `--space-xs` | |
| `--space-sm` | |
| `--space-md` | |
| `--space-lg` | |
| `--space-xl` | |
| Section gap | |
| Card internal padding | |
| Row height (list) | |

### 1.6 Global radius / shadow / colour pointers

| Token | Value |
|-------|-------|
| Radius card | px |
| Radius button | px |
| Radius badge | px |
| Shadow card | |
| Shadow elevated | |
| Brand gradient | |
| Surface | |
| Text primary | |
| Text muted | |
| Border | |

---

## 2. Component Dimension Table

Repeat one block per component. Leave no blanks. Use `N/A` only when truly not applicable.

### Component: `<Name>`

| Field | Value |
|-------|-------|
| Purpose | |
| X position | |
| Y position | |
| Width | |
| Height | |
| Padding | |
| Margin | |
| Gap | |
| Border radius | |
| Shadow | |
| Background | |
| Border | |
| Icon | |
| Icon size | |
| Icon stroke | |
| Title font | |
| Body font | |
| Font weight | |
| Font size | |
| Line height | |
| Letter spacing | |
| Alignment | |
| Pressed state | |
| Hover state | |
| Focus state | |
| Disabled state | |
| Loading state | |
| Empty state | |
| Animation | |
| Navigation | |
| Responsive behaviour | |

---

## 3. Spacing Table

| Context | Top | Right | Bottom | Left | Gap | Notes |
|---------|-----|-------|--------|------|-----|-------|
| Page content | | | | | | |
| Section | | | | | | |
| Hero | | | | | | |
| Card | | | | | | |
| Button group | | | | | | |
| List row | | | | | | |

---

## 4. Typography Table

| Role | Family | Weight | Size | Line height | Letter spacing | Colour | Align |
|------|--------|--------|------|-------------|----------------|--------|-------|
| Page title | | | | | | | |
| Section title | | | | | | | |
| Hero label | | | | | | | |
| Hero amount | | | | | | | |
| Card title | | | | | | | |
| Card amount | | | | | | | |
| Card subtitle | | | | | | | |
| Body | | | | | | | |
| Meta / caption | | | | | | | |
| Button label | | | | | | | |

---

## 5. Colour Table

| Token | Hex / gradient | Usage |
|-------|----------------|-------|
| | | |

---

## 6. Interaction Specification

| Control | Default | Hover | Pressed | Focus | Disabled | Loading | Notes |
|---------|---------|-------|---------|-------|----------|---------|-------|
| | | | | | | | |

Transitions: duration / easing (exact).

---

## 7. Responsive Specification

| Breakpoint | Max content width | Columns allowed to change | Must stay identical |
|------------|-------------------|---------------------------|---------------------|
| Mobile | | | Colours, hierarchy, type, radius, shadows, section order, card style |
| Tablet | | max-width, columns, horizontal spacing only | Same |
| Desktop | | max-width, columns, horizontal spacing only | Same |
| PWA | | Same as mobile viewport rules | Same |

**Prohibited:** desktop redesign, alternate themes, dark card skins, hierarchy changes, spacing-system changes, duplicate Mobile/Desktop components.

---

## 8. Accessibility Specification

| Requirement | Spec |
|-------------|------|
| Keyboard | |
| Focus ring | |
| ARIA labels | |
| Tap target min | |
| Contrast | WCAG AA |
| Reduced motion | |
| Screen reader order | |

---

## 9. Developer Notes

- Single canonical component path:
- Single stylesheet path:
- No `WalletMobile` / `WalletDesktop`-style forks
- Image safety: `SafeImage` / `Avatar` only
- Seller wallet must never show Platform Fee
- Data attributes for freeze/version:

---

## 10. QA Checklist

- [ ] Spec status is **Approved** before coding
- [ ] Implementation matches Component Dimension Table 1:1
- [ ] iPhone Safari matches approved mockup + spec
- [ ] Android Chrome matches approved mockup + spec
- [ ] Desktop Chrome is wider only (same design)
- [ ] PWA matches mobile layout
- [ ] No dark/desktop alternate card theme
- [ ] All interactions functional (no dead controls)
- [ ] TypeScript / ESLint / Vitest / Playwright as required
- [ ] Explicit freeze approval recorded only after visual parity

---

## Approval

| Role | Name | Date | Signature / note |
|------|------|------|------------------|
| Design | | | |
| Engineering | | | |
| Product / Owner | | | |
