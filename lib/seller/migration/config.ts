/** Sell wizard — primary entry for listing creation. */
export const SELL_WIZARD_PATH = "/sell/new" as const;

/** Migration Center — bulk import from external marketplaces. */
export const MIGRATION_CENTER_PATH = "/seller/migration" as const;

/** Store migration is always enabled in ROVEXO v1.0. */
export function isStoreMigrationEnabled(): boolean {
  return true;
}
