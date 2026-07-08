/**
 * ROVEXO Commerce Engine v1.0 — canonical domain types.
 *
 * The Commerce Engine is the single financial authority. No other module may
 * modify wallet / escrow / refund / shipping-payment / seller balance directly.
 */

/** Wallet states defined by the Commerce Engine specification. */
export type WalletState =
  | "pending"
  | "available"
  | "on_hold"
  | "refunded"
  | "released"
  | "reserved_shipping"
  | "platform_revenue";

export const WALLET_STATES: readonly WalletState[] = [
  "pending",
  "available",
  "on_hold",
  "refunded",
  "released",
  "reserved_shipping",
  "platform_revenue",
] as const;

export type CommerceCurrency = "GBP";

export type CommerceAuditInput = {
  event: string;
  orderId?: string | null;
  userId?: string | null;
  actorId?: string | null;
  engine?: string;
  rule?: string | null;
  result?: string | null;
  amount?: number | null;
  currency?: CommerceCurrency;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

export type CommerceAuditRow = {
  id: string;
  event: string;
  order_id: string | null;
  user_id: string | null;
  actor_id: string | null;
  engine: string;
  rule: string | null;
  result: string | null;
  amount: number | null;
  currency: string;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EscrowEventType =
  | "hold_created"
  | "hold_released"
  | "moved_to_available"
  | "moved_to_on_hold"
  | "refunded";

export type EscrowEventInput = {
  orderId: string;
  sellerId: string;
  eventType: EscrowEventType;
  fromState?: WalletState | null;
  toState?: WalletState | null;
  amount?: number;
  currency?: CommerceCurrency;
  reason?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

export type EscrowEventRow = {
  id: string;
  order_id: string;
  seller_id: string;
  event_type: string;
  from_state: string | null;
  to_state: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RefundType = "full" | "partial" | "shipping";
export type RefundStatus = "pending" | "processing" | "completed" | "failed";

export type RefundEventInput = {
  orderId: string;
  buyerId?: string | null;
  sellerId?: string | null;
  refundType: RefundType;
  amount: number;
  currency?: CommerceCurrency;
  status?: RefundStatus;
  stripeRefundId?: string | null;
  reason?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

export type RefundEventRow = {
  id: string;
  order_id: string;
  buyer_id: string | null;
  seller_id: string | null;
  refund_type: RefundType;
  amount: number;
  currency: string;
  status: RefundStatus;
  stripe_refund_id: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ShippingReserveStatus =
  | "reserved"
  | "partially_spent"
  | "spent"
  | "released"
  | "refunded";

export type ShippingReserveRow = {
  id: string;
  order_id: string;
  seller_id: string | null;
  reserved_amount: number;
  spent_amount: number;
  currency: string;
  provider: string | null;
  status: ShippingReserveStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ShippingTransactionDirection = "reserve" | "debit" | "refund" | "release";

export type ShippingTransactionRow = {
  id: string;
  order_id: string;
  reserve_id: string | null;
  direction: ShippingTransactionDirection;
  amount: number;
  currency: string;
  provider: string | null;
  carrier: string | null;
  reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Aggregated financial ledger for a single order (read model). */
export type OrderCommerceLedger = {
  orderId: string;
  escrowEvents: EscrowEventRow[];
  refundEvents: RefundEventRow[];
  shippingReserve: ShippingReserveRow | null;
  shippingTransactions: ShippingTransactionRow[];
  auditLogs: CommerceAuditRow[];
};
