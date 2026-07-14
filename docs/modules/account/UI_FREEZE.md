# My Account v1.0 — UI Freeze

| Field | Value |
|-------|-------|
| Module | My Account |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Canonical status | `CANONICAL_FROZEN_v1.0` |
| Freeze constant | `ACCOUNT_UI_FREEZE` / `ACCOUNT_CANONICAL_FROZEN = true` |
| DOM | `data-account-freeze="FROZEN"` · `data-ac-hub-version="v1.0-production"` · `data-account-version="v1.0"` |
| Spec | `docs/modules/account/MASTER_UI_SPECIFICATION.md` |
| Freeze module | `lib/account/freeze.ts` |
| Cursor rule | `.cursor/rules/account-v1-freeze.mdc` |
| Guard test | `tests/account-v1-freeze.test.ts` |
| Freeze date | **2026-07-14** |

## Approved visual reference

Authoritative live preview (develop):

- https://rovexo-git-develop-rovexo.vercel.app/account

Visual QA must match this deployment for:

1. Hub header chrome (`AccountCanonicalShell` with `hideBack`)
2. Profile section
3. Quick Stats strip
4. Seller Performance summary card
5. Menu sections (MANAGE / ACCOUNT / SUPPORT + SYSTEM Sign Out)
6. Bottom navigation
7. Empty / zero-data states for stats and seller performance
8. Responsive layout (mobile-first hub)

Screenshot capture location for release records:

- `docs/modules/account/screenshots/` (attach approve-time captures here when archived)

## Frozen component list

| Layer | Component / asset |
|-------|-------------------|
| Shell | `AccountCanonicalShell` (`hideBack` on hub) |
| Hub root | `AccountCenterHome` (`.ac-canonical`) |
| Profile | `AccountCanonicalProfile` |
| Quick Stats | `AccountStatsStrip` (Listings · Saved · Orders · Wallet) |
| Seller Performance | `AccountSellerPerformanceCard` (`data-ac-seller-performance="v1.0-frozen"`) |
| Menu | `AccountMenuSections` + `lib/account-center/canonical-menu.ts` |
| Styles | `styles/rovexo/account-canonical-v2.css` |
| Bottom nav | Platform `BottomNavigation` via `BetaAppShell` (`bottomNavTab="account"`) |

## Explicitly absent (approved)

- **View Public Profile** CTA
- **Edit Profile** CTA on the hub profile card

## Immutable structure (render order)

1. Profile section
2. Quick Stats
3. Seller Performance
4. Menu sections (incl. Sign Out)

## Rules for future development

### Allowed under My Account v1.0

- Bug fixes that preserve layout, spacing, typography, icons, shadows, and navigation
- Data / API / business-logic fixes that do not change frozen UI structure or copy hierarchy
- Accessibility and image-safety fixes via `SafeImage` / `Avatar` without redesign
- Broken navigation or load failures that restore the approved structure

### Prohibited under My Account v1.0

- Redesign, simplify, or rebuild the hub
- Move / remove / reorder frozen sections
- Spacing, typography, icon, card-size, or shadow changes
- Navigation / menu inventory changes
- Reintroducing View Public Profile or Edit Profile on the hub

### Required for new UI work

Ship all intentional visual or structural deltas as **My Account v1.1** (new markers, new freeze artifacts). Do not mutate the v1.0 frozen surface.

## Related freezes

- Seller Performance engine / dashboard: `.cursor/rules/seller-performance-v1-freeze.mdc`
- Account summary card marker: `data-ac-seller-performance="v1.0-frozen"`
