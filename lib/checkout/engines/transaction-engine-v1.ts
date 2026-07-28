/**
 * Blood XXIV — TRANSACTION_ENGINE
 * Persists transaction identity against the order (no parallel money ledger).
 * Status PENDING_PAYMENT until Stripe confirms.
 */

import {
  mintTransactionId,
} from "@/lib/checkout/engines/idempotency-engine-v1";
import type { BloodTransactionStatus } from "@/lib/checkout/engines/status-map-v1";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";

export type BuyNowTransaction = {
  id: string;
  orderId: string;
  status: BloodTransactionStatus;
  amount: number;
  currency: string;
  createdAt: string;
};

/** In-process + response SSOT — transaction id is deterministic from order id (idempotent). */
export function TRANSACTION_ENGINE_createPendingPayment(input: {
  orderId: string;
  amount: number;
  currency: string;
}): BuyNowTransaction {
  const tx: BuyNowTransaction = {
    id: mintTransactionId(input.orderId),
    orderId: input.orderId,
    status: "PENDING_PAYMENT",
    amount: input.amount,
    currency: input.currency,
    createdAt: new Date().toISOString(),
  };
  FINANCIAL_LOGGER("TRANSACTION PASS", tx.id);
  return tx;
}

export function TRANSACTION_ENGINE_fromOrderId(orderId: string): string {
  return mintTransactionId(orderId);
}
