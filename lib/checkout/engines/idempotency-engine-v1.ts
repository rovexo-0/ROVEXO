/**
 * Blood XXIV — FINANCIAL_LOGGER + IDEMPOTENCY_ENGINE
 */

import { createHash, randomUUID } from "node:crypto";
import { RVX_LOG, type RvxLogPhase } from "@/lib/checkout/rvx-logger-v1";

export function FINANCIAL_LOGGER(phase: RvxLogPhase, detail?: string): void {
  RVX_LOG(phase, detail);
}

export function IDEMPOTENCY_ENGINE_mint(input: {
  buyerId: string;
  productSlug: string;
  offerId?: string | null;
}): string {
  const material = `${input.buyerId}:${input.productSlug}:${input.offerId ?? "list"}`;
  const digest = createHash("sha256").update(material).digest("hex").slice(0, 24);
  return `bn_${digest}`;
}

export function IDEMPOTENCY_ENGINE_normalize(clientKey: string | null | undefined, fallback: string): string {
  if (clientKey?.startsWith("bn_") && clientKey.length >= 10) {
    return clientKey;
  }
  return fallback;
}

export function mintCheckoutSessionId(orderId: string): string {
  return `cs_bn_${orderId.replace(/-/g, "").slice(0, 24)}`;
}

/** Master Checkout Architecture — public checkout session id (not order-bound). */
export function mintCheckoutSessionPublicId(): string {
  return `cs_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export function mintTransactionId(orderId: string): string {
  return `txn_${orderId}`;
}

export function mintLockToken(): string {
  return randomUUID();
}
