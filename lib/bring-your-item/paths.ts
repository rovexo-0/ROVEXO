/** Canonical My Account entry for Bring Your Item (eBay import). */
export const BRING_YOUR_ITEM_PATH = "/account/bring-your-item" as const;

/** Legacy migration routes — redirect to {@link BRING_YOUR_ITEM_PATH}. */
export const LEGACY_BRING_YOUR_ITEM_PATHS = [
  "/import",
  "/bring-your-item",
  "/seller/migration",
] as const;
