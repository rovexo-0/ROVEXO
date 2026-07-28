# ROVEXO STORE SHOWCASE ENGINE v1.0 (LOCK)

| Field | Value |
|---|---|
| **Module** | ROVEXO STORE SHOWCASE ENGINE v1.0 |
| **Status** | IMPLEMENTATION PASS — awaiting Owner approval |
| **SSOT** | `lib/promote/` · Master Engine `lib/master-engine/store-showcase.ts` |
| **UI** | `features/promote/components/*` |
| **Price** | 7 Days = £6.30 only |

## Golden rule

Store Showcase = **fair visibility** for the **entire store**.  
≠ position buying · ≠ top search · ≠ featured slot purchase · ≠ Pay to Win · ≠ permanent boost · ≠ manual positioning · ≠ stackable 7+7+7.

## Master Engine APIs

- `registerStoreShowcase()`
- `resolveStoreShowcaseVisibility(user)`
- `calculateStoreShowcaseDecay(startsAt)`
- `activateProductionPromotionRules()`
- `applyStoreShowcaseProductionRules(user)`

## Smart rules (production only)

| Condition | Result |
|---|---|
| 0–1 listings | HIDDEN |
| 2+ listings | visible |
| Holiday Mode ON | DISABLED |
| Holiday Mode OFF | ENABLED (when visible) |

Local / QA / Demo / Certification → SHOW EVERYTHING.

## Decay (internal only — never shown to users)

Day 1→100% … Day 7→10% · max row hint 20 · Day 8+ normal algorithm.

## Anti-abuse

No multiple active · no double boost · 24h wait after expiration.

## Persistence

Reuses existing `seller_promotions.type = store_featured`. No new schema.

## Forbidden for this module

Commit / push / deploy / production activation without Owner approval.
