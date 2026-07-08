import "server-only";

import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import { openResolutionCase } from "@/lib/resolution-engine/cases";
import { openAndProcessCarrierAnomaly, processResolutionCase } from "@/lib/resolution-engine/processor";

/** Called when a protection case is opened — links automated resolution. */
export async function onProtectionCaseOpened(input: {
  orderId: string;
  protectionCaseId: string;
  caseType: string;
}): Promise<void> {
  const caseType =
    input.caseType === "return" ? "return" : input.caseType === "dispute" ? "dispute" : "dispute";

  const row = await openResolutionCase({
    orderId: input.orderId,
    caseType,
    triggerEvent: "RETURN_STARTED",
    protectionCaseId: input.protectionCaseId,
  });

  if (row) {
    await processResolutionCase(row.id);
  }
}

/** Called when buyer confirms delivery — close resolution tracking. */
export async function onBuyerConfirmed(input: { orderId: string }): Promise<void> {
  const row = await openResolutionCase({
    orderId: input.orderId,
    caseType: "buyer_confirm",
    triggerEvent: "BUYER_CONFIRM",
  });
  if (row) await processResolutionCase(row.id);
}

/** Called from shipping status changes. */
export async function onShippingStatusForResolution(input: {
  orderId: string;
  status: string;
  source?: string;
}): Promise<void> {
  if (input.status === "out_for_delivery") {
    await openResolutionCase({
      orderId: input.orderId,
      caseType: "delivery",
      triggerEvent: "OUT_FOR_DELIVERY",
    });
    return;
  }

  if (input.status === "delivered") {
    const releaseAt = new Date(Date.now() + DELIVERED_RELEASE_HOURS * 3600_000).toISOString();
    await openResolutionCase({
      orderId: input.orderId,
      caseType: "delivery",
      triggerEvent: "DELIVERED",
      estimatedCompletionAt: releaseAt,
    });
    return;
  }

  if (input.status === "lost") {
    await openAndProcessCarrierAnomaly({
      orderId: input.orderId,
      caseType: "lost",
      triggerEvent: "LOST",
      metadata: { source: input.source },
    });
    return;
  }

  if (input.status === "failed") {
    await openAndProcessCarrierAnomaly({
      orderId: input.orderId,
      caseType: "failed_delivery",
      triggerEvent: "FAILED_DELIVERY",
      metadata: { source: input.source },
    });
    return;
  }

  if (input.status === "returned") {
    const row = await openResolutionCase({
      orderId: input.orderId,
      caseType: "return",
      triggerEvent: "RETURN_RECEIVED",
    });
    if (row) await processResolutionCase(row.id);
    return;
  }

  if (input.status === "cancelled") {
    await openAndProcessCarrierAnomaly({
      orderId: input.orderId,
      caseType: "carrier_exception",
      triggerEvent: "CARRIER_EXCEPTION",
      metadata: { status: input.status, source: input.source },
    });
  }
}
