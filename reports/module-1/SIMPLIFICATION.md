# Module 1 — Simplification Report

## Objective

Simplify UX and engineering architecture without removing marketplace behaviour.

## Completed simplifications

### Homepage
- Category rail: **icons removed** → text-only premium capsules
- Listing cards: **standard fields restored** (seller, rating, views)
- Structure unchanged: Header → Search → Categories → Listings → Bottom nav

### Search
- **Camera icon removed** from overlay actions
- Voice search hook retained for future wiring

### Design system
- Confirmed unified token pipeline (`styles/tokens.css` → Tailwind → components)
- Appearance system already complete: light / dark / system via `ThemeProvider` + `/account/preferences/appearance`

### Tests updated
- Category rail tests reflect text-only capsules
- Architecture tests pass

## Not removed (intentional)

| Item | Reason |
|------|--------|
| `SearchResultCard` | Dedicated search suggestion row (user-confirmed architecture) |
| Checkout / order / message product cards | Domain-specific layouts |
| `archive/` tree | Not deleted in Module 1 — requires governance review |
| Super-admin engine CSS bundles | Out of Module 1 scope |

## Duplicate components identified (removal queued)

- `components/header/HeaderCategoryBar.tsx` — unused on homepage
- `features/dashboard/components/PremiumButton.tsx` — deprecated wrapper
- `components/home/HomeCategoryRail.tsx` — alias only
- Mirror folders: `ROVEXO/`, `ROVEXO_UPLOAD/`, `recovered-homepage/`

## Files removed

**None in Module 1** — deletions deferred to avoid breaking registry references in enterprise engines. Audit list prepared for Module 2 approval.

## Screenshots (live app)

Captured from `http://127.0.0.1:3025` after fresh production build:

| File | Description |
|------|-------------|
| `screenshots/homepage-mobile-light.png` | Text capsules + listing grid |
| `screenshots/homepage-mobile-dark.png` | Dark mode homepage |
| `screenshots/homepage-desktop-light.png` | Desktop homepage |
| `screenshots/search-mobile-light.png` | Search results |
| `screenshots/categories-mobile-light.png` | Categories index |
| `screenshots/appearance-settings.png` | Appearance picker |
