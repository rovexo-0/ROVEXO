export {
  TRANSACTION_MODES,
  DEFAULT_TRANSACTION_MODE,
  isTransactionMode,
  parseTransactionMode,
  type TransactionMode,
} from "@/lib/transaction-mode/types";

export {
  DIRECT_CONTACT_ROOT_SLUGS,
  isDirectContactRootSlug,
  resolveTransactionModeForRootSlug,
} from "@/lib/transaction-mode/defaults";

export {
  getTransactionCapabilities,
  isDirectContactMode,
  isMarketplaceMode,
  type TransactionCapabilities,
} from "@/lib/transaction-mode/capabilities";

export {
  resolveTransactionModeFromCategoryNode,
  resolveTransactionModeFromCategoryPathPayload,
  resolveTransactionModeFromDbValue,
  resolveTransactionModeFromFlatPath,
  stampTransactionModeOnTree,
} from "@/lib/transaction-mode/resolver";

export {
  assertMarketplacePurchaseAllowedForCategoryId,
  assertMarketplacePurchaseAllowedForProductSlug,
  DIRECT_CONTACT_PURCHASE_MESSAGE,
  resolveTransactionModeForProductSlug,
} from "@/lib/transaction-mode/validate";

export {
  resolveTransactionModeForCategoryId,
  resolveTransactionModeMapForCategoryIds,
  updateCategoryTransactionModeCascade,
} from "@/lib/transaction-mode/server";
