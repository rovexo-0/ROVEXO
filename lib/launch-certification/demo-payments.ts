import { isCertificationMode } from "@/lib/launch-certification/certification-mode";
import {
  DEMO_PAYMENT_STATUSES,
  type DemoPaymentStatus,
} from "@/lib/launch-certification/certification-mode-document2";

/** Virtual payments — no real money during certification. */
export function isVirtualPaymentMode(): boolean {
  if (
    process.env.ROVEXO_VIRTUAL_PAYMENTS === "1" ||
    process.env.ROVEXO_VIRTUAL_PAYMENTS === "true"
  ) {
    return true;
  }
  return isCertificationMode();
}

export function isValidDemoPaymentStatus(status: string): status is DemoPaymentStatus {
  return (DEMO_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export function resolveDemoPaymentLabel(status: DemoPaymentStatus): string {
  const labels: Record<DemoPaymentStatus, string> = {
    success: "Success",
    failed: "Failed",
    pending: "Pending",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };
  return labels[status];
}
