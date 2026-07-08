# Module 1 Part 1 — Files Modified

## New files

| File | Purpose |
|------|---------|
| `components/home/HomepageHeader.tsx` | Canonical homepage header (logo, search, actions, category rail) |
| `components/home/HomepageSearchField.tsx` | Inline debounced search with suggestions, clear, return-key submit |
| `components/home/RovexoHomepageWordmark.tsx` | Official ROVEXO wordmark SVG with accent X |
| `styles/rovexo/homepage-header.css` | Homepage header v2.0 styles (heights, search, scroll shadow) |
| `scripts/homepage-header-rebuild-screenshots.mjs` | Before/after screenshot capture |
| `reports/module-1/homepage-header-rebuild/` | QA artifacts (this folder) |

## Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Routes `/` through `HomepageHeader` instead of `Header variant="homepage"` |
| `components/Header.tsx` | Removed homepage variant; default header only (other routes) |
| `components/home/RovexoHomePage.tsx` | Category rail moved to header; feed stack only |
| `components/home/RovexoCategoryRail.tsx` | Optional `className`; no scroll snap |
| `components/home/RovexoCategoryCard.tsx` | Selected-state class support; text-only capsules |
| `components/home/index.ts` | Export `HomepageHeader` |
| `styles/rovexo-homepage.css` | Disabled category scroll snap; selected capsule token |
| `lib/homepage-engineering-director/registry.ts` | SSOT paths → `HomepageHeader` |
| `lib/homepage-engineering-director/scanner.ts` | Scan rules for new header stack |
| `tests/header.test.ts` | Assertions for `HomepageHeader` + `HomepageSearchField` |
| `tests/home-enterprise-migration.test.ts` | Homepage header migration contract |
| `tests/home-hydration.test.ts` | Category rail in header |
| `tests/homepage-icon-system.test.ts` | Include `HomepageHeader` in icon audit |
| `tests/enterprise-ui-system.test.ts` | Homepage header/search icon checks |
| `tests/hero-banner-premium.test.ts` | Category rail wired via header |
| `tests/buyer-dashboard.test.ts` | Frozen homepage feed assertion |
| `tests/homepage-engineering-director.test.ts` | `PREMIUM_HOME_STACK` update |

## Unchanged (intentionally)

- `components/header/HeaderSearchBar.tsx` — still used by non-homepage `Header`
- Supabase, auth, checkout, orders, payments, messaging backends
- Listing feed, showcase, BYI CTA body components
