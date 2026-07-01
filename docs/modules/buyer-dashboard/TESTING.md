# Buyer Dashboard — Testing

## Validation checklist (Phase 3)

Run from repository root:

```bash
npm run typecheck
npm run lint
npm run build
npm run test -- tests/buyer-dashboard.test.ts tests/rovexo-engineering-protocol.test.ts
npx playwright test e2e/buyer-dashboard.spec.ts --project=chromium
```

## Vitest — contract tests

| File | Coverage |
|------|----------|
| `tests/buyer-dashboard.test.ts` | SSOT paths, component files, architecture layering, homepage freeze |
| `tests/rovexo-engineering-protocol.test.ts` | Protocol + module documentation presence |

## Playwright — E2E

| File | Coverage |
|------|----------|
| `e2e/buyer-dashboard.spec.ts` | Auth redirect, authenticated render, responsive breakpoints, light/dark, navigation, error recovery |

### Viewports (protocol)

390 · 430 · 768 · 1024 · 1280 · 1440

### Authenticated tests

Require real Supabase credentials in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)

Tests auto-skip when placeholder Supabase is configured.

## Manual QA

1. Sign in as a buyer account
2. Navigate to `/buyer`
3. Verify header greeting, hero profile, quick actions, statistics
4. Confirm horizontal scroll sections (order history, saved, recently viewed)
5. Tap header messages / notifications / settings links
6. Confirm bottom nav renders (account tab)
7. Test at 390 px width — no horizontal overflow

## Accessibility

- Header actions have `aria-label`
- Hero has `aria-label="Buyer profile"`
- Skeleton uses `aria-busy` and `aria-label`
- Error state uses `role="alert"`

## Performance

- Initial HTML includes server-fetched data (no client-side waterfall for primary payload)
- Below-fold sections code-split via `next/dynamic`
