import type { TransactionMode } from "@/lib/transaction-mode/types";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";

/** Root category slugs that use direct contact (classified) commerce. */
export const DIRECT_CONTACT_ROOT_SLUGS = new Set([
  "vehicles",
  "property",
  "jobs",
  "services",
]);

export function isDirectContactRootSlug(slug: string): boolean {
  return DIRECT_CONTACT_ROOT_SLUGS.has(slug);
}

export function resolveTransactionModeForRootSlug(rootSlug: string): TransactionMode {
  return isDirectContactRootSlug(rootSlug) ? "DIRECT_CONTACT" : DEFAULT_TRANSACTION_MODE;
}
