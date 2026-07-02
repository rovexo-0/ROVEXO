# Sell Module — Production Freeze Snapshot

| Field | Value |
|-------|--------|
| **Module** | Sell v1.0 |
| **Official route** | `/sell` |
| **Status** | **PRODUCTION FREEZE** |
| **Freeze date** | 2026-06-26 |
| **Certification** | See `FREEZE_CERTIFICATE.md` |

## Canonical layout (locked)

1. Photos (8-slot horizontal gallery)
2. Title input
3. Description input
4. Category selector
5. Condition chips
6. Price (`SellPriceInput`)
7. Quantity (`SellQuantitySelector`)
8. Delivery cards + free delivery
9. Optional details (expandable)
10. Sticky publish footer
11. Safe bottom area

**Nothing below the publish footer.**

## Locked surfaces

- `SellPage`, `BetaAppShell` (no marketplace footer on `/sell`)
- `SellPhotoSection` — 8-slot gallery, hidden file inputs, programmatic picker
- `SellListingFields` — unified quick + advanced form
- `use-sell-wizard` — draft, upload, publish, silent AI category
- `SellPublishFooterContainer` — independent publish state via `useSyncExternalStore`
- `build-listing-publish-payload`, `/api/listings`
- `SellPublishedStep` — post-publish success

## UI policy (locked)

| Rule | Implementation |
|------|----------------|
| No visible section headings | Placeholders + `aria-label` only |
| No marketplace footer | `HelpPageFooter` removed; `/sell` in `AUTHENTICATED_APP_PREFIXES` |
| No native file input text | `clip: rect` hidden inputs; `button` triggers `.click()` |
| Photo gallery | Always 8 slots `[1]…[8]`, 176×152, 18px radius, horizontal scroll |
| AI category | Title + description, debounced, silent, never overwrites manual pick |
| Form stability | Local title/description state; publish footer decoupled from keystrokes |
| SSR | `createEmptyDraft()` on server; `loadSellDraft()` in `useEffect` only |

## Validation snapshot

| Gate | Result | Executed |
|------|--------|----------|
| TypeScript | PASS | 2026-06-26 |
| ESLint | PASS (0 errors) | 2026-06-26 |
| Vitest CI | PASS — 336/336 | 2026-06-26 |
| Production build | PASS — 285 routes | 2026-06-26 |
| Playwright Chromium | PASS — 3/3 | 2026-06-26 |
| Playwright Firefox | PASS — 3/3 | 2026-06-26 |
| Playwright WebKit | PASS — 3/3 | 2026-06-26 |

## Files modified (final freeze pass)

| File | Reason |
|------|--------|
| `features/sell/components/SellPhotoSection.tsx` | Always-on 8-slot gallery; hidden inputs; upload actions |
| `features/sell/components/SellPhotoGallery.module.css` | Listing-card proportions; slot numbering; disabled empty slots |
| `features/sell/components/SellListingFields.tsx` | Canonical field order; optional details after delivery (both modes) |
| `features/sell/components/SellMoreDetailsCard.tsx` | Optional details expander; `aria-label` only (no visible heading) |
| `features/sell/components/SellPriceInput.tsx` | Shared price input; `aria-label="Price"` |
| `features/sell/components/SellQuantitySelector.tsx` | Shared quantity control without visible label |
| `features/sell/components/SellDeliverySection.tsx` | Delivery cards + free delivery checkbox |
| `features/sell/components/sell-form-tokens.ts` | Unified sell form styling tokens |
| `features/sell/components/SellQuickListingForm.tsx` | Thin wrapper over `SellListingFields` |
| `features/sell/components/SellListingForm.tsx` | Thin wrapper + `useSellPublishState` |
| `features/sell/components/SellPage.tsx` | Removed `HelpPageFooter` |
| `features/sell/hooks/use-sell-wizard.ts` | AI uses title+description; `scheduleCategoryDetection` on text change |
| `lib/navigation/authenticated-routes.ts` | Added `/sell` to footer suppression |
| `tests/authenticated-routes.test.ts` | Assert `/sell` hides public footer |
| `features/sell/components/InventoryQuantityField.tsx` | **Deleted** — replaced by `SellQuantitySelector` |

## Remaining limitations

- Physical device QA (iPhone Safari, Android Chrome) requires manual smoke on a real device; automated E2E covers hydration/console on Chromium/Firefox/WebKit.
- `e2e/sell-android.spec.ts` not re-run in this freeze pass (requires auth fixture).
- Category detection integration tests excluded from `test:ci` by design (`category-detection-step7`, `suggest-category-from-title`).
