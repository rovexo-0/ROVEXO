# ROVEXO Platform Canonical UI Redesign Report

**Version:** v1.0  
**Status:** FROZEN (post-validation)  
**Visual SSOT:** My Account (`ac-canonical`, `acm-settings`) — **unchanged**  
**Homepage:** **unchanged**

## Objective

Complete visual redesign so every module page inherits My Account spacing, cards, rows, typography, and touch targets — not another header/shell migration.

## Design system layer

| Asset | Role |
|-------|------|
| `styles/rovexo/platform-canonical-ui.css` | Global tokens + legacy surface harmonization |
| `components/ui/canonical/*` | Reusable section/card/body primitives |
| `Card variant="canonical"` | My Account card surface (14px radius, canonical border/shadow) |
| `Button size="canonical"` | 52px primary CTA matching `acm-cta__btn` |
| `.pcu-module` | Standard module body (640px, safe-area, section gap) |

## Visual rules applied

- **Section titles:** uppercase 11px labels (`ac-canonical__section-title` / `acm-settings__heading`)
- **Cards:** 14px radius, `rgb(15 23 42 / 0.08)` border, soft shadow
- **Rows:** 48px min-height, divider `rgb(15 23 42 / 0.06)`, chevron trailing
- **Forms/toggles:** `acm-settings__row` with canonical switch styling
- **Module padding:** 16px horizontal, bottom safe-area + nav clearance

## Pages redesigned (this pass)

| Area | Changes |
|------|---------|
| Notification Settings | `AccountModuleShell` + `CanonicalModuleBody` + `acm-settings` toggles |
| Help Centre | Canonical search, category rows, section cards (no `mhub-hero`) |
| Help Quick Links | Canonical section cards |
| Resolution Centre | Canonical case rows in section cards |
| Trust Center | `CanonicalModuleBody`, canonical cards, simplified intro |
| Wallet Hub | `pcu-module` body, canonical section titles |
| Legal / Support / Plans shells | `CanonicalPageShell` body uses `pcu-module` spacing |
| Settings primitives | `SettingSection` / `SettingToggle` → `acm-settings` |

## Legacy visuals harmonized (CSS)

- `wallet-hub__*` balance/transaction cards
- `cart-v1__*` item cards
- `checkout-v1__*` / `ckt-v1__*` cards
- `mhub-section__title` inside `.pcu-module`
- Glass/backdrop cards overridden on `variant="canonical"`

## Locked (not modified)

- Homepage (`app/page.tsx`, homepage components/CSS)
- My Account hub (`AccountCenterHome`, `ac-canonical__*`)

## Remaining follow-ups (non-blocking)

| Area | Notes |
|------|-------|
| Super Admin / Admin | Enterprise shells — separate visual tier by design |
| Discovery/search grids | Listing cards retain marketplace grid sizing |
| Engine hub dashboards | Harmonized via CSS tokens; optional row component migration |
| Orphan legacy CSS files | Remove when zero references (`account-hub-v1`, `account-2026`) |

## Validation

```bash
npm run lint
npm run typecheck   # or npx tsc --noEmit
npm run build
npm run test:ci
npm run test:e2e
```

## Freeze declaration

After validation passes, the canonical UI is frozen:

1. Module pages use `pcu-module` / `acm-settings` / `ac-canonical__section-card`
2. No new bespoke card or section title styles
3. `Card variant="canonical"` for informational surfaces
4. Settings rows use `SettingSection` + `SettingToggle`

---

*Generated as part of P0 platform-wide canonical UI redesign.*
