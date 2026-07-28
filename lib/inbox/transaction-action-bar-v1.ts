/**
 * ROVEXO v1.0 — Dynamic Transaction Action Bar (MES v1.1)
 * Single sticky action surface for Conversation Hub.
 * Reuses existing order / offer / shipping / dispute engines — no parallel state machine.
 */

export const TRANSACTION_ACTION_BAR_VERSION = "v1.1" as const;

export type TransactionActionBarTone =
  | "neutral"
  | "purple"
  | "success"
  | "danger"
  | "info";

export type TransactionActionBarPanel = {
  title: string;
  subtitle?: string;
  meta?: string;
  tone: TransactionActionBarTone;
};

/** MES: at most one primary + one secondary (never more than two). */
export const TRANSACTION_ACTION_BAR_MAX_BUTTONS = 2 as const;

export const TRANSACTION_ACTION_BAR_BUTTON = {
  heightPx: 48,
  radiusPx: 14,
} as const;
