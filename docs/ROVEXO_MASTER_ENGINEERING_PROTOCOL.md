# ROVEXO Master Engineering Protocol

**Version 1.0** — Official development methodology for the ROVEXO platform.

## Mission

Every major ROVEXO module follows this protocol. No module may skip any phase.

## Core philosophy

- **Quality** over speed
- **Architecture** over shortcuts
- **Consistency** over creativity
- Every module becomes a permanent production-ready component

## Development lifecycle

```
PHASE 1  Master Engineering Specification
    ↓
PHASE 2  Canonical Implementation
    ↓
PHASE 3  Validation
    ↓
PHASE 4  Freeze
    ↓
PHASE 5  Next Module
```

No exceptions.

## Phase 1 — Master Engineering Specification

Before any production code:

- Architecture, UX, UI, component hierarchy
- File structure, repository, hooks, services, types
- Responsive, accessibility, performance, security rules
- Loading, error, empty, skeleton states
- Validation rules, acceptance criteria, definition of done
- Freeze policy and future architecture

**No implementation before specification.**

## Phase 2 — Implementation

- Implement only what the specification defines
- No improvisation, redesign, or temporary UI
- One official implementation per module
- Forbidden: `ModuleV2`, `ModuleNew`, `Dashboard2`, legacy copies

## Architecture (every module)

| Layer | Responsibility |
|--------|----------------|
| Components | UI only |
| Hooks | Client state and composition |
| Repository | Data aggregation |
| Services | Domain logic |
| Types | Contracts |
| Styles | Module design tokens |
| Tests | Contract and E2E |

**Data flow:** UI → Hooks → Repository → Supabase. Never query Supabase from UI.

## UI requirements

Pixel-perfect, premium 2026 design, consistent with `RovexoHomePage`. Shared typography, spacing, animations, colors, shadows.

## Performance

Server Components first. Client only when required. Lazy loading, dynamic imports, memoization. No hydration mismatch. No CLS.

## Responsive breakpoints

`390` · `430` · `768` · `1024` · `1280` · `1440`

## Accessibility

Keyboard navigation, ARIA, screen readers, focus states, contrast AA, semantic HTML.

## Component states

Every component: **Loading** · **Skeleton** · **Empty** · **Error** · **Success**. No blank components.

## Phase 3 — Validation

Must pass:

- TypeScript
- ESLint
- Next Build
- Vitest
- Playwright (desktop, tablet, mobile, light/dark)
- Responsive audit
- Accessibility audit
- Performance audit

No warnings. No errors.

## Phase 4 — Freeze

After owner approval, the module is **Frozen**.

**Allowed after freeze:** bug fixes, performance, accessibility, minor UI polish.

**Forbidden after freeze:** layout redesign, architecture changes, duplication, structural changes (unless explicitly approved).

## Documentation (every module)

Each module directory under `docs/modules/<module>/` must contain:

| File | Purpose |
|------|---------|
| `MASTER_ENGINEERING_SPEC.md` | Single source of truth for requirements |
| `Architecture.md` | Technical design |
| `README.md` | Overview and phase status |
| `TESTING.md` | How to validate |
| `CHANGELOG.md` | Version history |
| `FREEZE_CERTIFICATE.md` | Freeze approval record |

## Git

Commit only after **Validation PASS** and **Freeze Approved**. Push only clean builds.

## Module order

1. RovexoHomePage — **FROZEN**
2. Buyer Dashboard — **Phase 3**
3. Seller Dashboard
4. Business Dashboard
5. Admin Dashboard
6. Super Admin
7. Checkout
8. Listing Engine
9. Messaging
10. Payments
11. Shipping
12. Notifications
13. Settings
14. Launch Audit → Production

## Future-ready (prepare only)

Theme Engine · Glass Icons · Aurora Background · Wallet · AI · Push Notifications · Marketplace Expansion · Localization · Enterprise Features

Do not implement unfinished functionality.
