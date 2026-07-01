# Buyer Dashboard v1.0

Official ROVEXO buyer account hub — single source of truth for buyer-facing dashboard UI.

## Status

| Field | Value |
|-------|--------|
| **Phase** | 4 — **Frozen** |
| **Route** | `/buyer` |
| **Entry** | `app/buyer/page.tsx` → `BuyerDashboard` |
| **Component root** | `components/buyer/` |
| **Styles** | `styles/rovexo-buyer-dashboard.css` |
| **Frozen** | Yes — 2026-06-26 ([certificate](./FREEZE_CERTIFICATE.md)) |

## Quick links

- [Master Engineering Spec](./MASTER_ENGINEERING_SPEC.md)
- [Architecture](./Architecture.md)
- [Testing](./TESTING.md)
- [Changelog](./CHANGELOG.md)
- [Freeze Certificate](./FREEZE_CERTIFICATE.md)

## Constraints

- Does **not** modify `RovexoHomePage` (frozen)
- No `BuyerDashboardV2` or alternate implementations
- Icons: `RovexoIcon` only
- Bottom navigation: reuses `BetaAppShell` / `RovexoFooterNavigation`

## Related routes

- `/account` — legacy account hub (not replaced by this module)
- `/orders`, `/saved`, `/messages`, `/notifications` — linked from dashboard sections
