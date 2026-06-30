/** Sell wizard — primary entry for listing creation. */
export const SELL_WIZARD_PATH = "/sell/new" as const;

/** Import wizard — bulk import from external marketplaces (canonical). */
export const IMPORT_WIZARD_PATH = "/import" as const;

/** Legacy migration center path — preserved for bookmarks and APIs. */
export const LEGACY_MIGRATION_CENTER_PATH = "/seller/migration" as const;

/** Migration Center — bulk import from external marketplaces. */
export const MIGRATION_CENTER_PATH = IMPORT_WIZARD_PATH;

/** Store migration is always enabled in ROVEXO v1.0. */
export function isStoreMigrationEnabled(): boolean {
  return true;
}
