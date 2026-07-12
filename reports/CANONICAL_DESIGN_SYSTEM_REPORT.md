# ROVEXO Canonical Design System v1.0

**Status:** Foundation complete — ready for platform migration  
**Date:** 2026-07-12  
**Location:** `src/components/canonical/`

## Objective

One global Canonical Design System — the only UI foundation for future platform migration.

**Not migrated yet:** Homepage, My Account, business logic, routing, APIs, or database.

## Components (10)

| # | Component | File | Purpose |
|---|-----------|------|---------|
| 1 | `CanonicalPageLayout` | `CanonicalPageLayout.tsx` | Header, content, safe area, bottom nav spacing |
| 2 | `CanonicalPageHeader` | `CanonicalPageHeader.tsx` | Back, centered title, optional right action |
| 3 | `CanonicalSection` | `CanonicalSection.tsx` | Uppercase section labels for all modules |
| 4 | `CanonicalMenuRow` | `CanonicalMenuRow.tsx` | Classic marketplace row (icon → title → description → chevron) |
| 5 | `CanonicalCard` | `CanonicalCard.tsx` | small / medium / large / info / warning / success / danger / list |
| 6 | `CanonicalInput` | `CanonicalInput.tsx` | text, email, phone, number, price, password, search, textarea |
| 7 | `CanonicalSelector` | `CanonicalSelector.tsx` | category, brand, country, currency, language, generic |
| 8 | `CanonicalButton` | `CanonicalButton.tsx` | primary, secondary, ghost, outline, danger, loading |
| 9 | `CanonicalModal` | `CanonicalModal.tsx` | confirm, delete, warning, success, information |
| 10 | `CanonicalInfoBlock` | `CanonicalInfoBlock.tsx` | info, success, error, warning, description, tip |

## Global Tokens

- **CSS:** `styles/rovexo/canonical-ds.css` (`--cds-*` variables, `.cds-*` classes)
- **TypeScript:** `src/components/canonical/tokens.ts` (`canonicalTokens`, `CDS_VERSION`)

### Token categories
Typography · Spacing · Radius · Shadow · Divider · Border · Animation · Elevation · Touch area · Icon size · Button height · Input height · Section gap · Row gap · Safe area

## Icons

Outline icons only via `@/components/icons/RvxLineIcons` — no filled icons, no coloured icon backgrounds.

## Usage

```tsx
import {
  CanonicalPageLayout,
  CanonicalSection,
  CanonicalMenuRow,
  CanonicalCard,
} from "@/src/components/canonical";
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:ci
npm run test:e2e
```

## Next step

Platform-wide migration to `src/components/canonical/` — Homepage and My Account remain locked until explicitly scheduled.
