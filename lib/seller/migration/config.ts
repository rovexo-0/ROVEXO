/** Sell wizard — primary entry for listing creation. */
export const SELL_WIZARD_PATH = "/sell/new" as const;

import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";

/** Import wizard — bulk import from external marketplaces (canonical). */
export const IMPORT_WIZARD_PATH = BRING_YOUR_ITEM_PATH;

/** Legacy migration center path — preserved for bookmarks and APIs. */
export const LEGACY_MIGRATION_CENTER_PATH = "/seller/migration" as const;

/** Migration Center — bulk import from external marketplaces. */
export const MIGRATION_CENTER_PATH = IMPORT_WIZARD_PATH;

import { isBringYourItemEnabled } from "@/lib/bring-your-item/release";

/** Gated by Bring Your Item release policy — independent from marketplace core v1.0. */
export function isStoreMigrationEnabled(): boolean {
  return isBringYourItemEnabled();
}
