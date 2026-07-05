export const TRANSACTION_MODES = ["MARKETPLACE", "DIRECT_CONTACT"] as const;

export type TransactionMode = (typeof TRANSACTION_MODES)[number];

export const DEFAULT_TRANSACTION_MODE: TransactionMode = "MARKETPLACE";

export function isTransactionMode(value: unknown): value is TransactionMode {
  return typeof value === "string" && (TRANSACTION_MODES as readonly string[]).includes(value);
}

export function parseTransactionMode(value: unknown, fallback: TransactionMode = DEFAULT_TRANSACTION_MODE): TransactionMode {
  return isTransactionMode(value) ? value : fallback;
}
