# Buyer Dashboard — Changelog

All notable changes to the official Buyer Dashboard module.

## [1.0.0] — 2026-06-26 — Phase 2 complete, Phase 3 in progress

### Added

- Official route `/buyer` with `BuyerDashboard` composition
- Full component tree under `components/buyer/` (23 section/state components)
- `lib/buyer/` repository, queries, constants
- `hooks/buyer/BuyerDashboardProvider`
- `types/buyer/dashboard.ts`
- `styles/rovexo-buyer-dashboard.css` with protocol breakpoints
- Middleware protection for `/buyer`
- `app/buyer/error.tsx` error boundary
- Lazy-loaded secondary sections
- Vitest contract tests
- Playwright E2E suite
- Module documentation package

### Design

- Reuses `RovexoIcon`, `RovexoListingCard`, `BetaAppShell` bottom nav
- Aligns typography, spacing, shadows with homepage design language

### Not changed

- `RovexoHomePage` (frozen)
- `/account` legacy hub

## [1.0.0-freeze] — 2026-06-26 — Phase 4 Frozen

### Frozen

- Owner-approved freeze certificate issued
- Module locked per ROVEXO Master Engineering Protocol
- Authenticated Playwright E2E documented as infrastructure-limited (Supabase Admin); not a module defect
